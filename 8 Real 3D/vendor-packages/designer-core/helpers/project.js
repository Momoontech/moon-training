import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import getNode from '../components/Node/helpers/getNode.js';
import '../components/Node/components/AdjustableBox/index.js';
import '../components/Node/components/AdjustableExtrusion/index.js';
import '../components/Node/components/BoxContainer/index.js';
import '../components/Node/components/Carcass/index.js';
import '../components/Node/components/Ceiling2D/index.js';
import '../components/Node/components/Countertop/index.js';
import '../components/Node/components/CrownMolding/index.js';
import '../components/Node/components/Edgebanding/index.js';
import '../components/Node/components/Floor2D/index.js';
import '../components/Node/components/Frame/index.js';
import '../components/Node/components/FreeBoxContainer/index.js';
import '../components/Node/components/GateFrame/index.js';
import '../components/Node/components/Glass/index.js';
import '../components/Node/components/Image/index.js';
import '../components/Node/components/Item/index.js';
import '../components/Node/components/LaminateBox/index.js';
import '../components/Node/components/MiteredPanel/index.js';
import '../components/Node/BaseModel.js';
import '../components/Node/components/Molding/index.js';
import '../components/Node/components/MountLine/index.js';
import '../components/Node/components/MountPlane/index.js';
import '../components/Node/components/MountPoint/index.js';
import '../components/Node/components/Panel/index.js';
import '../components/Node/components/Part/index.js';
import '../components/Node/components/Point/index.js';
import '../components/Node/components/PointLight/index.js';
import '../components/Node/components/RawPanel/index.js';
import '@preact/signals-react';
import './cathedral/computeCathedralContext.js';
import '../components/Node/components/ShapedBoxContainer/index.js';
import '../components/Node/components/SpotLight/index.js';
import '../components/Node/components/Tiles/index.js';
import '../components/Node/components/ToeKickPanel/index.js';
import '../components/Node/components/Valance/index.js';
import '../components/Node/components/Wall2D/index.js';
import '../components/Node/components/WindowFrame/index.js';
import '../components/Node/helpers/effects.js';
import '../components/Node/helpers/effects.reachInCloset.js';
import '../components/Node/helpers/effects.wallHole.js';
import '../components/Node/helpers/defaultHoleCurve.js';
import './multiCloset/contentPartTypes.js';
import '../components/Node/helpers/getResizableSides.js';
import getPoint from '../components/Node/helpers/getPoint.js';
import '../components/Node/helpers/getSelectableNode.js';
import { getMatrixWorld } from './getMatrixWorld.js';
import { Vector2 } from './math/Vector2.js';
import { Vector3 } from './math/Vector3.js';
import { Matrix4 } from './math/Matrix4.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
import { Quaternion } from './math/Quaternion.js';
import { getCameraData } from './getCameraData.js';
import { getProjectionMatrix } from './getProjectionMatrix.js';

const sceneOffset = new Vector3();
const emptySceneOffset = new Vector3();
const emptyScreenOffset = new Vector2();
const projected = new Vector2();
const p = new Vector3();
const q = new Quaternion();
const s = new Vector3(1, 1, 1);
// Singletons for projectWorld3DToScreen — never allocated in the hot path
const _w3sCamMatrix = new Matrix4();
const _w3sProjMatrix = new Matrix4();
const _w3sPoint = new Vector3();
const projectVector3ToNDC = (_core, v3, sceneOffset = emptySceneOffset) => {
    // const cameraData = getCameraData(core);
    // const projectionMatrix = getProjectionMatrix(cameraData);
    // console.log('v3', v3.toArray(), sceneOffset.toArray());
    const projectV3 = v3.clone().add(sceneOffset);
    // projectV3.project(m4.fromArray(cameraData.matrix), projectionMatrix);
    return projected.set(projectV3.x, projectV3.z).clone();
};
const projectVector3 = (core, v3, sceneOffset = emptySceneOffset) => {
    return projectVector3ToNDC(core, v3, sceneOffset);
    // return NDCToCoordinates(
    //   projectVector3ToNDC(core, v3, sceneOffset),
    //   core.domElement.clientWidth,
    //   core.domElement.clientHeight,
    //   emptyScreenOffset
    // );
};
const projectNodeToNDC = (node, sceneOffset = emptySceneOffset) => {
    getMatrixWorld(node).decompose(p, q, s);
    return projectVector3ToNDC(node.core, p, sceneOffset);
};
const getNodeSceneOffset = (node) => {
    switch (node.type) {
        case NodeType.RoomSegment:
            return getSegmentSceneOffset(node);
        case NodeType.Point:
            return getPointSceneOffset(node);
        default:
            return emptySceneOffset;
    }
};
const getNodeScreenOffset = () => {
    return emptyScreenOffset;
};
const projectNode = (core, nodeId, sceneOffset) => {
    // , screenOffset?: Vector2
    const node = getNode(core, nodeId);
    return projectNodeToNDC(node, sceneOffset ?? getNodeSceneOffset(node));
    // return NDCToCoordinates(
    //   projectNDC,
    //   core.domElement.clientWidth,
    //   core.domElement.clientHeight,
    //   screenOffset ?? getNodeScreenOffset()
    // );
};
const getSegmentSceneOffset = (segment) => {
    const from = getPoint(segment.core, segment.from.get());
    const to = getPoint(segment.core, segment.to.get());
    const centerX = (-from.position.x.get() + to.position.x.get()) / 2;
    const centerY = (-from.position.y.get() + to.position.y.get()) / 2;
    return sceneOffset.set(centerX, 0, centerY);
};
const getPointSceneOffset = (point) => {
    return sceneOffset.set(point.position.x.get(), 0, point.position.y.get());
};
/**
 * Projects a world-space 3D point to normalized device coordinates (NDC) using
 * the active camera for the current view mode (floor-plan, editor2D, etc.).
 *
 * Each component is in `[-1, 1]` for a point inside the view frustum: `x` / `y`
 * span the visible screen, and `z` spans the depth range from the near plane
 * (`-1`) to the far plane (`+1`). A point whose `z` falls OUTSIDE `[-1, 1]` is
 * clipped by depth — in front of the near plane or beyond the far plane. That is
 * the test callers use to tell whether an object has left the editor2D camera's
 * shallow depth band (e.g. a floor-standing closet parked far off the framed
 * wall), which the face-on screen `x` / `y` alone can't reveal.
 *
 * Writes into `out` when supplied (allocation-free); allocates otherwise.
 * `projectWorld3DToScreen` is the CSS-pixel wrapper around this.
 */
const projectWorld3DToNDC = (core, world, out) => {
    const cameraData = getCameraData(core);
    _w3sCamMatrix.fromArray(cameraData.matrix);
    getProjectionMatrix(cameraData, _w3sProjMatrix);
    const target = out ?? new Vector3();
    return target.copy(world).project(_w3sCamMatrix, _w3sProjMatrix);
};
/**
 * Projects a world-space 3D point to CSS pixel coordinates over the designer canvas.
 *
 * Uses the active camera for the current view mode (floor-plan, editor2D, etc.)
 * via {@link projectWorld3DToNDC}. All intermediate objects are module-level
 * singletons — allocation-free on the hot path.
 *
 * Viewport size is read from `core.viewportWidth` / `core.viewportHeight` —
 * a renderer-maintained signal — via `.peek()` (non-tracking). The camera
 * signal already drives reactivity on the consumer's effect / computed, and
 * resize updates the camera signal alongside the viewport signal, so the
 * latest viewport size is always visible on the next dep-driven recompute
 * without forcing a synchronous layout read here.
 */
const projectWorld3DToScreen = (core, world) => {
    projectWorld3DToNDC(core, world, _w3sPoint);
    const w = core.viewportWidth.peek();
    const h = core.viewportHeight.peek();
    return {
        x: (_w3sPoint.x * 0.5 + 0.5) * w,
        y: (-_w3sPoint.y * 0.5 + 0.5) * h
    };
};

export { getNodeSceneOffset, getNodeScreenOffset, getPointSceneOffset, getSegmentSceneOffset, projectNode, projectNodeToNDC, projectVector3, projectVector3ToNDC, projectWorld3DToNDC, projectWorld3DToScreen };
