import type { Node } from '../components/Node';
import { RoomSegment } from '../components/Node/components/RoomSegment';
import { Matrix4 } from './math';
export declare const getRoomSegmentPosition: (node: RoomSegment) => {
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
};
/**
 * Computes the world-space matrix for a node by multiplying up the parent chain.
 *
 * When `out` is supplied the result is written directly into it (no allocation).
 * When omitted a fresh `Matrix4` is allocated for backward compatibility.
 */
export declare const getMatrixWorld: (node: Node, scale?: boolean, out?: Matrix4) => Matrix4;
