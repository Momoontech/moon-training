import { CoreDesigner } from '..';
import { NeighborSide, UUID } from '../declarations';
declare const getClosetNeighborAttribute: (core: CoreDesigner, nodeId: UUID | undefined, side: NeighborSide, attributeName: string) => import("../components/commands/SetProjectAttributeValueCommand").AttributeValue;
export default getClosetNeighborAttribute;
