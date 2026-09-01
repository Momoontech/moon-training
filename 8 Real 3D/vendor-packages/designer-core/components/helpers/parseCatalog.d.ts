import { CatalogConfig, NodeCatalogConfig, PartArrayCatalogConfig, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
declare const parseCatalog: (core: CoreDesigner, catalogInput: CatalogConfig, parentId: UUID, nodeId: UUID) => NodeCatalogConfig | PartArrayCatalogConfig;
export default parseCatalog;
