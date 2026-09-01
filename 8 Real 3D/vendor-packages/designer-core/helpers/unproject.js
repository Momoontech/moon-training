import { getCameraData } from './getCameraData.js';
import { getProjectionMatrix } from './getProjectionMatrix.js';
import { Vector2 } from './math/Vector2.js';
import { Vector3 } from './math/Vector3.js';
import { Matrix4 } from './math/Matrix4.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

const m4 = new Matrix4();
const vector = new Vector3();
// Viewport size read from `core.viewportWidth` / `core.viewportHeight` via
// `.peek()` (non-tracking) — same rationale as `projectWorld3DToScreen` in
// `project.ts`. Avoids a synchronous `clientWidth` / `clientHeight` layout
// flush in pointer-event handlers (every move that hits the canvas).
const coordinatesToNDC = (coord, core) => new Vector2((coord.x / core.viewportWidth.peek()) * 2 - 1, -(coord.y / core.viewportHeight.peek()) * 2 + 1);
const unprojectNDC = (ndc, core) => {
    const cameraData = getCameraData(core);
    const matrixWorld = m4.fromArray(cameraData.matrix);
    const projectionMatrix = getProjectionMatrix(cameraData);
    vector.set(ndc.x, ndc.y, 0);
    vector.unproject(matrixWorld, projectionMatrix);
    return vector;
};

export { coordinatesToNDC, unprojectNDC };
