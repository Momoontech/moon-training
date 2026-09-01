import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * Reads the **effective** locked state of a wall segment. Currently a
 * thin pass-through to the segment's own `isLocked` signal — kept as a
 * named helper so:
 *
 * 1. The three lock helpers expose a uniform read API
 *    (`getEffectivePointPositionLocked`, `getEffectivePointAngleLocked`,
 *    `getEffectiveSegmentLocked`), making call sites — drag gates,
 *    direction-disabled wiring, length-input read-only — read like
 *    each other.
 * 2. A future spec change can promote a derived state into segment lock
 *    (e.g. "if both endpoints are explicitly locked, the segment is
 *    effectively locked too") without churning every consumer.
 *
 * The id is type-checked the same way the point helpers are: a
 * misrouted UUID returns `false` rather than throwing or "leaking" a
 * locked state from a same-named field on a different runtime class.
 */
export declare const getEffectiveSegmentLocked: (core: CoreDesigner, segmentId: UUID) => boolean;
