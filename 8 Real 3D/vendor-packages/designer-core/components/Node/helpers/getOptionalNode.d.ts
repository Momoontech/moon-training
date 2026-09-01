import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getOptionalNode: (core: CoreDesigner, nodeId: UUID | undefined | null) => import("./createNode").Node | undefined;
export default getOptionalNode;
