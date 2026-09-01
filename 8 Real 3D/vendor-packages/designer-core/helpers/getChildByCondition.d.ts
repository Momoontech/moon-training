import { CoreDesigner } from '..';
import { Node } from '../components/Node';
declare const getChildByCondition: (core: CoreDesigner, node: Node, condition: (node: Node) => boolean) => Node | undefined;
export default getChildByCondition;
