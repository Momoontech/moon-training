import { IOrthoCamera, IPerspectiveCamera } from '../declarations';
import { Matrix4 } from './math';
/**
 * Builds a projection matrix from camera data.
 *
 * When `out` is supplied the result is written directly into it (no allocation).
 * When omitted the internal singleton is cloned for backward compatibility.
 */
export declare const getProjectionMatrix: (cameraData: IPerspectiveCamera | IOrthoCamera, out?: Matrix4) => Matrix4;
