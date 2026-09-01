import { CoreDesigner } from '..';
import { NeighborSide, UUID, V3Axes } from '../declarations';
declare const getMultiClosetNeighborSize: (core: CoreDesigner, nodeId: UUID | undefined, side: NeighborSide, axis: V3Axes) => number;
export default getMultiClosetNeighborSize;
