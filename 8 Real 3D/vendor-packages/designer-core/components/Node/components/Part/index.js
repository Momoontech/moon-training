import { IPartPropertyNamesValues } from '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
import '../../../../declarations/Loader.js';
import '../../../../declarations/Model.js';
import '../../../../declarations/Molding.js';
import { NodeType } from '../../../../declarations/Node.js';
import '../../../../declarations/Panel.js';
import '../../../../declarations/PaperSpace.js';
import { SeparatorType } from '../../../../declarations/Part.js';
import '../../../../declarations/ProjectSettings.js';
import '../../../../declarations/Segment.js';
import '../../../../declarations/SurfaceSettings.js';
import '../../../../declarations/systems.js';
import '../../../../declarations/UIAttributes.js';
import '../../../../declarations/Valance.js';
import '../../../../declarations/views.js';
import { NodeBuilder } from '../../builder/NodeBuilder.js';
import { getEffects } from '../../helpers/effectRegistry.js';
import { getResizableSides } from '../../helpers/getResizableSides.js';
import { registerNodeEffects } from '../../helpers/registerNodeEffects.js';
import { canSetMultiClosetSectionWidth } from '../../../../helpers/multiCloset/setMultiClosetSectionWidth.js';

const _PartBase = NodeBuilder.create()
    .withPosition3D()
    .withRotation()
    .withSize()
    .withChildren('children')
    .withChildren('content')
    .withAttributes()
    .withProperties(IPartPropertyNamesValues)
    .toClass();
class Part extends _PartBase {
    type = NodeType.Part;
    partType;
    isAutoSized;
    separatorType;
    multiClosetComponentType;
    multiClosetStackType;
    // Disposer for partType-keyed effects (e.g. the multiCloset stack layouts). Only
    // set for the few part types that register effects; ordinary parts pay nothing.
    disposeEffects;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.partType = core.createValue(config.partType, options);
        this.isAutoSized = 'isAutoSized' in config ? core.createValue(config.isAutoSized ?? 0, options) : undefined;
        this.separatorType =
            'separatorType' in config ? core.createValue(config.separatorType ?? SeparatorType.Tall, options) : undefined;
        // Gated on the VALUE, not on `'x' in config` like the two fields above: a category has no
        // sensible default, so `{ multiClosetStackType: undefined }` must yield no signal rather than
        // silently mint a shelves stack. Belt-and-braces with `toJSON`, which already omits the key
        // when the signal is absent — this way a hand-written config or a future serializer cannot
        // reintroduce the mislabelling.
        this.multiClosetComponentType = config.multiClosetComponentType
            ? core.createValue(config.multiClosetComponentType, options)
            : undefined;
        this.multiClosetStackType = config.multiClosetStackType
            ? core.createValue(config.multiClosetStackType, options)
            : undefined;
        // Opt into any effects registered under this part's discriminators (mirrors how `Item`
        // opts in by itemType). Most parts register none, so this is a no-op.
        //
        // `multiClosetStackType` is consulted as well as `partType` because the content-stack
        // layout effects are registered PER CATEGORY (`registerEffects(MultiClosetStackType.…)` in
        // `helpers/effects.ts`) while every stack now shares the single
        // `PartType.multiClosetStackPart`. Keying only on `partType` would silently leave every
        // stack without its layout effect.
        const partTypeEffects = [
            ...(config.partType ? getEffects(config.partType) : []),
            ...(config.multiClosetStackType ? getEffects(config.multiClosetStackType) : [])
        ];
        if (partTypeEffects.length > 0) {
            this.effects.push(...partTypeEffects);
            this.disposeEffects = registerNodeEffects(this);
        }
        this.core.addNode(this);
    }
    /**
     * @deprecated Read `getResizableSides(core, part.id, axis)` instead — the resize-capability
     * oracle answers all four sides per axis, and no longer stores a signal on the node.
     *
     * Compatibility shim, scheduled for removal together with the `moon-sales-client` pin bump
     * that ships the migrated `readSectionCaps`. Until then this stays: the app aliases
     * `@moon/designer-core` to these sources while `moon-sales-client` is consumed at a PINNED
     * commit, so a consumer built against the old field would otherwise crash on
     * `part.resizableEdges.get()` with no way to upgrade both repos in one step.
     *
     * Not a stored `Value`: `get()` derives the pair from the two new predicates, so there is no
     * second rule to drift and the read stays reactive (both are signal-tracked, so a consuming
     * computed still re-runs when a sibling's flags or the section lock change). The `'height'`
     * axis is used because the removed signal only ever carried the width pair.
     *
     * `canSetMultiClosetSectionWidth` is AND-ed in on purpose: the removed signal meant "this
     * width can be changed BY HAND", which was `false` for the balance section, whereas the
     * oracle reports the balance section's edges as grabbable (the drag-only "pin self, promote a
     * neighbour" move). Without the gate, an old consumer would enable a width input that the
     * write path then silently refuses.
     */
    get resizableEdges() {
        const read = () => {
            const editable = canSetMultiClosetSectionWidth(this.core, this.parent.get(), this.id);
            const { left, right } = getResizableSides(this.core, this.id, 'height');
            return { left: editable && left, right: editable && right };
        };
        return { get: read, peek: read };
    }
    dispose() {
        this.disposeEffects?.();
        super.dispose();
    }
    /**
     * The two multiCloset discriminators are emitted CONDITIONALLY, not as
     * `x ? x.get() : undefined` like the two fields above them.
     *
     * They must round-trip at all: the constructor gates both the signal and the layout-effect
     * opt-in on them, so dropping them from the save (as this method did before) leaves every
     * reloaded stack without its category and without its layout effect — the closet stops
     * reflowing after the first save/load, permanently.
     *
     * But emitting an explicit `undefined` is just as wrong: the key would then be PRESENT on
     * every ordinary part, and the constructor's `'multiClosetStackType' in config` test would
     * hand each one the default `multiClosetShelvesStackPart`. A toe-kick or separator would
     * start answering `getCategoryForStackPartType` as a shelves stack, and
     * `isMultiClosetShelfBoard` would call its children shelf boards. Absence must stay absence.
     */
    toJSON() {
        return {
            ...super.toJSON(),
            partType: this.partType.get(),
            isAutoSized: this.isAutoSized ? this.isAutoSized.get() : undefined,
            separatorType: this.separatorType ? this.separatorType.get() : undefined,
            ...(this.multiClosetComponentType
                ? { multiClosetComponentType: this.multiClosetComponentType.get() }
                : undefined),
            ...(this.multiClosetStackType ? { multiClosetStackType: this.multiClosetStackType.get() } : undefined)
        };
    }
}

export { Part };
