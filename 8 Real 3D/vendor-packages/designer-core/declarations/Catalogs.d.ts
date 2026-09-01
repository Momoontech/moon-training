import { AdjustableBoxCatalogConfig, AdjustableExtrusionCatalogConfig, BoxContainerCatalogConfig, CarcassCatalogConfig, CountertopCatalogConfig, CrownMoldingCatalogConfig, GlassCatalogConfig, ImageCatalogConfig, IValue, MiteredPanelCatalogConfig, ModelCatalogConfig, MoldingCatalogConfig, MountPlaneCatalogConfig, MountPointCatalogConfig, MultiClosetStackNumbers, NodeCatalogConfig, NodeConfig, PanelCatalogConfig, PartArrayCatalogConfig, PartCatalogConfig, PartialNodeCatalogConfig, PartialPartArrayCatalogConfig, PointLightCatalogConfig, RawPanelCatalogConfig, SpotLightCatalogConfig, ToeKickPanelCatalogConfig, ValanceCatalogConfig, WindowFrameCatalogConfig } from '../';
import { childrenProperties, singleChildProperties } from '../components/Node/helpers/childrenProperties';
import { IAttributes, ICatalogAttributes } from './Attributes';
import { EdgebandingCatalogConfig } from './Edgebanding';
import { GateFrameCatalogConfig } from './GateFrame';
import { InterpretedShape, IPartialInterpretedShape } from './InterpretedShape';
import { InterpretedValue } from './InterpretedValue';
import { ItemCatalogConfig, MultiClosetCatalogConfig } from './Item';
import { IUIAttributesMap, IUICategoriesMap } from './UIAttributes';
type ICatalogRecord<T extends NodeCatalogConfig> = IValue<string> | T | PartialNodeCatalogConfig<T>;
type IPartArrayCatalogRecord = IValue<string> | PartArrayCatalogConfig | PartialPartArrayCatalogConfig;
type IShapeCatalogRecord = IValue<string> | IPartialInterpretedShape | InterpretedShape;
type IAttributesCatalogRecord = IAttributes | ({
    source: IValue<string> | IValue<string>[];
} & Partial<IAttributes>);
export type ICatalog = Partial<{
    'Box Containers': {
        [key: string]: {
            [key: string]: ICatalogRecord<BoxContainerCatalogConfig>;
        };
    };
    Carcasses: {
        [key: string]: {
            [key: string]: ICatalogRecord<CarcassCatalogConfig>;
        };
    };
    Parts: {
        [key: string]: {
            [key: string]: ICatalogRecord<PartCatalogConfig>;
        };
    };
    'Part Arrays': {
        [key: string]: {
            [key: string]: IPartArrayCatalogRecord;
        };
    };
    Panels: {
        [key: string]: {
            [key: string]: ICatalogRecord<PanelCatalogConfig>;
        };
    };
    'Mitered Panels': {
        [key: string]: {
            [key: string]: ICatalogRecord<MiteredPanelCatalogConfig>;
        };
    };
    Models: {
        [key: string]: {
            [key: string]: ICatalogRecord<ModelCatalogConfig>;
        };
    };
    Shapes: {
        [key: string]: {
            [key: string]: IShapeCatalogRecord;
        };
    };
    Countertops: {
        [key: string]: {
            [key: string]: ICatalogRecord<CountertopCatalogConfig>;
        };
    };
    Valances: {
        [key: string]: {
            [key: string]: ICatalogRecord<ValanceCatalogConfig>;
        };
    };
    'Crown Mouldings': {
        [key: string]: {
            [key: string]: ICatalogRecord<CrownMoldingCatalogConfig>;
        };
    };
    Edgebandings: {
        [key: string]: {
            [key: string]: ICatalogRecord<EdgebandingCatalogConfig>;
        };
    };
    'Product Attributes': {
        [key: string]: {
            [key: string]: IAttributesCatalogRecord;
        };
    };
    'Carcass Attributes': {
        [key: string]: {
            [key: string]: IAttributesCatalogRecord;
        };
    };
    'Part Attributes': {
        [key: string]: {
            [key: string]: IAttributesCatalogRecord;
        };
    };
    'Panel Attributes': {
        [key: string]: {
            [key: string]: IAttributesCatalogRecord;
        };
    };
    Formulas: {
        [key: string]: {
            [key: string]: InterpretedValue;
        };
    };
    Boxes: {
        [key: string]: {
            [key: string]: ICatalogRecord<AdjustableBoxCatalogConfig>;
        };
    };
    'Door Frames': {
        [key: string]: {
            [key: string]: ICatalogRecord<GateFrameCatalogConfig>;
        };
    };
    'Window Frames': {
        [key: string]: {
            [key: string]: ICatalogRecord<WindowFrameCatalogConfig>;
        };
    };
    'Single Door Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    'Double Door Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    'Drawer Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    'Shelf Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    'False Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    'Blind Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    'Finish End Types': {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    Extrusions: {
        [key: string]: {
            [key: string]: ICatalogRecord<AdjustableExtrusionCatalogConfig>;
        };
    };
    Glasses: {
        [key: string]: {
            [key: string]: ICatalogRecord<GlassCatalogConfig>;
        };
    };
    Images: {
        [key: string]: {
            [key: string]: ICatalogRecord<ImageCatalogConfig>;
        };
    };
    Mouldings: {
        [key: string]: {
            [key: string]: ICatalogRecord<MoldingCatalogConfig>;
        };
    };
    'Mount Planes': {
        [key: string]: {
            [key: string]: ICatalogRecord<MountPlaneCatalogConfig>;
        };
    };
    'Mount Points': {
        [key: string]: {
            [key: string]: ICatalogRecord<MountPointCatalogConfig>;
        };
    };
    'Point Lights': {
        [key: string]: {
            [key: string]: ICatalogRecord<PointLightCatalogConfig>;
        };
    };
    Products: {
        [key: string]: {
            [key: string]: ICatalogRecord<ItemCatalogConfig>;
        };
    };
    RawPanels: {
        [key: string]: {
            [key: string]: ICatalogRecord<RawPanelCatalogConfig>;
        };
    };
    'Spot Lights': {
        [key: string]: {
            [key: string]: ICatalogRecord<SpotLightCatalogConfig>;
        };
    };
    'ToeKick Panels': {
        [key: string]: {
            [key: string]: ICatalogRecord<ToeKickPanelCatalogConfig>;
        };
    };
    UICategories: IUICategoriesMap;
    UIAttributes: IUIAttributesMap;
}>;
export type ICatalogClassifications = {
    classifications: {
        [id: string]: {
            parent: string | null;
            label: string;
            icon?: string;
        };
    };
    items: {
        [id: string]: string[];
    };
};
export type Catalog<T extends NodeConfig> = Omit<T, 'uuid' | 'parent' | 'attributes' | (typeof childrenProperties)[number] | (typeof singleChildProperties)[number]> & {
    [K in (typeof childrenProperties)[number]]: (string | Catalog<NodeConfig>)[];
} & {
    [K in (typeof singleChildProperties)[number]]: string | Catalog<NodeConfig>;
} & {
    attributes: ICatalogAttributes;
};
export type CatalogConfig = IValue<string> | NodeCatalogConfig | PartialNodeCatalogConfig | PartialPartArrayCatalogConfig | PartArrayCatalogConfig;
export type ISharedSystemCatalogData = {
    name: string;
};
export type IMultiClosetSystemCatalogData = ISharedSystemCatalogData & {
    catalogPath: ICatalogRecord<MultiClosetCatalogConfig>;
    systemData: {
        priorities: MultiClosetStackNumbers;
    };
};
export type ISystemCatalogData = IMultiClosetSystemCatalogData;
export type ISystemsAPI = ISystemCatalogData[];
export {};
