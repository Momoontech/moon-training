import { DEG2RAD } from './math/constants.js';
import { Matrix4 } from './math/Matrix4.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

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
const getPerspectiveProjectionMatrix = (camera) => {
    const { fov, aspect, zoom, near, far } = camera;
    const halfH = (near * Math.tan(DEG2RAD * 0.5 * fov)) / zoom;
    const width = 2 * aspect * halfH;
    const left = -0.5 * width;
    const m = new Matrix4();
    m.makePerspective(left, left + width, halfH, halfH - 2 * halfH, near, far);
    return m;
};

export { getPerspectiveProjectionMatrix };
