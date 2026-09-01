/**
 * Behavior flavor of a FreeBoxContainer. Absent ⇒ the historical, passive
 * container (no layout effect). `multiCloset` ⇒ the container stacks its direct
 * children (stacks + fix shelves) bottom-to-top via
 * `updateMultiClosetFreeBoxContainerLayoutEffect`.
 */
var FreeBoxContainerType;
(function (FreeBoxContainerType) {
    FreeBoxContainerType["multiCloset"] = "multiClosetFreeBoxContainer";
})(FreeBoxContainerType || (FreeBoxContainerType = {}));

export { FreeBoxContainerType };
