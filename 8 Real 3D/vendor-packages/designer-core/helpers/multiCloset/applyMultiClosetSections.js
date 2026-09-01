import { generateId } from '../id.js';
import { RemoveNodeCommand } from '../../components/commands/CreateNodeCommand.js';
import CreateNodeFromCatalogCommand from '../../components/commands/CreateNodeFromCatalogCommand.js';
import SetNodeVectorComponentCommand from '../../components/commands/SetNodeVectorComponentCommand.js';
import SetValueCommand from '../../components/commands/SetValueCommand.js';
import getItem from '../../components/Node/helpers/getItem.js';
import getPart from '../../components/Node/helpers/getPart.js';
import { getEffectiveContentLocked } from '../../components/Node/helpers/getResizableSides.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../declarations/helpers.js';
import { VectorProps, V3Axes } from '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getMonitor } from '../monitor.js';
import { calculateMultiClosetSectionPlan } from './calculateMultiClosetSectionPlan.js';
import getMultiClosetAvailableWidth from './getMultiClosetAvailableWidth.js';
import promoteMultiClosetAutoCarrier from './promoteMultiClosetAutoCarrier.js';
import { DEFAULT_SECTION_CALC_CONFIG } from './types.js';

/** Catalog path for a fresh, empty multiCloset section shell. */
const MULTI_CLOSET_SECTION_CATALOG = 'private/Parts/MultiSectionSections/MultiClosetSection';
/**
 * Compute a section layout for the given multiCloset and apply it to the scene.
 *
 * Pure planning is delegated to `calculateMultiClosetSectionPlan`; this function
 * only diffs the plan against the live `sections` array and dispatches existing,
 * undoable commands across four phases: (A) reconcile the section COUNT,
 * (B) swap each section's CONTENT, (C) size the sections — fixed sections are
 * pinned to their floored width while the single balance section is left
 * auto-sized — and (D) guarantee that a balance section exists at all, which a
 * LOCKED section in the planned balance slot would otherwise deny. Separator
 * count, separator typing, and the balance width are then reconciled
 * automatically by `updateMultiClosetItemLayoutEffect`, which absorbs the CTF
 * remainder into the auto-sized balance section.
 *
 * The whole operation is wrapped in a single root transaction (one undo step),
 * and a throw in any phase aborts it — the scene never keeps a half-applied plan.
 * Each phase runs as a nested `runCommandsAsTransaction(..., '', true)`: the
 * nested pack still opens its own `batch`, so the layout effect flushes between
 * phases and the next phase reads fresh ids, while `addToHistory: true` lets the
 * child flatten its commands into the root (a nested transaction never pushes to
 * history on its own — only the root does). The root's `addToHistory` is the
 * single switch that decides whether the operation is undoable.
 *
 * `options` is the self-describing list of content choices
 * (`{ path, shelves, hangers, drawers }`); the counts drive closest-fit matching
 * and `path` is the catalog path instantiated for the chosen slot.
 *
 * Returns the computed `SectionPlan` (with any warnings), or `null` when the
 * target node is not a multiCloset. When the plan has no sections (e.g. no
 * content options supplied) the scene is left untouched.
 */
const applyMultiClosetSections = (core, itemId, desired, options, { config = DEFAULT_SECTION_CALC_CONFIG, addToHistory = true, budget, fillerCategory } = {}) => {
    const item = getItem(core, itemId);
    if (item.itemType.get() !== ItemType.multiCloset) {
        getMonitor().warn(`applyMultiClosetSections: node ${itemId} is not a multiCloset.`);
        return null;
    }
    const availableWidth = getMultiClosetAvailableWidth(core, itemId);
    const plan = calculateMultiClosetSectionPlan({ availableWidth, desired, options, config, budget, fillerCategory });
    // Never strip a closet down to zero sections — the layout effect needs at
    // least one section to operate. Leave the scene untouched and surface why.
    if (plan.sections.length === 0) {
        plan.warnings.push('Plan produced no sections — scene left unchanged.');
        return plan;
    }
    const targetCount = plan.sections.length;
    // The lock cascade: LOCKED sections are the user's untouchable design — every phase skips
    // them (no removal, no content swap, no flag/width write); the plan applies around them.
    // Plan slots stay POSITIONAL and are NOT re-packed: a locked section inside the target
    // range consumes its `plan.sections[i]` entry unapplied, so every unlocked section still
    // receives the entry planned for ITS OWN position (re-packing would slide content planned
    // for one slot's width onto a section at another). The planner itself is lock-blind — its
    // availableWidth counts the locked width as free — so the warnings emitted AFTER the phases
    // (from what actually happened, not from the mere presence of a lock) tell the caller how the
    // plan was only partially realised.
    // Captured once up front: sections created below can never start locked.
    const lockedSectionIds = new Set(item.sections.get().filter((id) => getEffectiveContentLocked(core, id)));
    const transaction = core.beginTransaction('Recalculate Closet Sections', addToHistory);
    try {
        // Phase A — reconcile section COUNT (separators auto-follow via the effect).
        const currentSections = item.sections.get();
        if (targetCount > currentSections.length) {
            const addCommands = [];
            for (let i = currentSections.length; i < targetCount; i += 1) {
                addCommands.push(new CreateNodeFromCatalogCommand(MULTI_CLOSET_SECTION_CATALOG, itemId, generateId(), {}, 'sections'));
            }
            core.runCommandsAsTransaction(addCommands, '', true);
        }
        else if (targetCount < currentSections.length) {
            const removeCommands = [];
            for (let i = targetCount; i < currentSections.length; i += 1) {
                if (lockedSectionIds.has(currentSections[i]))
                    continue; // locked sections survive the recount
                removeCommands.push(new RemoveNodeCommand(currentSections[i]));
            }
            core.runCommandsAsTransaction(removeCommands, '', true);
        }
        // Phase B — assign each section's CONTENT (clean swap, mirrors dragOnPart).
        const sections = item.sections.get();
        const contentCommands = [];
        for (let i = 0; i < targetCount && i < sections.length; i += 1) {
            if (lockedSectionIds.has(sections[i]))
                continue; // locked sections keep their content
            const section = getPart(core, sections[i]);
            for (const contentId of section.content.get()) {
                contentCommands.push(new RemoveNodeCommand(contentId));
            }
            contentCommands.push(new CreateNodeFromCatalogCommand(plan.sections[i].contentCatalogPath, sections[i], generateId(), {}, 'content', 0));
        }
        core.runCommandsAsTransaction(contentCommands, '', true);
        // Phase C — size the sections. Fixed sections are pinned to their floored
        // width (isAutoSized = 0); the single balance section is left auto-sized so
        // updateMultiClosetItemLayoutEffect distributes the remainder into it and
        // handles the CTF cut. Sections whose catalog shell lacks `isAutoSized`
        // cannot be toggled and are skipped.
        const layoutSections = item.sections.get();
        const layoutCommands = [];
        for (let i = 0; i < targetCount && i < layoutSections.length; i += 1) {
            if (lockedSectionIds.has(layoutSections[i]))
                continue; // locked sections keep their flags & width
            const section = getPart(core, layoutSections[i]);
            if (!section.isAutoSized)
                continue;
            const planned = plan.sections[i];
            if (planned.isBalance) {
                if (section.isAutoSized.get() !== 1) {
                    layoutCommands.push(new SetValueCommand(section.isAutoSized, 1));
                }
            }
            else {
                if (section.isAutoSized.get() !== 0) {
                    layoutCommands.push(new SetValueCommand(section.isAutoSized, 0));
                }
                layoutCommands.push(new SetNodeVectorComponentCommand(section.id, VectorProps.size, V3Axes.x, planned.width));
            }
        }
        if (layoutCommands.length > 0) {
            core.runCommandsAsTransaction(layoutCommands, '', true);
        }
        // Phase D — the balance invariant. The planned balance slot is the LAST one, so a LOCKED
        // section there (or one that shifted into the range when Phase A removed unlocked tail
        // sections) leaves the closet with every width pinned and no auto-sized section: the layout
        // effect then never hands out the CTF remainder and the closet ends in a dead gap. Re-arm on
        // the last promotable survivor — the same helper (and the same "who becomes flex" decision)
        // the delete path uses. A no-op when the plan already left a balance section, which is the
        // normal, lock-free case.
        //
        // `allowUnlock: false` — unlike a delete, a fill must never break a lock: every phase above
        // treats locked sections as untouchable, so if the closet is fully locked the honest outcome
        // is the user's own pinned widths (and the warnings below), not a silently opened lock.
        const balanceCommands = promoteMultiClosetAutoCarrier(core, itemId, [], { allowUnlock: false });
        if (balanceCommands.length > 0) {
            core.runCommandsAsTransaction(balanceCommands, '', true);
        }
        // Warn from FACTS, not from the presence of a lock: a locked section inside the planned range
        // swallowed a plan slot, while one beyond it survived the recount and makes the closet wider
        // than the plan assumed (the planner counted its width as free).
        const finalSections = item.sections.get();
        const skippedInRange = finalSections.filter((id, i) => i < targetCount && lockedSectionIds.has(id)).length;
        const survivedBeyond = finalSections.filter((id, i) => i >= targetCount && lockedSectionIds.has(id)).length;
        if (skippedInRange > 0) {
            plan.warnings.push(`${skippedInRange} locked section(s) kept their content and width — their plan slots were skipped, not reassigned.`);
        }
        if (survivedBeyond > 0) {
            plan.warnings.push(`${survivedBeyond} locked section(s) survived beyond the planned ${targetCount} — the closet holds more sections than planned.`);
        }
    }
    catch (error) {
        // All-or-nothing. Without this the `finally` below COMMITTED whatever the phases had already
        // applied — a closet with sections added but content half-swapped, recorded as a normal undo
        // step — and then rethrew. `abort()` unrolls the commands applied so far; per the Transaction
        // contract it does NOT end the transaction, so `finally` still must (and `end()` on an
        // aborted transaction commits nothing).
        transaction.abort();
        getMonitor().warn(`applyMultiClosetSections: aborted for ${itemId}`, error);
        throw error;
    }
    finally {
        transaction.end();
    }
    return plan;
};

export { applyMultiClosetSections, applyMultiClosetSections as default };
