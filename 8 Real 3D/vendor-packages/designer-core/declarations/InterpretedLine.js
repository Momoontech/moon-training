var V3Axes;
(function (V3Axes) {
    V3Axes["x"] = "x";
    V3Axes["y"] = "y";
    V3Axes["z"] = "z";
})(V3Axes || (V3Axes = {}));
// optional: keep an array of values for iteration / reuse (matches previous API)
const IInterpretedLineSizeValues = Object.values(V3Axes);
var V2Axes;
(function (V2Axes) {
    V2Axes["x"] = "x";
    V2Axes["y"] = "y";
})(V2Axes || (V2Axes = {}));
var NeighborSide;
(function (NeighborSide) {
    NeighborSide["Right"] = "Right";
    NeighborSide["Left"] = "Left";
    NeighborSide["LeftJoint"] = "LeftJoint";
    NeighborSide["RightJoint"] = "RightJoint";
})(NeighborSide || (NeighborSide = {}));
var VectorProps;
(function (VectorProps) {
    VectorProps["position"] = "position";
    VectorProps["rotation"] = "rotation";
    VectorProps["size"] = "size";
    VectorProps["initialSize"] = "initialSize";
    VectorProps["modelSize"] = "modelSize";
})(VectorProps || (VectorProps = {}));
function isConstant(c) {
    return c.type === 'constant';
}
function isOperator(c) {
    return c.type === 'operator';
}
function isSize(c) {
    return ([
        'size',
        'productSize',
        'partSize',
        'boxContainerSize',
        'freeBoxContainerSize',
        'countertopSize',
        'panelSize',
        'carcassSize'
    ].indexOf(c.type) !== -1);
}
// export function isNegativeShapeOffset( c: InterpretedLine ): c is InterpretedLineNegativeShapeOffset {
//   return c.type === 'negativeShapeOffset';
// }
// // export function isNeightborContainerHasExteriors( c: InterpretedLine ):
// // c is InterpretedLineNeightborContainerHasExteriors {
// //   return c.type === 'neightborContainerHasExteriors';
// // }
// export function isProductOffset( c: InterpretedLine ): c is InterpretedLineProductOffset {
//   return c.type === 'productOffset';
// }
function isPosition(c) {
    return ['partPosition', 'position', 'relativePosition', 'productPosition'].indexOf(c.type) !== -1;
}
const InterpretedTypeValues = [
    'constant',
    'operator',
    'size',
    'initialSize',
    'modelSize',
    'negativeShapeOffset',
    'attribute',
    'productSize',
    'productAttribute',
    'productProperty',
    'partSize',
    'partPosition',
    'position',
    'relativePosition',
    'productPosition',
    'boxContainerSize',
    'boxContainerAttribute',
    'freeBoxContainerSize',
    // 'boxContainerLayout',
    'countertopSize',
    'countertopAttribute',
    'panelSize',
    'panelAttribute',
    'partAttribute',
    'roomAttribute',
    'carcassSize',
    'carcassAttribute',
    'projectAttribute',
    'projectSetting',
    'materialsSetAttribute',
    'materialsSetAttributeValue',
    'materialsSetMaterialAttributeS' /* string is separated from number because "2"+"2" = "22" */,
    'materialsSetMaterialAttributeN',
    'materialsSetStyleAttributeS',
    'materialsSetStyleAttributeN',
    'materialsSetStyleAttributeS',
    'materialsSetStyleAttributeN'
];

export { IInterpretedLineSizeValues, InterpretedTypeValues, NeighborSide, V2Axes, V3Axes, VectorProps, isConstant, isOperator, isPosition, isSize };
