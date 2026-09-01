var CeilingType;
(function (CeilingType) {
    CeilingType["Flat"] = "flat";
    CeilingType["Sloped"] = "sloped";
    CeilingType["Cathedral"] = "cathedral";
    CeilingType["Other"] = "other";
})(CeilingType || (CeilingType = {}));
const getDefaultSurfaceSettings = () => ({
    flooring: { enabled: true, materialId: '', patternId: '', colorId: '' },
    molding: { enabled: false, height: 0 },
    decoMolding: { enabled: false, stayInPlace: true, height: 2.5, depth: 0 },
    baseboard: { enabled: false, stayInPlace: true, height: 3, depth: 1, notchingNeeded: true, notchDepth: 0 },
    ceiling: {
        type: CeilingType.Flat,
        baseWallId: null,
        points: []
    }
});

export { CeilingType, getDefaultSurfaceSettings };
