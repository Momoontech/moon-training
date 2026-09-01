// Loaded systems config, held reactively on `core.systemData` (see CoreDesigner).
// Concrete shape of the array loaded from `systemData.json`. Entry ids are opaque strings
// (the app's id format — a UUID or a bigint decimal string), which the granular
// Add / Remove / SetName system commands match against.
var SystemStatus;
(function (SystemStatus) {
    SystemStatus["Draft"] = "DRAFT";
    SystemStatus["Plot"] = "PLOT";
    SystemStatus["Design"] = "DESIGN";
    SystemStatus["Present"] = "PRESENT";
    SystemStatus["FinishingTouches"] = "FINISHING_TOUCHES";
    SystemStatus["Estimated"] = "ESTIMATED";
    SystemStatus["SavedForLater"] = "SAVED_FOR_LATER";
    SystemStatus["Signed"] = "SIGNED";
})(SystemStatus || (SystemStatus = {}));

export { SystemStatus };
