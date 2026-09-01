import { CoreDesigner } from '..';
import { NeighborSide, UUID } from '../declarations';
declare const getMultiClosetNeighborProperty: (core: CoreDesigner, nodeId: UUID | undefined, side: NeighborSide, propertyName: string) => string | number | boolean;
export default getMultiClosetNeighborProperty;
