import { IPerspectiveCamera } from '../declarations';
import { Matrix4 } from './math';
/**
 * Builds a perspective projection matrix from IPerspectiveCamera data.
 *
 * Replicates Three.js PerspectiveCamera.updateProjectionMatrix() logic:
 *   1. Convert vertical fov (degrees) → half-height at the near plane
 *   2. Apply zoom by dividing half-height
 *   3. Derive width from aspect ratio
 *   4. Shift left edge to centre the frustum
 *   5. Feed the four frustum edges into makePerspective
 */
export declare const getPerspectiveProjectionMatrix: (camera: IPerspectiveCamera) => Matrix4;
