import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { PartType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import getExistsRecursively from '../../../helpers/getExistsRecursively.js';
import getPropertyValue from '../../../helpers/getPropertyValue.js';
import { isMultiClosetStackPartType } from '../../../helpers/multiCloset/contentPartTypes.js';
import SetValueCommand from '../../commands/SetValueCommand.js';
import getOptionalNode from './getOptionalNode.js';

const NO_SIDES = Object.freeze({ left: false, right: false, top: false, bottom: false });
/**
 * The lock cascade: is this node inside a LOCKED section (or itself a locked section)?
 * Walks the parent chain up to the nearest `multiClosetSection` and reads its `isLocked` —
 * children carry no lock flag of their own, so unlocking the section revives the whole
 * subtree at once. Reads via `getPropertyValue`, so consumers re-run reactively when the
 * lock toggles.
 *
 * Termination: an `Item` ends the walk early (sections live directly under one, so nothing above
 * it can be a section) — that is the exit for every node INSIDE a closet. A node outside one has
 * no such ancestor, so it walks to the root, whose `parent` is `''` and resolves to `undefined`.
 * Worth knowing because `getDraggableNode` now asks this on every drag hit-test, for any Part.
 */
const isNodeEffectivelyLocked = (core, nodeId) => {
    let cur = getOptionalNode(core, nodeId);
    while (cur) {
        if (cur.type === NodeType.Item)
            return false; // above the section level — no lock can reach us
        if (cur.type === NodeType.Part && cur.partType.get() === PartType.multiClosetSection) {
            return Boolean(getPropertyValue(cur, 'isLocked'));
        }
        cur = getOptionalNode(core, cur.parent.get());
    }
    return false;
};
// ---------------------------------------------------------------------------
// The width rule — autosized & locked, from scratch, in one place
// ---------------------------------------------------------------------------
const isFlex = (s) => s.isAutoSized && !s.isLocked;
const isRecruitablePinned = (s) => !s.isAutoSized && !s.isLocked && s.canAutoSize;
const isRecruitableLocked = (s) => s.isLocked && s.canAutoSize;
const NO_ABSORBER = Object.freeze({ kind: 'none' });
/**
 * WHO gives the space when `siblings[selfIndex]` resizes toward `direction` — the victim chain:
 * the NEAREST flex sibling on that side absorbs (classic, no flag changes); recruiting is
 * reserved for the LAST flex node (nearest pinned first, nearest locked as the gated last
 * resort); everyone else's flex-less side is simply dead. Candidates are nearest-first, so the
 * grabbed edge follows the pointer. `canResizeWidth` (the yes/no the sides engine uses) is this
 * resolution's truthiness — visibility and gesture can never disagree.
 */
const resolveWidthAbsorberFromSiblings = (siblings, selfIndex, direction, allowUnlock = true) => {
    const self = siblings[selfIndex];
    if (!self || self.isLocked)
        return NO_ABSORBER;
    const candidates = direction === 'before' ? siblings.slice(0, selfIndex).reverse() : siblings.slice(selfIndex + 1);
    // 1. A flex sibling on that side absorbs — the classic case.
    const flex = candidates.find(isFlex);
    if (flex)
        return { kind: 'existing-auto', absorberId: flex.id };
    // 2. Recruiting is only for the LAST flex node in the family. A PINNED self never
    //    qualifies: it may absorb from an existing flex neighbour (step 1) but cannot recruit —
    //    with no flex on its drag side, its edge is simply dead. Only the last remaining flex
    //    node may promote a pinned sibling (or, below, break a lock) to stay resizable.
    const selfIsLastFlex = isFlex(self) && !siblings.some((s, i) => i !== selfIndex && isFlex(s));
    if (!selfIsLastFlex)
        return NO_ABSORBER;
    // 3. Recruit on that side: the pinned tier first, the unlock tier as the gated last resort.
    const pinned = candidates.find(isRecruitablePinned);
    if (pinned)
        return { kind: 'promote', absorberId: pinned.id };
    if (allowUnlock) {
        const locked = candidates.find(isRecruitableLocked);
        if (locked)
            return { kind: 'unlock-promote', absorberId: locked.id };
    }
    return NO_ABSORBER;
};
/** The width-rule dispatch — one `case` per {@link WidthRule} member; the engine's yes/no door. */
const canResizeWidth = (rule, siblings, selfIndex, direction) => {
    switch (rule) {
        case 'flex-chain':
            return resolveWidthAbsorberFromSiblings(siblings, selfIndex, direction).kind !== 'none';
        case 'none':
            return false;
    }
};
/** The height-rule dispatch — one `case` per {@link HeightRule} member. */
const resolveHeightSides = (rule, siblings, selfIndex) => {
    switch (rule) {
        case 'anchored-bottom':
            return { top: true, bottom: false }; // bottom stays on the closet floor
        case 'side-neighbor':
            return { top: selfIndex < siblings.length - 1, bottom: selfIndex > 0 };
        case 'any-sibling': {
            const canTrade = siblings.length > 1;
            return { top: canTrade, bottom: canTrade };
        }
        case 'none':
            return { top: false, bottom: false };
    }
};
/** The depth-rule dispatch — one `case` per {@link DepthRule} member. */
const resolveDepthSides = (rule) => {
    switch (rule) {
        case 'both-edges':
            return { top: true, bottom: true };
        case 'none':
            return { top: false, bottom: false };
    }
};
/**
 * Public form of the lock cascade, for every interaction that is not an edge-resize handle
 * (shelf-board MOVE handle, drag gates, drop targets, bulk operations, typed inputs): `true`
 * when `nodeId` sits inside a locked section (or is one) — the node is EFFECTIVELY locked.
 * Works for ANY node type (Parts, FreeBoxContainers, wrappers — the walk stops at the owning
 * Item, so an Item itself is never locked). Named after the `getEffective*Locked` floorplan
 * lock family. The exact walk the engine applies before any behavior row — so every
 * interaction freezes and revives together with the resize handles.
 */
const getEffectiveContentLocked = (core, nodeId) => isNodeEffectivelyLocked(core, nodeId);
// ---------------------------------------------------------------------------
// Sibling accessors — one per family shape
// ---------------------------------------------------------------------------
// `isLocked` is read unconditionally for EVERY kind — today only sections carry a user-facing
// lock, but reading it here means a future lock on stacks/openings works without touching the
// accessors. `Part` seeds the property (`IPartPropertyNamesValues`), so this is a Map lookup.
const stateOf = (part) => ({
    id: part.id,
    isAutoSized: Boolean(part.isAutoSized?.get()),
    isLocked: Boolean(getPropertyValue(part, 'isLocked')),
    canAutoSize: part.isAutoSized !== undefined
});
/*
 * The three `collect*AutoStates` collectors below are keyed by the CONTAINER, not by a child, so
 * one implementation serves both directions: the oracle asks "who are my siblings" from a child
 * (the private `*Siblings` wrappers), while every structural mutation — add / remove / fill —
 * asks "who is in this family" from the container it is about to change
 * (`promoteMultiClosetAutoCarrier`). Same walk, same filters, one source of truth per level.
 */
/**
 * The SECTION family of a multiCloset, in `item.sections` order. `itemId` may be any node id:
 * anything that is not a multiCloset Item answers `null`.
 */
const collectSectionAutoStates = (core, itemId) => {
    const item = getOptionalNode(core, itemId);
    if (!item || item.type !== NodeType.Item)
        return null;
    return item.sections.get().map((id) => {
        const node = getOptionalNode(core, id);
        return node && node.type === NodeType.Part
            ? stateOf(node)
            : { id, isAutoSized: false, isLocked: false, canAutoSize: false };
    });
};
const sectionSiblings = (core, section) => collectSectionAutoStates(core, section.parent.get());
/**
 * The STACK family of a multiCloset FreeBoxContainer's `bays`, bottom-to-top (dividers skipped).
 * `fbcId` may be any node id; anything that is not a FreeBoxContainer answers `null`.
 */
const collectStackAutoStates = (core, fbcId) => {
    const fbc = getOptionalNode(core, fbcId);
    if (!fbc || fbc.type !== NodeType.FreeBoxContainer)
        return null;
    const states = [];
    for (const id of fbc.bays.get()) {
        const bay = getOptionalNode(core, id);
        if (bay?.type === NodeType.Part && isMultiClosetStackPartType(bay.partType.get())) {
            states.push(stateOf(bay));
        }
    }
    return states;
};
const stackSiblings = (core, stack) => collectStackAutoStates(core, stack.parent.get());
/**
 * The item-OPENING family of a stack, bottom-to-top (dividers and non-existing subtrees skipped —
 * the same filter the stack layout walk applies, so the auto-fit decision always matches what is
 * actually laid out). `stackId` may be any node id; anything that is not a stack Part answers
 * `null`.
 */
const collectOpeningAutoStates = (core, stackId) => {
    const stack = getOptionalNode(core, stackId);
    if (!stack || stack.type !== NodeType.Part || !isMultiClosetStackPartType(stack.partType.get())) {
        return null;
    }
    const states = [];
    for (const id of stack.children.get()) {
        const child = getOptionalNode(core, id);
        if (!child || child.type !== NodeType.Part || !getExistsRecursively(child))
            continue;
        if (child.partType.get() === PartType.freeBoxContainerInteriorPart)
            continue; // divider
        states.push(stateOf(child));
    }
    return states;
};
const openingSiblings = (core, opening) => collectOpeningAutoStates(core, opening.parent.get());
// ---------------------------------------------------------------------------
// The behavior table — the differences between kinds, as data
// ---------------------------------------------------------------------------
const SECTION_BEHAVIOR = {
    width: 'flex-chain',
    height: 'anchored-bottom',
    depth: 'both-edges',
    siblings: sectionSiblings
};
const STACK_BEHAVIOR = {
    width: 'none',
    height: 'side-neighbor',
    depth: 'none',
    siblings: stackSiblings
};
const OPENING_BEHAVIOR = {
    width: 'none',
    height: 'any-sibling',
    depth: 'none',
    siblings: openingSiblings
};
/**
 * THE table: `partType` → behavior row. One entry per resize KIND, which is exactly what
 * `partType` now discriminates: every content stack is a `multiClosetStackPart` and every
 * opening a `multiClosetComponentPart`, with the per-category flavour carried separately on
 * `multiClosetStackType` / `multiClosetComponentType`. Resize behaviour is a property of the
 * kind, not of the category — shelves, hangers and drawers all resize as stacks — so the table
 * deliberately does NOT branch on those discriminators, and a new category needs no entry here.
 * A partType with no entry simply does not resize.
 */
const RESIZE_BEHAVIORS = {
    [PartType.multiClosetSection]: SECTION_BEHAVIOR,
    [PartType.multiClosetStackPart]: STACK_BEHAVIOR,
    [PartType.multiClosetComponentPart]: OPENING_BEHAVIOR
};
const behaviorFor = (partType) => (partType && RESIZE_BEHAVIORS[partType]) || null;
/**
 * The shared preamble of BOTH doors (sides + absorber): resolve the node, its behavior row, the
 * lock cascade, and its sibling family. One implementation, so the two public answers can never
 * diverge on who is resizable at all. `null` ⇔ nothing about this node resizes.
 */
const resolveResizeContext = (core, nodeId) => {
    const node = getOptionalNode(core, nodeId);
    if (!node || node.type !== NodeType.Part)
        return null; // Items (closets) can join the table later
    const part = node;
    const behavior = behaviorFor(part.partType.get());
    if (!behavior)
        return null;
    // The lock cascade beats every row: inside a locked section, nothing resizes.
    if (isNodeEffectivelyLocked(core, part.id))
        return null;
    const siblings = behavior.siblings(core, part);
    if (!siblings)
        return null;
    const selfIndex = siblings.findIndex((s) => s.id === nodeId);
    if (selfIndex < 0)
        return null;
    return { behavior, siblings, selfIndex };
};
/**
 * All sides `nodeId` can be resized from. The single entry every handle-visibility check and
 * every resize gesture should consult — change a rule (or a table row) here, and every
 * consumer follows.
 */
const getResizableSides = (core, nodeId, verticalAxis = 'height') => {
    const context = resolveResizeContext(core, nodeId);
    if (!context)
        return NO_SIDES;
    const { behavior, siblings, selfIndex } = context;
    const left = canResizeWidth(behavior.width, siblings, selfIndex, 'before');
    const right = canResizeWidth(behavior.width, siblings, selfIndex, 'after');
    // The caller's vertical handles map to the height axis in the wall view, depth in the floor plan.
    const { top, bottom } = verticalAxis === 'depth'
        ? resolveDepthSides(behavior.depth)
        : resolveHeightSides(behavior.height, siblings, selfIndex);
    return { left, right, top, bottom };
};
// ---------------------------------------------------------------------------
// The gesture door — WHO absorbs a width drag, and which flags to flip
// ---------------------------------------------------------------------------
/**
 * Resolve the width-drag absorber for `nodeId`'s `side` edge — the gesture-side twin of
 * {@link getResizableSides} (a side is visible exactly when this resolves to something; both
 * doors share {@link resolveResizeContext}). Only `'flex-chain'` width kinds (sections) resolve;
 * everything else, and anything inside a locked section, answers `none`.
 */
const resolveResizeAbsorber = (core, nodeId, side, options) => {
    const context = resolveResizeContext(core, nodeId);
    if (!context || context.behavior.width !== 'flex-chain')
        return NO_ABSORBER;
    return resolveWidthAbsorberFromSiblings(context.siblings, context.selfIndex, side === 'left' ? 'before' : 'after', options?.allowUnlock ?? true);
};
/**
 * The flag commands a resolution requires on the absorber — `promote` → `isAutoSized` 1;
 * `unlock-promote` → `isLocked` false THEN `isAutoSized` 1 (never a width change behind a shown
 * lock: the unlock precedes the flex). `existing-auto` / `none` need nothing. The resize gesture
 * runs these inside its open transaction, so ONE undo restores widths and flags (a broken lock
 * included) together.
 */
const getResizeAbsorberCommands = (core, resolution) => {
    if (resolution.kind !== 'promote' && resolution.kind !== 'unlock-promote')
        return [];
    const node = getOptionalNode(core, resolution.absorberId);
    if (!node || node.type !== NodeType.Part)
        return [];
    const absorber = node;
    const commands = [];
    if (resolution.kind === 'unlock-promote') {
        // `Part` seeds `isLocked` (`IPartPropertyNamesValues`), so the Value is always there.
        const isLockedProp = absorber.properties.get('isLocked');
        if (isLockedProp)
            commands.push(new SetValueCommand(isLockedProp, false));
    }
    if (absorber.isAutoSized)
        commands.push(new SetValueCommand(absorber.isAutoSized, 1));
    return commands;
};

export { collectOpeningAutoStates, collectSectionAutoStates, collectStackAutoStates, getEffectiveContentLocked, getResizableSides, getResizeAbsorberCommands, resolveResizeAbsorber };
