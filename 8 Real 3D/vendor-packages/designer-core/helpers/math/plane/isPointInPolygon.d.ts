import { Vector2 } from '../Vector2';
/**
 * Ray-casting point-in-polygon test (even-odd rule).
 *
 * Returns true when `point` lies strictly inside the closed polygon defined by
 * `polygon` (ordered vertices). A polygon with fewer than 3 vertices is
 * treated as empty and always returns false.
 */
export declare function isPointInPolygon(point: Vector2, polygon: Vector2[]): boolean;
