import { Matrix4 } from '../Matrix4';
import type { PlanarPoint2D } from './raycastClearances2D';
/**
 * Convex hull (Andrew's monotone chain) of a small point set on the (X, Z)
 * plane. Collinear points are dropped (`<= 0` pop), so a box footprint comes
 * back as exactly 4 vertices. Returns fresh point objects — never aliases the
 * input.
 *
 * Degenerate input (every point collinear or coincident) yields **at most 2
 * points**, and that is the contract callers rely on to detect "no usable
 * footprint" and fall back to an AABB — a 2-point result must never be padded
 * back out to the input set, or a zero-area object would be hit-tested as a
 * solid outline.
 */
export declare const convexHull2D: (points: ReadonlyArray<PlanarPoint2D>) => PlanarPoint2D[];
/**
 * Project the 8 unit-cube corners through `source × target` (apply `source`
 * first, then `target`) and return the convex footprint of the result on the
 * target frame's (X, Z) plane.
 *
 * Same inputs as {@link projectUnitBoxToBox3}, different output: the TRUE
 * footprint polygon instead of its axis-aligned bounding box. For a node
 * rotated relative to the target frame the two differ enormously — a 96" × 24"
 * closet at 45° has an ~85" × 85" AABB, more than three times its real
 * footprint area — so any "what blocks this ray" test fed the AABB reports
 * phantom obstructions in the empty corners of that box.
 *
 * The footprint is a rectangle for every rotation the app produces today (all
 * items rotate about the vertical axis only), but the hull is computed
 * generally so an arbitrarily-oriented node degrades to a correct hexagon
 * rather than a silently wrong quad.
 *
 * Used by `itemClearances.ts::collectPlanarItemBlockers` to give
 * `raycastClearances2D` real blocker outlines.
 */
export declare const projectUnitBoxToFootprint2D: (source: Matrix4, target: Matrix4) => PlanarPoint2D[];
