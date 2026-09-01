import { Vector2 } from './math';
/**
 * Offsets a closed 2D polygon outward by a constant thickness using miter joins
 * @param points - Array of Vector2 representing a closed path (last point connects to first)
 * @param thickness - Offset distance (positive = outward, negative = inward)
 * @param miterLimit - Maximum miter length ratio (prevents very long spikes, default: 2.0)
 * @returns Offset polygon as Vector2 array
 */
export declare function offsetPolygon(points: Vector2[], thickness: number, miterLimit?: number): Vector2[];
