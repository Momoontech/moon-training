import { NodeType, PartConfig, PartType, SeparatorType, MultiClosetComponentType, MultiClosetStackType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
/**
 * Read-only, `Value`-shaped view kept for one release behind {@link Part.resizableEdges}.
 * Only the `get()` / `peek()` half of `Value` is offered — the flags are DERIVED now, so there
 * is nothing to `set`.
 */
export interface ResizableEdgesView {
    get(): {
        left: boolean;
        right: boolean;
    };
    peek(): {
        left: boolean;
        right: boolean;
    };
}
declare const _PartBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    parent: import("../../../..").UUID;
    type: NodeType.Part;
    children: import("../../../..").UUID[];
    content?: import("../../../..").IValue<import("../../../..").UUID[]>;
    separatorType?: import("../../../..").IValue<SeparatorType>;
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    partType?: PartType;
    multiClosetComponentType?: MultiClosetComponentType;
    multiClosetStackType?: MultiClosetStackType;
    isAutoSized?: import("../../../..").IValue<number>;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<PartConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
} & {
    readonly content: Value<import("../../../..").UUID[]>;
} & {
    readonly properties: Map<"name" | "MVName" | "comment" | "catalogPath" | "HideInCalculation" | "isLocked" | "PanelPresent", Value<string | number | boolean | undefined>>;
}>;
export declare class Part extends _PartBase {
    readonly type: NodeType.Part;
    readonly partType: Value<PartType | undefined>;
    isAutoSized?: Value<number> | undefined;
    separatorType?: Value<SeparatorType> | undefined;
    multiClosetComponentType?: Value<MultiClosetComponentType> | undefined;
    multiClosetStackType?: Value<MultiClosetStackType> | undefined;
    private readonly disposeEffects?;
    constructor(config: PartConfig, core: CoreDesigner);
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
    get resizableEdges(): ResizableEdgesView;
    dispose(): void;
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
    toJSON(): PartConfig;
}
export {};
