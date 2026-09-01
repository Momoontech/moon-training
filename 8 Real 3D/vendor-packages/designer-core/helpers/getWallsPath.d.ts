import { Vector2 } from './math';
/**
 * Computes the outer boundary of multiple closed 2D paths by performing a union operation.
 *
 * Guarantees it never throws: on `polygon-clipping` numeric failures it falls
 * back to returning the sanitized input paths unchanged, so the caller can
 * still produce geometry without crashing the signal-effect pipeline.
 */
export declare function getWallsPath(inputPaths: Vector2[][]): Vector2[][];
