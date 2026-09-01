import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
declare const getOptionalParentRoom: (core: CoreDesigner, nodeId: UUID | undefined) => import("..").Room | undefined;
export default getOptionalParentRoom;
