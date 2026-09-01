import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getRoom: (core: CoreDesigner, roomId?: UUID | null | undefined) => import("..").Room;
export default getRoom;
