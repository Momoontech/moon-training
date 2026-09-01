import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
import type { Node } from '../../Node';
declare const getNode: (core: CoreDesigner, nodeId: Node | UUID | undefined | null) => Node;
export default getNode;
