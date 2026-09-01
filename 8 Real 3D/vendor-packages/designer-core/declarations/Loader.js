var LookCategory;
(function (LookCategory) {
    LookCategory["Materials"] = "Materials";
    LookCategory["Surfaces"] = "Surfaces";
    LookCategory["Mouldings"] = "Mouldings";
    LookCategory["Hardware"] = "Hardware";
    LookCategory["Decor"] = "Decor";
})(LookCategory || (LookCategory = {}));
const IMaterialTypeValues = [
    'accessory',
    'body',
    'melamineBox',
    'melamineBoxBottom',
    'doorInsert',
    'doorInsertEdgebanding',
    'melamineBoxEdgebanding',
    'bottomFinishEnd',
    'bottomValance',
    'bottomValanceEdgebanding',
    'bodyEdgebanding',
    'ceiling',
    'countertop',
    'crownMolding',
    'door',
    'drawerSystem',
    'drawerSlide',
    'drawerSlideUndermount',
    'doorEdgebanding',
    'doorStyle',
    'edgebanding',
    'finishEndEdgebanding',
    'fillerEdgebanding',
    'visibleCarcassEdgebanding',
    'filler',
    'finishEnd',
    'floor',
    'gateFrame',
    'glass',
    'windowGlass',
    'doorGlass',
    'mirror',
    'hingeBlind',
    'hingeCornerCorner',
    'hingeCornerDiagonal',
    'hingeLiftUp',
    'hingeBiFoldLift',
    'hinge',
    'leg',
    'pull',
    'slideOutLaundry',
    'tieRack',
    'stripLight',
    'pole',
    'suspendedPole',
    'tiltOutHamper',
    'scarfRack',
    'beltRack',
    'extrusionPull',
    'rod',
    'hook',
    'toeKick',
    'topValance',
    'topValanceEdgebanding',
    'visiblePanel',
    'visibleCarcass',
    'windowFrame',
    'wall',
    'laminate',
    'hangingRail',
    'camLock',
    'ovvoLock',
    'shoeFence',
    'heelCatch',
    'picture'
];
var Model3DCategory;
(function (Model3DCategory) {
    Model3DCategory["Library"] = "Library";
    Model3DCategory["Hardware"] = "Hardware";
})(Model3DCategory || (Model3DCategory = {}));
var MaterialCategory;
(function (MaterialCategory) {
    MaterialCategory["Materials"] = "Materials";
    MaterialCategory["Surfaces"] = "Surfaces";
    MaterialCategory["Mouldings"] = "Mouldings";
    MaterialCategory["Hardware"] = "Hardware";
    MaterialCategory["Miscellaneous"] = "Miscellaneous";
})(MaterialCategory || (MaterialCategory = {}));

export { IMaterialTypeValues, LookCategory, MaterialCategory, Model3DCategory };
