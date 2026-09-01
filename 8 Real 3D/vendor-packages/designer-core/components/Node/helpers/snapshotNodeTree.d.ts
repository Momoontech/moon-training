import { IObjects, UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
/**
 * Recursively snapshot a node and all its descendants without modifying the scene.
 * Used to capture stable UUIDs so redo paths can reconstruct the exact same subtree
 * instead of generating fresh v4() ids each time (which would break any commands
 * recorded against the original ids).
 */
declare const snapshotNodeTree: (core: CoreDesigner, id: UUID) => IObjects;
export default snapshotNodeTree;
