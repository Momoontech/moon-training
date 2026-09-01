import { Vector2 } from '../Vector2';
/**
 * Result of finding collinear overlap between two segments
 */
export interface CollinearOverlapResult {
    hasOverlap: boolean;
    startPoint: Vector2;
    endPoint: Vector2;
    startT: number;
    endT: number;
}
/**
 * Finds collinear overlap between two line segments
 * Returns overlap information if segments partially overlap
 */
export declare function getCollinearSegmentsOverlap(seg1From: Vector2, seg1To: Vector2, seg2From: Vector2, seg2To: Vector2): CollinearOverlapResult;
