import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
declare const getFloorplan: (core: CoreDesigner, floorplanId?: UUID | null | undefined) => import("..").Floorplan;
export default getFloorplan;
