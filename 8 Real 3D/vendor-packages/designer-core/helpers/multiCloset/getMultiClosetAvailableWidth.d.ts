import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Inside width of a multiCloset that is actually available for sections /
 * separators — `size.x` minus the space reserved on each side that abuts a
 * neighbor closet. This mirrors the `availableSize` computation in
 * `updateMultiClosetItemLayoutEffect` exactly so the calculator and the live
 * layout agree on usable width:
 *
 *  - "bridge"       gap  ← side neighbor jointed back to us with a `bridge` joint
 *  - "corner joint" gap  ← joint neighbor on a side with a corner joint type
 *
 * Both can be present on the same side, so they sum. Missing attribute => 0.
 */
export declare const getMultiClosetAvailableWidth: (core: CoreDesigner, itemId: UUID) => number;
export default getMultiClosetAvailableWidth;
