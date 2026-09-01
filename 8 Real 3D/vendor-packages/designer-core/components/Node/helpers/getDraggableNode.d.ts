import type { CoreDesigner } from '../../../designer-core';
import type { Node } from '../../Node';
import type { Item } from '../components/Item';
import type { Part } from '../components/Part';
export type DraggableNode = Item | Part;
export declare const getDraggableNode: (core: CoreDesigner, node: Node, event: PointerEvent) => DraggableNode | undefined;
