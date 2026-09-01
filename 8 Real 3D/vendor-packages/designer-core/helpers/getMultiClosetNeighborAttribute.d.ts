import { CoreDesigner } from '..';
import { NeighborSide, UUID } from '../declarations';
declare const getMultiClosetNeighborAttribute: (core: CoreDesigner, nodeId: UUID | undefined, side: NeighborSide, attributeName: string) => import("../components/commands/SetProjectAttributeValueCommand").AttributeValue;
export default getMultiClosetNeighborAttribute;
