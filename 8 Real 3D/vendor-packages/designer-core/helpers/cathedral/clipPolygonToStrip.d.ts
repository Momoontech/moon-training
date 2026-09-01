import { Vec2 } from './baseWallFrame';
/**
 * Sutherland–Hodgman polygon clipping against a vertical strip
 * `xMin <= x <= xMax`. Input polygon may be non-convex; the clip
 * region is convex (an axis-aligned strip) so the algorithm is correct.
 *
 * Returns an empty array when the polygon does not intersect the strip
 * (defensive — should not happen after profile extension).
 */
export declare const clipPolygonToStrip: (polygon: Vec2[], xMin: number, xMax: number) => Vec2[];
