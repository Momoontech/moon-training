import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getParent: (core: CoreDesigner, nodeId: UUID) => import("./createNode").Node;
export default getParent;
