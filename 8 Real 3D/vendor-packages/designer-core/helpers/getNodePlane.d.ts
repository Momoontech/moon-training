import type { MountPlane } from '../components/Node';
import { Plane, Quaternion, Vector3 } from './math';
export declare const p: Vector3;
export declare const q: Quaternion;
export declare const s: Vector3;
declare const getNodePlane: (node: MountPlane) => Plane;
export { getNodePlane };
