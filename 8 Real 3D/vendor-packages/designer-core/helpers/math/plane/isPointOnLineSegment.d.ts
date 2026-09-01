import { Vector2 } from '../Vector2';
/**
 * Checks if a point lies on a line segment within a tolerance
 * Uses the same logic as addWall.ts:693
 */
export declare function isPointOnLineSegment(point: Vector2, segFrom: Vector2, segTo: Vector2, tolerance?: number): boolean;
