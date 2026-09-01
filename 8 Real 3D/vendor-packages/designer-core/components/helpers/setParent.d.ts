import { Node } from '../Node';
import { BoxContainer } from '../Node/components/BoxContainer';
import { Room } from '../Node/components/Room';
import { Stage } from '../Node/components/Stage';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties';
export default function setParent(oldParent: Node | undefined, node: Node, newParent: Exclude<Node, Stage | Room | BoxContainer>, childProperty: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number], insertIndex?: number): void;
