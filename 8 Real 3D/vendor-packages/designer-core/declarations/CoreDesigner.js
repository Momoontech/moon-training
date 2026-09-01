var GeneralViewMode;
(function (GeneralViewMode) {
    GeneralViewMode["floorPlan"] = "floorPlan";
    GeneralViewMode["editor3D"] = "3d";
    GeneralViewMode["editor2D"] = "2dEditor";
    GeneralViewMode["walkthrough"] = "walkthrough";
    GeneralViewMode["calculation"] = "calculation";
    GeneralViewMode["print"] = "print";
    GeneralViewMode["paperSpace"] = "paperSpace";
    // render = 'render',
    GeneralViewMode["catalogEditor"] = "catalogEditor";
})(GeneralViewMode || (GeneralViewMode = {}));
var FloorPlanDrawMode;
(function (FloorPlanDrawMode) {
    FloorPlanDrawMode["none"] = "none";
    // template = 'template',
    FloorPlanDrawMode["roomPoint"] = "roomPoint";
})(FloorPlanDrawMode || (FloorPlanDrawMode = {}));
var CoreMode;
(function (CoreMode) {
    CoreMode["mobile"] = "mobile";
    CoreMode["web"] = "web";
})(CoreMode || (CoreMode = {}));
var MobileStep;
(function (MobileStep) {
    MobileStep[MobileStep["None"] = 0] = "None";
    MobileStep[MobileStep["Floorplan"] = 1] = "Floorplan";
    MobileStep[MobileStep["Architecture"] = 2] = "Architecture";
    MobileStep[MobileStep["Systems"] = 3] = "Systems";
    MobileStep[MobileStep["Catalog"] = 4] = "Catalog";
    MobileStep[MobileStep["Present"] = 5] = "Present";
    MobileStep[MobileStep["Estimate"] = 6] = "Estimate";
    MobileStep[MobileStep["Customize"] = 7] = "Customize";
    MobileStep[MobileStep["Accessorize"] = 8] = "Accessorize";
})(MobileStep || (MobileStep = {}));

export { CoreMode, FloorPlanDrawMode, GeneralViewMode, MobileStep };
