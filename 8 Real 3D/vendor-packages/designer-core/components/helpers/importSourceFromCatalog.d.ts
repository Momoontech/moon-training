import { CoreDesigner } from '../../designer-core';
import { NodeCatalogConfig, PartArrayCatalogConfig, PartialNodeCatalogConfig, PartialPartArrayCatalogConfig } from '../../declarations';
import { ValueOptionsType } from '../Value';
export declare function importSourceFromCatalog(core: CoreDesigner, c: NodeCatalogConfig | PartialNodeCatalogConfig | PartArrayCatalogConfig | PartialPartArrayCatalogConfig, options: ValueOptionsType): NodeCatalogConfig | PartArrayCatalogConfig;
