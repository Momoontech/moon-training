import { Catalog, ContainerLayout } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
/**
 * Which CATEGORY of content component a `multiClosetComponentPart` is — one shelf
 * compartment, one short / long hanging opening, one drawer. Carried on the Part's own
 * `multiClosetComponentType` signal, separately from `partType`, which only says "this is
 * a content component". Also doubles as the category key of the section planner
 * (`MultiClosetStackNumbers`, `helpers/multiCloset/contentPartTypes.ts`), so the planner
 * and the scene graph name the categories identically.
 */
export declare enum MultiClosetComponentType {
    multiClosetShelfPart = "multiClosetShelfPart",
    multiClosetShortHangerPart = "multiClosetShortHangerPart",
    multiClosetLongHangerPart = "multiClosetLongHangerPart",
    multiClosetDrawerPart = "multiClosetDrawerPart"
}
/**
 * Which CATEGORY of content stack a `multiClosetStackPart` is. Sibling of
 * {@link MultiClosetComponentType} (one stack type per component type — the pairing lives
 * in `MULTI_CLOSET_CONTENT_PART_TYPES`), carried on the Part's `multiClosetStackType`
 * signal. Doubles as the **effect-registry key**: the per-category stack layout effects
 * are registered under these members, and `Part`'s constructor opts in by this field —
 * so a new member here needs a `registerEffects` entry to lay out at all.
 */
export declare enum MultiClosetStackType {
    multiClosetShelvesStackPart = "multiClosetShelvesStackPart",
    multiClosetShortHangersStackPart = "multiClosetShortHangersStackPart",
    multiClosetLongHangersStackPart = "multiClosetLongHangersStackPart",
    multiClosetDrawersStackPart = "multiClosetDrawersStackPart"
}
export declare enum PartType {
    countertopPart = "countertopPart",
    toeKickPart = "toeKickPart",
    ladderPart = "ladderPart",
    soffitPart = "soffitPart",
    bottomValancePart = "bottomValancePart",
    door = "door",
    drawer = "drawer",
    shelf = "shelf",
    falsePanel = "falsePanel",
    blindPanel = "blindPanel",
    finishEnd = "finishEnd",
    doorPart = "doorPart",
    drawerPart = "drawerPart",
    shelfPart = "shelfPart",
    falsePanelPart = "falsePanelPart",
    blindPanelPart = "blindPanelPart",
    finishEndPart = "finishEndPart",
    freeBoxContainerInteriorPart = "freeBoxContainerInteriorPart",
    freeBoxContainerExteriorPart = "freeBoxContainerExteriorPart",
    fillerPart = "fillerPart",
    multiClosetSection = "multiClosetSection",
    multiClosetSectionContent = "multiClosetSectionContent",
    multiClosetSeparator = "multiClosetSeparator",
    multiClosetStackPart = "multiClosetStackPart",
    multiClosetComponentPart = "multiClosetComponentPart",
    leftBridgeMultiClosetJointPart = "leftBridgeMultiClosetJointPart",
    rightBridgeMultiClosetJointPart = "rightBridgeMultiClosetJointPart",
    leftCornerCornerMultiClosetJointPart = "leftCornerCornerMultiClosetJointPart",
    rightCornerCornerMultiClosetJointPart = "rightCornerCornerMultiClosetJointPart",
    leftCornerDiagonalMultiClosetJointPart = "leftCornerDiagonalMultiClosetJointPart",
    rightCornerDiagonalMultiClosetJointPart = "rightCornerDiagonalMultiClosetJointPart"
}
/** The owning Item side a multiCloset joint part sits on — maps 1:1 to the
 *  `Left/RightJointType` attribute and `Left/Right…NeighborId` property names. */
export type MultiClosetJointSide = 'Left' | 'Right';
/** The six joint `PartType`s, mapped to the side of their owning Item. */
export declare const MULTI_CLOSET_JOINT_PART_SIDES: Partial<Record<PartType, MultiClosetJointSide>>;
/** All `PartType`s representing a multiCloset joint (both sides, all variants). */
export declare const MULTI_CLOSET_JOINT_PART_TYPES: PartType[];
/** Guard: is this `partType` one of the multiCloset joint parts? */
export declare const isMultiClosetJointPartType: (partType: PartType | undefined) => boolean;
export declare enum SeparatorType {
    Tall = "tall",
    Base = "base",
    Upper = "upper",
    BaseUpper = "baseupper"
}
export type PartConfig = NodeSharedConfig & {
    parent: UUID;
    type: NodeType.Part;
    children: UUID[];
    content?: IValue<UUID[]>;
    separatorType?: IValue<SeparatorType>;
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    partType?: PartType;
    /**
     * Category discriminator, declared by the catalog shell ALONGSIDE
     * `partType: multiClosetComponentPart` / `multiClosetStackPart` — never instead of it.
     * Both fields are needed: `partType` gates the kind, these gate the category. Present
     * only on content parts, so a `Part` exposes the matching signal only when its config
     * carried the key (`'multiClosetStackType' in config`) — read them with `?.`.
     */
    multiClosetComponentType?: MultiClosetComponentType;
    multiClosetStackType?: MultiClosetStackType;
    isAutoSized?: IValue<number>;
};
export type PartCatalogConfig = Catalog<PartConfig>;
export type boxContainerCalculationType = 'Interior' | 'Exterior';
export type boxContainerContentType = 'Divider' | 'Splitter';
export type PartArrayCatalogConfig = {
    parts: (PartCatalogConfig | string)[];
    type: [boxContainerCalculationType, boxContainerContentType];
    layout: ContainerLayout;
    contentName?: string;
};
export type PartialPartArrayCatalogConfig = Partial<PartArrayCatalogConfig> & {
    source: IValue<string> | IValue<string>[];
};
