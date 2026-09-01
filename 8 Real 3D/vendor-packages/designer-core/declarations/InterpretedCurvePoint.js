const IObjectCatalogTypeValues = [
    'InterpretedLine',
    'InterpretedValue',
    'InterpretedValueOrNumber',
    'InterpretedVector2',
    'InterpretedVector3',
    'ArcTo',
    'BezierTo',
    'LineTo',
    'number',
    'InterpretedCurvePoint',
    'InterpretedCurve',
    'InterpretedShape',
    'Countertop',
    'Panel',
    'string',
    'NumberStringOrFormula',
    'boolean'
];
const InterpretedCurvePointTypeValues = ['lineTo', 'arcTo', 'bezierCurveTo', 'moveTo'];
function isLine(c) {
    return ['lineTo', 'moveTo', undefined].indexOf(c.type) !== -1;
}
function isArc(c) {
    return c.type === 'arcTo';
}
function isBezier(c) {
    return c.type === 'bezierCurveTo';
}

export { IObjectCatalogTypeValues, InterpretedCurvePointTypeValues, isArc, isBezier, isLine };
