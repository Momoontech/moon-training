import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
declare const getWall2D: (core: CoreDesigner, wall2DId?: UUID | undefined) => import("..").Wall2D;
export default getWall2D;
