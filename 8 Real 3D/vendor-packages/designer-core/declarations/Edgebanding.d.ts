import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { IShapeValue } from './IShapeValue';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum EdgebandingType {
    bodyEdgebanding = "bodyEdgebanding",
    doorEdgebanding = "doorEdgebanding",
    finishEndEdgebanding = "finishEndEdgebanding",
    fillerEdgebanding = "fillerEdgebanding",
    melamineBoxEdgebanding = "melamineBoxEdgebanding",
    visibleCarcassEdgebanding = "visibleCarcassEdgebanding",
    topValanceEdgebanding = "topValanceEdgebanding",
    bottomValanceEdgebanding = "bottomValanceEdgebanding"
}
export type EdgebandingConfig = NodeSharedConfig & {
    parent: UUID;
    type: NodeType.Edgebanding;
    children: UUID[];
    exists?: IValue<number>;
    attributes: IAttributes;
    edgebandingType: IValue<EdgebandingType>;
    shape: IShapeValue;
};
export type EdgebandingCatalogConfig = Catalog<EdgebandingConfig>;
