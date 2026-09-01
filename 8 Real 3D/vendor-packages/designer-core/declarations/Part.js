/**
 * Which CATEGORY of content component a `multiClosetComponentPart` is — one shelf
 * compartment, one short / long hanging opening, one drawer. Carried on the Part's own
 * `multiClosetComponentType` signal, separately from `partType`, which only says "this is
 * a content component". Also doubles as the category key of the section planner
 * (`MultiClosetStackNumbers`, `helpers/multiCloset/contentPartTypes.ts`), so the planner
 * and the scene graph name the categories identically.
 */
var MultiClosetComponentType;
(function (MultiClosetComponentType) {
    MultiClosetComponentType["multiClosetShelfPart"] = "multiClosetShelfPart";
    MultiClosetComponentType["multiClosetShortHangerPart"] = "multiClosetShortHangerPart";
    MultiClosetComponentType["multiClosetLongHangerPart"] = "multiClosetLongHangerPart";
    MultiClosetComponentType["multiClosetDrawerPart"] = "multiClosetDrawerPart";
})(MultiClosetComponentType || (MultiClosetComponentType = {}));
/**
 * Which CATEGORY of content stack a `multiClosetStackPart` is. Sibling of
 * {@link MultiClosetComponentType} (one stack type per component type — the pairing lives
 * in `MULTI_CLOSET_CONTENT_PART_TYPES`), carried on the Part's `multiClosetStackType`
 * signal. Doubles as the **effect-registry key**: the per-category stack layout effects
 * are registered under these members, and `Part`'s constructor opts in by this field —
 * so a new member here needs a `registerEffects` entry to lay out at all.
 */
var MultiClosetStackType;
(function (MultiClosetStackType) {
    MultiClosetStackType["multiClosetShelvesStackPart"] = "multiClosetShelvesStackPart";
    MultiClosetStackType["multiClosetShortHangersStackPart"] = "multiClosetShortHangersStackPart";
    MultiClosetStackType["multiClosetLongHangersStackPart"] = "multiClosetLongHangersStackPart";
    MultiClosetStackType["multiClosetDrawersStackPart"] = "multiClosetDrawersStackPart";
})(MultiClosetStackType || (MultiClosetStackType = {}));
var PartType;
(function (PartType) {
    PartType["countertopPart"] = "countertopPart";
    PartType["toeKickPart"] = "toeKickPart";
    PartType["ladderPart"] = "ladderPart";
    PartType["soffitPart"] = "soffitPart";
    PartType["bottomValancePart"] = "bottomValancePart";
    PartType["door"] = "door";
    PartType["drawer"] = "drawer";
    PartType["shelf"] = "shelf";
    PartType["falsePanel"] = "falsePanel";
    PartType["blindPanel"] = "blindPanel";
    PartType["finishEnd"] = "finishEnd";
    PartType["doorPart"] = "doorPart";
    PartType["drawerPart"] = "drawerPart";
    PartType["shelfPart"] = "shelfPart";
    PartType["falsePanelPart"] = "falsePanelPart";
    PartType["blindPanelPart"] = "blindPanelPart";
    PartType["finishEndPart"] = "finishEndPart";
    PartType["freeBoxContainerInteriorPart"] = "freeBoxContainerInteriorPart";
    PartType["freeBoxContainerExteriorPart"] = "freeBoxContainerExteriorPart";
    PartType["fillerPart"] = "fillerPart";
    PartType["multiClosetSection"] = "multiClosetSection";
    PartType["multiClosetSectionContent"] = "multiClosetSectionContent";
    PartType["multiClosetSeparator"] = "multiClosetSeparator";
    // MultiCloset section content interior, one level below the section's FreeBoxContainer.
    // A stack is the per-category container; each holds 1..N components of its category.
    //
    // These two members carry the KIND ONLY. They replaced the former six per-category
    // members (`multiCloset{Shelves,Hangers,Drawers}StackPart` /
    // `multiCloset{Shelf,Hanger,Drawer}Part`): the category moved onto the dedicated
    // `multiClosetStackType` / `multiClosetComponentType` fields below, which also let
    // hanging split into short / long without adding `PartType` members. Consumers that
    // only need "is this a stack / a component?" match on these; consumers that need the
    // category read the node's discriminator (see `helpers/multiCloset/contentPartTypes.ts`,
    // kept out of `declarations/` so this file stays a leaf with no helpers import).
    PartType["multiClosetStackPart"] = "multiClosetStackPart";
    PartType["multiClosetComponentPart"] = "multiClosetComponentPart";
    // Joint parts that occupy the reserved gap where two multiClosets meet
    // face-to-side. Split per side (`left`/`right` = the side of the OWNING
    // Item the joint sits on) and per joint variant. The catalog gates which
    // one exists via the owning Item's `Left/RightJointType` attribute; the
    // floorplan UI renders a joint-type dropdown over whichever one is present.
    PartType["leftBridgeMultiClosetJointPart"] = "leftBridgeMultiClosetJointPart";
    PartType["rightBridgeMultiClosetJointPart"] = "rightBridgeMultiClosetJointPart";
    PartType["leftCornerCornerMultiClosetJointPart"] = "leftCornerCornerMultiClosetJointPart";
    PartType["rightCornerCornerMultiClosetJointPart"] = "rightCornerCornerMultiClosetJointPart";
    PartType["leftCornerDiagonalMultiClosetJointPart"] = "leftCornerDiagonalMultiClosetJointPart";
    PartType["rightCornerDiagonalMultiClosetJointPart"] = "rightCornerDiagonalMultiClosetJointPart";
})(PartType || (PartType = {}));
/** The six joint `PartType`s, mapped to the side of their owning Item. */
const MULTI_CLOSET_JOINT_PART_SIDES = {
    [PartType.leftBridgeMultiClosetJointPart]: 'Left',
    [PartType.rightBridgeMultiClosetJointPart]: 'Right',
    [PartType.leftCornerCornerMultiClosetJointPart]: 'Left',
    [PartType.rightCornerCornerMultiClosetJointPart]: 'Right',
    [PartType.leftCornerDiagonalMultiClosetJointPart]: 'Left',
    [PartType.rightCornerDiagonalMultiClosetJointPart]: 'Right'
};
/** All `PartType`s representing a multiCloset joint (both sides, all variants). */
const MULTI_CLOSET_JOINT_PART_TYPES = Object.keys(MULTI_CLOSET_JOINT_PART_SIDES);
/** Guard: is this `partType` one of the multiCloset joint parts? */
const isMultiClosetJointPartType = (partType) => partType !== undefined && partType in MULTI_CLOSET_JOINT_PART_SIDES;
var SeparatorType;
(function (SeparatorType) {
    SeparatorType["Tall"] = "tall";
    SeparatorType["Base"] = "base";
    SeparatorType["Upper"] = "upper";
    SeparatorType["BaseUpper"] = "baseupper";
})(SeparatorType || (SeparatorType = {}));

export { MULTI_CLOSET_JOINT_PART_SIDES, MULTI_CLOSET_JOINT_PART_TYPES, MultiClosetComponentType, MultiClosetStackType, PartType, SeparatorType, isMultiClosetJointPartType };
