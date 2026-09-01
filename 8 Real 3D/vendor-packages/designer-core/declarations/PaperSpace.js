var FloorCountertops;
(function (FloorCountertops) {
    FloorCountertops[FloorCountertops["present"] = 1] = "present";
    FloorCountertops[FloorCountertops["hided"] = 2] = "hided";
    FloorCountertops[FloorCountertops["only"] = 3] = "only";
})(FloorCountertops || (FloorCountertops = {}));
// Paper Space Types
var EShapeType;
(function (EShapeType) {
    EShapeType["Trace"] = "Trace";
    EShapeType["Text"] = "Text";
    EShapeType["Label"] = "Label";
    EShapeType["Leader"] = "Leader";
    EShapeType["Block"] = "Block";
    EShapeType["Line"] = "Line";
    EShapeType["Dimension"] = "Dimension";
    EShapeType["Number"] = "Number";
})(EShapeType || (EShapeType = {}));

export { EShapeType, FloorCountertops };
