import { UUID } from './core';
import { InterpretedVector2 } from './InterpretedVector2';
import { IValue } from './IValue';
export declare const IObjectCatalogTypeValues: readonly ["InterpretedLine", "InterpretedValue", "InterpretedValueOrNumber", "InterpretedVector2", "InterpretedVector3", "ArcTo", "BezierTo", "LineTo", "number", "InterpretedCurvePoint", "InterpretedCurve", "InterpretedShape", "Countertop", "Panel", "string", "NumberStringOrFormula", "boolean"];
export type IObjectCatalogType = (typeof IObjectCatalogTypeValues)[number];
export type IObjectCatalogConfig = {
    uuid: UUID;
    configType: IObjectCatalogType;
    parent: UUID;
    optional: boolean;
};
export type IInterpretedCurvePointLineConfig = IObjectCatalogConfig & {
    type: 'lineTo' | 'moveTo';
    x: UUID;
    y: UUID;
};
export type IInterpretedCurvePointArcConfig = IObjectCatalogConfig & {
    type: 'arcTo';
    center: UUID;
    radius: UUID;
    radiusY?: UUID;
    startAngle: UUID;
    endAngle: UUID;
    clockwise: UUID;
};
export type IInterpretedCurvePointBezierConfig = IObjectCatalogConfig & {
    type: 'bezierCurveTo';
    x: UUID;
    y: UUID;
    controlPoint1: UUID;
};
export type IInterpretedCurvePointConfig = IInterpretedCurvePointLineConfig | IInterpretedCurvePointArcConfig | IInterpretedCurvePointBezierConfig;
export declare const InterpretedCurvePointTypeValues: readonly ["lineTo", "arcTo", "bezierCurveTo", "moveTo"];
export type curvePointType = (typeof InterpretedCurvePointTypeValues)[number];
export declare function isLine(c: IInterpretedCurvePointConfig): c is IInterpretedCurvePointLineConfig;
export declare function isArc(c: IInterpretedCurvePointConfig): c is IInterpretedCurvePointArcConfig;
export declare function isBezier(c: IInterpretedCurvePointConfig): c is IInterpretedCurvePointBezierConfig;
export type InterpretedCurvePoint = InterpretedCurvePointLine | InterpretedCurvePointArc | InterpretedCurvePointBezier;
export type InterpretedCurvePointLine = {
    exists?: IValue<number>;
    type?: 'lineTo' | 'moveTo';
    x: IValue<number>;
    y: IValue<number>;
};
export type InterpretedCurvePointArc = {
    exists?: IValue<number>;
    type: 'arcTo';
    center: InterpretedVector2;
    radius: IValue<number>;
    radiusY?: IValue<number>;
    startAngle: IValue<number>;
    endAngle: IValue<number>;
    clockwise: IValue<number>;
    rotation?: IValue<number>;
};
export type InterpretedCurvePointBezier = {
    exists?: IValue<number>;
    type: 'bezierCurveTo';
    x: IValue<number>;
    y: IValue<number>;
    controlPoint1: InterpretedVector2;
};
