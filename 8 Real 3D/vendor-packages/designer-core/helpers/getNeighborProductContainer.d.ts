import { CoreDesigner } from '..';
import { BoxContainer } from '../components/Node/components/BoxContainer';
import { NeighborSide } from '../declarations';
declare const getNeighborProductContainer: (core: CoreDesigner, container: BoxContainer, side: NeighborSide) => BoxContainer;
export default getNeighborProductContainer;
