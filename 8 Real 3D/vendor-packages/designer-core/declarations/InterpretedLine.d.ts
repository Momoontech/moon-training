import { IAttributeNames, IBoxContainerAttributeNames, IBoxContainerPropertyNames, ICarcassAttributeNames, ICountertopAttributeNames, IMountPointAttributeNames, IPanelAttributeNames, IPartAttributeNames, IPartPropertyNames, IProductAttributeNames, IProductPropertyNames, IPropertyNames, IRoomAttributeNames } from './Attributes';
import { material, materialType } from './Loader';
import { boxContainerCalculationType } from './Part';
import { attributesType, IProjectSettingsShared, materialsSetsTypes, projectSettingsMaterials } from './ProjectSettings';
type ProjectSettingLeaf = string | number | boolean | null | undefined;
type LeafPath<T, Depth extends readonly unknown[] = []> = Depth['length'] extends 6 ? readonly [] : [T] extends [ProjectSettingLeaf] ? readonly [] : T extends readonly unknown[] ? readonly [] : T extends object ? {
    [K in keyof T & string]-?: readonly [K, ...LeafPath<NonNullable<T[K]>, [...Depth, unknown]>];
}[keyof T & string] : readonly [];
export type ProjectSettingPath = LeafPath<IProjectSettingsShared>;
export declare enum V3Axes {
    x = "x",
    y = "y",
    z = "z"
}
export declare const IInterpretedLineSizeValues: V3Axes[];
export declare enum V2Axes {
    x = "x",
    y = "y"
}
export type VAxes = V3Axes | V2Axes;
export declare enum NeighborSide {
    Right = "Right",
    Left = "Left",
    LeftJoint = "LeftJoint",
    RightJoint = "RightJoint"
}
export declare enum VectorProps {
    position = "position",
    rotation = "rotation",
    size = "size",
    initialSize = "initialSize",
    modelSize = "modelSize"
}
export type InterpretedLineConstant = {
    type: 'constant';
    value: string;
};
export type InterpretedLineOperator = {
    type: 'operator';
    value: string;
};
export type InterpretedLineSize = {
    type: 'size' | 'productSize' | 'partSize' | 'panelSize' | 'carcassSize' | 'boxContainerSize' | 'freeBoxContainerSize' | 'coreFreeBoxContainerSize' | 'countertopSize' | 'modelSize' | 'initialSize';
    value: V3Axes;
};
export type InterpretedLineNegativeShapeOffset = {
    type: 'negativeShapeOffset';
    value: string;
};
export type InterpretedLineNeightborContainerHasExteriors = {
    type: 'neightborContainerHasFreeExteriors';
    value: NeighborSide;
};
export type InterpretedLineProductOffset = {
    type: 'productOffset';
    value: string;
};
export type InterpretedLineBoxContainerLayout = {
    type: 'boxContainerLayout';
    value: boxContainerCalculationType;
};
export type InterpretedLinePosition = {
    type: 'productPosition' | 'partPosition' | 'position';
    value: V3Axes;
};
type InterpretedLineRelativePositionValueType = 'coreFreeBoxContainer';
export type InterpretedLineRelativePosition = {
    type: 'relativePosition';
    value: [InterpretedLineRelativePositionValueType, V3Axes];
};
export type InterpretedLineAttribute = {
    type: 'attribute';
    value: IAttributeNames;
};
export type InterpretedLinePartAttribute = {
    type: 'partAttribute';
    value: IPartAttributeNames;
};
export type InterpretedLineRoomAttribute = {
    type: 'roomAttribute';
    value: IRoomAttributeNames;
};
export type InterpretedLineBoxContainerAttribute = {
    type: 'boxContainerAttribute';
    value: IBoxContainerAttributeNames;
};
export type InterpretedLineProductAttribute = {
    type: 'productAttribute';
    value: IProductAttributeNames;
};
export type InterpretedLineProductProperty = {
    type: 'productProperty';
    value: IProductPropertyNames;
};
export type InterpretedLinePartProperty = {
    type: 'partProperty';
    value: IPartPropertyNames;
};
export type InterpretedLineProperty = {
    type: 'property';
    value: IPropertyNames;
};
export type InterpretedLineBoxContainerProperty = {
    type: 'boxContainerProperty';
    value: IBoxContainerPropertyNames;
};
export type InterpretedLineCountertopAttribute = {
    type: 'countertopAttribute';
    value: ICountertopAttributeNames;
};
export type InterpretedLineCarcassAttribute = {
    type: 'carcassAttribute';
    value: ICarcassAttributeNames;
};
export type InterpretedLinePanelAttribute = {
    type: 'panelAttribute';
    value: IPanelAttributeNames;
};
export type InterpretedLineClosetNeightborAttribute = {
    type: 'closetNeighborAttribute';
    value: [NeighborSide, IPanelAttributeNames];
};
export type InterpretedLineMultiClosetNeighborProperty = {
    type: 'multiClosetNeighborProperty';
    value: [NeighborSide, IProductPropertyNames];
};
export type InterpretedLineMultiClosetNeighborAttribute = {
    type: 'multiClosetNeighborAttribute';
    value: [NeighborSide, IProductAttributeNames];
};
export type InterpretedLineMultiClosetNeighborSize = {
    type: 'multiClosetNeighborSize';
    value: [NeighborSide, V3Axes];
};
export type InterpretedLineMountPointAttribute = {
    type: 'mountPointAttribute';
    value: IMountPointAttributeNames;
};
export type InterpretedLineProjectAttribute = {
    type: 'projectAttribute';
    value: attributesType;
};
export type InterpretedLineProjectSetting = {
    type: 'projectSetting';
    value: ProjectSettingPath;
};
export type InterpretedLineMaterialsSetAttribute = {
    type: 'materialsSetAttribute';
    value: materialsSetsTypes;
};
export type InterpretedLineMaterialNumberAttribute = {
    type: 'materialAttributeN';
    value: ['' | 'panel' | 'glass', keyof material];
};
export type InterpretedLineMaterialStringAttribute = {
    type: 'materialAttributeS';
    value: ['' | 'panel' | 'glass', keyof material];
};
export type InterpretedLineMaterialsSetAttributeValue = {
    type: 'materialsSetAttributeValue';
    value: materialsSetsTypes;
};
export type InterpretedLineMaterialsSetMaterialStringAttribute = {
    type: 'materialsSetMaterialAttributeS';
    value: [
        (Exclude<projectSettingsMaterials, 'defaultMaterialsSet' | 'defaultClosetMaterialsSet'> | 'panelType' | 'edgebandingType'),
        keyof material
    ];
};
export type InterpretedLineMaterialsSetMaterialNumberAttribute = {
    type: 'materialsSetMaterialAttributeN';
    value: [
        (Exclude<projectSettingsMaterials, 'defaultMaterialsSet' | 'defaultClosetMaterialsSet'> | Exclude<materialsSetsTypes, 'doorsAndDrawersConfiguration' | 'name' | 'finishEndsConfiguration' | 'doorGrain' | 'drawerGrain' | 'finishEndGrain'> | 'panelType' | 'edgebandingType'),
        keyof material
    ];
};
export type InterpretedLineMaterialsSetStyleStringAttribute = {
    type: 'materialsSetStyleAttributeS';
    value: [materialType, keyof material];
};
export type InterpretedLineMaterialsSetStyleNumberAttribute = {
    type: 'materialsSetStyleAttributeN';
    value: [materialType, keyof material];
};
export declare function isConstant(c: InterpretedLine): c is InterpretedLineConstant;
export declare function isOperator(c: InterpretedLine): c is InterpretedLineOperator;
export declare function isSize(c: InterpretedLine): c is InterpretedLineSize;
export declare function isPosition(c: InterpretedLine): c is InterpretedLinePosition;
export type InterpretedLine = InterpretedLineConstant | InterpretedLineOperator | InterpretedLineSize | InterpretedLinePosition | InterpretedLineNegativeShapeOffset | InterpretedLineNeightborContainerHasExteriors | InterpretedLineProductOffset | InterpretedLineRelativePosition | InterpretedLineAttribute | InterpretedLineProjectAttribute | InterpretedLineProjectSetting | InterpretedLineProductAttribute | InterpretedLineProductProperty | InterpretedLinePartProperty | InterpretedLineProperty | InterpretedLineBoxContainerProperty | InterpretedLineCarcassAttribute | InterpretedLinePartAttribute | InterpretedLineRoomAttribute | InterpretedLineBoxContainerAttribute | InterpretedLinePanelAttribute | InterpretedLineClosetNeightborAttribute | InterpretedLineMultiClosetNeighborProperty | InterpretedLineMultiClosetNeighborAttribute | InterpretedLineMultiClosetNeighborSize | InterpretedLineMountPointAttribute | InterpretedLineCountertopAttribute | InterpretedLineMaterialsSetAttribute | InterpretedLineMaterialNumberAttribute | InterpretedLineMaterialStringAttribute | InterpretedLineMaterialsSetAttributeValue | InterpretedLineMaterialsSetMaterialStringAttribute | InterpretedLineMaterialsSetMaterialNumberAttribute | InterpretedLineMaterialsSetStyleStringAttribute | InterpretedLineMaterialsSetStyleNumberAttribute | InterpretedLineBoxContainerLayout;
export declare const InterpretedTypeValues: readonly ["constant", "operator", "size", "initialSize", "modelSize", "negativeShapeOffset", "attribute", "productSize", "productAttribute", "productProperty", "partSize", "partPosition", "position", "relativePosition", "productPosition", "boxContainerSize", "boxContainerAttribute", "freeBoxContainerSize", "countertopSize", "countertopAttribute", "panelSize", "panelAttribute", "partAttribute", "roomAttribute", "carcassSize", "carcassAttribute", "projectAttribute", "projectSetting", "materialsSetAttribute", "materialsSetAttributeValue", "materialsSetMaterialAttributeS", "materialsSetMaterialAttributeN", "materialsSetStyleAttributeS", "materialsSetStyleAttributeN", "materialsSetStyleAttributeS", "materialsSetStyleAttributeN"];
export type InterpretedLineType = (typeof InterpretedTypeValues)[number];
export {};
