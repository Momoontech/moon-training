import { Vector2, GeneralViewMode, getOptionalParentItem, NodeType, getPoint as getPoint$1, getRoomSegment, getMatrixWorld, getItem, unprojectNDC, coordinatesToNDC, getOptionalNode, PartType, ItemType, traverseNode, getFloorplan, getMonitor, traverseRoom, getParentRoom, generateId, getPart, getAttributeValue, getRoom, EShapeType, IMaterialTypeValues, Matrix4 as Matrix4$1, Vector3 as Vector3$1, UNIT_BOX_CORNERS, FreeBoxContainerType, reconcileFreeBoxContainerBaysCommands, promoteMultiClosetAutoCarrier, isMultiClosetStackPartType, getEffectiveContentLocked, getNode, freeBoxContainerStackInsertion, SetNodeParentCommand, defaultFirstHoleOffset, getParentCarcass, snapTo32mm, step32mm, SetNodeVectorComponentCommand, VectorProps, V3Axes, CreateNodeCommand, SetSelectedNodeIdCommand, RemoveNodeCommand, isCeilingMountedNode, Quaternion as Quaternion$1, Euler, MountType, SetNodeVector3Command, SetHoveredNodeIdCommand, getNodeLine, calculateValue, importSourceFromCatalog, SegmentType, getOptionalParentRoom, CeilingType, computeFacetMountPose, isCCW, Plane, getNodePlane, clearWallAttach, recordWallAttach, Line3, getMountLineWidth, resolveCatalogConfig, CreateNodeFromCatalogCommand, SetDraggedCatalogPathCommand, MultiClosetComponentType, getShelfBoardForCompartmentClick, updateParentId, resolveParentChildProperty, buildMultiClosetWallMountCommands, SetDraggedNodeIdCommand, getDraggableNode, getSelectableNode, getDraggedNodeOffset, DuplicateNodeCommand, fitItemToSizeX, defaultTextureSize, getMaterial, ModelType, getRoomSegmentPosition, getMaterials, CoreMode, getExistsRecursively, MobileStep, isSubtreeNode, isWallHoleableNode, getCeilingLocalTransform, MoldingType, getParentPart, getWallsPath, offsetPolygon, getParentItem, getParentPanel, SetValueCommand, SetGeneralViewModeCommand, getSystemById, getNodesBySystem, ViewType } from '@moon/designer-core';
import { Matrix4, Box3, Vector3, BufferGeometry, Mesh, BatchedMesh, Layers, Raycaster, Color, OrthographicCamera, RenderTarget, WebGLCoordinateSystem, Quaternion, InstancedMesh, DynamicDrawUsage, EdgesGeometry, Group, MeshBasicMaterial, LineBasicMaterial, FrontSide, DoubleSide, MathUtils, Shape, Path, Vector2 as Vector2$1, Float32BufferAttribute, ShapeUtils, BufferAttribute, ShapeGeometry, BoxGeometry, ImageBitmapLoader, SRGBColorSpace, CanvasTexture, RepeatWrapping, MeshPhysicalMaterial, NoColorSpace, FileLoader, ExtrudeGeometry, LineCurve3, TubeGeometry, ACESFilmicToneMapping, PointLight, SpotLight, Scene, PerspectiveCamera, DirectionalLight, PlaneGeometry, SphereGeometry, BackSide, HalfFloatType, CubeCamera } from 'three';
import { gsap } from 'gsap';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, computeBatchedBoundsTree, disposeBatchedBoundsTree } from 'three-mesh-bvh';
import { Line2NodeMaterial, WebGPURenderer, RenderPipeline, MeshBasicNodeMaterial, CubeRenderTarget } from 'three/webgpu';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js';
import { untracked, effect } from '@preact/signals-react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { uniform, uv, pass, vec4, mix, renderOutput, step, oneMinus, smoothstep, length, positionWorld, max, vec3, abs, fract, fwidth, min, float } from 'three/tsl';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { Curves } from 'three/examples/jsm/Addons';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { fxaa } from 'three/examples/jsm/tsl/display/FXAANode';
import { outline } from 'three/examples/jsm/tsl/display/OutlineNode';

// Reused math scratch. `computeNodeLocalBox` runs synchronously to completion
// before the next call, so sharing module-level scratch is safe and keeps the
// path allocation-free per the project performance rules.
const _invMatrix$1 = new Matrix4();
const _childMatrix = new Matrix4();
const _childBox = new Box3();
/**
 * Bounding box of everything rendered under `group` (contour lines + their
 * meshes), expressed in the group's LOCAL frame (so X/Y/Z are the group's
 * local axes), written into `out`. Each child's geometry bounds are transformed
 * back through the inverse of the group's world matrix and unioned.
 *
 * `LineSegments2` (the BW contour) extends `Mesh`, so `isMesh` covers both the
 * shaded mesh and its outline; either bounds the rendered content. Used by the
 * paperspace `renderNodeImage` elevation framing, the floor-view builder (to
 * measure each closet's footprint), and the Customize-step camera focus.
 */
function computeNodeLocalBox(group, out) {
    _invMatrix$1.copy(group.matrixWorld).invert();
    out.makeEmpty();
    group.traverse((object) => {
        if (!object.visible)
            return;
        const mesh = object;
        if (!mesh.isMesh || !mesh.geometry)
            return;
        const geometry = mesh.geometry;
        if (!geometry.boundingBox)
            geometry.computeBoundingBox();
        if (!geometry.boundingBox || geometry.boundingBox.isEmpty())
            return;
        _childBox.copy(geometry.boundingBox);
        _childMatrix.multiplyMatrices(_invMatrix$1, object.matrixWorld);
        _childBox.applyMatrix4(_childMatrix);
        out.union(_childBox);
    });
}

// GSAP camera-focus tween tuning. Duration is comfortably under a perceptible
// stall while long enough to read as motion; the ease keeps both ends soft.
const CAMERA_FOCUS_DURATION = 0.6;
const CAMERA_FOCUS_EASE = 'power2.inOut';
// Extra back-off so the framed part isn't flush against the frustum edges.
const CAMERA_FOCUS_PADDING = 1.25;
// Camera-focus scratch (Customize-step part framing). Reused per focus request —
// focusCameraOnNode runs synchronously to completion before the next call, so
// sharing is safe and keeps the path allocation-free per the performance rules.
const _focusBox = new Box3();
const _focusSize = new Vector3();
const _focusCenterLocal = new Vector3();
const _focusCenterWorld = new Vector3();
const _focusFrontDir = new Vector3();
// editor3D dimension-focus scratch (perspective). Reused per request — a focus runs synchronously
// to a single tween before the next call, so sharing is safe (allocation-free per the perf rules).
const _e3FocusCenter = new Vector3();
const _e3FocusDir = new Vector3();
// Screen-point → world-target scratch (input-centring). Same synchronous-reuse safety.
const _fieldWorldOut = new Vector3();
const _fieldForward = new Vector3();
const _fieldRayDir = new Vector3();
const _fieldRayPoint = new Vector3();
const _fieldScratch = new Vector3();
const _fieldNdc = new Vector2();
/** Screen points equal within a px tolerance — dedupe guard (`null === null` also counts). */
const screenPointsEqual = (a, b) => a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5);
/**
 * World point sitting UNDER `screenPoint` (canvas CSS px) at the view-depth of `depthPoint`, written
 * into `out`. Making it the orbit target lands the focused FIELD (not just the node centre) at
 * screen centre. Handles both camera kinds: perspective rays fan from the camera position; ortho
 * rays are parallel to the view axis (depth only picks which point on the parallel ray — the screen
 * x/y is identical at any depth). Falls back to `depthPoint` on a degenerate grazing ray.
 */
const resolveFieldWorldTarget = (designer3D, isOrtho, camPos, screenPoint, depthPoint, out) => {
    const forward = _fieldForward.copy(designer3D.controls.target).sub(camPos).normalize();
    _fieldNdc.set(screenPoint.x, screenPoint.y);
    const rayPoint = _fieldRayPoint.copy(unprojectNDC(coordinatesToNDC(_fieldNdc, designer3D.core), designer3D.core));
    if (isOrtho) {
        // Ortho: rays run parallel to `forward`; slide `rayPoint` along it onto the depth plane.
        const t = _fieldScratch.copy(depthPoint).sub(rayPoint).dot(forward);
        return out.copy(rayPoint).addScaledVector(forward, t);
    }
    // Perspective: intersect the ray (camPos → rayPoint) with the plane through `depthPoint` ⊥ forward.
    const dir = _fieldRayDir.copy(rayPoint).sub(camPos).normalize();
    const denom = dir.dot(forward);
    if (Math.abs(denom) < 1e-6)
        return out.copy(depthPoint);
    const t = _fieldScratch.copy(depthPoint).sub(camPos).dot(forward) / denom;
    return out.copy(camPos).addScaledVector(dir, t);
};
/**
 * Fill the camera-focus scratch for a node — `_focusCenterWorld` (box center
 * in world), `_focusFrontDir` (normalized world front normal), and
 * `_focusSize` (local width/height/depth) — or return false if the node has
 * no usable bounds.
 *
 * multiCloset items and their section / content parts are INSTANCED: their
 * geometry is the shared unit box [0,1]³ (see the
 * `BoxGeometry(1,1,1).translate(0.5)` instance managers) scaled by the node's
 * world matrix, and their NodeGroup carries no mesh — so `computeNodeLocalBox`
 * would be empty. For them the framing is read straight off the world matrix:
 * the X/Y/Z column lengths are the box extents, the normalized Z column is the
 * front normal, and the matrix maps the box center (0.5,0.5,0.5) to world. Any
 * other node falls back to its group's local contour bounds (the elevation
 * path of `renderNodeImage`).
 */
const computeNodeFocusFraming = (designer3D, nodeId) => {
    const node = getOptionalNode(designer3D.core, nodeId);
    if (!node)
        return false;
    const isInstancedUnitBox = (node.type === NodeType.Part &&
        (node.partType.get() === PartType.multiClosetSection ||
            node.partType.get() === PartType.multiClosetSectionContent)) ||
        (node.type === NodeType.Item && node.itemType.get() === ItemType.multiCloset);
    if (isInstancedUnitBox) {
        const e = getMatrixWorld(node, true).elements;
        const width = Math.hypot(e[0], e[1], e[2]);
        const height = Math.hypot(e[4], e[5], e[6]);
        const depth = Math.hypot(e[8], e[9], e[10]);
        if (width <= 0 || height <= 0 || depth <= 0)
            return false;
        _focusSize.set(width, height, depth);
        _focusCenterWorld.set(e[0] * 0.5 + e[4] * 0.5 + e[8] * 0.5 + e[12], e[1] * 0.5 + e[5] * 0.5 + e[9] * 0.5 + e[13], e[2] * 0.5 + e[6] * 0.5 + e[10] * 0.5 + e[14]);
        _focusFrontDir.set(e[8] / depth, e[9] / depth, e[10] / depth);
        return true;
    }
    const nodeView = designer3D.nodes.get(nodeId);
    if (!nodeView)
        return false;
    const group = nodeView.group;
    group.updateMatrixWorld(true);
    computeNodeLocalBox(group, _focusBox);
    if (_focusBox.isEmpty())
        return false;
    _focusBox.getSize(_focusSize);
    if (_focusSize.x <= 0 || _focusSize.y <= 0)
        return false;
    _focusBox.getCenter(_focusCenterLocal);
    _focusCenterWorld.copy(_focusCenterLocal).applyMatrix4(group.matrixWorld);
    _focusFrontDir.set(0, 0, 1).transformDirection(group.matrixWorld).normalize();
    return true;
};
/**
 * Compute framing for `nodeId` (via {@link computeNodeFocusFraming}) and
 * animate the camera to it. The back-off distance is the one that fits the
 * node in BOTH the vertical FOV and the horizontal FOV (vertical scaled by
 * aspect), padded, plus half the depth so the near face clears the lens.
 * `camera.up` is left untouched (world +Y) — closets stand upright, so only
 * position + target move and the orbit pole stays stable for the user after.
 *
 * Returns false (no tween) when the node has no usable bounds.
 */
const frameNode = (designer3D, nodeId) => {
    if (!computeNodeFocusFraming(designer3D, nodeId))
        return false;
    const width = _focusSize.x;
    const height = _focusSize.y;
    const depth = _focusSize.z;
    // Perspective back-off: the larger of the height-fit and width-fit
    // distances. tan(vFov/2) fits height; the horizontal half-angle is the
    // vertical one scaled by aspect, so dividing width by (halfTan * aspect)
    // fits width. Pad, then add half the depth so the front face clears the lens.
    const vFov = (designer3D.e3Camera.fov * Math.PI) / 180;
    const halfTan = Math.tan(vFov / 2);
    const distForHeight = height / 2 / halfTan;
    const distForWidth = width / 2 / (halfTan * designer3D.e3Camera.aspect);
    let distance = Math.max(distForHeight, distForWidth) * CAMERA_FOCUS_PADDING + depth / 2;
    // Clamp into the orbit radius limits — `controls.update()` clamps radius
    // every frame, so a target outside [min, max] would make the tween fight
    // the controls instead of resting where we put it.
    distance = Math.min(Math.max(distance, designer3D.controls.minDistance), designer3D.controls.maxDistance);
    animateCameraTo(designer3D, _focusCenterWorld.x + _focusFrontDir.x * distance, _focusCenterWorld.y + _focusFrontDir.y * distance, _focusCenterWorld.z + _focusFrontDir.z * distance, _focusCenterWorld.x, _focusCenterWorld.y, _focusCenterWorld.z);
    return true;
};
/**
 * Frame a node face-on with the perspective editor camera (Customize step):
 * zoom onto a tapped multiCloset part. Clearing the selection animates out to
 * the part's product via {@link restoreCameraFocus}.
 *
 * No-op outside editor3D, or when the node has no usable bounds.
 */
const focusCameraOnNode = (designer3D, nodeId) => {
    if (designer3D.core.generalViewMode.peek() !== GeneralViewMode.editor3D)
        return;
    // Already framing this exact node — don't restart on an unrelated re-run.
    if (designer3D.cameraFocusNodeId === nodeId)
        return;
    if (frameNode(designer3D, nodeId)) {
        designer3D.cameraFocusNodeId = nodeId;
    }
};
/**
 * Animate out to the GENERAL view of the PRODUCT the last-focused part lived
 * on (its parent multiCloset Item) — no remembered camera pose; the framing is
 * recomputed from the product's bounds. A no-op when nothing was focused, so
 * it never forces a product view on its own (only after a part was framed).
 */
const restoreCameraFocus = (designer3D) => {
    const focusedId = designer3D.cameraFocusNodeId;
    designer3D.cameraFocusNodeId = null;
    if (!focusedId)
        return;
    if (designer3D.core.generalViewMode.peek() !== GeneralViewMode.editor3D)
        return;
    // getOptionalParentItem walks up to the nearest Item ancestor (the
    // multiCloset product); undefined if the part was meanwhile removed.
    const product = getOptionalParentItem(designer3D.core, focusedId);
    if (!product)
        return;
    frameNode(designer3D, product.id);
};
/**
 * Drop focus state and kill any running tween WITHOUT animating — used when
 * the focus context is gone (left the Customize step / editor3D), where the
 * view or camera may be swapping under us and an animated restore would be
 * invisible or fight the mode change.
 */
const clearCameraFocus = (designer3D) => {
    if (!designer3D.cameraFocusTween && designer3D.cameraFocusNodeId === null)
        return;
    if (designer3D.cameraFocusTween) {
        designer3D.cameraFocusTween.kill();
        designer3D.cameraFocusTween = null;
    }
    designer3D.cameraFocusNodeId = null;
    // A tween may have left the controls disabled mid-flight — restore the
    // standard gate (only a node drag disables them).
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
};
/**
 * Drive the editor3D camera position + orbit target to the given world coords
 * with a single GSAP timeline. Controls are locked for the tween so a stray
 * touch can't fight it (`updateControlsEffect` won't re-run meanwhile — no
 * `draggedNodeId` change — so it can't clobber this); `requestRender` is
 * pumped every tick because the package has no always-on render loop.
 */
const animateCameraTo = (designer3D, px, py, pz, tx, ty, tz) => {
    designer3D.cameraFocusTween?.kill();
    designer3D.controls.enabled = false;
    designer3D.cameraFocusTween = gsap.timeline({
        onUpdate: designer3D.requestRender,
        onComplete: () => onCameraFocusSettled(designer3D)
    });
    designer3D.cameraFocusTween
        .to(designer3D.e3Camera.position, { x: px, y: py, z: pz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0)
        .to(designer3D.controls.target, { x: tx, y: ty, z: tz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0);
    designer3D.requestRender();
};
/** Tween-complete: re-enable controls, sync them, publish the resting matrix. */
const onCameraFocusSettled = (designer3D) => {
    designer3D.cameraFocusTween = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
    designer3D.controls.update();
    // Same publish channel as a user orbit gesture (view state, not history).
    designer3D.onChangeControls();
    designer3D.requestRender();
};
/**
 * M3D-309 — frame the dimension being edited in the TOP-VIEW floorplan: pan the ortho
 * `fCamera` to centre on `nodeId` and animate its zoom to `targetZoom` (the wrapper's
 * threshold), reusing the same GSAP feel as the Customize framing. No-op outside the
 * floorplan view, when already framing this node, or when no centre can be resolved.
 */
const focusFloorplanCameraOnNode = (designer3D, nodeId, targetZoom) => {
    if (designer3D.core.generalViewMode.peek() !== GeneralViewMode.floorPlan)
        return;
    if (designer3D.floorplanFocusNodeId === nodeId && designer3D.floorplanFocusPoint === null)
        return;
    const center = computeFloorplanFocusCenter(designer3D, nodeId);
    if (!center)
        return;
    designer3D.floorplanFocusNodeId = nodeId;
    designer3D.floorplanFocusPoint = null;
    animateFloorplanCameraTo(designer3D, center.x, center.z, targetZoom);
};
/**
 * M3D-309 — frame an explicit world-floor `(x, z)` point (a product dimension's own midpoint)
 * rather than a node centre. Same GSAP feel as {@link focusFloorplanCameraOnNode}; dedupes on
 * the point so re-focusing the same dimension is a no-op, but moving to a sibling dimension of
 * the same item (identical id, different point) still re-frames.
 */
const focusFloorplanCameraOnPoint = (designer3D, x, z, targetZoom) => {
    if (designer3D.core.generalViewMode.peek() !== GeneralViewMode.floorPlan)
        return;
    if (designer3D.floorplanFocusPoint &&
        designer3D.floorplanFocusPoint.x === x &&
        designer3D.floorplanFocusPoint.z === z)
        return;
    designer3D.floorplanFocusPoint = { x, z };
    designer3D.floorplanFocusNodeId = null;
    animateFloorplanCameraTo(designer3D, x, z, targetZoom);
};
/** M3D-309 — drop the floorplan dimension-focus without animating (view / context gone). */
const clearFloorplanCameraFocus = (designer3D) => {
    if (!designer3D.floorplanFocusTween &&
        designer3D.floorplanFocusNodeId === null &&
        designer3D.floorplanFocusPoint === null)
        return;
    if (designer3D.floorplanFocusTween) {
        designer3D.floorplanFocusTween.kill();
        designer3D.floorplanFocusTween = null;
    }
    designer3D.floorplanFocusNodeId = null;
    designer3D.floorplanFocusPoint = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
};
/**
 * World (x, z) centre of a node for floorplan framing. Reuses the node-framing bbox
 * centre (the correct midpoint for a wall segment's geometry); falls back to the node's
 * world translation for degenerate bounds (a corner Point has no volume to box).
 */
const computeFloorplanFocusCenter = (designer3D, nodeId) => {
    // Read the centre from CORE data (source of truth), NOT the 3D view/matrix: a corner
    // Point has no volume and a RoomSegment's group sits at an endpoint, so the framing
    // bbox / world matrix collapse to the origin. Floor-plane world = (position.x, ·,
    // position.y), matching the overlay's `--seg-wx` / `--seg-wz` mapping.
    const node = designer3D.core.nodes.get(nodeId);
    if (!node)
        return null;
    if (node.type === NodeType.Point) {
        const point = getPoint$1(designer3D.core, nodeId);
        return { x: point.position.x.get(), z: point.position.y.get() };
    }
    if (node.type === NodeType.RoomSegment) {
        const segment = getRoomSegment(designer3D.core, nodeId);
        const from = getPoint$1(designer3D.core, segment.from.get());
        const to = getPoint$1(designer3D.core, segment.to.get());
        return {
            x: (from.position.x.get() + to.position.x.get()) / 2,
            z: (from.position.y.get() + to.position.y.get()) / 2
        };
    }
    if (node.type === NodeType.Item) {
        // Products DO have volume, so — unlike Point / RoomSegment above — the world matrix is
        // valid. Frame the item's box centre projected onto the floor plane: matrix × unit-box
        // centre (0.5,0.5,0.5), keeping (x, z). Works for both wall-mounted and floor / ceiling
        // items (their (x, z) centre is the horizontal spot the top-down camera should land on).
        const e = getMatrixWorld(getItem(designer3D.core, nodeId), true).elements;
        return {
            x: e[0] * 0.5 + e[4] * 0.5 + e[8] * 0.5 + e[12],
            z: e[2] * 0.5 + e[6] * 0.5 + e[10] * 0.5 + e[14]
        };
    }
    return null;
};
/**
 * Pan + zoom the ortho `fCamera` to (cx, cz) at `targetZoom` over one GSAP timeline.
 * The camera looks straight down, so panning tweens both `controls.target` and
 * `fCamera.position` in x/z (y — the top-down height — is untouched); `zoom` tweens on
 * the camera and needs `updateProjectionMatrix` each tick. `onChangeControls` republishes
 * `fCameraData` every frame so the HTML dimension overlays track the pan. Controls are
 * locked for the tween so a stray touch can't fight it.
 */
const animateFloorplanCameraTo = (designer3D, cx, cz, targetZoom) => {
    designer3D.floorplanFocusTween?.kill();
    designer3D.controls.enabled = false;
    const cam = designer3D.fCamera;
    designer3D.floorplanFocusTween = gsap.timeline({
        onUpdate: () => {
            cam.updateProjectionMatrix();
            designer3D.onChangeControls();
            designer3D.requestRender();
        },
        onComplete: () => onFloorplanFocusSettled(designer3D)
    });
    designer3D.floorplanFocusTween
        .to(designer3D.controls.target, { x: cx, z: cz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0)
        .to(cam.position, { x: cx, z: cz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0)
        .to(cam, { zoom: targetZoom, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0);
    designer3D.requestRender();
};
/** Tween-complete for the floorplan focus — re-enable controls, sync, publish. */
const onFloorplanFocusSettled = (designer3D) => {
    designer3D.floorplanFocusTween = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
    designer3D.controls.update();
    designer3D.onChangeControls();
    designer3D.requestRender();
};
/**
 * World (x, y, z) centre of a node for editor3D (perspective) framing. Points / room segments are
 * read from CORE data on the floor plane (y = 0) — their 3D view groups collapse to an endpoint,
 * same reason `computeFloorplanFocusCenter` reads core. Items use the box centre from the world
 * matrix (full 3D). Anything else (e.g. a Wall2D for the height badge) falls back to its framing
 * bbox centre. Writes into the module scratch `_e3FocusCenter` and returns it (or null).
 */
const computeFocusCenterWorld = (designer3D, nodeId) => {
    const { core } = designer3D;
    const node = core.nodes.get(nodeId);
    if (!node)
        return null;
    if (node.type === NodeType.Point) {
        const point = getPoint$1(core, nodeId);
        return _e3FocusCenter.set(point.position.x.get(), 0, point.position.y.get());
    }
    if (node.type === NodeType.RoomSegment) {
        const segment = getRoomSegment(core, nodeId);
        const from = getPoint$1(core, segment.from.get());
        const to = getPoint$1(core, segment.to.get());
        return _e3FocusCenter.set((from.position.x.get() + to.position.x.get()) / 2, 0, (from.position.y.get() + to.position.y.get()) / 2);
    }
    if (node.type === NodeType.Item) {
        const e = getMatrixWorld(getItem(core, nodeId), true).elements;
        return _e3FocusCenter.set(e[0] * 0.5 + e[4] * 0.5 + e[8] * 0.5 + e[12], e[1] * 0.5 + e[5] * 0.5 + e[9] * 0.5 + e[13], e[2] * 0.5 + e[6] * 0.5 + e[10] * 0.5 + e[14]);
    }
    // Wall2D (height badge) and anything else with usable bounds — reuse the framing bbox centre.
    if (computeNodeFocusFraming(designer3D, nodeId)) {
        return _e3FocusCenter.copy(_focusCenterWorld);
    }
    return null;
};
/**
 * "Any-mode" dimension focus for the PERSPECTIVE editor3D view. Mirrors the floorplan feel ("same
 * as 2D"): pan the orbit target to the dimension's world centre and DOLLY in KEEPING the current
 * orbit angle, to the distance that makes the dimension read at `targetZoom` CSS px per inch — the
 * SAME scale metric `useEditor3DDimensionsVisible` uses, so the apparent size matches the top-down
 * focus. Distance is clamped into the orbit radius limits so the tween rests where we put it
 * (`controls.update()` clamps radius each frame). No-op outside editor3D, when already framing this
 * node, or when no centre resolves.
 *
 * Drives the SEPARATE `editor3DFocusTween` slot; the Customize part-framing (`cameraFocusTween`)
 * also animates `e3Camera`, so `animateCameraToSelectionEffect` clears whichever isn't active before
 * dispatching — only one e3Camera tween runs at a time.
 */
const focusEditor3DCameraOnNode = (designer3D, nodeId, targetZoom, screenPoint) => {
    if (designer3D.core.generalViewMode.peek() !== GeneralViewMode.editor3D)
        return;
    if (designer3D.editor3DFocusNodeId === nodeId && screenPointsEqual(designer3D.editor3DFocusScreenPoint, screenPoint))
        return;
    const center = computeFocusCenterWorld(designer3D, nodeId);
    if (!center)
        return;
    const cam = designer3D.e3Camera;
    // Centre the EXACT field when we know its screen position (node centre is the fallback / depth ref).
    const focusTarget = screenPoint
        ? resolveFieldWorldTarget(designer3D, false, cam.position, screenPoint, center, _fieldWorldOut)
        : _fieldWorldOut.copy(center);
    const tx = focusTarget.x;
    const ty = focusTarget.y;
    const tz = focusTarget.z;
    // Distance for `targetZoom` px/inch at the target depth — invert the visibility metric
    // pxPerInch = (viewportHeight / 2) / (distance · tan(fov/2)) · zoom (see useEditor3DDimensionsVisible).
    const viewportHeight = designer3D.core.viewportHeight.peek();
    const halfTan = Math.tan((cam.fov * Math.PI) / 360);
    let distance = viewportHeight > 0 && targetZoom > 0 && halfTan > 0
        ? ((viewportHeight / 2) / (targetZoom * halfTan)) * cam.zoom
        : designer3D.controls.minDistance;
    distance = Math.min(Math.max(distance, designer3D.controls.minDistance), designer3D.controls.maxDistance);
    // Keep the CURRENT orbit direction (camera − target); gentle default if degenerate.
    _e3FocusDir.copy(cam.position).sub(designer3D.controls.target);
    if (_e3FocusDir.lengthSq() < 1e-6)
        _e3FocusDir.set(0, 0.4, 1);
    _e3FocusDir.normalize();
    designer3D.editor3DFocusNodeId = nodeId;
    designer3D.editor3DFocusScreenPoint = screenPoint;
    animateEditor3DCameraTo(designer3D, tx + _e3FocusDir.x * distance, ty + _e3FocusDir.y * distance, tz + _e3FocusDir.z * distance, tx, ty, tz);
};
/** Drop the editor3D dimension-focus without animating (view / context gone). */
const clearEditor3DCameraFocus = (designer3D) => {
    if (!designer3D.editor3DFocusTween && designer3D.editor3DFocusNodeId === null)
        return;
    if (designer3D.editor3DFocusTween) {
        designer3D.editor3DFocusTween.kill();
        designer3D.editor3DFocusTween = null;
    }
    designer3D.editor3DFocusNodeId = null;
    designer3D.editor3DFocusScreenPoint = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
};
/**
 * Drive the editor3D camera position + orbit target with a single GSAP timeline, on the
 * `editor3DFocusTween` slot (perspective sibling of `animateCameraTo`'s `cameraFocusTween`).
 * Controls are locked for the tween; `onChangeControls` republishes `e3CameraData` on settle so the
 * HTML overlays track the move. `requestRender` is pumped every tick (no always-on render loop).
 */
const animateEditor3DCameraTo = (designer3D, px, py, pz, tx, ty, tz) => {
    designer3D.editor3DFocusTween?.kill();
    designer3D.controls.enabled = false;
    designer3D.editor3DFocusTween = gsap.timeline({
        onUpdate: designer3D.requestRender,
        onComplete: () => onEditor3DFocusSettled(designer3D)
    });
    designer3D.editor3DFocusTween
        .to(designer3D.e3Camera.position, { x: px, y: py, z: pz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0)
        .to(designer3D.controls.target, { x: tx, y: ty, z: tz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0);
    designer3D.requestRender();
};
/** Tween-complete for the editor3D focus — re-enable controls, sync, publish. */
const onEditor3DFocusSettled = (designer3D) => {
    designer3D.editor3DFocusTween = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
    designer3D.controls.update();
    designer3D.onChangeControls();
    designer3D.requestRender();
};
/**
 * "Any-mode" dimension focus for the ORTHO editor2D (wall-elevation / front) view. The `e2Camera`
 * faces the wall at an arbitrary orientation, so — unlike the top-down floorplan pan (world x/z
 * only) — panning is done by the FULL delta `newCentre − controls.target`: move both the orbit
 * target and the camera by the same vector (facing direction preserved), then tween the ortho
 * `zoom`. Frames `nodeId`'s world centre at `targetZoom`. No-op outside editor2D, when already
 * framing this node, or when no centre resolves.
 */
const focusEditor2DCameraOnNode = (designer3D, nodeId, targetZoom, screenPoint) => {
    if (designer3D.core.generalViewMode.peek() !== GeneralViewMode.editor2D)
        return;
    if (designer3D.editor2DFocusNodeId === nodeId && screenPointsEqual(designer3D.editor2DFocusScreenPoint, screenPoint))
        return;
    const center = computeFocusCenterWorld(designer3D, nodeId);
    if (!center)
        return;
    // Centre the EXACT field when we know its screen position; else the node centre.
    const focusTarget = screenPoint
        ? resolveFieldWorldTarget(designer3D, true, designer3D.e2Camera.position, screenPoint, center, _fieldWorldOut)
        : _fieldWorldOut.copy(center);
    const tx = focusTarget.x;
    const ty = focusTarget.y;
    const tz = focusTarget.z;
    designer3D.editor2DFocusNodeId = nodeId;
    designer3D.editor2DFocusScreenPoint = screenPoint;
    animateEditor2DCameraTo(designer3D, tx, ty, tz, targetZoom);
};
/** Drop the editor2D dimension-focus without animating (view / context gone). */
const clearEditor2DCameraFocus = (designer3D) => {
    if (!designer3D.editor2DFocusTween && designer3D.editor2DFocusNodeId === null)
        return;
    if (designer3D.editor2DFocusTween) {
        designer3D.editor2DFocusTween.kill();
        designer3D.editor2DFocusTween = null;
    }
    designer3D.editor2DFocusNodeId = null;
    designer3D.editor2DFocusScreenPoint = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
};
/**
 * Pan + zoom the ortho `e2Camera` to a world centre over one GSAP timeline. Panning an
 * arbitrarily-oriented ortho camera = move `controls.target` AND `e2Camera.position` by the SAME
 * delta (so the facing direction is preserved); `zoom` tweens on the camera and needs
 * `updateProjectionMatrix` each tick. `onChangeControls` republishes `e2CameraData` every frame so
 * the HTML overlays track the pan. Controls are locked for the tween.
 */
const animateEditor2DCameraTo = (designer3D, cx, cy, cz, targetZoom) => {
    designer3D.editor2DFocusTween?.kill();
    designer3D.controls.enabled = false;
    const cam = designer3D.e2Camera;
    const target = designer3D.controls.target;
    // Delta read at creation time — the destinations below bake it in before GSAP mutates anything.
    const dx = cx - target.x;
    const dy = cy - target.y;
    const dz = cz - target.z;
    designer3D.editor2DFocusTween = gsap.timeline({
        onUpdate: () => {
            cam.updateProjectionMatrix();
            designer3D.onChangeControls();
            designer3D.requestRender();
        },
        onComplete: () => onEditor2DFocusSettled(designer3D)
    });
    designer3D.editor2DFocusTween
        .to(target, { x: cx, y: cy, z: cz, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0)
        .to(cam.position, {
        x: cam.position.x + dx,
        y: cam.position.y + dy,
        z: cam.position.z + dz,
        duration: CAMERA_FOCUS_DURATION,
        ease: CAMERA_FOCUS_EASE
    }, 0)
        .to(cam, { zoom: targetZoom, duration: CAMERA_FOCUS_DURATION, ease: CAMERA_FOCUS_EASE }, 0);
    designer3D.requestRender();
};
/** Tween-complete for the editor2D focus — re-enable controls, sync, publish. */
const onEditor2DFocusSettled = (designer3D) => {
    designer3D.editor2DFocusTween = null;
    designer3D.controls.enabled = !designer3D.core.draggedNodeId.peek();
    designer3D.controls.update();
    designer3D.onChangeControls();
    designer3D.requestRender();
};
/**
 * Kill any in-flight focus tweens on teardown, so their onUpdate/onComplete
 * callbacks never fire against already-disposed controls + engine. Called from
 * `AreaDesigner3D.dispose()`.
 */
const disposeCameraFocus = (designer3D) => {
    if (designer3D.cameraFocusTween) {
        designer3D.cameraFocusTween.kill();
        designer3D.cameraFocusTween = null;
    }
    // M3D-309: kill the floorplan ortho-focus tween too, else its onUpdate/onComplete
    // would fire on already-disposed controls + engine after teardown.
    if (designer3D.floorplanFocusTween) {
        designer3D.floorplanFocusTween.kill();
        designer3D.floorplanFocusTween = null;
    }
    // ...and the editor3D perspective dimension-focus tween (same teardown-safety reason).
    if (designer3D.editor3DFocusTween) {
        designer3D.editor3DFocusTween.kill();
        designer3D.editor3DFocusTween = null;
    }
    // ...and the editor2D ortho dimension-focus tween.
    if (designer3D.editor2DFocusTween) {
        designer3D.editor2DFocusTween.kill();
        designer3D.editor2DFocusTween = null;
    }
};

const THREE_3D_STYLE = 'background: #d704eaff; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;';
const threeLog = console.log.bind(console, '%c[DESIGNER 3D]', THREE_3D_STYLE);

// Add the extension functions
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;
BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
BatchedMesh.prototype.raycast = acceleratedRaycast;
var LAYERS;
(function (LAYERS) {
    LAYERS[LAYERS["RENDER"] = 0] = "RENDER";
    LAYERS[LAYERS["RAYCAST"] = 1] = "RAYCAST";
    LAYERS[LAYERS["BW"] = 2] = "BW";
})(LAYERS || (LAYERS = {}));
const renderLayers = new Layers();
renderLayers.set(LAYERS.RENDER);
const raycastLayers = new Layers();
raycastLayers.set(LAYERS.RAYCAST);
const raycasterCreate = () => {
    const raycaster = new Raycaster();
    raycaster.layers = raycastLayers;
    raycaster.firstHitOnly = true;
    return raycaster;
};

/**
 * Aspect-correct output size for a captured view: the longest side is exactly
 * `maxSize` px and the shorter side keeps the source aspect ratio (rounded, and
 * floored at 1 px so a very thin source never collapses to 0). Extracted from
 * `createViews.ts` so the rounding / min / square edge cases are unit-testable.
 *
 * `width`/`height` are the source (designer-inch) extents; the result is in pixels.
 */
const computeAspectFitSize = (width, height, maxSize) => {
    if (width >= height) {
        return { outW: maxSize, outH: Math.max(1, Math.round(maxSize * (height / width))) };
    }
    return { outW: Math.max(1, Math.round(maxSize * (width / height))), outH: maxSize };
};

/**
 * Route a dimension line into the paperspace bucket that matches its actual on-image position.
 *
 * `top` / `bottom` carry horizontal lines (image `u` varies, `v` roughly constant); `left` /
 * `right` carry vertical lines (image `v` varies, `u` roughly constant). Which bucket a
 * dimension belongs to depends on orientation AND which side of the room polygon its midpoint
 * lies on:
 *
 *   - Horizontal line above the room centre (smaller `v`) → `top`
 *   - Horizontal line below the room centre (larger `v`)  → `bottom`
 *   - Vertical line left of the room centre  (smaller `u`) → `left`
 *   - Vertical line right of the room centre (larger `u`)  → `right`
 *
 * Room centre is passed in image-pixel space, not derived from the image dimensions — the room
 * polygon can sit off-centre in a padded framed image, and using the actual polygon centre
 * keeps the routing correct in that case. Callers typically compute it as the average of the
 * four projected room-polygon corners (`rootVertices`).
 *
 * The orientation test compares `|Δv|` vs. `|Δu|`. Exactly-diagonal lines fall through the
 * `<` in `isHorizontal` (`Δv >= Δu` classifies as vertical) — no realistic dimension line is
 * diagonal in a plan view, so this is a defensive rather than load-bearing choice. A line
 * whose midpoint sits exactly on the room-centre axis takes the FALSE branch of the strict
 * `<`: horizontal-on-centre → `bottom`, vertical-on-centre → `right`. Deterministic and
 * stable across renders; documented so a future switch to `<=` fails the tie-break test
 * intentionally.
 */
const bucketDimension = (from, to, roomCentre) => {
    const isHorizontal = Math.abs(from.v - to.v) < Math.abs(from.u - to.u);
    const midU = (from.u + to.u) / 2;
    const midV = (from.v + to.v) / 2;
    if (isHorizontal)
        return midV < roomCentre.v ? 'top' : 'bottom';
    return midU < roomCentre.u ? 'left' : 'right';
};

/**
 * The wall a closet backs against: among `walls`, the nearest one whose direction
 * is (anti)parallel to the closet's floor width axis.
 *
 *  - `axisX` is the closet's width axis on the floor, expected normalized.
 *  - A wall is rejected when `|dir · axisX| < parallelMin` — i.e. it runs across
 *    the closet rather than along its back (rejects the room's perpendicular
 *    side walls); `parallelMin` near 1 means "nearly parallel".
 *  - Among the parallel candidates, the one with the smallest perpendicular
 *    distance from `center` to its (infinite) line wins.
 *
 * Returns the winning `wallId`, or `undefined` when no wall qualifies (degenerate
 * walls of near-zero length are skipped). Pure — allocates only small scalars.
 */
const findBackingWall = (center, axisX, walls, parallelMin) => {
    let bestWallId;
    let bestDist = Infinity;
    for (const wall of walls) {
        let dirX = wall.toX - wall.fromX;
        let dirZ = wall.toZ - wall.fromZ;
        const len = Math.hypot(dirX, dirZ);
        if (len < 1e-3)
            continue; // degenerate segment
        dirX /= len;
        dirZ /= len;
        // Reject walls that aren't (anti)parallel to the closet's width axis.
        if (Math.abs(dirX * axisX.x + dirZ * axisX.z) < parallelMin)
            continue;
        // Perpendicular distance from `center` to the infinite line through the wall:
        // project (center - from) onto dir, subtract to get the perpendicular component.
        const px = center.x - wall.fromX;
        const pz = center.z - wall.fromZ;
        const along = px * dirX + pz * dirZ;
        const perpX = px - along * dirX;
        const perpZ = pz - along * dirZ;
        const dist = Math.hypot(perpX, perpZ);
        if (dist < bestDist) {
            bestDist = dist;
            bestWallId = wall.wallId;
        }
    }
    return bestWallId;
};

/**
 * Pure geometry for the wall-elevation "breakdown" ruler — the continuous
 * left→right band under a wall that labels every span across it (sections,
 * separators, other wall-mounted obstacles, and the empty gaps between them).
 *
 * Extracted from `createViews.ts` (the wall-elevation view builder) so the
 * overlap/gap/clamp logic — the part most prone to off-by-one and
 * double-labelling bugs — is unit-testable without a WebGPU renderer or a live
 * scene. The caller still owns collecting the intervals (matrix math + node
 * traversal); this owns turning them into non-overlapping segments.
 */
/**
 * Walk the intervals left→right across `[wallMinX, wallMaxX]`, filling the gaps
 * between them and skipping / clamping overlaps, to produce one continuous,
 * non-overlapping breakdown that sums to the wall width.
 *
 * Rules (order-independent — the intervals are sorted here):
 *  - a `gap` segment is emitted wherever the cursor hasn't reached the next
 *    interval's left edge (starting from the wall's left edge);
 *  - an interval fully behind the cursor (already covered) is skipped, so an
 *    obstacle overlapping a section — or a separator sharing a section's extent —
 *    never emits a duplicate span or breaks the sum-to-width;
 *  - a partial overlap is clamped to the cursor so it contributes only its
 *    uncovered remainder (its `labelInches` still applies to that segment);
 *  - an interval overhanging `wallMaxX` (from float drift in the caller's
 *    world→wall-local projection, or an obstacle bounding-box that spills past
 *    the wall end) is clamped to `wallMaxX`, and one starting past `wallMaxX`
 *    is dropped — so the segments never overshoot the wall's right edge;
 *  - a trailing `gap` closes the run to `wallMaxX`.
 *
 * Pure: does not mutate `intervals`.
 */
const buildWallBreakdownSegments = (intervals, wallMinX, wallMaxX) => {
    const sorted = [...intervals].sort((a, b) => a.leftX - b.leftX);
    const segments = [];
    let cursor = wallMinX;
    for (const iv of sorted) {
        // Wall already covered end-to-end → nothing past the right edge can contribute.
        if (cursor >= wallMaxX)
            break;
        // Fully behind the cursor → already covered by an earlier interval.
        if (iv.rightX <= cursor)
            continue;
        // Clamp the start to the cursor (partial overlap contributes only its remainder) and to
        // the wall's right edge, so an interval starting past `wallMaxX` can't emit an overshooting gap.
        const segLeft = Math.min(Math.max(iv.leftX, cursor), wallMaxX);
        // Uncovered space before this interval → a gap (already clamped to the wall via `segLeft`).
        if (segLeft > cursor) {
            segments.push({ leftX: cursor, rightX: segLeft, inches: segLeft - cursor, kind: 'gap' });
        }
        // Clamp the end to the wall's right edge so a right-overhanging interval stays within bounds.
        const segRight = Math.min(iv.rightX, wallMaxX);
        if (segRight > segLeft) {
            segments.push({
                leftX: segLeft,
                rightX: segRight,
                inches: iv.labelInches ?? segRight - segLeft,
                kind: iv.kind
            });
        }
        cursor = Math.min(iv.rightX, wallMaxX);
    }
    // Trailing gap to the wall's right edge.
    if (wallMaxX > cursor) {
        segments.push({ leftX: cursor, rightX: wallMaxX, inches: wallMaxX - cursor, kind: 'gap' });
    }
    return segments;
};

// Longest-side pixel size of the createView output; the shorter side keeps the
// node's aspect ratio.
const CREATE_VIEW_MAX_SIZE = 1000;
// Small frustum padding so contour lines are not clipped at the very edge.
const CREATE_VIEW_PADDING = 1;
// Default ortho camera back-off distance (designer inches) for the
// 'multiClosetItem' paperspace view, mirroring the legacy wall view's
// `settings.wallDistance` / `cameraDistanceFromWall` (both defaulted to 30).
const MULTICLOSET_ITEM_WALL_DISTANCE = 30;
// Height (designer inches) the floor-plan camera sits above the floor centre.
// Ortho depth is linear, so this only governs clipping: large enough to clear
// the tallest closet/wall, with the far plane (2x) reaching the floor below.
const PLAN_CAMERA_HEIGHT = 10000;
// IView scalar defaults taken from the persisted paperspace schema (see the
// per-view `fontSize` / `extraSpace` in the paperspace mock data).
const CREATE_VIEW_FONT_SIZE = 24;
const CREATE_VIEW_EXTRA_SPACE_MARGIN = 10;
// Reused math scratch. These paths are user-triggered, never on the render loop,
// but kept allocation-free per the project performance rules.
const _exportLocalBox = new Box3();
const _exportBoxSize = new Vector3();
const _exportCenterLocal = new Vector3();
const _exportCenterWorld = new Vector3();
const _exportFrontDir = new Vector3();
const _exportUp = new Vector3();
const _exportPrevClearColor = new Color();
// Scratch for the (synchronous) projection helpers; reused per-point so the
// annotation build stays allocation-free. Safe across concurrent builders:
// projectToImage / worldToContentXY never await, so each runs to completion.
const _exportProjectVec = new Vector3();
// Separate scratch for building a world point from local coords, so it survives
// the in-place mutation that projectToImage performs on `_exportProjectVec`.
const _exportProjectVec2 = new Vector3();
const _exportSectionWorldBox = new Box3();
const _exportSectionLocalBox = new Box3();
// Floor-view scratch, reused only inside the synchronous footprint-projection
// loop of createMultiClosetFloorView (no awaits there → safe to share).
const _exportFloorBox = new Box3();
const _exportFloorItemBox = new Box3();
/**
 * Encode RGBA pixel data to a PNG Blob, preferring OffscreenCanvas (available in
 * the iPad WKWebView target on the supported iPadOS baseline) and falling back
 * to a detached HTMLCanvasElement for older/web environments.
 */
const toPngBlob = async (imageData, width, height) => {
    if (typeof OffscreenCanvas !== 'undefined') {
        const offscreen = new OffscreenCanvas(width, height);
        const ctx = offscreen.getContext('2d');
        if (!ctx)
            throw new Error('createView: 2D context unavailable on OffscreenCanvas');
        ctx.putImageData(imageData, 0, 0);
        return offscreen.convertToBlob({ type: 'image/png' });
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('createView: 2D context unavailable on canvas');
    ctx.putImageData(imageData, 0, 0);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('createView: toBlob returned null'))), 'image/png');
    });
};
/**
 * Read a Blob back as a base64 `data:` URL. Used to embed the rendered PNG into
 * `IView.imageUrl`, which the paperspace layer consumes as an image source
 * (matching the persisted `data:image/png;base64,…` format). Works for both the
 * OffscreenCanvas and HTMLCanvasElement blobs produced by {@link toPngBlob}.
 */
const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('createView: FileReader failed'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
});
/**
 * Project a world-space point into the rendered image's pixel space.
 * Mirrors VESTA's `projectWallPoint`: world → NDC via `viewProjection`, then
 * NDC → pixels with a top-left origin (`u ∈ [0, pixelW]`, `v ∈ [0, pixelH]`,
 * v growing downward). `applyMatrix4` performs the perspective divide, which is
 * a no-op for the orthographic capture camera (w = 1) but keeps this correct
 * for any future perspective view.
 */
const projectToImage = (world, viewProjection, pixelW, pixelH) => {
    _exportProjectVec.copy(world).applyMatrix4(viewProjection);
    return {
        u: (_exportProjectVec.x * 0.5 + 0.5) * pixelW,
        v: (0.5 - _exportProjectVec.y * 0.5) * pixelH
    };
};
/**
 * Convert a world-space point into the node's local content frame (designer
 * inches), via the inverse of the capture-time group world matrix. `x`/`y` are
 * the local X/Y used by `pointView` alongside the image-pixel `u`/`v`.
 */
const worldToContentXY = (world, invGroup) => {
    _exportProjectVec.copy(world).applyMatrix4(invGroup);
    return { x: _exportProjectVec.x, y: _exportProjectVec.y };
};
/**
 * Render a single node face-on into a base64 PNG data URL plus the framing
 * metadata needed to describe it as a paperspace view (see {@link RenderedNodeImage}).
 *
 * The node is framed through a dedicated orthographic camera. The camera looks
 * along the node group's local +Z with local +Y as up, mirroring how `editor2D`
 * frames a wall (see `fitEditor2DCameraToWall`), but with the output dimensions
 * chosen here rather than driven by the on-screen canvas: the longest side is
 * `opts.maxSize` px and the shorter side keeps the node's aspect ratio. The
 * camera back-off distance comes from `opts.wallDistance` (the legacy wall
 * view's `settings.wallDistance`), clamped so the node never clips the near plane.
 *
 * Two passes are rendered into a throwaway offscreen `RenderTarget` on the
 * **existing** engine renderer (no second WebGPU device — safer for the 8 GB
 * memory floor): a flat-white face fill on `LAYERS.RENDER` (which writes depth),
 * then the black contour edges on `LAYERS.BW` depth-tested against it. The
 * renderer's transient render-target/clear state and the scene background are
 * saved and restored, and the target is disposed, so the on-screen view is
 * untouched after the trailing `requestRender()`.
 *
 * Today this works for any node whose `NodeView` group carries BW contour
 * lines (multiCloset, panels, walls, floors, …).
 *
 * NOTE: this stays `async` — `readRenderTargetPixelsAsync` is the only pixel
 * readback the unified `WebGPURenderer` exposes (WebGPU maps a GPU buffer back
 * to the CPU asynchronously; there is no synchronous equivalent).
 */
async function renderNodeImage(designer3D, nodeId, opts) {
    const nodeView = designer3D.nodes.get(nodeId);
    if (!nodeView)
        throw new Error(`createView: no NodeView for ${nodeId}`);
    const group = nodeView.group;
    group.updateMatrixWorld(true);
    // Framing differs per projection; the image render + readback below are shared.
    const projection = opts.projection ?? 'elevation';
    const maxSize = opts.maxSize;
    let width;
    let height;
    if (projection === 'plan') {
        // Top-down (floor plan): frame the WORLD AABB on the X/Z plane — width = world X span,
        // height = world Z span. The full scene renders through this camera, so walls and items
        // above the floor appear from above. Prefer `planBoxOverride` (the tight room-polygon AABB);
        // fall back to `setFromObject(group)` which recurses past the room polygon (see the option
        // doc) and mis-sizes / off-centres the framed floor.
        if (opts.planBoxOverride) {
            _exportLocalBox.copy(opts.planBoxOverride);
        }
        else {
            _exportLocalBox.setFromObject(group);
        }
        if (_exportLocalBox.isEmpty())
            throw new Error(`createView: node ${nodeId} has no renderable geometry`);
        _exportLocalBox.getSize(_exportBoxSize);
        width = _exportBoxSize.x;
        height = _exportBoxSize.z;
        if (width <= 0 || height <= 0)
            throw new Error(`createView: node ${nodeId} has degenerate bounds`);
        _exportLocalBox.getCenter(_exportCenterWorld);
    }
    else {
        // Elevation (face-on): LOCAL-frame bounds of everything rendered under the
        // node, so width = local X, height = local Y, depth = local Z.
        //
        // Callers can pass `elevationBoxOverride` to frame against a nominal
        // envelope (e.g. `item.size`) instead of the mesh AABB. The mesh AABB
        // includes panel/backing/separator geometry that extends beyond the
        // nominal envelope; framing to it pushes the camera centre off-axis and
        // leaves an asymmetric empty strip on the side(s) where the overshoot lives.
        if (opts.elevationBoxOverride) {
            _exportLocalBox.copy(opts.elevationBoxOverride);
        }
        else {
            computeNodeLocalBox(group, _exportLocalBox);
        }
        if (_exportLocalBox.isEmpty())
            throw new Error(`createView: node ${nodeId} has no renderable geometry`);
        _exportLocalBox.getSize(_exportBoxSize);
        width = _exportBoxSize.x;
        height = _exportBoxSize.y;
        if (width <= 0 || height <= 0)
            throw new Error(`createView: node ${nodeId} has degenerate bounds`);
        _exportLocalBox.getCenter(_exportCenterLocal);
        _exportCenterWorld.copy(_exportCenterLocal).applyMatrix4(group.matrixWorld);
        _exportFrontDir.set(0, 0, 1).transformDirection(group.matrixWorld);
        _exportUp.set(0, 1, 0).transformDirection(group.matrixWorld);
    }
    // Aspect-correct output: longest side = maxSize, shorter side proportional.
    const { outW, outH } = computeAspectFitSize(width, height, maxSize);
    // Orthographic camera framed to the node (ortho size is fixed by the frustum;
    // the back-off distance only affects clipping). Its layer is switched per
    // render pass below (RENDER for the white face fill, then BW for the edges).
    const halfW = (width / 2) * CREATE_VIEW_PADDING;
    const halfH = (height / 2) * CREATE_VIEW_PADDING;
    let camera;
    if (projection === 'plan') {
        // Look straight down (-Y). up = world -Z keeps view-dir and up orthogonal
        // (no lookAt degeneracy), mapping world +X → image right and +Z → image
        // down. Ortho depth is linear, so a large back-off only affects clipping:
        // sit well above the floor with the far plane past everything below.
        camera = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, PLAN_CAMERA_HEIGHT * 2);
        camera.position.set(_exportCenterWorld.x, _exportCenterWorld.y + PLAN_CAMERA_HEIGHT, _exportCenterWorld.z);
        camera.up.set(0, 0, -1);
        camera.lookAt(_exportCenterWorld);
    }
    else {
        // Face-on: back off along the node's world +Z by `offset`, never closer
        // than half the node depth (+bias) so the front never clips the near plane.
        const depth = _exportBoxSize.z;
        const offset = Math.max(opts.wallDistance, depth / 2 + 0.1);
        camera = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, offset * 2 + depth);
        camera.position.copy(_exportCenterWorld).addScaledVector(_exportFrontDir, offset);
        camera.up.copy(_exportUp);
        camera.lookAt(_exportCenterWorld);
    }
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    // Snapshot the projection metadata NOW, before the async pixel readback.
    // `_exportLocalBox` is module scratch and `group.matrixWorld` can change, so
    // clone them here while they are still valid for this capture. (createViews
    // serialises its builders, so renders no longer overlap, but cloning up front
    // keeps this method self-contained.) One-shot path — a few matrix clones are
    // well within budget.
    const viewProjection = camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse);
    const groupMatrixWorld = group.matrixWorld.clone();
    const localBox = _exportLocalBox.clone();
    // Uniform px-per-inch: outW spans the padded content width (width * padding).
    const dpi = outW / (width * CREATE_VIEW_PADDING);
    // Render through the existing renderer into a throwaway transparent target.
    const renderer = designer3D.engine.renderer;
    const target = new RenderTarget(outW, outH, { depthBuffer: true });
    const prevTarget = renderer.getRenderTarget();
    // getClearColor writes into a `Color4` (r/g/b/a); we only read back r/g/b via
    // setClearColor and restore alpha from getClearAlpha, so a plain Color scratch
    // is sufficient. Color4 is not exported from the three/webgpu types, hence the
    // structural cast to the method's own parameter type.
    renderer.getClearColor(_exportPrevClearColor);
    const prevClearAlpha = renderer.getClearAlpha();
    const prevBackground = designer3D.scene.background;
    const prevAutoClear = renderer.autoClear;
    const prevOverrideMaterial = designer3D.scene.overrideMaterial;
    // Flat white look for the face fill. polygonOffset (+1/+1, see service.ts)
    // pushes faces away from the camera in depth so the coincident black contour
    // edges (offset -1/-1) win without z-fighting.
    const whiteMaterial = designer3D.storage.get('looks').obj.service.white.material;
    // Plan (top-down) sees through the ceiling plane, but anything MOUNTED on the ceiling — light
    // fixtures, ceiling appliances — is a real mesh subtree that projects down into the floor image.
    // Hide every `Ceiling2D` group for the render, restore in `finally`. Group visibility propagates
    // through Three.js parent-child, so hiding the `Ceiling2D` group also hides its mounted children
    // (Item + MountPlane + Model + PointLight/SpotLight subtrees). Gated on `plan` only.
    const ceilingVisibilityBackup = [];
    if (projection === 'plan') {
        for (const nodeView of designer3D.nodes.values()) {
            if (nodeView.type !== NodeType.Ceiling2D)
                continue;
            ceilingVisibilityBackup.push({ group: nodeView.group, wasVisible: nodeView.group.visible });
            nodeView.group.visible = false;
        }
    }
    let pixels;
    try {
        // Opaque white background: nulling scene.background makes the renderer clear
        // with the clear color, which we set to solid white.
        designer3D.scene.background = null;
        renderer.setRenderTarget(target);
        renderer.setClearColor(0xffffff, 1);
        // Pass 1 — white face fill on the main render layer. overrideMaterial forces
        // every rendered mesh to the flat white look; the depth it writes is what
        // makes contour edges behind a nearer face get occluded in pass 2. autoClear
        // clears the white background + depth here. The engine renderer is already
        // initialized (it drives the live view), so the non-deprecated synchronous
        // render() enqueues the draw (renderAsync() is deprecated).
        camera.layers.set(LAYERS.RENDER);
        designer3D.scene.overrideMaterial = whiteMaterial;
        renderer.autoClear = true;
        renderer.render(designer3D.scene, camera);
        // Pass 2 — black contour edges on the BW layer, depth-tested against the
        // white faces from pass 1. Disable autoClear so the color + depth buffers
        // from pass 1 are preserved (no clear between passes).
        designer3D.scene.overrideMaterial = null;
        camera.layers.set(LAYERS.BW);
        renderer.autoClear = false;
        renderer.render(designer3D.scene, camera);
        pixels = (await renderer.readRenderTargetPixelsAsync(target, 0, 0, outW, outH));
    }
    finally {
        designer3D.scene.overrideMaterial = prevOverrideMaterial;
        renderer.autoClear = prevAutoClear;
        designer3D.scene.background = prevBackground;
        renderer.setRenderTarget(prevTarget);
        renderer.setClearColor(_exportPrevClearColor, prevClearAlpha);
        target.dispose();
        // Restore every Ceiling2D group's original visibility. Only populated on the plan path —
        // the array is empty otherwise, so this loop is a no-op for elevation renders.
        for (const { group: ceilingGroup, wasVisible } of ceilingVisibilityBackup) {
            ceilingGroup.visible = wasVisible;
        }
        // We borrowed the renderer's target/clear state — repaint the live view.
        designer3D.requestRender();
    }
    // Repack the readback into a tightly-packed, top-left-origin RGBA buffer.
    // Row STRIDE: the WebGPU backend pads each source row to a 256-byte boundary
    // (copyTextureToBuffer: bytesPerRow = ceil(width*4 / 256) * 256) and returns
    // the buffer WITHOUT unpadding it, so the source stride can exceed the tight
    // row width. The WebGL2 fallback returns tightly-packed rows. Detect which by
    // the buffer length, then copy only the tight row bytes into the output.
    // Row ORDER: WebGPU render targets are top-left origin (row 0 = top) → copy
    // as-is; the WebGL2 fallback reads back bottom-left (row 0 = bottom) → flip.
    const tightRow = outW * 4;
    const alignedRow = Math.ceil(tightRow / 256) * 256;
    const srcStride = alignedRow > tightRow && pixels.length >= (outH - 1) * alignedRow + tightRow ? alignedRow : tightRow;
    const flipY = renderer.coordinateSystem === WebGLCoordinateSystem;
    const out = new Uint8ClampedArray(tightRow * outH);
    for (let y = 0; y < outH; y++) {
        const srcStart = (flipY ? outH - 1 - y : y) * srcStride;
        out.set(pixels.subarray(srcStart, srcStart + tightRow), y * tightRow);
    }
    const dataUrl = await blobToDataUrl(await toPngBlob(new ImageData(out, outW, outH), outW, outH));
    return {
        dataUrl,
        pixelWidth: outW,
        pixelHeight: outH,
        contentWidth: width,
        contentHeight: height,
        cameraMatrix: camera.matrixWorld.toArray(),
        viewProjection,
        groupMatrixWorld,
        localBox,
        dpi
    };
}
/**
 * Build the `'multiClosetItem'` paperspace {@link IView} from a multiCloset
 * Item: renders the face-on black-and-white image and assembles the view
 * descriptor around it. `wallDistance` is threaded into both the camera framing
 * and `settings`, mirroring how wall views use it.
 *
 * `rulerLines` carries overall-only measurements (one bottom = total width,
 * one left = total height). `dimensions` carries the projected item bounds
 * (`root`) plus one `itemView` per section, all bucketed under the closet's own
 * `multiClosetType`. All `from`/`to`/`u`/`v` coordinates are in image-pixel
 * space (top-left origin), matching the existing `'wall'` view. Remaining
 * annotation shape maps stay empty.
 */
// Parallelism gate (|dot| of unit direction vectors) for matching a floor-standing closet to
// the room wall it backs onto — reject walls more than ~20° off the closet's width axis.
const BACKING_WALL_PARALLEL_MIN = 0.94;
const _wallFindCenter = new Vector3();
const _wallFindAxisX = new Vector3();
/**
 * Resolve the `Wall2D` a multiCloset backs onto, GEOMETRICALLY. Wall-mounted closets reach their
 * wall via the mount chain (`Item → MountPlane → Wall2D`), but floor-standing closets mount on
 * the `Floor2D`, so the wall is not an ancestor. The closet sits flush against one room wall,
 * running along it: pick the room `RoomSegment` whose line is (roughly) parallel to the closet's
 * width axis and nearest its footprint centre, and return that segment's `wall2D`. Returns
 * `undefined` for a genuinely free-standing closet (no parallel wall). Synchronous — safe to run
 * before the async render.
 *
 * This resolves the closet footprint + room walls from the graph, then delegates the
 * (anti)parallel-reject + nearest-perpendicular pick to the pure {@link findBackingWall}.
 */
function resolveBackingWall2DId(designer3D, nodeId) {
    const itemGroup = designer3D.nodes.get(nodeId)?.group;
    if (!itemGroup)
        return undefined;
    itemGroup.updateMatrixWorld(true);
    const item = getItem(designer3D.core, nodeId);
    // Footprint centre (local origin is the back-left corner: [0,sx]×[0,sz]) and width axis
    // (local +X), both flattened onto the floor plane (world XZ).
    _wallFindCenter.set(item.size.x.get() / 2, 0, item.size.z.get() / 2).applyMatrix4(itemGroup.matrixWorld);
    _wallFindAxisX.set(1, 0, 0).transformDirection(itemGroup.matrixWorld);
    _wallFindAxisX.y = 0;
    if (_wallFindAxisX.lengthSq() < 1e-6)
        return undefined;
    _wallFindAxisX.normalize();
    const room = getRoom(designer3D.core, getParentRoom(designer3D.core, nodeId).id);
    const walls = [];
    for (const segId of room.path.get()) {
        const seg = getRoomSegment(designer3D.core, segId);
        const wallId = seg.wall2D.get();
        if (!wallId)
            continue;
        // Point.position lives on the floor plane: x = world X, y = world Z.
        const fromPt = getPoint$1(designer3D.core, seg.from.get());
        const toPt = getPoint$1(designer3D.core, seg.to.get());
        walls.push({
            wallId,
            fromX: fromPt.position.x.get(),
            fromZ: fromPt.position.y.get(),
            toX: toPt.position.x.get(),
            toZ: toPt.position.y.get()
        });
    }
    return findBackingWall({ x: _wallFindCenter.x, z: _wallFindCenter.z }, { x: _wallFindAxisX.x, z: _wallFindAxisX.z }, walls, BACKING_WALL_PARALLEL_MIN);
}
async function createMultiClosetItemView(designer3D, nodeId, opts, wallNumber) {
    const wallDistance = opts?.wallDistance ?? MULTICLOSET_ITEM_WALL_DISTANCE;
    // Render subject: THE WALL, not the item. The "front view" is a wall-elevation drawing — the
    // wall is the subject and everything mounted on it (the target multiCloset, obstacles like
    // windows/doors, neighbouring systems) appears as scene content. `renderNodeImage(wall2D.id)`
    // frames the capture camera to the wall's own local geometry, so `image.groupMatrixWorld` is
    // the wall's world matrix and all ruler/dimension math below lives in the wall's local frame.
    // Free-standing / malformed cases (no wall reachable) fall back to the item's envelope.
    const item = getItem(designer3D.core, nodeId);
    const itemSizeX = item.size.x.get();
    const itemSizeY = item.size.y.get();
    const itemSizeZ = item.size.z.get();
    const itemGroup = designer3D.nodes.get(nodeId)?.group;
    if (itemGroup)
        itemGroup.updateMatrixWorld(true);
    // Wall resolution: geometric (robust across re-parenting from resize/move/customize) preferred,
    // parent-chain (`Item → MountPlane → Wall2D`) as a secondary path for the moment right after
    // creation when the geometric probe may see a not-yet-positioned item.
    const geometricWallId = resolveBackingWall2DId(designer3D, nodeId);
    const mount = getOptionalNode(designer3D.core, item.parent.get());
    const parentChainWall2D = mount && (mount.type === NodeType.MountPlane || mount.type === NodeType.MountLine)
        ? getOptionalNode(designer3D.core, mount.parent.get())
        : undefined;
    const parentChainWallId = parentChainWall2D?.type === NodeType.Wall2D ? parentChainWall2D.id : undefined;
    const resolvedWallId = geometricWallId ?? parentChainWallId;
    const wall2D = resolvedWallId ? getOptionalNode(designer3D.core, resolvedWallId) : undefined;
    const wallView = wall2D?.type === NodeType.Wall2D ? designer3D.nodes.get(wall2D.id) : undefined;
    const wallSegment = wall2D?.type === NodeType.Wall2D ? getRoomSegment(designer3D.core, wall2D.parent.get()) : undefined;
    // Wall's own local bounding box (same source `fitEditor2DCameraToWall` uses): min=(0,0,0),
    // max=(width, height, 0). Sizes the capture frame and anchors the wall total width/height dims.
    let wallOwnLocalBox = null;
    if (wallView && wallView.type === NodeType.Wall2D) {
        const wallMesh = wallView.mesh;
        wallMesh.updateMatrixWorld(true);
        const geo = wallMesh.geometry;
        if (!geo.boundingBox)
            geo.computeBoundingBox();
        const bb = geo.boundingBox;
        if (bb && !bb.isEmpty())
            wallOwnLocalBox = bb.clone();
    }
    // Prefer the wall as subject; frame the wall box padded on Z so anything mounted in front of
    // the wall (the item extends outward on the wall's +Z) isn't clipped. Fall back to the item.
    const renderSubjectId = wallOwnLocalBox && wall2D ? wall2D.id : nodeId;
    const elevationBoxOverride = wallOwnLocalBox
        ? new Box3(new Vector3(wallOwnLocalBox.min.x, wallOwnLocalBox.min.y, -itemSizeZ), new Vector3(wallOwnLocalBox.max.x, wallOwnLocalBox.max.y, itemSizeZ))
        : new Box3(new Vector3(0, 0, 0), new Vector3(itemSizeX, itemSizeY, itemSizeZ));
    const image = await renderNodeImage(designer3D, renderSubjectId, {
        maxSize: opts?.maxSize ?? CREATE_VIEW_MAX_SIZE,
        wallDistance,
        elevationBoxOverride
    });
    const uuid = generateId();
    const W = image.pixelWidth;
    const H = image.pixelHeight;
    const settings = {
        content: { offsetLeft: 0, offsetRight: 0, width: image.contentWidth, height: image.contentHeight },
        camera: image.cameraMatrix,
        wallDistance
    };
    // Dimension helpers. from/to live in image-pixel space (IPoint2d x/y = pixels); the measured
    // value is carried explicitly in `text` from nominal design values (`item.size`, `section.size`),
    // NOT the rendered mesh box which includes separator/contour panels beyond the nominal envelope.
    // The full `rulerLines` (breakdown + wall totals) is assembled after the section loop below.
    const makeDimension = (from, to, text) => ({
        uuid: generateId(),
        type: EShapeType.Dimension,
        viewID: uuid,
        from,
        to,
        isDragged: false,
        isAuto: true,
        text
    });
    // Round to 2 decimals; UI owns final unit formatting (refine later).
    const formatInches = (value) => `${Math.round(value * 100) / 100}`;
    // dimensions: root (item, 4 projected local-box corners) + each section as
    // an itemView. invGroup maps capture-time world points back to the item's
    // local content frame for pointView.x/y.
    const invGroup = image.groupMatrixWorld.clone().invert();
    const toPointView = (world) => ({
        ...projectToImage(world, image.viewProjection, W, H),
        ...worldToContentXY(world, invGroup)
    });
    // Local content point (inches) → world → pointView. Uses a dedicated scratch
    // (`_exportProjectVec2`) so the world point survives toPointView's reuse of
    // `_exportProjectVec`.
    const localToPointView = (lx, ly, lz) => toPointView(_exportProjectVec2.set(lx, ly, lz).applyMatrix4(image.groupMatrixWorld));
    const lb = image.localBox;
    const rootZ = (lb.min.z + lb.max.z) / 2;
    // Order: (minX,minY), (maxX,minY), (minX,maxY), (maxX,maxY).
    const rootVertices = [
        localToPointView(lb.min.x, lb.min.y, rootZ),
        localToPointView(lb.max.x, lb.min.y, rootZ),
        localToPointView(lb.min.x, lb.max.y, rootZ),
        localToPointView(lb.max.x, lb.max.y, rootZ)
    ];
    const sectionIds = item.sections.get();
    const sectionViews = [];
    // Per-section width dims — used only by the free-standing fallback ruler (no wall). The
    // wall-elevation path builds its own breakdown below from wall-local intervals.
    const sectionWidthDims = [];
    sectionIds.forEach((sectionId, i) => {
        const sectionGroup = designer3D.nodes.get(sectionId)?.group;
        if (!sectionGroup)
            return;
        _exportSectionWorldBox.setFromObject(sectionGroup);
        if (_exportSectionWorldBox.isEmpty())
            return;
        // World AABB → local frame so leftBottom/rightTop pick view-aligned corners
        // (local Y up → image v grows downward, so local min.y is the bottom).
        _exportSectionLocalBox.copy(_exportSectionWorldBox).applyMatrix4(invGroup);
        const sectionZ = (_exportSectionLocalBox.min.z + _exportSectionLocalBox.max.z) / 2;
        sectionViews.push({
            uuid: sectionId,
            leftBottom: localToPointView(_exportSectionLocalBox.min.x, _exportSectionLocalBox.min.y, sectionZ),
            rightTop: localToPointView(_exportSectionLocalBox.max.x, _exportSectionLocalBox.max.y, sectionZ),
            itemNumber: i + 1,
            name: '',
            MVName: ''
        });
        // Section width dim — nominal `size.x` (not the mesh AABB) so the label reads the design
        // value exactly. Inline on the line, placed at the image bottom (`y: H`). Skip a zero width.
        const section = getPart(designer3D.core, sectionId);
        const sectionWidthText = formatInches(section.size.x.get());
        if (sectionWidthText !== '0') {
            const leftU = localToPointView(_exportSectionLocalBox.min.x, 0, 0).u;
            const rightU = localToPointView(_exportSectionLocalBox.max.x, 0, 0).u;
            const sectionWidthDim = makeDimension({ x: leftU, y: H }, { x: rightU, y: H }, sectionWidthText);
            sectionWidthDim.labelInline = true;
            sectionWidthDims.push(sectionWidthDim);
        }
    });
    // ── Ruler assembly ──────────────────────────────────────────────────────────────────────
    // The image IS the wall, so `localToPointView(x, y, z)` interprets (x, y, z) in the WALL's
    // local frame: X = along wall, Y = up the wall, Z = wall normal.
    // Layer layout: bottom[0] = continuous breakdown (sections + separators + other wall items +
    // gaps); bottom[1] = overall wall width. Wall height is ALWAYS on `left`; the item height sits
    // on the wall edge (left or right) NEAREST the item — anchored on the wall like every other dim,
    // not floating at the item's own X — so it can land on either side.
    const bottomLayers = [];
    const leftLayers = [];
    const rightLayers = [];
    // Item's Y extent in wall-local — the vertical span for the item-height dim. Which wall edge it
    // sits on horizontally is decided below (on the wall), not by the item's own X.
    const _itemBottomWorld = _exportProjectVec2.set(0, 0, 0).clone().applyMatrix4(itemGroup.matrixWorld);
    const itemBottomPv = toPointView(_itemBottomWorld);
    const _itemTopWorld = _exportProjectVec2.set(0, itemSizeY, 0).clone().applyMatrix4(itemGroup.matrixWorld);
    const itemTopPv = toPointView(_itemTopWorld);
    if (wallOwnLocalBox) {
        const wallWidthInches = wallOwnLocalBox.max.x - wallOwnLocalBox.min.x;
        const wallHeightInches = wallOwnLocalBox.max.y - wallOwnLocalBox.min.y;
        const wallBottomV = localToPointView(0, wallOwnLocalBox.min.y, 0).v;
        const wallTopV = localToPointView(0, wallOwnLocalBox.max.y, 0).v;
        // Item height on the wall edge NEAREST the item (left or right), anchored on the wall — not at
        // the item's own X. Compare the item's along-wall centre to the wall centre; place the dim at
        // that wall edge with the item's own vertical span, and route it to that side's layer.
        const itemLeftLocalX = new Vector3().applyMatrix4(itemGroup.matrixWorld).applyMatrix4(invGroup).x;
        const itemRightLocalX = new Vector3(itemSizeX, 0, 0).applyMatrix4(itemGroup.matrixWorld).applyMatrix4(invGroup).x;
        const itemNearLeft = (itemLeftLocalX + itemRightLocalX) / 2 <= (wallOwnLocalBox.min.x + wallOwnLocalBox.max.x) / 2;
        const heightEdgeU = localToPointView(itemNearLeft ? wallOwnLocalBox.min.x : wallOwnLocalBox.max.x, 0, 0).u;
        const systemHeightDim = makeDimension({ x: heightEdgeU, y: itemTopPv.v }, { x: heightEdgeU, y: itemBottomPv.v }, formatInches(itemSizeY));
        systemHeightDim.labelInline = true;
        (itemNearLeft ? leftLayers : rightLayers).push([systemHeightDim]);
        // Every "thing" on the wall as an X-interval in wall-local coords, tagged with `kind`.
        // `labelInches` (when set) overrides the geometric width so section/separator labels read
        // the nominal design value; gaps/other fall back to the geometric width.
        const intervals = [];
        const _endpointA = new Vector3();
        const _endpointB = new Vector3();
        // 1) Target's sections — endpoints from the section's own world matrix + nominal size.x.
        for (const sectionId of item.sections.get()) {
            const sectionGroup = designer3D.nodes.get(sectionId)?.group;
            if (!sectionGroup)
                continue;
            sectionGroup.updateMatrixWorld(true);
            const section = getPart(designer3D.core, sectionId);
            const sectionWidth = section.size.x.get();
            if (sectionWidth <= 0)
                continue;
            _endpointA.set(0, 0, 0).applyMatrix4(sectionGroup.matrixWorld).applyMatrix4(invGroup);
            _endpointB.set(sectionWidth, 0, 0).applyMatrix4(sectionGroup.matrixWorld).applyMatrix4(invGroup);
            intervals.push({
                leftX: Math.min(_endpointA.x, _endpointB.x),
                rightX: Math.max(_endpointA.x, _endpointB.x),
                kind: 'section',
                labelInches: sectionWidth
            });
        }
        // 2) Target's separators — same nominal-endpoint approach.
        for (const separatorId of item.separators.get()) {
            const separatorGroup = designer3D.nodes.get(separatorId)?.group;
            if (!separatorGroup)
                continue;
            separatorGroup.updateMatrixWorld(true);
            const separator = getPart(designer3D.core, separatorId);
            const separatorWidth = separator.size.x.get();
            if (separatorWidth <= 0)
                continue;
            _endpointA.set(0, 0, 0).applyMatrix4(separatorGroup.matrixWorld).applyMatrix4(invGroup);
            _endpointB.set(separatorWidth, 0, 0).applyMatrix4(separatorGroup.matrixWorld).applyMatrix4(invGroup);
            intervals.push({
                leftX: Math.min(_endpointA.x, _endpointB.x),
                rightX: Math.max(_endpointA.x, _endpointB.x),
                kind: 'separator',
                labelInches: separatorWidth
            });
        }
        // 3) Other wall-mounted Items — obstacles / neighbour systems. Skip the target itself.
        if (wall2D) {
            const wallId = wall2D.id;
            for (const nodeView of designer3D.nodes.values()) {
                if (nodeView.type !== NodeType.Item)
                    continue;
                if (nodeView.id === nodeId)
                    continue;
                const coreNode = getOptionalNode(designer3D.core, nodeView.id);
                if (!coreNode)
                    continue;
                let hopId = coreNode.parent?.get() ?? null;
                let onWall = false;
                for (let hops = 0; hops < 4 && hopId; hops += 1) {
                    if (hopId === wallId) {
                        onWall = true;
                        break;
                    }
                    const parentNode = getOptionalNode(designer3D.core, hopId);
                    if (!parentNode)
                        break;
                    hopId = parentNode.parent?.get() ?? null;
                }
                if (!onWall)
                    continue;
                const otherGroup = nodeView.group;
                if (!otherGroup)
                    continue;
                otherGroup.updateMatrixWorld(true);
                const otherWorldBox = new Box3().setFromObject(otherGroup);
                if (otherWorldBox.isEmpty())
                    continue;
                const otherLocalBox = otherWorldBox.applyMatrix4(invGroup);
                intervals.push({
                    leftX: Math.min(otherLocalBox.min.x, otherLocalBox.max.x),
                    rightX: Math.max(otherLocalBox.min.x, otherLocalBox.max.x),
                    kind: 'other'
                });
            }
        }
        // Resolve the raw intervals into one continuous, non-overlapping breakdown that
        // spans the wall (gaps filled, overlaps skipped/clamped). Pure + unit-tested —
        // see `buildWallBreakdownSegments`.
        const segments = buildWallBreakdownSegments(intervals, wallOwnLocalBox.min.x, wallOwnLocalBox.max.x);
        // Skip zero-width segments (e.g. a 0" gap where items abut) — an emitted plain "0" is noise.
        // Fractional sub-inch values (e.g. 0.75 → "0 3/4\"") are NOT zero and still render.
        const breakdownDims = segments
            .filter((seg) => formatInches(seg.inches) !== '0')
            .map((seg) => {
            const dim = makeDimension({ x: localToPointView(seg.leftX, 0, 0).u, y: H }, { x: localToPointView(seg.rightX, 0, 0).u, y: H }, formatInches(seg.inches));
            // Section / gap / other widths read INLINE on the line; thin separator thicknesses keep
            // the default offset so they float above the line, clear of the inline values.
            if (seg.kind !== 'separator')
                dim.labelInline = true;
            return dim;
        });
        if (breakdownDims.length > 0)
            bottomLayers.push(breakdownDims);
        // Overall wall height on `left`, anchored at wall-local X = 0. Inline like the rest.
        const wallHeightDim = makeDimension({ x: 0, y: wallTopV }, { x: 0, y: wallBottomV }, formatInches(wallHeightInches));
        wallHeightDim.labelInline = true;
        leftLayers.push([wallHeightDim]);
        // Overall wall width on `bottom`, layer [1] — outside the breakdown. Inline.
        const wallWidthDim = makeDimension({ x: localToPointView(wallOwnLocalBox.min.x, 0, 0).u, y: H }, { x: localToPointView(wallOwnLocalBox.max.x, 0, 0).u, y: H }, formatInches(wallWidthInches));
        wallWidthDim.labelInline = true;
        bottomLayers.push([wallWidthDim]);
    }
    else {
        // Free-standing target (no wall resolved) — item height at its own X on the left; per-section
        // widths + overall item width on the bottom.
        const freeHeightDim = makeDimension({ x: itemTopPv.u, y: itemTopPv.v }, { x: itemBottomPv.u, y: itemBottomPv.v }, formatInches(itemSizeY));
        freeHeightDim.labelInline = true;
        leftLayers.push([freeHeightDim]);
        if (sectionWidthDims.length > 0)
            bottomLayers.push(sectionWidthDims);
        const overallWidthDim = makeDimension({ x: localToPointView(0, 0, 0).u, y: H }, { x: localToPointView(itemSizeX, 0, 0).u, y: H }, formatInches(itemSizeX));
        overallWidthDim.labelInline = true;
        bottomLayers.push([overallWidthDim]);
    }
    const rulerLines = { top: [], bottom: bottomLayers, left: leftLayers, right: rightLayers };
    // The whole item has one multiClosetType; bucket every section under it.
    // multiClosetType is optional on the Item node → default 'base'.
    const closetType = item.multiClosetType?.get() ?? 'base';
    const cabinets = { upper: [], base: [], tall: [] };
    cabinets[closetType] = sectionViews;
    const dimensions = {
        dpi: image.dpi,
        root: {
            uuid: nodeId,
            type: 'multiClosetItem',
            vertices: rootVertices,
            walls: {}
        },
        cabinets,
        appliances: { upper: [], tall: [], base: [] },
        windows: [],
        doors: []
    };
    // Wall number for the view label (`RoomSegment.attributes['WallNumber']`, kept in sync by
    // `updateRoomSegmentWallNumbersEffect`). Reuse `wallSegment` resolved above — no re-walk.
    // Free-standing (floor-mounted) closets have `wallSegment === undefined` → fall back to the
    // system-position index passed in.
    const resolvedWallNumber = wallSegment !== undefined ? getAttributeValue(wallSegment, 'WallNumber') : wallNumber;
    return {
        uuid,
        viewType: 'multiClosetItem',
        label: resolvedWallNumber ? `Front view — Wall #${resolvedWallNumber}` : 'Front view',
        imageUrl: image.dataUrl,
        width: image.pixelWidth,
        height: image.pixelHeight,
        wallDistance,
        settings,
        rulerLines,
        dimensions,
        traces: {},
        texts: {},
        labels: {},
        lines: {},
        blocks: {},
        leaders: {},
        numbers: {},
        index: 0,
        rotation: 0,
        fontSize: CREATE_VIEW_FONT_SIZE,
        extraSpace: {
            top: CREATE_VIEW_EXTRA_SPACE_MARGIN,
            bottom: CREATE_VIEW_EXTRA_SPACE_MARGIN,
            left: CREATE_VIEW_EXTRA_SPACE_MARGIN,
            right: CREATE_VIEW_EXTRA_SPACE_MARGIN
        }
    };
}
/**
 * Build the top-down `'multiClosetFloor'` paperspace {@link IView} for one or
 * more multiCloset items sharing a room. Resolves the room from the first item
 * (via {@link getParentRoom}, which handles both wall- and floor-mounted
 * closets), frames that room's floor from above so the whole floor is in
 * frustum, and renders the scene (`projection: 'plan'`).
 *
 * `dimensions` is minimal (no room walls): `root` carries the projected floor
 * rectangle and each closet becomes an `itemView` in `cabinets[multiClosetType]`.
 * `rulerLines` carries, per closet, one bottom dimension (width = local X) and
 * one left dimension (depth = local Z); `from`/`to` are image-pixel space and
 * the measured inches are in `text`. A single (`'item'`) closet yields one
 * width + one depth; a `'system'` yields one pair per closet.
 */
async function createMultiClosetFloorView(designer3D, itemIds, opts) {
    const wallDistance = opts?.wallDistance ?? MULTICLOSET_ITEM_WALL_DISTANCE;
    const room = getRoom(designer3D.core, getParentRoom(designer3D.core, itemIds[0]).id);
    const floorId = room.floor2D.get();
    // Room-polygon AABB from the wall segments, computed BEFORE the render so it can frame the plan
    // camera as `planBoxOverride`. Without it the plan branch falls back to `setFromObject(floorGroup)`,
    // which recurses through cabinet meshes overshooting the room polygon and mis-sizes / off-centres
    // the framed floor. Walking `room.path` bounds only the wall endpoints — the true room polygon.
    _exportFloorBox.makeEmpty();
    for (const segId of room.path.get()) {
        const seg = getRoomSegment(designer3D.core, segId);
        const fromPt = getPoint$1(designer3D.core, seg.from.get());
        const toPt = getPoint$1(designer3D.core, seg.to.get());
        // Point.position is on the floor plane: x = world X, y = world Z. Y stays at 0.
        _exportProjectVec2.set(fromPt.position.x.get(), 0, fromPt.position.y.get());
        _exportFloorBox.expandByPoint(_exportProjectVec2);
        _exportProjectVec2.set(toPt.position.x.get(), 0, toPt.position.y.get());
        _exportFloorBox.expandByPoint(_exportProjectVec2);
    }
    const image = await renderNodeImage(designer3D, floorId, {
        maxSize: opts?.maxSize ?? CREATE_VIEW_MAX_SIZE,
        wallDistance,
        projection: 'plan',
        planBoxOverride: _exportFloorBox
    });
    const uuid = generateId();
    const W = image.pixelWidth;
    const H = image.pixelHeight;
    const settings = {
        content: { offsetLeft: 0, offsetRight: 0, width: image.contentWidth, height: image.contentHeight },
        camera: image.cameraMatrix,
        wallDistance
    };
    // World point → pointView. Top-down view: content x = world X, y = world Z.
    // Reads world.x/world.z after projectToImage, which only mutates the separate
    // `_exportProjectVec` scratch (callers pass `_exportProjectVec2`), so the
    // source point is intact.
    const toPointView = (world) => {
        const { u, v } = projectToImage(world, image.viewProjection, W, H);
        return { u, v, x: world.x, y: world.z };
    };
    const makeDimension = (from, to, text) => ({
        uuid: generateId(),
        type: EShapeType.Dimension,
        viewID: uuid,
        from,
        to,
        isDragged: false,
        isAuto: true,
        text
    });
    const formatInches = (value) => `${Math.round(value * 100) / 100}`;
    // root: 4 projected corners of the framed floor. `_exportFloorBox` was populated above (before
    // the render) from `room.path` and threaded into the plan camera as `planBoxOverride`, so the
    // image, the camera frustum, and these root vertices all refer to the same room-polygon AABB.
    const floorY = 0;
    const floorCorner = (fx, fz) => toPointView(_exportProjectVec2.set(fx, floorY, fz));
    const rootVertices = [
        floorCorner(_exportFloorBox.min.x, _exportFloorBox.min.z),
        floorCorner(_exportFloorBox.max.x, _exportFloorBox.min.z),
        floorCorner(_exportFloorBox.min.x, _exportFloorBox.max.z),
        floorCorner(_exportFloorBox.max.x, _exportFloorBox.max.z)
    ];
    const cabinets = { upper: [], base: [], tall: [] };
    const top = [];
    const bottom = [];
    const left = [];
    const right = [];
    // Room-polygon centre in IMAGE pixel space — average of the 4 projected room corners (stable
    // under ortho plan projection). `bucketDimension` uses it to route each edge to the correct side.
    const roomCentre = {
        u: (rootVertices[0].u + rootVertices[1].u + rootVertices[2].u + rootVertices[3].u) / 4,
        v: (rootVertices[0].v + rootVertices[1].v + rootVertices[2].v + rootVertices[3].v) / 4
    };
    const buckets = { top, bottom, left, right };
    itemIds.forEach((itemId, i) => {
        const group = designer3D.nodes.get(itemId)?.group;
        if (!group)
            return;
        group.updateMatrixWorld(true);
        computeNodeLocalBox(group, _exportFloorItemBox);
        if (_exportFloorItemBox.isEmpty())
            return;
        const item = getItem(designer3D.core, itemId);
        const sx = item.size.x.get();
        const sz = item.size.z.get();
        const cy = (_exportFloorItemBox.min.y + _exportFloorItemBox.max.y) / 2;
        // Footprint corners come from the nominal envelope (`item.size`), NOT
        // from the mesh AABB. The AABB includes panel/backing overshoot that
        // extends past the visible footprint; projecting AABB corners lands the
        // dimension lines (and the cabinet rectangle) outside the cabinet's
        // actual edges. The nominal envelope matches the dimension text.
        //
        // Assumes the group's local origin sits at the envelope's back-left
        // corner — local frame is `[0, sx] × [_, _] × [0, sz]`. If a future
        // closet type uses a centred frame, switch to `corner(±sx/2, ±sz/2)`.
        const corner = (lx, lz) => toPointView(_exportProjectVec2.set(lx, cy, lz).applyMatrix4(group.matrixWorld));
        const c00 = corner(0, 0);
        const c10 = corner(sx, 0);
        const c01 = corner(0, sz);
        const c11 = corner(sx, sz);
        // Footprint pixel extent (top-down; image v grows downward).
        const minU = Math.min(c00.u, c10.u, c01.u, c11.u);
        const maxU = Math.max(c00.u, c10.u, c01.u, c11.u);
        const minV = Math.min(c00.v, c10.v, c01.v, c11.v);
        const maxV = Math.max(c00.v, c10.v, c01.v, c11.v);
        const closetType = item.multiClosetType?.get() ?? 'base';
        cabinets[closetType].push({
            uuid: itemId,
            leftBottom: { u: minU, v: maxV, x: 0, y: sz },
            rightTop: { u: maxU, v: minV, x: sx, y: 0 },
            itemNumber: i + 1,
            name: '',
            MVName: ''
        });
        // Route each edge into the bucket that matches its screen orientation + position. Endpoints
        // sit on the cabinet's nominal envelope corners; the paperspace stage owns visual clearance.
        const widthBucket = bucketDimension(c00, c10, roomCentre);
        const depthBucket = bucketDimension(c00, c01, roomCentre);
        // Along-width breakdown, SAME showing logic as the front view (`createMultiClosetItemView`):
        // section WIDTHS read INLINE (distance); separator THICKNESSES keep the default offset so they
        // float clear of the inline values. Endpoints project through the cabinet-local `corner`
        // helper; text uses nominal `size.x`. Zero-width parts are skipped (no "0" label). This layer
        // sits closer to the cabinet; the overall width sits one layer further out.
        const cabinetInvGroup = group.matrixWorld.clone().invert();
        const widthBreakdownDims = [];
        const pushWidthPart = (partId, isSeparator) => {
            const partGroup = designer3D.nodes.get(partId)?.group;
            if (!partGroup)
                return;
            _exportSectionWorldBox.setFromObject(partGroup);
            if (_exportSectionWorldBox.isEmpty())
                return;
            const part = getPart(designer3D.core, partId);
            const text = formatInches(part.size.x.get());
            if (text === '0')
                return;
            _exportSectionLocalBox.copy(_exportSectionWorldBox).applyMatrix4(cabinetInvGroup);
            const pLeft = corner(_exportSectionLocalBox.min.x, 0);
            const pRight = corner(_exportSectionLocalBox.max.x, 0);
            const dim = makeDimension({ x: pLeft.u, y: pLeft.v }, { x: pRight.u, y: pRight.v }, text);
            if (!isSeparator)
                dim.labelInline = true; // section = distance (inline); separator = thickness (offset)
            widthBreakdownDims.push(dim);
        };
        for (const sectionId of item.sections.get())
            pushWidthPart(sectionId, false);
        for (const separatorId of item.separators.get())
            pushWidthPart(separatorId, true);
        if (widthBreakdownDims.length > 0)
            buckets[widthBucket].push(widthBreakdownDims);
        // Overall cabinet width + depth — inline (distance), matching the front view. Skip zeros.
        const overallWidthText = formatInches(sx);
        if (overallWidthText !== '0') {
            const widthDim = makeDimension({ x: c00.u, y: c00.v }, { x: c10.u, y: c10.v }, overallWidthText);
            widthDim.labelInline = true;
            buckets[widthBucket].push([widthDim]);
        }
        const depthText = formatInches(sz);
        if (depthText !== '0') {
            const depthDim = makeDimension({ x: c00.u, y: c00.v }, { x: c01.u, y: c01.v }, depthText);
            depthDim.labelInline = true;
            buckets[depthBucket].push([depthDim]);
        }
    });
    const rulerLines = { top, bottom, left, right };
    const dimensions = {
        dpi: image.dpi,
        root: {
            uuid: floorId,
            type: 'multiClosetFloor',
            vertices: rootVertices,
            walls: {}
        },
        cabinets,
        appliances: { upper: [], tall: [], base: [] },
        windows: [],
        doors: []
    };
    return {
        uuid,
        viewType: 'multiClosetFloor',
        label: 'Floor View',
        imageUrl: image.dataUrl,
        width: image.pixelWidth,
        height: image.pixelHeight,
        wallDistance,
        settings,
        rulerLines,
        dimensions,
        traces: {},
        texts: {},
        labels: {},
        lines: {},
        blocks: {},
        leaders: {},
        numbers: {},
        index: 0,
        rotation: 0,
        fontSize: CREATE_VIEW_FONT_SIZE,
        extraSpace: {
            top: CREATE_VIEW_EXTRA_SPACE_MARGIN,
            bottom: CREATE_VIEW_EXTRA_SPACE_MARGIN,
            left: CREATE_VIEW_EXTRA_SPACE_MARGIN,
            right: CREATE_VIEW_EXTRA_SPACE_MARGIN
        }
    };
}
/**
 * Build the paperspace {@link IView}s for the given node.
 *
 * This is the public entry point: it dispatches on the node's type to one or
 * more per-type builders. A single node may map to several views (e.g. a node
 * with multiple walls → one view per wall) or to just one — either way the
 * result is a (possibly single-element) array, so callers have one uniform
 * shape to consume. Each builder is asynchronous (WebGPU pixel readback); they
 * run concurrently and resolve together via {@link Promise.all}.
 *
 * Today only a selected Item with `itemType === multiCloset` is supported
 * (→ {@link createMultiClosetItemView}); the dispatch is the seam where
 * `'floor'` / `'wall'` / future view types are added later. Unsupported nodes
 * resolve to an empty array.
 *
 * Builders are collected as deferred thunks and run **sequentially**, not via
 * `Promise.all`. Each builder calls {@link renderNodeImage}, which borrows the
 * shared engine renderer: it snapshots the render target + clear colour
 * (into module scratch), renders, awaits the GPU readback, then restores that
 * state in `finally`. Running two builders concurrently would interleave those
 * snapshot/restore steps — the second builder would capture the first's
 * transient target/clear state and later restore a disposed target — so each
 * thunk must fully complete (including its `finally`) before the next starts.
 *
 * @param nodeId - the base node for the view(s).
 * @param opts.maxSize - longest output image side in px (defaults to {@link CREATE_VIEW_MAX_SIZE}).
 * @param opts.multiClosetType - number of multiCloset items to create (defaults to 1).
 * @param opts.wallDistance - camera back-off distance in designer inches
 *   (defaults to {@link MULTICLOSET_ITEM_WALL_DISTANCE}).
 */
async function createViews(designer3D, nodeId, opts) {
    const node = getOptionalNode(designer3D.core, nodeId);
    if (!node) {
        getMonitor().warn('createViews: no node found for', nodeId);
        return {};
    }
    // Each branch contributes zero or more DEFERRED builders (thunks). They are
    // invoked one at a time below so their renderNodeImage calls never overlap.
    const builders = [];
    //@ts-ignore
    switch (node.type) {
        case NodeType.Item:
            switch (node.itemType.get()) {
                case ItemType.multiCloset: {
                    // Resolve the closet set once: a single item for 'item', or every
                    // multiCloset in the same system for 'system'.
                    const itemIds = [];
                    const system = node.system?.get();
                    if (system) {
                        traverseRoom(getParentRoom(designer3D.core, node.id), (n) => {
                            if (n.type === NodeType.Item && n.itemType.get() === ItemType.multiCloset && n.system?.get() === system) {
                                itemIds.push(n.id);
                            }
                        });
                    }
                    else {
                        itemIds.push(nodeId);
                    }
                    // One elevation (face-on) view per closet, plus one shared top-down
                    // floor view covering all of them. The 1-based position in the
                    // system doubles as the wall number shown in the view label.
                    itemIds.forEach((id, i) => {
                        builders.push(() => createMultiClosetItemView(designer3D, id, opts, i + 1));
                    });
                    if (itemIds.length > 0)
                        builders.push(() => createMultiClosetFloorView(designer3D, itemIds, opts));
                    break;
                }
            }
            break;
    }
    if (builders.length === 0) {
        getMonitor().warn('createViews: no view type found for node', nodeId, node.type);
        return {};
    }
    // Sequential: await each builder fully before starting the next, so the
    // shared renderer's borrowed state is snapshot/restored without interleaving.
    const views = {};
    for (const build of builders) {
        const view = await build();
        views[view.uuid] = view;
    }
    return views;
}
/**
 * Build paperspace views for every distinct multiCloset `system` in the project, returning them
 * **grouped by systemId** rather than as a flat list. Collects one representative Item per system
 * (systemless closets are skipped), runs {@link createViews} (`multiClosetType: 'system'`) for
 * each, and keys the resulting `IViews` map under its owning system. Runs sequentially so the
 * per-system builders do not contend for the shared renderer's transient target/clear state.
 *
 * The wrapper object shape (`{ views: IViews }` per system — see `IViewsBySystem` in
 * designer-core) is forward-compatible with adding per-system metadata later (label, count,
 * thumbnail, …) without another return-type change.
 *
 * Callers that only need a flat `IViews` map can merge with:
 *   `Object.values(result).reduce<IViews>((acc, { views }) => ({ ...acc, ...views }), {})`
 * Or a flat `IView[]` array with:
 *   `Object.values(result).flatMap(({ views }) => Object.values(views))`
 */
async function createAllViews(designer3D, opts) {
    const representatives = new Map(); // systemId → representative nodeId
    traverseNode(getFloorplan(designer3D.core, designer3D.core.rootId), (node) => {
        if (node.type === NodeType.Item && node.itemType.get() === ItemType.multiCloset) {
            const system = node.system?.get();
            if (system && !representatives.has(system)) {
                representatives.set(system, node.id);
            }
        }
    });
    const result = {};
    for (const [systemId, nodeId] of representatives) {
        const views = await createViews(designer3D, nodeId, { ...opts});
        result[systemId] = { views };
    }
    return result;
}

const dummyMatrix = new Matrix4().compose(new Vector3(), new Quaternion(), new Vector3());
class InstanceManager {
    parent;
    geometry;
    material;
    count = 500;
    mesh;
    freeIndices = [];
    usedIndices = new Set();
    nodeViews = new Map();
    constructor(parent, geometry, material) {
        this.parent = parent;
        this.geometry = geometry;
        this.material = material;
        this.mesh = this.createMesh(this.count);
        this.parent.add(this.mesh);
        this.resetIndices();
    }
    createMesh(count) {
        // 1x1x1 box geometry, will be scaled by instance matrix
        const mesh = new InstancedMesh(this.geometry, this.material, count);
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        mesh.name = 'Instances';
        //layers are adjusted in appropriate effects
        mesh.layers.disable(LAYERS.RENDER);
        mesh.layers.disable(LAYERS.RAYCAST);
        return mesh;
    }
    getMesh() {
        return this.mesh;
    }
    resetIndices() {
        this.freeIndices = [];
        for (let i = 0; i < this.count; i++) {
            // Initialize all instances to be far away/invisible
            this.mesh.setMatrixAt(i, dummyMatrix);
            this.freeIndices.push(i);
        }
        this.usedIndices.clear();
        this.mesh.instanceMatrix.needsUpdate = true;
        this.nodeViews.clear();
    }
    getNodeView(index) {
        return this.nodeViews.get(index);
    }
    getNodeViews() {
        return this.nodeViews;
    }
    resize() {
        const oldMesh = this.mesh;
        const newCount = this.count + 100;
        // Create new mesh with increased count
        const newMesh = this.createMesh(newCount);
        for (const index of this.usedIndices) {
            const matrix = new Matrix4();
            oldMesh.getMatrixAt(index, matrix);
            newMesh.setMatrixAt(index, matrix);
        }
        // Add new free indices
        for (let i = this.count; i < newCount; i++) {
            newMesh.setMatrixAt(i, dummyMatrix);
            this.freeIndices.push(i);
        }
        // Replace mesh in scene
        this.parent.remove(oldMesh);
        this.parent.add(newMesh);
        // oldMesh.geometry.dispose(); // Dispose separate geometry
        this.mesh = newMesh;
        this.count = newCount;
    }
    register(nodeView) {
        if (this.freeIndices.length === 0) {
            this.resize();
        }
        const index = this.freeIndices.pop();
        this.usedIndices.add(index);
        this.nodeViews.set(index, nodeView);
        return index;
    }
    free(index) {
        if (this.usedIndices.has(index)) {
            this.usedIndices.delete(index);
            this.freeIndices.push(index);
            // Hide the instance
            this.mesh.setMatrixAt(index, dummyMatrix);
            this.nodeViews.delete(index);
            this.mesh.instanceMatrix.needsUpdate = true;
            this.mesh.boundingSphere = null;
        }
    }
    unregister(index) {
        if (index !== undefined) {
            this.free(index);
        }
    }
    updateMatrixAt(index, matrix) {
        this.mesh.setMatrixAt(index, matrix);
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.boundingSphere = null;
    }
    dispose() {
        this.parent.remove(this.mesh);
        this.mesh.geometry.disposeBoundsTree();
        this.mesh.geometry.dispose();
    }
}

/**
 * Registry id for the shared instance-mesh pool holding wall-opening items
 * (`ItemType.window` + `ItemType.gate`). Split out of the plain `NodeType.Item`
 * pool so its box proxy can keep the RAYCAST layer enabled — making the whole
 * opening (not just the thin frame) selectable — without making every other
 * item box-selectable. Registration (`ItemView.getInstanceManager`), matrix
 * writes (`updateInstancedMatrixEffect`) and the collision/snap candidate set
 * (`dragNode`) all route window/gate items here via `isWallHoleableNode`.
 */
const OPENING_ITEM = 'openingItem';
/**
 * Registry ids for the two model stand-in box pools — the only pools that render
 * (the rest are invisible hit-proxies): blue `loading` while the GLTF downloads,
 * gray `absent` when it will never load. One pool per look (an InstancedMesh has
 * a single material); a box "switches color" by which pool holds its world
 * matrix — the other pool's slot gets dummyMatrix (see updateModelFallbackMatrixEffect).
 */
const MODEL_FALLBACK = 'modelFallback';
const MODEL_ABSENT = 'modelAbsent';
class InstanceManagers {
    array = [];
    map = new Map();
    register(id, manager) {
        this.array.push(manager);
        this.map.set(id, manager);
    }
    dispose() {
        for (const manager of this.array) {
            manager.dispose();
        }
    }
    getManager(mesh) {
        return this.array.find((manager) => manager.getMesh() === mesh);
    }
    get(id) {
        if (!this.map.has(id)) {
            throw new Error(`InstanceManager with id ${id} not found`);
        }
        return this.map.get(id);
    }
    getArray() {
        return [...this.array];
    }
}

const disposeMaterial = (material) => {
    // if (material instanceof MeshPhysicalMaterial) {
    //   if (material.alphaMap) {
    //     material.alphaMap.dispose();
    //   }
    //   if (material.emissiveMap) {
    //     material.emissiveMap.dispose();
    //   }
    //   if (material.map) {
    //     material.map.dispose();
    //   }
    //   if (material.lightMap) {
    //     material.lightMap.dispose();
    //   }
    //   if (material.aoMap) {
    //     material.aoMap.dispose();
    //   }
    //   if (material.envMap) {
    //     material.envMap.dispose();
    //   }
    //   if (material.metalnessMap) {
    //     material.metalnessMap.dispose();
    //   }
    //   if (material.roughnessMap) {
    //     material.roughnessMap.dispose();
    //   }
    //   if (material.normalMap) {
    //     material.normalMap.dispose();
    //   }
    //   if (material.displacementMap) {
    //     material.displacementMap.dispose();
    //   }
    // }
    // if (material instanceof MeshBasicMaterial) {
    //   if (material.map) {
    //     material.map.dispose();
    //   }
    //   if (material.alphaMap) {
    //     material.alphaMap.dispose();
    //   }
    //   if (material.envMap) {
    //     material.envMap.dispose();
    //   }
    //   if (material.lightMap) {
    //     material.lightMap.dispose();
    //   }
    //   if (material.aoMap) {
    //     material.aoMap.dispose();
    //   }
    //   if (material.specularMap) {
    //     material.specularMap.dispose();
    //   }
    // }
    // if (material instanceof MeshPhongMaterial) {
    //   if (material.map) {
    //     material.map.dispose();
    //   }
    //   if (material.alphaMap) {
    //     material.alphaMap.dispose();
    //   }
    //   if (material.envMap) {
    //     material.envMap.dispose();
    //   }
    //   if (material.lightMap) {
    //     material.lightMap.dispose();
    //   }
    //   if (material.aoMap) {
    //     material.aoMap.dispose();
    //   }
    //   if (material.specularMap) {
    //     material.specularMap.dispose();
    //   }
    // }
    // if (material instanceof MeshStandardMaterial) {
    //   if (material.map) {
    //     material.map.dispose();
    //   }
    //   if (material.alphaMap) {
    //     material.alphaMap.dispose();
    //   }
    //   if (material.envMap) {
    //     material.envMap.dispose();
    //   }
    //   if (material.lightMap) {
    //     material.lightMap.dispose();
    //   }
    //   if (material.aoMap) {
    //     material.aoMap.dispose();
    //   }
    //   if (material.metalnessMap) {
    //     material.metalnessMap.dispose();
    //   }
    //   if (material.roughnessMap) {
    //     material.roughnessMap.dispose();
    //   }
    //   if (material.normalMap) {
    //     material.normalMap.dispose();
    //   }
    // }
    material.dispose();
};

const disposeMesh = (mesh) => {
    mesh.geometry.dispose();
    if (mesh.material instanceof Array) {
        for (let i = 0; i < mesh.material.length; i++) {
            disposeMaterial(mesh.material[i]);
        }
    }
    else {
        disposeMaterial(mesh.material);
    }
};

const clearGroup = (group) => {
    group.traverse((obj) => {
        if (obj instanceof Mesh) {
            disposeMesh(obj);
        }
    });
    group.clear();
};

// Shared fat-line contour material for the Floor2D (floorplan mode) and Wall2D
// (editor2D mode) outline edges. One instance is reused across every
// LineSegments2: the Line2NodeMaterial TSL graph derives its resolution from the
// built-in `viewport` node and its width from the `materialLineWidth` reference
// node, so it holds no per-object state and is safe to share. It lives for the
// package lifetime — never dispose it from a node view's dispose(), as that
// would tear down the shared resource for every other contour line.
const contourLineMaterial = new Line2NodeMaterial({
    color: 0x000000,
    linewidth: 2
});

/**
 * Shared black-and-white "contour" line scaffolding for geometry node views.
 *
 * Every geometry-bearing NodeView carries a fat-line outline of its mesh on the
 * dedicated `LAYERS.BW` layer. The main cameras only render `LAYERS.RENDER`, so
 * these lines are invisible in the normal scene; a dedicated BW-only camera
 * (see AreaDesigner3D.createView) renders them to produce a 2D line image of a
 * node. The material is the shared `contourLineMaterial` singleton — it must
 * never be disposed per view (see disposeContourLine).
 */
/**
 * Create the per-view contour line, register it on the BW layer only, and add it
 * to the view's group. Returns the line so the view can store and update it.
 */
const createContourLine = (group) => {
    const line = new LineSegments2(new LineSegmentsGeometry(), contourLineMaterial);
    // BW objects live only on LAYERS.BW: hidden from the main render cameras,
    // visible to the dedicated capture camera in createView.
    line.layers.disable(LAYERS.RENDER);
    line.layers.enable(LAYERS.BW);
    // Start hidden: the geometry is an empty LineSegmentsGeometry with no
    // instanceStart/instanceEnd attributes. Line2NodeMaterial would emit a broken
    // shader (and an infinite draw) if the BW capture camera rendered it empty, so
    // it stays invisible until rebuildContourLine loads real edges.
    line.visible = false;
    group.add(line);
    return line;
};
/**
 * Rebuild the contour geometry from the mesh's current geometry. Extracts hard
 * edges (above `thresholdAngle` degrees) and loads them into the fat-line
 * geometry. The previous fat-line geometry is disposed; the shared material is
 * untouched.
 */
const rebuildContourLine = (line, sourceGeometry, thresholdAngle = 15) => {
    // The mesh may still hold an empty placeholder geometry (no positions) when
    // this first runs during node creation / catalog drag — EdgesGeometry reads
    // position.count and would throw. Skip until real geometry exists; the effect
    // re-runs reactively once updateMeshGeometryEffect populates the mesh.
    const position = sourceGeometry.getAttribute('position');
    if (!position || position.count === 0)
        return;
    const edges = new EdgesGeometry(sourceGeometry, thresholdAngle);
    const prevGeometry = line.geometry;
    line.geometry = new LineSegmentsGeometry().fromEdgesGeometry(edges);
    edges.dispose();
    prevGeometry.dispose();
    // Real instanced edge geometry now exists, so the line is safe to render.
    line.visible = true;
};
/**
 * Detach and dispose the per-view contour line before group teardown.
 *
 * `LineSegments2` extends `Mesh`, so leaving it in the group would make
 * `disposeNodeGroup -> clearGroup -> disposeMesh` call `dispose()` on the shared
 * `contourLineMaterial`, breaking every other contour line. We detach the line
 * first so the group traversal never reaches it, then dispose only its per-view
 * geometry.
 */
const disposeContourLine = (line) => {
    line.removeFromParent();
    line.geometry.dispose();
};
/**
 * Build a shared black-and-white contour template for a loaded model subtree.
 *
 * Models are GLTF subtrees with no single mesh, so we mirror the model's
 * transform hierarchy into a parallel `Group`: every `Object3D` becomes an empty
 * `Group` carrying the same local transform (so nested transforms / scales
 * resolve identically), and every `Mesh` additionally gets a child `LineSegments2`
 * of its edges on `LAYERS.BW`. The template is built once per model source
 * and cloned per view (`Object3D.clone` shares geometry + the shared material),
 * so the expensive `EdgesGeometry` extraction happens only once per source.
 *
 * `thresholdAngle` defaults to 1 so the model's geometry is rendered as-is —
 * every real geometric edge is kept, with no dihedral-angle reduction. (Coplanar
 * triangle seams are still merged; that's the difference between EdgesGeometry and
 * a raw triangle wireframe, not an optimization.)
 */
const buildModelContour = (model, thresholdAngle = 1) => {
    const build = (source) => {
        const mirror = new Group();
        mirror.position.copy(source.position);
        mirror.quaternion.copy(source.quaternion);
        mirror.scale.copy(source.scale);
        const sourceMesh = source;
        if (sourceMesh.isMesh && sourceMesh.geometry) {
            const position = sourceMesh.geometry.getAttribute('position');
            if (position && position.count > 0) {
                const edges = new EdgesGeometry(sourceMesh.geometry, thresholdAngle);
                // Even at this low threshold a degenerate mesh can yield zero edges. Building
                // a LineSegments2 from an empty edge set leaves it with zero-count instance
                // buffers, which Line2NodeMaterial cannot draw (broken shader / degenerate
                // draw). Skip those meshes entirely.
                const edgePosition = edges.getAttribute('position');
                if (edgePosition && edgePosition.count > 0) {
                    const line = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), contourLineMaterial);
                    // BW objects live only on LAYERS.BW: hidden from the main render cameras,
                    // visible to the dedicated capture camera in createView.
                    line.layers.disable(LAYERS.RENDER);
                    line.layers.enable(LAYERS.BW);
                    mirror.add(line);
                }
                edges.dispose();
            }
        }
        for (const child of source.children) {
            mirror.add(build(child));
        }
        return mirror;
    };
    const template = new Group();
    for (const child of model.children) {
        template.add(build(child));
    }
    return template;
};
/**
 * Dispose every `LineSegments2` geometry in a model contour template. Used only
 * at model-cache teardown (Designer3DStorage.disposeModels) — never per view,
 * since per-view clones share these geometries and the shared `contourLineMaterial`
 * (which must never be disposed here).
 */
const disposeModelContour = (template) => {
    template.traverse((object) => {
        if (object instanceof LineSegments2)
            object.geometry.dispose();
    });
};

const _color = new Color();
// Model stand-in boxes (`loading` / `absent`) — same material, different color/opacity.
const standInBoxMaterial = (color, opacity) => new MeshBasicMaterial({
    polygonOffset: true,
    polygonOffsetUnits: -4,
    polygonOffsetFactor: -1,
    side: FrontSide,
    transparent: true,
    opacity,
    color: _color.set(color).convertLinearToSRGB().clone()
});
const service = [
    {
        _id: 'mountUnselected',
        name: 'mountUnselected',
        label: 'mountUnselected',
        img: '',
        material: new MeshBasicMaterial({
            color: 0xaa81cf,
            transparent: true,
            polygonOffset: true,
            polygonOffsetUnits: -1,
            polygonOffsetFactor: -1,
            opacity: 0.15,
            depthWrite: false,
            side: FrontSide
        })
    },
    {
        _id: 'mountSelected',
        name: 'mountSelected',
        label: 'mountSelected',
        img: '',
        material: new MeshBasicMaterial({
            color: 0xaa81cf,
            polygonOffset: true,
            polygonOffsetUnits: -1,
            polygonOffsetFactor: -1,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: FrontSide
        })
    },
    {
        _id: 'wall3DUnselected',
        name: 'wall3DUnselected',
        label: 'wall3DUnselected',
        img: '',
        material: new MeshBasicMaterial({
            color: _color.set(0x555555).convertLinearToSRGB().clone(),
            transparent: false,
            opacity: 1.0,
            side: DoubleSide
        })
    },
    {
        _id: 'wall3DSelected',
        name: 'wall3DSelected',
        label: 'wall3DSelected',
        img: '',
        material: new MeshBasicMaterial({
            color: _color.set(0x33b4ff).convertLinearToSRGB().clone(),
            transparent: false,
            opacity: 1.0,
            side: DoubleSide
        })
    },
    {
        _id: 'invisible',
        name: 'invisible',
        label: 'invisible',
        img: '',
        material: new MeshBasicMaterial({ visible: false })
    },
    {
        _id: 'transparent',
        name: 'transparent',
        label: 'transparent',
        img: '',
        material: new MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.1, alphaTest: 0.2 })
    },
    {
        _id: 'gray',
        name: 'gray',
        label: 'gray',
        img: '',
        material: new MeshBasicMaterial({
            polygonOffset: true,
            polygonOffsetUnits: 0.2,
            polygonOffsetFactor: 1,
            // 0x666269 → ACESFilmicToneMapping @ exposure 1.2 resolves to 0x76717a on screen
            color: _color.set(0x666269)
        })
    },
    {
        _id: 'white',
        name: 'white',
        label: 'white',
        img: '',
        material: new MeshBasicMaterial({
            color: 0xf8f7fa,
            side: FrontSide
        })
    },
    {
        _id: 'point',
        name: 'point',
        label: 'point',
        img: '',
        material: new MeshBasicMaterial({
            depthTest: false,
            depthWrite: false,
            color: _color.set(0xff0000).convertLinearToSRGB().clone(),
            transparent: true,
            opacity: 0.9
        })
    },
    {
        _id: 'red',
        name: 'red',
        label: 'red',
        img: '',
        material: new MeshBasicMaterial({
            color: _color.set(0xff0000).convertLinearToSRGB().clone(),
            polygonOffset: true,
            polygonOffsetUnits: -5,
            polygonOffsetFactor: -1,
            transparent: true,
            depthWrite: false,
            opacity: 0.1
        })
    },
    {
        _id: 'green',
        name: 'green',
        label: 'green',
        img: '',
        material: new MeshBasicMaterial({
            color: _color.set(0x00ff00).convertLinearToSRGB().clone(),
            polygonOffset: true,
            polygonOffsetUnits: -5,
            polygonOffsetFactor: -1,
            transparent: true,
            depthWrite: false,
            opacity: 0.1
        })
    },
    {
        _id: 'blue',
        name: 'blue',
        label: 'blue',
        img: '',
        material: new MeshBasicMaterial({
            color: _color.set(0x0000ff).convertLinearToSRGB().clone(),
            polygonOffset: true,
            polygonOffsetUnits: -5,
            polygonOffsetFactor: -1,
            transparent: true,
            depthWrite: false,
            opacity: 0.1
        })
    },
    {
        _id: 'loading',
        name: 'loading',
        label: 'loading',
        img: '',
        material: standInBoxMaterial(0x286ce6, 0.25)
    },
    {
        _id: 'absent',
        name: 'absent',
        label: 'absent',
        img: '',
        material: standInBoxMaterial(0x8a8a8a, 0.25)
    },
    {
        _id: 'materialLoading',
        name: 'materialLoading',
        label: 'materialLoading',
        img: '',
        material: new MeshBasicMaterial({
            side: FrontSide,
            color: _color.set(0x286ce6).convertLinearToSRGB().clone()
        })
    },
    {
        _id: 'materialAbsent',
        name: 'materialAbsent',
        label: 'materialAbsent',
        img: '',
        material: new MeshBasicMaterial({
            side: FrontSide,
            color: _color.set(0x8a8a8a).convertLinearToSRGB().clone()
        })
    },
    {
        _id: 'unknown',
        value: 'unknown',
        label: 'unknown',
        img: '',
        aoMapIntensity: 0,
        clearcoat: 0,
        color: '#FFFFFF',
        emissive: 0,
        emissiveIntensity: 0,
        envMapIntensity: 0,
        // Served from the consuming app's public/ (same convention as the island maps).
        map: '/assets/textures/unknown.jpg',
        metalness: 0,
        opacity: 1,
        reflectivity: 0,
        roughness: 0.97,
        transparency: 0,
        transparent: false
    },
    {
        _id: 'blackLine',
        name: 'blackLine',
        label: 'blackLine',
        img: '',
        material: new LineBasicMaterial({
            color: _color.set(0x000000).convertLinearToSRGB().clone(),
            transparent: true,
            depthTest: false,
            side: DoubleSide
        })
    },
    {
        _id: 'particleBoard',
        value: 'particleBoard',
        label: 'particleBoard',
        img: '',
        aoMapIntensity: 0,
        clearcoat: 0,
        color: '#FFFFFF',
        emissive: 0,
        emissiveIntensity: 0,
        envMapIntensity: 0,
        map: 'https://vesta360.com/web/contentsource/product.material.look/16131/map_file/map_file_name',
        metalness: 0,
        normalMap: 'https://vesta360.com/web/contentsource/product.material.look/16131/normal_map_file/normal_map_file_name',
        opacity: 1,
        reflectivity: 0,
        roughness: 0.97,
        roughnessMap: 'https://vesta360.com/web/contentsource/product.material.look/16131/roughness_map_file/roughness_map_file_name',
        subCategory1: 'Sheet Stock',
        subCategory2: 'Melamine',
        transparency: 0,
        transparent: false
    },
    {
        _id: 'islandbasefront',
        value: 'islandbasefront',
        label: 'islandbasefront',
        img: '',
        aoMapIntensity: 0,
        clearcoat: 0,
        color: '#FFFFFF',
        emissive: 0,
        emissiveIntensity: 0,
        envMapIntensity: 0,
        map: '/assets/textures/frontisland.jpg',
        metalness: 0,
        opacity: 1,
        reflectivity: 0,
        roughness: 0.97,
        transparency: 0,
        transparent: false
    },
    {
        _id: 'islandbaseback',
        value: 'islandbaseback',
        label: 'islandbaseback',
        img: '',
        aoMapIntensity: 0,
        clearcoat: 0,
        color: '#FFFFFF',
        emissive: 0,
        emissiveIntensity: 0,
        envMapIntensity: 0,
        map: '/assets/textures/backisland.jpg',
        metalness: 0,
        opacity: 1,
        reflectivity: 0,
        roughness: 0.97,
        transparency: 0,
        transparent: false
    },
    {
        _id: 'islandbaseleft',
        value: 'islandbaseleft',
        label: 'islandbaseleft',
        img: '',
        aoMapIntensity: 0,
        clearcoat: 0,
        color: '#FFFFFF',
        emissive: 0,
        emissiveIntensity: 0,
        envMapIntensity: 0,
        map: '/assets/textures/leftisland.jpg',
        metalness: 0,
        opacity: 1,
        reflectivity: 0,
        roughness: 0.97,
        transparency: 0,
        transparent: false
    },
    {
        _id: 'islandbaseright',
        value: 'islandbaseright',
        label: 'islandbaseright',
        img: '',
        aoMapIntensity: 0,
        clearcoat: 0,
        color: '#FFFFFF',
        emissive: 0,
        emissiveIntensity: 0,
        envMapIntensity: 0,
        map: '/assets/textures/rightisland.jpg',
        metalness: 0,
        opacity: 1,
        reflectivity: 0,
        roughness: 0.97,
        transparency: 0,
        transparent: false
    }
];

// import { look, lookFromDB, looks, material, materials, materialType, model3D, models3D } from '../declarations';
// import { coreError } from './console';
// import serviceLooks from './service';
const mapLooks = (looksAPI) => {
    const data = looksAPI;
    // AreaDesigner3D's constructor dereferences obj.service, so degrade to
    // service-only buckets on a missing/partial payload instead of throwing.
    if (!data || !data.Surfaces || !data.Materials || !data.Mouldings) {
        getMonitor().error('Malformed looks data received', null, {
            hasSurfaces: Boolean(data && data.Surfaces),
            hasMaterials: Boolean(data && data.Materials),
            hasMouldings: Boolean(data && data.Mouldings)
        });
    }
    const obj = {};
    const surfaces = (data && data.Surfaces) || [];
    const picture = data && data.Decor
        ? data.Decor.filter((look) => look.subCategory1 === 'Walls' && look.subCategory2 === 'Art')
        : [];
    const countertop = surfaces.filter((look) => look.subCategory1 === 'Countertops');
    const wall = surfaces.filter((look) => look.subCategory1 === 'Walls');
    const floor = surfaces.filter((look) => look.subCategory1 === 'Floors');
    const crownMolding = data && data.Mouldings ? data.Mouldings.filter((look) => look.subCategory1 === 'Crown Moulding') : [];
    const sheetStock = data && data.Materials ? data.Materials.filter((look) => look.subCategory1 === 'Sheet Stock') : [];
    const extrusionPull = data && data.Hardware
        ? data.Hardware.filter((mat) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Handles')
        : [];
    const looks = countertop.concat(wall).concat(floor).concat(crownMolding).concat(sheetStock).concat(extrusionPull);
    const arr = {
        picture,
        countertop: looks,
        wall: looks,
        floor: looks,
        crownMolding: looks,
        body: looks,
        glass: looks,
        windowGlass: looks,
        doorGlass: looks,
        mirror: looks,
        service: service
    };
    const emptyArr = [];
    arr.pull = emptyArr;
    arr.leg = emptyArr;
    arr.hinge = emptyArr;
    arr.hingeBlind = emptyArr;
    arr.hingeCornerCorner = emptyArr;
    arr.hingeCornerDiagonal = emptyArr;
    arr.hingeLiftUp = emptyArr;
    arr.drawerSystem = emptyArr;
    arr.drawerSlide = emptyArr;
    arr.accessory = emptyArr;
    arr.ceiling = arr.wall;
    arr.doorStyle = arr.body;
    arr.door = arr.body;
    arr.melamineBox = arr.body;
    arr.melamineBoxBottom = arr.body;
    arr.doorInsert = arr.body;
    arr.laminate = arr.body;
    arr.filler = arr.body;
    arr.bottomFinishEnd = arr.body;
    arr.finishEnd = arr.body;
    arr.edgebanding = arr.body;
    arr.toeKick = arr.body;
    arr.visiblePanel = arr.body;
    arr.visibleCarcass = arr.body;
    arr.windowFrame = arr.body;
    arr.gateFrame = arr.body;
    arr.bodyEdgebanding = arr.edgebanding;
    arr.melamineBoxEdgebanding = arr.edgebanding;
    arr.doorEdgebanding = arr.edgebanding;
    arr.doorInsertEdgebanding = arr.edgebanding;
    arr.finishEndEdgebanding = arr.edgebanding;
    arr.topValanceEdgebanding = arr.edgebanding;
    arr.bottomValanceEdgebanding = arr.edgebanding;
    arr.fillerEdgebanding = arr.edgebanding;
    arr.visibleCarcassEdgebanding = arr.edgebanding;
    arr.topValance = arr.body;
    arr.bottomValance = arr.body;
    arr.extrusionPull = arr.body;
    arr.rod = arr.body;
    arr.hangingRail = arr.body;
    // Every materialType must have a bucket, even hardware categories with no
    // looks — loadMaterial indexes obj[category] for any category it is given.
    IMaterialTypeValues.forEach((type) => {
        arr[type] ??= emptyArr;
    });
    Object.keys(arr).forEach((type) => {
        obj[type] = {};
        const typeLooks = arr[type];
        typeLooks.forEach((type2) => {
            obj[type][type2._id] = { ...type2 };
        });
    });
    return {
        obj,
        arr
    };
};
// export const mapMaterials = (materialsFromDB: any): materials => {
//   const data = materialsFromDB;
//   const obj = {} as materials['obj'];
//   const arr = {
//     countertop: data.Surfaces.filter((mat: material) => mat.subCategory1 === 'Countertops').concat(
//       data.Materials.filter(
//         (mat: material) => mat.subCategory1 === 'Sheet Stock' && String(mat.subCategory2) === 'Melamine'
//       )
//     ),
//     wall: data.Surfaces.filter((mat: material) => mat.subCategory1 === 'Walls'),
//     floor: data.Surfaces.filter((mat: material) => mat.subCategory1 === 'Floors'),
//     crownMolding: data.Mouldings.filter((mat: material) => mat.subCategory1 === 'Crown Moulding'),
//     body: data.Materials.filter(
//       (mat: material) =>
//         mat.subCategory1 === 'Sheet Stock' &&
//         [
//           'MDF Paint',
//           'MDF',
//           'Melamine',
//           'Wood',
//           'Polymer',
//           'Buildups',
//           'Laminate',
//           'Veneer',
//           'Carcass',
//           'Glass'
//         ].includes(String(mat.subCategory2))
//     ),
//     melamineBoxBottom: data.Materials.filter(
//       (mat: material) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Quarter Thick'
//     ),
//     door: data.Materials.filter(
//       (mat: material) =>
//         mat.subCategory1 === 'Sheet Stock' &&
//         ['MDF Paint', 'MDF', 'Melamine', 'Wood', 'Polymer', 'Buildups', 'Laminate', 'Veneer', 'Glass'].includes(
//           String(mat.subCategory2)
//         )
//     ),
//     laminate: data.Surfaces.filter(
//       (mat: material) => mat.subCategory1 === 'Countertops' && mat.subCategory2 === 'Laminate'
//     ),
//     glass: data.Materials.filter((mat: material) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Glass'),
//     windowGlass: data.Materials.filter(
//       (mat: material) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Glass'
//     ),
//     doorGlass: data.Materials.filter(
//       (mat: material) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Glass'
//     ),
//     mirror: data.Materials.filter(
//       (mat: material) => mat.subCategory1 === 'Sheet Stock' && mat.subCategory2 === 'Mirror'
//     ),
//     edgebanding: data.Materials.filter((mat: material) => mat.subCategory1 === 'Edgebandings'),
//     pull: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Handles'),
//     extrusionPull: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Handles'
//     ),
//     rod: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Rods'),
//     leg: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Legs'),
//     hingeBlind: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Blind'),
//     hingeCornerCorner: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'PieCut'
//     ),
//     hingeCornerDiagonal: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Diagonal'
//     ),
//     hingeLiftUp: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Lift-Up'
//     ),
//     hingeBiFoldLift: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Hinges' && mat.subCategory2 === 'Bi-Fold Lift'
//     ),
//     hinge: data.Hardware.filter(
//       (mat: material) =>
//         mat.subCategory1 === 'Hinges' &&
//         !['Blind', 'PieCut', 'Diagonal', 'Lift-Up', 'Bi-Fold Lift'].includes(mat.subCategory2)
//     ),
//     camLock: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Shelf Supports'
//     ),
//     ovvoLock: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'OVVO Connectors'
//     ),
//     shoeFence: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Shoe Fence'
//     ),
//     heelCatch: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Heel Catch'
//     ),
//     // data.Hardware.filter( ( mat: material ) => mat.subCategory1 === 'Pins' ),
//     drawerSystem: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Drawer Systems'),
//     drawerSlide: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Drawer Slides' && mat.subCategory2 !== 'Undermount'
//     ),
//     drawerSlideUndermount: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Drawer Slides' && mat.subCategory2 === 'Undermount'
//     ),
//     accessory: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Accessories'),
//     tieRack: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Tie Racks'
//     ),
//     stripLight: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Strip Lights'
//     ),
//     slideOutLaundry: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Slide-out'
//     ),
//     pole: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Poles'),
//     suspendedPole: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Suspended Poles'
//     ),
//     tiltOutHamper: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Tilt-out Hampers'
//     ),
//     scarfRack: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Scarf Racks'
//     ),
//     beltRack: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Closets' && mat.subCategory2 === 'Belt Racks'
//     ),
//     hook: data.Hardware.filter((mat: material) => mat.subCategory1 === 'Accessories' && mat.subCategory2 === 'Hooks'),
//     hangingRail: data.Hardware.filter(
//       (mat: material) => mat.subCategory1 === 'Extrusions' && mat.subCategory2 === 'Hanging Rails'
//     ),
//     doorStyle: data.Materials.filter((mat: material) => mat.subCategory1 === 'Doors')
//   } as materials['arr'];
//   (Object.keys(arr) as materialType[]).forEach((type: materialType) => {
//     obj[type] = {};
//     arr[type].forEach((type2: material) => {
//       if (['extrusionPull', 'rod'].includes(type)) {
//         for (let i = 1; i <= 4; i += 1) {
//           type2[`subCategory${i}`] = type2[`subCategory${i + 1}`];
//           if (!type2[`subCategory${i}`]) {
//             Reflect.deleteProperty(type2, `subCategory${i}`);
//           }
//         }
//         Reflect.deleteProperty(type2, 'subCategory5');
//       }
//       obj[type][type2._id] = { ...type2 };
//     });
//   });
//   arr.picture = [];
//   arr.ceiling = arr.wall;
//   arr.filler = arr.door;
//   arr.melamineBox = arr.body;
//   arr.doorInsert = arr.melamineBoxBottom;
//   arr.finishEnd = arr.door;
//   arr.bottomFinishEnd = arr.door;
//   arr.toeKick = arr.door;
//   arr.visiblePanel = arr.door;
//   arr.visibleCarcass = arr.door;
//   arr.windowFrame = arr.door;
//   arr.gateFrame = arr.door;
//   arr.bodyEdgebanding = arr.edgebanding;
//   arr.melamineBoxEdgebanding = arr.edgebanding;
//   arr.doorEdgebanding = arr.edgebanding;
//   arr.finishEndEdgebanding = arr.edgebanding;
//   arr.doorInsertEdgebanding = arr.edgebanding;
//   arr.topValanceEdgebanding = arr.edgebanding;
//   arr.bottomValanceEdgebanding = arr.edgebanding;
//   arr.fillerEdgebanding = arr.edgebanding;
//   arr.visibleCarcassEdgebanding = arr.edgebanding;
//   arr.topValance = arr.door;
//   arr.bottomValance = arr.door;
//   obj.ceiling = obj.wall;
//   obj.filler = obj.door;
//   obj.melamineBox = obj.body;
//   obj.finishEnd = obj.door;
//   obj.doorInsert = obj.melamineBoxBottom;
//   obj.bottomFinishEnd = obj.door;
//   obj.toeKick = obj.door;
//   obj.visiblePanel = obj.door;
//   obj.visibleCarcass = obj.door;
//   obj.windowFrame = obj.door;
//   obj.gateFrame = obj.door;
//   obj.bodyEdgebanding = obj.edgebanding;
//   obj.melamineBoxEdgebanding = obj.edgebanding;
//   obj.doorEdgebanding = obj.edgebanding;
//   obj.doorInsertEdgebanding = obj.edgebanding;
//   obj.finishEndEdgebanding = obj.edgebanding;
//   obj.topValanceEdgebanding = obj.edgebanding;
//   obj.bottomValanceEdgebanding = obj.edgebanding;
//   obj.fillerEdgebanding = obj.edgebanding;
//   obj.visibleCarcassEdgebanding = obj.edgebanding;
//   obj.topValance = obj.door;
//   obj.bottomValance = obj.door;
//   obj.picture = {};
//   return {
//     obj,
//     arr
//   };
// };
const mapModels3D = (models3DAPI) => {
    const data = models3DAPI;
    const obj = {};
    const models3D = (data && data.Hardware ? data.Hardware : []).concat(data && data.Library ? data.Library : []);
    const arr = {
        pull: models3D,
        // ( data && data.Hardware ) ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Handles' ) : [],
        leg: models3D,
        // ( data && data.Hardware ) ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Legs' ) : [],
        applianceModel: models3D /* ( data && data.Library )
            ? data.Library.filter( ( mat: model3D ) => mat.subCategory1 === 'Products' )
            : [],*/,
        accessory: models3D,
        /* ( data && data.Hardware )
            ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Accessories' )
            : [],*/
        hook: models3D,
        /* ( data && data.Hardware )
            ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Accessories' && mat.subCategory2 === 'Hooks' )
            : [],*/
        tieRack: models3D,
        stripLight: models3D,
        slideOutLaundry: models3D,
        pole: models3D,
        suspendedPole: models3D,
        tiltOutHamper: models3D,
        /* ( data && data.Hardware )
            ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Closets' &&
            mat.subCategory2 === 'Tie Racks' )
            : [],*/
        scarfRack: models3D,
        /* ( data && data.Hardware )
            ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Closets' &&
            mat.subCategory2 === 'Scarf Racks' )
            : [],*/
        beltRack: models3D,
        /* ( data && data.Hardware )
            ? data.Hardware.filter( ( mat: model3D ) => mat.subCategory1 === 'Closets' &&
            mat.subCategory2 === 'Belt Racks' )
            : []*/
        shoeFence: models3D,
        heelCatch: models3D
    };
    const types = Object.keys(arr);
    types.forEach((type) => {
        obj[type] = {};
        arr[type].forEach((type2) => {
            obj[type][type2._id] = { ...type2 };
        });
    });
    return {
        obj,
        arr
    };
};

class Designer3DStorage {
    hash;
    constructor(core) {
        const looks = mapLooks(core.storage.get('looks'));
        const models3D = mapModels3D(core.storage.get('models3D'));
        this.hash = {
            textures: {},
            models: {},
            looks,
            // materials,
            models3D
        };
    }
    get(key) {
        return this.hash[key];
    }
    set(key, value) {
        this.hash[key] = value;
    }
    disposeTextures() {
        const textures = this.hash.textures;
        for (const textureKey in textures) {
            const textureData = textures[textureKey];
            if (textureData.texture) {
                textureData.texture.dispose();
                textureData.texture = undefined;
            }
            textureData.promise = undefined;
        }
        this.hash.textures = {};
    }
    disposeModels() {
        const models = this.hash.models;
        for (const modelKey in models) {
            const modelData = models[modelKey];
            if (modelData.model) {
                clearGroup(modelData.model);
                modelData.model = undefined;
            }
            // Free the shared BW contour template geometry (LineSegmentsGeometry built
            // once per source). disposeModelContour leaves the shared contourLineMaterial
            // alone. Per-view clones were already detached (not disposed) in ModelView.dispose.
            if (modelData.bwModel) {
                disposeModelContour(modelData.bwModel);
                modelData.bwModel = undefined;
            }
            modelData.promise = undefined;
        }
        this.hash.models = {};
    }
    dispose() {
        this.hash = {};
    }
}

const _cameraWorldPos = new Vector3(); // module-level scratch — allocation-free hot path
/**
 * Set the depth window a pick ray is allowed to hit within, so the pickable
 * region matches the region the camera actually renders (`camera.near`…`camera.far`
 * measured from the camera plane).
 *
 * `enabled` is the caller's gate — pass `AreaDesigner3D#e2ClipEnabled`. When it is
 * false, or the active camera is not orthographic, the raycaster is reset to its
 * unbounded default instead: the `Handlers` raycaster is long-lived and shared
 * across view modes, so a clamp must never leak into floorPlan / editor3D /
 * walkthrough picking. Only editor2D is clamped today — floorPlan uses an ortho
 * camera too, but it defaults to the world origin with the floor at y = 0
 * (distance `0 < camera.near`), so clamping there would reject every hit.
 *
 * For an ortho camera every point on the pick ray projects to the pointer's own
 * screen x/y, so `left`/`right`/`top`/`bottom` can never reject a hit — `near`/`far`
 * ARE the complete frustum test. Applying them on the `Raycaster` (rather than
 * filtering the returned intersections) also matters because `raycasterCreate`
 * sets `firstHitOnly`: three-mesh-bvh prunes by `raycaster.near`/`far` inside the
 * BVH traversal, so the surviving hit is the nearest *valid* one instead of a
 * discarded out-of-slab hit that shadowed a visible surface on the same mesh.
 *
 * Why the offset is derived from the ray instead of assuming the origin sits on
 * the camera plane: `Raycaster.setFromCamera` builds the ortho origin by
 * unprojecting a hard-coded WebGL-NDC depth (`(near + far) / (near - far)`). That
 * lands exactly ON the camera plane for the WebGL2 backend (NDC z in -1..1), but
 * `camera.far` BEHIND the camera for the WebGPU backend, where `WebGPURenderer`
 * has switched `camera.coordinateSystem` (and hence `projectionMatrix`) to NDC
 * z in 0..1. That is what let editor2D pick multiClosets standing behind the
 * camera on other walls. Measuring the origin→camera-plane distance off the ray
 * itself is correct on both backends, and is likewise immune to
 * `camera.reversedDepth`.
 *
 * Must be called AFTER `raycaster.setFromCamera(...)` — it reads `raycaster.ray`.
 */
const clampRaycasterToCameraDepth = (raycaster, camera, enabled) => {
    if (!enabled || !(camera instanceof OrthographicCamera)) {
        raycaster.near = 0;
        raycaster.far = Infinity;
        return;
    }
    _cameraWorldPos.setFromMatrixPosition(camera.matrixWorld);
    // Signed distance along the ray from its origin to the camera plane.
    const originOffset = _cameraWorldPos.sub(raycaster.ray.origin).dot(raycaster.ray.direction);
    raycaster.near = originOffset + camera.near;
    raycaster.far = originOffset + camera.far;
};

const _ndc = new Vector3(); // module-level scratch — allocation-free hot path
/**
 * Project the framed wall's left/right edge world points to screen UV.x and
 * return the ordered horizontal clip band `[minX, maxX]` (each in 0..1).
 *
 * Shared by the engine's screen-space wall clip (`IWebGPU.render`) and the
 * editor2D raycast filter (`Handlers.doRaycast`) so the pickable region always
 * matches the visually clipped region. Caller must have refreshed
 * `camera.updateMatrixWorld()` first (as both callers do).
 */
const getEditor2DClipBandX = (leftWorld, rightWorld, camera) => {
    const left = _ndc.copy(leftWorld).project(camera).x * 0.5 + 0.5;
    const right = _ndc.copy(rightWorld).project(camera).x * 0.5 + 0.5;
    return { minX: Math.min(left, right), maxX: Math.max(left, right) };
};

const m4$1 = new Matrix4$1();
const points = [
    new Vector3$1(),
    new Vector3$1(),
    new Vector3$1(),
    new Vector3$1(),
    new Vector3$1(),
    new Vector3$1(),
    new Vector3$1(),
    new Vector3$1()
];
const threshold = 1e-5;
const windowDoorThreshold = 1e-2;
const pointOffsets = [
    new Vector3$1(threshold, threshold, threshold),
    new Vector3$1(threshold, threshold, 1 - threshold),
    new Vector3$1(threshold, 1 - threshold, threshold),
    new Vector3$1(threshold, 1 - threshold, 1 - threshold),
    new Vector3$1(1 - threshold, threshold, threshold),
    new Vector3$1(1 - threshold, threshold, 1 - threshold),
    new Vector3$1(1 - threshold, 1 - threshold, threshold),
    new Vector3$1(1 - threshold, 1 - threshold, 1 - threshold)
];
/**
 * Raw unit-cube corners (0..1) — NO inset. Used by snap-axis projection
 * passes (`snap.ts`, `resolveCollisionSnap.ts`) and by collision-aware
 * helpers that need a node's TRUE AABB on the dragged item's local
 * axes. Collision (`collision.ts`) and containment (`containment.ts`)
 * keep using `pointOffsets` for SAT robustness — there the 1e-5 inset
 * prevents touching faces from registering as overlap.
 *
 * Re-exported from `@moon/designer-core/helpers/math/plane/unitBoxCorners`
 * (single source of truth — see also
 * `designer-core/itemClearances.ts::collectPlanarItemBlockers` which
 * consumes the same constant via `projectUnitBoxToBox3`). Kept under
 * the legacy name here so existing call sites
 * (`snap.ts::contributeNeighbors`, `resolveCollisionSnap.ts`) don't
 * churn.
 */
const rawCornerOffsets = UNIT_BOX_CORNERS;

// Reusable temporaries — drag runs per pointermove, so avoid per-frame allocation.
const _invMatrix = new Matrix4$1();
const _localPoint$3 = new Vector3$1();
let state$1 = null;
const resetDragOnFreeBoxContainer = () => {
    state$1 = null;
};
/** Pointer hit point projected into the container's local frame (Y is bottom-to-top). */
const localPointerY = (fbc, point) => {
    const worldMatrix = getMatrixWorld(fbc, false, _invMatrix);
    return _localPoint$3.copy(point).applyMatrix4(worldMatrix.invert()).y;
};
/**
 * Drag a Part onto a FreeBoxContainer. Two type-gated cases:
 *  - multiCloset container: only stack parts; the stack is previewed into the ordered
 *    `bays` slot between the two nearest stacks. The accompanying fix-shelf divider that
 *    keeps the `divider, stack, divider` pattern is added at drop (see commit below).
 *  - plain container: only `freeBoxContainerInteriorPart`; positioned by 32mm-snapping
 *    the pointer along Y.
 * Returns `true` when the dragged part is a valid drop for this container, else `false`.
 */
const dragOnFreeBoxContainer = (draggedNode, fbc, point) => {
    if (draggedNode.type !== NodeType.Part) {
        return false;
    }
    const part = draggedNode;
    const partType = part.partType.get();
    const core = part.core;
    const fbcType = fbc.freeBoxContainerType.get();
    if (fbcType === FreeBoxContainerType.multiCloset) {
        if (!isMultiClosetStackPartType(partType)) {
            return false;
        }
        // The lock cascade: no stack drops INTO a locked section's box, and none drags OUT of
        // one — the whole subtree is frozen. Same predicate every other gate consults.
        if (getEffectiveContentLocked(core, fbc.id) || getEffectiveContentLocked(core, part.id)) {
            return false;
        }
        const pointerY = localPointerY(fbc, point);
        const bays = fbc.bays
            .get()
            .map((id) => getNode(core, id))
            .filter((c) => c && c.id !== part.id) // skip the dragged stack on re-eval frames
            .map((c) => ({
            id: c.id,
            isStack: isMultiClosetStackPartType(c.partType.get()),
            posY: c.position.y.get(),
            sizeY: c.size.y.get()
        }));
        const { stackInsertIndex } = freeBoxContainerStackInsertion(bays, pointerY);
        // Capture the stack's origin container ONCE, on the first frame for this stack — before
        // the re-parent below (after which `part.parent` is this FBC). The stack's home is the
        // multiCloset FBC whose `bays` it currently sits in; a catalog drop (pre-parented into
        // `children`) or a part dragged in from elsewhere has no such home. Later frames leave
        // `originalBayFbcId` fixed, so a cross-container move stays a "new insertion" for the
        // destination and still repairs the column it left.
        if (!state$1 || state$1.stackId !== part.id) {
            const origin = getOptionalNode(core, part.parent.get());
            const originalBayFbcId = origin && origin.type === NodeType.FreeBoxContainer && origin.bays.get().includes(part.id)
                ? origin.id
                : undefined;
            state$1 = { stackId: part.id, originalBayFbcId };
        }
        // Preview the insertion AND the fix shelves it implies, so the column shows the shape it
        // will actually have on drop instead of rendering a stack with no shelf above it for the
        // whole drag. `pendingInsert` projects the column past the re-parent so both land in ONE
        // transaction — one batch, so the layout effect flushes once per frame with the finished
        // column rather than once with the stack un-bracketed and again with it repaired.
        //
        // Affordable per frame because the reconciler RELOCATES before it creates: once the column
        // holds the right number of shelves, every later frame is at most a `bays` permutation (one
        // signal write, no node touched). A node is only cloned on the frame a stack first enters a
        // column that is short — once per drag, not once per pointermove.
        core.runCommandsAsTransaction([
            new SetNodeParentCommand(part.id, fbc.id, 'bays', stackInsertIndex),
            ...reconcileFreeBoxContainerBaysCommands(core, fbc.id, {
                pendingInsert: { id: part.id, at: stackInsertIndex }
            })
        ], '', false);
        return true;
    }
    if (fbcType === undefined) {
        if (partType !== PartType.freeBoxContainerInteriorPart) {
            return false;
        }
        const pointerY = localPointerY(fbc, point);
        let firstHoleOffset = defaultFirstHoleOffset;
        try {
            firstHoleOffset =
                getAttributeValue(getParentCarcass(core, fbc.id), 'FirstHoleOffset') || defaultFirstHoleOffset;
        }
        catch {
            firstHoleOffset = defaultFirstHoleOffset;
        }
        const posY = snapTo32mm(pointerY, part.size.y.get(), fbc.size.y.get(), firstHoleOffset, step32mm);
        core.runCommandsAsTransaction([
            new SetNodeParentCommand(part.id, fbc.id, 'children'),
            new SetNodeVectorComponentCommand(part.id, VectorProps.position, V3Axes.y, posY)
        ], '', false);
        return true;
    }
    return false;
};
/**
 * Drop-time finalization for a multiCloset stack drag. Returns commands to fold into the
 * open drop transaction, so the structural repair is one undo step with the drop itself.
 *
 * Two jobs:
 *  1. **Repair the column the stack LEFT.** The drag preview already keeps the DESTINATION
 *     correct on every frame, so that call is normally a no-op here; the source column is only
 *     reconciled once, at drop, because doing it live would churn a shelf every time the user
 *     drags back and forth across the section boundary.
 *  2. **Auto-size a first stack** — a stack dropped as the only one in a column must fill the
 *     single opening the bracketing shelves already form instead of sitting at its catalog
 *     height. This is the one thing the reconciler can't know.
 *
 * The destination is read from the stack's live `parent`, NOT from drag state: the per-frame
 * handler only runs when the raycast lands on the FreeBoxContainer itself, so a pointer that
 * finishes over a stack or a shelf routes to `dragOnPart` and would leave a tracked target
 * stale.
 *
 * Note this is best-effort, not the guarantee: `Handler.pointerup` only calls it behind its
 * `moved && draggedNodeId` gate, so a very short drag skips it entirely. The structure is
 * correct anyway because the preview already reconciled the destination.
 */
const commitDragOnFreeBoxContainer = (core) => {
    if (!state$1) {
        return [];
    }
    const { stackId, originalBayFbcId } = state$1;
    const stack = getOptionalNode(core, stackId);
    const destination = stack && getOptionalNode(core, stack.parent.get());
    const landed = !!destination &&
        destination.type === NodeType.FreeBoxContainer &&
        destination.freeBoxContainerType.get() === FreeBoxContainerType.multiCloset &&
        destination.bays.get().includes(stackId);
    const commands = [];
    // Repair the column the stack LEFT — nothing else removes its surplus shelf, and nothing else
    // notices that the stack it lost may have been the column's only auto-sized one (dragging the
    // flex stack out of a shelves+drawers column leaves the fixed drawers stack alone, and the
    // layout then drops every hole above it).
    if (originalBayFbcId && (!landed || originalBayFbcId !== destination.id)) {
        commands.push(...reconcileFreeBoxContainerBaysCommands(core, originalBayFbcId), ...promoteMultiClosetAutoCarrier(core, originalBayFbcId));
    }
    if (!landed) {
        return commands;
    }
    commands.push(...reconcileFreeBoxContainerBaysCommands(core, destination.id));
    // A column keeps exactly ONE auto-sized stack, which absorbs the holes no fixed stack claimed.
    // This covers what used to be a local "first stack in the column → force auto" rule and two
    // cases it missed: a fixed stack (a drawers stack is `isAutoSized: false` by catalog) landing
    // beside other fixed stacks, and a reorder inside a column that had no auto stack at all. The
    // helper writes nothing when some stack already flexes, which is the common case (including
    // every plain reorder), and the same decision serves the delete path and the section level.
    commands.push(...promoteMultiClosetAutoCarrier(core, destination.id));
    return commands;
};

// Preallocated objects — never recreated inside the drag handler.
const _mountMatrixInverse$1 = new Matrix4$1();
const _localPoint$2 = new Vector3$1();
/**
 * The section being dragged and the multiCloset it started in, captured on the first frame so
 * `commitDragOnItem` can repair the closet it LEFT. Module state, mirroring
 * `dragOnFreeBoxContainer` — the per-frame handler only knows the closet under the pointer.
 */
let state = null;
/** Clears the tracked drag; called from `Handler.pointerup` after the commit. */
const resetDragOnItem = () => {
    state = null;
};
/**
 * Re-arms the balance section of both closets a section move touched, at DROP time:
 *
 *  - the closet it LEFT — dragging its balance (auto-sized) section away leaves every survivor
 *    pinned, so `updateMultiClosetItemLayoutEffect` never hands out the leftover width and that
 *    closet ends in a dead gap;
 *  - the closet it JOINED — an arriving PINNED section cannot rescue a destination that had no
 *    balance section of its own.
 *
 * Deliberately at commit, not per frame: the per-frame handler re-parents on every pointermove, so
 * repairing there would promote a survivor while the pointer merely passes over another closet and
 * leave TWO auto-sized sections behind if the drag returns. `promoteMultiClosetAutoCarrier` writes
 * nothing when a balance section already exists, which is the common case for both closets.
 */
const commitDragOnItem = (core) => {
    if (!state)
        return [];
    const { sectionId, originItemId } = state;
    const section = getOptionalNode(core, sectionId);
    if (!section || section.type !== NodeType.Part)
        return [];
    const destinationId = section.parent.get();
    const commands = [];
    if (destinationId !== originItemId) {
        commands.push(...promoteMultiClosetAutoCarrier(core, originItemId));
    }
    commands.push(...promoteMultiClosetAutoCarrier(core, destinationId));
    return commands;
};
const getIndex = (item, point) => {
    const sectionIds = item.sections.get();
    const widthArray = [0];
    for (const sectionId of sectionIds) {
        const section = getPart(item.core, sectionId);
        widthArray.push(widthArray[widthArray.length - 1] + section.size.x.get());
    }
    const closest = widthArray.reduce(function (prev, curr) {
        return Math.abs(curr - point.x) < Math.abs(prev - point.x) ? curr : prev;
    });
    return widthArray.indexOf(closest);
};
const getAvailableWidth = (item) => {
    const sectionIds = item.sections.get();
    const separatorIds = item.separators.get();
    let widthAvailable = item.size.x.get();
    for (const sectionId of sectionIds) {
        const section = getPart(item.core, sectionId);
        const sectionWidth = section.size.x.get();
        const isAutoSized = section.isAutoSized?.get() ?? 0;
        if (!isAutoSized) {
            widthAvailable -= sectionWidth;
        }
    }
    for (const separatorId of separatorIds) {
        const separator = getPart(item.core, separatorId);
        const separatorWidth = separator.size.x.get();
        widthAvailable -= separatorWidth;
    }
    return widthAvailable;
};
const dragOnItem = (draggedNode, item, point) => {
    // The lock cascade: a LOCKED section is pinned in place — it can be neither reordered
    // inside its closet nor re-homed into another. Same predicate every drag gate and resize
    // handle consults, so lock and drop refusal can never disagree.
    if (getEffectiveContentLocked(draggedNode.core, draggedNode.id)) {
        return false;
    }
    // 1. Check if applicable
    const widthAvailable = getAvailableWidth(item);
    const sectionWidth = draggedNode.size.x.get();
    const isAutoSized = draggedNode.isAutoSized?.get() ?? 0;
    if ((isAutoSized && widthAvailable < sectionWidth) || (!isAutoSized && widthAvailable <= 0)) {
        return false;
    }
    // 2. Apply new parent and section index
    _mountMatrixInverse$1.copy(getMatrixWorld(item, false)).invert();
    _localPoint$2.copy(point).applyMatrix4(_mountMatrixInverse$1);
    const index = getIndex(item, _localPoint$2);
    // Remember where this section came from, before the first re-parent overwrites it, so the drop
    // can re-arm the balance section of the closet it left (see `commitDragOnItem`).
    if (!state || state.sectionId !== draggedNode.id) {
        state = { sectionId: draggedNode.id, originItemId: draggedNode.parent.get() };
    }
    draggedNode.core.runCommandsAsTransaction(new SetNodeParentCommand(draggedNode.id, item.id, 'sections', index), '', false);
    return true;
};

let prevPartId = null;
const resetDragOnPart = () => {
    dragOnPartCommands.length = 0;
    prevPartId = null;
};
const dragOnPartCommands = [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dragOnPart = (draggedNode, part, _point) => {
    if (draggedNode.type !== NodeType.Part || draggedNode.partType.get() !== PartType.multiClosetSectionContent) {
        return false;
    }
    // The lock cascade: a LOCKED target section refuses new content — its subtree is frozen
    // (swapping content would delete what the user locked). Same predicate every other gate uses.
    if (getEffectiveContentLocked(part.core, part.id)) {
        return false;
    }
    const prevParentId = draggedNode.parent.get();
    const alreadyInThisPart = prevParentId === part.id;
    // Enter the replacement block when moving to a new section OR on the very first call
    // (prevPartId === null). The latter handles the catalog-drag case where
    // CreateNodeFromCatalogCommand already placed the node into this part's content,
    // so prevParentId === part.id but existing content was never cleared.
    if (!alreadyInThisPart || prevPartId === null) {
        if (prevPartId) {
            draggedNode.core.runCommandsAsTransaction(dragOnPartCommands.map((c) => new CreateNodeCommand(JSON.parse(JSON.stringify(c.objects)), c.id, prevPartId, c.childProperty)), '', true);
        }
        draggedNode.core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(part.id), '', false);
        dragOnPartCommands.length = 0;
        prevPartId = part.id;
        const content = part.content.get();
        for (let i = 0; i < content.length; i += 1) {
            // Exclude the dragged node itself — it may already be in content when coming from catalog
            if (content[i] !== draggedNode.id) {
                dragOnPartCommands.push(new RemoveNodeCommand(content[i]));
            }
        }
        draggedNode.core.runCommandsAsTransaction(dragOnPartCommands, '', true);
        // Only reparent if the node isn't already inside this part (catalog places it there first)
        if (!alreadyInThisPart) {
            draggedNode.core.runCommandsAsTransaction(new SetNodeParentCommand(draggedNode.id, part.id, 'content', 0), '', false);
        }
    }
    return true;
};

const getNodeGroup = (mesh) => {
    let parent = mesh.parent;
    while (parent) {
        if (parent['isNodeGroup'])
            return parent;
        parent = parent.parent;
    }
    throw new Error(`NodeGroup not found for mesh ${mesh.name}`);
};

const _corner = new Vector3$1();
const _collisionOffset = new Vector3$1();
/**
 * Computes the 8 bounding-box corners of the dragged node into the shared
 * `points` array. When `mountMatrixInverse` is provided, corners are
 * expressed in the mount's local space (needed for plane containment check);
 * otherwise they stay in world space (needed for line containment check).
 */
const computeNodeCorners = (node, mountMatrixInverse) => {
    const matrixNode = getMatrixWorld(node, true);
    for (let i = 0; i < points.length; i++) {
        points[i].copy(computeNodeCorner(node, matrixNode, i));
        if (mountMatrixInverse) {
            points[i].applyMatrix4(mountMatrixInverse);
        }
    }
};
const computeNodeCorner = (node, matrixNode, i) => {
    return _corner.copy(getNodeCollisionOffset(node, i)).applyMatrix4(matrixNode);
};
const getNodeCollisionOffset = (node, i) => {
    _collisionOffset.copy(pointOffsets[i]);
    //windows, doors and reach-in closets need to go z-front to intersect with products on the wall/floor
    if (node.type === NodeType.Item &&
        [ItemType.gate, ItemType.window, ItemType.reachInCloset].includes(node.itemType.get()) &&
        i % 2) {
        _collisionOffset.z += windowDoorThreshold;
    }
    return _collisionOffset;
};

// Preallocated scratch objects — never created inside the hot path.
const _centerA = new Vector3$1();
const _centerB = new Vector3$1();
const _satAxes = Array.from({ length: 15 }, () => new Vector3$1());
const _candidateCorners = Array.from({ length: 8 }, () => new Vector3$1());
/**
 * Returns true if the projections of cornersA and cornersB onto `axis`
 * have a gap (i.e. `axis` is a separating axis). Near-zero axes (degenerate
 * cross products from parallel OBB edges) are skipped.
 */
const isSeparatedOnAxis = (cornersA, cornersB, axis) => {
    if (axis.lengthSq() < 1e-10)
        return false;
    let minA = Infinity, maxA = -Infinity;
    let minB = Infinity, maxB = -Infinity;
    for (let i = 0; i < 8; i++) {
        const a = cornersA[i].dot(axis);
        const b = cornersB[i].dot(axis);
        if (a < minA)
            minA = a;
        if (a > maxA)
            maxA = a;
        if (b < minB)
            minB = b;
        if (b > maxB)
            maxB = b;
    }
    return maxA < minB - 1e-6 || maxB < minA - 1e-6;
};
/**
 * Full 3D OBB-OBB Separating Axis Theorem test (15 axes).
 *
 * Derives each OBB's 3 face normals from corner differences using the fixed
 * pointOffsets ordering: index 4 = +X, index 2 = +Y, index 1 = +Z.
 * Then tests 9 edge cross-product axes. Returns true if the OBBs overlap.
 */
const obbOverlaps = (cornersA, cornersB) => {
    _satAxes[0].subVectors(cornersA[4], cornersA[0]).normalize(); // A local X
    _satAxes[1].subVectors(cornersA[2], cornersA[0]).normalize(); // A local Y
    _satAxes[2].subVectors(cornersA[1], cornersA[0]).normalize(); // A local Z
    _satAxes[3].subVectors(cornersB[4], cornersB[0]).normalize(); // B local X
    _satAxes[4].subVectors(cornersB[2], cornersB[0]).normalize(); // B local Y
    _satAxes[5].subVectors(cornersB[1], cornersB[0]).normalize(); // B local Z
    let k = 6;
    for (let i = 0; i < 3; i++) {
        for (let j = 3; j < 6; j++) {
            _satAxes[k++].crossVectors(_satAxes[i], _satAxes[j]);
        }
    }
    for (let i = 0; i < 15; i++) {
        if (isSeparatedOnAxis(cornersA, cornersB, _satAxes[i]))
            return false;
    }
    return true;
};
/**
 * Checks if the dragged item collides with any active instance in the provided
 * InstanceManager using a two-phase pipeline:
 *
 *   1. Bounding sphere filter — O(N), reads only 2 corners per candidate.
 *   2. Full 3D OBB SAT (15 axes) — only for candidates that pass the sphere test.
 *
 * Instance matrices are written by `updateInstancedMatrixEffect` using
 * `getMatrixWorld(node, true)`, which already encodes position × rotation ×
 * scale(size). OBB corners are therefore derived as:
 *   corners[i] = pointOffsets[i].applyMatrix4(instanceMatrix)
 * with no separate size multiplication needed.
 *
 * IMPORTANT: shared `points[]` must contain world-space corners at the time
 * of this call. For MountLine, `computeNodeCorners(node)` (no mount inverse)
 * already satisfies this. For MountPlane, call `computeNodeCorners(node)`
 * without the mount inverse BEFORE calling this function.
 */
const checkCollision = (draggedNodeId, instanceManagers) => {
    _centerA.addVectors(points[0], points[7]).multiplyScalar(0.5);
    const radiusA = points[0].distanceTo(points[7]) * 0.5;
    let draggedIsCeiling = null;
    for (const instanceManager of instanceManagers) {
        const mesh = instanceManager.getMesh();
        for (const [index, nodeView] of instanceManager.getNodeViews()) {
            if (nodeView.id === draggedNodeId)
                continue;
            // Mount-group gate — a ceiling fixture and a floor product never collide
            // (see `itemMountGroups.ts` in designer-core). Resolved lazily and once:
            // most frames hit the `continue` above or the sphere test below first.
            const core = nodeView.view.core;
            if (draggedIsCeiling === null)
                draggedIsCeiling = isCeilingMountedNode(core, draggedNodeId);
            if (isCeilingMountedNode(core, nodeView.id) !== draggedIsCeiling)
                continue;
            //@ts-expect-error TODO: Matrix4 types between three and designer-core are incompatible
            mesh.getMatrixAt(index, m4$1);
            // Broad phase: derive bounding sphere from the two extreme OBB corners.
            const node = getNode(core, nodeView.id);
            _candidateCorners[0].copy(computeNodeCorner(node, m4$1, 0));
            _candidateCorners[7].copy(computeNodeCorner(node, m4$1, 7));
            _centerB.addVectors(_candidateCorners[0], _candidateCorners[7]).multiplyScalar(0.5);
            const radiusB = _candidateCorners[0].distanceTo(_candidateCorners[7]) * 0.5;
            const threshold = radiusA + radiusB;
            if (_centerA.distanceToSquared(_centerB) > threshold * threshold)
                continue;
            // Narrow phase: compute remaining corners, then run full OBB SAT.
            for (let i = 1; i < 7; i++) {
                _candidateCorners[i].copy(computeNodeCorner(node, m4$1, i));
            }
            if (obbOverlaps(points, _candidateCorners))
                return true;
        }
    }
    return false;
};

/**
 * Default sill height (in inches) applied to a fresh `ItemType.window` when
 * it is dropped from the catalog onto a wall `MountLine`. Walls hit from the
 * floorplan top-down camera always intersect at line-local Y = 0, so without
 * a per-item default the window would land at floor level. The chosen value
 * is the standard residential rough-opening sill height; tune as needed.
 *
 * Only used as the initial-frame default — `positionAdjust.ts` preserves
 * `node.position.y.get()` on every subsequent drag frame, so any user-driven
 * Y change made later (e.g. via the 3D editor) is kept untouched.
 */
const DEFAULT_WINDOW_MOUNT_Y = 36;
/**
 * Returns a SetHoveredNodeIdCommand when the hovered node needs to change,
 * or null if the mount is already the active hover target.
 */
const buildHoverCommand = (node, mountId) => {
    if (node.core.hoveredNodeId.get() === mountId)
        return null;
    return new SetHoveredNodeIdCommand(mountId);
};
const p = new Vector3$1();
const q = new Quaternion$1();
const s = new Vector3$1();
const r = new Euler();
/**
 * Computes the rotation to assign to a node when it gets parented to a mount.
 *
 * - `isInitialPlacement = false` (default): the node has a meaningful prior
 *   world rotation (e.g. it was just dragged off a different mount). For
 *   floor/ceiling we preserve that world rotation by computing it relative to
 *   the new mount.
 * - `isInitialPlacement = true`: the node has no meaningful prior rotation
 *   (fresh catalog drop with `(0, 0, 0)`). We apply a canonical mount-type
 *   default that leaves a Y-up authored model upright in world space.
 */
const getMountDefaultRotation = (node, mount, isInitialPlacement = false) => {
    if (isInitialPlacement) {
        switch (mount.type) {
            case NodeType.MountPlane:
                switch (mount.mountSlotTypes.get()[0]) {
                    case MountType.wall:
                        return r.set(0, 0, 0);
                    case MountType.floor:
                        return r.set(Math.PI / 2, 0, 0);
                    case MountType.ceiling:
                        return r.set(-Math.PI / 2, 0, 0);
                    case MountType.countertop:
                        return r.set(Math.PI / 2, 0, 0);
                    default:
                        getMonitor().warn('unable to calculate rotation for mount slot type', mount.mountSlotTypes.get()[0]);
                        return r.set(0, 0, 0);
                }
            case NodeType.MountLine:
                return r.set(0, 0, 0);
            default:
                getMonitor().warn('unable to calculate rotation for mount type', mount);
                return r.set(0, 0, 0);
        }
    }
    const matrix = getMatrixWorld(mount, false).invert().multiply(getMatrixWorld(node, false));
    matrix.decompose(p, q, s);
    switch (mount.type) {
        case NodeType.MountPlane:
            switch (mount.mountSlotTypes.get()[0]) {
                case MountType.floor:
                    r.setFromQuaternion(q);
                    return r;
                case MountType.ceiling:
                    return r.set(-Math.PI / 2, 0, 0);
                case MountType.countertop:
                    return r.set(Math.PI / 2, 0, 0);
                case MountType.wall:
                    return r.set(0, 0, 0);
                default:
                    getMonitor().warn('unable to calculate rotation for mount slot type', mount.mountSlotTypes.get()[0]);
                    return r.set(0, 0, 0);
            }
        case NodeType.MountLine:
            return r.set(0, 0, 0);
        default:
            getMonitor().warn('unable to calculate rotation for mount type', mount);
            return r.set(0, 0, 0);
    }
};
const getMountDefaultPosition = (node, mount) => {
    switch (mount.type) {
        case NodeType.MountPlane:
            switch (mount.mountSlotTypes.get()[0]) {
                case MountType.ceiling:
                    return { x: 0, y: 0, z: [{ type: 'size', value: V3Axes.y }] };
                default:
                    return new Vector3$1(0, 0, 0);
            }
        case NodeType.MountLine:
            if (node.type === NodeType.Item && node.itemType.get() === ItemType.window) {
                return new Vector3$1(0, DEFAULT_WINDOW_MOUNT_Y, 0);
            }
            return new Vector3$1(0, 0, 0);
        default:
            getMonitor().warn('unable to calculate position for mount type', mount);
            return new Vector3$1(0, 0, 0);
    }
};
/**
 * Builds the commands required to (re)parent the dragged node onto a mount
 * and optionally reset its rotation. Also appends a hover command when
 * needed. Returns an empty array when the node is already correctly mounted.
 *
 * Pass `isInitialPlacement = true` when the node is a freshly created catalog
 * item that has no meaningful prior rotation to preserve.
 */
const buildMountCommands = (node, mount, isInitialPlacement = false) => {
    const commands = [];
    // Only re-parent + reset rotation when the node is actually entering this
    // mount — i.e. on the initial catalog placement (which must seed the canonical
    // mount-default rotation and the undo anchor) or when crossing onto a
    // different mount surface mid-drag. Emitting these every frame re-parents the
    // node to the parent it already has, rewriting the parent's `children` set and
    // its rotation on each pointermove; that floods every subscriber (e.g. a
    // multiCloset's section/separator subtree) and overruns React's nested-update
    // limit. Subsequent same-mount frames only need the position write in
    // `dragOnMountPlane` (and the hover command below).
    if (isInitialPlacement || node.parent.get() !== mount.id) {
        commands.push(new SetNodeParentCommand(node.id, mount.id));
        commands.push(new SetNodeVector3Command(node.id, VectorProps.rotation, getMountDefaultRotation(node, mount, isInitialPlacement)));
    }
    const hoverCmd = buildHoverCommand(node, mount.id);
    if (hoverCmd)
        commands.push(hoverCmd);
    return commands;
};
/**
 * Builds the commands needed to restore the node to its state before the
 * current drag frame began (parent, position, and rotation).
 */
const buildRollbackCommands = (node, snapshot) => [
    new SetNodeParentCommand(node.id, snapshot.parentId),
    new SetNodeVector3Command(node.id, VectorProps.position, snapshot.position),
    new SetNodeVector3Command(node.id, VectorProps.rotation, snapshot.rotation)
];

/**
 * Ray-casting point-in-polygon test (even-odd rule).
 * Works on any Record<V2Axes, number> polygon, matching Three.js Shape's
 * getPoints() output which returns objects with .x and .y.
 */
function polygonContainsPoint(polygon, point) {
    const n = polygon.length;
    const { x, y } = point;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}
/**
 * Returns true when every point in `pts` lies inside `shape` (accounting for
 * holes via the even-odd rule). Points must be in the mount plane's local
 * space so that their .x/.y coordinates map to the shape's 2D plane.
 */
const isInsideMountPlane = (shape, pts, divisions = 64) => {
    const outerPolygon = shape.getPoints(divisions);
    for (let i = 0; i < pts.length; i++) {
        if (!polygonContainsPoint(outerPolygon, pts[i]))
            return false;
        for (const hole of shape.holes) {
            if (polygonContainsPoint(hole.getPoints(divisions), pts[i]))
                return false;
        }
    }
    return true;
};
/**
 * Returns true when every point in `pts` projects onto the interior of the
 * line segment (parameter t in [0, 1]). Points must be in world space.
 */
const isInsideMountLine = (line, pts) => {
    return pts.every((pt) => {
        const t = line.closestPointToPointParameter(pt, false);
        return t >= 0 && t <= 1;
    });
};

var MountSurface;
(function (MountSurface) {
    MountSurface["Plane"] = "Plane";
    MountSurface["Line"] = "Line";
})(MountSurface || (MountSurface = {}));

/**
 * Applies per-item-type axis overrides to a raw mount-local position and
 * writes the result into the preallocated `adjustedPosition` vector.
 * Each surface case is fully self-contained — scroll to the relevant block
 * to understand what happens on that surface.
 *
 * `mountSlotType` is consulted only by the Plane case to apply wall-only
 * positioning constraints (e.g. floor-standing items pinned to y = 0 when
 * the plane is a wall mount). Pass it whenever the caller knows the slot
 * type; omit (`undefined`) for Line callers where it is irrelevant.
 */
const adjustPosition = (node, rawPosition, adjustedPosition, surface, mountSlotType) => {
    const { x } = rawPosition;
    let y = rawPosition.y;
    let z = rawPosition.z;
    switch (surface) {
        case MountSurface.Plane:
            if (node.type === NodeType.Item) {
                const itemType = node.itemType.get();
                if ([ItemType.window, ItemType.gate, ItemType.reachInCloset].includes(itemType)) {
                    z = -node.size.z.get(); // flush against the back face of the mount surface
                }
                if ([ItemType.gate, ItemType.reachInCloset].includes(itemType)) {
                    y = 0; // gates / reach-in closets always sit at floor level regardless of drag position
                }
                // Wall-mount-plane-only constraints: floor-standing products
                // (gate, base/tall cabinets, base/tall multiClosets, base/tall
                // appliances) cannot float at non-zero height on a wall — pin them
                // to the wall's floor edge (mount-local y = 0). Gate is already
                // pinned above; the explicit branches here cover cabinets,
                // multiClosets, and appliances.
                if (mountSlotType === MountType.wall) {
                    if (itemType === ItemType.cabinet &&
                        (node.cabinetType?.get() === 'base' || node.cabinetType?.get() === 'tall')) {
                        y = 0;
                    }
                    if (itemType === ItemType.multiCloset &&
                        (node.multiClosetType?.get() === 'base' || node.multiClosetType?.get() === 'tall')) {
                        y = 0;
                    }
                    if (itemType === ItemType.appliance &&
                        (node.applianceType?.get() === 'base' || node.applianceType?.get() === 'tall')) {
                        y = 0;
                    }
                }
            }
            break;
        case MountSurface.Line:
            y = 0;
            z = 0;
            if (node.type === NodeType.Item) {
                const itemType = node.itemType.get();
                if ([ItemType.window, ItemType.gate, ItemType.reachInCloset].includes(itemType)) {
                    z = 1e-2 - node.size.z.get(); // slight epsilon so the mesh clears the wall face
                }
                if (itemType === ItemType.window) {
                    y = node.position.y.get();
                }
            }
            break;
    }
    return adjustedPosition.set(x, y, z);
};

const captureSnapshot = (node) => ({
    parentId: node.parent.get(),
    position: {
        x: node.position.x.get(),
        y: node.position.y.get(),
        z: node.position.z.get()
    },
    rotation: {
        x: node.rotation.x.get(),
        y: node.rotation.y.get(),
        z: node.rotation.z.get()
    }
});

// Preallocated objects — never recreated inside the drag handler.
const _mountMatrixInverse = new Matrix4$1();
const _localPoint$1 = new Vector3$1();
const _adjustedPosition$1 = new Vector3$1();
const dragOnMountLine = (draggedNode, mountLine, point, instanceManagers, isInitialFrame = false) => {
    // 1. Capture state before any mutation so we can roll back if needed.
    const snapshot = captureSnapshot(draggedNode);
    // 2. Re-parent and emit hover when entering a new mount surface.
    const mountCmds = buildMountCommands(draggedNode, mountLine, isInitialFrame);
    if (mountCmds.length > 0) {
        draggedNode.core.runCommandsAsTransaction(mountCmds, '', isInitialFrame);
    }
    // 3. Map the world-space intersection point into line-local space.
    _mountMatrixInverse.copy(getMatrixWorld(mountLine)).invert();
    _localPoint$1.copy(point).applyMatrix4(_mountMatrixInverse);
    // 4. Apply per-item-type axis overrides (windows preserve Y, gates/windows flush Z…).
    const draggedNodeOffset = draggedNode.core.draggedNodeOffset.get();
    const rawPosition = { x: _localPoint$1.x - draggedNodeOffset.x, y: _localPoint$1.y, z: _localPoint$1.z };
    adjustPosition(draggedNode, rawPosition, _adjustedPosition$1, MountSurface.Line);
    draggedNode.core.runCommandsAsTransaction(new SetNodeVector3Command(draggedNode.id, VectorProps.position, _adjustedPosition$1), '', isInitialFrame);
    // 5. Bounds check — roll back if any corner falls outside the mount line segment,
    //    or if the new position collides with another item in the scene.
    //    computeNodeCorners without a mount inverse leaves points[] in world space,
    //    which is required by checkCollision.
    //    [FUTURE] Insert snap() between steps 4 and 5.
    computeNodeCorners(draggedNode);
    const line = getNodeLine(mountLine);
    if (!isInsideMountLine(line, points) || checkCollision(draggedNode.id, instanceManagers)) {
        draggedNode.core.runCommandsAsTransaction(buildRollbackCommands(draggedNode, snapshot), '', isInitialFrame);
        return false;
    }
    return true;
};

const calculateCurvePoint = (json, path, core, options) => {
    const exists = calculateValue(json.exists || 1, core, options);
    if (!exists) {
        return;
    }
    if (!json.type || json.type === 'moveTo') {
        const x = calculateValue(json.x, core, options);
        const y = calculateValue(json.y, core, options);
        path.moveTo(x, y);
    }
    else if (json.type === 'lineTo') {
        const x = calculateValue(json.x, core, options);
        const y = calculateValue(json.y, core, options);
        path.lineTo(x, y);
    }
    else if (json.type === 'arcTo') {
        /* elliptic or circular arc*/
        const centerX = calculateValue(json.center.x, core, options);
        const centerY = calculateValue(json.center.y, core, options);
        const radius = calculateValue(json.radius, core, options);
        const radiusY = json.radiusY ? calculateValue(json.radiusY, core, options) : radius;
        const rotation = json.rotation ? calculateValue(json.rotation, core, options) : 0;
        const startAngle = MathUtils.DEG2RAD * calculateValue(json.startAngle, core, options);
        const endAngle = MathUtils.DEG2RAD * calculateValue(json.endAngle, core, options);
        const clockwise = !!calculateValue(json.clockwise, core, options);
        path.absellipse(centerX, centerY, radius, radiusY, startAngle, endAngle, clockwise, rotation);
    }
    else if (json.type === 'bezierCurveTo') {
        /* Quadratic Bezier*/
        path.quadraticCurveTo(calculateValue(json.controlPoint1.x, core, options), calculateValue(json.controlPoint1.y, core, options), calculateValue(json.x, core, options), calculateValue(json.y, core, options));
    }
    /* else if ( json.type === 'cubicBezierCurveTo' ) { // Cubic Bezier
      const point = Reflect.apply( calculateVector2, this, [json] );
      const controlPoint1 = Reflect.apply( calculateVector2, this, [json.controlPoint1] );
      const controlPoint2 = Reflect.apply( calculateVector2, this, [json.controlPoint2] );
      path.bezierCurveTo( controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, point.x, point.y );
    }*/
};

const calculateCurve = (curve, path, core, options) => {
    for (let i = 0; i < curve.length; i += 1) {
        calculateCurvePoint(curve[i], path, core, options);
    }
};

const createShape = (core, value, options) => {
    const shape = new Shape();
    //@ts-expect-error - TODO: fix this
    const sourcedValue = importSourceFromCatalog(core, value, options);
    calculateCurve(sourcedValue.curve, shape, core, options);
    if (sourcedValue.holes) {
        for (let i = 0; i < (sourcedValue.holes || []).length; i += 1) {
            const path = new Path();
            calculateCurve(sourcedValue.holes[i], path, core, options);
            shape.holes.push(path);
        }
    }
    return shape;
};

/**
 * Calculates the center of a circle and the start/end angles for a given circular segment.
 *
 * @param p1x - Start point X coordinate.
 * @param p1y - Start point Y coordinate.
 * @param p2x - End point X coordinate.
 * @param p2y - End point Y coordinate.
 * @param radius - The radius of the circle.
 * @param clockwise - The direction of the arc from P1 to P2.
 * @returns An object containing the center coordinates (cx, cy) and angles (startAngle, endAngle) in radians.
 */
function calculateCircleSegmentProps(p1x, p1y, p2x, p2y, radius, clockwise) {
    // 1. Calculate midpoint M(xm, ym)
    const xm = (p1x + p2x) / 2;
    const ym = (p1y + p2y) / 2;
    // 2. Calculate half distance d between P1 and P2
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const d = Math.sqrt(dx * dx + dy * dy) / 2;
    if (d > Math.abs(radius)) {
        throw new Error('Points are too far apart for the given radius.');
    }
    // 3. Calculate distance h from midpoint to center
    // Use Math.abs(radius) as h calculation depends on r^2
    const h = Math.sqrt(Math.abs(radius * radius) - d * d);
    // 4. Calculate the unit vector V_unit perpendicular to the chord
    const ux = dx / (2 * d); // Normalized chord vector x
    const uy = dy / (2 * d); // Normalized chord vector y
    // Perpendicular unit vector (normalized V)
    // To get V_unit: (-uy, ux) for one direction, (uy, -ux) for the other
    let vUx;
    let vUy;
    // The choice of center depends on the clockwise flag.
    // The direction of the perpendicular vector matters here.
    if (clockwise) {
        // If clockwise, we choose the center such that the path goes right
        vUx = -uy;
        vUy = ux;
    }
    else {
        // If counter-clockwise, we choose the other center
        vUx = uy;
        vUy = -ux;
    }
    // 5. Determine the center coordinates C(cx, cy)
    // The center is M +/- h * V_unit
    // We adjust the sign based on the 'clockwise' boolean which selected the correct vU already
    const cx = xm + h * vUx;
    const cy = ym + h * vUy;
    // 6. Calculate the start and end angles using atan2
    // atan2(y, x) returns radians in the range (-PI, PI]
    const startAngle = Math.atan2(p1y - cy, p1x - cx);
    const endAngle = Math.atan2(p2y - cy, p2x - cx);
    // Optional: Normalization/adjustment of endAngle to ensure the sweep is correct
    // atan2 gives angles relative to the x-axis, but doesn't guarantee the sweep direction between the two.
    // The center calculation above ensures the arc exists, but standard plotting might need adjusted angles.
    // Most drawing libraries handle this if given the center, radius, and start/end points.
    // If you need normalized sweep angles for a custom renderer:
    // Example adjustment for consistent sweep representation (optional):
    // let adjustedEndAngle = endAngle;
    // if (clockwise && endAngle > startAngle) {
    //     adjustedEndAngle -= 2 * Math.PI;
    // } else if (!clockwise && endAngle < startAngle) {
    //     adjustedEndAngle += 2 * Math.PI;
    // }
    return {
        cx,
        cy,
        startAngle, // Radians from the positive X-axis
        endAngle // Radians from the positive X-axis
    };
}
const getPoint = (core, uuid) => {
    const node = getNode(core, uuid);
    if (node.type !== NodeType.Point) {
        throw new Error('Segment point is not a Point');
    }
    return node;
};
const addSegment = (core, path, segment, transformed = true) => {
    switch (segment.segmentType) {
        case SegmentType.linear:
            {
                const to = getPoint(core, segment.to.get());
                path.lineTo(to.position.x.get(), transformed ? to.position.y.getTransformed() : to.position.y.get());
            }
            break;
        case SegmentType.arc:
            {
                const from = getPoint(core, segment.from.get());
                const to = getPoint(core, segment.to.get());
                const radius = segment.radius.get();
                const clockwise = segment.clockwise.get();
                const { cx, cy, startAngle, endAngle } = calculateCircleSegmentProps(from.position.x.get(), transformed ? from.position.y.getTransformed() : from.position.y.get(), to.position.x.get(), transformed ? to.position.y.getTransformed() : to.position.y.get(), radius, clockwise);
                path.absarc(cx, cy, radius, startAngle, endAngle, clockwise);
            }
            break;
        case SegmentType.bezier:
            {
                const point1 = getPoint(core, segment.point1.get());
                const to = getPoint(core, segment.to.get());
                path.quadraticCurveTo(point1.position.x.get(), point1.position.y.get(), to.position.x.get(), to.position.y.get());
            }
            break;
    }
};
const getShapeFromSegmentsAndHoles = (core, segments, holes, transformed = true) => {
    const firstSegment = getNode(core, segments[0]);
    if (firstSegment.type !== NodeType.RoomSegment) {
        throw new Error('Shape segment is not a Segment');
    }
    const from = getPoint(core, firstSegment.from.get());
    const shape = new Shape().moveTo(from.position.x.get(), transformed ? from.position.y.getTransformed() : from.position.y.get());
    for (let i = 0; i < segments.length; i += 1) {
        const segment = getNode(core, segments[i]);
        if (segment.type !== NodeType.RoomSegment) {
            throw new Error('Shape segment is not a Segment');
        }
        addSegment(core, shape, segment, transformed);
    }
    for (let i = 0; i < holes.length; i += 1) {
        const hole = holes[i];
        const firstSegment = getNode(core, hole[0]);
        if (firstSegment.type !== NodeType.RoomSegment) {
            throw new Error('Shape segment is not a Segment');
        }
        const from = getPoint(core, firstSegment.from.get());
        const holePath = new Path().moveTo(from.position.x.get(), transformed ? from.position.y.getTransformed() : from.position.y.get());
        for (let j = 0; j < hole.length; j += 1) {
            const segment = getNode(core, hole[j]);
            if (segment.type !== NodeType.RoomSegment) {
                throw new Error('Hole segment is not a Segment');
            }
            addSegment(core, holePath, segment, transformed);
        }
        shape.holes.push(holePath);
    }
    return shape;
};

const getRoomChildShape = ({ id, core, type }, transformed = true) => {
    const room = getOptionalParentRoom(core, id);
    if (!room || room.type !== NodeType.Room) {
        getMonitor().warn(`${type} parent is not a Room`);
        return new Shape();
    }
    const { path, holes } = room;
    const shape = getShapeFromSegmentsAndHoles(core, path.get(), holes.get(), transformed);
    return shape;
};

const getWall2DShape = (node, withHoles = true, excludeNodeHoleIds = []) => {
    const { parent, core } = node;
    const roomSegment = getNode(core, parent.get());
    if (!roomSegment || roomSegment.type !== NodeType.RoomSegment || roomSegment.segmentType !== SegmentType.linear) {
        getMonitor().warn('Wall2D parent is not a linear segment');
        return new Shape();
    }
    const { from, to } = roomSegment;
    const fromPoint = getPoint$1(core, from.get());
    const toPoint = getPoint$1(core, to.get());
    const width = Math.sqrt(Math.pow(toPoint.position.x.get() - fromPoint.position.x.get(), 2) +
        Math.pow(toPoint.position.y.get() - fromPoint.position.y.get(), 2));
    // A wall drawn corner-by-corner exists as a `Wall2D` under its `RoomSegment`
    // long before the polygon closes and a `Room` is created, so the owning room
    // is genuinely absent for the whole draw gesture. Resolve it once — both the
    // cathedral profile and the wall height below depend on it.
    const room = getOptionalParentRoom(core, node.id);
    // Pull cathedral context from the parent Room. When active, the wall's top
    // edge follows the cathedral profile and the WallHeight attribute is ignored.
    let topProfile;
    if (room) {
        const ctx = room.cathedralContext.value;
        if (ctx.type === CeilingType.Cathedral) {
            topProfile = ctx.wallTopProfiles.get(node.id);
        }
    }
    const shape = new Shape();
    shape.moveTo(0, 0);
    if (topProfile && topProfile.length >= 2) {
        // Cathedral: build the polygon with the polyline as the top edge.
        shape.lineTo(0, topProfile[0].y);
        for (let i = 1; i < topProfile.length; i += 1) {
            shape.lineTo(topProfile[i].x, topProfile[i].y);
        }
        shape.lineTo(width, 0);
        shape.lineTo(0, 0);
    }
    else {
        // `Wall2D.WallHeight` is the formula `roomAttribute WallHeight`, which hops
        // to the owning Room's own `projectSetting roomSettings.wHeight`. With no
        // room yet that first hop has nothing to resolve against: `evaluateToken`
        // warns ("roomAttribute called on non-room node WallHeight") and yields 0,
        // collapsing the shape to a zero-area quad — which triangulates to no
        // faces, so the wall mesh then issues a `drawIndexed(0)` every frame.
        // Read the project setting the room would have resolved to instead; it is
        // the same value the wall inherits the moment the polygon closes.
        const height = room
            ? getAttributeValue(node, 'WallHeight')
            : core.projectSettings.roomSettings.wHeight.get();
        shape.lineTo(0, height);
        shape.lineTo(width, height);
        shape.lineTo(width, 0);
        shape.lineTo(0, 0);
    }
    if (withHoles) {
        const { holes } = node;
        const holeEntries = Object.entries(holes.get());
        for (let i = 0; i < holeEntries.length; i += 1) {
            const [holeId, holeCurve] = holeEntries[i];
            if (excludeNodeHoleIds.includes(holeId))
                continue; // skip some nodes own cutouts
            const path = new Path();
            calculateCurve(holeCurve, path, node.core, { nodeId: node.id });
            shape.holes.push(path);
        }
    }
    return shape;
};

const getMountPlaneShape = (node, withHoles = true, excludeNodeHoleIds = []) => {
    let shape = new Shape();
    const parent = getNode(node.core, node.parent.get());
    if (node.shape && node.shape.get()) {
        shape = createShape(node.core, node.shape.get(), node.shape.getOptions());
    }
    else {
        switch (parent.type) {
            case NodeType.Panel:
            case NodeType.Countertop:
            case NodeType.ToeKickPanel:
                shape = createShape(node.core, parent.shape.get(), parent.shape.getOptions());
                break;
            case NodeType.Wall2D:
                shape = getWall2DShape(parent, withHoles, excludeNodeHoleIds);
                break;
            case NodeType.Ceiling2D: {
                // Cathedral case: derive the per-facet polygon from the room's
                // cathedral context. The MountPlane's index in `Ceiling2D.children`
                // is the facet index (kept in sync by `ceilingMountPlanesSyncEffect`).
                // Falls through to the room-footprint shape for flat ceilings, and
                // also as a defensive fallback when the facet is missing mid-sync.
                try {
                    const room = getParentRoom(node.core, parent.id);
                    const ctx = room.cathedralContext.value;
                    if (ctx.type === CeilingType.Cathedral) {
                        const idx = parent.children.get().indexOf(node.id);
                        const facet = ctx.ceilingFacets[idx];
                        if (facet) {
                            const pose = computeFacetMountPose(facet);
                            if (pose) {
                                const facetShape = new Shape();
                                const pts = pose.polygon2D;
                                if (pts.length > 0) {
                                    facetShape.moveTo(pts[0].x, pts[0].y);
                                    for (let i = 1; i < pts.length; i += 1) {
                                        facetShape.lineTo(pts[i].x, pts[i].y);
                                    }
                                    facetShape.closePath();
                                    shape = facetShape;
                                    break;
                                }
                            }
                        }
                    }
                }
                catch {
                    // fall through to flat behavior
                }
                shape = getRoomChildShape(parent, false);
                break;
            }
            case NodeType.Floor2D:
                shape = getRoomChildShape(parent);
                break;
            default: {
                if (!shape) {
                    getMonitor().warn(`Unsupported MountPlane parent type (without own shape property): ${parent.type}`, node);
                }
            }
        }
    }
    return shape;
};

const createNudgeResult = () => ({
    nudged: false,
    positionDelta: new Vector3$1(),
    feasible: false
});
// ─── Module-level scratch ────────────────────────────────────────────────────
// Per project performance rules: no allocations inside the nudge hot path.
const _q$2 = new Quaternion$1();
const _euler$1 = new Euler();
const _widthAxis$2 = new Vector3$1();
const _secondAxis$2 = new Vector3$1();
const _instanceMatrix$2 = new Matrix4$1();
const _candidateCorner$2 = new Vector3$1();
// Cap on neighbors processed per frame. In practice scenes have far fewer
// active instances than this; the cap exists purely so the projected-AABB
// SoA buffers stay preallocated. If exceeded, the remainder is ignored —
// the post-nudge ground-truth `checkCollision` (full SAT) will still
// catch any residual overlap and rollback as a safety net.
const NEIGHBOR_CAP$1 = 256;
const _neighborMinW$1 = new Float64Array(NEIGHBOR_CAP$1);
const _neighborMaxW$1 = new Float64Array(NEIGHBOR_CAP$1);
const _neighborMinS$1 = new Float64Array(NEIGHBOR_CAP$1);
const _neighborMaxS$1 = new Float64Array(NEIGHBOR_CAP$1);
let _neighborCount$1 = 0;
// Constants — kept module-level so they are not re-allocated per call.
// `_emptyExcludeIds` is passed through `getMountPlaneShape`'s third arg.
const _emptyExcludeIds = [];
// Iteration loop bounds — converges in 2-3 iterations for typical
// containment + single-neighbor MTV; the higher cap absorbs multi-neighbor
// pile-ups without spinning forever.
const MAX_ITER$1 = 8;
const NUDGE_EPS = 1e-6;
/** Slack on the mount-normal overlap gate — exactly-touching spans don't overlap. */
const MOUNT_NORMAL_EPS$1 = 1e-6;
// ─── Public entry ────────────────────────────────────────────────────────────
/**
 * Compute a position delta that brings the dragged Item back inside the
 * MountPlane shape and out of every overlapping neighbor along the dragged
 * node's own width and secondary axes. Mutates `out`.
 *
 * Coordinate convention matches `snap.ts`:
 *   - width axis  = item-local +X expressed in mount-local space
 *   - second axis = item-local +Y for wall (height) or +Z for planar (depth)
 * The dragged item's own AABB along these axes is exactly `[0, sizeW]` and
 * `[0, sizeS]` (origin sits at the min corner — same convention as the
 * snap module).
 *
 * Magnitude is uncapped (does NOT respect `snapSensitivity`) — the nudge
 * applies whatever delta the constraints demand. If the dragged item is
 * larger than the mount on either axis, or all iterations cannot resolve
 * the constraints, `feasible` stays `false` and the caller rolls back.
 *
 * Skips entirely (returns infeasible result) when the dragged node is not
 * an Item or when the mount slot type is unsupported.
 */
const nudgeIntoMountAndOutOfCollision = (draggedNode, mountPlane, proposedPos, instanceManagers, mountMatrixInverse, out) => {
    out.nudged = false;
    out.feasible = false;
    out.positionDelta.set(0, 0, 0);
    if (draggedNode.type !== NodeType.Item)
        return;
    const slotType = mountPlane.mountSlotTypes.get()[0];
    const isWall = slotType === MountType.wall;
    const isPlanar = slotType === MountType.floor || slotType === MountType.ceiling || slotType === MountType.countertop;
    if (!isWall && !isPlanar)
        return;
    // Width / secondary axes in mount-local space, derived from the dragged
    // node's current rotation (relative to the mount, since the mount is
    // already its parent at this point in the drag pipeline).
    _euler$1.set(draggedNode.rotation.x.get(), draggedNode.rotation.y.get(), draggedNode.rotation.z.get());
    _q$2.setFromEuler(_euler$1);
    _widthAxis$2.set(1, 0, 0).applyQuaternion(_q$2);
    if (isWall)
        _secondAxis$2.set(0, 1, 0).applyQuaternion(_q$2);
    else
        _secondAxis$2.set(0, 0, 1).applyQuaternion(_q$2);
    const sizeW = draggedNode.size.x.get();
    const sizeS = isWall ? draggedNode.size.y.get() : draggedNode.size.z.get();
    if (sizeW <= 0 || sizeS <= 0)
        return;
    // Span on the mount-normal axis (mount-local +Z — height for a planar mount,
    // depth for a wall). The neighbor pass below works purely in (W, S), so
    // without the gate it nudges the item away from products it cannot touch:
    // a ceiling fixture overhead, a wall cabinet above a base run. Mirrors
    // `snap.ts`'s `_dragRangeT` and `resolveCollisionSnap`.
    const dragMinT = proposedPos.z;
    const dragMaxT = proposedPos.z + (isWall ? draggedNode.size.z.get() : draggedNode.size.y.get());
    // ── Mount bounds projected onto the dragged item's axes ──────────────────
    // The mount shape lives in mount-local 2D (z = 0 on the plane), so each
    // polygon vertex projects via XY components only. Both `_widthAxis` and
    // `_secondAxis` have z = 0 for wall and planar mounts (default rotations
    // keep these axes in the mount plane), which means the .z component of
    // any 3D dot-product participant is multiplied by 0 anyway.
    const shape = getMountPlaneShape(mountPlane, false, _emptyExcludeIds);
    const pts = shape.getPoints(0);
    let mountMinW = Infinity;
    let mountMaxW = -Infinity;
    let mountMinS = Infinity;
    let mountMaxS = -Infinity;
    for (let i = 0; i < pts.length; i++) {
        const px = pts[i].x;
        const py = pts[i].y;
        const w = px * _widthAxis$2.x + py * _widthAxis$2.y;
        const s = px * _secondAxis$2.x + py * _secondAxis$2.y;
        if (w < mountMinW)
            mountMinW = w;
        if (w > mountMaxW)
            mountMaxW = w;
        if (s < mountMinS)
            mountMinS = s;
        if (s > mountMaxS)
            mountMaxS = s;
    }
    if (!Number.isFinite(mountMinW))
        return; // empty / degenerate shape
    // Infeasible if the dragged item is bigger than the mount on either axis
    // — no slide can satisfy containment. Rollback to snapshot.
    if (sizeW > mountMaxW - mountMinW + NUDGE_EPS)
        return;
    if (sizeS > mountMaxS - mountMinS + NUDGE_EPS)
        return;
    // ── Project neighbor instances into (W, S) AABBs ─────────────────────────
    _neighborCount$1 = 0;
    const draggedIsCeiling = isCeilingMountedNode(draggedNode.core, draggedNode.id);
    outer: for (let mi = 0; mi < instanceManagers.length; mi++) {
        const im = instanceManagers[mi];
        const mesh = im.getMesh();
        const nodeViews = im.getNodeViews();
        for (const [index, nodeView] of nodeViews) {
            if (nodeView.id === draggedNode.id)
                continue;
            if (_neighborCount$1 >= NEIGHBOR_CAP$1)
                break outer;
            // Mount-group gate — see `itemMountGroups.ts` in designer-core. Like
            // `resolveCollisionSnap`, this pass ignores the mount-normal axis, so a
            // ceiling fixture would otherwise be nudged around as a real obstacle.
            if (isCeilingMountedNode(draggedNode.core, nodeView.id) !== draggedIsCeiling)
                continue;
            // @ts-expect-error TODO: Matrix4 types between three and designer-core are incompatible
            mesh.getMatrixAt(index, _instanceMatrix$2);
            let nMinW = Infinity;
            let nMaxW = -Infinity;
            let nMinS = Infinity;
            let nMaxS = -Infinity;
            let nMinT = Infinity;
            let nMaxT = -Infinity;
            for (let c = 0; c < 8; c++) {
                _candidateCorner$2.copy(pointOffsets[c]).applyMatrix4(_instanceMatrix$2).applyMatrix4(mountMatrixInverse);
                const w = _candidateCorner$2.dot(_widthAxis$2);
                const s = _candidateCorner$2.dot(_secondAxis$2);
                const t = _candidateCorner$2.z; // mount-normal axis
                if (w < nMinW)
                    nMinW = w;
                if (w > nMaxW)
                    nMaxW = w;
                if (s < nMinS)
                    nMinS = s;
                if (s > nMaxS)
                    nMaxS = s;
                if (t < nMinT)
                    nMinT = t;
                if (t > nMaxT)
                    nMaxT = t;
            }
            if (!Number.isFinite(nMinW))
                continue;
            // Mount-normal overlap — see `dragMinT` / `dragMaxT` above.
            if (nMinT >= dragMaxT - MOUNT_NORMAL_EPS$1)
                continue;
            if (nMaxT <= dragMinT + MOUNT_NORMAL_EPS$1)
                continue;
            _neighborMinW$1[_neighborCount$1] = nMinW;
            _neighborMaxW$1[_neighborCount$1] = nMaxW;
            _neighborMinS$1[_neighborCount$1] = nMinS;
            _neighborMaxS$1[_neighborCount$1] = nMaxS;
            _neighborCount$1++;
        }
    }
    // ── Iterative resolve (containment clamp + worst-area neighbor MTV) ──────
    const propW = proposedPos.dot(_widthAxis$2);
    const propS = proposedPos.dot(_secondAxis$2);
    let curW = propW;
    let curS = propS;
    let converged = false;
    for (let iter = 0; iter < MAX_ITER$1; iter++) {
        let dW = 0;
        let dS = 0;
        // Containment clamp — independent per axis. The infeasibility check
        // above guarantees both bounds violations cannot fire simultaneously
        // on a single axis, so `else if` is safe.
        if (curW < mountMinW)
            dW = mountMinW - curW;
        else if (curW + sizeW > mountMaxW)
            dW = mountMaxW - sizeW - curW;
        if (curS < mountMinS)
            dS = mountMinS - curS;
        else if (curS + sizeS > mountMaxS)
            dS = mountMaxS - sizeS - curS;
        // Worst-overlap-area neighbor MTV — resolve the largest collision
        // first, re-evaluate next iteration. Picking the smaller-overlap axis
        // gives the minimum-magnitude escape per neighbor.
        let bestArea = 0;
        let bestOvW = 0;
        let bestOvS = 0;
        let bestSignW = 0;
        let bestSignS = 0;
        const loW = curW;
        const hiW = curW + sizeW;
        const loS = curS;
        const hiS = curS + sizeS;
        for (let n = 0; n < _neighborCount$1; n++) {
            const ovW = Math.min(hiW, _neighborMaxW$1[n]) - Math.max(loW, _neighborMinW$1[n]);
            if (ovW <= 0)
                continue;
            const ovS = Math.min(hiS, _neighborMaxS$1[n]) - Math.max(loS, _neighborMinS$1[n]);
            if (ovS <= 0)
                continue;
            const area = ovW * ovS;
            if (area > bestArea) {
                bestArea = area;
                bestOvW = ovW;
                bestOvS = ovS;
                const dragCenterW = (loW + hiW) * 0.5;
                const dragCenterS = (loS + hiS) * 0.5;
                const nCenterW = (_neighborMinW$1[n] + _neighborMaxW$1[n]) * 0.5;
                const nCenterS = (_neighborMinS$1[n] + _neighborMaxS$1[n]) * 0.5;
                // Push away from the neighbor center on whichever axis we end up
                // using as the MTV direction.
                bestSignW = dragCenterW < nCenterW ? -1 : 1;
                bestSignS = dragCenterS < nCenterS ? -1 : 1;
            }
        }
        if (bestArea > 0) {
            if (bestOvW <= bestOvS)
                dW += bestSignW * bestOvW;
            else
                dS += bestSignS * bestOvS;
        }
        if (Math.abs(dW) < NUDGE_EPS && Math.abs(dS) < NUDGE_EPS) {
            converged = true;
            break;
        }
        curW += dW;
        curS += dS;
    }
    if (!converged)
        return;
    const deltaW = curW - propW;
    const deltaS = curS - propS;
    out.feasible = true;
    if (Math.abs(deltaW) < NUDGE_EPS && Math.abs(deltaS) < NUDGE_EPS) {
        // Numerical edge case: the conservative-bounds projection said no nudge
        // is needed even though the ground-truth check failed. The caller's
        // post-nudge re-validation will rollback if the original failure was
        // real (e.g. concave-shape containment, rotated-OBB collision).
        out.nudged = false;
        return;
    }
    out.positionDelta.set(_widthAxis$2.x * deltaW + _secondAxis$2.x * deltaS, _widthAxis$2.y * deltaW + _secondAxis$2.y * deltaS, _widthAxis$2.z * deltaW + _secondAxis$2.z * deltaS);
    out.nudged = true;
};

const createResolveResult = () => ({
    resolved: false,
    positionDelta: new Vector3$1()
});
// ─── Module-level scratch ────────────────────────────────────────────────────
// Per project performance rules: no allocations inside this hot path.
const _q$1 = new Quaternion$1();
const _euler = new Euler();
const _widthAxis$1 = new Vector3$1();
const _secondAxis$1 = new Vector3$1();
const _instanceMatrix$1 = new Matrix4$1();
const _candidateCorner$1 = new Vector3$1();
// SoA neighbor storage. Fixed-size buffers preallocated once.
const NEIGHBOR_CAP = 256;
const _neighborMinW = new Float64Array(NEIGHBOR_CAP);
const _neighborMaxW = new Float64Array(NEIGHBOR_CAP);
const _neighborMinS = new Float64Array(NEIGHBOR_CAP);
const _neighborMaxS = new Float64Array(NEIGHBOR_CAP);
let _neighborCount = 0;
// Iteration bounds — converges in 1-2 iterations for the typical
// single-neighbor case (window vs. door); the higher cap absorbs
// multi-neighbor pile-ups (e.g. window squeezed between two doors)
// without spinning forever.
const MAX_ITER = 8;
const RESOLVE_EPS = 1e-6;
/** Slack on the mount-normal overlap gate — exactly-touching spans don't overlap. */
const MOUNT_NORMAL_EPS = 1e-6;
// ─── Public entry ────────────────────────────────────────────────────────────
/**
 * Compute an uncapped position delta that pushes the dragged Item to the
 * nearest edge-to-edge position with any neighbor whose 2D AABB it
 * intersects on the dragged item's width / secondary axes.
 *
 * Coordinate convention matches `snap.ts` / `nudge.ts`:
 *   - width axis  = item-local +X expressed in mount-local space
 *   - secondary  = item-local +Y for wall (height) or +Z for planar (depth)
 *
 * Trigger condition (catches the cutout-relevant touch-on-orthogonal case):
 *   strict overlap on at least one axis AND overlap-or-touch on the other.
 * Items at perfect edge-to-edge are NOT triggered (`trueGap == 0` on every
 * axis is the desired terminal state).
 *
 * Magnitude is uncapped (does NOT respect `snapSensitivity`) — the cursor
 * already moved the item past tolerance into a neighbor; we want it parked
 * at edge-to-edge regardless of how far past tolerance the cursor went.
 *
 * Skips entirely (returns un-resolved result) when the dragged node is not
 * an Item or when the mount slot type is unsupported.
 */
const resolveCollisionSnap = (draggedNode, mountPlane, proposedPos, instanceManagers, mountMatrixInverse, out) => {
    out.resolved = false;
    out.positionDelta.set(0, 0, 0);
    if (draggedNode.type !== NodeType.Item)
        return out;
    const slotType = mountPlane.mountSlotTypes.get()[0];
    const isWall = slotType === MountType.wall;
    const isPlanar = slotType === MountType.floor || slotType === MountType.ceiling || slotType === MountType.countertop;
    if (!isWall && !isPlanar)
        return out;
    // Width / secondary axes in mount-local space, derived from the dragged
    // node's current rotation (relative to the mount, which is its parent
    // at this point in the drag pipeline).
    _euler.set(draggedNode.rotation.x.get(), draggedNode.rotation.y.get(), draggedNode.rotation.z.get());
    _q$1.setFromEuler(_euler);
    _widthAxis$1.set(1, 0, 0).applyQuaternion(_q$1);
    if (isWall)
        _secondAxis$1.set(0, 1, 0).applyQuaternion(_q$1);
    else
        _secondAxis$1.set(0, 0, 1).applyQuaternion(_q$1);
    const sizeW = draggedNode.size.x.get();
    const sizeS = isWall ? draggedNode.size.y.get() : draggedNode.size.z.get();
    if (sizeW <= 0 || sizeS <= 0)
        return out;
    // Span on the mount-normal axis (mount-local +Z — height for a planar mount,
    // depth for a wall). This pass reasons purely in (W, S), so without the gate
    // below a product the dragged item cannot possibly touch — a ceiling light
    // overhead, a wall cabinet above a base run — reads as an overlapping
    // neighbor and shoves it aside. Mirrors `snap.ts`'s `_dragRangeT`.
    const dragMinT = proposedPos.z;
    const dragMaxT = proposedPos.z + (isWall ? draggedNode.size.z.get() : draggedNode.size.y.get());
    // ── Project neighbor instances into (W, S) AABBs ─────────────────────────
    // Uses raw 0..1 corners (uninset) — the resolver must mirror TRUE
    // geometric edges, not the SAT-robustness inset.
    _neighborCount = 0;
    const draggedIsCeiling = isCeilingMountedNode(draggedNode.core, draggedNode.id);
    outer: for (let mi = 0; mi < instanceManagers.length; mi++) {
        const im = instanceManagers[mi];
        const mesh = im.getMesh();
        const nodeViews = im.getNodeViews();
        for (const [index, nodeView] of nodeViews) {
            if (nodeView.id === draggedNode.id)
                continue;
            if (_neighborCount >= NEIGHBOR_CAP)
                break outer;
            // Mount-group gate — see `itemMountGroups.ts` in designer-core. This pass
            // drops the mount-normal axis entirely, so without the gate a ceiling
            // fixture reads as an overlapping neighbor and pushes the item aside.
            if (isCeilingMountedNode(draggedNode.core, nodeView.id) !== draggedIsCeiling)
                continue;
            // @ts-expect-error TODO: Matrix4 types between three and designer-core are incompatible
            mesh.getMatrixAt(index, _instanceMatrix$1);
            let nMinW = Infinity;
            let nMaxW = -Infinity;
            let nMinS = Infinity;
            let nMaxS = -Infinity;
            let nMinT = Infinity;
            let nMaxT = -Infinity;
            for (let c = 0; c < 8; c++) {
                _candidateCorner$1.copy(rawCornerOffsets[c]).applyMatrix4(_instanceMatrix$1).applyMatrix4(mountMatrixInverse);
                const w = _candidateCorner$1.dot(_widthAxis$1);
                const s = _candidateCorner$1.dot(_secondAxis$1);
                const t = _candidateCorner$1.z; // mount-normal axis
                if (w < nMinW)
                    nMinW = w;
                if (w > nMaxW)
                    nMaxW = w;
                if (s < nMinS)
                    nMinS = s;
                if (s > nMaxS)
                    nMaxS = s;
                if (t < nMinT)
                    nMinT = t;
                if (t > nMaxT)
                    nMaxT = t;
            }
            if (!Number.isFinite(nMinW))
                continue;
            // Mount-normal overlap — see `dragMinT` / `dragMaxT` above. Touching
            // spans do not overlap.
            if (nMinT >= dragMaxT - MOUNT_NORMAL_EPS)
                continue;
            if (nMaxT <= dragMinT + MOUNT_NORMAL_EPS)
                continue;
            _neighborMinW[_neighborCount] = nMinW;
            _neighborMaxW[_neighborCount] = nMaxW;
            _neighborMinS[_neighborCount] = nMinS;
            _neighborMaxS[_neighborCount] = nMaxS;
            _neighborCount++;
        }
    }
    if (_neighborCount === 0)
        return out;
    // ── Iterative resolve (edge-to-edge against worst-overlap neighbor) ──────
    const propW = proposedPos.dot(_widthAxis$1);
    const propS = proposedPos.dot(_secondAxis$1);
    let curW = propW;
    let curS = propS;
    for (let iter = 0; iter < MAX_ITER; iter++) {
        // Find the worst (largest-area) intersecting neighbor.
        // Trigger: strict overlap on at least one axis AND overlap-or-touch on
        // the other. This catches the wall window-vs-door case where the
        // window enters the door on W and touches it exactly on S — cutouts
        // overlap geometrically, even though SAT (with 1e-4 inset) would
        // declare the items separated on S.
        let worstIdx = -1;
        let worstScore = 0;
        let worstOvW = 0;
        let worstOvS = 0;
        const dragMinW = curW;
        const dragMaxW = curW + sizeW;
        const dragMinS = curS;
        const dragMaxS = curS + sizeS;
        for (let n = 0; n < _neighborCount; n++) {
            const trueGapW = Math.max(dragMinW - _neighborMaxW[n], _neighborMinW[n] - dragMaxW);
            const trueGapS = Math.max(dragMinS - _neighborMaxS[n], _neighborMinS[n] - dragMaxS);
            const intersects = (trueGapW < 0 && trueGapS <= 0) || (trueGapS < 0 && trueGapW <= 0);
            if (!intersects)
                continue;
            // Score the conflict so the worst neighbor wins. Use overlap on each
            // axis (clamped to >= 0) — falls back to whichever axis is in real
            // overlap when the other is exactly touching (sliver case).
            const ovW = Math.max(0, -trueGapW);
            const ovS = Math.max(0, -trueGapS);
            // Area + max(ovW, ovS) tie-breaker so a 1.5 × 0 sliver still scores
            // above no overlap and is picked.
            const score = ovW * ovS + Math.max(ovW, ovS);
            if (score > worstScore) {
                worstScore = score;
                worstIdx = n;
                worstOvW = ovW;
                worstOvS = ovS;
            }
        }
        if (worstIdx === -1) {
            // No remaining intersection — clean exit.
            const deltaW = curW - propW;
            const deltaS = curS - propS;
            if (Math.abs(deltaW) < RESOLVE_EPS && Math.abs(deltaS) < RESOLVE_EPS)
                return out;
            out.positionDelta.set(_widthAxis$1.x * deltaW + _secondAxis$1.x * deltaS, _widthAxis$1.y * deltaW + _secondAxis$1.y * deltaS, _widthAxis$1.z * deltaW + _secondAxis$1.z * deltaS);
            out.resolved = true;
            return out;
        }
        // Four edge-to-edge candidates against this neighbor:
        //   dW_left  : drag.right ↔ neighbor.left  (push dragged left of neighbor)
        //   dW_right : drag.left  ↔ neighbor.right (push dragged right of neighbor)
        //   dS_down  : drag.top   ↔ neighbor.bottom
        //   dS_up    : drag.bottom↔ neighbor.top
        const dW_left = _neighborMinW[worstIdx] - dragMaxW;
        const dW_right = _neighborMaxW[worstIdx] - dragMinW;
        const dS_down = _neighborMinS[worstIdx] - dragMaxS;
        const dS_up = _neighborMaxS[worstIdx] - dragMinS;
        // Pick the smallest |delta| that ACTUALLY clears the conflict. A
        // candidate "clears" when its magnitude is at least the current
        // overlap on its axis — otherwise it would slide WITHIN the neighbor
        // and not resolve. Equivalent: |dW_*| >= worstOvW for W candidates,
        // |dS_*| >= worstOvS for S candidates. Edge-to-edge candidates by
        // construction satisfy this (they push to exactly touching), but the
        // check guards against numerical edge cases (e.g. ovS == 0 sliver).
        let bestAbs = Infinity;
        let bestDW = 0;
        let bestDS = 0;
        const tryCandidate = (dW, dS, axisOv) => {
            const m = Math.abs(dW) + Math.abs(dS);
            if (m < axisOv - RESOLVE_EPS)
                return; // does not clear
            if (m < bestAbs) {
                bestAbs = m;
                bestDW = dW;
                bestDS = dS;
            }
        };
        tryCandidate(dW_left, 0, worstOvW);
        tryCandidate(dW_right, 0, worstOvW);
        tryCandidate(0, dS_down, worstOvS);
        tryCandidate(0, dS_up, worstOvS);
        if (bestAbs === Infinity) {
            // Pathological: no candidate clears. Bail; downstream SAT / nudge /
            // rollback will catch any residual.
            return out;
        }
        curW += bestDW;
        curS += bestDS;
    }
    // Did not converge within MAX_ITER. Leave un-resolved; the post-write
    // ground-truth check + nudge / rollback safety net handles it.
    return out;
};

/**
 * Depth (inches) of the "wall zone" — the band in front of every mount-shape
 * edge inside which a dragged item turns its back to that wall.
 *
 * Measured from the wall line to the item's BACK face (not to its origin or
 * to the cursor), so a 24"-deep closet whose back is 24" from the wall is
 * still caught while its front face is 48" away.
 *
 * This is deliberately much larger than `snapSensitivity` (5" in practice).
 * Rotation and flush-snapping are two separate tiers:
 *   - inside the zone            → the item rotates to face away from the wall
 *   - inside `snapSensitivity`   → the item additionally slides flush against
 *                                  it (and is clamped to fit along it)
 * Before the zone existed both tiers shared `snapSensitivity`, which meant an
 * item only ever turned once it was already touching the wall — the reason
 * rotating a wide multiCloset required shoving it into the wall repeatedly.
 */
const WALL_ROTATION_ZONE_DEPTH = 24;
/**
 * Zone depth to use for a given mount slot type.
 *
 * The widened zone is floor-only. A countertop is itself ~24" deep, so a 24"
 * band would cover the whole surface and every appliance on it would turn its
 * back to whichever edge it drifted closest to — including the front one.
 * Countertop and ceiling therefore keep the pre-zone behaviour (rotate only
 * once the back face is within `snapSensitivity`); the rest of the wall-zone
 * work — pivoting around the grab point, ignoring walls the item does not
 * stand in front of, fitting the whole item onto the wall — applies to them
 * unchanged.
 */
const wallZoneDepth = (slotType, tolerance) => slotType === MountType.floor ? Math.max(WALL_ROTATION_ZONE_DEPTH, tolerance) : tolerance;
const createWallZoneResult = () => ({
    found: false,
    flush: false,
    dist: Infinity,
    flushDelta: 0,
    originDelta: new Vector3$1(),
    rotation: new Euler(),
    segStart: new Vector2(),
    segDir: new Vector2(),
    segLength: 0
});
// ─── Module-level scratch ────────────────────────────────────────────────────
// Per project performance rules, no allocations inside the drag hot path.
const _qDefault = new Quaternion$1();
const _qExtra = new Quaternion$1();
const _qFull = new Quaternion$1();
const _eulerDefault = new Euler();
const _mountUp = new Vector3$1(0, 0, 1);
const _defaultBack = new Vector3$1();
const _pickOld = new Vector3$1();
const _pickNew = new Vector3$1();
const _backOffset = new Vector3$1();
const _widthVec = new Vector3$1();
const _segDir = new Vector2();
const _segNormal = new Vector2();
/**
 * Find the mount-shape edge whose wall zone the dragged item currently stands
 * in, and describe how the item should be turned to face away from it.
 *
 * Pure geometry — takes the mount shape outline plus the item's drag state and
 * touches no signals, so it is unit-testable without a core / scene mock.
 *
 * @param points        mount-shape outline in mount-local 2D (`Shape.getPoints(0)`)
 * @param slotType      mount slot type; only floor / ceiling / countertop rotate
 * @param proposedPos   mount-local item origin the caller intends to write next
 * @param currentRotation item rotation relative to the mount, right now
 * @param grabOffset    item-local pick point (`core.draggedNodeOffset`)
 * @param sizeX         item width  (item-local X)
 * @param sizeY         item height (item-local Y)
 * @param tolerance     `snapSensitivity` — the flush-snap band
 * @param zoneDepth     depth of the rotation band, see `WALL_ROTATION_ZONE_DEPTH`
 *
 * The evaluated back-face distance depends only on the CURSOR position and the
 * candidate rotation — never on the rotation the item happens to have this
 * frame — so applying the result cannot move the item out of the zone that
 * produced it. That is what keeps the rotation from oscillating frame to frame.
 */
const evaluateWallZone = (points, slotType, proposedPos, currentRotation, grabOffset, sizeX, sizeY, tolerance, zoneDepth, out) => {
    out.found = false;
    out.flush = false;
    out.dist = Infinity;
    out.flushDelta = 0;
    out.originDelta.set(0, 0, 0);
    out.segLength = 0;
    if (points.length < 2 || zoneDepth <= 0 || sizeX <= 0)
        return out;
    // Canonical mount-default rotation — the same one `getMountDefaultRotation`
    // seeds on initial placement. The zone rotation is composed on top of it.
    switch (slotType) {
        case MountType.floor:
        case MountType.countertop:
            _eulerDefault.set(Math.PI / 2, 0, 0);
            break;
        case MountType.ceiling:
            _eulerDefault.set(-Math.PI / 2, 0, 0);
            break;
        default:
            return out;
    }
    _qDefault.setFromEuler(_eulerDefault);
    // Item back direction (item-local −Z) in mount-local space before any extra
    // rotation. Derived from the quaternion so it stays correct if the mount
    // defaults ever change: (0, +1, 0) for floor / countertop, (0, −1, 0) for ceiling.
    _defaultBack.set(0, 0, -1).applyQuaternion(_qDefault);
    // Where the grab point sits relative to the origin under the CURRENT rotation.
    // `proposedPos + _pickOld` is the cursor point the caller resolved this frame.
    _pickOld.copy(grabOffset).applyQuaternion(currentRotation);
    // Winding decides which perpendicular of an edge points into the room:
    // CCW → left perpendicular, CW → right.
    const normalSign = isCCW(points) ? 1 : -1;
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        _segDir.set(b.x - a.x, b.y - a.y);
        const segLength = _segDir.length();
        if (segLength < 1e-6)
            continue;
        _segDir.x /= segLength;
        _segDir.y /= segLength;
        _segNormal.set(-_segDir.y * normalSign, _segDir.x * normalSign);
        // Rotation θ about the mount normal that turns the default back direction
        // onto −n, i.e. presses the item's back face against this wall.
        const theta = Math.atan2(-_segNormal.y, -_segNormal.x) - Math.atan2(_defaultBack.y, _defaultBack.x);
        _qExtra.setFromAxisAngle(_mountUp, theta);
        _qFull.multiplyQuaternions(_qExtra, _qDefault);
        // Re-derive the origin so the grab point stays exactly where the cursor is
        // once the item is turned: origin = cursor − R_new · grabOffset.
        _pickNew.copy(grabOffset).applyQuaternion(_qFull);
        const originX = proposedPos.x + _pickOld.x - _pickNew.x;
        const originY = proposedPos.y + _pickOld.y - _pickNew.y;
        // Back-face centre (item-local (sx/2, sy/2, 0)) after the rotation, and its
        // signed distance to the wall line. Negative = behind the wall.
        _backOffset.set(sizeX * 0.5, sizeY * 0.5, 0).applyQuaternion(_qFull);
        const dist = (originX + _backOffset.x - a.x) * _segNormal.x + (originY + _backOffset.y - a.y) * _segNormal.y;
        const absDist = Math.abs(dist);
        if (absDist > zoneDepth)
            continue;
        if (absDist >= out.dist)
            continue;
        // The item has to actually stand in front of THIS edge, not merely near the
        // infinite line through it — otherwise a short wall on the far side of the
        // room grabs the rotation whenever its extension happens to run close by.
        _widthVec.set(sizeX, 0, 0).applyQuaternion(_qFull);
        const tA = (originX - a.x) * _segDir.x + (originY - a.y) * _segDir.y;
        const tB = tA + _widthVec.x * _segDir.x + _widthVec.y * _segDir.y;
        const tMin = Math.min(tA, tB);
        const tMax = Math.max(tA, tB);
        if (Math.min(tMax, segLength) - Math.max(tMin, 0) <= 0)
            continue;
        out.found = true;
        out.dist = absDist;
        out.flush = absDist <= tolerance;
        out.flushDelta = -dist;
        out.originDelta.set(originX - proposedPos.x, originY - proposedPos.y, 0);
        out.rotation.setFromQuaternion(_qFull);
        out.segStart.set(a.x, a.y);
        out.segDir.set(_segDir.x, _segDir.y);
        out.segLength = segLength;
    }
    return out;
};
/**
 * Delta along `zone.segDir` that slides the item so its WHOLE width lands on
 * the winning wall. Returns 0 when nothing needs to move, and also when the
 * item is wider than the wall — an item that cannot fit is left overhanging
 * (containment / nudge downstream decide whether that placement survives)
 * rather than being yanked to one end.
 *
 * This is the "does the whole item fit on the wall" check: without it the wall
 * snap only ever reasoned about the back-face centre, so an item grabbed near a
 * corner would snap half-way off the wall and get rejected by the containment
 * pass — reading to the user as "this closet refuses to attach".
 *
 * @param originX/originY mount-local item origin after all other snaps
 * @param spanX/spanY     the item's width vector (widthAxis × sizeW) in mount-local 2D
 */
const wallFitDelta = (zone, originX, originY, spanX, spanY) => {
    const tA = (originX - zone.segStart.x) * zone.segDir.x + (originY - zone.segStart.y) * zone.segDir.y;
    const tB = tA + spanX * zone.segDir.x + spanY * zone.segDir.y;
    const tMin = Math.min(tA, tB);
    const tMax = Math.max(tA, tB);
    if (tMax - tMin > zone.segLength)
        return 0;
    if (tMin < 0)
        return -tMin;
    if (tMax > zone.segLength)
        return zone.segLength - tMax;
    return 0;
};

const createSnapResult = () => ({
    snapped: false,
    positionDelta: new Vector3$1(),
    rotation: null,
    wall: null
});
// ─── Module-level scratch ────────────────────────────────────────────────────
// Per project performance rules, no allocations inside the snap hot path.
const _q = new Quaternion$1();
const _eulerCurrent = new Euler();
const _widthAxis = new Vector3$1();
const _secondAxis = new Vector3$1();
const _instanceMatrix = new Matrix4$1();
const _candidateCorner = new Vector3$1();
// Position the axis snaps work from. Equals `proposedPos` unless a wall zone
// re-derived the origin around the grab point (see `wallZone.ts`).
const _workPos = new Vector3$1();
const _wallZone = createWallZoneResult();
// Preallocated payload for `SnapResult.wall` — `snapPlanarMount` copies the winning
// edge into it and points `out.wall` at it, so reporting the wall costs no allocation.
const _wallOut = {
    flush: false,
    segStart: new Vector2(),
    segDir: new Vector2()
};
// Preallocated 3-slot arrays for dragged refs (origin / center / far edge)
// along the width and secondary axes — populated per frame, never re-grown.
const _dragRefsW = [0, 0, 0];
const _dragRefsS = [0, 0, 0];
const _targetRefsW = [0, 0, 0];
const _targetRefsS = [0, 0, 0];
// Snap targets reflect TRUE AABBs (uninset). See `rawCornerOffsets` in
// `./shared` for the rationale — collision / containment use `pointOffsets`
// (1e-4 inset) for SAT robustness, but snap-axis projection must mirror
// actual geometric edges so an edge-to-edge snap lands exactly touching
// (no `size × 1e-4` micro-overlap that breaks wall-cutout CSG).
// Dragged-item bounds on the mount-normal axis (mount-local +Z). For all
// currently supported mount types the mount-normal is invariant under any
// rotation snap supports (wall items are at identity; planar items only
// rotate around mount-Z), so the dragged item's third-axis size is simply
// `size.z` for wall and `size.y` for planar — no axis vector needed.
const _dragRangeT = { min: 0, max: 0 };
// Multiplier applied to `snapSensitivity` for the in-plane perpendicular
// eligibility gate (gapS for width snap, gapW for secondary snap). Decoupled
// from the snap-delta cap inside `contributeWidth` / `contributeSecondary`
// so a neighbor far on the orthogonal axis can still contribute candidates
// without inflating the actual snap distance. The mount-normal gate (gapT)
// stays at 1× to keep cross-mount filtering strict.
const PERP_GATE_MULT = 3;
// ─── Public entry ────────────────────────────────────────────────────────────
/**
 * Compute the snap delta for the dragged Item against neighbor items and the
 * parent MountPlane outline. Mutates `out` and returns it.
 *
 * The snap math operates in the dragged-node's local axes — width is always
 * item-local +X; the secondary axis is item-local +Y for wall mounts and
 * item-local +Z for floor/ceiling/countertop. These axes are expressed as
 * unit vectors in mount-local space using the dragged node's current
 * rotation (read from its `rotation` signal — the rotation is relative to
 * the mount because the mount is the dragged node's parent). On planar mounts
 * the wall zone may replace that rotation first, in which case the axes are
 * re-derived from the new one (see `snapPlanarMount`).
 *
 * `proposedPos` is treated as the mount-local position the caller intends to
 * write next; `out.positionDelta` is added on top (in mount-local space).
 *
 * Skips entirely (returns un-snapped result) when the dragged node is not an
 * Item, or when the mount slot type is unsupported.
 */
const snapDraggedItem = (draggedNode, mountPlane, proposedPos, instanceManagers, mountMatrixInverse, out) => {
    out.snapped = false;
    out.positionDelta.set(0, 0, 0);
    out.rotation = null;
    out.wall = null;
    if (draggedNode.type !== NodeType.Item)
        return out;
    const slotType = mountPlane.mountSlotTypes.get()[0];
    const tolerance = draggedNode.core.projectSettings.snapSensitivity.get();
    if (!Number.isFinite(tolerance) || tolerance <= 0)
        return out;
    // Build the dragged node's rotation in mount-local space and derive the
    // local +X / secondary axes as unit vectors in mount-local space.
    _eulerCurrent.set(draggedNode.rotation.x.get(), draggedNode.rotation.y.get(), draggedNode.rotation.z.get());
    _q.setFromEuler(_eulerCurrent);
    _widthAxis.set(1, 0, 0).applyQuaternion(_q);
    if (slotType === MountType.wall) {
        _secondAxis.set(0, 1, 0).applyQuaternion(_q);
        snapWallMount(draggedNode, mountPlane, proposedPos, instanceManagers, mountMatrixInverse, tolerance, out);
    }
    else if (slotType === MountType.floor || slotType === MountType.ceiling || slotType === MountType.countertop) {
        _secondAxis.set(0, 0, 1).applyQuaternion(_q);
        snapPlanarMount(draggedNode, mountPlane, slotType, proposedPos, instanceManagers, mountMatrixInverse, tolerance, out);
    }
    return out;
};
// ─── Per-axis snap state (mirrors snapCorner.ts contribute pattern) ─────────
const _axisState = {
    // For X axis (width)
    bestDeltaW: 0,
    bestDistW: Infinity,
    // For secondary axis (height for wall, depth for floor/ceiling/countertop)
    bestDeltaS: 0,
    bestDistS: Infinity
};
const resetAxisState = () => {
    _axisState.bestDeltaW = 0;
    _axisState.bestDistW = Infinity;
    _axisState.bestDeltaS = 0;
    _axisState.bestDistS = Infinity;
};
/**
 * Register a candidate that, if applied, would move the dragged item by
 * `deltaW` along the width axis. Keeps the smallest-magnitude winner per axis.
 */
const contributeWidth = (deltaW, tolerance) => {
    const d = Math.abs(deltaW);
    if (d > tolerance)
        return;
    if (d < _axisState.bestDistW) {
        _axisState.bestDistW = d;
        _axisState.bestDeltaW = deltaW;
    }
};
const contributeSecondary = (deltaS, tolerance) => {
    const d = Math.abs(deltaS);
    if (d > tolerance)
        return;
    if (d < _axisState.bestDistS) {
        _axisState.bestDistS = d;
        _axisState.bestDeltaS = deltaS;
    }
};
// ─── Wall mount ──────────────────────────────────────────────────────────────
/**
 * Wall snap: per-axis neighbors (9 candidates per axis) plus 4 mount-edge
 * snaps (left/right/top/bottom edge-to-edge). No rotation change.
 */
const snapWallMount = (draggedNode, mountPlane, proposedPos, instanceManagers, mountMatrixInverse, tolerance, out) => {
    resetAxisState();
    const sizeW = draggedNode.size.x.get();
    const sizeS = draggedNode.size.y.get();
    const proposedW = proposedPos.dot(_widthAxis);
    const proposedS = proposedPos.dot(_secondAxis);
    // Dragged refs along each axis (origin/center/far edge).
    _dragRefsW[0] = proposedW;
    _dragRefsW[1] = proposedW + sizeW * 0.5;
    _dragRefsW[2] = proposedW + sizeW;
    _dragRefsS[0] = proposedS;
    _dragRefsS[1] = proposedS + sizeS * 0.5;
    _dragRefsS[2] = proposedS + sizeS;
    // Mount-normal range — wall items use item-local +Z (depth) which equals
    // mount-local +Z because wall items are at identity rotation.
    _dragRangeT.min = proposedPos.z;
    _dragRangeT.max = proposedPos.z + draggedNode.size.z.get();
    contributeNeighbors(draggedNode, instanceManagers, mountMatrixInverse, tolerance);
    // Mount-edge snaps — only "edge to edge" pairs per the spec.
    contributeWallMountEdges(mountPlane, proposedW, proposedS, sizeW, sizeS, tolerance);
    finalizeAxisOnly(out);
};
/**
 * Edge-to-edge wall mount snap: drag-left → mount-left, drag-right →
 * mount-right, drag-bottom → mount-bottom, drag-top → mount-top.
 * For walls the dragged item rotation is canonical (0, 0, 0), so the width
 * and secondary axes coincide with mount-local X/Y — bounding box of the
 * shape in those axes is sufficient.
 */
const contributeWallMountEdges = (mountPlane, proposedW, proposedS, sizeW, sizeS, tolerance) => {
    const shape = getMountPlaneShape(mountPlane, false, _emptyExcludeIds);
    const pts = shape.getPoints(0);
    if (pts.length === 0)
        return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.x < minX)
            minX = p.x;
        if (p.x > maxX)
            maxX = p.x;
        if (p.y < minY)
            minY = p.y;
        if (p.y > maxY)
            maxY = p.y;
    }
    // Width axis is mount-X for walls (no rotation), so projected positions
    // equal mount-local X / Y respectively.
    contributeWidth(minX - proposedW, tolerance); // drag-left → mount-left
    contributeWidth(maxX - sizeW - proposedW, tolerance); // drag-right → mount-right
    contributeSecondary(minY - proposedS, tolerance); // drag-bottom → mount-bottom
    contributeSecondary(maxY - sizeS - proposedS, tolerance); // drag-top → mount-top
};
// ─── Floor / ceiling / countertop mount ──────────────────────────────────────
/**
 * Planar (floor / ceiling / countertop) snap.
 *
 * Runs in two stages, in this order:
 *
 *   1. **Wall zone** (`wallZone.ts`) — decides whether the item turns its back
 *      to a wall this frame, and re-derives the origin around the grab point so
 *      the item pivots under the cursor instead of around its origin corner.
 *   2. **Per-axis snaps** — neighbor edge/center candidates, evaluated in the
 *      item's width / depth axes.
 *
 * Stage 1 has to come first: the per-axis math projects onto axes derived from
 * the item's rotation, so running it before the rotation is known would snap
 * against the wrong axes on every frame the item turns. Once the zone rotation
 * is adopted, the flush-against-the-wall slide is just another candidate on the
 * depth axis and competes with neighbors on equal terms (nearest wins) — an
 * item joining a run of closets aligns to its neighbor's back rather than
 * fighting it.
 */
const snapPlanarMount = (draggedNode, mountPlane, slotType, proposedPos, instanceManagers, mountMatrixInverse, tolerance, out) => {
    resetAxisState();
    const sizeW = draggedNode.size.x.get();
    const sizeS = draggedNode.size.z.get(); // depth axis = item-local +Z
    // ── Stage 1: wall zone ───────────────────────────────────────────────────
    const shape = getMountPlaneShape(mountPlane, false, _emptyExcludeIds);
    const zone = evaluateWallZone(shape.getPoints(0), slotType, proposedPos, _q, // the item's live rotation, set by `snapDraggedItem`
    draggedNode.core.draggedNodeOffset.get(), sizeW, draggedNode.size.y.get(), tolerance, wallZoneDepth(slotType, tolerance), _wallZone);
    if (zone.found) {
        // Report the winning edge so `dragOnMountPlane` can witness which wall the snap
        // picked. Copied into preallocated scratch — reporting costs no allocation, and
        // the caller only reads it within the frame.
        _wallOut.flush = zone.flush;
        _wallOut.segStart.set(zone.segStart.x, zone.segStart.y);
        _wallOut.segDir.set(zone.segDir.x, zone.segDir.y);
        out.wall = _wallOut;
        // Adopt the wall-aligned rotation before any axis math so the projections
        // below use the axes the item will actually have when the frame is written.
        _q.setFromEuler(zone.rotation);
        _widthAxis.set(1, 0, 0).applyQuaternion(_q);
        _secondAxis.set(0, 0, 1).applyQuaternion(_q);
        _workPos.copy(proposedPos).add(zone.originDelta);
    }
    else {
        _workPos.copy(proposedPos);
    }
    // ── Stage 2: per-axis snaps ──────────────────────────────────────────────
    const proposedW = _workPos.dot(_widthAxis);
    const proposedS = _workPos.dot(_secondAxis);
    _dragRefsW[0] = proposedW;
    _dragRefsW[1] = proposedW + sizeW * 0.5;
    _dragRefsW[2] = proposedW + sizeW;
    _dragRefsS[0] = proposedS;
    _dragRefsS[1] = proposedS + sizeS * 0.5;
    _dragRefsS[2] = proposedS + sizeS;
    // Mount-normal range — planar items map item-local +Y to mount-local +Z
    // via the default rotation, and the optional θ around mount-Z (the wall-zone
    // rotation) preserves mount-Z. So height = size.y on this axis.
    _dragRangeT.min = _workPos.z;
    _dragRangeT.max = _workPos.z + draggedNode.size.y.get();
    contributeNeighbors(draggedNode, instanceManagers, mountMatrixInverse, tolerance);
    // Flush-against-the-wall is a depth-axis candidate: once the item is turned,
    // the wall's inward normal IS the item's +Z. Only offered inside
    // `snapSensitivity` — the wider zone governs rotation only, so an island can
    // still be parked short of a wall.
    if (zone.flush)
        contributeSecondary(zone.flushDelta, tolerance);
    finalizeAxisOnly(out);
    if (!zone.found)
        return;
    out.positionDelta.add(zone.originDelta);
    out.rotation = zone.rotation;
    out.snapped = true;
    // Fit the whole item onto the wall it is attaching to. Only while flush —
    // sliding an item sideways while it is still floating mid-room would read as
    // the wall yanking it.
    if (!zone.flush)
        return;
    const dt = wallFitDelta(zone, proposedPos.x + out.positionDelta.x, proposedPos.y + out.positionDelta.y, _widthAxis.x * sizeW, _widthAxis.y * sizeW);
    if (dt === 0)
        return;
    out.positionDelta.x += dt * zone.segDir.x;
    out.positionDelta.y += dt * zone.segDir.y;
};
// ─── Neighbor projection (shared by wall + planar) ───────────────────────────
/**
 * For every active instance in `instanceManagers` (excluding the dragged
 * node), project the 8 OBB corners into mount-local space and compute the
 * AABB extent on the dragged node's width and secondary axes. Contributes 9
 * snap candidates per axis (3 dragged refs × 3 neighbor refs).
 */
const contributeNeighbors = (draggedNode, instanceManagers, mountMatrixInverse, tolerance) => {
    const draggedNodeId = draggedNode.id;
    const draggedIsCeiling = isCeilingMountedNode(draggedNode.core, draggedNodeId);
    for (let mi = 0; mi < instanceManagers.length; mi++) {
        const im = instanceManagers[mi];
        const mesh = im.getMesh();
        const nodeViews = im.getNodeViews();
        for (const [index, nodeView] of nodeViews) {
            if (nodeView.id === draggedNodeId)
                continue;
            // Mount-group gate — see `itemMountGroups.ts` in designer-core. The
            // mount-normal gate below would reject most ceiling fixtures anyway, but
            // only while the dragged item is short enough; the group rule is exact.
            if (isCeilingMountedNode(draggedNode.core, nodeView.id) !== draggedIsCeiling)
                continue;
            // @ts-expect-error TODO: Matrix4 types between three and designer-core are incompatible
            mesh.getMatrixAt(index, _instanceMatrix);
            let minW = Infinity;
            let maxW = -Infinity;
            let minS = Infinity;
            let maxS = -Infinity;
            let minT = Infinity;
            let maxT = -Infinity;
            // Use UNIT cube corners (0..1) — the inset `pointOffsets` from
            // `./shared` is the wrong basis here (see `rawCornerOffsets`).
            for (let c = 0; c < 8; c++) {
                _candidateCorner.copy(rawCornerOffsets[c]).applyMatrix4(_instanceMatrix).applyMatrix4(mountMatrixInverse);
                const w = _candidateCorner.dot(_widthAxis);
                const s = _candidateCorner.dot(_secondAxis);
                const t = _candidateCorner.z; // mount-normal axis = mount-local +Z
                if (w < minW)
                    minW = w;
                if (w > maxW)
                    maxW = w;
                if (s < minS)
                    minS = s;
                if (s > maxS)
                    maxS = s;
                if (t < minT)
                    minT = t;
                if (t > maxT)
                    maxT = t;
            }
            if (!Number.isFinite(minW) || !Number.isFinite(minS) || !Number.isFinite(minT))
                continue;
            // Mount-normal proximity gate. The W and S axes both lie in the
            // mount plane (their .z is 0), so a neighbor on a different mount
            // surface (e.g. opposite wall) can have its corners projected to
            // similar W/S intervals while sitting hundreds of inches away on
            // the mount-normal. Reject any neighbor whose projected Z range is
            // farther than `tolerance` from the dragged item's Z range —
            // cleanly filters cross-mount items without touching same-mount
            // candidates (whose Z ranges overlap, gapT = 0).
            const gapT = Math.max(0, Math.max(_dragRangeT.min - maxT, minT - _dragRangeT.max));
            if (gapT > tolerance)
                continue;
            // Perpendicular-axis proximity gate. A neighbor contributes
            // width-axis candidates when its projected secondary interval is
            // within `PERP_GATE_MULT × tolerance` of the dragged item's
            // secondary interval, and vice versa. The 3× widening only relaxes
            // ELIGIBILITY — the snap delta itself is still capped at 1×
            // `tolerance` inside `contributeWidth` / `contributeSecondary`. This
            // is what lets two floor items face-to-face snap on width before
            // their depths are flush. `Math.max(0, ...)` clamps overlapping
            // intervals to a gap of 0 — directly-across neighbors stay eligible.
            const dragMinW = _dragRefsW[0];
            const dragMaxW = _dragRefsW[2];
            const dragMinS = _dragRefsS[0];
            const dragMaxS = _dragRefsS[2];
            const gapS = Math.max(0, Math.max(dragMinS - maxS, minS - dragMaxS));
            const gapW = Math.max(0, Math.max(dragMinW - maxW, minW - dragMaxW));
            const perpGate = PERP_GATE_MULT * tolerance;
            const eligibleW = gapS <= perpGate;
            const eligibleS = gapW <= perpGate;
            if (!eligibleW && !eligibleS)
                continue;
            _targetRefsW[0] = minW;
            _targetRefsW[1] = (minW + maxW) * 0.5;
            _targetRefsW[2] = maxW;
            _targetRefsS[0] = minS;
            _targetRefsS[1] = (minS + maxS) * 0.5;
            _targetRefsS[2] = maxS;
            // 5 candidates per axis (down from the full 3×3 = 9): only
            //   (0,0), (0,2), (2,0), (2,2) — any side ↔ any side (edge pairs)
            //   (1,1)                       — center ↔ center
            // Pairs involving index 1 (center) on only one of the two refs are
            // intentionally excluded — center-to-edge produces visually
            // unintuitive snaps. delta = target_ref − drag_ref.
            if (eligibleW) {
                contributeWidth(_targetRefsW[0] - _dragRefsW[0], tolerance);
                contributeWidth(_targetRefsW[2] - _dragRefsW[0], tolerance);
                contributeWidth(_targetRefsW[0] - _dragRefsW[2], tolerance);
                contributeWidth(_targetRefsW[2] - _dragRefsW[2], tolerance);
                contributeWidth(_targetRefsW[1] - _dragRefsW[1], tolerance);
            }
            if (eligibleS) {
                contributeSecondary(_targetRefsS[0] - _dragRefsS[0], tolerance);
                contributeSecondary(_targetRefsS[2] - _dragRefsS[0], tolerance);
                contributeSecondary(_targetRefsS[0] - _dragRefsS[2], tolerance);
                contributeSecondary(_targetRefsS[2] - _dragRefsS[2], tolerance);
                contributeSecondary(_targetRefsS[1] - _dragRefsS[1], tolerance);
            }
        }
    }
};
// ─── Per-axis resolution helpers ─────────────────────────────────────────────
/**
 * Write the per-axis snap state into `out.positionDelta` (mount-local 3D)
 * by recomposing the deltas along the width and secondary axes. Leaves
 * `out.rotation` as null.
 */
const finalizeAxisOnly = (out) => {
    let didSnap = false;
    out.positionDelta.set(0, 0, 0);
    if (_axisState.bestDistW !== Infinity) {
        out.positionDelta.x += _widthAxis.x * _axisState.bestDeltaW;
        out.positionDelta.y += _widthAxis.y * _axisState.bestDeltaW;
        out.positionDelta.z += _widthAxis.z * _axisState.bestDeltaW;
        didSnap = true;
    }
    if (_axisState.bestDistS !== Infinity) {
        out.positionDelta.x += _secondAxis.x * _axisState.bestDeltaS;
        out.positionDelta.y += _secondAxis.y * _axisState.bestDeltaS;
        out.positionDelta.z += _secondAxis.z * _axisState.bestDeltaS;
        didSnap = true;
    }
    out.snapped = didSnap;
    out.rotation = null;
};

// Preallocated objects — never recreated inside the drag handler.
const _offsetPlane = new Plane();
const _worldPickPoint = new Vector3$1();
const _intersectionPoint = new Vector3$1();
const _nodeLocalPos = new Vector3$1();
const _adjustedPosition = new Vector3$1();
const _nodeMatrixWorld = new Matrix4$1();
const _nodeMatrixWorldInv = new Matrix4$1();
const _mountMatrixWorldInv = new Matrix4$1();
const _snapResult = createSnapResult();
const _resolveResult = createResolveResult();
const _nudgeResult = createNudgeResult();
// Below this the rotation write is a no-op — far tighter than any rotation a
// snap can produce, loose enough to absorb quaternion round-tripping.
const ROTATION_EPS = 1e-9;
const hasRotationChanged = (node, rotation) => Math.abs(node.rotation.x.get() - rotation.x) > ROTATION_EPS ||
    Math.abs(node.rotation.y.get() - rotation.y) > ROTATION_EPS ||
    Math.abs(node.rotation.z.get() - rotation.z) > ROTATION_EPS;
/**
 * Single exit point for every `return` below. Witnesses whether this frame ended with the
 * dragged item flush against a wall, so the drop can re-parent it onto that wall's `MountLine`
 * without re-deriving the geometry (see `wallAttachState` / `buildMultiClosetWallMountCommands`
 * in `designer-core`).
 *
 * Recording on the way OUT rather than at the snap is the load-bearing part: `zone.flush` is
 * decided in step 4.5, but steps 6–8 can still `buildRollbackCommands` and revert the whole
 * frame. A record written at snap time would claim a flush that was undone. Gating it on `ok`
 * here — and clearing on every failure path — is what makes "the last frame said flush"
 * trustworthy at drop with no geometric re-check.
 *
 * Because every planar frame either writes or clears, the last frame always wins: snap to a
 * wall, then drag away, and the record is gone before pointer-up. This does no node lookup and
 * does not resolve the edge to a `RoomSegment` — that is drop-time work.
 */
const finish = (node, mountPlane, ok) => {
    const wall = _snapResult.wall;
    if (ok && wall && wall.flush) {
        recordWallAttach(node.id, mountPlane.id, wall.segStart, wall.segDir);
    }
    else {
        clearWallAttach();
    }
    return ok;
};
const dragOnMountPlane = (draggedNode, mountPlane, line3, instanceManagers, isInitialFrame = false) => {
    // All per-frame commands (re-parent, position, rollback) are preview operations
    // that must never accumulate in the root undo transaction. The final committed
    // state is always recorded by the drop handler (end() / pointerup) via a single
    // SetNodeParentCommand + SetNodeVector3Commands.
    //
    // `isInitialFrame` is true exactly on the very first frame after a fresh catalog
    // node is created. It does two things at once:
    //   - tells `buildMountCommands` to apply a canonical mount-default rotation
    //     (the node has no meaningful prior world rotation to preserve), and
    //   - lets the per-frame transaction land in the undo history so it acts as the
    //     anchor that subsequent preview frames roll back to.
    //
    // 1. Capture state before any mutation so we can roll back if needed.
    const snapshot = captureSnapshot(draggedNode);
    // 2. Re-parent and reset rotation when entering a new mount surface.
    const mountCmds = buildMountCommands(draggedNode, mountPlane, isInitialFrame);
    if (mountCmds.length > 0) {
        draggedNode.core.runCommandsAsTransaction(mountCmds, '', isInitialFrame);
    }
    // 3. Resolve the camera ray → mount-plane intersection.
    const plane = getNodePlane(mountPlane);
    const draggedNodeOffset = draggedNode.core.draggedNodeOffset.get();
    _nodeMatrixWorld.copy(getMatrixWorld(draggedNode, false));
    _worldPickPoint.copy(draggedNodeOffset).applyMatrix4(_nodeMatrixWorld);
    _offsetPlane.setFromNormalAndCoplanarPoint(plane.normal, _worldPickPoint);
    if (!line3.intersectPlane(_offsetPlane, _intersectionPoint)) {
        getMonitor().warn('no plane drag possible');
        return finish(draggedNode, mountPlane, false);
    }
    // 4. Map the intersection point into mount-local space, subtracting the
    //    pick offset so the node origin ends up under the cursor.
    _nodeMatrixWorldInv.copy(_nodeMatrixWorld).invert();
    _mountMatrixWorldInv.copy(getMatrixWorld(mountPlane, false)).invert();
    _nodeLocalPos
        .copy(_intersectionPoint)
        .applyMatrix4(_nodeMatrixWorldInv)
        .sub(draggedNodeOffset)
        .applyMatrix4(_nodeMatrixWorld)
        .applyMatrix4(_mountMatrixWorldInv);
    // 4.5 Snap proposed position (and possibly rotation) before writing.
    // Snapping operates on the proposed mount-local position — `draggedNodeOffset`
    // has already been absorbed in step 4 — and projects neighbor / mount-segment
    // candidates onto the dragged node's local axes, derived from its current
    // rotation. For floor/ceiling/countertop the wall zone can additionally
    // request a rotation update, written in 4.55 below; the position delta it
    // returns then already accounts for that rotation (it keeps the grab point
    // under the cursor and fits the item onto the wall it attaches to).
    // `_mountMatrixWorldInv` was computed in step 4 and is still valid here.
    snapDraggedItem(draggedNode, mountPlane, _nodeLocalPos, instanceManagers, _mountMatrixWorldInv, _snapResult);
    if (_snapResult.snapped) {
        _nodeLocalPos.add(_snapResult.positionDelta);
    }
    // 4.55 Wall-zone rotation. Written BEFORE the collision / containment /
    // nudge passes below because every one of them derives the item's width and
    // secondary axes from `draggedNode.rotation` — leaving the write until after
    // them would have them reason in last frame's axes about a position already
    // computed in this frame's. Mirrors the position write's `captureInitialState`
    // rule so per-frame previews never enter history; the drop handler still
    // records the final (parent + position + rotation) snapshot.
    //
    // Skipped when the rotation is unchanged: the wall zone keeps a wall-aligned
    // rotation asserted on nearly every frame of a drag near a wall, and
    // re-writing an identical rotation costs a command + transaction per frame
    // for nothing.
    if (_snapResult.rotation && hasRotationChanged(draggedNode, _snapResult.rotation)) {
        draggedNode.core.runCommandsAsTransaction(new SetNodeVector3Command(draggedNode.id, VectorProps.rotation, _snapResult.rotation), '', isInitialFrame);
    }
    // 4.6 Collision-resolution snap (uncapped). When the cursor moves the
    // dragged item past `snapSensitivity` INTO a neighbor, the tolerance-
    // bounded snap above can no longer pull it back to edge-to-edge — and
    // the post-write SAT check uses 1e-4-inset corners that miss the
    // touch-on-orthogonal-axis case (e.g. window inside door on W, exactly
    // touching on S). Cutouts use TRUE positions and would overlap. This
    // pass projects neighbors with raw AABBs (mirrors snap.ts) and pushes
    // the item to the nearest edge-to-edge target with the offending
    // neighbor, with no `snapSensitivity` cap on the magnitude.
    resolveCollisionSnap(draggedNode, mountPlane, _nodeLocalPos, instanceManagers, _mountMatrixWorldInv, _resolveResult);
    if (_resolveResult.resolved) {
        _nodeLocalPos.add(_resolveResult.positionDelta);
    }
    // 5. Apply custom overrides (windows flush against wall, gates on floor,
    //    base/tall cabinets pinned to wall-floor edge, etc.). The slot type is
    //    forwarded so wall-only constraints can be applied without affecting
    //    floor / ceiling / countertop drags.
    const mountSlotType = mountPlane.mountSlotTypes.get()[0];
    adjustPosition(draggedNode, _nodeLocalPos, _adjustedPosition, MountSurface.Plane, mountSlotType);
    draggedNode.core.runCommandsAsTransaction(new SetNodeVector3Command(draggedNode.id, VectorProps.position, _adjustedPosition), '', isInitialFrame);
    // 6. Bounds + collision check (ground truth). On success the drag commits
    //    immediately; on failure we fall through to the nudge step below.
    //    `isInsideMountPlane` needs mount-local corners; `checkCollision`
    //    needs world-space corners. Both passes write the shared `points[]`
    //    buffer in turn (one full 8 × matrix multiply each).
    _mountMatrixWorldInv.copy(getMatrixWorld(mountPlane, false)).invert();
    computeNodeCorners(draggedNode, _mountMatrixWorldInv);
    const shape = getMountPlaneShape(mountPlane, undefined, [draggedNode.id]);
    const containmentOk = isInsideMountPlane(shape, points);
    computeNodeCorners(draggedNode);
    const collisionOk = !checkCollision(draggedNode.id, instanceManagers);
    if (containmentOk && collisionOk)
        return finish(draggedNode, mountPlane, true);
    // 7. Nudge — slide the dragged item along its width / secondary axes
    //    until it sits inside the mount shape and clears every neighbor.
    //    Operates in the dragged node's local axes (mirrors the snap module);
    //    `_adjustedPosition` is the current authoritative mount-local pos and
    //    is mutated in-place when the nudge succeeds. Magnitude is uncapped
    //    (no `snapSensitivity` here) — the nudge applies whatever delta the
    //    constraints demand.
    nudgeIntoMountAndOutOfCollision(draggedNode, mountPlane, _adjustedPosition, instanceManagers, _mountMatrixWorldInv, _nudgeResult);
    if (!_nudgeResult.feasible) {
        draggedNode.core.runCommandsAsTransaction(buildRollbackCommands(draggedNode, snapshot), '', isInitialFrame);
        return finish(draggedNode, mountPlane, false);
    }
    if (_nudgeResult.nudged) {
        _adjustedPosition.add(_nudgeResult.positionDelta);
        draggedNode.core.runCommandsAsTransaction(new SetNodeVector3Command(draggedNode.id, VectorProps.position, _adjustedPosition), '', isInitialFrame);
        // 8. Re-validate with ground-truth checks — the nudge uses an
        //    axis-aligned-projection approximation that can miss concave-shape
        //    containment edges or rotated-OBB collision corners. Rollback if
        //    the safety net catches a residual violation. `_mountMatrixWorldInv`
        //    from step 6 is still valid (the mount did not move during the
        //    nudge write).
        computeNodeCorners(draggedNode, _mountMatrixWorldInv);
        if (!isInsideMountPlane(shape, points)) {
            draggedNode.core.runCommandsAsTransaction(buildRollbackCommands(draggedNode, snapshot), '', isInitialFrame);
            return finish(draggedNode, mountPlane, false);
        }
        computeNodeCorners(draggedNode);
        if (checkCollision(draggedNode.id, instanceManagers)) {
            draggedNode.core.runCommandsAsTransaction(buildRollbackCommands(draggedNode, snapshot), '', isInitialFrame);
            return finish(draggedNode, mountPlane, false);
        }
        return finish(draggedNode, mountPlane, true);
    }
    // Feasible but no delta — the nudge says the position is already valid
    // (numerical edge case), yet ground-truth said it wasn't. Trust the
    // ground-truth and rollback.
    draggedNode.core.runCommandsAsTransaction(buildRollbackCommands(draggedNode, snapshot), '', isInitialFrame);
    return finish(draggedNode, mountPlane, false);
};

const pointer = new Vector2$1();
const updatePointer = (event, designer3D) => {
    pointer.x = (event.offsetX / designer3D.canvas.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / designer3D.canvas.clientHeight) * 2 + 1;
    return pointer;
};

const line3 = new Line3();
const segment = new Line3();
const point = new Vector3$1();
const from = new Vector3$1();
const to = new Vector3$1();
// const _mountMatrixWorldInv = new Matrix4();
// const _initialHitPoint = new Vector3();
const dragExistingNode = (designer3D, draggedNodeId, pointer, isInitialFrame = false) => {
    const draggedNode = getNode(designer3D.core, draggedNodeId);
    const intersects = designer3D.handlers.doRaycast(pointer);
    const currentParentId = draggedNode.parent.get();
    const currentParent = getNode(designer3D.core, currentParentId);
    const isLineMounted = currentParent.type === NodeType.MountLine;
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object instanceof Mesh) {
            const node = getNode(designer3D.core, object instanceof InstancedMesh
                ? designer3D.instanceManagers.getManager(object)?.getNodeView(intersects[0].instanceId || 0)?.id
                : getNodeGroup(object).uuid);
            if (!node)
                return false;
            switch (node.type) {
                case NodeType.MountPlane:
                    const camera = designer3D.getCamera();
                    //@ts-expect-error TODO: projectionMatrixInverse is incompatible
                    line3.setFromCamera(pointer, camera.projectionMatrixInverse, camera.matrixWorld);
                    return dragOnMountPlane(draggedNode, node, line3, [
                        designer3D.instanceManagers.get(NodeType.Item),
                        designer3D.instanceManagers.get(ItemType.multiCloset),
                        designer3D.instanceManagers.get(OPENING_ITEM)
                    ], isInitialFrame);
                case NodeType.MountLine:
                    return dragOnMountLine(draggedNode, node, point.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z), [
                        designer3D.instanceManagers.get(NodeType.Item),
                        designer3D.instanceManagers.get(ItemType.multiCloset),
                        designer3D.instanceManagers.get(OPENING_ITEM)
                    ], isInitialFrame);
                case NodeType.MountPoint:
                case NodeType.BoxContainer:
                    return false;
                case NodeType.FreeBoxContainer:
                    return dragOnFreeBoxContainer(draggedNode, node, point.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z));
                case NodeType.Part:
                    return dragOnPart(draggedNode, node, point.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z));
                case NodeType.Item:
                    return dragOnItem(draggedNode, node, point.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z));
                default:
                    getMonitor().warn('Dragging on top of node with id: ', node.id, ' of type: ', node.type);
                    return false;
            }
        }
        return false;
    }
    else {
        if (isLineMounted) {
            const camera = designer3D.getCamera();
            //@ts-expect-error TODO: projectionMatrixInverse is incompatible
            line3.setFromCamera(pointer, camera.projectionMatrixInverse, camera.matrixWorld);
            const width = getMountLineWidth(currentParent);
            const matrixWorld = getMatrixWorld(currentParent, false);
            from.set(0, 0, 0).applyMatrix4(matrixWorld);
            to.set(width, 0, 0).applyMatrix4(matrixWorld);
            segment.set(from, to);
            segment.distanceSqToLine3(line3, point);
            return dragOnMountLine(draggedNode, currentParent, point, [
                designer3D.instanceManagers.get(NodeType.Item),
                designer3D.instanceManagers.get(ItemType.multiCloset),
                designer3D.instanceManagers.get(OPENING_ITEM)
            ]);
        }
        else {
            return false;
        }
    }
};
let instancedNode = null;
let originalExists = 0;
const resetDragCatalogNode = () => {
    instancedNode = null;
    originalExists = 0;
};
/**
 * The node currently being instantiated by a catalog drag, or `null` when no
 * catalog drag is in flight. Stays non-null through `Handler.pointerup` (until
 * `resetDragCatalogNode()` clears it at the end of that handler), so the drop
 * commit can tell a catalog drop apart from an existing-node drag.
 */
const getDragCatalogNode = () => instancedNode;
const getChildProperty = (catalogConfig) => {
    switch (catalogConfig.type) {
        case NodeType.Part:
            switch (catalogConfig.partType) {
                case PartType.multiClosetSectionContent:
                    return 'content';
                case PartType.multiClosetSection:
                    return 'sections';
                default:
                    return 'children';
            }
        default:
            return 'children';
    }
};
const dragCatalogNode = (designer3D, pointer, catalogPath) => {
    const intersects = designer3D.handlers.doRaycast(pointer);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object instanceof Mesh) {
            const node = getNode(designer3D.core, object instanceof InstancedMesh
                ? designer3D.instanceManagers.getManager(object)?.getNodeView(intersects[0].instanceId || 0)?.id
                : getNodeGroup(object).uuid);
            if (!node)
                return false;
            const isFreshlyCreated = !instancedNode;
            if (!instancedNode) {
                const newId = generateId();
                // Resolve the catalog template once so we can both pick the child
                // property AND detect multiCloset items without a second catalog walk.
                const catalogConfig = resolveCatalogConfig(designer3D.core, catalogPath);
                if (!catalogConfig) {
                    return false;
                }
                const commands = [
                    new CreateNodeFromCatalogCommand(catalogPath, node.id, newId, {
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 }
                    }, getChildProperty(catalogConfig))
                ];
                designer3D.core.runCommandsAsTransaction(commands, 'Create catalog item', true);
                instancedNode = getNode(designer3D.core, newId);
                if ([NodeType.MountPlane, NodeType.MountLine].includes(node.type)) {
                    designer3D.core.runCommandsAsTransaction([
                        new SetNodeVector3Command(newId, VectorProps.rotation, getMountDefaultRotation(instancedNode, node, true)),
                        new SetNodeVector3Command(newId, VectorProps.position, getMountDefaultPosition(instancedNode, node))
                    ]);
                }
                designer3D.core.draggedNodeOffset.set(new Vector3$1(instancedNode.size.x.get() * 0.5, instancedNode.size.y.get() * 0.5, instancedNode.size.z.get() * 0.5));
                originalExists = instancedNode.exists.getSignal();
            }
            const result = dragExistingNode(designer3D, instancedNode.id, pointer, isFreshlyCreated);
            if (result) {
                designer3D.core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(instancedNode.id));
                instancedNode.exists.set(originalExists);
                designer3D.core.draggedNodeId.set(instancedNode.id);
                designer3D.core.runCommandsAsTransaction(new SetDraggedCatalogPathCommand(null), '', false);
            }
            else {
                instancedNode.exists.set(0);
                return false;
            }
        }
        return false;
    }
    return false;
};
const dragNode = (event, designer3D) => {
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    const pointer = updatePointer(event, designer3D);
    const catalogPath = designer3D.core.draggedCatalogPath.get();
    if (draggedNodeId) {
        dragExistingNode(designer3D, draggedNodeId, pointer);
    }
    else if (catalogPath) {
        dragCatalogNode(designer3D, pointer, catalogPath);
    }
};

const pointerEventsList = ['pointerdown', 'pointermove', 'pointerup', 'contextmenu'];
const DISTANCE_TO_SKIP_SELECTION = 2 / window.devicePixelRatio; // pixels
const TRANSACTION_LABEL_BY_MODE = {
    [GeneralViewMode.editor3D]: 'Drag Node in 3D Editor',
    [GeneralViewMode.editor2D]: 'Drag Node in 2D Editor',
    [GeneralViewMode.floorPlan]: 'Drag Node in Floorplan'
};
const FALLBACK_TRANSACTION_LABEL = 'Drag Node';
/**
 * Single canvas pointer-event handler. Handles selection and drag for every
 * `GeneralViewMode` — per-mode differences are absorbed by `getDraggableNode`
 * and `getSelectableNode` in `designer-core`, so the surrounding orchestration
 * (raycast → resolve node → open transaction → drag → commit) is identical
 * across modes. The only mode-aware bit is the human-readable transaction
 * label, looked up from `TRANSACTION_LABEL_BY_MODE` at drag-start.
 */
class Handler {
    designer3D;
    selectableNode = undefined;
    draggableNode = undefined;
    moved = false;
    pointerDownLocation = new Vector2();
    pointerMoveLocation = new Vector2();
    transaction = null;
    constructor(designer3D) {
        this.designer3D = designer3D;
    }
    getTransactionLabel() {
        return TRANSACTION_LABEL_BY_MODE[this.designer3D.core.generalViewMode.get()] ?? FALLBACK_TRANSACTION_LABEL;
    }
    /**
     * Resolve the node a raycast hit should select. Shelves: a click on an empty-compartment pick box
     * selects the adjacent shelf BOARD by click position (the compartment itself is not selectable). The
     * pick box geometry is a unit cube, so its local Y > 0.5 is the upper half — rotation-independent.
     * Top half → the board above, bottom half → the board below; a bottom/top gap → its single adjacent
     * board. Any other hit resolves to `node` unchanged.
     */
    resolveSelectionNode(node, object, intersects) {
        // Gated on the component CATEGORY, not on `partType`: drawers and hangers share
        // `PartType.multiClosetComponentPart` with the shelf compartment, and only the compartment
        // carries the empty-opening pick box this branch interprets.
        if (node.type === NodeType.Part &&
            node.partType.get() === PartType.multiClosetComponentPart &&
            node.multiClosetComponentType?.get() === MultiClosetComponentType.multiClosetShelfPart) {
            const topHalf = object.worldToLocal(intersects[0].point.clone()).y > 0.5;
            const boardId = getShelfBoardForCompartmentClick(this.designer3D.core, node.id, topHalf);
            if (boardId)
                return getNode(this.designer3D.core, boardId);
        }
        return node;
    }
    pointerEvents = {
        contextmenu: (event) => {
            event.preventDefault();
            this.moved = false;
            this.pointerDownLocation.set(event.offsetX, event.offsetY);
            const intersects = this.designer3D.handlers.doRaycast(updatePointer(event, this.designer3D));
            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object instanceof Mesh) {
                    const node = getNode(this.designer3D.core, object instanceof InstancedMesh
                        ? this.designer3D.instanceManagers.getManager(object)?.getNodeView(intersects[0].instanceId || 0)?.id
                        : getNodeGroup(object).uuid);
                    this.draggableNode = getDraggableNode(this.designer3D.core, node, event);
                    this.selectableNode = getSelectableNode(this.designer3D.core, this.resolveSelectionNode(node, object, intersects));
                    const selectedNodeId = this.designer3D.core.selectedNodeId.get();
                    const selectionMatchesDrag = this.draggableNode &&
                        (this.draggableNode.id === selectedNodeId ||
                            (getNode(this.designer3D.core, this.draggableNode.parent.get()).id === selectedNodeId &&
                                this.draggableNode.type === NodeType.Part &&
                                this.draggableNode.partType.get() === PartType.multiClosetSectionContent));
                    if (this.draggableNode &&
                        this.selectableNode &&
                        this.designer3D.core.draggedNodeId.get() !== this.draggableNode.id &&
                        selectionMatchesDrag) {
                        this.transaction = this.designer3D.core.beginTransaction(this.getTransactionLabel());
                        this.draggableNode.core.draggedNodeOffset.set(
                        //@ts-expect-error TODO: points are incompatible
                        getDraggedNodeOffset(this.draggableNode, new Vector3$1().copy(intersects[0].point)));
                        const sourceId = this.draggableNode.id;
                        const duplicateComd = new DuplicateNodeCommand(sourceId);
                        const success = this.designer3D.core.runCommandsAsTransaction(duplicateComd, '', true);
                        if (!success) {
                            this.transaction.abort();
                            this.transaction.end();
                            this.transaction = null;
                            return;
                        }
                        this.draggableNode = getNode(this.designer3D.core, duplicateComd.duplicatedRootId);
                        const matrix = getMatrixWorld(this.draggableNode).invert();
                        m4$1.fromArray(matrix.elements);
                        const { index, childProperty } = resolveParentChildProperty(this.designer3D.core, this.draggableNode.id);
                        this.designer3D.core.runCommandsAsTransaction([
                            new SetNodeParentCommand(this.draggableNode.id, this.draggableNode.parent.get(), childProperty, index),
                            new SetNodeVector3Command(this.draggableNode.id, VectorProps.position, {
                                x: this.draggableNode.position.x.get(),
                                y: this.draggableNode.position.y.get(),
                                z: this.draggableNode.position.z.get()
                            }),
                            new SetNodeVector3Command(this.draggableNode.id, VectorProps.rotation, {
                                x: this.draggableNode.rotation.x.get(),
                                y: this.draggableNode.rotation.y.get(),
                                z: this.draggableNode.rotation.z.get()
                            })
                        ], '', true);
                    }
                }
            }
            else {
                this.selectableNode = undefined;
            }
        },
        pointerdown: (event) => {
            if (event.button === 2)
                return;
            this.moved = false;
            this.pointerDownLocation.set(event.offsetX, event.offsetY);
            const intersects = this.designer3D.handlers.doRaycast(updatePointer(event, this.designer3D));
            if (intersects.length > 0) {
                const object = intersects[0].object;
                if (object instanceof Mesh) {
                    const node = getNode(this.designer3D.core, object instanceof InstancedMesh
                        ? this.designer3D.instanceManagers.getManager(object)?.getNodeView(intersects[0].instanceId || 0)?.id
                        : getNodeGroup(object).uuid);
                    this.draggableNode = getDraggableNode(this.designer3D.core, node, event);
                    this.selectableNode = getSelectableNode(this.designer3D.core, this.resolveSelectionNode(node, object, intersects));
                    const selectedNodeId = this.designer3D.core.selectedNodeId.get();
                    const selectionMatchesDrag = this.draggableNode &&
                        (this.draggableNode.id === selectedNodeId ||
                            (getNode(this.designer3D.core, this.draggableNode.parent.get()).id === selectedNodeId &&
                                this.draggableNode.type === NodeType.Part &&
                                this.draggableNode.partType.get() === PartType.multiClosetSectionContent));
                    if (this.draggableNode &&
                        this.selectableNode &&
                        this.designer3D.core.draggedNodeId.get() !== this.draggableNode.id &&
                        selectionMatchesDrag) {
                        this.transaction = this.designer3D.core.beginTransaction(this.getTransactionLabel());
                        this.draggableNode.core.draggedNodeOffset.set(
                        //@ts-expect-error TODO: points are incompatible
                        getDraggedNodeOffset(this.draggableNode, new Vector3$1().copy(intersects[0].point)));
                        const matrix = getMatrixWorld(this.draggableNode).invert();
                        m4$1.fromArray(matrix.elements);
                        const { index, childProperty } = resolveParentChildProperty(this.designer3D.core, this.draggableNode.id);
                        this.designer3D.core.runCommandsAsTransaction([
                            new SetNodeParentCommand(this.draggableNode.id, this.draggableNode.parent.get(), childProperty, index),
                            new SetNodeVector3Command(this.draggableNode.id, VectorProps.position, {
                                x: this.draggableNode.position.x.get(),
                                y: this.draggableNode.position.y.get(),
                                z: this.draggableNode.position.z.get()
                            }),
                            new SetNodeVector3Command(this.draggableNode.id, VectorProps.rotation, {
                                x: this.draggableNode.rotation.x.get(),
                                y: this.draggableNode.rotation.y.get(),
                                z: this.draggableNode.rotation.z.get()
                            })
                        ], '', true);
                    }
                }
            }
            else {
                this.selectableNode = undefined;
            }
        },
        pointermove: (event) => {
            this.pointerMoveLocation.set(event.offsetX, event.offsetY);
            // Mid-gesture guard: don't start a drag (which would also commit a
            // selection) when the global gesture has already escalated to multi-touch.
            // Mirrors `useDraggable`'s mid-gesture abort on the React side. The
            // synthetic-contextmenu promotion in `Handlers/index.ts` handles the
            // both-fingers-on-canvas case; this guard covers the asymmetric case
            // where only one finger is on the canvas.
            if (!this.moved &&
                this.transaction &&
                this.draggableNode &&
                this.draggableNode.id !== this.draggableNode.core.draggedNodeId.get() &&
                !this.designer3D.core.handlers.gestureWasMulti.peek()) {
                this.designer3D.core.runCommandsAsTransaction([
                    new SetDraggedNodeIdCommand(this.draggableNode.id),
                    new SetHoveredNodeIdCommand(this.draggableNode.parent.get())
                ], '', false);
                this.designer3D.core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(this.draggableNode.type === NodeType.Part &&
                    this.draggableNode.partType.get() === PartType.multiClosetSectionContent
                    ? this.draggableNode.parent.get()
                    : this.draggableNode.id));
            }
            this.moved =
                this.moved || this.pointerDownLocation.distanceTo(this.pointerMoveLocation) >= DISTANCE_TO_SKIP_SELECTION;
            dragNode(event, this.designer3D);
        },
        pointerup: (event) => {
            if (this.moved) {
                const draggedNodeId = this.designer3D.core.draggedNodeId.get();
                if (draggedNodeId) {
                    const draggedNode = getNode(this.designer3D.core, draggedNodeId);
                    const newParentId = updateParentId(this.designer3D.core, draggedNode);
                    const { index, childProperty } = resolveParentChildProperty(this.designer3D.core, draggedNodeId);
                    this.designer3D.core.runCommandsAsTransaction([
                        new SetNodeParentCommand(draggedNodeId, newParentId, childProperty, index),
                        new SetNodeVector3Command(draggedNodeId, VectorProps.position, {
                            x: draggedNode.position.x.get(),
                            y: draggedNode.position.y.get(),
                            z: draggedNode.position.z.get()
                        }),
                        new SetNodeVector3Command(draggedNodeId, VectorProps.rotation, {
                            x: draggedNode.rotation.x.get(),
                            y: draggedNode.rotation.y.get(),
                            z: draggedNode.rotation.z.get()
                        }),
                        new SetSelectedNodeIdCommand(draggedNode.type === NodeType.Part && draggedNode.partType.get() === PartType.multiClosetSectionContent
                            ? draggedNode.parent.get()
                            : draggedNode.id)
                    ]);
                    // multiCloset dropped with its back snapped flush against a wall: re-home it onto
                    // that Wall2D's MountLine. Runs BEFORE `fitItemToSizeX` on purpose — the fit
                    // branches on `getOptionalParentWall2D`, so only a closet already in the wall's
                    // parent chain fits to the WALL's span instead of to the room polygon.
                    const wallMountCommands = buildMultiClosetWallMountCommands(this.designer3D.core, draggedNode);
                    if (wallMountCommands.length) {
                        this.designer3D.core.runCommandsAsTransaction(wallMountCommands, '', true);
                    }
                    // Catalog-dropped multiCloset: grow to the available local-X width.
                    // `getDragCatalogNode()` is non-null only for catalog drags (cleared
                    // by resetDragCatalogNode() later in this handler), so existing-node
                    // and UI-overlay drags are untouched. Recorded into the open drop
                    // transaction so one undo removes the placed-and-fitted closet.
                    const catalogNode = getDragCatalogNode();
                    if (catalogNode &&
                        catalogNode.id === draggedNodeId &&
                        draggedNode.type === NodeType.Item &&
                        draggedNode.itemType.get() === ItemType.multiCloset) {
                        const fitCommands = fitItemToSizeX(this.designer3D.core, draggedNode);
                        if (fitCommands) {
                            this.designer3D.core.runCommandsAsTransaction(fitCommands, '', true);
                        }
                    }
                    // multiCloset stack dropped into a FreeBoxContainer: add the fix-shelf divider
                    // that preserves the divider/stack pattern, folded into this drop transaction.
                    const bayCommands = commitDragOnFreeBoxContainer(this.designer3D.core);
                    if (bayCommands.length) {
                        this.designer3D.core.runCommandsAsTransaction(bayCommands, '', true);
                    }
                    // multiCloset section moved between closets: re-arm the balance section of both the
                    // closet it left and the one it joined, in this same drop transaction.
                    const sectionCommands = commitDragOnItem(this.designer3D.core);
                    if (sectionCommands.length) {
                        this.designer3D.core.runCommandsAsTransaction(sectionCommands, '', true);
                    }
                }
            }
            if (this.transaction) {
                if (!this.moved) {
                    this.transaction.abort();
                }
                this.transaction.end();
                this.transaction = null;
            }
            resetDragOnPart();
            resetDragCatalogNode();
            resetDragOnFreeBoxContainer();
            resetDragOnItem();
            clearWallAttach();
            // For catalog drags the window-level end() in useCatalogProductDragSource fires
            // after this canvas listener and still needs draggedNodeId to record the final state
            // but for now this event captures catalog drag end and updates the draggedNodeId
            if (this.designer3D.core.draggedCatalogPath.get() === null) {
                if (this.designer3D.core.hoveredNodeId.get() !== null) {
                    this.designer3D.core.runCommandsAsTransaction(new SetHoveredNodeIdCommand(null), '', false);
                }
                if (this.designer3D.core.draggedNodeId.get() !== null) {
                    this.designer3D.core.runCommandsAsTransaction(new SetDraggedNodeIdCommand(null), '', false);
                }
            }
            // Handle selectedNodeId handling.
            //
            // Multi-touch guard: when the global gesture has been multi-touch
            // (pinch/pan), skip selection commits entirely. The canvas-side flow
            // can be reached with `selectableNode` still set if only ONE finger
            // landed on the canvas (the other on an HTML overlay widget) — the
            // 2-touch contextmenu promotion arbitrates on `canvasTouchPointers`,
            // not on the global count, so `abortPendingGesture()` never ran and
            // `selectableNode` survived. Without this guard, lifting the canvas
            // finger at the end of a pinch commits a spurious tap-select on the
            // raycast hit (M3D-243 class of bug, canvas-side equivalent).
            if (!this.moved && !this.designer3D.core.handlers.gestureWasMulti.peek()) {
                if (this.selectableNode) {
                    if (this.designer3D.core.selectedNodeId.get() !== this.selectableNode.id) {
                        const commands = [new SetSelectedNodeIdCommand(this.selectableNode.id)];
                        // if (this.selectableNode.type === NodeType.Room) {
                        //   commands.push(new SetSelectedRoomIdCommand(this.selectableNode.id));
                        // }
                        this.designer3D.core.runCommandsAsTransaction(commands);
                    }
                }
                else {
                    if (this.designer3D.core.selectedNodeId.get() !== null) {
                        const commands = [new SetSelectedNodeIdCommand(null)];
                        // if (this.designer3D.core.selectedRoomId.get() !== null) {
                        //   commands.push(new SetSelectedRoomIdCommand(null));
                        // }
                        this.designer3D.core.runCommandsAsTransaction(commands);
                    }
                }
            }
            this.designer3D.core.pointerPosition.set(new Vector2(event.offsetX, event.offsetY));
            this.moved = false;
        }
    };
    /**
     * Symmetric counterpart to a `pointerdown` / `contextmenu` opening:
     * aborts the in-flight transaction (if any) and clears every piece of
     * gesture state without firing the `pointerup` selection branch.
     *
     * Called by the multi-touch dispatcher in `Handlers/index.ts` when a
     * second touch promotes a single-finger gesture to a two-finger camera
     * control. Routing through `pointerEvents.pointerup` would hit the
     * `if (!this.moved)` branch (the 2nd touch lands within ms, well under
     * `DISTANCE_TO_SKIP_SELECTION`) and select whatever was under the
     * first finger — the M3D-243 "unexpected click during pinch/pan" bug.
     *
     * Locations are zeroed so a fresh single-finger tap immediately after
     * cancellation reads `moved === false` correctly. Otherwise the next
     * `pointermove` would compute distance against the cancelled gesture's
     * end position and silently classify a valid tap as a drag.
     */
    abortPendingGesture() {
        if (this.transaction) {
            this.transaction.abort();
            this.transaction.end();
            this.transaction = null;
        }
        // Clear the in-flight FBC stack-drag state so a two-finger abort can't leave a stale
        // origin/anchor that suppresses (or misplaces) the divider clone on the next drop. Same for
        // the section-move origin, which would otherwise repair the wrong closet on the next drop.
        resetDragOnFreeBoxContainer();
        resetDragOnItem();
        // Same reason: a two-finger abort must not leave a wall record that re-homes the
        // closet onto a wall on the NEXT gesture's drop.
        clearWallAttach();
        this.selectableNode = undefined;
        this.draggableNode = undefined;
        this.moved = false;
        this.pointerDownLocation.set(0, 0);
        this.pointerMoveLocation.set(0, 0);
    }
    dispose() {
        // TODO: Implement dispose logic
    }
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
/**
 * iPad Safari does NOT dispatch `contextmenu` for two-finger touch — only for
 * long-press, which `touch-action: none` on the canvas (see
 * `AreaDesigner3D#createCanvas`) suppresses anyway. OrbitControls' two-finger
 * pan does not rely on `contextmenu` either; it counts concurrent pointers
 * (see `OrbitControls.js`, `case 2: TOUCH.DOLLY_PAN`). To keep parity with
 * desktop right-button-drag we mirror that pattern here: synthesize a
 * `contextmenu` PointerEvent when a second touch pointer joins, so the
 * `Handler`'s existing `contextmenu` flow runs unchanged.
 *
 * `getDraggableNode` branches on `event.type === 'contextmenu'`, so the
 * synthesized event must carry that type — passing the original `pointerdown`
 * would silently break the multiClosetSectionContent path.
 */
const synthesizeContextMenuEvent = (source) => {
    const synthetic = new PointerEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        pointerId: source.pointerId,
        pointerType: source.pointerType,
        isPrimary: source.isPrimary,
        clientX: source.clientX,
        clientY: source.clientY,
        button: 2,
        buttons: 2
    });
    // `offsetX/Y` are computed getters on `MouseEvent` and are NOT part of the
    // PointerEventInit dict — the `Handler` reads them directly, so shadow them
    // with own properties carrying the source values.
    Object.defineProperty(synthetic, 'offsetX', { value: source.offsetX });
    Object.defineProperty(synthetic, 'offsetY', { value: source.offsetY });
    return synthetic;
};
class Handlers {
    designer3D;
    pointerEvents = {};
    raycaster = raycasterCreate();
    handler;
    /**
     * Touch pointers that landed on the CANVAS specifically — never on an
     * overlay widget. These bubble-phase canvas listeners fire only for pointers
     * that hit the canvas; widget pointers never reach here.
     *
     * The 2-finger → contextmenu promotion arbitrates on THIS count, not on the
     * global `core.handlers.count` — otherwise a finger resting on an item/corner
     * plus one on the canvas would be misread as a two-finger canvas gesture.
     */
    canvasTouchPointers = new Set();
    /**
     * The pointerId that opened the synthesized contextmenu drag, or `null` when
     * no two-finger drag is in progress. Used to (a) drive `pointermove` off a
     * single finger so the dragged node doesn't oscillate between the two touch
     * positions, and (b) end the drag on the first qualifying `pointerup`.
     */
    syntheticContextmenuPointerId = null;
    /**
     * Unsubscribe from `core.handlers.onPinch`. We don't reimplement pinch math:
     * the core emits `factor = currentDistance / previousDistance` whenever 2+
     * touches are down anywhere in the designer subtree, INCLUDING gestures
     * where finger 1 landed on an HTML overlay widget — those never reach
     * OrbitControls' DOLLY_PAN branch on the canvas, so we apply the factor
     * ourselves in `applyPinchFactor`.
     */
    unsubscribePinch;
    /**
     * Unsubscribe from `core.handlers.onReset`. Mirrors the core's
     * foreground-loss reset (app switch, Control Center, navigation): the OS can
     * swallow `pointercancel` for a canvas pointer, and without clearing
     * `canvasTouchPointers` the ghost id keeps `size === 2`, so the 2-touch cap
     * intercepts the next genuine pointerdown and the gesture is dead until
     * dispose. Routing through the core means this class installs no `window`
     * listeners of its own — `CoreHandlers` is the sole owner of those.
     */
    unsubscribeReset;
    constructor(designer3D) {
        this.designer3D = designer3D;
        this.handler = new Handler(designer3D);
        this.unsubscribePinch = designer3D.core.handlers.onPinch(this.applyPinchFactor);
        this.unsubscribeReset = designer3D.core.handlers.onReset(this.onCoreReset);
        for (const name of pointerEventsList) {
            this.pointerEvents[name] = (event) => {
                if (event.pointerType === 'touch') {
                    if (name === 'pointerdown') {
                        // Cap canvas touches at 2 — a 3rd+ simultaneous finger is ignored
                        // entirely: not added, not forwarded to `Handler`. Its subsequent
                        // `pointermove` is caught by the synthetic-pointerId filter below,
                        // and its `pointerup` is a no-op (`delete` on an absent id) that
                        // leaves `count` at the real 2-finger value, so the contextmenu
                        // gesture is never prematurely ended by a 3rd-finger lift.
                        if (this.canvasTouchPointers.size >= 2)
                            return;
                        this.canvasTouchPointers.add(event.pointerId);
                    }
                    else if (name === 'pointerup') {
                        this.canvasTouchPointers.delete(event.pointerId);
                    }
                    const count = this.canvasTouchPointers.size;
                    if (name === 'pointerdown') {
                        // Second simultaneous touch → promote to right-button-drag flow.
                        if (count === 2 && this.syntheticContextmenuPointerId === null) {
                            this.syntheticContextmenuPointerId = event.pointerId;
                            // Cancel any drag the first pointerdown opened so its Transaction
                            // does not leak as an orphan parent of the new contextmenu
                            // Transaction (undo-redo: pending parent transactions cannot
                            // close while children remain open).
                            //
                            // `abortPendingGesture` — NOT a synthetic `pointerup` — because
                            // a synthetic up would hit `Handler.pointerup`'s `if (!moved)`
                            // branch and select whatever was under the first finger (the
                            // 2nd touch lands within ms of the 1st, well under
                            // `DISTANCE_TO_SKIP_SELECTION`). That was M3D-243.
                            this.handler.abortPendingGesture();
                            this.handler.pointerEvents.contextmenu(synthesizeContextMenuEvent(event));
                            return;
                        }
                    }
                    else if (name === 'pointermove') {
                        // Drive the drag off a single finger to avoid oscillation between
                        // the two touch positions inside `dragNode`.
                        if (this.syntheticContextmenuPointerId !== null && event.pointerId !== this.syntheticContextmenuPointerId) {
                            return;
                        }
                    }
                    else if (name === 'pointerup') {
                        if (this.syntheticContextmenuPointerId !== null) {
                            // End only when count drops below 2 — i.e. one of the original
                            // 2 fingers lifted. A 3rd-finger lift (palm rest, accidental
                            // touch) leaves the pinch intact (M3D-244). When the real
                            // gesture finger lifts, the forwarded `pointerup` closes
                            // Handler's drag exactly once.
                            if (count < 2) {
                                this.syntheticContextmenuPointerId = null;
                                this.handler.pointerEvents.pointerup(event);
                            }
                            return;
                        }
                    }
                }
                this.handler.pointerEvents[name](event);
            };
            designer3D.canvas.addEventListener(name, this.pointerEvents[name]);
        }
        designer3D.canvas.addEventListener('pointercancel', this.onPointerCancel);
    }
    doRaycast(pointer) {
        const d = this.designer3D;
        const camera = d.getCamera();
        // Editor2D wall clip: everything outside the framed wall's left/right screen
        // band is visually masked (see `IWebGPU`). Make picking respect it — every
        // point on the pick ray projects to the pointer's own screen-X, so a hit is
        // clipped iff the pointer's screen-X is outside the band (all-or-nothing).
        if (d.e2ClipEnabled) {
            camera.updateMatrixWorld(); // match render(): refresh matrices for project()
            const { minX, maxX } = getEditor2DClipBandX(d.e2ClipLeftWorld, d.e2ClipRightWorld, camera);
            const pointerX = pointer.x * 0.5 + 0.5; // NDC (-1..1) → UV.x (0..1)
            if (pointerX < minX || pointerX > maxX)
                return [];
        }
        this.raycaster.setFromCamera(pointer, camera);
        // The band above only constrains the horizontal axis. Depth is the axis it
        // cannot see: the editor2D camera sits `EDITOR2D_CAMERA_OFFSET` in front of
        // the framed wall, so the rest of the room stands BEHIND it — invisible, yet
        // swept by the pick ray (see `clampRaycasterToCameraDepth` for why the ray
        // starts behind the camera on the WebGPU backend). Bound the ray to the
        // camera's own near/far slab so picking can only reach what is rendered; the
        // helper resets the shared raycaster to unbounded for every other mode.
        clampRaycasterToCameraDepth(this.raycaster, camera, d.e2ClipEnabled);
        return this.raycaster.intersectObject(d.scene, true);
    }
    /**
     * Forward to `Handler.pointermove` when the pointer is captured outside the
     * canvas (e.g. catalog chip) so events never hit canvas listeners.
     */
    handleExternalDragPointerMove(event) {
        this.handler.pointerEvents.pointermove(event);
    }
    /**
     * Forward to `Handler.pointerup` when the pointer is released over an HTML
     * overlay (e.g. DoorIcon for gate items), so the canvas `pointerup` listener
     * never fires but the final node parent/position still commits to the undo
     * transaction. Caller must guard with `core.draggedNodeId.get() !== null`.
     */
    handleExternalDragPointerUp() {
        this.handler.pointerEvents.pointerup(new PointerEvent('pointerup'));
    }
    /**
     * Clear canvas-side gesture state on a core reset (foreground loss). See
     * {@link unsubscribeReset} for why this is needed and why it routes through
     * `core.handlers.onReset` rather than a local `window` listener.
     */
    onCoreReset = () => {
        this.canvasTouchPointers.clear();
        this.syntheticContextmenuPointerId = null;
    };
    onPointerCancel = (event) => {
        if (event.pointerType !== 'touch')
            return;
        this.canvasTouchPointers.delete(event.pointerId);
        // Only end the synthetic 2-finger drag when one of the gesture's
        // original fingers leaves (canvas count drops below 2). A 3rd-finger
        // cancel (palm rest, accidental touch) must NOT end the pinch — M3D-244.
        if (this.syntheticContextmenuPointerId !== null && this.canvasTouchPointers.size < 2) {
            this.syntheticContextmenuPointerId = null;
            this.handler.pointerEvents.pointerup(event);
        }
    };
    /**
     * Apply a pinch factor from `core.handlers.onPinch` to the ortho camera.
     * `factor > 1` = fingers spreading (zoom in), `< 1` = fingers closing.
     *
     * Skip when both fingers landed on the canvas — OrbitControls' native
     * DOLLY_PAN owns that case and we'd double-zoom otherwise. Skip when the
     * camera is perspective — pinch in 3D/walkthrough views is handled by
     * OrbitControls natively (no overlay widgets there to break it).
     */
    applyPinchFactor = (factor) => {
        if (this.canvasTouchPointers.size >= 2)
            return;
        const camera = this.designer3D.getCamera();
        if (!(camera instanceof OrthographicCamera))
            return;
        const { controls } = this.designer3D;
        const next = clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom);
        if (next === camera.zoom)
            return;
        camera.zoom = next;
        camera.updateProjectionMatrix();
        // `controls.update()` reads back the zoom we just set; `dispatchEvent` is
        // required because `update()` only emits `change` when ITS own scale moved
        // — a direct `camera.zoom` write doesn't trigger that, and without the
        // dispatch `onChangeControls` would never publish the new camera matrix.
        controls.update();
        controls.dispatchEvent({ type: 'change' });
        this.designer3D.requestRender();
    };
    dispose() {
        for (const name of pointerEventsList) {
            this.designer3D.canvas.removeEventListener(name, this.pointerEvents[name]);
        }
        this.designer3D.canvas.removeEventListener('pointercancel', this.onPointerCancel);
        this.unsubscribePinch();
        this.unsubscribeReset();
        // Reset mid-gesture teardown (room switch, HMR) so the next instance's
        // two-finger promotion logic isn't poisoned by stale ids. Pinch baseline
        // state lives in `core.handlers` and clears there.
        this.syntheticContextmenuPointerId = null;
        this.canvasTouchPointers.clear();
        this.handler.dispose();
    }
}

const TOP = 85;
class DesignerInspector {
    inspector;
    _counter = 0;
    _counterTs = 0;
    _stats = { rendersPerSecond: 0 };
    constructor(rootElement, renderer) {
        this.inspector = new Inspector();
        renderer.inspector = this.inspector; // Inspector extends InspectorBase, widening needed
        rootElement.appendChild(this.inspector.domElement);
        this._applyPositioning();
        this._setupRenderStats();
        this._counterTs = performance.now();
    }
    // Called on every actual GPU render (inside animate()).
    onRender() {
        this._counter++;
        const now = performance.now();
        const elapsed = now - this._counterTs;
        if (elapsed >= 1000) {
            this._stats.rendersPerSecond = Math.round((this._counter * 1000) / elapsed);
            this._counter = 0;
            this._counterTs = now;
        }
    }
    dispose() {
        this.inspector.domElement.remove();
    }
    // ─── private ────────────────────────────────────────────────────────────────
    _applyPositioning() {
        // #profiler-toggle and #profiler-mini-panel are position:fixed in the
        // Inspector's own stylesheet. Push them down to clear the app toolbar.
        const toggle = this.inspector.domElement.querySelector('#profiler-toggle');
        if (toggle)
            toggle.style.top = `${TOP}px`;
        const mini = this.inspector.domElement.querySelector('#profiler-mini-panel');
        if (mini)
            mini.style.top = `${TOP + 50}px`;
    }
    _setupRenderStats() {
        const renderGroup = this.inspector.createParameters('Render Stats');
        renderGroup.add(this._stats, 'rendersPerSecond').name('Actual FPS').listen();
        // createParameters() activates the Parameters builtin tab and opens the mini-panel.
        // Restore a clean initial state: Performance tab active, mini-panel closed.
        const insp = this.inspector;
        insp.profiler.setActiveTab(insp.performance.id);
        const profilerMini = insp.profiler.miniPanel;
        profilerMini.classList.remove('visible');
        profilerMini.querySelectorAll('.mini-panel-content').forEach((c) => {
            c.style.display = 'none';
        });
        Array.from(insp.profiler.builtinTabsContainer.querySelectorAll('.builtin-tab-btn')).forEach((b) => {
            b.classList.remove('active');
        });
    }
}

/**
 * Lateral probe offset (inches) just beyond the item face. Small enough that
 * only a touching/adjacent neighbor is hit, large enough to clear float error
 * at the shared face. Tunable.
 */
const DEFAULT_NEIGHBOR_PROBE_DELTA = 0.5;
/**
 * Containment epsilon for the unit-cube test — absorbs round-trip float error
 * from the matrix invert without admitting genuinely separate boxes.
 */
const CONTAINMENT_EPS = 1e-4;
// Module-level scratch — the query path runs allocation-free (perf rules).
const _itemMatrix = new Matrix4$1();
const _probeWorld = new Vector3$1();
const _candidateMatrix = new Matrix4$1();
const _localPoint = new Vector3$1();
/**
 * Find the multiCloset (or any product) whose box contains a point placed just
 * outside `item`'s left or right face.
 *
 * The probe point is built in item-local space — `right → (size.x + delta,
 * size.y/2, size.z/2)`, `left → (-delta, size.y/2, size.z/2)` — then lifted to
 * world via `getMatrixWorld(item, false)` (pose-only, so item-local `[0..size]`
 * maps to world).
 *
 * `instanceManagers` supplies the **candidate set** (which nodes to consider —
 * e.g. only multiClosets), exactly as `checkCollision` / `contributeNeighbors`
 * scope their searches. The candidate **geometry**, however, is read from the
 * authoritative core signals via `getMatrixWorld(node, true)` — NOT from the
 * `InstancedMesh` buffer. The instance buffer is a lagging, selection-masked
 * mirror: `updateInstancedMatrixEffect` parks the selected/just-dragged closet
 * at `dummyMatrix`, and Preact flushes effects in dirty order (not registration
 * order), so at drag-end the buffer may not yet reflect the final pose. Reading
 * core instead makes this probe independent of `dummyMatrix`-hiding and effect
 * ordering, which is required for the reciprocal neighbor to resolve on the
 * very first placement.
 *
 * `getMatrixWorld(node, true)` maps the unit cube `[0,1]^3` onto the node's
 * world OBB, so we invert it and test whether the probe point lands inside
 * `[0,1]^3`. Returns the first hit's `nodeView.id`, or `null`.
 *
 * Reads core signals via `.get()`, so callers that need to avoid subscribing
 * (reactive effects) must invoke this inside `untracked`.
 */
const calculateNeighborId = (item, side, instanceManagers, delta = DEFAULT_NEIGHBOR_PROBE_DELTA) => {
    const { core } = item;
    const sizeX = item.size.x.get();
    const sizeY = item.size.y.get();
    const sizeZ = item.size.z.get();
    getMatrixWorld(item, false, _itemMatrix);
    _probeWorld.set(side === 'right' ? sizeX + delta : -delta, sizeY / 2, sizeZ / 2).applyMatrix4(_itemMatrix);
    for (const instanceManager of instanceManagers) {
        for (const nodeView of instanceManager.getNodeViews().values()) {
            if (nodeView.id === item.id)
                continue;
            // The candidate set comes from the InstanceManager, which is disposed by
            // `syncNodeViewsEffect` on the same `nodeIds` change that triggers a sweep;
            // effect flush order is not guaranteed, so a NodeView may still be listed
            // after its core node is gone. Skip it instead of throwing.
            const node = getOptionalNode(core, nodeView.id);
            if (!node)
                continue;
            getMatrixWorld(node, true, _candidateMatrix);
            _candidateMatrix.invert();
            _localPoint.copy(_probeWorld).applyMatrix4(_candidateMatrix);
            if (_localPoint.x >= -CONTAINMENT_EPS &&
                _localPoint.x <= 1 + CONTAINMENT_EPS &&
                _localPoint.y >= -CONTAINMENT_EPS &&
                _localPoint.y <= 1 + CONTAINMENT_EPS &&
                _localPoint.z >= -CONTAINMENT_EPS &&
                _localPoint.z <= 1 + CONTAINMENT_EPS) {
                return nodeView.id;
            }
        }
    }
    return null;
};

/**
 * Creates extruded geometry from a path shape.
 *
 * ```js
 * const length = 12, width = 8;
 *
 * const shape = new THREE.Shape();
 * shape.moveTo( 0,0 );
 * shape.lineTo( 0, width );
 * shape.lineTo( length, width );
 * shape.lineTo( length, 0 );
 * shape.lineTo( 0, 0 );
 *
 * const geometry = new THREE.ExtrudeGeometry( shape );
 * const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
 * const mesh = new THREE.Mesh( geometry, material ) ;
 * scene.add( mesh );
 * ```
 *
 * @augments BufferGeometry
 * @demo scenes/geometry-browser.html#ExtrudeGeometry
 */
class CustomExtrudeGeometry extends BufferGeometry {
    /**
     * Constructs a new extrude geometry.
     *
     * @param {Shape|Array<Shape>} [shapes] - A shape or an array of shapes.
     * @param {ExtrudeGeometry~Options} [options] - The extrude settings.
     */
    constructor(shapes = new Shape([
        new Vector2$1(0.5, 0.5),
        new Vector2$1(-0.5, 0.5),
        new Vector2$1(-0.5, -0.5),
        new Vector2$1(0.5, -0.5)
    ]), options = {}) {
        super();
        function addShape(shape) {
            const placeholder = [];
            // options
            const curveSegments = options.curveSegments !== undefined ? options.curveSegments : 12;
            const steps = options.steps !== undefined ? options.steps : 1;
            const depth = options.depth !== undefined ? options.depth : 1;
            const sides = options.sides !== undefined ? options.sides : 1;
            const extrudePath = options.extrudePath;
            const uvgen = options.UVGenerator !== undefined ? options.UVGenerator : WorldUVGenerator;
            //
            let extrudePts, extrudeByPath = false;
            let splineTube, binormal, normal, position2;
            if (extrudePath) {
                extrudePts = extrudePath.getSpacedPoints(steps);
                extrudeByPath = true;
                // SETUP TNB variables
                const isClosed = extrudePath.isCatmullRomCurve3
                    ? extrudePath.closed
                    : false;
                splineTube = extrudePath.computeFrenetFrames(steps, isClosed);
                // log(splineTube, 'splineTube', splineTube.normals.length, 'steps', steps, 'extrudePts', extrudePts.length);
                binormal = new Vector3();
                normal = new Vector3();
                position2 = new Vector3();
            }
            // Variables initialization
            const shapePoints = shape.extractPoints(curveSegments);
            let vertices = shapePoints.shape;
            const holes = shapePoints.holes;
            const reverse = !ShapeUtils.isClockWise(vertices);
            if (reverse) {
                vertices = vertices.reverse();
                // Maybe we should also check if holes are in the opposite direction, just to be safe ...
                for (let h = 0, hl = holes.length; h < hl; h++) {
                    const ahole = holes[h];
                    if (ShapeUtils.isClockWise(ahole)) {
                        holes[h] = ahole.reverse();
                    }
                }
            }
            /**Merges index-adjacent points that are within a threshold distance of each other. Array is modified in-place. Threshold distance is empirical, and scaled based on the magnitude of point coordinates.
             * @param {Array<Vector2>} points
             */
            function mergeOverlappingPoints(points) {
                const THRESHOLD = 1e-10;
                const THRESHOLD_SQ = THRESHOLD * THRESHOLD;
                let prevPos = points[0];
                for (let i = 1; i <= points.length; i++) {
                    const currentIndex = i % points.length;
                    const currentPos = points[currentIndex];
                    const dx = currentPos.x - prevPos.x;
                    const dy = currentPos.y - prevPos.y;
                    const distSq = dx * dx + dy * dy;
                    const scalingFactorSqrt = Math.max(Math.abs(currentPos.x), Math.abs(currentPos.y), Math.abs(prevPos.x), Math.abs(prevPos.y));
                    const thresholdSqScaled = THRESHOLD_SQ * scalingFactorSqrt * scalingFactorSqrt;
                    if (distSq <= thresholdSqScaled) {
                        points.splice(currentIndex, 1);
                        i--;
                        continue;
                    }
                    prevPos = currentPos;
                }
            }
            mergeOverlappingPoints(vertices);
            holes.forEach(mergeOverlappingPoints);
            const numHoles = holes.length;
            /* Vertices */
            const contour = vertices; // vertices has all points but contour has only points of circumference
            for (let h = 0; h < numHoles; h++) {
                const ahole = holes[h];
                vertices = vertices.concat(ahole);
            }
            const vlen = vertices.length;
            // Find directions for point movement
            function getBevelVec(inPt, inPrev, inNext) {
                // computes for inPt the corresponding point inPt' on a new contour
                //   shifted by 1 unit (length of normalized vector) to the left
                // if we walk along contour clockwise, this new contour is outside the old one
                //
                // inPt' is the intersection of the two lines parallel to the two
                //  adjacent edges of inPt at a distance of 1 unit on the left side.
                let v_trans_x, v_trans_y, shrink_by; // resulting translation vector for inPt
                // good reading for geometry algorithms (here: line-line intersection)
                // http://geomalgorithms.com/a05-_intersect-1.html
                const v_prev_x = inPt.x - inPrev.x, v_prev_y = inPt.y - inPrev.y;
                const v_next_x = inNext.x - inPt.x, v_next_y = inNext.y - inPt.y;
                const v_prev_lensq = v_prev_x * v_prev_x + v_prev_y * v_prev_y;
                // check for collinear edges
                const collinear0 = v_prev_x * v_next_y - v_prev_y * v_next_x;
                if (Math.abs(collinear0) > Number.EPSILON) {
                    // not collinear
                    // length of vectors for normalizing
                    const v_prev_len = Math.sqrt(v_prev_lensq);
                    const v_next_len = Math.sqrt(v_next_x * v_next_x + v_next_y * v_next_y);
                    // shift adjacent points by unit vectors to the left
                    const ptPrevShift_x = inPrev.x - v_prev_y / v_prev_len;
                    const ptPrevShift_y = inPrev.y + v_prev_x / v_prev_len;
                    const ptNextShift_x = inNext.x - v_next_y / v_next_len;
                    const ptNextShift_y = inNext.y + v_next_x / v_next_len;
                    // scaling factor for v_prev to intersection point
                    const sf = ((ptNextShift_x - ptPrevShift_x) * v_next_y - (ptNextShift_y - ptPrevShift_y) * v_next_x) /
                        (v_prev_x * v_next_y - v_prev_y * v_next_x);
                    // vector from inPt to intersection point
                    v_trans_x = ptPrevShift_x + v_prev_x * sf - inPt.x;
                    v_trans_y = ptPrevShift_y + v_prev_y * sf - inPt.y;
                    // Don't normalize!, otherwise sharp corners become ugly
                    //  but prevent crazy spikes
                    const v_trans_lensq = v_trans_x * v_trans_x + v_trans_y * v_trans_y;
                    if (v_trans_lensq <= 2) {
                        return new Vector2$1(v_trans_x, v_trans_y);
                    }
                    else {
                        shrink_by = Math.sqrt(v_trans_lensq / 2);
                    }
                }
                else {
                    // handle special case of collinear edges
                    let direction_eq = false; // assumes: opposite
                    if (v_prev_x > Number.EPSILON) {
                        if (v_next_x > Number.EPSILON) {
                            direction_eq = true;
                        }
                    }
                    else {
                        if (v_prev_x < -Number.EPSILON) {
                            if (v_next_x < -Number.EPSILON) {
                                direction_eq = true;
                            }
                        }
                        else {
                            if (Math.sign(v_prev_y) === Math.sign(v_next_y)) {
                                direction_eq = true;
                            }
                        }
                    }
                    if (direction_eq) {
                        // log("Warning: lines are a straight sequence");
                        v_trans_x = -v_prev_y;
                        v_trans_y = v_prev_x;
                        shrink_by = Math.sqrt(v_prev_lensq);
                    }
                    else {
                        // log("Warning: lines are a straight spike");
                        v_trans_x = v_prev_x;
                        v_trans_y = v_prev_y;
                        shrink_by = Math.sqrt(v_prev_lensq / 2);
                    }
                }
                return new Vector2$1(v_trans_x / shrink_by, v_trans_y / shrink_by);
            }
            const contourMovements = [];
            for (let i = 0, il = contour.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
                if (j === il)
                    j = 0;
                if (k === il)
                    k = 0;
                //  (j)---(i)---(k)
                // log('i,j,k', i, j , k)
                contourMovements[i] = getBevelVec(contour[i], contour[j], contour[k]);
            }
            let oneHoleMovements;
            let verticesMovements = contourMovements.concat();
            for (let h = 0, hl = numHoles; h < hl; h++) {
                const ahole = holes[h];
                oneHoleMovements = [];
                for (let i = 0, il = ahole.length, j = il - 1, k = i + 1; i < il; i++, j++, k++) {
                    if (j === il)
                        j = 0;
                    if (k === il)
                        k = 0;
                    //  (j)---(i)---(k)
                    oneHoleMovements[i] = getBevelVec(ahole[i], ahole[j], ahole[k]);
                }
                verticesMovements = verticesMovements.concat(oneHoleMovements);
            }
            let faces;
            faces = ShapeUtils.triangulateShape(contour, holes);
            const flen = faces.length;
            // Back facing vertices
            for (let i = 0; i < vlen; i++) {
                const vert = vertices[i];
                if (!extrudeByPath) {
                    v(vert.x, vert.y, 0);
                }
                else {
                    // v( vert.x, vert.y + extrudePts[ 0 ].y, extrudePts[ 0 ].x );
                    normal.copy(splineTube.normals[0]).multiplyScalar(vert.x);
                    binormal.copy(splineTube.binormals[0]).multiplyScalar(vert.y);
                    position2.copy(extrudePts[0]).add(normal).add(binormal);
                    v(position2.x, position2.y, position2.z);
                }
            }
            // Add stepped vertices...
            // Including front facing vertices
            for (let s = 1; s <= steps; s++) {
                for (let i = 0; i < vlen; i++) {
                    const vert = vertices[i];
                    if (!extrudeByPath) {
                        v(vert.x, vert.y, (depth / steps) * s);
                    }
                    else {
                        // v( vert.x, vert.y + extrudePts[ s - 1 ].y, extrudePts[ s - 1 ].x );
                        normal.copy(splineTube.normals[s]).multiplyScalar(vert.x);
                        binormal.copy(splineTube.binormals[s]).multiplyScalar(vert.y);
                        position2.copy(extrudePts[s]).add(normal).add(binormal);
                        v(position2.x, position2.y, position2.z);
                    }
                }
            }
            /* Faces */
            // Top and bottom faces
            buildLidFaces();
            // Sides faces
            if (sides) {
                buildSideFaces();
            }
            /////  Internal functions
            function buildLidFaces() {
                // const start = verticesArray.length / 3;
                // Bottom faces
                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    f3(face[2], face[1], face[0]);
                }
                // Top faces
                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    f3(face[0] + vlen * steps, face[1] + vlen * steps, face[2] + vlen * steps);
                }
                // scope.addGroup(start, verticesArray.length / 3 - start, 0);
            }
            // Create faces for the z-sides of the shape
            function buildSideFaces() {
                // const start = verticesArray.length / 3;
                let layeroffset = 0;
                sidewalls(contour, layeroffset);
                layeroffset += contour.length;
                for (let h = 0, hl = holes.length; h < hl; h++) {
                    const ahole = holes[h];
                    sidewalls(ahole, layeroffset);
                    //, true
                    layeroffset += ahole.length;
                }
                // scope.addGroup(start, verticesArray.length / 3 - start, 1);
            }
            function sidewalls(contour, layeroffset) {
                let i = contour.length;
                while (--i >= 0) {
                    const j = i;
                    let k = i - 1;
                    if (k < 0)
                        k = contour.length - 1;
                    //log('b', i,j, i-1, k,vertices.length);
                    for (let s = 0, sl = steps; s < sl; s++) {
                        const slen1 = vlen * s;
                        const slen2 = vlen * (s + 1);
                        const a = layeroffset + j + slen1, b = layeroffset + k + slen1, c = layeroffset + k + slen2, d = layeroffset + j + slen2;
                        f4(a, b, c, d);
                    }
                }
            }
            function v(x, y, z) {
                placeholder.push(x);
                placeholder.push(y);
                placeholder.push(z);
            }
            function f3(a, b, c) {
                addVertex(a);
                addVertex(b);
                addVertex(c);
                const nextIndex = verticesArray.length / 3;
                const uvs = uvgen.generateTopUV(scope, verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1);
                addUV(uvs[0]);
                addUV(uvs[1]);
                addUV(uvs[2]);
            }
            function f4(a, b, c, d) {
                addVertex(a);
                addVertex(b);
                addVertex(d);
                addVertex(b);
                addVertex(c);
                addVertex(d);
                const nextIndex = verticesArray.length / 3;
                const uvs = uvgen.generateSideWallUV(scope, verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1);
                addUV(uvs[0]);
                addUV(uvs[1]);
                addUV(uvs[3]);
                addUV(uvs[1]);
                addUV(uvs[2]);
                addUV(uvs[3]);
            }
            function addVertex(index) {
                verticesArray.push(placeholder[index * 3 + 0]);
                verticesArray.push(placeholder[index * 3 + 1]);
                verticesArray.push(placeholder[index * 3 + 2]);
            }
            function addUV(vector2) {
                uvArray.push(vector2.x);
                uvArray.push(vector2.y);
            }
        }
        // this.type = 'ExtrudeGeometry';
        /**
         * Holds the constructor parameters that have been
         * used to generate the geometry. Any modification
         * after instantiation does not change the geometry.
         *
         * @type {Object}
         */
        // this.parameters = {
        //   shapes: shapes,
        //   options: options
        // };
        const shapesArray = Array.isArray(shapes) ? shapes : [shapes];
        const scope = this;
        const verticesArray = [];
        const uvArray = [];
        for (let i = 0, l = shapesArray.length; i < l; i++) {
            const shape = shapesArray[i];
            addShape(shape);
        }
        // build geometry
        this.setAttribute('position', new Float32BufferAttribute(verticesArray, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvArray, 2));
        this.computeVertexNormals();
    }
    copy(source) {
        super.copy(source);
        // this.parameters = Object.assign({}, source.parameters);
        return this;
    }
    toJSON() {
        const data = super.toJSON();
        // const shapes = this.parameters.shapes;
        // const options = this.parameters.options;
        return toJSON(data);
    }
    /**
     * Factory method for creating an instance of this class from the given
     * JSON object.
     *
     * @param {Object} data - A JSON object representing the serialized geometry.
     * @param {Array<Shape>} shapes - An array of shapes.
     * @return {ExtrudeGeometry} A new instance.
     */
    static fromJSON(data, shapes) {
        const geometryShapes = [];
        for (let j = 0, jl = data.shapes.length; j < jl; j++) {
            const shape = shapes[data.shapes[j]];
            geometryShapes.push(shape);
        }
        const extrudePath = data.options.extrudePath;
        if (extrudePath !== undefined) {
            data.options.extrudePath = new Curves[extrudePath.type]().fromJSON(extrudePath);
        }
        return new CustomExtrudeGeometry(geometryShapes, data.options);
    }
}
const WorldUVGenerator = {
    generateTopUV: function (_geometry, vertices, indexA, indexB, indexC) {
        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];
        return [new Vector2$1(a_x, a_y), new Vector2$1(b_x, b_y), new Vector2$1(c_x, c_y)];
    },
    generateSideWallUV: function (_geometry, vertices, indexA, indexB, indexC, indexD) {
        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const a_z = vertices[indexA * 3 + 2];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const b_z = vertices[indexB * 3 + 2];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];
        const c_z = vertices[indexC * 3 + 2];
        const d_x = vertices[indexD * 3];
        const d_y = vertices[indexD * 3 + 1];
        const d_z = vertices[indexD * 3 + 2];
        if (Math.abs(a_y - b_y) < Math.abs(a_x - b_x)) {
            return [
                new Vector2$1(a_x, 1 - a_z),
                new Vector2$1(b_x, 1 - b_z),
                new Vector2$1(c_x, 1 - c_z),
                new Vector2$1(d_x, 1 - d_z)
            ];
        }
        else {
            return [
                new Vector2$1(a_y, 1 - a_z),
                new Vector2$1(b_y, 1 - b_z),
                new Vector2$1(c_y, 1 - c_z),
                new Vector2$1(d_y, 1 - d_z)
            ];
        }
    }
};
function toJSON(data) {
    // data.shapes = [];
    // if (Array.isArray(shapes)) {
    //   for (let i = 0, l = shapes.length; i < l; i++) {
    //     const shape = shapes[i];
    //     data.shapes.push(shape.uuid);
    //   }
    // } else {
    //   data.shapes.push(shapes.uuid);
    // }
    // data.options = Object.assign({}, options);
    // if (options.extrudePath !== undefined) data.options.extrudePath = options.extrudePath.toJSON();
    return data;
}

const origin = new Vector2$1();
const createGeometry = (geometry, gd = 0, grainOffset, textureLength = defaultTextureSize, textureWidth = defaultTextureSize) => {
    const grainDirection = MathUtils.DEG2RAD * gd;
    const sheetSize = new Vector2$1(Math.abs(grainDirection - Math.PI / 2) < 0.01 ? textureLength : textureWidth, Math.abs(grainDirection - Math.PI / 2) < 0.01 ? textureWidth : textureLength);
    if (geometry instanceof BufferGeometry) {
        if (geometry instanceof ShapeGeometry ||
            geometry instanceof CustomExtrudeGeometry
        //|| geometry instanceof CustomExtrudeBufferGeometry
        ) {
            let maxX = -Infinity, maxY = -Infinity, minX = Infinity, minY = Infinity;
            for (let i = 0; i < geometry.attributes.position.array.length; i += 1) {
                if (i % 2) {
                    if (geometry.attributes.position.array[i] > maxY) {
                        maxY = geometry.attributes.position.array[i];
                    }
                    if (geometry.attributes.position.array[i] < minY) {
                        minY = geometry.attributes.position.array[i];
                    }
                }
                else {
                    if (geometry.attributes.position.array[i] > maxX) {
                        maxX = geometry.attributes.position.array[i];
                    }
                    if (geometry.attributes.position.array[i] < minX) {
                        minX = geometry.attributes.position.array[i];
                    }
                }
            }
            const dX = maxX - minX;
            const dY = maxY - minY;
            const newUvs = new Float32Array(new Array(geometry.attributes.uv.array.length).fill(0));
            const newUvs2 = new Float32Array(new Array(geometry.attributes.uv.array.length).fill(0));
            const itemSize = geometry.attributes.uv.itemSize;
            for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
                const uv = new Vector2$1(geometry.attributes.uv.array[i], geometry.attributes.uv.array[i + 1]);
                if (grainOffset) {
                    uv.add(grainOffset);
                }
                newUvs2[i] = (geometry.attributes.uv.array[i] - minX) / dX;
                newUvs2[i + 1] = (geometry.attributes.uv.array[i + 1] - minY) / dY;
                uv.multiply(new Vector2$1(1 / sheetSize.x, 1 / sheetSize.y));
                if (gd) {
                    uv.rotateAround(origin, grainDirection);
                }
                newUvs[i] = uv.x;
                newUvs[i + 1] = uv.y;
            }
            geometry.setAttribute('uv', new BufferAttribute(newUvs, itemSize));
            geometry.setAttribute('uv2', new BufferAttribute(newUvs2, itemSize));
        }
        else if (geometry instanceof BoxGeometry) {
            const newUvs = new Float32Array(new Array(48).fill(0));
            for (let i = 0; i <= 15; i += 1) {
                newUvs[i] =
                    i % 2
                        ? (geometry.attributes.uv.array[i] * geometry.parameters.height) / sheetSize.x
                        : (geometry.attributes.uv.array[i] * geometry.parameters.depth) / sheetSize.x;
            }
            for (let i = 16; i <= 31; i += 1) {
                newUvs[i] =
                    i % 2
                        ? (geometry.attributes.uv.array[i] * geometry.parameters.depth) / sheetSize.x
                        : (geometry.attributes.uv.array[i] * geometry.parameters.width) / sheetSize.x;
            }
            for (let i = 32; i <= 47; i += 1) {
                newUvs[i] =
                    i % 2
                        ? (geometry.attributes.uv.array[i] * geometry.parameters.height) / sheetSize.x
                        : (geometry.attributes.uv.array[i] * geometry.parameters.width) / sheetSize.x;
            }
            geometry.setAttribute('uv', new Float32BufferAttribute(newUvs, 2));
        }
    }
    return geometry;
};
const createGeometryScalable = (geometry, grainDirection, grainOffset, grainScale = 1) => {
    if (geometry instanceof ShapeGeometry ||
        geometry instanceof CustomExtrudeGeometry
    // geometry instanceof CustomExtrudeBufferGeometry
    ) {
        let maxX = -Infinity, maxY = -Infinity, minX = Infinity, minY = Infinity;
        for (let i = 0; i < geometry.attributes.position.array.length; i += 1) {
            if (i % 2) {
                if (geometry.attributes.position.array[i] > maxY) {
                    maxY = geometry.attributes.position.array[i];
                }
                if (geometry.attributes.position.array[i] < minY) {
                    minY = geometry.attributes.position.array[i];
                }
            }
            else {
                if (geometry.attributes.position.array[i] > maxX) {
                    maxX = geometry.attributes.position.array[i];
                }
                if (geometry.attributes.position.array[i] < minX) {
                    minX = geometry.attributes.position.array[i];
                }
            }
        }
        const dX = maxX - minX;
        const dY = maxY - minY;
        const newUvs = new Float32Array(new Array(geometry.attributes.uv.array.length).fill(0));
        const newUvs2 = new Float32Array(new Array(geometry.attributes.uv.array.length).fill(0));
        const itemSize = geometry.attributes.uv.itemSize;
        for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
            const uv = new Vector2$1(geometry.attributes.uv.array[i], geometry.attributes.uv.array[i + 1]);
            newUvs2[i] = (geometry.attributes.uv.array[i] - minX) / dX;
            newUvs2[i + 1] = (geometry.attributes.uv.array[i + 1] - minY) / dY;
            uv.multiplyScalar(1 / grainScale / defaultTextureSize);
            if (grainDirection) {
                uv.rotateAround(origin, grainDirection);
            }
            newUvs[i] = uv.x;
            newUvs[i + 1] = uv.y;
        }
        geometry.setAttribute('uv', new BufferAttribute(newUvs, itemSize));
        geometry.setAttribute('uv2', new BufferAttribute(newUvs2, itemSize));
    }
    else if (geometry instanceof BoxGeometry) {
        const newUvs = new Float32Array(new Array(48).fill(0));
        for (let i = 0; i <= 15; i += 1) {
            newUvs[i] =
                i % 2
                    ? (geometry.attributes.uv.array[i] * geometry.parameters.height) / grainScale / defaultTextureSize
                    : (geometry.attributes.uv.array[i] * geometry.parameters.depth) / grainScale / defaultTextureSize;
        }
        for (let i = 16; i <= 31; i += 1) {
            newUvs[i] =
                i % 2
                    ? (geometry.attributes.uv.array[i] * geometry.parameters.depth) / grainScale / defaultTextureSize
                    : (geometry.attributes.uv.array[i] * geometry.parameters.width) / grainScale / defaultTextureSize;
        }
        for (let i = 32; i <= 47; i += 1) {
            newUvs[i] =
                i % 2
                    ? (geometry.attributes.uv.array[i] * geometry.parameters.height) / grainScale / defaultTextureSize
                    : (geometry.attributes.uv.array[i] * geometry.parameters.width) / grainScale / defaultTextureSize;
        }
        geometry.setAttribute('uv', new Float32BufferAttribute(newUvs, 2));
    }
    return geometry;
};
// export function ProfiledFrameContourGeometry(
//   shape,
//   contour,
//   contourClosed,
//   openEnded,
//   grouped,
//   textureLength = defaultTextureSize,
//   textureWidth = defaultTextureSize
// ) {
//   const sheetSize = new Vector2(
//     textureWidth,
//     textureLength
//   );
//   const profileShape = shape.getPoints();
//   const profileContour = contour.getPoints();
//   const triangulatedShape = ShapeUtils.triangulateShape( shape.extractPoints().shape, [] );
//   const _contourClosed = contourClosed === undefined ? false : contourClosed;
//   const _openEnded = openEnded === undefined ? false : openEnded;
//   // openEnded = contourClosed === true ? false : openEnded;
//   /* if( contourClosed ) {
//     contour.push( contour[ 0 ], contour[ 1 ] );
//   }*/
//   let hs1 = profileContour.length;
//   let rs1 = profileShape.length;
//   let hs = hs1 - 1; /* height segments*/
//   let rs = rs1 - 1; /* radius segments*/
//   let faceCount = hs * rs * 2 + ( _openEnded ? 0 : 2 * triangulatedShape.length );
//   let posCount = hs1 * rs1 * 6 + ( _openEnded ? 0 : 2 * rs1 );
//   let g = new BufferGeometry( );
//   const indices = new Uint16Array( faceCount * 3 );
//   const positions = new Float32Array( posCount * 3 );
//   const uvs = new Float32Array( posCount * 2 );
//   g.setIndex( new BufferAttribute( indices, 1 ) );
//   g.setAttribute( 'position', new BufferAttribute( positions, 3 ) );
//   g.setAttribute( 'uv', new BufferAttribute( uvs, 2 ) );
//   let a, b1, c1, b2;
//   let i1;
//   let xc0, yc0, xc1, yc1, xc2, yc2, xSh, xDiv;
//   let dx0, dy0, dx2, dy2;
//   let e0x, e0y, e0Length, e2x, e2y, e2Length, ex, ey, eLength;
//   let phi, bend;
//   let x, y, z;
//   let vIdx, posIdx;
//   let epsilon = 0.000001;
//   let idx = 0;
//   const v2 = new Vector2();
//   const v2r1 = new Vector2();
//   const v20 = new Vector2();
//   for ( let i = 0; i < hs; i++ ) {
//     if ( grouped ) {
//       g.addGroup( idx, 6 * rs, i );
//     }
//     i1 = i + 1;
//     for ( let j = 0; j < rs; j++ ) {
//       // 2 faces / segment,  3 vertex indices
//       a = rs1 * i + j;
//       c1 = rs1 * i1 + j; /* left */
//       b1 = c1 + 1;
//       // c2 = b1;         // right
//       b2 = a + 1;
//       indices[ idx ] = a; /* a + 2 * rs1; // left */
//       indices[ idx + 1 ] = b1 + rs1 * hs1;/* b1 + 4 * rs1;*/
//       indices[ idx + 2 ] = c1 + 2 * rs1 * hs1;/* c1 + 2 * rs1;*/
//       indices[ idx + 3 ] = a + 3 * rs1 * hs1;/* a + 2 * rs1; // right*/
//       indices[ idx + 4 ] = b2 + 4 * rs1 * hs1;/* b2 + 4 * rs1;*/
//       indices[ idx + 5 ] = b1 + 5 * rs1 * hs1;/* b1 + 4 * rs1; // = c2*/
//       idx += 6;
//     }
//   }
//   if( !_openEnded ) {
//     if ( grouped ) {
//       g.addGroup( idx, triangulatedShape.length * 6, hs );
//     }
//     a = hs1 * rs1 * 6;
//     for ( let j = 0; j < triangulatedShape.length; j++ ) {
//       indices[ idx ] = a + triangulatedShape[ j ][ 0 ];
//       indices[ idx + 1 ] = a + triangulatedShape[ j ][ 1 ];
//       indices[ idx + 2 ] = a + triangulatedShape[ j ][ 2 ];
//       idx += 3;
//     }
//     a += rs1;
//     for ( let j = 0; j < triangulatedShape.length; j++ ) {
//       indices[ idx ] = a + triangulatedShape[ j ][ 1 ];
//       indices[ idx + 1 ] = a + triangulatedShape[ j ][ 0 ];
//       indices[ idx + 2 ] = a + triangulatedShape[ j ][ 2 ];
//       idx += 3;
//     }
//   }
//   for ( let i = 0; i < hs1; i++ ) {
//     xc1 = profileContour[ i ].x;
//     yc1 = profileContour[ i ].y;
//     if ( i === 0 ) {
//       if ( profileContour[ ( hs - 1 ) ] ) {
//         xc0 = profileContour[ ( hs - 1 ) ].x; /* penultimate point */
//         yc0 = profileContour[ ( hs - 1 ) ].y;
//       }
//     } else {
//       xc0 = profileContour[ i - 1 ].x; /* previous point */
//       yc0 = profileContour[ i - 1 ].y;
//     }
//     if ( i === hs ) {
//       if ( profileContour[ 1 ] ) {
//         xc2 = profileContour[ 1 ].x; /* second point */
//         yc2 = profileContour[ 1 ].y;
//       }
//     } else {
//       xc2 = profileContour[ i + 1 ].x; /* next point */
//       yc2 = profileContour[ i + 1 ].y;
//     }
//     if ( !_contourClosed ) {
//       if ( i === 0 ) {
//         // direction
//         dx2 = xc2 - xc1;
//         dy2 = yc2 - yc1;
//         // unit vector
//         e2Length = Math.sqrt( dx2 * dx2 + dy2 * dy2 );
//         e2x = dx2 / e2Length;
//         e2y = dy2 / e2Length;
//         // orthogonal
//         ex = e2y;
//         ey = -e2x;
//       }
//       if ( i === hs ) {
//         // direction
//         dx0 = xc1 - xc0;
//         dy0 = yc1 - yc0;
//         // unit vector
//         e0Length = Math.sqrt( dx0 * dx0 + dy0 * dy0 );
//         e0x = dx0 / e0Length;
//         e0y = dy0 / e0Length;
//         // orthogonal
//         ex = e0y;
//         ey = -e0x;
//       }
//       xDiv = 1;
//       bend = 1;
//     }
//     if ( ( i > 0 && i < hs ) || _contourClosed ) {
//       // directions
//       dx0 = xc0 - xc1;
//       dy0 = yc0 - yc1;
//       dx2 = xc2 - xc1;
//       dy2 = yc2 - yc1;
//       if( Math.abs( ( dy2 / dx2 ) - ( dy0 / dx0 ) ) < epsilon ) { /* prevent 0 */
//         dy0 += epsilon;
//       }
//       if( Math.abs( ( dx2 / dy2 ) - ( dx0 / dy0 ) ) < epsilon ) { /* prevent 0 */
//         dx0 += epsilon;
//       }
//       // unit vectors
//       e0Length = Math.sqrt( dx0 * dx0 + dy0 * dy0 );
//       e0x = dx0 / e0Length;
//       e0y = dy0 / e0Length;
//       e2Length = Math.sqrt( dx2 * dx2 + dy2 * dy2 );
//       e2x = dx2 / e2Length;
//       e2y = dy2 / e2Length;
//       // direction transformed
//       ex = e0x + e2x;
//       ey = e0y + e2y;
//       eLength = Math.sqrt( ex * ex + ey * ey );
//       ex /= eLength;
//       ey /= eLength;
//       phi = Math.acos( e2x * e0x + e2y * e0y ) / 2;
//       bend = Math.sign( dx0 * dy2 - dy0 * dx2 ); /* z cross -> curve bending */
//       xDiv = Math.sin( phi );
//     }
//     for ( let j = 0; j < rs1; j++ ) {
//       xSh = -profileShape[ j ].x;
//       x = xc1 + xSh / xDiv * bend * ex;
//       y = yc1 + xSh / xDiv * bend * ey;
//       z = -profileShape[ j ].y; /* ySh */
//       vIdx = rs1 * i + j;
//       posIdx = vIdx * 3;
//       positions[ posIdx ] = x;
//       positions[ posIdx + 1 ] = y;
//       positions[ posIdx + 2 ] = z;
//       v2.set( x / sheetSize.x + z * 1e-4, y / sheetSize.y - z * 1e-4 );
//       v2r1.copy( v2 );
//       // v2r2.copy( v2 );
//       // v2r1.rotateAround( v20, 0 );// Math.atan( ( xc1 - xc0 ) / ( yc1 - yc0 ) ) );
//       // v2r2.rotateAround( v20, 0 );// Math.atan( ( xc2 - xc1 ) / ( yc2 - yc1 ) ) );
//       v2r1.rotateAround( v20, Math.PI / 2 );
//       const prev = !( yc1 === yc0 );
//       const next = !( yc2 === yc1 );
//       uvs[ vIdx * 2 ] = prev ? v2r1.x : v2.x;
//       uvs[ vIdx * 2 + 1 ] = prev ? v2r1.y : v2.y;
//       positions[ 3 * rs1 * hs1 + posIdx ] = x;
//       positions[ 3 * rs1 * hs1 + posIdx + 1 ] = y;
//       positions[ 3 * rs1 * hs1 + posIdx + 2 ] = z;
//       uvs[ 2 * rs1 * hs1 + vIdx * 2 ] = next ? v2r1.x : v2.x;
//       uvs[ 2 * rs1 * hs1 + vIdx * 2 + 1 ] = next ? v2r1.y : v2.y;
//       positions[ 6 * rs1 * hs1 + posIdx ] = x;
//       positions[ 6 * rs1 * hs1 + posIdx + 1 ] = y;
//       positions[ 6 * rs1 * hs1 + posIdx + 2 ] = z;
//       uvs[ 4 * rs1 * hs1 + vIdx * 2 ] = next ? v2r1.x : v2.x;
//       uvs[ 4 * rs1 * hs1 + vIdx * 2 + 1 ] = next ? v2r1.y : v2.y;
//       positions[ 9 * rs1 * hs1 + posIdx ] = x;
//       positions[ 9 * rs1 * hs1 + posIdx + 1 ] = y;
//       positions[ 9 * rs1 * hs1 + posIdx + 2 ] = z;
//       uvs[ 6 * rs1 * hs1 + vIdx * 2 ] = prev ? v2r1.x : v2.x;
//       uvs[ 6 * rs1 * hs1 + vIdx * 2 + 1 ] = prev ? v2r1.y : v2.y;
//       positions[ 12 * rs1 * hs1 + posIdx ] = x;
//       positions[ 12 * rs1 * hs1 + posIdx + 1 ] = y;
//       positions[ 12 * rs1 * hs1 + posIdx + 2 ] = z;
//       uvs[ 8 * rs1 * hs1 + vIdx * 2 ] = prev ? v2r1.x : v2.x;
//       uvs[ 8 * rs1 * hs1 + vIdx * 2 + 1 ] = prev ? v2r1.y : v2.y;
//       positions[ 15 * rs1 * hs1 + posIdx ] = x;
//       positions[ 15 * rs1 * hs1 + posIdx + 1 ] = y;
//       positions[ 15 * rs1 * hs1 + posIdx + 2 ] = z;
//       uvs[ 10 * rs1 * hs1 + vIdx * 2 ] = next ? v2r1.x : v2.x;
//       uvs[ 10 * rs1 * hs1 + vIdx * 2 + 1 ] = next ? v2r1.y : v2.y;
//       if ( !_openEnded ) {
//         if ( i === 0 ) {
//           positions[ 18 * rs1 * hs1 + j * 3 ] = x;
//           positions[ 18 * rs1 * hs1 + j * 3 + 1 ] = y;
//           positions[ 18 * rs1 * hs1 + j * 3 + 2 ] = z;
//           uvs[ 12 * rs1 * hs1 + j * 2 ] = v2.x;
//           uvs[ 12 * rs1 * hs1 + j * 2 + 1 ] = v2.y;
//         }
//         if ( i === hs ) {
//           positions[ 18 * rs1 * hs1 + 3 * rs1 + j * 3 ] = x;
//           positions[ 18 * rs1 * hs1 + 3 * rs1 + j * 3 + 1 ] = y;
//           positions[ 18 * rs1 * hs1 + 3 * rs1 + j * 3 + 2 ] = z;
//           uvs[ 12 * rs1 * hs1 + 2 * rs1 + j * 2 ] = v2.x;
//           uvs[ 12 * rs1 * hs1 + 2 * rs1 + j * 2 + 1 ] = v2.y;
//         }
//       }
//     }
//   }
//   g.computeVertexNormals();
//   return g;
// }
function ProfiledContourGeometry(shape, contour, contourClosed, openEnded, grouped, grainDirection = 0, grainOffset = new Vector2$1(0, 0), textureLength = defaultTextureSize, textureWidth = defaultTextureSize) {
    const sheetSize = new Vector2$1(grainDirection === 90 ? textureLength : textureWidth, grainDirection === 90 ? textureWidth : textureLength);
    const profileShape = shape.getPoints();
    const profileContour = contour.getPoints();
    const triangulatedShape = ShapeUtils.triangulateShape(shape.extractPoints(12).shape, []);
    const _contourClosed = contourClosed === undefined ? false : contourClosed;
    const _openEnded = openEnded === undefined ? false : openEnded;
    // openEnded = contourClosed === true ? false : openEnded;
    /* if( contourClosed ) {
      contour.push( contour[ 0 ], contour[ 1 ] );
    }*/
    let hs1 = profileContour.length;
    let rs1 = profileShape.length;
    let hs = hs1 - 1; /* contour segments */
    let rs = rs1 - 1; /* shape segments */
    let faceCount = hs * rs * 2 + (_openEnded ? 0 : 2 * triangulatedShape.length);
    let posCount = hs1 * rs1 * 6 + (_openEnded ? 0 : 2 * rs1);
    let g = new BufferGeometry();
    const indices = new Uint16Array(faceCount * 3);
    const positions = new Float32Array(posCount * 3);
    const uvs = new Float32Array(posCount * 2);
    g.setIndex(new BufferAttribute(indices, 1));
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.setAttribute('uv', new BufferAttribute(uvs, 2));
    let a, b1, c1, b2;
    let i1;
    let xc0, yc0, xc1, yc1, xc2, yc2, xSh, xDiv;
    let dx0, dy0, dx2, dy2;
    let e0x, e0y, e0Length, e2x, e2y, e2Length, ex, ey, eLength;
    let phi, bend;
    let x, y, z;
    let vIdx, posIdx;
    let epsilon = 0.000001;
    let idx = 0;
    const v2 = new Vector2$1();
    const v20 = new Vector2$1();
    /* const v2r1 = new Vector2();
    const v2r2 = new Vector2();*/
    let groupIndex = 0;
    for (let i = 0; i < contour.curves.length; i += 1) {
        if (grouped) {
            switch (contour.curves[i].type) {
                case 'LineCurve':
                default:
                    g.addGroup(groupIndex, 24, i);
                    groupIndex += 24;
                    break;
                case 'EllipseCurve':
                    g.addGroup(groupIndex, 576, i);
                    groupIndex += 576;
                    break;
            }
        }
    }
    for (let i = 0; i < hs; i++) {
        // if ( grouped ) {
        //   g.addGroup( idx, 6 * rs, i );
        // }
        i1 = i + 1;
        for (let j = 0; j < rs; j++) {
            // 2 faces / segment,  3 vertex indices
            a = rs1 * i + j;
            c1 = rs1 * i1 + j; /* left*/
            b1 = c1 + 1;
            // c2 = b1;         // right
            b2 = a + 1;
            indices[idx] = a; /* a + 2 * rs1; // left */
            indices[idx + 1] = b1 + rs1 * hs1; /* b1 + 4 * rs1;*/
            indices[idx + 2] = c1 + 2 * rs1 * hs1; /* c1 + 2 * rs1; */
            indices[idx + 3] = a + 3 * rs1 * hs1; /* a + 2 * rs1; // right */
            indices[idx + 4] = b2 + 4 * rs1 * hs1; /* b2 + 4 * rs1; */
            indices[idx + 5] = b1 + 5 * rs1 * hs1; /*  b1 + 4 * rs1; // = c2 */
            idx += 6;
        }
    }
    if (!_openEnded) {
        if (grouped) {
            g.addGroup(idx, triangulatedShape.length * 6, hs);
        }
        a = hs1 * rs1 * 6;
        for (let j = 0; j < triangulatedShape.length; j++) {
            indices[idx] = a + triangulatedShape[j][0];
            indices[idx + 1] = a + triangulatedShape[j][1];
            indices[idx + 2] = a + triangulatedShape[j][2];
            idx += 3;
        }
        a += rs1;
        for (let j = 0; j < triangulatedShape.length; j++) {
            indices[idx] = a + triangulatedShape[j][1];
            indices[idx + 1] = a + triangulatedShape[j][0];
            indices[idx + 2] = a + triangulatedShape[j][2];
            idx += 3;
        }
    }
    let contourDistance = 0;
    for (let i = 0; i < hs1; i++) {
        /* contour segments*/
        xc1 = profileContour[i].x;
        yc1 = profileContour[i].y;
        if (i === 0) {
            if (profileContour[hs - 1]) {
                xc0 = profileContour[hs - 1].x; /* penultimate point*/
                yc0 = profileContour[hs - 1].y;
            }
        }
        else {
            xc0 = profileContour[i - 1].x; /* previous point*/
            yc0 = profileContour[i - 1].y;
        }
        if (i > 0) {
            contourDistance += Math.sqrt(Math.pow(xc1 - xc0, 2) + Math.pow(yc1 - yc0, 2));
        }
        if (i === hs) {
            if (profileContour[1]) {
                xc2 = profileContour[1].x; /* second point */
                yc2 = profileContour[1].y;
            }
        }
        else {
            xc2 = profileContour[i + 1].x; /* next point */
            yc2 = profileContour[i + 1].y;
        }
        if (!_contourClosed) {
            if (i === 0) {
                // direction
                dx2 = xc2 - xc1;
                dy2 = yc2 - yc1;
                // unit vector
                e2Length = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                e2x = dx2 / e2Length;
                e2y = dy2 / e2Length;
                // orthogonal
                ex = e2y;
                ey = -e2x;
            }
            if (i === hs) {
                // direction
                dx0 = xc1 - xc0;
                dy0 = yc1 - yc0;
                // unit vector
                e0Length = Math.sqrt(dx0 * dx0 + dy0 * dy0);
                e0x = dx0 / e0Length;
                e0y = dy0 / e0Length;
                // orthogonal
                ex = e0y;
                ey = -e0x;
            }
            xDiv = 1;
            bend = 1;
        }
        if ((i > 0 && i < hs) || _contourClosed) {
            // directions
            dx0 = xc0 - xc1;
            dy0 = yc0 - yc1;
            dx2 = xc2 - xc1;
            dy2 = yc2 - yc1;
            if (Math.abs(dy2 / dx2 - dy0 / dx0) < epsilon) {
                /* prevent 0 */
                dy0 += epsilon;
            }
            if (Math.abs(dx2 / dy2 - dx0 / dy0) < epsilon) {
                /* prevent 0 */
                dx0 += epsilon;
            }
            // unit vectors
            e0Length = Math.sqrt(dx0 * dx0 + dy0 * dy0);
            e0x = dx0 / e0Length;
            e0y = dy0 / e0Length;
            e2Length = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            e2x = dx2 / e2Length;
            e2y = dy2 / e2Length;
            // direction transformed
            ex = e0x + e2x;
            ey = e0y + e2y;
            eLength = Math.sqrt(ex * ex + ey * ey);
            ex /= eLength;
            ey /= eLength;
            phi = Math.acos(e2x * e0x + e2y * e0y) / 2;
            bend = Math.sign(dx0 * dy2 - dy0 * dx2); /* z cross -> curve bending */
            xDiv = Math.sin(phi);
        }
        let shapeDistance = 0;
        for (let j = 0; j < rs1; j++) {
            /* shape segments */
            if (j > 0) {
                shapeDistance += Math.sqrt(Math.pow(profileShape[j].x - profileShape[j - 1].x, 2) +
                    Math.pow(profileShape[j].y - profileShape[j - 1].y, 2));
            }
            xSh = -profileShape[j].x;
            x = xc1 + (xSh / xDiv) * bend * ex;
            y = yc1 + (xSh / xDiv) * bend * ey;
            z = -profileShape[j].y; /* ySh */
            vIdx = rs1 * i + j;
            posIdx = vIdx * 3;
            positions[posIdx] = x;
            positions[posIdx + 1] = y;
            positions[posIdx + 2] = z;
            v2.set(contourDistance / sheetSize.x, shapeDistance / sheetSize.y);
            v2.rotateAround(v20, grainDirection);
            v2.add(grainOffset);
            /*
            v2r1.copy( v2 );
            v2r2.copy( v2 );
            // v2r1.rotateAround( v20, 0 );// Math.atan( ( xc1 - xc0 ) / ( yc1 - yc0 ) ) );
            // v2r2.rotateAround( v20, 0 );// Math.atan( ( xc2 - xc1 ) / ( yc2 - yc1 ) ) );
            const prev = !( yc1 === yc0 );
            const next = !( yc2 === yc1 );*/
            uvs[vIdx * 2] = v2.x; /* prev ? v2r1.x : v2.x;  */
            uvs[vIdx * 2 + 1] = v2.y; /* prev ? v2r1.y : v2.y;  */
            positions[3 * rs1 * hs1 + posIdx] = x;
            positions[3 * rs1 * hs1 + posIdx + 1] = y;
            positions[3 * rs1 * hs1 + posIdx + 2] = z;
            uvs[2 * rs1 * hs1 + vIdx * 2] = v2.x; /* next ? v2r2.x : v2.x;  */
            uvs[2 * rs1 * hs1 + vIdx * 2 + 1] = v2.y; /* next ? v2r2.y : v2.y;  */
            positions[6 * rs1 * hs1 + posIdx] = x;
            positions[6 * rs1 * hs1 + posIdx + 1] = y;
            positions[6 * rs1 * hs1 + posIdx + 2] = z;
            uvs[4 * rs1 * hs1 + vIdx * 2] = v2.x; /* next ? v2r2.x : v2.x; */
            uvs[4 * rs1 * hs1 + vIdx * 2 + 1] = v2.y; /* next ? v2r2.y : v2.y; */
            positions[9 * rs1 * hs1 + posIdx] = x;
            positions[9 * rs1 * hs1 + posIdx + 1] = y;
            positions[9 * rs1 * hs1 + posIdx + 2] = z;
            uvs[6 * rs1 * hs1 + vIdx * 2] = v2.x; /* prev ? v2r1.x : v2.x; */
            uvs[6 * rs1 * hs1 + vIdx * 2 + 1] = v2.y; /* prev ? v2r1.y : v2.y; */
            positions[12 * rs1 * hs1 + posIdx] = x;
            positions[12 * rs1 * hs1 + posIdx + 1] = y;
            positions[12 * rs1 * hs1 + posIdx + 2] = z;
            uvs[8 * rs1 * hs1 + vIdx * 2] = v2.x; /* prev ? v2r1.x : v2.x; */
            uvs[8 * rs1 * hs1 + vIdx * 2 + 1] = v2.y; /* prev ? v2r1.y : v2.y;*/
            positions[15 * rs1 * hs1 + posIdx] = x;
            positions[15 * rs1 * hs1 + posIdx + 1] = y;
            positions[15 * rs1 * hs1 + posIdx + 2] = z;
            uvs[10 * rs1 * hs1 + vIdx * 2] = v2.x; /* next ? v2r2.x : v2.x; */
            uvs[10 * rs1 * hs1 + vIdx * 2 + 1] = v2.y; /* next ? v2r2.y : v2.y; */
            if (!_openEnded) {
                if (i === 0) {
                    positions[18 * rs1 * hs1 + j * 3] = x;
                    positions[18 * rs1 * hs1 + j * 3 + 1] = y;
                    positions[18 * rs1 * hs1 + j * 3 + 2] = z;
                    v2.set(profileShape[j].x / sheetSize.x, profileShape[j].y / sheetSize.y);
                    v2.rotateAround(v20, grainDirection);
                    v2.add(grainOffset);
                    uvs[12 * rs1 * hs1 + j * 2] = v2.x; /* v2.x + Math.random() * 0.01;*/
                    uvs[12 * rs1 * hs1 + j * 2 + 1] = v2.y; /* v2.y + Math.random() * 0.01;*/
                }
                if (i === hs) {
                    positions[18 * rs1 * hs1 + 3 * rs1 + j * 3] = x;
                    positions[18 * rs1 * hs1 + 3 * rs1 + j * 3 + 1] = y;
                    positions[18 * rs1 * hs1 + 3 * rs1 + j * 3 + 2] = z;
                    v2.set(profileShape[j].x / sheetSize.x, profileShape[j].y / sheetSize.y);
                    v2.rotateAround(v20, grainDirection);
                    v2.add(grainOffset);
                    uvs[12 * rs1 * hs1 + 2 * rs1 + j * 2] = v2.x; /* v2.x + Math.random() * 0.01; */
                    uvs[12 * rs1 * hs1 + 2 * rs1 + j * 2 + 1] = v2.y; /* v2.y + Math.random() * 0.01; */
                }
            }
        }
    }
    g.computeVertexNormals();
    return g;
}
// export function MiteredEndGeometry(
//   w,
//   h,
//   d,
//   left,
//   right,
//   top,
//   bottom,
//   grainDirection,
//   textureLength = defaultTextureSize,
//   textureWidth = defaultTextureSize
// ) {
//   const sheetSize = new Vector2(
//     grainDirection === 90 ? textureLength : textureWidth,
//     grainDirection === 90 ? textureWidth : textureLength
//   );
//   let g = new BufferGeometry( );
//   const verticesNumber = 24;
//   const indices = new Uint16Array( [
//     0,
//     1,
//     3,
//     1,
//     2,
//     3,
//     7,
//     6,
//     4,
//     6,
//     5,
//     4,
//     11,
//     10,
//     8,
//     10,
//     9,
//     8,
//     12,
//     13,
//     15,
//     13,
//     14,
//     15,
//     16,
//     19,
//     17,
//     19,
//     18,
//     17,
//     20,
//     23,
//     21,
//     23,
//     22,
//     21
//   ] );
//   const positions = new Float32Array( [
//     0,
//     0,
//     0,
//     0,
//     h,
//     0,
//     w,
//     h,
//     0,
//     w,
//     0,
//     0,
//     d * left,
//     d * bottom,
//     d,
//     d * left,
//     h - d * top,
//     d,
//     w - d * right,
//     h - d * top,
//     d,
//     w - d * right,
//     d * bottom,
//     d,
//     0,
//     0,
//     0,
//     0,
//     h,
//     0,
//     d * left,
//     h - d * top,
//     d,
//     d * left,
//     d * bottom,
//     d,
//     w,
//     0,
//     0,
//     w,
//     h,
//     0,
//     w - d * right,
//     h - d * top,
//     d,
//     w - d * right,
//     d * bottom,
//     d,
//     d * left,
//     h - d * top,
//     d,
//     0,
//     h,
//     0,
//     w,
//     h,
//     0,
//     w - d * right,
//     h - d * top,
//     d,
//     0,
//     0,
//     0,
//     d * left,
//     d * bottom,
//     d,
//     w - d * right,
//     d * bottom,
//     d,
//     w,
//     0,
//     0
//   ] );
//   const uvs = new Float32Array( [
//     0,
//     0,
//     0,
//     h,
//     w,
//     h,
//     w,
//     0,
//     d,
//     d,
//     d,
//     h - d,
//     w - d,
//     h - d,
//     w - d,
//     d,
//     0,
//     0,
//     0,
//     h,
//     d,
//     h - d,
//     d,
//     d,
//     0,
//     0,
//     h,
//     0,
//     h - d,
//     d,
//     d,
//     d,
//     0,
//     d,
//     d,
//     0,
//     d,
//     w,
//     0,
//     w - d,
//     0,
//     0,
//     d,
//     d,
//     w - d,
//     d,
//     w,
//     0
//   ] );
//   const v2 = new Vector2();
//   const v20 = new Vector2();
//   for ( let i = 0; i < verticesNumber * 2; i += 2 ) {
//     v2.set( uvs[ i ], uvs[ i + 1 ] );
//     v2.rotateAround( v20, grainDirection + Math.PI / 2 );
//     uvs[ i ] = v2.x / sheetSize.x;
//     uvs[ i + 1 ] = v2.y / sheetSize.y;
//   }
//   g.setIndex( new BufferAttribute( indices, 1 ) );
//   g.setAttribute( 'position', new BufferAttribute( positions, 3 ) );
//   g.setAttribute( 'uv', new BufferAttribute( uvs, 2 ) );
//   g.computeVertexNormals();
//   return g;
// }
// function getCurvePoints( curve: Curve<Vector2> ) {
//   return curve.type === 'LineCurve'
//     ? [( curve as LineCurve ).v1, ( curve as LineCurve ).v2]
//     : curve.getSpacedPoints( 100 );
// }
// export function curvesIntersection(
//   curve1: Curve<Vector2>,
//   curve1Thickness: number,
//   curve2: Curve<Vector2>,
//   curve2Thickness: number ): Vector2 {
//   const zeroVector = new Vector2();
//   const curve1Points = getCurvePoints( curve1 );
//   const curve2Points = getCurvePoints( curve2 );
//   let intersection = undefined as Vector2 | undefined;
//   for ( let i = curve1Points.length - 1; i >= 0; i -= 1 ) {
//     for ( let j = 0; j < curve2Points.length; j += 1 ) {
//       const iNextIndex = ( i === ( curve1Points.length - 1 ) ) ? 0 : i + 1;
//       const jNextIndex = ( j === ( curve2Points.length - 1 ) ) ? 0 : j + 1;
//       const displacement1 = curve1Thickness ? ( ( curve1Points[ iNextIndex ].clone().sub( curve1Points[ i ].clone() ) )
//         .rotateAround( new Vector2(), Math.PI / 2 )
//         .setLength( curve1Thickness ) ) : new Vector2();
//       const displacement2 = curve2Thickness ? ( curve2Points[ jNextIndex ].clone().sub( curve2Points[ j ].clone() )
//         .rotateAround( new Vector2(), Math.PI / 2 )
//         .setLength( curve2Thickness ) ) : new Vector2();
//       const v1 = curve1Points[ i ]
//         .clone()
//         .add( displacement1 );
//       const v2 = curve1Points[ iNextIndex ].clone()
//         .add( displacement1 );
//       // when one segment has edgebanding, but another one - doe not, we need to
//       //  increase the length of segment with edgebanding to find correct intersection
//       if ( displacement1.equals( zeroVector ) && !displacement2.equals( zeroVector ) ) {
//         v2.copy( ( ( v2.clone().sub( v1.clone() ) )
//           .setLength( 1e6 ) )
//           .add( v1.clone() ) );
//         v1.copy( ( ( v1.clone().sub( v2.clone() ) )
//           .setLength( 2e6 ) )
//           .add( v2.clone() ) );
//       }
//       const v3 = curve2Points[ j ].clone()
//         .add( displacement2 );
//       const v4 = curve2Points[ jNextIndex ].clone()
//         .add( displacement2 );
//       if ( displacement2.equals( zeroVector ) && !displacement1.equals( zeroVector ) ) {
//         v4.copy( ( ( v4.clone().sub( v3.clone() ) )
//           .setLength( 1e6 ) )
//           .add( v3.clone() ) );
//         v3.copy( ( ( v3.clone().sub( v4.clone() ) )
//           .setLength( 2e6 ) )
//           .add( v4.clone() ) );
//       }
//       intersection = Utils.lineLineIntersectPoint(
//         { x: Math.round( v1.x * 1e6 ) * 1e-6, y: Math.round( v1.y * 1e6 ) * 1e-6 },
//         { x: Math.round( v2.x * 1e6 ) * 1e-6, y: Math.round( v2.y * 1e6 ) * 1e-6 },
//         { x: Math.round( v3.x * 1e6 ) * 1e-6, y: Math.round( v3.y * 1e6 ) * 1e-6 },
//         { x: Math.round( v4.x * 1e6 ) * 1e-6, y: Math.round( v4.y * 1e6 ) * 1e-6 }
//       );
//       if ( intersection ) {
//         return intersection;
//       }
//     }
//   }
//   return new Vector2();
// }

/**
 * Returns one or more BufferGeometries for a Ceiling2D node.
 *
 * - **Flat** ceiling → exactly one ShapeGeometry, identical to the previous
 *   single-mesh behaviour (preserves UVs / no regression for legacy rooms).
 * - **Cathedral** ceiling → one BufferGeometry per facet (one per profile
 *   segment). Vertices are already in the Ceiling2D group's local frame;
 *   the consuming view keeps the group at identity for cathedral.
 */
const getCeiling2DGeometries = (node, ctx) => {
    if (ctx.type === CeilingType.Flat) {
        return [createGeometry(new ShapeGeometry(getRoomChildShape(node, false)))];
    }
    const out = [];
    for (const facet of ctx.ceilingFacets) {
        const geometry = buildFacetGeometry(facet.polygon);
        if (geometry)
            out.push(geometry);
    }
    return out;
};
/**
 * Triangulates a planar 3D polygon (lying on the cathedral surface) into a
 * BufferGeometry. Triangle winding is chosen so the resulting normals point
 * downward (−Z in floorplan-local), i.e. visible from inside the room.
 *
 * UVs are a planar XY projection so cathedral facets share a continuous
 * texture across the room footprint.
 */
const buildFacetGeometry = (polygon) => {
    if (polygon.length < 3)
        return null;
    // Project the (already planar) polygon onto XY for triangulation. The cathedral
    // surface is single-valued in (x, y) so the XY projection never folds onto itself.
    // Three's ShapeUtils.triangulateShape calls .equals() on the contour points, so
    // they must be Vector2 instances (plain {x, y} bags throw at runtime).
    const xyVerts = polygon.map((p) => new Vector2$1(p.x, p.y));
    // ShapeUtils.area > 0 ⇔ polygon is CCW in XY. Triangulation is done on the
    // CCW form. We reverse the indices afterwards if needed to make the surface
    // normal point downward (−Z).
    const ccw = ShapeUtils.isClockWise(xyVerts) === false;
    const ringForTriangulation = ccw ? xyVerts : xyVerts.slice().reverse();
    const triangles = ShapeUtils.triangulateShape(ringForTriangulation, []);
    if (triangles.length === 0)
        return null;
    const indexMap = ccw ? (i) => i : (i) => polygon.length - 1 - i;
    const positions = new Float32Array(polygon.length * 3);
    for (let i = 0; i < polygon.length; i += 1) {
        positions[i * 3 + 0] = polygon[i].x;
        positions[i * 3 + 1] = polygon[i].y;
        positions[i * 3 + 2] = polygon[i].z;
    }
    // Determine current normal sign by inspecting the first triangle in
    // floorplan-local 3D. Reverse winding if it points up (+Z) so the ceiling
    // shows from inside the room.
    const indexFlat = [];
    for (const tri of triangles) {
        indexFlat.push(indexMap(tri[0]), indexMap(tri[1]), indexMap(tri[2]));
    }
    if (computeFirstTriangleNormalZ(positions, indexFlat) > 0) {
        for (let i = 0; i < indexFlat.length; i += 3) {
            const tmp = indexFlat[i + 1];
            indexFlat[i + 1] = indexFlat[i + 2];
            indexFlat[i + 2] = tmp;
        }
    }
    // Planar XY UVs (texture-units = inches, scaled at the material level).
    const uvs = new Float32Array(polygon.length * 2);
    for (let i = 0; i < polygon.length; i += 1) {
        uvs[i * 2 + 0] = polygon[i].x;
        uvs[i * 2 + 1] = polygon[i].y;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('uv2', new Float32BufferAttribute(uvs.slice(), 2));
    geometry.setIndex(indexFlat);
    geometry.computeVertexNormals();
    return geometry;
};
const _e1 = new Vector3();
const _e2 = new Vector3();
const _normal = new Vector3();
const computeFirstTriangleNormalZ = (positions, indices) => {
    const ai = indices[0] * 3;
    const bi = indices[1] * 3;
    const ci = indices[2] * 3;
    _e1.set(positions[bi] - positions[ai], positions[bi + 1] - positions[ai + 1], positions[bi + 2] - positions[ai + 2]);
    _e2.set(positions[ci] - positions[ai], positions[ci + 1] - positions[ai + 1], positions[ci + 2] - positions[ai + 2]);
    _normal.copy(_e1).cross(_e2);
    return _normal.z;
};

// Returns `undefined` when the modelId is absent from the models3D index (e.g. a
// product referencing a model that failed to sync). Callers must handle the miss
// — the ModelView renders its fallback box in that case.
const getModel3DById = (designer3D, ModelType, modelId) => designer3D.storage.get('models3D').obj[ModelType][modelId];
const emptyModel3D = {
    _id: 'empty-model-3d',
    source: 'https://vesta360.com/web/contentsource/handle.model/608/file_3d/file_name',
    sourceType: 'binary',
    name: 'Empty Model 3D'
};
// Striped stand-in shown (scaled to the node) when a model's source will never
// load — dead link or unindexed modelId. Same asset the legacy vesta app used.
const absentModel3D = {
    _id: 'absent-model-3d',
    source: 'https://vesta360.com/web/contentsource/handle.model/3634/file_3d/file_name',
    sourceType: 'binary',
    name: 'Absent Model 3D'
};

// Returns `undefined` when the node has no usable 3D model (no modelId, or a
// modelId that isn't in the models3D index). The ModelView renders its
// translucent fallback box in that case rather than a placeholder gltf.
const getModelSource = (designer3D, node) => {
    const modelType = node.modelType;
    switch (modelType) {
        case ModelType.applianceModel: {
            const modelId = node.modelId ? node.modelId.get() : undefined;
            return modelId ? getModel3DById(designer3D, modelType, modelId) : undefined;
        }
        case 'hinge':
        case 'drawerSlide':
        case 'drawerSlideUndermount':
        case 'drawerSystem':
        case 'camLock':
        case 'ovvoLock': {
            return emptyModel3D;
        }
        default: {
            const material = getMaterial(designer3D.core, node.id);
            return material.modelId ? getModel3DById(designer3D, modelType, material.modelId) : undefined;
        }
    }
};

/**
 * Returns `true` when `mountNode` is a forbidden drop target for the
 * currently dragged node.
 *
 * Two cases are filtered:
 *
 * 1. Self-parenting — `mountNode` lies inside the dragged node's own subtree
 *    (parent-chain walk would re-enter the dragged node).
 * 2. Reach-in-closet dependent footprint — when the dragged node is an
 *    `Item` with `itemType === reachInCloset` and `roomId !== null`, the
 *    dependent `Room`, its `floor2D` / `ceiling2D` subtrees, and every
 *    `RoomSegment` linked via `room.path` / `room.holes` (including their
 *    `Wall2D → MountPlane / MountLine` subtrees) are blocked.
 *
 * Subscribes the calling effect only to `core.draggedNodeId` while idle.
 * The set + parent walk run only during an active drag, where re-fires are
 * naturally bounded.
 */
const isMountTargetForbidden = (mountNode, core) => {
    const draggedNodeId = core.draggedNodeId.get();
    if (!draggedNodeId)
        return false;
    const forbidden = new Set();
    forbidden.add(draggedNodeId);
    // Reach-in-closet branch — augment the set with the dependent Room and the
    // RoomSegments it references via `path` / `holes`. Segments are linked by
    // UUID (not parented), so a wall MountPlane's parent-chain walk reaches
    // `RoomSegment`, never `Room`; both the room id and every segment id must
    // be in the set to cover floor/ceiling and wall mount surfaces respectively.
    const draggedNode = getNode(core, draggedNodeId);
    if (draggedNode &&
        draggedNode.type === NodeType.Item &&
        draggedNode.itemType.get() === ItemType.reachInCloset &&
        draggedNode.roomId) {
        const roomId = draggedNode.roomId.get();
        if (roomId) {
            forbidden.add(roomId);
            try {
                const room = getRoom(core, roomId);
                const path = room.path.get();
                for (let i = 0; i < path.length; i += 1) {
                    forbidden.add(path[i]);
                }
                const holes = room.holes.get();
                for (let i = 0; i < holes.length; i += 1) {
                    const hole = holes[i];
                    for (let j = 0; j < hole.length; j += 1) {
                        forbidden.add(hole[j]);
                    }
                }
            }
            catch {
                // Dependent Room not currently registered (mid-undo / mid-load).
                // Fall back to roomId-only filtering — correctness for the wall
                // mount targets is preserved by the next re-fire once the Room is
                // back in `core.nodes`.
            }
        }
    }
    // Walk up the mount node's parent chain. Stop on the first ancestor that
    // is either in the forbidden set or no longer registered (Floorplan root
    // stores `parent = ''`).
    let currentId = mountNode.parent.get();
    while (currentId) {
        if (forbidden.has(currentId))
            return true;
        const parent = core.nodes.get(currentId);
        if (!parent)
            return false;
        currentId = parent.parent.get();
    }
    return false;
};

const loader = new ImageBitmapLoader();
async function loadTexture(designer3D, path, flipY = true, colorSpace = SRGBColorSpace) {
    const textures = designer3D.storage.get('textures');
    if (!textures[path]) {
        textures[path] = {
            texture: undefined,
            promise: undefined
        };
    }
    // @ TODO need texture using counter to dispose textures
    // textures[path] = {
    //   texture: undefined,
    //   promise: undefined
    // };
    const storage = textures[path];
    const { promise, texture } = storage;
    if (texture)
        return texture;
    if (promise)
        return promise;
    storage.promise = new Promise((resolve, reject) => {
        // Drop the cached rejected promise so a rebuild can retry — otherwise it
        // poisons this path for the whole session.
        const onError = (error) => {
            storage.promise = undefined;
            getMonitor().warn(`Failed to load texture "${path}"`);
            reject(error);
        };
        loader.setOptions({ imageOrientation: flipY ? 'flipY' : 'from-image' });
        loader.load(path, (imageBitmap) => {
            const texture = new CanvasTexture(imageBitmap);
            if (flipY) {
                texture.wrapS = texture.wrapT = RepeatWrapping;
            }
            texture.colorSpace = colorSpace;
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            storage.texture = texture;
            Reflect.deleteProperty(storage, 'promise');
            resolve(texture);
        }, undefined, onError);
    });
    return storage.promise;
}

const createBasicMaterial = (look, map, aoMap, envMap, category) => {
    // const polygonOffset = false; //look.subCategory1 === 'Extrusions';
    // const sideDouble = false; //['body', 'door', 'finishEnd'].includes(category) || polygonOffset;
    // const side = FrontSide; //sideDouble /*|| look.side === DoubleSide*/ ? DoubleSide : FrontSide;
    const doorsMaterialTransparency = 1.0; /*store.getState().flags.doorsMaterialTransparency;*/
    const transparent = category === 'door' ? doorsMaterialTransparency !== 1 : Boolean(look.transparent /*|| polygonOffset*/);
    const opacity = category === 'door' ? doorsMaterialTransparency : look.opacity === undefined ? 1.0 : look.opacity;
    const mat = new MeshBasicMaterial({
        name: `${look.subCategory1}/${look.subCategory2}/${look.label} (${category})`,
        color: look.color === undefined ? 0xffffff : look.color,
        depthWrite: category !== 'glass' || !transparent,
        map,
        aoMap,
        aoMapIntensity: look.aoMapIntensity,
        side: FrontSide,
        envMap,
        transparent,
        opacity
        // polygonOffset: false
        // polygonOffsetUnits: polygonOffset ? -0.4 : 0,
        // polygonOffsetFactor: polygonOffset ? -0.8 : 0
    });
    return mat;
};

/**
 * Physical floors applied to the catalog's PBR scalars.
 *
 * The look data is authored as flat colour swatches, not as render parameters:
 * 1271 of 1275 entries carry `reflectivity: 0.0`, and 106 carry `roughness: 0.0`.
 * Both are outside the range any real surface occupies, and both defeat the
 * image-based lighting in `AreaDesigner3D.setupEnvironment`.
 *
 * These clamp — they do not override. Any look that specifies a value inside the
 * physical range keeps it verbatim.
 */
/**
 * `MeshPhysicalMaterial.reflectivity` is a facade over `ior`:
 *   `ior = (1 + 0.4 * reflectivity) / (1 - 0.4 * reflectivity)`
 * so `reflectivity: 0` yields `ior = 1.0` and therefore F0 = 0 — a surface with
 * literally no specular lobe and no grazing-angle Fresnel. Every real dielectric
 * (paint, melamine, laminate, wood, stone) sits at F0 ≈ 0.04, which is three's
 * own default of `0.5` (⇒ ior 1.5). Below this floor the scene environment can
 * only ever reach a surface through the diffuse term, which is what made every
 * panel read as flat cardboard regardless of how good the environment was.
 */
const MIN_REFLECTIVITY = 0.5;
/**
 * A perfect mirror (`roughness: 0`) reflects the environment at full sharpness,
 * so as the camera orbits, the reflection vector sweeps the environment's bright
 * key lobe across the face and flashes it — the "blinking" the environment code
 * documents. 0.15 is roughly where polished melamine and gloss lacquer actually
 * sit; it keeps a crisp, readable highlight while spreading it over enough solid
 * angle that camera motion reads as a glide rather than a flash.
 */
const MIN_ROUGHNESS = 0.15;
const createPhysicalMaterial = (look, map, normalMap, roughnessMap, aoMap, envMap, category) => {
    // const polygonOffset = look.subCategory1 === 'Extrusions';
    // const sideDouble = ['body', 'door', 'finishEnd'].includes(category) || polygonOffset;
    // const sideBack = ['ceiling'].includes(category);
    const side = FrontSide;
    const doorsMaterialTransparency = 1.0; /*store.getState().flags.doorsMaterialTransparency;*/
    const transparent = category === 'door' ? true : Boolean(look.transparent /*|| polygonOffset*/);
    const opacity = category === 'door' ? doorsMaterialTransparency : look.opacity === undefined ? 1.0 : look.opacity;
    const mat = new MeshPhysicalMaterial({
        name: `${look.subCategory1}/${look.subCategory2}/${look.label} (${category})`,
        color: look.color === undefined ? 0xffffff : look.color,
        depthWrite: category !== 'glass' || !transparent,
        map,
        normalMap,
        roughnessMap,
        metalnessMap: roughnessMap,
        aoMap,
        aoMapIntensity: category === 'wall' ? 0.5 : 0,
        // ['body', 'door', 'finishEnd'].includes(category)
        // ? 0 * store.getState().flags.cabinetsShadowsIntensity
        // : 0,
        envMap,
        // Only consulted when this material has its OWN `envMap`. Ours is null — the
        // scene environment is used instead, scaled by `scene.environmentIntensity`
        // (see AreaDesigner3D.setupEnvironment). Kept at parity with that value so
        // passing a real `envMap` here later doesn't silently drop the IBL 20×.
        envMapIntensity: 1.0,
        side,
        roughness: MathUtils.clamp(look.roughness === undefined ? 1 : look.roughness, MIN_ROUGHNESS, 1),
        metalness: look.metalness === undefined ? 0 : look.metalness,
        transparent,
        transmission: look.transparency === undefined ? 0.0 : look.transparency,
        opacity,
        reflectivity: Math.max(look.reflectivity === undefined ? 0.5 : look.reflectivity, MIN_REFLECTIVITY),
        clearcoat: look.clearcoat === undefined ? 0.0 : look.clearcoat
        // polygonOffset: false
        // polygonOffsetUnits: polygonOffset ? -0.4 : 0,
        // polygonOffsetFactor: polygonOffset ? -0.8 : 0
    });
    return mat;
};

// Falls back to the service unknown/particleBoard look on a missing bucket or lookId.
const resolveLook = (designer3D, materialId, category) => {
    const { core, storage } = designer3D;
    const looks = storage.get('looks').obj;
    const serviceLook = looks.service?.[materialId === 'particleBoard' ? 'particleBoard' : 'unknown'];
    const storageMaterial = core.storage.get('materials').obj[category]?.[materialId];
    return (storageMaterial?.lookId ? looks[category]?.[storageMaterial.lookId] : undefined) ?? serviceLook;
};
// A ready-made service material serves every category; built ones are per category.
const peekBuiltMaterial = (look, category) => look.material ?? look.materials?.get(category);
/** Sync cache peek: lets callers decide whether to flash the loading stand-in. */
const peekLookMaterial = (designer3D, materialId, category) => {
    const look = resolveLook(designer3D, materialId, category);
    return look && peekBuiltMaterial(look, category);
};
// Used only if the service bucket itself is gone.
const lastResortMaterial = new MeshBasicMaterial({ side: FrontSide, color: 0x8a8a8a });
const getStandInLookMaterial = (designer3D, kind) => {
    const lookId = kind === 'loading' ? 'materialLoading' : 'materialAbsent';
    return designer3D.storage.get('looks').obj.service?.[lookId]?.material ?? lastResortMaterial;
};
const buildLookMaterial = (designer3D, look, category) => {
    const built = peekBuiltMaterial(look, category);
    if (built)
        return Promise.resolve(built);
    const pending = look.promises?.get(category);
    if (pending)
        return pending;
    const f = async () => {
        const keys = ['map', 'normalMap', 'roughnessMap', 'aoMap'].filter((prop) => look[prop]);
        // Only `map` is sRGB; the linear maps must not be sRGB-decoded.
        const textures = await Promise.all(keys.map((prop) => loadTexture(designer3D, look[prop], true, prop === 'map' ? SRGBColorSpace : NoColorSpace)));
        return look.type === 'basic'
            ? createBasicMaterial(look, textures[keys.indexOf('map')] || null, textures[keys.indexOf('aoMap')] || null, null, category)
            : createPhysicalMaterial(look, textures[keys.indexOf('map')] || null, textures[keys.indexOf('normalMap')] || null, textures[keys.indexOf('roughnessMap')] || null, textures[keys.indexOf('aoMap')] || null, null, //core.storage.get('textures').envMap,
            category);
    };
    const promise = f().then((m) => {
        (look.materials ??= new Map()).set(category, m);
        look.promises?.delete(category);
        return m;
    });
    (look.promises ??= new Map()).set(category, promise);
    // Drop the rejected promise so the next run retries; warns once per attempt.
    void promise.catch(() => {
        look.promises?.delete(category);
        getMonitor().warn(`Failed to build material for look "${look._id}" (${category})`);
    });
    return promise;
};
/**
 * Resolves a material's look into a three.js material. Never rejects: falls back
 * real → service `unknown` → plain gray. Does not request a render.
 */
async function loadMaterial(designer3D, 
//@TODO rethink special cases
materialId, category) {
    const { storage } = designer3D;
    const loadAbsentFallback = async () => {
        const unknown = storage.get('looks').obj.service?.unknown;
        if (unknown) {
            try {
                return await buildLookMaterial(designer3D, unknown, category);
            }
            catch {
                // Already warned in buildLookMaterial.
            }
        }
        return getStandInLookMaterial(designer3D, 'absent');
    };
    const look = resolveLook(designer3D, materialId, category);
    if (!look) {
        getMonitor().warn(`No look found for material "${materialId}" (${category})`);
        return loadAbsentFallback();
    }
    return buildLookMaterial(designer3D, look, category).catch(() => loadAbsentFallback());
}

/**
 * Shared body of every `updateMaterialEffect` material swap: flash the loading
 * stand-in for uncached looks, resolve all requests (loadMaterial never
 * rejects), assign, render. A swap that resolves to `prevMaterials` is skipped
 * so routine effect re-runs cost nothing. Returns the effect cleanup.
 */
function updateMeshMaterialsEffect(view, requests, assign, prevMaterials) {
    const cached = requests.map((request) => peekLookMaterial(view, request.materialId, request.category));
    const showedLoading = cached.some((material) => !material);
    if (showedLoading) {
        assign(cached.map((material) => material ?? getStandInLookMaterial(view, 'loading')));
        view.requestRender();
    }
    const controller = new AbortController();
    const signal = controller.signal;
    const f = async () => {
        const materials = await Promise.all(requests.map((request) => loadMaterial(view, request.materialId, request.category)));
        if (signal.aborted)
            return;
        // `showedLoading` means the mesh holds the stand-in, so it must be assigned
        // over even when the result equals prevMaterials.
        if (!showedLoading &&
            materials.length === prevMaterials.length &&
            materials.every((material, i) => material === prevMaterials[i])) {
            return;
        }
        assign(materials);
        // No dispose: every material here is a cached look material or a shared
        // stand-in, still used by other nodes.
        //@TODO refcount look materials so an unreferenced one can be disposed
        view.requestRender();
    };
    f();
    return () => {
        controller.abort();
    };
}

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
const v3 = new Vector3();
const fileLoader = new FileLoader();
const loadModel3D = async ({ core, requestRender, storage }, { _id, source, sourceType }) => {
    const models = storage.get('models');
    if (!models[source]) {
        // Share one size/origin Value between the render cache (source-keyed) and the
        // core `models` store (keyed by modelId / `model3D._id`). The single `.set()`
        // below, after the AABB is measured, then updates both — including any core
        // formula already subscribed via the `size` token fallback (pull handle
        // centering). Reuse a Value the core token may have get-or-created first so
        // the subscription survives regardless of load-vs-evaluate ordering.
        const coreModels = core.storage.get('models');
        const size = coreModels[_id]?.size ?? core.createValue({ x: 1, y: 1, z: 1 });
        const origin = coreModels[_id]?.origin ?? core.createValue({ x: 0, y: 0, z: 0 });
        coreModels[_id] = { size, origin };
        models[source] = {
            model: undefined,
            promise: undefined,
            size,
            origin
        };
    }
    const storageModel = models[source];
    const { model, promise, size, origin } = storageModel;
    if (model) {
        requestRender();
        return model.clone();
    }
    if (promise)
        return promise.then((m) => {
            requestRender();
            return m.clone();
        });
    storageModel.promise = new Promise((resolve, reject) => {
        // Drop the cached (now-rejected) promise so a later re-render can retry the
        // load. Until then the ModelView renders its fallback box. Without this the
        // rejected promise would stay cached and poison every subsequent request.
        const onError = (error) => {
            storageModel.promise = undefined;
            reject(error);
        };
        fileLoader.mimeType = sourceType === 'binary' ? 'model/gltf-binary' : 'model/gltf+json';
        fileLoader.responseType = sourceType === 'binary' ? 'arraybuffer' : '';
        // Pass onError as FileLoader's 4th arg — otherwise a 404 / network failure
        // never settles the promise (leaving the model invisible with no fallback).
        fileLoader.load(source, (data) => {
            gltfLoader.parse(data, '', (gltf) => {
                // `precise` — the default path unions each mesh's *local* AABB transformed
                // by matrixWorld, i.e. the AABB of a rotated AABB, which is strictly larger
                // than the geometry whenever a rotation is baked into the node chain.
                // Sketchfab/FBX-derived assets carry exactly that on their wrapper nodes
                // (the 9-bulb chandelier measures 49% taller than its mesh). Since
                // `updateMaterialEffect` maps this box's min/max onto [0, size], the surplus
                // turns into phantom padding: the model renders undersized and shoved to one
                // end of its own box — a ceiling fixture hangs short of the mount plane.
                // Walking vertices makes the box exact for any origin, rotation, or wrapper
                // scale; it is one O(verts) pass per source, cached below for the session.
                const box = new Box3().setFromObject(gltf.scene, true);
                box.getSize(v3);
                size.set({ x: v3.x, y: v3.y, z: v3.z });
                box.getCenter(v3);
                origin.set({ x: v3.x, y: v3.y, z: v3.z });
                storageModel.model = gltf.scene;
                Reflect.deleteProperty(storage, 'promise');
                resolve(gltf.scene);
            }, onError);
        }, undefined, onError);
    });
    return storageModel.promise;
};

const unregisterModelFallback = (view, nodeView) => {
    if (nodeView.fallbackIndex !== -1) {
        view.instanceManagers.get(MODEL_FALLBACK).unregister(nodeView.fallbackIndex);
        view.instanceManagers.get(MODEL_ABSENT).unregister(nodeView.fallbackIndex);
        nodeView.fallbackIndex = -1;
    }
};

// Radius (inches) of a `MoldingType.rod` cylinder. 0.75" diameter — matches the
// rod cross-section the catalog encodes (e.g. `private/Parts/General/ClosetPole`
// sizes the rod at 19.05 mm). A single round profile for now; promote to a
// catalog-driven `size` if oval/variable-diameter rods are ever needed.
const CLOSET_ROD_RADIUS = 19.05 / 25.4 / 2;
// Edge length (inches) of the cube shown in place of an unscalable 3D model when
// its geometry fails to load. Scalable models use their own `size` instead.
const FALLBACK_MODEL_BOX_SIZE = 5;
const updateParentIdEffect = (nodeView) => {
    const { view } = nodeView;
    const { parent } = getNode(view.core, nodeView.id);
    const parentId = parent.get();
    const group = nodeView.group;
    if (parentId) {
        // Use Map.get instead of getNode/getNodeView so we never throw here.
        // The parent node or its NodeView may not exist yet (e.g. during redo when
        // children are replayed before their parent). The effect will re-run the
        // next time `parent` changes, so attachment is eventually consistent.
        const parentNode = view.core.nodes.get(parentId);
        const parentNodeView = parentNode ? view.nodes.get(parentNode.id) : undefined;
        if (parentNodeView) {
            parentNodeView.group.add(group);
        }
        else if (group.parent) {
            group.parent.remove(group);
        }
    }
    else {
        if (group.parent) {
            group.parent.remove(group);
        }
    }
    return undefined;
};
// Attaches a light's `PointLight`/`SpotLight` object into its own NodeGroup, but
// DEFERS that attach while the subtree the light was created in is being dragged.
// A live light becoming reachable from the scene root forces `WebGPURenderer` to
// recompile every material shader (~150ms freeze); doing so mid-drag stalls the
// gesture. Withholding only the light object (not the group) keeps the group —
// and the item's meshes/children — attached and rendering during the drag; only
// illumination is deferred, and the single recompile lands once at drop.
//
// `deferLightAttach` is set at construction (see PointLightView / SpotLightView):
// only lights born mid-drag defer, so lights created outside a drag never read the
// drag signals here and are never disturbed by an unrelated drag.
const updateLightAttachEffect = (nodeView) => {
    if (nodeView.type !== NodeType.PointLight && nodeView.type !== NodeType.SpotLight)
        return undefined;
    const { group, light, view } = nodeView;
    const { core } = view;
    if (nodeView.deferLightAttach) {
        // Read both signals up front so the subscription set is stable for the whole
        // drag and the effect re-runs the moment either flips back to null.
        const draggedNodeId = core.draggedNodeId.get();
        const draggedCatalogPath = core.draggedCatalogPath.get();
        // Keep deferring while EITHER: a catalog subtree is still instantiating
        // (`draggedNodeId` not published yet — the creation window), OR this light is
        // the dragged root / inside the dragged subtree. The `isSubtreeNode` gate
        // mirrors the multiCloset raycast/render drag-gates above.
        const stillInDrag = draggedCatalogPath !== null ||
            (draggedNodeId !== null && (nodeView.id === draggedNodeId || isSubtreeNode(core, nodeView.id, draggedNodeId)));
        if (stillInDrag) {
            // if (light.parent === group) group.remove(light);
            return undefined;
        }
        // Drag finished — attach from now on and never defer again for this view.
        nodeView.deferLightAttach = false;
    }
    if (light.parent !== group)
        group.add(light); // idempotent — no remove+re-add churn
    return undefined;
};
const m4 = new Matrix4();
// Reused by updateModelFallbackMatrixEffect for the unscalable-cube scale — never
// allocated inside the effect (hot path).
const _scaleM4 = new Matrix4();
const updateInstancedMatrixEffect = (nodeView) => {
    switch (nodeView.type) {
        case NodeType.BoxContainer:
            {
                const node = getNode(nodeView.view.core, nodeView.id);
                const existsVisibility = getExistsRecursively(node);
                // layers are additionally adjusted in appropriate effects like
                // updateItemInstanceMeshRenderLayerEffect, updateItemInstanceMeshRaycastLayerEffect
                m4.fromArray(getMatrixWorld(node, true).elements);
                nodeView.view.instanceManagers
                    .get(NodeType.BoxContainer)
                    .updateMatrixAt(nodeView.index, existsVisibility ? m4 : dummyMatrix);
                // node.core.requestUpdateBundleGroup();
            }
            break;
        case NodeType.FreeBoxContainer:
            {
                const node = getNode(nodeView.view.core, nodeView.id);
                const existsVisibility = getExistsRecursively(node);
                // layers are additionally adjusted in appropriate effects like
                // updateFreeBoxContainerInstanceMeshRenderLayerEffect / ...RaycastLayerEffect
                m4.fromArray(getMatrixWorld(node, true).elements);
                // multiCloset containers live on their own instance mesh (the drag-raycast
                // split), so the matrix must be written to the matching manager — the one
                // the view registered with — not always the plain FreeBoxContainer mesh.
                const isMultiCloset = node.freeBoxContainerType.get() === FreeBoxContainerType.multiCloset;
                nodeView.view.instanceManagers
                    .get(isMultiCloset ? FreeBoxContainerType.multiCloset : NodeType.FreeBoxContainer)
                    .updateMatrixAt(nodeView.index, existsVisibility ? m4 : dummyMatrix);
                // node.core.requestUpdateBundleGroup();
            }
            break;
        case NodeType.Item:
            {
                const node = getItem(nodeView.view.core, nodeView.id);
                const existsVisibility = getExistsRecursively(node);
                m4.fromArray(getMatrixWorld(node, true).elements);
                if (isWallHoleableNode(node)) {
                    // Window/gate openings: write to the dedicated raycast-enabled pool the
                    // view registered with (see ItemView.getInstanceManager / OPENING_ITEM).
                    // The target manager MUST match registration or the instance index would
                    // write into the wrong pool. No multiCloset selected-hides-box case here.
                    nodeView.view.instanceManagers
                        .get(OPENING_ITEM)
                        .updateMatrixAt(nodeView.index, existsVisibility ? m4 : dummyMatrix);
                }
                else if (node.itemType.get() === ItemType.multiCloset) {
                    const selectedNodeId = nodeView.view.core.selectedNodeId.get();
                    const visibility = selectedNodeId !== nodeView.id;
                    // layers are additionally adjusted in appropriate effects like
                    // updateItemInstanceMeshRenderLayerEffect, updateItemInstanceMeshRaycastLayerEffect
                    nodeView.view.instanceManagers
                        .get(ItemType.multiCloset)
                        .updateMatrixAt(nodeView.index, existsVisibility && visibility ? m4 : dummyMatrix);
                    // node.core.requestUpdateBundleGroup();
                }
                else {
                    // layers are additionally adjusted in appropriate effects like
                    // updateItemInstanceMeshRenderLayerEffect, updateItemInstanceMeshRaycastLayerEffect
                    nodeView.view.instanceManagers
                        .get(NodeType.Item)
                        .updateMatrixAt(nodeView.index, existsVisibility ? m4 : dummyMatrix);
                    // node.core.requestUpdateBundleGroup();
                }
            }
            break;
        case NodeType.Part:
            {
                const node = getPart(nodeView.view.core, nodeView.id);
                if (node.partType.get() === PartType.multiClosetSection) {
                    const existsVisibility = getExistsRecursively(node);
                    // const draggedNodeId = nodeView.view.core.draggedNodeId.get();
                    // const draggedNode = draggedNodeId ? getNode(nodeView.view.core, draggedNodeId) : null;
                    const visibility = true;
                    // !draggedNodeId ||
                    // (draggedNodeId &&
                    //   draggedNode &&
                    //   draggedNode.type === NodeType.Part &&
                    //   draggedNode.partType.get() === PartType.multiClosetSectionContent);
                    // layers are additionally adjusted in appropriate effects like
                    // updateItemInstanceMeshRenderLayerEffect, updateItemInstanceMeshRaycastLayerEffect
                    m4.fromArray(getMatrixWorld(node, true).elements);
                    nodeView.view.instanceManagers
                        .get(PartType.multiClosetSection)
                        .updateMatrixAt(nodeView.index, existsVisibility && visibility ? m4 : dummyMatrix);
                    // node.core.requestUpdateBundleGroup();
                }
                else if (node.partType.get() === PartType.multiClosetSectionContent) {
                    getExistsRecursively(node);
                    m4.fromArray(getMatrixWorld(node, true).elements);
                    nodeView.view.instanceManagers
                        .get(PartType.multiClosetSectionContent)
                        .updateMatrixAt(nodeView.index, dummyMatrix);
                }
            }
            break;
        default:
            getMonitor().warn('updateInstancedMatrixEffect: unknown node type', nodeView.type);
    }
};
// Per-node fallback box used ONLY for the currently-selected model. A single
// InstancedMesh instance can't be outlined (OutlineNode would highlight the whole
// pool), so the selected box is rendered as a real Mesh inside `model3D` where the
// group-based OutlinePass (see changeSelectedObjectEffect) can pick it up. Keyed by
// WeakMap so it releases with the NodeView; GPU teardown happens when `model3D` is
// cleared/disposed (clearGroup → disposeMesh) — the mesh's material is a CLONE of
// the shared `service.loading`, so disposing it never touches the shared instance.
const modelFallbackOutlineMeshes = new WeakMap();
// Box edge lengths (inches): the model's `size` when scalable, else a uniform cube.
const modelFallbackBoxDims = (node) => {
    const isScalableValue = node.isScalable ? node.isScalable.get() : undefined;
    const scalable = (isScalableValue === true || isScalableValue === 'x') && !!node.size;
    if (scalable && node.size) {
        return [node.size.x.get(), node.size.y.get(), node.size.z.get()];
    }
    return [FALLBACK_MODEL_BOX_SIZE, FALLBACK_MODEL_BOX_SIZE, FALLBACK_MODEL_BOX_SIZE];
};
const removeModelFallbackOutlineMesh = (nodeView) => {
    const mesh = modelFallbackOutlineMeshes.get(nodeView);
    if (!mesh)
        return;
    mesh.removeFromParent();
    mesh.geometry.dispose();
    mesh.material.dispose();
    modelFallbackOutlineMeshes.delete(nodeView);
};
/**
 * Drives the translucent-blue fallback / loading-placeholder box for a Model,
 * gated by `nodeView.showFallbackBox` (set by updateMaterialEffect: true while the
 * GLTF loads and for missing/failed models, false once it loads). Scaled to the
 * model's `size` when scalable, else a uniform FALLBACK_MODEL_BOX_SIZE cube.
 *
 * Two render paths, mutually exclusive so the box never doubles:
 *  - NOT selected → the shared MODEL_FALLBACK instance pool (cheap; many at once
 *    on scene load). Slot registered lazily so hardware/loaded models never grow it.
 *  - selected → a per-node Mesh in `model3D` so the group-based OutlinePass can
 *    outline THIS box (a single pool instance can't be outlined); the instance is
 *    hidden with `dummyMatrix`.
 */
const updateModelFallbackMatrixEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Model)
        return undefined;
    const { view } = nodeView;
    const node = getNode(view.core, nodeView.id);
    const fallbackKind = nodeView.fallbackKind.get();
    const loadingPool = view.instanceManagers.get(MODEL_FALLBACK);
    const absentPool = view.instanceManagers.get(MODEL_ABSENT);
    const show = nodeView.showFallbackBox.get() && getExistsRecursively(node);
    // A click on a model selects its top-level Item (getSelectableNode never returns
    // a Model), and the outline is applied to that Item's group. So switch to the
    // per-node box whenever this model sits inside the current selection's subtree
    // (or is itself selected) — that box lives in model3D under the item group, so
    // the group-based OutlinePass highlights it. Everything else stays instanced.
    const selectedNodeId = view.core.selectedNodeId.get();
    const withinSelection = !!selectedNodeId && (selectedNodeId === nodeView.id || isSubtreeNode(view.core, nodeView.id, selectedNodeId));
    const usePerNode = show && withinSelection;
    // ── per-node outline box (selected only) ──
    if (usePerNode) {
        const [boxX, boxY, boxZ] = modelFallbackBoxDims(node);
        let mesh = modelFallbackOutlineMeshes.get(nodeView);
        // Recreate if a previous clearGroup(model3D) (load / keepFallback) disposed it.
        if (mesh && !mesh.parent) {
            modelFallbackOutlineMeshes.delete(nodeView);
            mesh = undefined;
        }
        if (!mesh) {
            const material = view.storage.get('looks').obj.service[fallbackKind].material.clone();
            mesh = new Mesh(new BoxGeometry(1, 1, 1), material);
            modelFallbackOutlineMeshes.set(nodeView, mesh);
            nodeView.model3D.add(mesh);
        }
        // The kind can flip while selected — mirror its look without recreating the mesh.
        const kindMaterial = view.storage.get('looks').obj.service[fallbackKind].material;
        const meshMaterial = mesh.material;
        meshMaterial.color.copy(kindMaterial.color);
        meshMaterial.opacity = kindMaterial.opacity;
        // Unit box centered at origin → occupy [0, size] (min corner at model3D origin,
        // matching the loaded-model + instanced-box convention).
        mesh.scale.set(boxX, boxY, boxZ);
        mesh.position.set(boxX / 2, boxY / 2, boxZ / 2);
        // Give the freshly-added mesh its render/raycast layers immediately.
        updateRenderLayerEffect(nodeView);
        updateRaycastLayerEffect(nodeView);
    }
    else {
        removeModelFallbackOutlineMesh(nodeView);
    }
    // ── shared instance boxes (fallback, not within the current selection) ──
    // One lazy slot index MIRRORED across both pools; the active kind's pool gets
    // the world matrix, the other one dummyMatrix — that is how the box switches
    // blue↔gray.
    const useInstance = show && !withinSelection;
    const useLoading = useInstance && fallbackKind === 'loading';
    const useAbsent = useInstance && fallbackKind === 'absent';
    if (useInstance && nodeView.fallbackIndex === -1) {
        // Registered/unregistered strictly in pairs, so both pools yield the same index.
        nodeView.fallbackIndex = loadingPool.register(nodeView); // lazy: only real need claims a slot
        const mirrored = absentPool.register(nodeView);
        if (mirrored !== nodeView.fallbackIndex) {
            getMonitor().error('Model stand-in pools diverged', null, { mirrored, fallbackIndex: nodeView.fallbackIndex });
        }
    }
    if (useInstance) {
        const { isScalable, size } = node;
        const isScalableValue = isScalable ? isScalable.get() : undefined;
        const scalable = (isScalableValue === true || isScalableValue === 'x') && !!size;
        // Bridge designer-core's Matrix4 → three's via `.elements` (same pattern as
        // updateInstancedMatrixEffect — the two Matrix4 types are structurally distinct).
        if (scalable) {
            // scale=true scales the shared unit [0,1]³ box by node.size.
            m4.fromArray(getMatrixWorld(node, true).elements);
        }
        else {
            // Unscalable cube: world pose at unit scale, then the cube edge in local frame.
            m4.fromArray(getMatrixWorld(node, false).elements);
            m4.multiply(_scaleM4.makeScale(FALLBACK_MODEL_BOX_SIZE, FALLBACK_MODEL_BOX_SIZE, FALLBACK_MODEL_BOX_SIZE));
        }
    }
    if (nodeView.fallbackIndex !== -1) {
        loadingPool.updateMatrixAt(nodeView.fallbackIndex, useLoading ? m4 : dummyMatrix);
        absentPool.updateMatrixAt(nodeView.fallbackIndex, useAbsent ? m4 : dummyMatrix);
    }
    view.requestRender();
    return undefined;
};
const updateMultiClosetShelfPartRaycastEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Part || !nodeView.raycastMesh) {
        return undefined;
    }
    const node = getPart(nodeView.view.core, nodeView.id);
    const draggedNodeId = node.core.draggedNodeId.get();
    const draggedCatalogPath = node.core.draggedCatalogPath.get();
    const selectable = getExistsRecursively(node) && !draggedNodeId && !draggedCatalogPath;
    if (selectable) {
        nodeView.raycastMesh.layers.enable(LAYERS.RAYCAST);
    }
    else {
        nodeView.raycastMesh.layers.disable(LAYERS.RAYCAST);
    }
    nodeView.view.requestRender();
    return undefined;
};
const updateMultiClosetShelfPartSizeEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Part || !nodeView.raycastMesh) {
        return undefined;
    }
    const node = getPart(nodeView.view.core, nodeView.id);
    nodeView.raycastMesh.scale.set(node.size.x.get(), node.size.y.get(), node.size.z.get());
    return undefined;
};
const updateMultiClosetShelfPartRenderEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Part || !nodeView.raycastMesh) {
        return undefined;
    }
    const node = getPart(nodeView.view.core, nodeView.id);
    const draggedNodeId = node.core.draggedNodeId.get();
    const selectable = getExistsRecursively(node) && (!draggedNodeId || !isSubtreeNode(node.core, node.id, draggedNodeId));
    if (selectable) {
        nodeView.raycastMesh.layers.enable(LAYERS.RENDER);
    }
    else {
        nodeView.raycastMesh.layers.disable(LAYERS.RENDER);
    }
    nodeView.view.requestRender();
    return undefined;
};
/**
 * Per-NodeView memory of the `draggedNodeId` value observed on the previous
 * run, used to identify which closet's drag just ended (see effect below).
 * `WeakMap` so entries are released when the NodeView is GC'd.
 */
const lastDraggedNodeIdByView = new WeakMap();
/**
 * Keeps the four neighbor properties on every multiCloset Item in sync with the
 * live scene: `Left/RightMultiClosetNeighborId` (the side neighbor found by the
 * lateral probe) and `Left/RightJointMultiClosetNeighborId` (the reverse link
 * written onto a neighbor when the connection is side-to-front).
 *
 * Connection classification (per side S of closet A, probe finds neighbor B):
 *  - side-to-side: B's opposite-side probe finds A back (reciprocal). B records
 *    A via its OWN side property during its own pass — no joint is written.
 *  - side-to-front: reciprocity fails (A's side abuts B's front face, so B's
 *    lateral probe never reaches A). A writes `B.{S}JointMultiClosetNeighborId =
 *    A` so both ends know each other, under different property names.
 *
 * Each sweep recomputes all four properties for EVERY closet from a clean
 * `undefined` baseline, so moving a closet apart clears both side and joint
 * links with no dangling references.
 *
 * Tracked dependencies (so it re-fires on the right changes):
 *  - `core.draggedNodeId` — set to the dragged node during a drag and cleared
 *    to `null` on pointer-up; clearing it is what triggers the drag-end recompute.
 *  - `getMatrixWorld(item, true)` — walks this closet's ancestor pose/size
 *    signals, so nudges, numeric edits and undo/redo also re-fire it.
 *
 * Drag gate: bail whenever ANY drag is in progress (`draggedNodeId !== null`),
 * so we compute neither on drag-start nor per-frame mid-drag — only once on
 * pointer-up. We gate on `draggedNodeId`, NOT `selectedNodeId`, because the
 * handler leaves the dragged node selected after drop (gating on selection
 * would keep the effect closed forever).
 *
 * Single-actor: the `draggedNodeId → null` transition makes EVERY closet's
 * effect dirty, but only ONE of them should do the work. We use the per-view
 * `lastDraggedNodeIdByView` memory to let only the closet that was actually
 * dragged proceed; the others bail (their result is produced by the sweep
 * below). For non-drag moves (`draggedNodeId` stays `null`) only the moved
 * closet's effect re-fires anyway, and it proceeds. This removes the previous
 * `self_plus_affected` double-compute, where a neighbor would re-probe the
 * just-dragged closet a second time.
 *
 * Full sweep: the single actor recomputes BOTH sides of EVERY multiCloset (N is
 * tiny). This is required — not just an optimization shortcut — because the
 * lateral probe is asymmetric: a closet can fail to find a neighbor that, from
 * its own face, finds this one (differing heights/depths shift the probe
 * point). Probing each closet from its own perspective is what guarantees both
 * ends of every relationship converge. Writes are idempotent (a command is only
 * emitted when the stored id actually changes), `addToHistory: false`, and run
 * inside `untracked` so the command reads don't re-subscribe the effect.
 */
const updateMultiClosetNeighborsEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Item)
        return undefined;
    const { view } = nodeView;
    const item = getItem(view.core, nodeView.id);
    if (item.itemType.get() !== ItemType.multiCloset)
        return undefined;
    // ── tracked reads ──
    const draggedNodeId = view.core.draggedNodeId.get();
    const draggedCatalogPath = view.core.draggedCatalogPath.get();
    // Subscribe to this closet's world pose/size (ancestor chain) without using
    // the value — drag-end is not the only trigger (nudge / numeric edit / undo).
    void getMatrixWorld(item, true);
    const previousDraggedNodeId = lastDraggedNodeIdByView.get(nodeView) ?? null;
    lastDraggedNodeIdByView.set(nodeView, draggedNodeId);
    // Drag gate: skip while ANY drag is in progress (drag-start + mid-drag).
    if (draggedNodeId !== null || draggedCatalogPath !== null)
        return undefined;
    // Single-actor: when this fire is the tail of ANOTHER closet's drag, that
    // closet runs the sweep and updates us too — so skip to avoid recomputing
    // every closet once per closet. (A non-drag move has `previousDraggedNodeId
    // === null`, so the moved closet still proceeds.)
    if (previousDraggedNodeId !== null && previousDraggedNodeId !== item.id)
        return undefined;
    runMultiClosetNeighborSweep(view);
    return undefined;
};
/**
 * Re-derive the four neighbor/joint properties for EVERY multiCloset from a
 * clean `undefined` baseline, by probing each closet's left/right faces. Shared
 * by the per-closet pose/drag-end effect (`updateMultiClosetNeighborsEffect`)
 * and the view-level structural effect (`resyncMultiClosetNeighborsOnStructureEffect`,
 * which fires when a closet is added/removed — including undo/redo). Always runs
 * inside `untracked`: it issues idempotent `addToHistory: false` commands, and
 * the probe touches many signals that must not re-subscribe the calling effect.
 */
const runMultiClosetNeighborSweep = (view) => {
    untracked(() => {
        try {
            const multiClosetManager = view.instanceManagers.get(ItemType.multiCloset);
            const managers = [multiClosetManager];
            // Property names keyed by side. `SIDE_PROP[side]` is written on the probing
            // closet (A); `JOINT_PROP` is written on the neighbor (B) and is keyed by
            // B's facing side — the OPPOSITE of A's probing side — so it mirrors the
            // side B would have used for a reciprocal side-to-side link.
            const SIDE_PROP = { left: 'LeftMultiClosetNeighborId', right: 'RightMultiClosetNeighborId' };
            const JOINT_PROP = { left: 'LeftJointMultiClosetNeighborId', right: 'RightJointMultiClosetNeighborId' };
            const OPPOSITE = { left: 'right', right: 'left' };
            const ALL_PROPS = [SIDE_PROP.left, SIDE_PROP.right, JOINT_PROP.left, JOINT_PROP.right];
            // Gather every multiCloset once.
            const closets = [];
            for (const candidate of multiClosetManager.getNodeViews().values()) {
                const node = getOptionalNode(view.core, candidate.id);
                if (!node || node.type !== NodeType.Item)
                    continue;
                const closet = node;
                if (closet.itemType.get() === ItemType.multiCloset)
                    closets.push(closet);
            }
            // Desired final state: all four props reset to `undefined`, then re-derived.
            const desired = new Map();
            for (const closet of closets)
                desired.set(closet.id, {});
            // Pass 1: probe every closet on both sides once, recording only the
            // side-neighbor ids. Each closet/side is probed exactly once here, so the
            // classification below needs no further geometric queries.
            for (const a of closets) {
                ['left', 'right'].forEach((side) => {
                    const neighborId = calculateNeighborId(a, side, managers);
                    if (neighborId)
                        desired.get(a.id)[SIDE_PROP[side]] = neighborId;
                });
            }
            // Pass 2: classify from the side-neighbor symmetry already in `desired`.
            // A and its `side`-neighbor B are side-to-side iff B's OPPOSITE side points
            // back at A (A.right ↔ B.left) — equivalent to the old reciprocity probe but
            // reusing pass-1 results. When that mutual pairing is absent the join is
            // side-to-front: record the reverse link on B under the joint name on B's
            // facing side (OPPOSITE[side]): A's left neighbor → B's right joint.
            for (const a of closets) {
                ['left', 'right'].forEach((side) => {
                    const neighborId = desired.get(a.id)[SIDE_PROP[side]];
                    if (!neighborId)
                        return;
                    const neighborOppositeId = desired.get(neighborId)?.[SIDE_PROP[OPPOSITE[side]]];
                    const isSideToSide = neighborOppositeId === a.id;
                    if (!isSideToSide) {
                        desired.get(neighborId)[JOINT_PROP[OPPOSITE[side]]] = a.id;
                    }
                });
            }
            // Diff against current state — idempotent, one command per actual change.
            const commands = [];
            for (const closet of closets) {
                const target = desired.get(closet.id);
                for (const property of ALL_PROPS) {
                    // Stored in the product `properties` map (not a bespoke field) so
                    // `productProperty` formula tokens can read it. Empty = `undefined`.
                    const value = closet.properties.get(property);
                    if (!value)
                        continue;
                    const next = target[property];
                    if (value.get() === next)
                        continue;
                    commands.push(new SetValueCommand(value, next));
                }
            }
            if (commands.length > 0) {
                view.core.runCommandsAsTransaction(commands, 'updateMultiClosetNeighborsEffect', false);
            }
        }
        catch (error) {
            getMonitor().error('runMultiClosetNeighborSweep', error instanceof Error ? error : null);
        }
    });
};
const updateMeshRenderLayerEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    if (node.core.projectSettings.coreMode === CoreMode.mobile) {
        const step = node.core.projectSettings.mobileSettings.step.get();
        switch (nodeView.type) {
            case NodeType.MountPlane:
            case NodeType.MountPoint:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRenderLayerEffect for MountPlane or MountPoint`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    const stepVisibility = [MobileStep.Architecture, MobileStep.Systems, MobileStep.Catalog].includes(step);
                    let modeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    modeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        modeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existsVisibility && modeVisibility && stepVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RENDER);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RENDER);
                    }
                }
                break;
            case NodeType.MountLine:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRenderLayerEffect for MountLine`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = ![GeneralViewMode.editor3D, GeneralViewMode.editor2D].includes(node.core.generalViewMode.get());
                    let mountTypeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    mountTypeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        mountTypeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // Line2 extends Mesh, .layers works the same way
                    if (existsVisibility && modeVisibility && mountTypeVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RENDER);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RENDER);
                    }
                }
                break;
            // case NodeType.BoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.FreeBoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.Item: Handled by updateInstancedMatrixEffect
            case NodeType.Wall2D:
            case NodeType.Floor2D:
            case NodeType.Tiles:
            case NodeType.AdjustableBox:
            case NodeType.AdjustableExtrusion:
            case NodeType.Countertop:
            case NodeType.CrownMolding:
            case NodeType.Edgebanding:
            case NodeType.Frame:
            case NodeType.GateFrame:
            case NodeType.Glass:
            case NodeType.Image:
            case NodeType.LaminateBox:
            case NodeType.MiteredPanel:
            case NodeType.Molding:
            case NodeType.Panel:
            case NodeType.RawPanel:
            case NodeType.ToeKickPanel:
            case NodeType.Valance:
            case NodeType.WindowFrame:
                const existsVisibility = getExistsRecursively(node);
                const modeVisibility = true;
                if (existsVisibility && modeVisibility) {
                    nodeView.mesh.layers.enable(LAYERS.RENDER);
                }
                else {
                    nodeView.mesh.layers.disable(LAYERS.RENDER);
                }
                break;
            case NodeType.PointLight:
            case NodeType.SpotLight:
                break;
            case NodeType.Model:
                {
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = true;
                    if (existsVisibility && modeVisibility) {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.enable(LAYERS.RENDER);
                            }
                        });
                        // Mirror onto the BW contour clones (LAYERS.BW): a model's outline must
                        // appear in the createView capture exactly when its white faces do.
                        nodeView.bwModel3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.enable(LAYERS.BW);
                            }
                        });
                    }
                    else {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.disable(LAYERS.RENDER);
                            }
                        });
                        nodeView.bwModel3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.disable(LAYERS.BW);
                            }
                        });
                    }
                }
                break;
        }
    }
    else {
        switch (nodeView.type) {
            case NodeType.MountPlane:
            case NodeType.MountPoint:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRenderLayerEffect for MountPlane or MountPoint`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    let modeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    modeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        modeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existsVisibility && modeVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RENDER);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RENDER);
                    }
                }
                break;
            case NodeType.MountLine:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRenderLayerEffect for MountLine`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = ![GeneralViewMode.editor3D, GeneralViewMode.editor2D].includes(node.core.generalViewMode.get());
                    let mountTypeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    mountTypeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        mountTypeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // Line2 extends Mesh, .layers works the same way
                    if (existsVisibility && modeVisibility && mountTypeVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RENDER);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RENDER);
                    }
                }
                break;
            // case NodeType.BoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.FreeBoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.Item: Handled by updateInstancedMatrixEffect
            case NodeType.Wall2D:
            case NodeType.Floor2D:
            case NodeType.Tiles:
            case NodeType.AdjustableBox:
            case NodeType.AdjustableExtrusion:
            case NodeType.Countertop:
            case NodeType.CrownMolding:
            case NodeType.Edgebanding:
            case NodeType.Frame:
            case NodeType.GateFrame:
            case NodeType.Glass:
            case NodeType.Image:
            case NodeType.LaminateBox:
            case NodeType.MiteredPanel:
            case NodeType.Molding:
            case NodeType.Panel:
            case NodeType.RawPanel:
            case NodeType.ToeKickPanel:
            case NodeType.Valance:
            case NodeType.WindowFrame:
                const existsVisibility = getExistsRecursively(node);
                const modeVisibility = true;
                if (existsVisibility && modeVisibility) {
                    nodeView.mesh.layers.enable(LAYERS.RENDER);
                }
                else {
                    nodeView.mesh.layers.disable(LAYERS.RENDER);
                }
                break;
            case NodeType.PointLight:
            case NodeType.SpotLight:
                break;
            case NodeType.Model:
                {
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = true;
                    if (existsVisibility && modeVisibility) {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.enable(LAYERS.RENDER);
                            }
                        });
                        // Mirror onto the BW contour clones (LAYERS.BW): a model's outline must
                        // appear in the createView capture exactly when its white faces do.
                        nodeView.bwModel3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.enable(LAYERS.BW);
                            }
                        });
                    }
                    else {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.disable(LAYERS.RENDER);
                            }
                        });
                        nodeView.bwModel3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.disable(LAYERS.BW);
                            }
                        });
                    }
                }
                break;
        }
    }
    // node.core.requestUpdateBundleGroup();
    return undefined;
};
/**
 * Public render-layer effect: drives the mesh's LAYERS.RENDER membership
 * (see updateMeshRenderLayerEffect) and then mirrors that visibility onto the
 * node's black-and-white contour line on LAYERS.BW.
 *
 * The contour line must appear in the BW capture (AreaDesigner3D.createView)
 * exactly when the mesh appears in the normal render. By reading the mesh's
 * FINAL LAYERS.RENDER state we inherit all of updateMeshRenderLayerEffect's
 * gating for free (recursive `exists`, view mode, mount-type, forbidden mount
 * targets, …) without re-deriving it — guaranteeing parity. This is orthogonal
 * to the line's `visible` flag, which tracks geometry availability
 * (createContourLine / rebuildContourLine): the renderer draws the line only
 * when it is both on LAYERS.BW and visible.
 */
const updateRenderLayerEffect = (nodeView) => {
    const cleanup = updateMeshRenderLayerEffect(nodeView);
    if ('line' in nodeView && nodeView.line && 'mesh' in nodeView && nodeView.mesh) {
        if (nodeView.mesh.layers.isEnabled(LAYERS.RENDER)) {
            nodeView.line.layers.enable(LAYERS.BW);
        }
        else {
            nodeView.line.layers.disable(LAYERS.BW);
        }
    }
    return cleanup;
};
const updateRaycastLayerEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    if (node.core.projectSettings.coreMode === CoreMode.mobile) {
        const step = node.core.projectSettings.mobileSettings.step.get();
        switch (nodeView.type) {
            case NodeType.MountPlane:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRaycastLayerEffect for MountPlane or MountPoint`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    const stepVisibility = [MobileStep.Architecture, MobileStep.Systems, MobileStep.Catalog].includes(step);
                    let modeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    modeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        modeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existsVisibility && modeVisibility && stepVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.raycastMesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.raycastMesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.MountPoint:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRaycastLayerEffect for MountPlane or MountPoint`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    const stepVisibility = [MobileStep.Architecture, MobileStep.Systems, MobileStep.Catalog].includes(step);
                    let modeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    modeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        modeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existsVisibility && modeVisibility && stepVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.MountLine:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRaycastLayerEffect for MountLine`);
                    }
                    const stepVisibility = [MobileStep.Architecture, MobileStep.Systems, MobileStep.Catalog].includes(step);
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = ![GeneralViewMode.editor3D, GeneralViewMode.editor2D].includes(node.core.generalViewMode.get());
                    let mountTypeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    mountTypeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        mountTypeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // Line2 extends Mesh, raycast layer works the same way
                    if (existsVisibility &&
                        modeVisibility &&
                        mountTypeVisibility &&
                        stepVisibility &&
                        !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.Wall2D:
                {
                    const stepVisibility = step === MobileStep.Floorplan;
                    const modeVisibility = node.core.generalViewMode.get() === GeneralViewMode.editor3D;
                    if (!node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get() &&
                        modeVisibility &&
                        stepVisibility) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.Tiles:
                break;
            case NodeType.PointLight:
            case NodeType.SpotLight:
                break;
            // case NodeType.BoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.FreeBoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.Item: Handled by updateInstancedMatrixEffect
            case NodeType.AdjustableBox:
            case NodeType.AdjustableExtrusion:
            case NodeType.Countertop:
            case NodeType.CrownMolding:
            case NodeType.Edgebanding:
            case NodeType.Frame:
            case NodeType.GateFrame:
            case NodeType.Glass:
            case NodeType.Image:
            case NodeType.LaminateBox:
            case NodeType.MiteredPanel:
            case NodeType.Molding:
            case NodeType.Panel:
            case NodeType.RawPanel:
            case NodeType.ToeKickPanel:
            case NodeType.Valance:
            case NodeType.WindowFrame:
                {
                    const stepVisibility = [
                        MobileStep.Architecture,
                        MobileStep.Systems,
                        MobileStep.Catalog,
                        MobileStep.Present,
                        MobileStep.Estimate,
                        MobileStep.Customize,
                        MobileStep.Accessorize
                    ].includes(step);
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(node.core.generalViewMode.get()) &&
                        !node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get();
                    if (existsVisibility && modeVisibility && stepVisibility) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.Model:
                {
                    const stepVisibility = [
                        MobileStep.Architecture,
                        MobileStep.Systems,
                        MobileStep.Catalog,
                        MobileStep.Present,
                        MobileStep.Estimate,
                        MobileStep.Customize,
                        MobileStep.Accessorize
                    ].includes(step);
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(node.core.generalViewMode.get()) &&
                        !node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get();
                    if (existsVisibility && modeVisibility && stepVisibility) {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.enable(LAYERS.RAYCAST);
                            }
                        });
                    }
                    else {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.disable(LAYERS.RAYCAST);
                            }
                        });
                    }
                }
                break;
            case NodeType.Floor2D:
                {
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = [GeneralViewMode.floorPlan, GeneralViewMode.editor3D].includes(node.core.generalViewMode.get()) &&
                        !node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get();
                    /**/
                    const stepVisibility = step === MobileStep.Floorplan;
                    if (existsVisibility && modeVisibility && stepVisibility) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                        break;
                    }
                }
                break;
        }
    }
    else {
        switch (nodeView.type) {
            case NodeType.MountPlane:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRaycastLayerEffect for MountPlane or MountPoint`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    let modeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    modeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        modeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existsVisibility && modeVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.raycastMesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.raycastMesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.MountPoint:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRaycastLayerEffect for MountPlane or MountPoint`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    let modeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    modeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        modeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existsVisibility && modeVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.MountLine:
                {
                    if (node.type !== nodeView.type) {
                        throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateRaycastLayerEffect for MountLine`);
                    }
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = ![GeneralViewMode.editor3D, GeneralViewMode.editor2D].includes(node.core.generalViewMode.get());
                    let mountTypeVisibility = false;
                    const draggedNodeId = node.core.draggedNodeId.get();
                    if (draggedNodeId) {
                        const draggedNode = getNode(node.core, draggedNodeId);
                        const mountSlotTypes = node.mountSlotTypes.get();
                        const mountTypes = 'mountTypes' in draggedNode ? draggedNode.mountTypes.get() : [];
                        if (mountTypes.length > 0 && mountSlotTypes.length > 0) {
                            for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                if (mountTypes.includes(mountSlotTypes[i])) {
                                    mountTypeVisibility = true;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        const catalogPath = node.core.draggedCatalogPath.get();
                        if (catalogPath) {
                            const catalogConfig = resolveCatalogConfig(node.core, catalogPath);
                            if (!catalogConfig) {
                                return undefined;
                            }
                            const catalogMountTypes = 'mountTypes' in catalogConfig ? catalogConfig.mountTypes : [];
                            if (catalogMountTypes.length > 0) {
                                const mountSlotTypes = node.mountSlotTypes.get();
                                for (let i = 0; i < mountSlotTypes.length; i += 1) {
                                    if (catalogMountTypes.includes(mountSlotTypes[i])) {
                                        mountTypeVisibility = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // Line2 extends Mesh, raycast layer works the same way
                    if (existsVisibility && modeVisibility && mountTypeVisibility && !isMountTargetForbidden(node, node.core)) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.Wall2D:
                {
                    const modeVisibility = node.core.generalViewMode.get() === GeneralViewMode.editor3D;
                    if (!node.core.draggedNodeId.get() && !node.core.draggedCatalogPath.get() && modeVisibility) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.Tiles:
                break;
            case NodeType.PointLight:
            case NodeType.SpotLight:
                break;
            // case NodeType.BoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.FreeBoxContainer: Handled by updateInstancedMatrixEffect
            // case NodeType.Item: Handled by updateInstancedMatrixEffect
            case NodeType.AdjustableBox:
            case NodeType.AdjustableExtrusion:
            case NodeType.Countertop:
            case NodeType.CrownMolding:
            case NodeType.Edgebanding:
            case NodeType.Frame:
            case NodeType.GateFrame:
            case NodeType.Glass:
            case NodeType.Image:
            case NodeType.LaminateBox:
            case NodeType.MiteredPanel:
            case NodeType.Molding:
            case NodeType.Panel:
            case NodeType.RawPanel:
            case NodeType.ToeKickPanel:
            case NodeType.Valance:
            case NodeType.WindowFrame:
                {
                    const existsVisibility = getExistsRecursively(node);
                    const modeVisibility = [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(node.core.generalViewMode.get()) &&
                        !node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get();
                    if (existsVisibility && modeVisibility) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                    }
                }
                break;
            case NodeType.Model:
                {
                    const existsVisibility = getExistsRecursively(node);
                    // Both drag signals — see the mobile branch's Model case for why `draggedNodeId`
                    // alone leaves a catalog drag picking existing models instead of mount surfaces.
                    const modeVisibility = [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(node.core.generalViewMode.get()) &&
                        !node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get();
                    if (existsVisibility && modeVisibility) {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.enable(LAYERS.RAYCAST);
                            }
                        });
                    }
                    else {
                        nodeView.model3D.traverse((child) => {
                            if (child.isMesh) {
                                child.layers.disable(LAYERS.RAYCAST);
                            }
                        });
                    }
                }
                break;
            case NodeType.Floor2D:
                {
                    const existsVisibility = getExistsRecursively(node);
                    // Both drag signals, matching the mobile branch's Floor2D case. `draggedNodeId` alone
                    // leaves the floor pickable through the pre-instantiation window of a catalog drag —
                    // and the floor mesh is COPLANAR with its own MountPlane child (identity pose), so
                    // which of the two the ray reports first is a distance tie broken by scene-traversal
                    // order, not by geometry. A Floor2D hit has no branch in `dragExistingNode`'s switch:
                    // it can only reach `default:` → warn → `return false`, dropping that drag frame.
                    const modeVisibility = [GeneralViewMode.floorPlan, GeneralViewMode.editor3D].includes(node.core.generalViewMode.get()) &&
                        !node.core.draggedNodeId.get() &&
                        !node.core.draggedCatalogPath.get();
                    if (existsVisibility && modeVisibility) {
                        nodeView.mesh.layers.enable(LAYERS.RAYCAST);
                    }
                    else {
                        nodeView.mesh.layers.disable(LAYERS.RAYCAST);
                        break;
                    }
                }
                break;
        }
    }
    return undefined;
};
/**
 * Drives the Ceiling2D group's pose.
 *
 *  - Flat → group sits at (0, 0, wHeight) and is rotated π around X so the
 *    floor footprint (built with un-transformed Y) ends up on the world ceiling
 *    plane with normals facing down. This matches the legacy single-mesh layout.
 *  - Cathedral → vertices already carry the full floorplan-local 3D position
 *    (x, transformedY, height), so the group stays at identity.
 *
 * Re-runs whenever `room.cathedralContext` or `wHeight` changes, which also
 * fixes the latent bug where wHeight tweaks did not move flat ceilings.
 */
const updateCeilingTransformEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Ceiling2D)
        return undefined;
    const node = getNode(nodeView.view.core, nodeView.id);
    if (node.type !== NodeType.Ceiling2D)
        return undefined;
    const room = getNode(node.core, node.parent.get());
    if (room.type !== NodeType.Room)
        return undefined;
    const { position, rotation } = getCeilingLocalTransform(room);
    nodeView.group.position.set(position.x, position.y, position.z);
    nodeView.group.rotation.set(rotation.x, rotation.y, rotation.z);
    nodeView.view.requestRender();
    return undefined;
};
const updatePositionEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    switch (nodeView.type) {
        case NodeType.RoomSegment:
            {
                if (node.type !== nodeView.type) {
                    throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updatePositionEffect for RoomSegment`);
                }
                const { position, rotation } = getRoomSegmentPosition(node);
                nodeView.group.position.copy(position);
                nodeView.group.rotation.set(rotation.x, rotation.y, rotation.z);
                // node.core.requestUpdateBundleGroup();
            }
            break;
        case NodeType.Point:
            {
                if (node.type !== nodeView.type) {
                    throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updatePositionEffect for Point`);
                }
                const { position } = node;
                nodeView.group.position.set(position.x.get(), position.y.getTransformed(), 0);
                // node.core.requestUpdateBundleGroup();
            }
            break;
        default: {
            if (!node[VectorProps.position])
                return undefined;
            const position = node[VectorProps.position];
            nodeView.group.position.set(position.x.get(), position.y.get(), position.z.get());
        }
    }
};
const updateMeshGeometryEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    switch (nodeView.type) {
        case NodeType.MountPlane: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for MountPlane`);
            }
            const prevGeometry = nodeView.mesh.geometry;
            const shape = getMountPlaneShape(node);
            const geometry = node.mountSlotTypes.get().includes(MountType.ceiling) &&
                node.core.generalViewMode.get() === GeneralViewMode.floorPlan
                ? new ExtrudeGeometry(shape, { depth: 1e-5 })
                : new ShapeGeometry(shape);
            geometry.clearGroups();
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.MountLine: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for MountLine`);
            }
            const prevGeometry = nodeView.mesh.geometry;
            let width = getMountLineWidth(node);
            const radius = node.core.projectSettings.roomSettings.wDepth.get() / 4;
            const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(width, 0, 0));
            const geometry = new TubeGeometry(path, 1, radius, 8, false).translate(0, 0, -radius);
            geometry.clearGroups();
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.AdjustableBox: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for AdjustableBox`);
            }
            const { grainDirection, grainScale, size } = node;
            const prevGeometry = nodeView.mesh.geometry;
            const geometry = createGeometryScalable(new BoxGeometry(size.x.get(), size.y.get(), size.z.get()), grainDirection.map((g) => g.get()), undefined, grainScale.get());
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.RawPanel: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for RawPanel`);
            }
            const { shape } = node;
            const prevGeometry = nodeView.mesh.geometry;
            const interpretedShape = shape.get();
            const extrusion = new CustomExtrudeGeometry(createShape(node.core, interpretedShape, shape.getOptions()), {
                depth: node.size.z.get(),
                steps: 1
            });
            extrusion.clearGroups();
            const geometry = createGeometry(extrusion);
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Panel:
        case NodeType.ToeKickPanel:
        case NodeType.GateFrame:
        case NodeType.WindowFrame:
        case NodeType.Countertop: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Panel, ToeKickPanel or Countertop`);
            }
            const { shape, grainDirection, grainOffset, core, id, type, size } = node;
            const prevGeometry = nodeView.mesh.geometry;
            const material = getMaterial(core, id);
            const { sheetLength, sheetWidth } = material;
            const sides = type === NodeType.Panel
                ? String(material.subCategory1) === 'Sheet Stock' && String(material.subCategory2 === 'Melamine')
                    ? 0
                    : 1
                : 1;
            const interpretedShape = shape.get();
            const extrusion = new CustomExtrudeGeometry(createShape(node.core, interpretedShape, shape.getOptions()), {
                depth: size.z.get(),
                steps: 1,
                sides
            });
            extrusion.clearGroups();
            const geometry = createGeometry(extrusion, grainDirection.get(), new Vector2$1(grainOffset?.x.get() ?? 0, grainOffset?.y.get() ?? 0), sheetLength, sheetWidth);
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Floor2D: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Floor2D`);
            }
            const prevGeometry = nodeView.mesh.geometry;
            const shape = getRoomChildShape(node, true);
            const geometry = createGeometry(new ShapeGeometry(shape));
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Ceiling2D: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Ceiling2D`);
            }
            const room = getNode(node.core, node.parent.get());
            if (room.type !== NodeType.Room)
                return undefined;
            // Touch the cathedral context so this effect re-runs whenever it changes
            // (toggling Flat ↔ Cathedral, editing BaseWallPoints, moving Points, etc.).
            const ctx = room.cathedralContext.value;
            const geometries = getCeiling2DGeometries(node, ctx);
            // Reuse the previous material (set by `updateMaterialEffect`) when present
            // — `prevMeshes` is otherwise NOT used to manage lifetime, see the cleanup
            // contract below.
            const prevMaterial = nodeView.meshes[0]?.material;
            const material = prevMaterial ?? nodeView.view.storage.get('looks').obj.service.loading.material;
            const newMeshes = [];
            for (const g of geometries) {
                g.computeBoundsTree();
                const m = new Mesh(g, material);
                newMeshes.push(m);
                nodeView.group.add(m);
            }
            nodeView.meshes = newMeshes;
            // CLEANUP CONTRACT: dispose the meshes ADDED IN THIS RUN, not the ones
            // that were in the group when this run started.
            //
            // Preact runs the *previous* run's cleanup BEFORE the next run's body.
            // If we captured `prevMeshes = nodeView.meshes.slice()` at the top of the
            // body and disposed those in the cleanup, the lifetimes would be off-by-
            // one — Run N's cleanup would dispose the meshes built by Run N−1 that
            // were "previous" entering Run N, which means Run N's *own* meshes (m1)
            // would not be removed from the group until Run N+1 fires. Toggling
            // Flat ↔ Cathedral does not naturally trigger a Run N+1, so the old flat
            // mesh would linger inside the ceiling group, which has just moved to
            // identity (cathedral pose), making it appear at world (0,0,0) —
            // i.e. on the floor next to the room. Editing `BaseWallPoints` later
            // forces another effect run, which finally clears it.
            //
            // By capturing `newMeshes` instead, each run owns the resources it
            // creates: Run N's cleanup removes Run N's meshes when Run N+1 fires (or
            // when the view is disposed). No off-by-one, no ghost meshes.
            return () => {
                for (const m of newMeshes) {
                    nodeView.group.remove(m);
                    m.geometry.disposeBoundsTree?.();
                    m.geometry.dispose();
                }
            };
        }
        case NodeType.Wall2D: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Wall2D`);
            }
            const prevGeometry = nodeView.mesh.geometry;
            const shape = getWall2DShape(node);
            const geometry = createGeometry(new ShapeGeometry(shape));
            geometry.computeBoundsTree();
            nodeView.mesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            // A degenerate wall (zero height — e.g. a room whose WallHeight is set to
            // 0 — or two coincident corners) triangulates to no faces, and an indexed
            // geometry with zero indices still issues a draw call. Same guard as the
            // Stage mesh below; see the note there.
            nodeView.mesh.visible = (geometry.getIndex()?.count ?? 0) > 0;
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Edgebanding: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Edgebanding`);
            }
            const { shape } = node;
            const panel = getParentPanel(node.core, node.id);
            const { shape: contour } = panel;
            const prevGeometry = nodeView.mesh.geometry;
            const interpretedShape = shape.get();
            nodeView.mesh.geometry = ProfiledContourGeometry(createShape(node.core, interpretedShape, shape.getOptions()), createShape(node.core, contour.get(), contour.getOptions()), true, true, true, Math.PI / 2);
            nodeView.mesh.geometry.computeBoundsTree();
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.CrownMolding: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for CrownMolding`);
            }
            const { shape, contour, contourLeft, contourRight, contourLeftRight, grainDirection, grainOffset } = node;
            const prevGeometry = nodeView.mesh.geometry;
            const item = getParentItem(node.core, node.id);
            const leftReturn = (getAttributeValue(item, 'AppliedLeftFinishEnd') || getAttributeValue(item, 'IntegratedLeftFinishEnd')) &&
                getAttributeValue(item, 'TopValanceLeftReturn');
            const rightReturn = (getAttributeValue(item, 'AppliedRightFinishEnd') || getAttributeValue(item, 'IntegratedRightFinishEnd')) &&
                getAttributeValue(item, 'TopValanceRightReturn');
            const interpretedShape = shape.get();
            const contourShape = leftReturn && rightReturn ? contourLeftRight : leftReturn ? contourLeft : rightReturn ? contourRight : contour;
            const interpretedContour = contourShape.get();
            nodeView.mesh.geometry = ProfiledContourGeometry(createShape(node.core, interpretedShape, shape.getOptions()), createShape(node.core, interpretedContour, contourShape.getOptions()), false, false, false, grainDirection ? grainDirection.get() + Math.PI / 2 : Math.PI / 2, new Vector2$1(grainOffset?.x.get() ?? 0, grainOffset?.y.get() ?? 0));
            nodeView.mesh.geometry.computeBoundsTree();
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Valance: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Valance`);
            }
            const { shape, contour, contourLeft, contourRight, contourLeftRight } = node;
            const item = getParentItem(node.core, node.id);
            const leftReturn = (getAttributeValue(item, 'AppliedLeftFinishEnd') || getAttributeValue(item, 'IntegratedLeftFinishEnd')) &&
                getAttributeValue(item, 'TopValanceLeftReturn');
            const rightReturn = (getAttributeValue(item, 'AppliedRightFinishEnd') || getAttributeValue(item, 'IntegratedRightFinishEnd')) &&
                getAttributeValue(item, 'TopValanceRightReturn');
            const prevGeometry = nodeView.mesh.geometry;
            const interpretedShape = shape.get();
            const contourShape = leftReturn && rightReturn ? contourLeftRight : leftReturn ? contourLeft : rightReturn ? contourRight : contour;
            const interpretedContour = contourShape.get();
            nodeView.mesh.geometry = ProfiledContourGeometry(createShape(node.core, interpretedShape, shape.getOptions()), createShape(node.core, interpretedContour, contourShape.getOptions()), false, false, false, Math.PI / 2);
            nodeView.mesh.geometry.computeBoundsTree();
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Stage: {
            const node = getNode(nodeView.view.core, nodeView.id);
            const rooms = node.rooms.get().map((id) => getRoom(node.core, id));
            const roomPaths = rooms.map((room) => room.path.get());
            const wallPaths = getWallsPath(roomPaths.map((path) => offsetPolygon(path.map((id) => {
                const point = getPoint$1(node.core, getRoomSegment(node.core, id).from.get());
                return new Vector2(point.position.x.get(), point.position.y.getTransformed());
            }), -6)));
            const shapes = wallPaths.map((wallPath) => {
                const path = new Shape().moveTo(wallPath[0].x, wallPath[0].y);
                for (let i = 0; i < wallPath.length; i++) {
                    path.lineTo(wallPath[i].x, wallPath[i].y);
                }
                path.closePath();
                return path;
            });
            const prevGeometry = nodeView.mesh.geometry;
            // shape.holes = rooms.map((room) => getShapeFromSegmentsAndHoles(node.core, room.path.get(), []));
            // since we have few shapes now (for separate, not connected rooms), we do not know which hole should be made in which shape
            // but luckily no need to make holes anymore, just position walls mesh behing room floors
            // An empty scene (no rooms yet) yields no wall shapes, and
            // `new ShapeGeometry([], 1)` is still an INDEXED geometry — with zero
            // indices. Three has no draw-range guard for that, so the Stage mesh
            // issues a `drawIndexed(0)` on every frame and WebGPU logs
            // "Draw with an index count of 0 is unusual". Hiding the mesh keeps it
            // out of `projectObject` entirely; the geometry is still rebuilt so the
            // BVH / disposal contract below is unchanged.
            nodeView.mesh.geometry = new ShapeGeometry(shapes, 1);
            nodeView.mesh.geometry.computeBoundsTree();
            nodeView.mesh.visible = shapes.length > 0;
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
        case NodeType.Molding: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for Molding`);
            }
            switch (node.moldingType.get()) {
                case MoldingType.baseboard:
                case MoldingType.decoMolding: {
                    const prevGeometry = nodeView.mesh.geometry;
                    const contour = getRoomChildShape(node, true);
                    const molding = node;
                    const shape = molding.shape.get();
                    nodeView.mesh.geometry = ProfiledContourGeometry(createShape(node.core, shape, molding.shape.getOptions()), contour, true, true, false, undefined, undefined);
                    nodeView.mesh.geometry.computeBoundsTree();
                    return () => {
                        prevGeometry.disposeBoundsTree();
                        prevGeometry.dispose();
                    };
                }
                case MoldingType.rod: {
                    // A rod is a straight cylinder swept along the parent Part's width — the
                    // same intent the catalog encodes as a `contour` line of `partSize.x`
                    // (e.g. `master/Mouldings/Handle/closetRod`). Mirrors the MountLine
                    // TubeGeometry path above. Reading `part.size.x.get()` here subscribes the
                    // effect, so the rod rebuilds when the section/part is resized.
                    const prevGeometry = nodeView.mesh.geometry;
                    const length = getParentPart(node.core, node.id).size[V3Axes.x].get();
                    const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(length, 0, 0));
                    // Round rod, centred on the molding origin (its catalog `position` places it).
                    const geometry = new TubeGeometry(path, 1, CLOSET_ROD_RADIUS, 16, false);
                    geometry.clearGroups();
                    geometry.computeBoundsTree();
                    nodeView.mesh.geometry = geometry;
                    return () => {
                        prevGeometry.disposeBoundsTree();
                        prevGeometry.dispose();
                    };
                }
                default:
                    return undefined;
            }
        }
    }
    return undefined;
};
/**
 * Public geometry effect: builds the node's mesh geometry
 * (see updateMeshGeometryEffect) and then refreshes the node's black-and-white
 * contour outline from the freshly built geometry.
 *
 * Geometry-bearing views that carry a `line` (created via createContourLine)
 * keep their LAYERS.BW outline in sync here — the single render chokepoint drives
 * both the visible mesh and its contour, so the contour is always built from the
 * exact geometry currently on the mesh. The contour rebuild reads no signals, so
 * it adds no extra reactive dependencies; the previous fat-line geometry is
 * disposed inside rebuildContourLine and the final one in disposeContourLine.
 */
const updateGeometryEffect = (nodeView) => {
    const cleanup = updateMeshGeometryEffect(nodeView);
    if ('line' in nodeView && nodeView.line && 'mesh' in nodeView && nodeView.mesh) {
        rebuildContourLine(nodeView.line, nodeView.mesh.geometry);
    }
    return cleanup;
};
const updateRaycastMeshGeometryEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    switch (nodeView.type) {
        case NodeType.MountPlane: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateGeometryEffect for MountPlane`);
            }
            const prevGeometry = nodeView.raycastMesh.geometry;
            const shape = getMountPlaneShape(node, false);
            const geometry = node.mountSlotTypes.get().includes(MountType.ceiling) &&
                node.core.generalViewMode.get() === GeneralViewMode.floorPlan
                ? new ExtrudeGeometry(shape, { depth: 1e-5 })
                : new ShapeGeometry(shape);
            geometry.clearGroups();
            geometry.computeBoundsTree();
            nodeView.raycastMesh.geometry = geometry;
            // core.requestUpdateBundleGroup();
            return () => {
                prevGeometry.disposeBoundsTree();
                prevGeometry.dispose();
            };
        }
    }
    return undefined;
};
const updateMaterialEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    // coreLog('updateMaterialEffect', node);
    const view = nodeView.view;
    const { core, id } = node;
    switch (nodeView.type) {
        case NodeType.MountLine: // Handled in updateHoveredNodeMaterialEffect
        case NodeType.MountPlane: // Handled in updateHoveredNodeMaterialEffect
        case NodeType.MountPoint:
            return;
        case NodeType.AdjustableBox: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for AdjustableBox`);
            }
            const { materialTypes } = node;
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, materialTypes.map((type) => ({ materialId, category: type.get() })), (materials) => {
                materials.forEach((material, i) => {
                    nodeView.mesh.material[i] = material;
                });
            }, [...nodeView.mesh.material]);
        }
        case NodeType.WindowFrame: {
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'windowFrame' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.GateFrame: {
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'gateFrame' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Floor2D: {
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'floor' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Wall2D: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Wall2D`);
            }
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'wall' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Ceiling2D: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Ceiling2D`);
            }
            // Material is shared across all facets, so we only need to capture the
            // previous one once for disposal after the swap completes.
            const prevMaterial = nodeView.meshes[0]?.material;
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'ceiling' }], ([material]) => {
                for (const m of nodeView.meshes)
                    m.material = material;
            }, prevMaterial ? [prevMaterial] : []);
        }
        case NodeType.Countertop: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Countertop`);
            }
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'countertop' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.CrownMolding: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for CrownMolding`);
            }
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'crownMolding' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Molding: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Molding`);
            }
            return updateMeshMaterialsEffect(view, [{ materialId: 'cb63ae4a-5a74-499e-841f-d3a8bd6fa039', category: 'wall' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Panel: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Panel`);
            }
            const { panelType } = node;
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: panelType.get() }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Valance: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Valance`);
            }
            const { valanceType } = node;
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: valanceType.get() }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Edgebanding: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Edgebanding`);
            }
            const { edgebandingType } = node;
            const materials = getMaterials(core, id);
            const typeEdgebanding = edgebandingType.get();
            return updateMeshMaterialsEffect(view, materials.map((material) => ({
                materialId: material ? material._id : 'particleBoard',
                category: typeEdgebanding
            })), (newMaterials) => {
                nodeView.mesh.material = newMaterials;
            }, [...nodeView.mesh.material]);
        }
        case NodeType.ToeKickPanel: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for ToeKickPanel`);
            }
            const materialId = getMaterial(core, id)._id;
            return updateMeshMaterialsEffect(view, [{ materialId, category: 'toeKick' }], ([material]) => {
                nodeView.mesh.material = material;
            }, [nodeView.mesh.material]);
        }
        case NodeType.Model: {
            //@TODO need proper handling for different modeltypes here
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateMaterialEffect for Model`);
            }
            const { isScalable, size, isPositioned } = node;
            const model3D = nodeView.model3D;
            const model3DSource = getModelSource(view, node);
            const isScalableValue = isScalable ? isScalable.get() : undefined;
            const isPositionedValue = isPositioned ? isPositioned.get() : undefined;
            // Loading-placeholder box (see updateModelFallbackMatrixEffect): shown from
            // frame 1 until a GLTF loads below — the real model, or the striped absent
            // stand-in for sources that will never load. `emptyModel3D` (hardware:
            // hinges, locks, slides) is intentionally empty — never show a box for it.
            const isEmptyModel = model3DSource?._id === emptyModel3D._id;
            nodeView.showFallbackBox.set(!isEmptyModel);
            nodeView.fallbackKind.set('loading');
            let sizeX = 1;
            let sizeY = 1;
            let sizeZ = 1;
            if (isScalableValue === true && size) {
                sizeX = size.x.get();
                sizeY = size.y.get();
                sizeZ = size.z.get();
            }
            if (isScalableValue === 'x' && size) {
                sizeX = size.x.get();
            }
            const controller = new AbortController();
            const signal = controller.signal;
            // Keep the box up (it was flagged synchronously above) and drop any stale
            // model geometry + BW contour so nothing lingers under the placeholder.
            const keepFallback = () => {
                clearGroup(model3D);
                nodeView.bwModel3D.clear();
                nodeView.showFallbackBox.set(true);
                // Terminal (no source / failed load) — gray 'absent', not blue 'loading'.
                nodeView.fallbackKind.set('absent');
                updateRenderLayerEffect(nodeView);
                updateRaycastLayerEffect(nodeView);
                view.requestRender();
            };
            const f = async () => {
                // No source (missing / unindexed modelId) → go straight to the striped
                // absent stand-in model, scaled to the node like the fallback box.
                let source = model3DSource ?? absentModel3D;
                let isAbsent = !model3DSource;
                let gltf = await loadModel3D(view, source).catch(() => undefined);
                if (signal.aborted)
                    return;
                if (!gltf && !isAbsent && !isEmptyModel) {
                    // Dead source link → absent stand-in instead of "downloading forever".
                    getMonitor().warn(`Failed to load 3D model "${source.source}", showing absent model`);
                    source = absentModel3D;
                    isAbsent = true;
                    gltf = await loadModel3D(view, source).catch(() => undefined);
                    if (signal.aborted)
                        return;
                }
                if (!gltf) {
                    // Hardware (`emptyModel3D`) is meant to render nothing; otherwise even
                    // the absent model failed (offline?) — last resort is the gray box.
                    if (isEmptyModel)
                        nodeView.showFallbackBox.set(false);
                    else
                        keepFallback();
                    return;
                }
                // Geometry loaded — hide the loading-placeholder box and show the model.
                nodeView.showFallbackBox.set(false);
                // Absent stand-in mirrors the fallback-box dims: node.size when scalable,
                // else the uniform fallback cube.
                if (isAbsent) {
                    [sizeX, sizeY, sizeZ] = modelFallbackBoxDims(node);
                }
                //@TODO : must be separate effects for isScalable and isPositioned
                const { size: initialSize, origin } = view.storage.get('models')[source.source];
                const initialBoxSize = new Vector3(initialSize.get().x, initialSize.get().y, initialSize.get().z);
                const initialBoxCenter = new Vector3(origin.get().x, origin.get().y, origin.get().z);
                let scaleX = 1;
                let scaleY = 1;
                let scaleZ = 1;
                if (isAbsent || (isScalableValue === true && size)) {
                    scaleX = sizeX / initialBoxSize.x;
                    scaleY = sizeY / initialBoxSize.y;
                    scaleZ = sizeZ / initialBoxSize.z;
                    if (isPositionedValue) ;
                    else {
                        gltf.position.copy(initialBoxSize
                            .clone()
                            .multiplyScalar(0.5)
                            .sub(initialBoxCenter.clone())
                            .multiply(new Vector3(scaleX, scaleY, scaleZ)));
                    }
                }
                else {
                    if (isPositionedValue) {
                        gltf.position.set(0, 0, 0);
                    }
                    else {
                        const p = initialBoxSize.clone().multiplyScalar(0.5).sub(initialBoxCenter.clone());
                        // .sub(new Vector3(3.78 / 2, 0, 0));
                        gltf.position.copy(p);
                    }
                }
                gltf.scale.set(scaleX, scaleY, scaleZ);
                if (!isAbsent && isScalableValue === 'x' && size) {
                    if (gltf) {
                        gltf.scale.set(sizeX / initialBoxSize.x, 1, 1);
                        // this.size.y / this.initialBoxSize.y,
                        // this.size.z / this.initialBoxSize.z );
                        if (isPositionedValue) ;
                        else {
                            const position = initialBoxSize
                                .clone()
                                .multiplyScalar(0.5)
                                .sub(initialBoxCenter.clone())
                                .multiply(gltf.scale);
                            gltf.position.copy(position);
                        }
                    }
                }
                clearGroup(model3D);
                model3D.add(gltf);
                unregisterModelFallback(view, nodeView);
                // Black-and-white contour: build the edge template once per source from the
                // cached (untransformed) model, then clone it cheaply per view (clone shares
                // geometry buffers + the shared contourLineMaterial). The clone mirrors gltf's
                // root transform so the outline aligns with the scaled/positioned model.
                const modelEntry = view.storage.get('models')[source.source];
                if (modelEntry.model) {
                    modelEntry.bwModel ??= buildModelContour(modelEntry.model);
                    const bwClone = modelEntry.bwModel.clone();
                    bwClone.position.copy(gltf.position);
                    bwClone.quaternion.copy(gltf.quaternion);
                    bwClone.scale.copy(gltf.scale);
                    // Detach previous clone children WITHOUT disposing: their geometry/material
                    // are shared with the cached template. clearGroup would call disposeMesh and
                    // destroy the shared resources (LineSegments2 extends Mesh).
                    nodeView.bwModel3D.clear();
                    nodeView.bwModel3D.add(bwClone);
                }
                // core.requestUpdateBundleGroup();
                updateRenderLayerEffect(nodeView);
                updateRaycastLayerEffect(nodeView);
                nodeView.view.requestRender();
            };
            f();
            return () => {
                controller.abort();
            };
        }
        default:
            getMonitor().warn(`updateMaterialEffect is running on non-supported Node type ${node.type}`);
            return undefined;
    }
};
const updateRotationEffect = (nodeView) => {
    switch (nodeView.type) {
        default:
            {
                const node = getNode(nodeView.view.core, nodeView.id);
                if (!node[VectorProps.rotation])
                    return undefined;
                const rotation = node[VectorProps.rotation];
                nodeView.group.rotation.set(rotation.x.get(), rotation.y.get(), rotation.z.get());
                // node.core.requestUpdateBundleGroup();
            }
            break;
    }
};
/**
 * Door-leaf orientation for `gate` items. Reads `DoorOpenDirection` /
 * `DoorOpenSide` off the owning door Item (product attributes — see
 * `IDoorOpenDirectionValues` / `IDoorOpenSideValues` in designer-core) and flips
 * the door model accordingly:
 *   - `DoorOpenDirection === 'right'` mirrors the leaf across its vertical centre
 *     plane (handle / hinge swap left ↔ right) — the classic `scale.x = -1`.
 *   - `DoorOpenSide === 'outside'` spins the leaf 180° about the vertical axis so
 *     it opens toward the other face of the wall.
 *
 * Both reduce to an axis-aligned sign flip on the model's local X / Z: a 180° Y
 * turn is `diag(-1, 1, -1)` (det +1, a true rotation — normals stay correct); a
 * lone X mirror is `diag(-1, 1, 1)` (det -1, three.js flips the winding for us).
 * The node origin sits at the model's MIN corner (the gltf is placed at
 * `size/2 - bboxCenter`, see `updateMaterialEffect`), so each flipped axis is
 * compensated by a full-size translation to keep the leaf centred in place
 * rather than mirrored off to the side. Expressed purely as scale + position, no
 * matrix. Applied to both `model3D` and its `bwModel3D` contour sibling so the
 * outline tracks the flip. Identity for every non-door model — the attributes
 * are absent (resolve to `0`), so both signs stay +1 and no size read happens.
 */
const updateModelDoorTransformEffect = (nodeView) => {
    if (nodeView.type !== NodeType.Model)
        return undefined;
    const node = getNode(nodeView.view.core, nodeView.id);
    // `getOptionalParentItem` returns `undefined` (instead of throwing) when the
    // Model has no Item ancestor — unusual catalog topology, a partial undo mid
    // catalog instantiation, or a catalog-parsing edge case. The `!!item` guard
    // below plus the `isDoor &&` short-circuits then resolve to the identity
    // transform, so the effect no longer crashes and strands the model in a stale
    // pose for the session.
    const item = getOptionalParentItem(node.core, node.id);
    const isDoor = !!item && item.itemType.get() === ItemType.gate;
    const mirrorX = isDoor && getAttributeValue(item, 'DoorOpenDirection') === 'right';
    const flip180 = isDoor && getAttributeValue(item, 'DoorOpenSide') === 'outside';
    // 180° about Y ≡ a sign flip on both X and Z; the X mirror flips X only.
    const signX = (mirrorX ? -1 : 1) * (flip180 ? -1 : 1);
    const signZ = flip180 ? -1 : 1;
    // Compensate the pivot: origin is the min corner, so a flipped axis is shifted
    // back by the full leaf size to mirror about its centre. Size is only read when
    // a flip is actually active (keeps non-door models dependency-free).
    const modelSize = node.size;
    const shiftX = signX === -1 ? (modelSize?.x.get() ?? 0) : 0;
    const shiftZ = signZ === -1 ? (modelSize?.z.get() ?? 0) : 0;
    for (const target of [nodeView.model3D, nodeView.bwModel3D]) {
        target.scale.set(signX, 1, signZ);
        target.position.set(shiftX, 0, shiftZ);
    }
};
// Physical decay=2 attenuates as 1/d² in WORLD units, but this scene's world unit
// is the inch while candela are authored for metres. Vesta patched the GLSL shader
// to scale the sampled light distance by π·0.0254 (≈0.0796); on WebGPURenderer/TSL
// we can't patch shaders, and scaling distance by k inside 1/(k·d)² is identical to
// multiplying intensity by 1/k². So we boost light power by 1/(π·0.0254)² (≈157).
// The cutoff `distance` is ratio-invariant, so it stays authored in inches.
const LIGHT_POWER_SCALE = 1 / (Math.PI * 0.0254) ** 2;
/**
 * Drives a PointLight / SpotLight from its core node's attributes.
 *
 * `LuminousFlux` (lumens) → `light.power`, scaled by `LIGHT_POWER_SCALE` so the
 * physical inverse-square decay reads correctly in the inch-scaled world. For
 * SpotLights, `Angle` (degrees, half-cone) → `light.angle` and `Penumbra`
 * (0–100) → `light.penumbra`. `getExistsRecursively` gates `light.visible` so a
 * hidden/removed parent product extinguishes its light. All reads are reactive,
 * so editing any attribute (or toggling the product) re-runs this effect.
 */
const updateLightEffect = (nodeView) => {
    const node = getNode(nodeView.view.core, nodeView.id);
    switch (nodeView.type) {
        case NodeType.PointLight: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateLightEffect for PointLight`);
            }
            nodeView.light.power = Number(getAttributeValue(node, 'LuminousFlux')) * LIGHT_POWER_SCALE;
            nodeView.light.visible = getExistsRecursively(node);
            break;
        }
        case NodeType.SpotLight: {
            if (node.type !== nodeView.type) {
                throw new Error(`Node type mismatch: ${node.type} !== ${nodeView.type} in updateLightEffect for SpotLight`);
            }
            nodeView.light.power = Number(getAttributeValue(node, 'LuminousFlux')) * LIGHT_POWER_SCALE;
            // `Angle` is a half-cone in degrees; clamp below π/2 (max 89°) so the cone stays valid.
            nodeView.light.angle = (Math.min(Math.max(Number(getAttributeValue(node, 'Angle')), 0), 89) * Math.PI) / 180;
            nodeView.light.penumbra = Math.min(Math.max(Number(getAttributeValue(node, 'Penumbra')) / 100, 0), 1);
            nodeView.light.visible = getExistsRecursively(node);
            break;
        }
    }
    return undefined;
};

const getNodeView = (view, nodeId) => {
    if (!nodeId) {
        throw new Error(`Getting node by null id`);
    }
    const nodeView = view.nodes.get(nodeId);
    if (!nodeView) {
        throw new Error(`Node with ID ${nodeId} not found.`);
    }
    return nodeView;
};

// ─── internal helper ─────────────────────────────────────────────────────────
const setCamera = (designer3D, camera) => {
    designer3D.controls.object = camera;
    designer3D.engine.outlinePass.camera = camera;
    designer3D.engine.scenePass.camera = camera;
    // Keep the FXAA-only fallback pipeline in lockstep with the outline
    // pipeline — both render the same scene from the same camera, so a
    // missed update here would result in the plain path rendering through a
    // stale camera the moment the user clears the selection.
    if (designer3D.engine.plainScenePass) {
        designer3D.engine.plainScenePass.camera = camera;
    }
    camera.updateProjectionMatrix();
    designer3D.controls.update();
};
// ─── effects ─────────────────────────────────────────────────────────────────
const changeAreaGeneralViewModeEffect = (designer3D) => {
    const viewMode = designer3D.core.generalViewMode.get();
    designer3D.controls.enabled = true;
    designer3D.controls.enablePan = true;
    designer3D.controls.enableZoom = true;
    // Wall clipping is editor2D-only. Reset it off on every mode change; the
    // editor2D case re-enables it via fitEditor2DCameraToWall (only when a base
    // wall is framed).
    designer3D.e2ClipEnabled = false;
    switch (viewMode) {
        case GeneralViewMode.floorPlan:
            {
                // camera.up = (0,1,0) is parallel to the look direction (-Y) when looking
                // straight down, causing a degenerate lookAt that resolves to an arbitrary
                // rotation depending on floating-point precision (often ~45°). Setting
                // up = world -Z keeps it perpendicular to -Y so lookAt always produces
                // right = world +X unambiguously. Panning is still correct because
                // OrbitControls screenSpacePanning uses camera matrix column-1 = (0,0,-1),
                // and the sign convention gives the expected drag direction.
                designer3D.fCamera.up.set(0, 0, -1);
                // Compute the floorplan target BEFORE swapping cameras. `setCamera`
                // calls `controls.update()`, whose final `this.object.lookAt(this.target)`
                // would otherwise rotate `fCamera` toward the *previous* mode's target
                // (e.g. editor3D's), dispatch a `change` event, and push a corrupted
                // matrix into `core.fCameraData` — visibly shifting the FloorPlanUI
                // overlay (which decomposes that matrix in `FloorPlanUI/index.tsx`).
                //
                // Derive the target by dropping a perpendicular from the current
                // `fCamera` position straight down onto the floor plane (y = 0) — same
                // x/z as the camera, so the top-down look direction is exactly -Y. We do
                // NOT reuse `controlsData[floorPlan].target`: `AppData` serializes a
                // single shared controls target, so a room saved in editor3D persists
                // that mode's (offset) target. Restoring it here would land the
                // orthographic camera off-centre on reopen. The `fCamera` position comes
                // from its own saved `floorplanCamera` matrix and is always reliable.
                designer3D.controls.target.set(designer3D.fCamera.position.x, 0, designer3D.fCamera.position.z);
                setCamera(designer3D, designer3D.fCamera);
                // designer3D.updateSceneBox();
                // designer3D.updateOrthoCameraPosition(designer3D.fCamera);
                designer3D.controls.enableRotate = false;
            }
            return () => {
                designer3D.controlsData[viewMode].target = {
                    x: designer3D.controls.target.x,
                    y: designer3D.controls.target.y,
                    z: designer3D.controls.target.z
                };
            };
        case GeneralViewMode.editor2D: {
            setCamera(designer3D, designer3D.e2Camera);
            designer3D.controls.enableRotate = false;
            const baseNodeId = designer3D.core.editor2DBaseNodeId.get();
            if (baseNodeId) {
                const node = getNodeView(designer3D, baseNodeId);
                designer3D.fitEditor2DCameraToWall(node);
            }
            return undefined;
        }
        case GeneralViewMode.editor3D:
            {
                // Set target before setCamera so controls.update() inside setCamera
                // doesn't lookAt() the previous mode's target — see floorPlan branch
                // for the full reasoning.
                designer3D.controls.target.set(designer3D.controlsData[viewMode].target.x, designer3D.controlsData[viewMode].target.y, designer3D.controlsData[viewMode].target.z);
                setCamera(designer3D, designer3D.e3Camera);
                designer3D.controls.enableRotate = true;
                designer3D.controls.enabled = true;
            }
            return () => {
                designer3D.controlsData[viewMode].target = {
                    x: designer3D.controls.target.x,
                    y: designer3D.controls.target.y,
                    z: designer3D.controls.target.z
                };
            };
    }
    return undefined;
};
const changeStepEffect = (designer3D) => {
    if (designer3D.core.projectSettings.coreMode !== CoreMode.mobile)
        return;
    const step = designer3D.core.projectSettings.mobileSettings.step.get();
    switch (step) {
        case MobileStep.Present:
        case MobileStep.Estimate:
        case MobileStep.Customize:
        case MobileStep.Accessorize:
            designer3D.core.runCommandsAsTransaction(new SetGeneralViewModeCommand(GeneralViewMode.editor3D), '', false);
            break;
    }
    return undefined;
};
const changeSelectedObjectEffect = (designer3D) => {
    const selectedObject = designer3D.core.selectedNodeId.get();
    if (!selectedObject) {
        designer3D.engine.setSelectedObject(undefined);
        return undefined;
    }
    const node = getNode(designer3D.core, selectedObject);
    // Whole-system outline is a Customize-step affordance ONLY. On Customize drag
    // is disabled, so a single tap on a multiCloset highlights every closet of its
    // system as one unit. On other steps (e.g. obstacles → Design) drag IS allowed,
    // so selection must stay at the individual multiCloset (Item) level.
    const isCustomizeStep = designer3D.core.projectSettings.coreMode === CoreMode.mobile &&
        [MobileStep.Present, MobileStep.Estimate, MobileStep.Customize, MobileStep.Accessorize].includes(designer3D.core.projectSettings.mobileSettings.step.get());
    if (isCustomizeStep && node.type === NodeType.Item && node.itemType.get() === ItemType.multiCloset) {
        const systemId = getSystemById(designer3D.core, node.id);
        const systemItemIds = systemId ? getNodesBySystem(designer3D.core, systemId) : [];
        if (systemItemIds.length > 1) {
            const groups = systemItemIds
                .map((id) => designer3D.nodes.get(id)?.group)
                .filter((group) => Boolean(group));
            // Only commit the system outline when NodeViews are actually ready. During
            // undo/redo, `syncNodeViewsEffect` can re-create NodeViews on the same
            // `nodeIds` tick as this effect, so `nodes.get(id)` may transiently be
            // undefined for every closet. Setting `[]` would clear the outline
            // entirely; instead fall through to the standard single-node path so the
            // tapped closet still highlights (this effect re-runs once views exist).
            if (groups.length > 0) {
                designer3D.engine.setSelectedObject(groups);
                return undefined;
            }
        }
    }
    const nodeView = getNodeView(designer3D, node.id);
    switch (nodeView.type) {
        case NodeType.Wall2D:
        case NodeType.Floor2D:
            designer3D.engine.setSelectedObject(nodeView.mesh);
            break;
        case NodeType.RoomSegment: {
            // A selected wall is stored as its floor-plan `RoomSegment` — `getSelectableNode`
            // folds a `Wall2D` hit onto the segment, so a wall is never `selectedNodeId`
            // itself. The upright views therefore resolve the segment's `Wall2D` and outline
            // ITS mesh, which is what keeps a wall visibly selected across a floorPlan ⇄
            // editor2D / editor3D switch. In floorPlan the segment's selection is painted by
            // the SVG overlay (`FloorPlanUI/RoomSegmentsUI`), so the outline pass stays empty.
            const viewMode = designer3D.core.generalViewMode.get();
            const isUprightView = viewMode === GeneralViewMode.editor2D || viewMode === GeneralViewMode.editor3D;
            const wall2DId = isUprightView ? getRoomSegment(designer3D.core, node.id).wall2D.get() : null;
            // Read through `nodes` (not `getNodeView`, which throws): during undo/redo
            // `syncNodeViewsEffect` can re-create views on the same tick, so the Wall2DView
            // may transiently be missing — clear the outline instead of tearing down the effect.
            const wallView = wall2DId ? designer3D.nodes.get(wall2DId) : undefined;
            designer3D.engine.setSelectedObject(wallView?.type === NodeType.Wall2D ? wallView.mesh : undefined);
            break;
        }
        default:
            designer3D.engine.setSelectedObject(nodeView.group);
    }
    return undefined;
};
/**
 * Camera framing on selection / dimension-edit. Three contexts, each with its OWN tween slot on
 * `AreaDesigner3D` (so they can't stomp each other), dispatched in priority order:
 *
 *  1. **M3D-309 dimension focus (any mode)** — while a dimension is being EDITED (its overlay input
 *     gains focus, so the designer-ui `DimensionFocusTarget` wrapper sets `core.dimensionFocusNodeId`
 *     + target zoom), the camera drives to frame it: the ortho `fCamera` pans / zooms in floorPlan
 *     (`focusFloorplanCameraOnNode` / `…OnPoint`), the perspective `e3Camera` dollies keeping the
 *     orbit angle in editor3D (`focusEditor3DCameraOnNode`). This WINS over the Customize framing.
 *  2. **Customize step** — with no dimension being edited, a tapped multiCloset part is framed;
 *     clearing the selection (or a non-part) animates back to the part's product.
 *  3. **None** — drop all focus without animating.
 *
 * The dimension focus and the Customize framing both drive `e3Camera`, so whichever is dispatched
 * clears the other's tween first. Reads step + view mode + selection + the dimension signals up
 * front so the effect re-runs on any of them; the camera work (framing math + GSAP tween) lives in
 * `cameraFocus.ts` on `AreaDesigner3D`.
 */
const animateCameraToSelectionEffect = (designer3D) => {
    const { core } = designer3D;
    // Read view mode + selection unconditionally so the effect re-runs on either.
    const viewMode = core.generalViewMode.get();
    const selectedId = core.selectedNodeId.get();
    const isEditor3D = viewMode === GeneralViewMode.editor3D;
    // `&&` narrows `projectSettings` to the mobile union before `mobileSettings`
    // is touched (same pattern as changeSelectedObjectEffect); in mobile mode the
    // left side is always true so `step.get()` always subscribes.
    const isCustomize3D = core.projectSettings.coreMode === CoreMode.mobile &&
        [MobileStep.Present, MobileStep.Estimate, MobileStep.Customize, MobileStep.Accessorize].includes(core.projectSettings.mobileSettings.step.get()) &&
        isEditor3D;
    // M3D-309 (any-mode): an EDITED dimension takes priority over the Customize part-framing. The
    // designer-ui `DimensionFocusTarget` wrapper sets the node id (+ zoom) on input focus, and — for
    // floorplan product dimensions, whose line is offset from the item centre — an explicit
    // `dimensionFocusPoint` (the dimension's own midpoint). Read all three unconditionally so the
    // effect re-subscribes on any change.
    const dimensionFocusPoint = core.dimensionFocusPoint.get();
    const dimensionFocusNodeId = core.dimensionFocusNodeId.get();
    const dimensionFocusZoom = core.dimensionFocusZoom.get();
    // Screen centre of the focused FIELD — lets editor2D / editor3D pan the exact input to centre
    // (not just the node centre). floorPlan ignores it (its node/point framing already centres).
    const dimensionFocusScreenPoint = core.dimensionFocusScreenPoint.get();
    if (dimensionFocusZoom !== null) {
        if (viewMode === GeneralViewMode.floorPlan) {
            // Top-view ortho: pan + zoom the `fCamera`; prefer the explicit point over the node centre.
            if (dimensionFocusPoint) {
                focusFloorplanCameraOnPoint(designer3D, dimensionFocusPoint.x, dimensionFocusPoint.z, dimensionFocusZoom);
                return undefined;
            }
            if (dimensionFocusNodeId) {
                focusFloorplanCameraOnNode(designer3D, dimensionFocusNodeId, dimensionFocusZoom);
                return undefined;
            }
        }
        else if (isEditor3D && dimensionFocusNodeId) {
            // Perspective: dolly the `e3Camera` to the field keeping the orbit angle. Clear the Customize
            // part-framing first — it shares `e3Camera`, so leaving its tween alive would fight this one.
            clearCameraFocus(designer3D);
            focusEditor3DCameraOnNode(designer3D, dimensionFocusNodeId, dimensionFocusZoom, dimensionFocusScreenPoint);
            return undefined;
        }
        else if (viewMode === GeneralViewMode.editor2D && dimensionFocusNodeId) {
            // Wall-elevation ortho: pan + zoom the `e2Camera` to the field (own camera, no cross-clear).
            focusEditor2DCameraOnNode(designer3D, dimensionFocusNodeId, dimensionFocusZoom, dimensionFocusScreenPoint);
            return undefined;
        }
    }
    // No dimension being edited → Customize part-framing (mobile editor3D) or drop all focus.
    if (isCustomize3D) {
        // A whole-system Item tap keeps the existing outline (see changeSelectedObjectEffect) and does
        // not zoom; only individual parts frame. Clear the editor3D dimension tween first (shares e3Camera).
        clearEditor3DCameraFocus(designer3D);
        const node = selectedId ? getOptionalNode(core, selectedId) : null;
        if (node && node.type === NodeType.Part) {
            focusCameraOnNode(designer3D, node.id);
        }
        else {
            restoreCameraFocus(designer3D);
        }
        return undefined;
    }
    // No focus context applies — drop any existing focus without animating.
    clearCameraFocus(designer3D);
    clearFloorplanCameraFocus(designer3D);
    clearEditor3DCameraFocus(designer3D);
    clearEditor2DCameraFocus(designer3D);
    return undefined;
};
const changeHoveredObjectEffect = (designer3D) => {
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    if (draggedNodeId) {
        const draggedNode = getNode(designer3D.core, draggedNodeId);
        const parentId = draggedNode.parent.get();
        if (parentId) {
            const nodeView = getNodeView(designer3D, parentId);
            const hoveredNode = getNode(designer3D.core, parentId);
            if (nodeView && nodeView.type === NodeType.MountPlane) {
                const dragOffset = designer3D.core.draggedNodeOffset.get();
                const matrix = getMatrixWorld(draggedNode, false);
                const mountMatrix = getMatrixWorld(hoveredNode, false);
                const offset = dragOffset.clone().applyMatrix4(matrix).applyMatrix4(mountMatrix.invert());
                nodeView.raycastMesh.position.set(0, 0, offset.z);
                return () => {
                    nodeView.raycastMesh.position.set(0, 0, 0);
                };
            }
        }
    }
    return undefined;
};
const updateControlsEffect = (designer3D) => {
    const draggedObject = Boolean(designer3D.core.draggedNodeId.get());
    // Draw mode is intentionally NOT a reason to disable the controls.
    //
    // OrbitControls registers a touch pointer only inside `onPointerDown` while
    // `enabled === true`, and only enters its zoom branch (`DOLLY_PAN`, the
    // two-pointer case) once it has tracked TWO pointers. Disabling here would
    // drop finger 1 entirely, so a second finger could never reach the
    // two-pointer branch — two-finger pinch-zoom would be dead the whole time
    // the user is drawing.
    //
    // Single-finger draw still doesn't move the camera: floorplan sets
    // `enableRotate = false` and `touches.ONE` stays `ROTATE`, which is a no-op
    // while rotate is disabled. The draw tool (DrawRoomPoint, listening on
    // `core.domElement`) owns the single-finger gesture; OrbitControls owns the
    // two-finger one. A node drag still disables the controls so the camera
    // doesn't fight the drag.
    designer3D.controls.enabled = !draggedObject;
    return undefined;
};
/**
 * Floorplan STRUCTURE node types whose selection glow is incidental to a drag
 * (corner points, walls, surfaces). Dragging one of these drops the 5-pass
 * outline pipeline for the per-frame perf win. Everything NOT listed here —
 * products (Item / Part), models, lights, and any future node type — KEEPS its
 * outline mid-drag by default, so the dragged thing stays highlighted. We
 * EXCLUDE floorplan structure rather than enumerate the "special" types, so new
 * product/model types are highlighted automatically without touching this list.
 */
const FLOORPLAN_STRUCTURE_TYPES = new Set([NodeType.Point, NodeType.RoomSegment]);
const updateDraggingEffect = (designer3D) => {
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    const draggedNode = draggedNodeId ? getOptionalNode(designer3D.core, draggedNodeId) : null;
    // Gate (drop the outline) ONLY while dragging floorplan structure; keep it lit
    // for everything else (products, models, …) so the dragged object stays
    // highlighted.
    const isFloorplanStructure = draggedNode != null && FLOORPLAN_STRUCTURE_TYPES.has(draggedNode.type);
    designer3D.engine.setDragging(isFloorplanStructure);
    return undefined;
};
const updateHoveredNodeMaterialEffect = (designer3D) => {
    const hoveredNodeId = designer3D.core.hoveredNodeId.get();
    if (hoveredNodeId) {
        const node = getNode(designer3D.core, hoveredNodeId);
        const nodeView = getNodeView(designer3D, node.id);
        switch (nodeView.type) {
            case NodeType.MountPlane:
            case NodeType.MountLine:
                nodeView.mesh.material = designer3D.storage.get('looks').obj.service.mountSelected
                    .material;
                break;
            case NodeType.MountPoint:
            case NodeType.BoxContainer:
            case NodeType.FreeBoxContainer:
            case NodeType.Item:
            case NodeType.Part:
                break;
            default:
                getMonitor().warn('updateHoveredNodeMaterialEffect: unknown node type', node.type);
        }
        return () => {
            switch (nodeView.type) {
                case NodeType.MountPlane:
                case NodeType.MountLine:
                    nodeView.mesh.material = designer3D.storage.get('looks').obj.service.mountUnselected
                        .material;
                    break;
                case NodeType.MountPoint:
                case NodeType.BoxContainer:
                case NodeType.FreeBoxContainer:
                case NodeType.Item:
                case NodeType.Part:
                    break;
                default:
                    getMonitor().warn('updateHoveredNodeMaterialEffect: unknown node type', node.type);
            }
        };
    }
    return undefined;
};
const updateBoxContainerInstanceMeshRenderLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(NodeType.BoxContainer).getMesh().layers.disable(LAYERS.RENDER);
    return undefined;
};
const updateBoxContainerInstanceMeshRaycastLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(NodeType.BoxContainer).getMesh().layers.disable(LAYERS.RAYCAST);
    return undefined;
};
/**
 * The `partType` of the Part currently being dragged — from an existing node
 * (`draggedNodeId`) or a catalog chip (`draggedCatalogPath`). `undefined` when no
 * Part drag is active. Used to gate which FreeBoxContainer mesh accepts the raycast.
 */
const getDraggedPartType = (designer3D) => {
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    if (draggedNodeId) {
        const draggedNode = getNode(designer3D.core, draggedNodeId);
        return draggedNode.type === NodeType.Part ? draggedNode.partType.get() : undefined;
    }
    const draggedCatalogPath = designer3D.core.draggedCatalogPath.get();
    if (draggedCatalogPath) {
        const catalogConfig = resolveCatalogConfig(designer3D.core, draggedCatalogPath);
        if (!catalogConfig) {
            return undefined;
        }
        return catalogConfig.type === NodeType.Part ? catalogConfig.partType : undefined;
    }
    return undefined;
};
const updateFreeBoxContainerInstanceMeshRenderLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(NodeType.FreeBoxContainer).getMesh().layers.disable(LAYERS.RENDER);
    return undefined;
};
// Plain FreeBoxContainers become raycastable only while a `freeBoxContainerInteriorPart`
// is dragged (drop target for the 32mm-snap path); otherwise they stay out of the raycast.
const updateFreeBoxContainerInstanceMeshRaycastLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(NodeType.FreeBoxContainer).getMesh().layers;
    if (getDraggedPartType(designer3D) === PartType.freeBoxContainerInteriorPart) {
        layers.enable(LAYERS.RAYCAST);
    }
    else {
        layers.disable(LAYERS.RAYCAST);
    }
    return undefined;
};
const updateMultiClosetFreeBoxContainerInstanceMeshRenderLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(FreeBoxContainerType.multiCloset).getMesh().layers;
    if (isMultiClosetStackPartType(getDraggedPartType(designer3D))) {
        layers.enable(LAYERS.RENDER);
    }
    else {
        layers.disable(LAYERS.RENDER);
    }
    return undefined;
};
// multiCloset FreeBoxContainers become raycastable only while a stack part is dragged
// (drop target for the insert-between-stacks path); otherwise they stay out of the raycast.
const updateMultiClosetFreeBoxContainerInstanceMeshRaycastLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(FreeBoxContainerType.multiCloset).getMesh().layers;
    if (isMultiClosetStackPartType(getDraggedPartType(designer3D))) {
        layers.enable(LAYERS.RAYCAST);
    }
    else {
        layers.disable(LAYERS.RAYCAST);
    }
    return undefined;
};
const updateItemInstanceMeshRenderLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(NodeType.Item).getMesh().layers.disable(LAYERS.RENDER);
    return undefined;
};
const updateItemInstanceMeshRaycastLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(NodeType.Item).getMesh().layers.disable(LAYERS.RAYCAST);
    return undefined;
};
// The opening (window/gate) box proxy is a pure hit-target — never rendered.
const updateOpeningItemInstanceMeshRenderLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(OPENING_ITEM).getMesh().layers.disable(LAYERS.RENDER);
    return undefined;
};
/**
 * Unlike the plain Item box (raycast always off — items are picked via their
 * child sub-meshes), the window/gate box proxy KEEPS raycast on so a click over
 * the whole opening — not just the thin frame — selects the item. The enable
 * conditions mirror the WindowFrame/GateFrame gating in the node-view
 * `updateRaycastLayerEffect`: only in the editing view modes and never mid-drag
 * (so the drag raycast can reach the MountPlane/MountLine drop targets). Per-item
 * `exists` is already handled by the `dummyMatrix` write in updateInstancedMatrixEffect.
 */
const updateOpeningItemInstanceMeshRaycastLayerEffect = (designer3D) => {
    const { core } = designer3D;
    const layers = designer3D.instanceManagers.get(OPENING_ITEM).getMesh().layers;
    const modeVisibility = [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(core.generalViewMode.get()) &&
        !core.draggedNodeId.get() &&
        !core.draggedCatalogPath.get();
    // Mobile: mirror the frame's step gating (selectable in Design + Customize).
    let stepVisibility = true;
    if (core.projectSettings.coreMode === CoreMode.mobile) {
        stepVisibility = [
            MobileStep.Architecture,
            MobileStep.Systems,
            MobileStep.Catalog,
            MobileStep.Present,
            MobileStep.Estimate,
            MobileStep.Customize,
            MobileStep.Accessorize
        ].includes(core.projectSettings.mobileSettings.step.get());
    }
    if (modeVisibility && stepVisibility) {
        layers.enable(LAYERS.RAYCAST);
    }
    else {
        layers.disable(LAYERS.RAYCAST);
    }
    return undefined;
};
// The stand-in boxes are the instance pools that are meant to be seen (blue
// `loading` / gray `absent`), so RENDER stays on for both whole pools.
// Per-instance visibility is handled by the matrix writes in
// updateModelFallbackMatrixEffect.
const updateModelFallbackInstanceMeshRenderLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(MODEL_FALLBACK).getMesh().layers.enable(LAYERS.RENDER);
    designer3D.instanceManagers.get(MODEL_ABSENT).getMesh().layers.enable(LAYERS.RENDER);
    return undefined;
};
// Keep the stand-in boxes selectable like a real model would be — but only in the
// editing view modes and never mid-drag, so a drag can still reach the
// MountPlane/MountLine drop targets underneath them (mirrors the model-mesh raycast
// gating in the node-view updateRaycastLayerEffect and the opening-item effect above).
const updateModelFallbackInstanceMeshRaycastLayerEffect = (designer3D) => {
    const { core } = designer3D;
    const modeVisibility = [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(core.generalViewMode.get()) &&
        !core.draggedNodeId.get() &&
        !core.draggedCatalogPath.get();
    let stepVisibility = true;
    if (core.projectSettings.coreMode === CoreMode.mobile) {
        stepVisibility = [
            MobileStep.Architecture,
            MobileStep.Systems,
            MobileStep.Catalog,
            MobileStep.Present,
            MobileStep.Estimate,
            MobileStep.Customize,
            MobileStep.Accessorize
        ].includes(core.projectSettings.mobileSettings.step.get());
    }
    for (const poolId of [MODEL_FALLBACK, MODEL_ABSENT]) {
        const layers = designer3D.instanceManagers.get(poolId).getMesh().layers;
        if (modeVisibility && stepVisibility) {
            layers.enable(LAYERS.RAYCAST);
        }
        else {
            layers.disable(LAYERS.RAYCAST);
        }
    }
    return undefined;
};
const updateMultiClosetItemInstanceMeshRenderLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(ItemType.multiCloset).getMesh().layers;
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    if (draggedNodeId) {
        const draggedNode = getNode(designer3D.core, draggedNodeId);
        if (draggedNode.type === NodeType.Part && draggedNode.partType.get() === PartType.multiClosetSection) {
            layers.enable(LAYERS.RENDER);
        }
        else {
            layers.disable(LAYERS.RENDER);
        }
    }
    else {
        const draggedCatalogPath = designer3D.core.draggedCatalogPath.get();
        if (draggedCatalogPath) {
            const catalogConfig = resolveCatalogConfig(designer3D.core, draggedCatalogPath);
            if (!catalogConfig) {
                return undefined;
            }
            if (catalogConfig.type === NodeType.Part && catalogConfig.partType === PartType.multiClosetSection) {
                layers.enable(LAYERS.RENDER);
            }
            else {
                layers.disable(LAYERS.RENDER);
            }
        }
        else {
            layers.disable(LAYERS.RENDER);
        }
    }
    return undefined;
};
const updateMultiClosetItemInstanceMeshRaycastLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(ItemType.multiCloset).getMesh().layers;
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    if (draggedNodeId) {
        const draggedNode = getNode(designer3D.core, draggedNodeId);
        if (draggedNode.type === NodeType.Part && draggedNode.partType.get() === PartType.multiClosetSection) {
            layers.enable(LAYERS.RAYCAST);
        }
        else {
            layers.disable(LAYERS.RAYCAST);
        }
    }
    else {
        const draggedCatalogPath = designer3D.core.draggedCatalogPath.get();
        if (draggedCatalogPath) {
            const catalogConfig = resolveCatalogConfig(designer3D.core, draggedCatalogPath);
            if (!catalogConfig) {
                return undefined;
            }
            if (catalogConfig.type === NodeType.Part && catalogConfig.partType === PartType.multiClosetSection) {
                layers.enable(LAYERS.RAYCAST);
            }
            else {
                layers.disable(LAYERS.RAYCAST);
            }
        }
        else {
            layers.disable(LAYERS.RAYCAST);
        }
    }
    return undefined;
};
const updateMultiClosetSectionInstanceMeshRenderLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(PartType.multiClosetSection).getMesh().layers;
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    if (draggedNodeId) {
        const draggedNode = getNode(designer3D.core, draggedNodeId);
        if (draggedNode.type === NodeType.Part && draggedNode.partType.get() === PartType.multiClosetSectionContent) {
            layers.enable(LAYERS.RENDER);
        }
        else {
            layers.disable(LAYERS.RENDER);
        }
    }
    else {
        const draggedCatalogPath = designer3D.core.draggedCatalogPath.get();
        if (draggedCatalogPath) {
            const catalogConfig = resolveCatalogConfig(designer3D.core, draggedCatalogPath);
            if (!catalogConfig) {
                return undefined;
            }
            if (catalogConfig.type === NodeType.Part && catalogConfig.partType === PartType.multiClosetSectionContent) {
                layers.enable(LAYERS.RENDER);
            }
            else {
                layers.disable(LAYERS.RENDER);
            }
        }
        else {
            layers.disable(LAYERS.RENDER);
        }
    }
    return undefined;
};
const updateMultiClosetSectionInstanceMeshRaycastLayerEffect = (designer3D) => {
    const layers = designer3D.instanceManagers.get(PartType.multiClosetSection).getMesh().layers;
    const draggedNodeId = designer3D.core.draggedNodeId.get();
    if (draggedNodeId) {
        const draggedNode = getNode(designer3D.core, draggedNodeId);
        if (draggedNode.type === NodeType.Part && draggedNode.partType.get() === PartType.multiClosetSectionContent) {
            layers.enable(LAYERS.RAYCAST);
        }
        else {
            layers.disable(LAYERS.RAYCAST);
        }
    }
    else {
        const draggedCatalogPath = designer3D.core.draggedCatalogPath.get();
        if (draggedCatalogPath) {
            const catalogConfig = resolveCatalogConfig(designer3D.core, draggedCatalogPath);
            if (!catalogConfig) {
                return undefined;
            }
            if (catalogConfig.type === NodeType.Part && catalogConfig.partType === PartType.multiClosetSectionContent) {
                layers.enable(LAYERS.RAYCAST);
            }
            else {
                layers.disable(LAYERS.RAYCAST);
            }
        }
        else {
            layers.disable(LAYERS.RAYCAST);
        }
    }
    return undefined;
};
const updateMultiClosetSectionContentInstanceMeshRenderLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(PartType.multiClosetSectionContent).getMesh().layers.disable(LAYERS.RENDER);
    return undefined;
};
const updateMultiClosetSectionContentInstanceMeshRaycastLayerEffect = (designer3D) => {
    designer3D.instanceManagers.get(PartType.multiClosetSectionContent).getMesh().layers.disable(LAYERS.RAYCAST);
    return undefined;
};
/**
 * Reactive node-view lifecycle effect — both creation and disposal.
 *
 * Subscribes to `core.nodeIds` and keeps `designer3D.nodes` in sync:
 *   - Disposes NodeViews whose UUID is no longer in core (removal / undo).
 *   - Creates NodeViews for IDs that have no NodeView yet (undo/redo of additions,
 *     or any case where the imperative `addNode` path was not taken).
 */
const syncNodeViewsEffect = (designer3D) => {
    const coreIds = new Set(designer3D.core.nodeIds.get());
    for (const [id, nodeView] of designer3D.nodes) {
        if (!coreIds.has(id)) {
            nodeView.dispose();
            designer3D.nodes.delete(id);
        }
    }
    for (const id of coreIds) {
        if (!designer3D.nodes.has(id)) {
            const node = designer3D.core.nodes.get(id);
            if (node) {
                try {
                    designer3D.createNodeView(node);
                }
                catch (e) {
                    // NodeView creation can fail transiently (e.g. during redo when a
                    // child node is replayed before its parent). The effect will re-run
                    // on the next nodeIds change and retry.
                    getMonitor().warn(`[syncNodeViewsEffect] Failed to create NodeView for ${id}:`, e);
                }
            }
        }
    }
    return undefined;
};
// Per-view memory of the last multiCloset id-set this effect swept on, so an
// unrelated `nodeIds` change (adding a shelf, a part, etc.) doesn't run the
// geometry sweep. Keyed by view; entries are released when the view is GC'd.
const lastMultiClosetSetKeyByView = new WeakMap();
/**
 * Re-derive multiCloset neighbor/joint ids whenever the SET of multiClosets
 * changes — a closet added or removed, including undo/redo of a removal.
 *
 * The per-closet `updateMultiClosetNeighborsEffect` only fires on pose/drag
 * changes, never on a neighbor disappearing, so without this a survivor keeps
 * stale ids and keeps rendering its bridge / corner joint after the neighbor is
 * deleted. Neighbor ids are derived state (written `addToHistory: false`), so
 * re-deriving from the restored `nodeIds` is what makes undo/redo correct
 * without coupling these writes into the history transaction.
 *
 * This is a single view-level effect (not per closet): it runs once per
 * `nodeIds` change, cheaply checks whether the multiCloset set actually changed,
 * and only then invokes the shared geometry sweep.
 */
const resyncMultiClosetNeighborsOnStructureEffect = (designer3D) => {
    // Subscribe ONLY to the node set — not to any pose signal — so the geometry
    // sweep is not driven by unrelated edits; the per-closet effect owns the
    // pose/drag-end triggers.
    const nodeIds = designer3D.core.nodeIds.get();
    untracked(() => {
        // Authoritative multiCloset set from core (the InstanceManager set can lag
        // mid-disposal). Stable signature detects only real set changes.
        const closetIds = [];
        for (const id of nodeIds) {
            const node = getOptionalNode(designer3D.core, id);
            if (node?.type === NodeType.Item && node.itemType.get() === ItemType.multiCloset) {
                closetIds.push(id);
            }
        }
        const key = closetIds.sort().join(',');
        // Unchanged set → nothing structural happened (e.g. a non-closet node edit).
        if (lastMultiClosetSetKeyByView.get(designer3D) === key)
            return;
        // Defer mid-drag; the drag-end path (`updateMultiClosetNeighborsEffect`)
        // recomputes anyway. Leave the stored key stale so a later change still
        // differs and re-triggers.
        if (designer3D.core.draggedNodeId.get() !== null || designer3D.core.draggedCatalogPath.get() !== null) {
            return;
        }
        lastMultiClosetSetKeyByView.set(designer3D, key);
        runMultiClosetNeighborSweep(designer3D);
    });
    return undefined;
};

class IWebGPU {
    engine;
    canvas;
    renderer;
    /**
     * Full post-processing pipeline: scene pass → outline mask → 2 blur passes →
     * composite → FXAA. Used ONLY when `hasSelection === true`.
     *
     * Three of the five passes (outline mask + the two Gaussian blur passes)
     * are pure outline overhead and contribute nothing visible when nothing
     * is selected — yet they ran every frame in the original implementation
     * even with `selectedObjects = []`, because `OutlineNode`'s graph stays
     * live regardless of the selection. The Chrome trace showed
     * `RenderPipeline._renderScenes` at ~17 % of total time; eliminating
     * three of its five passes when the user isn't focused on something is
     * the biggest single saving in `render()`.
     */
    outlinePipeline;
    /**
     * Minimal pipeline: scene pass → FXAA. Used when nothing is selected.
     *
     * Same `outputColorTransform = false` + `renderOutput(…)` shape as the
     * outline pipeline so the on-screen colour space matches exactly — no
     * visible jump when the selection toggles. FXAA is kept so edges never
     * look worse than they do in the outline path (the renderer itself runs
     * with `antialias: false`).
     */
    plainPipeline;
    scenePass;
    /**
     * Independent scene pass for the FXAA-only pipeline. We can't share
     * `scenePass` because `RenderPipeline` ties a pass node to its containing
     * pipeline's render targets — sharing would either leak the outline
     * pipeline's targets into the plain path or vice versa. The Three.js
     * renderer dedupes the underlying scene draw call when the camera /
     * scene contents are identical, so the perceived cost of two
     * `pass(scene, camera)` declarations is just two extra `PassNode`
     * wrappers, NOT two scene draws per frame.
     */
    plainScenePass;
    outlinePass;
    /**
     * Cached selection state — drives the render-path dispatch in `render()`.
     *
     * Updated synchronously by `setSelectedObject`, so by the time the next
     * RAF fires `render()` the dispatch already knows which pipeline to use.
     * Cheaper than reading `outlinePass.selectedObjects.length` on every
     * frame (avoids one property read + length check on the hot path; more
     * importantly, makes the branch explicit).
     */
    hasSelection = false;
    isDragging = false;
    /**
     * Editor2D screen-space wall clip. Baked into BOTH pipelines' output shader
     * and gated by `clipEnabled` (0/1), so entering editor2D never switches
     * pipeline instances (avoiding the r183 render-pass-descriptor bug) — only
     * uniforms change. `clipMinX`/`clipMaxX` are the framed wall's left/right edges
     * in screen UV.x, recomputed each frame from the camera in `render()`; pixels
     * outside `[minX, maxX]` are replaced with `clipBg` (the linear scene
     * background, so the seam matches the real cleared background after
     * `renderOutput`). This replaces GPU/`ClippingGroup` clipping, which WebKit's
     * WGSL does not honour for the software path.
     */
    clipEnabled = uniform(0);
    clipMinX = uniform(0);
    clipMaxX = uniform(1);
    clipBg = uniform(new Color(0xf8f7fa));
    constructor(engine, canvas) {
        this.engine = engine;
        this.canvas = canvas;
        this.renderer = new WebGPURenderer({
            antialias: false,
            canvas,
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        // Set BEFORE `initPostProcessing()` so the RenderPipeline captures it: both
        // pipelines run `outputColorTransform = false` + `renderOutput(...)`, and in
        // that mode the pipeline copies `renderer.toneMapping`/`outputColorSpace` into
        // the node context, which the `renderOutput()` nodes read — so tone mapping
        // flows through automatically on both the WebGPU and WebGL2 backends.
        // Exposure is BELOW 1 on purpose. three's ACES implementation pre-scales by
        // `exposure / 0.6` before the curve (see `acesFilmicToneMapping` in
        // ToneMappingFunctions.js), so nominal 1.0 is really a 1.67× boost — with the
        // studio dome in `setupEnvironment` supplying real energy, unit exposure
        // drives the catalog's white melamine (linear albedo ≈ 0.87) to ~0.85 display
        // and into the shoulder, where shelf tops, panel fronts and shelf undersides
        // all compress into one flat white.
        //
        // At 0.75 the same three surfaces land at roughly 0.79 / 0.65 / 0.35 display,
        // just under the 0xf8f7fa background — so the casework reads as an object in
        // front of a light backdrop rather than glowing against it. Retune the ENV_*
        // constants for the lighting DESIGN; use this only as the master trim.
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;
    }
    async init() {
        await this.renderer.init();
    }
    initPostProcessing() {
        this.outlinePipeline = new RenderPipeline(this.renderer);
        this.outlinePipeline.outputColorTransform = false;
        // Amplifies the raw blur values (typically 0.05–0.4) into the 0–1 mix range.
        // Increase to make the glow more opaque; decrease for a subtler effect.
        const edgeStrength = uniform(5.0);
        const edgeGlowBlend = uniform(1.5); // weight for the quarter-res blur layer
        // OutlineNode runs its full pipeline:
        //   depth pre-pass → mask → edge detection →
        //   separable Gaussian blur (½ res + ¼ res) → composite
        // edgeThickness controls the Gaussian kernel radius.
        this.outlinePass = outline(this.engine.scene, this.engine.getCamera(), {
            selectedObjects: undefined,
            edgeThickness: uniform(2.0),
            edgeGlow: uniform(2.0) // we drive the glow blend ourselves via edgeGlowBlend
        });
        // _maskTextureUniform  — raw selection mask (R=0 selected, R=1 background)
        // _edge1TextureUniform — blurred edge at ½ resolution (R=visible, G=hidden edge intensity)
        // _edge2TextureUniform — blurred edge at ¼ resolution (wider, softer spread)
        const maskTex = this.outlinePass._maskTextureUniform;
        const edge1Tex = this.outlinePass._edge1TextureUniform;
        const edge2Tex = this.outlinePass._edge2TextureUniform;
        // Keep OutlineNode in the render graph so all blur passes run each frame.
        // uniform(0) prevents the shader compiler from constant-folding the mul away.
        const dummyRef = this.outlinePass.getTextureNode().mul(uniform(0));
        // OutlineNode's standard compositing:  maskColor.r         * edgeValue → outer glow
        // Inner glow is identical blur, masked to the INSIDE:
        //                                       maskColor.r.oneMinus() * edgeValue → inner glow
        //
        // The downsampled blur textures (½ and ¼ res) upscale via bilinear interpolation,
        // which adds extra smoothing on top of the separable Gaussian — exactly the soft
        // continuous falloff the original outward outline had.
        const e1 = edge1Tex.sample(uv());
        const e2 = edge2Tex.sample(uv());
        // R = visible-edge channel, G = hidden-edge channel (OutlineNode edge detection encoding)
        const edgeValue = e1.r.add(e1.g).add(e2.r.add(e2.g).mul(edgeGlowBlend));
        const innerGlowIntensity = maskTex.sample(uv()).r.oneMinus().mul(edgeValue);
        this.scenePass = pass(this.engine.scene, this.engine.getCamera());
        // Hex colour in sRGB — convert to linear for the render pipeline.
        // With mix() blending the hex value appears exactly as set: no additive brightening.
        const outlineHex = new Color(0xaa81cf);
        const outlineColorNode = vec4(uniform(outlineHex), 1.0);
        // mix() blending: outline pixels show exactly outlineColorNode; edgeStrength scales
        // the blur-derived weight into the 0–1 range so the colour is not washed out.
        const blendWeight = innerGlowIntensity.mul(edgeStrength).clamp(0, 1);
        const composited = mix(this.scenePass, outlineColorNode, blendWeight).add(dummyRef);
        this.outlinePipeline.outputNode = fxaa(renderOutput(this.applyClip(composited)));
        // ── Plain pipeline (no selection) ────────────────────────────────────
        // Same colour-space configuration as the outline pipeline so toggling
        // the selection never shifts the on-screen look.
        this.plainPipeline = new RenderPipeline(this.renderer);
        this.plainPipeline.outputColorTransform = false;
        this.plainScenePass = pass(this.engine.scene, this.engine.getCamera());
        this.plainPipeline.outputNode = fxaa(renderOutput(this.applyClip(this.plainScenePass)));
    }
    /**
     * Editor2D wall clip, applied to the LINEAR scene colour before `renderOutput`
     * so the replaced pixels tone-map identically to the real cleared background
     * (invisible seam). Keeps the scene inside the wall's `[clipMinX, clipMaxX]`
     * screen band; replaces everything outside with `clipBg`. When `clipEnabled`
     * is 0 (all non-editor2D modes) `keep` is forced to 1 → passthrough, so this
     * is a no-op there. See the `clipEnabled` field doc.
     */
    applyClip(sceneColorNode) {
        const x = uv().x;
        // 1 inside the band, 0 outside (no branch, no discard — WebKit-safe).
        const insideBand = step(this.clipMinX, x).mul(step(x, this.clipMaxX));
        const keep = insideBand.max(this.clipEnabled.oneMinus());
        return mix(vec4(this.clipBg, 1), sceneColorNode, keep);
    }
    setSelectedObject(object) {
        // Normalize to an array up front — the outline pass already takes a list,
        // so one or many selected objects (e.g. every closet of a multiCloset
        // system) share the same code path.
        const objects = object ? (Array.isArray(object) ? object : [object]) : [];
        if (objects.length === 0) {
            this.outlinePass.selectedObjects = [];
            this.hasSelection = false;
            return;
        }
        const selected = (this.engine.core.projectSettings.coreMode === CoreMode.web ||
            this.engine.core.projectSettings.coreMode === CoreMode.mobile) &&
            [GeneralViewMode.editor3D, GeneralViewMode.editor2D, GeneralViewMode.floorPlan].includes(this.engine.core.generalViewMode.get())
            ? objects
            : [];
        this.outlinePass.selectedObjects = selected;
        this.hasSelection = selected.length > 0;
    }
    /**
     * Toggle the active-drag state. While `true`, `render()` uses the plain
     * pipeline regardless of selection, dropping the three outline-only passes
     * (mask + two Gaussian blurs) that dominate the drag frame budget.
     */
    setDragging(dragging) {
        this.isDragging = dragging;
    }
    resize(width, height) {
        this.renderer.setSize(width, height, true);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.scenePass.setSize(width, height);
        this.outlinePass.setSize(width, height);
        if (this.plainScenePass)
            this.plainScenePass.setSize(width, height);
    }
    /**
     * Selection- and drag-gated render dispatch. The outline pipeline (5 passes)
     * runs ONLY when something is selected AND no drag is in progress; otherwise
     * the cheap plain pipeline (1 scene pass + FXAA) renders. This covers the two
     * costly cases:
     *   - idle/pan/zoom with no selection (the common explore case), and
     *   - an active node drag, where the dragged node is always selected and the
     *     full outline graph would otherwise run on every one of ~120 frames/s.
     *
     * NOTE: we deliberately do NOT gate on camera movement here. Switching
     * between the two RenderPipeline instances immediately after a camera frustum
     * change (zoom) trips a three.js r183 bug where the render-pass descriptor
     * keeps a stale `timestampWrites.querySet`, crashing `beginRenderPass`. The
     * drag gate is safe because the camera is static during a node drag.
     */
    render() {
        // Editor2D wall clip: reproject the framed wall's left/right edge world
        // points to screen UV.x each frame so the band tracks camera pan/zoom, then
        // drive the pipeline's clip uniforms. In the ortho face-on view every point
        // on an edge shares one screen X, so the two projected X's bound the wall.
        if (this.engine.e2ClipEnabled) {
            const camera = this.engine.getCamera();
            camera.updateMatrixWorld(); // refresh matrixWorldInverse for project()
            const { minX, maxX } = getEditor2DClipBandX(this.engine.e2ClipLeftWorld, this.engine.e2ClipRightWorld, camera);
            this.clipMinX.value = minX;
            this.clipMaxX.value = maxX;
            this.clipEnabled.value = 1;
            // Keep the clipped-region fill matching the live background so the seam is
            // invisible (empty scene areas clear to scene.background; we mix to the same).
            const bg = this.engine.scene.background;
            if (bg instanceof Color)
                this.clipBg.value.copy(bg);
        }
        else {
            this.clipEnabled.value = 0;
        }
        if (this.hasSelection && !this.isDragging) {
            this.outlinePipeline.render();
        }
        else {
            this.plainPipeline.render();
        }
    }
    dispose() {
        if (this.outlinePipeline) {
            this.outlinePipeline.dispose();
        }
        if (this.plainPipeline) {
            this.plainPipeline.dispose();
        }
        if (this.outlinePass) {
            this.outlinePass.dispose();
        }
        if (this.scenePass) {
            this.scenePass.dispose();
        }
        if (this.plainScenePass) {
            this.plainScenePass.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

const disposeNodeGroup = (group) => {
    group.parent?.remove(group);
    clearGroup(group);
};

class NodeGroup extends Group {
    isNodeGroup = true;
    constructor() {
        super();
    }
}

/**
 * Wraps a per-NodeView effect with a guard that skips execution when the
 * underlying core node has already been removed.
 *
 * Why this is needed:
 * `packExecute` wraps all command execution in a Preact `batch()`, which
 * defers effect flushing until the batch exits. During mass removal
 * (e.g. `core.dispose()`), many signal writes accumulate and then flush
 * together. Preact runs dirty effects in an order that is NOT guaranteed
 * to match the `effects` registration order, so `syncNodeViewsEffect`
 * (which disposes NodeViews) may fire AFTER per-node effects like
 * `updateGeometryEffect`. Those per-node effects call `getNode(...)`,
 * which throws if the node is already unregistered.
 *
 * Short-circuiting here is safe: when the core has no such node, the
 * NodeView is about to be disposed by `syncNodeViewsEffect` anyway —
 * running the effect body would only reproduce stale state.
 */
const registerNodeViewEffect = (nodeView, callback) => nodeView.view.registerViewEffect(() => {
    if (!nodeView.view.core.nodes.has(nodeView.id))
        return undefined;
    return callback(nodeView);
});
const registerNodeViewEffects = (nodeView) => {
    const disposeFns = [];
    if ('effects' in nodeView) {
        for (const callback of nodeView.effects) {
            disposeFns.push(registerNodeViewEffect(nodeView, callback));
        }
    }
    else {
        throw new Error('Node does not have an effects property');
    }
    return () => {
        for (const disposeFn of disposeFns) {
            disposeFn();
        }
    };
};

class AdjustableBoxView {
    id;
    type = NodeType.AdjustableBox;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateRenderLayerEffect,
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRaycastLayerEffect,
        updateGeometryEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        const loadingMaterial = this.view.storage.get('looks').obj.service.loading.material;
        this.mesh = new Mesh(new BufferGeometry(), [
            loadingMaterial,
            loadingMaterial,
            loadingMaterial,
            loadingMaterial,
            loadingMaterial,
            loadingMaterial
        ]);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class AdjustableExtrusionView {
    id;
    type = NodeType.AdjustableExtrusion;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateRenderLayerEffect, updateParentIdEffect, updatePositionEffect, updateRotationEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class BoxContainerView {
    id;
    type = NodeType.BoxContainer;
    view;
    index;
    group = new NodeGroup();
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateInstancedMatrixEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        // Register with manager
        this.index = this.view.instanceManagers.get(NodeType.BoxContainer).register(this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.view.instanceManagers.get(NodeType.BoxContainer).unregister(this.index);
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class CarcassView {
    id;
    type = NodeType.Carcass;
    view;
    group = new NodeGroup();
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class Ceiling2DView {
    id;
    type = NodeType.Ceiling2D;
    view;
    group = new NodeGroup();
    /**
     * One mesh per geometry returned by `getCeiling2DGeometries`.
     *
     * - Flat ceiling → exactly 1 mesh (preserves the legacy single-mesh layout).
     * - Cathedral ceiling → one mesh per profile segment (facet).
     *
     * `updateGeometryEffect` rebuilds this list, `updateMaterialEffect` walks it.
     */
    meshes = [];
    effects = [updateParentIdEffect, updateCeilingTransformEffect, updateGeometryEffect, updateMaterialEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        // Group pose is now driven by `updateCeilingTransformEffect`. Geometry is
        // built lazily by `updateGeometryEffect` (one or more meshes depending on
        // ceiling type), so the constructor does not allocate a placeholder mesh.
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    /** Removes every mesh from the group and disposes its BVH + geometry. */
    disposeMeshes() {
        for (const m of this.meshes) {
            this.group.remove(m);
            m.geometry.disposeBoundsTree?.();
            m.geometry.dispose();
        }
        this.meshes = [];
    }
    dispose() {
        this.disposeEffects();
        this.disposeMeshes();
        disposeNodeGroup(this.group);
    }
}

class CountertopView {
    id;
    type = NodeType.Countertop;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new CustomExtrudeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class CrownMoldingView {
    id;
    type = NodeType.CrownMolding;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class EdgebandingView {
    id;
    type = NodeType.Edgebanding;
    view;
    group = new NodeGroup();
    mesh;
    /**
     * `updateRaycastLayerEffect` is required, not optional: an edgebanding node exists exactly when
     * its Panel is melamine sheet stock, which is exactly when `updateGeometryEffect` builds that
     * Panel with `sides: 0` — i.e. with no edge walls. The two are complements, so for melamine
     * panels this mesh is the ONLY surface covering the panel's edges, and without it on
     * `LAYERS.RAYCAST` those edges are unpickable. That is invisible from most angles (the panel's
     * lid faces are hit instead) but fatal edge-on: in the editor2D front elevation a horizontal
     * shelf board presents only its front edge to the camera, so the ray passed straight through
     * the board and selection fell through to nothing.
     *
     * Resolution is unchanged by adding this: an Edgebanding is `children[0]` of its Panel, and
     * neither type is a selectable target, so `getSelectableNode` walks up from it to the same
     * owning Part it would reach from a Panel hit.
     */
    effects = [
        updateParentIdEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        const loadingMaterial = this.view.storage.get('looks').obj.service.loading.material;
        this.mesh = new Mesh(new BufferGeometry(), new Array(10).fill(loadingMaterial));
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class Floor2DView {
    id;
    type = NodeType.Floor2D;
    view;
    group = new NodeGroup();
    mesh;
    line;
    effects = [
        updateParentIdEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new ShapeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        this.line.visible = false;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class FloorplanView {
    id;
    type = NodeType.Floorplan;
    view;
    group = new NodeGroup();
    effects = [];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.group.rotation.set(-Math.PI / 2, 0, 0);
        view.scene.add(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
        this.view.scene.remove(this.group);
    }
}

class FrameView {
    id;
    type = NodeType.Frame;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class FreeBoxContainerView {
    id;
    type = NodeType.FreeBoxContainer;
    view;
    index;
    group = new NodeGroup();
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateInstancedMatrixEffect
    ];
    disposeEffects;
    // Cached at construction — the node's flavor may be gone from core by dispose().
    instanceManager;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        // multiCloset containers live on a dedicated instance mesh (drag-raycast split);
        // plain containers use the shared FreeBoxContainer mesh.
        this.instanceManager = this.getInstanceManager();
        this.index = this.instanceManager.register(this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    getInstanceManager() {
        const isMultiCloset = getNode(this.view.core, this.id).freeBoxContainerType.get() ===
            FreeBoxContainerType.multiCloset;
        return this.view.instanceManagers.get(isMultiCloset ? FreeBoxContainerType.multiCloset : NodeType.FreeBoxContainer);
    }
    dispose() {
        this.instanceManager.unregister(this.index);
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class GateFrameView {
    id;
    type = NodeType.GateFrame;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new CustomExtrudeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class GlassView {
    id;
    type = NodeType.Glass;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class ImageView {
    id;
    type = NodeType.Image;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class ItemView {
    id;
    type = NodeType.Item;
    group = new NodeGroup();
    view;
    index;
    effects = [
        updateRenderLayerEffect,
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRaycastLayerEffect,
        updateInstancedMatrixEffect,
        updateMultiClosetNeighborsEffect
    ];
    disposeEffects;
    // Cached at construction time — node may be gone from core by the time dispose() runs.
    instanceManager;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.instanceManager = this.getInstanceManager();
        this.index = this.instanceManager?.register(this) ?? -1;
        this.disposeEffects = registerNodeViewEffects(this);
    }
    getInstanceManager() {
        if (getOptionalParentItem(this.view.core, this.id)) {
            return null;
        }
        const item = getItem(this.view.core, this.id);
        // Window/gate openings live in their own raycast-enabled pool so a click
        // anywhere over the opening — not just the thin frame — selects the item.
        // Must stay in lockstep with the matching branch in updateInstancedMatrixEffect.
        if (isWallHoleableNode(item)) {
            return this.view.instanceManagers.get(OPENING_ITEM);
        }
        return this.view.instanceManagers.get(item.itemType.get() === ItemType.multiCloset ? ItemType.multiCloset : NodeType.Item);
    }
    dispose() {
        if (this.index !== -1) {
            this.instanceManager?.unregister(this.index);
        }
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class LaminateBoxView {
    id;
    type = NodeType.LaminateBox;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class MiteredPanelView {
    id;
    type = NodeType.MiteredPanel;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class ApplianceModelView {
    id;
    type = NodeType.Model;
    view;
    group = new NodeGroup();
    model3D = new Group();
    // Black-and-white contour subtree (LAYERS.BW), populated in updateMaterialEffect
    // from the shared per-source template. Sibling of model3D so it inherits the
    // node transform but is toggled/disposed independently.
    bwModel3D = new Group();
    // True while the box should show: from creation until the GLTF loads, and
    // permanently for models with no source / a failed load. Set by
    // updateMaterialEffect, drives updateModelFallbackMatrixEffect.
    showFallbackBox;
    // 'loading' while the GLTF downloads, 'absent' once it will never load.
    // Set by updateMaterialEffect, picks which stand-in pool shows the box.
    fallbackKind;
    // Lazy slot index MIRRORED across both stand-in pools (always registered in
    // pairs, so the pools yield the same index). -1 until the box is first needed.
    fallbackIndex = -1;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateMaterialEffect,
        updateModelDoorTransformEffect,
        updateModelFallbackMatrixEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.showFallbackBox = view.core.createValue(false);
        this.fallbackKind = view.core.createValue('loading');
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.group.add(this.model3D);
        this.bwModel3D.name = `bwModel3D-${id}`;
        this.group.add(this.bwModel3D);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        unregisterModelFallback(this.view, this);
        this.disposeEffects();
        // Detach the BW subtree before group teardown: its LineSegments2 clones share
        // the cached template geometry and the shared contourLineMaterial, so we must
        // not let disposeNodeGroup -> clearGroup -> disposeMesh dispose them.
        this.bwModel3D.removeFromParent();
        disposeNodeGroup(this.group);
    }
}

class HingeModelView {
    id;
    type = NodeType.Model;
    view;
    group = new NodeGroup();
    model3D = new Group();
    // Black-and-white contour subtree (LAYERS.BW), populated in updateMaterialEffect
    // from the shared per-source template. Sibling of model3D so it inherits the
    // node transform but is toggled/disposed independently.
    bwModel3D = new Group();
    // Hinges always resolve to `emptyModel3D` (intentionally empty), so this stays
    // false and no fallback box is ever registered — the fields exist only because
    // the shared updateMaterialEffect / updateModelFallbackMatrixEffect touch them.
    showFallbackBox;
    fallbackKind;
    fallbackIndex = -1;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateMaterialEffect,
        updateModelDoorTransformEffect,
        updateModelFallbackMatrixEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.showFallbackBox = view.core.createValue(false);
        this.fallbackKind = view.core.createValue('loading');
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.group.add(this.model3D);
        this.bwModel3D.name = `bwModel3D-${id}`;
        this.group.add(this.bwModel3D);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        unregisterModelFallback(this.view, this);
        this.disposeEffects();
        // Detach the BW subtree before group teardown: its LineSegments2 clones share
        // the cached template geometry and the shared contourLineMaterial, so we must
        // not let disposeNodeGroup -> clearGroup -> disposeMesh dispose them.
        this.bwModel3D.removeFromParent();
        disposeNodeGroup(this.group);
    }
}

class OtherModelView {
    id;
    type = NodeType.Model;
    view;
    group = new NodeGroup();
    model3D = new Group();
    // Black-and-white contour subtree (LAYERS.BW), populated in updateMaterialEffect
    // from the shared per-source template. Sibling of model3D so it inherits the
    // node transform but is toggled/disposed independently.
    bwModel3D = new Group();
    // True while the box should show: from creation until the GLTF loads, and
    // permanently for models with no source / a failed load. Set by
    // updateMaterialEffect, drives updateModelFallbackMatrixEffect.
    showFallbackBox;
    // 'loading' while the GLTF downloads, 'absent' once it will never load.
    // Set by updateMaterialEffect, picks which stand-in pool shows the box.
    fallbackKind;
    // Lazy slot index MIRRORED across both stand-in pools (always registered in
    // pairs, so the pools yield the same index). -1 until the box is first needed.
    fallbackIndex = -1;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateMaterialEffect,
        updateModelDoorTransformEffect,
        updateModelFallbackMatrixEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.showFallbackBox = view.core.createValue(false);
        this.fallbackKind = view.core.createValue('loading');
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.group.add(this.model3D);
        this.bwModel3D.name = `bwModel3D-${id}`;
        this.group.add(this.bwModel3D);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        unregisterModelFallback(this.view, this);
        this.disposeEffects();
        // Detach the BW subtree before group teardown: its LineSegments2 clones share
        // the cached template geometry and the shared contourLineMaterial, so we must
        // not let disposeNodeGroup -> clearGroup -> disposeMesh dispose them.
        this.bwModel3D.removeFromParent();
        disposeNodeGroup(this.group);
    }
}

class MoldingView {
    id;
    type = NodeType.Molding;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateGeometryEffect,
        updateMaterialEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.gray.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class MountLineView {
    id;
    type = NodeType.MountLine;
    view;
    group = new NodeGroup();
    // Thin flat strip mesh – same pattern as MountPlane, fully WebGPU-compatible
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateGeometryEffect,
        updateMaterialEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        // Reuse the same service material as MountPlane (yellow, semi-transparent)
        this.mesh = new Mesh(new BufferGeometry(), view.storage.get('looks').obj.service.mountUnselected.material);
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class MountPlaneView {
    id;
    type = NodeType.MountPlane;
    view;
    group = new NodeGroup();
    mesh;
    raycastMesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateRaycastMeshGeometryEffect,
        updateGeometryEffect,
        updateMaterialEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.mountUnselected.material);
        this.mesh.renderOrder = 1;
        this.raycastMesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.invisible.material);
        this.raycastMesh.layers.disable(LAYERS.RENDER);
        this.group.add(this.mesh);
        this.group.add(this.raycastMesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class MountPointView {
    id;
    type = NodeType.MountPoint;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateParentIdEffect, updatePositionEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class PanelView {
    id;
    type = NodeType.Panel;
    view;
    group = new NodeGroup();
    mesh;
    line;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new CustomExtrudeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class PartView {
    id;
    type = NodeType.Part;
    view;
    group = new NodeGroup();
    index;
    // Shelf compartments have no geometry subtree — this invisible box is their
    // only raycast target (see updateMultiClosetShelfPartRaycastEffect). Undefined for other parts.
    raycastMesh;
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateInstancedMatrixEffect];
    disposeEffects;
    // Cached at construction time — node may be gone from core by the time dispose() runs.
    instanceManager;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.instanceManager = this.getInstanceManager();
        this.index = this.instanceManager?.register(this) ?? -1;
        // A shelf compartment is an empty opening with no geometry of its own. Give it one invisible
        // pick box (corner-origin unit cube, scaled to the compartment by the effect) so a click in
        // the open space resolves to the compartment; it is only made raycastable while its parent
        // stack is selected. Mirrors MountPlaneView.raycastMesh.
        //
        // Identified by the `multiClosetComponentType` discriminator, NOT by `partType`: every
        // content component (drawer, hanger, compartment) shares `PartType.multiClosetComponentPart`,
        // and only the SHELF one is a geometry-less opening — drawers and hangers render real parts
        // and must not get a pick box.
        const part = getPart(this.view.core, this.id);
        if (part.partType.get() === PartType.multiClosetComponentPart &&
            part.multiClosetComponentType?.get() === MultiClosetComponentType.multiClosetShelfPart) {
            const geometry = new BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
            geometry.computeBoundsTree();
            this.raycastMesh = new Mesh(geometry, this.view.storage.get('looks').obj.service.transparent.material);
            this.group.add(this.raycastMesh);
            this.effects.push(updateMultiClosetShelfPartRaycastEffect);
            this.effects.push(updateMultiClosetShelfPartRenderEffect);
            this.effects.push(updateMultiClosetShelfPartSizeEffect);
        }
        this.disposeEffects = registerNodeViewEffects(this);
    }
    getInstanceManager() {
        const pt = getPart(this.view.core, this.id).partType.get();
        if (pt === PartType.multiClosetSection) {
            return this.view.instanceManagers.get(PartType.multiClosetSection);
        }
        if (pt === PartType.multiClosetSectionContent) {
            return this.view.instanceManagers.get(PartType.multiClosetSectionContent);
        }
        return null;
    }
    dispose() {
        if (this.index !== -1) {
            this.instanceManager?.unregister(this.index);
        }
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class PointLightView {
    id;
    type = NodeType.PointLight;
    view;
    group = new NodeGroup();
    // Intensity 0 at construction — driven by `updateLightEffect` (from LuminousFlux)
    // on first run. distance 200 (inches) cutoff, decay 2 (physical inverse-square).
    light = new PointLight(0xffffff, 0, 200, 2);
    // When true, `updateLightAttachEffect` withholds `light` from `group` until the
    // drag this view was created in ends — a live light joining the scene forces a
    // ~150ms WebGPU shader recompile we don't want mid-drag. Set in the constructor.
    deferLightAttach = false;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRenderLayerEffect,
        updateRotationEffect,
        updateLightEffect,
        updateLightAttachEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        // Defer the light attach only when born mid-drag (catalog instantiation or an
        // existing-node drag). `peek()` is non-reactive — the reactive re-attach lives
        // in `updateLightAttachEffect`.
        this.deferLightAttach = view.core.draggedCatalogPath.peek() !== null || view.core.draggedNodeId.peek() !== null;
        if (!this.deferLightAttach)
            this.group.add(this.light);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

// const geometry = new PlaneGeometry(5, 5);
// geometry.computeBoundsTree();
class PointView {
    id;
    type = NodeType.Point;
    view;
    group = new NodeGroup();
    // mesh: Mesh<BufferGeometry, MeshBasicMaterial | MeshPhysicalMaterial>;
    effects = [updateParentIdEffect, updatePositionEffect, updateRenderLayerEffect, updateRaycastLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        // this.mesh = new Mesh(geometry, this.view.storage.get('looks').obj.service.point.material);
        // this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class RawPanelView {
    id;
    type = NodeType.RawPanel;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect,
        updateGeometryEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.particleBoard.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class ArcRoomSegmentView {
    id;
    type = NodeType.RoomSegment;
    view;
    group = new NodeGroup();
    effects = [updateParentIdEffect, updatePositionEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class BezierRoomSegmentView {
    id;
    type = NodeType.RoomSegment;
    view;
    group = new NodeGroup();
    effects = [updateParentIdEffect, updatePositionEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class LinearRoomSegmentView {
    id;
    type = NodeType.RoomSegment;
    view;
    group = new NodeGroup();
    effects = [updateParentIdEffect, updatePositionEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class RoomView {
    id;
    type = NodeType.Room;
    view;
    group = new NodeGroup();
    effects = [updateParentIdEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class ShapedBoxContainerView {
    id;
    type = NodeType.ShapedBoxContainer;
    view;
    group = new NodeGroup();
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class SpotLightView {
    id;
    type = NodeType.SpotLight;
    view;
    group = new NodeGroup();
    light = new SpotLight(0xffffff, 0, 200, Math.PI / 6, 1, 2);
    deferLightAttach = false;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRenderLayerEffect,
        updateLightEffect,
        updateLightAttachEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        // No shadows (costly on the tile-based iPad GPU). Aim straight down via a
        // target parented to the light, so its matrixWorld follows the group transform
        // (−Y matches the default `target {0,-1,0}` that core drops on import). The
        // target stays a child of `light`, so it defers with it below.
        this.light.castShadow = false;
        this.light.target.position.set(0, -1, 0);
        this.light.add(this.light.target);
        // Defer the light attach only when born mid-drag (catalog instantiation or an
        // existing-node drag). `peek()` is non-reactive — the reactive re-attach lives
        // in `updateLightAttachEffect`.
        this.deferLightAttach = view.core.draggedCatalogPath.peek() !== null || view.core.draggedNodeId.peek() !== null;
        if (!this.deferLightAttach)
            this.group.add(this.light);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class StageView {
    id;
    type = NodeType.Stage;
    view;
    group = new NodeGroup();
    mesh = new Mesh();
    effects = [updateParentIdEffect, updateGeometryEffect, updateRaycastLayerEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new ShapeGeometry(), this.view.storage.get('looks').obj.service.gray.material);
        this.mesh.position.set(0, 0, -0.1);
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class TilesView {
    id;
    type = NodeType.Tiles;
    view;
    group = new NodeGroup();
    mesh;
    effects = [updateParentIdEffect, updatePositionEffect, updateRotationEffect, updateRenderLayerEffect];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        // TODO: not implemented yet
        this.mesh.visible = false;
        this.group.add(this.mesh);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeNodeGroup(this.group);
    }
}

class ToeKickPanelView {
    id;
    type = NodeType.ToeKickPanel;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new CustomExtrudeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class ValanceView {
    id;
    type = NodeType.Valance;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new BufferGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class Wall2DView {
    id;
    type = NodeType.Wall2D;
    view;
    group = new NodeGroup();
    mesh;
    line;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new ShapeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        this.line.visible = false;
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

class WindowFrameView {
    id;
    type = NodeType.WindowFrame;
    view;
    group = new NodeGroup();
    mesh;
    effects = [
        updateParentIdEffect,
        updatePositionEffect,
        updateRotationEffect,
        updateGeometryEffect,
        updateMaterialEffect,
        updateRenderLayerEffect,
        updateRaycastLayerEffect
    ];
    line;
    disposeEffects;
    constructor(view, id) {
        this.id = id;
        this.view = view;
        this.group.name = `${this.constructor.name}-${id}`;
        this.group.uuid = id;
        this.mesh = new Mesh(new CustomExtrudeGeometry(), this.view.storage.get('looks').obj.service.loading.material);
        this.group.add(this.mesh);
        this.line = createContourLine(this.group);
        view.nodes.set(id, this);
        this.disposeEffects = registerNodeViewEffects(this);
    }
    dispose() {
        this.disposeEffects();
        disposeContourLine(this.line);
        disposeNodeGroup(this.group);
    }
}

const Nodes = {
    [NodeType.Floorplan]: FloorplanView,
    [NodeType.Item]: ItemView,
    [NodeType.Part]: PartView,
    [NodeType.Panel]: PanelView,
    [NodeType.Edgebanding]: EdgebandingView,
    [NodeType.Stage]: StageView,
    [NodeType.Wall2D]: Wall2DView,
    [NodeType.Floor2D]: Floor2DView,
    [NodeType.Ceiling2D]: Ceiling2DView,
    [NodeType.Point]: PointView,
    [NodeType.Room]: RoomView,
    [NodeType.AdjustableBox]: AdjustableBoxView,
    [NodeType.AdjustableExtrusion]: AdjustableExtrusionView,
    [NodeType.BoxContainer]: BoxContainerView,
    [NodeType.Carcass]: CarcassView,
    [NodeType.Countertop]: CountertopView,
    [NodeType.CrownMolding]: CrownMoldingView,
    [NodeType.Frame]: FrameView,
    [NodeType.FreeBoxContainer]: FreeBoxContainerView,
    [NodeType.GateFrame]: GateFrameView,
    [NodeType.Glass]: GlassView,
    [NodeType.Image]: ImageView,
    [NodeType.LaminateBox]: LaminateBoxView,
    [NodeType.MiteredPanel]: MiteredPanelView,
    [NodeType.MountPoint]: MountPointView,
    [NodeType.MountLine]: MountLineView,
    [NodeType.MountPlane]: MountPlaneView,
    [NodeType.Molding]: MoldingView,
    [NodeType.PointLight]: PointLightView,
    [NodeType.RawPanel]: RawPanelView,
    [NodeType.ShapedBoxContainer]: ShapedBoxContainerView,
    [NodeType.SpotLight]: SpotLightView,
    [NodeType.Tiles]: TilesView,
    [NodeType.ToeKickPanel]: ToeKickPanelView,
    [NodeType.Valance]: ValanceView,
    [NodeType.WindowFrame]: WindowFrameView
};
const _wallLocalSize = new Vector3();
const _wallCenterWorld = new Vector3();
const _wallCameraPosWorld = new Vector3();
const _wallCameraUpWorld = new Vector3();
const EDITOR2D_CAMERA_OFFSET = 26;
const EDITOR2D_SCALE_FACTOR = 1.35;
// ── Studio-dome environment (see `setupEnvironment`) ───────────────────────────
// All colours are LINEAR radiance, not sRGB: `MeshBasicNodeMaterial.colorNode`
// writes straight into the HalfFloat cube target, which is the renderer's linear
// working space. Values ABOVE 1.0 are intentional and are the whole point — a
// dome that peaks at 1.0 has no headroom above white, so no specular highlight
// can ever form and every glossy surface reads as flat plastic.
//
// The dome is a sum of two smooth, everywhere-continuous terms:
//   1. a three-stop vertical ramp (ground bounce → horizon → zenith), and
//   2. two cosine-power lobes (key + fill) standing in for softboxes.
// Neither term has a discontinuity, so a mirror-like surface sweeping across the
// reflection sees a gradual tone shift — never the hard bright→dark edge that
// `RoomEnvironment`'s emissive ceiling panels produce (the "blinking" this
// environment was originally written to avoid).
// EXPOSURE NOTE — why these numbers are where they are.
//
// For a Lambertian surface three's IBL path resolves to `outgoing = albedo *
// L_env` (the PI in the irradiance and the 1/PI in the Lambert BRDF cancel), so
// each number below is READ DIRECTLY as the screen value a white surface facing
// that part of the dome will reach, before tone mapping. That makes over-lighting
// very easy: the catalog's white melamine is a near-white sRGB texture ⇒ linear
// albedo ≈ 0.87, so a dome averaging ~1.0 puts every panel at ~0.87 and AgX's
// shoulder then compresses shelf tops, fronts and undersides into one flat white.
//
// The ramp is therefore budgeted against three's ACES curve at exposure 0.75
// (see IWebGPU) to land white melamine at roughly:
//
//   shelf top, facing the key  ≈ 0.74 linear → 0.79 display
//   panel front                ≈ 0.40 linear → 0.65 display
//   shelf underside            ≈ 0.14 linear → 0.35 display
//   (scene background 0xf8f7fa           → 0.83 display)
//
// Casework sitting just UNDER the background is deliberate — it reads as an
// object in front of a light backdrop instead of glowing against it — and the
// ~2:1 spread between top and underside is what makes a stack of white shelves
// read as separate shelves rather than one white slab.
//
// The zenith:ground ratio (~5:1) is doing most of that work and is also the
// physical truth: a real room's floor bounce is far dimmer than its ceiling. It
// is the cheapest available substitute for the ambient occlusion and shadowing
// this scene does not yet have — shelf tops catch sky, undersides catch floor.
/** Warm, dim floor bounce at the nadir. ~5:1 darker than the zenith. */
const ENV_GROUND = [0.11, 0.1, 0.092];
/** Neutral band around the horizon — the transition the ramp passes through. */
const ENV_HORIZON = [0.33, 0.335, 0.35];
/** Cool, brightest sky at the zenith. Drives the top-down ambient. */
const ENV_ZENITH = [0.46, 0.49, 0.55];
/**
 * Key "softbox" direction. Shared with the `DirectionalLight` in `init()` so the
 * IBL specular lobe and the direct highlight agree — a key light pointing one way
 * while the environment's brightest region sits somewhere else is one of the most
 * recognisable CG tells.
 */
const ENV_KEY_DIR = new Vector3(300, 600, 400).normalize();
/**
 * Peak radiance of the key lobe. Well above 1.0 on purpose — that headroom is
 * what lets a specular highlight form at all. Note it costs far less diffuse
 * brightness than the number suggests: a cos^N lobe integrates to
 * `intensity * 2 / (N + 2)` over the hemisphere, so at N = 20 this contributes
 * only ~0.27 to a surface pointing straight at it, while still reflecting at its
 * full 3.0 in a glossy panel.
 */
const ENV_KEY_INTENSITY = 3.0;
/** cos^N exponent — larger = tighter softbox. 20 ≈ a ~30° source. */
const ENV_KEY_FOCUS = 20;
/** Slightly warm key, as a real studio strobe through a diffuser reads. */
const ENV_KEY_COLOR = [1.0, 0.97, 0.92];
/**
 * Cool, broad fill from the opposite side — separates form from background.
 * Deliberately weak: a fill strong enough to be obvious also lifts the shadow
 * side back toward the key and undoes the ramp's separation.
 */
const ENV_FILL_DIR = new Vector3(-450, 250, -350).normalize();
const ENV_FILL_INTENSITY = 0.8;
const ENV_FILL_FOCUS = 6;
const ENV_FILL_COLOR = [0.88, 0.93, 1.0];
/**
 * Half-span of the horizon cross-fade, as a fraction of the remapped
 * `t = dir.y * 0.5 + 0.5` range. At `0.5` each smoothstep covers a full
 * hemisphere (`0 → 0.5` and `0.5 → 1`), which is the smoothest the ramp can be:
 * the ground→horizon and horizon→zenith blends occupy every available degree, so
 * there is no band anywhere on the sphere where the gradient steepens. Lower it
 * to concentrate the transition nearer the horizon and pick up more contrast
 * between floor and ceiling — at the cost of a more locatable horizon in glossy
 * reflections.
 */
const ENV_HORIZON_SOFTNESS = 0.5;
class AreaDesigner3D {
    rootElement;
    core;
    viewType = ViewType.designer3D;
    nodes = new Map();
    viewIndex = -1;
    requestAnimationFrameId = 0;
    setViewIndex(viewIndex) {
        this.viewIndex = viewIndex;
    }
    getViewIndex = () => {
        return this.viewIndex;
    };
    canvas;
    pointer = new Vector2$1();
    engine;
    scene = new Scene();
    /**
     * Editor2D wall-clipping state, consumed by the engine's screen-space clip step
     * (see `IWebGPU`). GPU/`ClippingGroup` clipping was abandoned because three's
     * software clip shader (`discard` in a loop) is not honoured by WebKit's WGSL,
     * and the `clippingAlpha` alternative needs MSAA (incompatible with the
     * RenderPipeline here). Instead the engine masks out everything outside the
     * framed wall's left/right screen band in the pipeline's output shader.
     *
     * `e2ClipEnabled` gates the mask (only editor2D on a framed wall). The two
     * world-space points are the wall's left (local x=0) and right (local x=width)
     * edges at mid-height; the engine reprojects them to screen-X each frame so the
     * band tracks camera pan/zoom. Set in `fitEditor2DCameraToWall`; cleared for
     * other modes in `changeAreaGeneralViewModeEffect`.
     */
    e2ClipEnabled = false;
    e2ClipLeftWorld = new Vector3();
    e2ClipRightWorld = new Vector3();
    storage;
    e3Camera;
    e2Camera;
    fCamera;
    wCamera;
    cameras;
    controls;
    controlsData;
    inspector;
    handlers;
    initDone = false;
    isRenderScheduled = false;
    resizeObserver;
    /**
     * RAF coalescing handle for camera-signal writes inside `onChangeControls`.
     *
     * OrbitControls fires `change` on every internal frame of damping / zoom /
     * pan / wheel — which, on ProMotion iPads, can be 120 Hz. Each `change`
     * pushed a fresh `IOrthoCamera` / `IPerspectiveCamera` object into
     * `core.fCameraData` / `core.e3CameraData`, fanning out to every
     * `useSignalEffect` subscribed to the camera signal (FloorPlanUI overlay,
     * `Editor2DUI`, etc.). Even though those effects now coalesce their own
     * DOM writes (see `FloorPlanUI/index.tsx`), the **signal-effect body**
     * still ran 120 Hz, plus `requestRender` was called 120× per second
     * (cheap via `isRenderScheduled`, but still adds GC pressure).
     *
     * By RAF-debouncing the signal write here, downstream `useSignalEffect`s
     * fire at most ~120 Hz aligned with paint, the throttling in FloorPlanUI
     * still applies on top, and the engine renders once per RAF too. Net
     * effect: a single coherent update per visible frame on both backends.
     *
     * IMPORTANT: the `end` event also routes through `onChangeControls`. RAF
     * debouncing is safe because the camera state is read fresh from the
     * Three.js camera object *inside* the RAF callback — the final `end`
     * always wins because it schedules (or merges into) a RAF that captures
     * the camera's then-current state.
     */
    controlsRafId = null;
    /**
     * Camera-focus state (Customize-step part framing).
     *
     * `cameraFocusTween` is the single in-flight GSAP timeline animating the
     * editor3D camera position + orbit target; a new focus/restore kills it first
     * so rapid part taps never stack tweens. `cameraFocusNodeId` is the currently
     * framed part — it guards against re-tweening to the same part on an unrelated
     * effect re-run, and on restore identifies which product to zoom back out to.
     *
     * View state only — the resting matrix is published to `core.e3CameraData` via
     * `onChangeControls` on settle, the same channel an OrbitControls gesture uses;
     * camera pose is never part of undo history.
     *
     * Public because the camera-focus logic lives in `helpers/cameraFocus.ts`
     * (functions taking this view); these fields are its mutable state holder.
     */
    cameraFocusTween = null;
    cameraFocusNodeId = null;
    /**
     * M3D-309 — top-view (floorplan ortho) dimension-focus state, the ortho sibling of
     * `cameraFocusTween` / `cameraFocusNodeId`. A SEPARATE tween because it animates the
     * `fCamera` pan (`controls.target` + position) + `fCamera.zoom`, not the perspective
     * `e3Camera`. View state only — published via `onChangeControls`, never undo history.
     */
    floorplanFocusTween = null;
    floorplanFocusNodeId = null;
    // Guard for point-based framing (a product dimension's own midpoint) — the node-id guard can't
    // dedupe here since a product's several dimensions share one item id but frame different points.
    floorplanFocusPoint = null;
    /**
     * editor3D (perspective) dimension-focus state — the perspective sibling of the floorplan
     * `floorplanFocusTween` / `floorplanFocusNodeId`. A SEPARATE tween slot from the Customize
     * part-framing (`cameraFocusTween`); both animate `e3Camera`, so `animateCameraToSelectionEffect`
     * clears whichever isn't active before dispatching (only one runs at a time). View state only —
     * published via `onChangeControls`, never undo history.
     */
    editor3DFocusTween = null;
    editor3DFocusNodeId = null;
    // Dedupe guard — the focused field's screen point (canvas CSS px). Sibling badges share one node
    // id but occupy different fields, so the id alone can't dedupe; the screen point can.
    editor3DFocusScreenPoint = null;
    /**
     * editor2D (ortho wall-elevation / "front") dimension-focus state — the ortho sibling driving the
     * `e2Camera`. Separate slot again, so it never fights the floorplan / perspective focuses (each
     * animates its own camera). View state only — published via `onChangeControls`, never history.
     */
    editor2DFocusTween = null;
    editor2DFocusNodeId = null;
    editor2DFocusScreenPoint = null;
    /**
     * Tracks the view's lifetime so async `init()` cannot race against `dispose()`.
     *
     * `init()` is fire-and-forget — it awaits `engine.init()` (then sets up the
     * environment), which means `dispose()` can land mid-await (React StrictMode mount → cleanup
     * → mount, or any fast mount/unmount cycle). Without this abort:
     *  - The wheel listener registered AFTER the first await is never removed (the
     *    earlier synchronous `removeEventListener` in `dispose()` finds nothing
     *    attached) — a stale capture-phase wheel handler on `rootElement` ends up
     *    intercepting events and killing OrbitControls zoom.
     *  - `registerEffects()`, the ResizeObserver, controls listeners, and inspector
     *    all leak past disposal.
     *
     * Pattern: `dispose()` calls `lifecycle.abort()` first; `init()` checks
     * `lifecycle.signal.aborted` after every `await` and bails out without any
     * further side effects; `addEventListener` calls that accept a `signal` get the
     * lifecycle signal so the browser auto-removes them on abort (and silently
     * skips adding if abort already happened).
     */
    lifecycle = new AbortController();
    effects = [
        changeStepEffect,
        changeAreaGeneralViewModeEffect,
        changeSelectedObjectEffect,
        animateCameraToSelectionEffect,
        changeHoveredObjectEffect,
        updateControlsEffect,
        updateDraggingEffect,
        updateHoveredNodeMaterialEffect,
        updateItemInstanceMeshRenderLayerEffect,
        updateItemInstanceMeshRaycastLayerEffect,
        updateModelFallbackInstanceMeshRenderLayerEffect,
        updateModelFallbackInstanceMeshRaycastLayerEffect,
        updateOpeningItemInstanceMeshRenderLayerEffect,
        updateOpeningItemInstanceMeshRaycastLayerEffect,
        updateBoxContainerInstanceMeshRenderLayerEffect,
        updateBoxContainerInstanceMeshRaycastLayerEffect,
        updateFreeBoxContainerInstanceMeshRenderLayerEffect,
        updateFreeBoxContainerInstanceMeshRaycastLayerEffect,
        updateMultiClosetFreeBoxContainerInstanceMeshRenderLayerEffect,
        updateMultiClosetFreeBoxContainerInstanceMeshRaycastLayerEffect,
        updateMultiClosetItemInstanceMeshRenderLayerEffect,
        updateMultiClosetItemInstanceMeshRaycastLayerEffect,
        updateMultiClosetSectionInstanceMeshRaycastLayerEffect,
        updateMultiClosetSectionInstanceMeshRenderLayerEffect,
        updateMultiClosetSectionContentInstanceMeshRaycastLayerEffect,
        updateMultiClosetSectionContentInstanceMeshRenderLayerEffect,
        syncNodeViewsEffect,
        resyncMultiClosetNeighborsOnStructureEffect
    ];
    disposeEffects;
    floorGrid;
    // Cube render target backing `scene.environment` (baked once in `setupEnvironment`).
    // Its texture is aliased into the scene, not copied, so the target must live on the
    // instance and be disposed in `dispose()` — otherwise the cubemap + framebuffer leak
    // on every teardown (StrictMode double-mount, navigation away, …).
    envCubeRenderTarget = null;
    instanceManagers;
    constructor(rootElement, core) {
        this.rootElement = rootElement;
        this.core = core;
        threeLog('AreaDesigner3D constructor', this, 905);
        this.storage = new Designer3DStorage(core);
        this.cameras = {
            [GeneralViewMode.floorPlan]: this.fCamera,
            [GeneralViewMode.editor3D]: this.e3Camera,
            [GeneralViewMode.editor2D]: this.e2Camera,
            [GeneralViewMode.walkthrough]: this.wCamera,
            [GeneralViewMode.calculation]: this.e3Camera,
            [GeneralViewMode.print]: this.e3Camera,
            [GeneralViewMode.paperSpace]: this.e3Camera,
            [GeneralViewMode.catalogEditor]: this.e3Camera
        };
        this.controlsData = {
            [GeneralViewMode.floorPlan]: { ...core.controlsData.get() },
            [GeneralViewMode.editor3D]: { ...core.controlsData.get() },
            [GeneralViewMode.editor2D]: { ...core.controlsData.get() },
            [GeneralViewMode.walkthrough]: { ...core.controlsData.get() },
            [GeneralViewMode.calculation]: { ...core.controlsData.get() },
            [GeneralViewMode.print]: { ...core.controlsData.get() },
            [GeneralViewMode.paperSpace]: { ...core.controlsData.get() },
            [GeneralViewMode.catalogEditor]: { ...core.controlsData.get() }
        };
        this.init();
        this.handlers = new Handlers(this);
        // Initialize BoxContainerInstanceManager
        // It needs access to materials, check if they are set yet.
        // Materials are set via setMaterialsFromJSON below.
        // But we need the 'invisible' material from storage.
        // 'looks' are set below too.
        // Changing order might be risky.
        // The manager needs 'invisible' material which is in 'looks'.
        // I should initialize it AFTER setLooksFromJSON.
        const geometry = new BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
        geometry.clearGroups();
        geometry.computeBoundsTree();
        this.instanceManagers = new InstanceManagers();
        this.instanceManagers.register(ItemType.multiCloset, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.red.material));
        this.instanceManagers.register(NodeType.BoxContainer, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.red.material));
        this.instanceManagers.register(PartType.multiClosetSection, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.blue.material));
        this.instanceManagers.register(PartType.multiClosetSectionContent, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.green.material));
        this.instanceManagers.register(NodeType.Item, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.green.material));
        this.instanceManagers.register(NodeType.FreeBoxContainer, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.blue.material));
        // multiCloset FreeBoxContainers get their own instance mesh so the drag raycast
        // layer can be toggled for them independently of plain containers (mirrors the
        // ItemType.multiCloset vs NodeType.Item split above).
        this.instanceManagers.register(FreeBoxContainerType.multiCloset, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.blue.material));
        // Wall-opening items (window + gate) get their own instance mesh so its box
        // proxy can keep the RAYCAST layer enabled (opening selectable everywhere,
        // not just on the thin frame) without making every other item box-selectable.
        // `invisible` material keeps it non-rendering even if RENDER is ever flipped on.
        this.instanceManagers.register(OPENING_ITEM, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.invisible.material));
        // Stand-in boxes for 3D models with no usable geometry — the only pools that
        // render (the rest are invisible hit-proxies): blue `loading` / gray `absent`.
        // Per-instance visibility AND the loading↔absent switch are driven by matrix
        // writes in updateModelFallbackMatrixEffect (active pool gets the world
        // matrix, the other one dummyMatrix).
        this.instanceManagers.register(MODEL_FALLBACK, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.loading.material));
        this.instanceManagers.register(MODEL_ABSENT, new InstanceManager(this.scene, geometry, this.storage.get('looks').obj.service.absent.material));
    }
    createNodeView = (node) => {
        switch (node.type) {
            case NodeType.Floorplan:
            case NodeType.Item:
            case NodeType.Part:
            case NodeType.Panel:
            case NodeType.Edgebanding:
            case NodeType.Stage:
            case NodeType.Wall2D:
            case NodeType.Floor2D:
            case NodeType.Ceiling2D:
            case NodeType.Point:
            case NodeType.Room:
            case NodeType.AdjustableBox:
            case NodeType.AdjustableExtrusion:
            case NodeType.BoxContainer:
            case NodeType.Carcass:
            case NodeType.Countertop:
            case NodeType.CrownMolding:
            case NodeType.Frame:
            case NodeType.FreeBoxContainer:
            case NodeType.GateFrame:
            case NodeType.Glass:
            case NodeType.Image:
            case NodeType.LaminateBox:
            case NodeType.MiteredPanel:
            case NodeType.MountPoint:
            case NodeType.MountLine:
            case NodeType.MountPlane:
            case NodeType.Molding:
            case NodeType.PointLight:
            case NodeType.RawPanel:
            case NodeType.ShapedBoxContainer:
            case NodeType.SpotLight:
            case NodeType.Tiles:
            case NodeType.ToeKickPanel:
            case NodeType.Valance:
            case NodeType.WindowFrame:
                return new Nodes[node.type](this, node.id);
            case NodeType.Model:
                switch (node.modelType) {
                    case ModelType.applianceModel:
                        return new ApplianceModelView(this, node.id);
                    case ModelType.hinge:
                        return new HingeModelView(this, node.id);
                    default:
                        return new OtherModelView(this, node.id);
                }
            case NodeType.RoomSegment:
                switch (node.segmentType) {
                    case SegmentType.linear:
                        return new LinearRoomSegmentView(this, node.id);
                    case SegmentType.arc:
                        return new ArcRoomSegmentView(this, node.id);
                    default:
                        return new BezierRoomSegmentView(this, node.id);
                }
            default:
                throw new Error('Unknown view node type ', node);
        }
    };
    // Node-view creation is handled reactively by syncNodeViewsEffect, which
    // watches core.nodeIds (updated by core.addNode after full construction) and
    // creates NodeViews for new entries. This method is kept as a no-op to
    // satisfy the View interface.
    // public addNode = (_node: Node) => {};
    // Node-view disposal is handled reactively by syncNodeViewsEffect, which
    // watches core.nodeIds and disposes any NodeView whose UUID is no longer
    // present in core. This method is kept as a no-op to satisfy the View
    // interface; other views (calculation, UI) may still use it imperatively.
    // public removeNode = (_node: Node) => {};
    registerEffects() {
        const effectDisposers = [];
        for (const cb of this.effects) {
            effectDisposers.push(this.registerViewEffect(() => cb(this)));
        }
        this.disposeEffects = () => {
            for (const dispose of effectDisposers)
                dispose();
        };
    }
    registerViewEffect(callBack) {
        const dispose = effect(() => {
            const cleanup = callBack();
            this.requestRender();
            if (cleanup && typeof cleanup === 'function') {
                return cleanup;
            }
            return undefined;
        });
        return dispose;
    }
    /**
     * Fit the editor2D orthographic camera so the given wall fills the canvas
     * with the standard padding (see EDITOR2D_SCALE_FACTOR), and clip away
     * everything outside the wall's left/right edges.
     *
     * Wall local frame (from getWall2DShape): X = wall length, Y = wall height,
     * Z = wall outward normal. The camera is placed on +Z, looks at the wall
     * center, with up aligned to the wall's local Y in world space — which
     * reduces to world +Y for vertical walls and stays correct for cathedral
     * and non-axis-aligned walls.
     *
     * Because the contain fit overshoots one axis when the wall/viewport aspect
     * ratios differ, the camera would otherwise show neighbouring walls beside the
     * framed one. We capture the wall's left/right edge world points and enable the
     * engine's screen-space clip step (see `IWebGPU`), which masks out everything
     * outside the wall's projected left/right band — so anything beyond the wall
     * width is removed instead of cropping the wall vertically. The edge points are
     * world-space and the wall doesn't move, so the band stays correct under camera
     * pan/zoom (the engine reprojects them each frame).
     *
     * Final state is published to core.e2CameraData via onChangeControls
     */
    fitEditor2DCameraToWall(wallView) {
        const camera = this.e2Camera;
        wallView.mesh.updateMatrixWorld(true);
        wallView.mesh.geometry.computeBoundingBox();
        const localBox = wallView.mesh.geometry.boundingBox;
        if (!localBox)
            return;
        localBox.getSize(_wallLocalSize);
        const width = _wallLocalSize.x;
        const height = _wallLocalSize.y;
        if (width <= 0 || height <= 0)
            return;
        const matrixWorld = wallView.mesh.matrixWorld;
        _wallCenterWorld.set(width / 2, height / 2, 0).applyMatrix4(matrixWorld);
        _wallCameraPosWorld.set(width / 2, height / 2, EDITOR2D_CAMERA_OFFSET).applyMatrix4(matrixWorld);
        _wallCameraUpWorld.set(0, 1, 0).transformDirection(matrixWorld);
        // Capture the wall's left (local x=0) and right (local x=width) edge world
        // points at mid-height. In the ortho face-on editor2D view every point on an
        // edge projects to the same screen X, so the engine reprojects these two per
        // frame into the clip band [minX, maxX]. Enable the mask.
        this.e2ClipLeftWorld.set(0, height / 2, 0).applyMatrix4(matrixWorld);
        this.e2ClipRightWorld.set(width, height / 2, 0).applyMatrix4(matrixWorld);
        this.e2ClipEnabled = true;
        const W = this.rootElement.clientWidth;
        const H = this.rootElement.clientHeight;
        const zoomX = W / (width * EDITOR2D_SCALE_FACTOR);
        const zoomY = H / (height * EDITOR2D_SCALE_FACTOR);
        camera.position.copy(_wallCameraPosWorld);
        camera.up.copy(_wallCameraUpWorld);
        camera.zoom = Math.min(zoomX, zoomY);
        camera.updateProjectionMatrix();
        this.controls.target.copy(_wallCenterWorld);
        // controls.update() runs lookAt(target) so the camera faces the wall.
        // onChangeControls() then pushes the final zoom + matrix into the
        // e2CameraData signal in one place (the controls 'change' event won't
        // fire reliably when we set everything imperatively above).
        this.controls.update();
        this.onChangeControls();
    }
    updateOrthoCameraFrustum(camera, width, height) {
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
    }
    /**
     * Build paperspace views for every distinct multiCloset `system` in the project, returning them
     * **grouped by systemId** rather than as a flat list. Collects one representative Item per system
     * (systemless closets are skipped), runs {@link createViews} (`multiClosetType: 'system'`) for
     * each, and keys the resulting `IViews` map under its owning system. Runs sequentially so the
     * per-system builders do not contend for the shared renderer's transient target/clear state.
     *
     * The wrapper object shape (`{ views: IViews }` per system — see `IViewsBySystem` in
     * designer-core) is forward-compatible with adding per-system metadata later (label, count,
     * thumbnail, …) without another return-type change.
     *
     * Callers that only need a flat `IViews` map can merge with:
     *   `Object.values(result).reduce<IViews>((acc, { views }) => ({ ...acc, ...views }), {})`
     * Or a flat `IView[]` array with:
     *   `Object.values(result).flatMap(({ views }) => Object.values(views))`
     */
    async createAllViews(opts) {
        return createAllViews(this, opts);
    }
    /**
     * Publishes the renderer viewport size into the core's `viewportWidth` /
     * `viewportHeight` signals. Used by `projectWorld3DToScreen`,
     * `coordinatesToNDC`, and the `FloorPlanUI` overlay so they don't have to
     * force a synchronous `clientWidth` / `clientHeight` layout flush per frame
     * (see the JSDoc on `CoreDesigner.viewportWidth`).
     *
     * Routed through `SetValueCommand` + `runCommandsAsTransaction(…, addToHistory=false)`
     * to respect the project-wide "mutations go through commands" contract
     * (`CLAUDE.md` → §"Structure, scalability, maintainability, expandability basics" → 5).
     * The transaction is **not** added to undo/redo history — viewport size is
     * renderer-driven, not user-driven, so undoing a resize would be nonsense.
     * Wrapping both axes in a single transaction also gives us one `batch()`
     * flush instead of two: signal-effect subscribers (FloorPlanUI overlay,
     * etc.) see one coherent update rather than a torn intermediate state where
     * width has changed but height hasn't.
     */
    publishViewportSize(width, height) {
        this.core.runCommandsAsTransaction([new SetValueCommand(this.core.viewportWidth, width), new SetValueCommand(this.core.viewportHeight, height)], 'Set viewport size', false);
    }
    resize = (width, height) => {
        if (!this.engine || width === 0 || height === 0)
            return;
        this.publishViewportSize(width, height);
        this.engine.resize(width, height);
        this.e3Camera.aspect = width / height;
        this.e3Camera.updateProjectionMatrix();
        // Orthographic cameras require frustum plane updates on resize,
        // not just zoom — aspect ratio is encoded in left/right/top/bottom.
        this.updateOrthoCameraFrustum(this.fCamera, width, height);
        this.updateOrthoCameraFrustum(this.e2Camera, width, height);
        // Camera zoom comes from saved data — only the frustum planes need updating
        // on resize (aspect ratio). Recomputing zoom from scene bounds here caused a
        // race: ResizeObserver fires before registerEffects() runs (scene is still
        // empty), producing a degenerate bounding box and a wrong zoom value.
        this.onChangeControls();
        // this.controls.update();
        this.requestRender();
    };
    /**
     * Routes wheel events under `rootElement` to the canvas as zoom.
     *
     * Wheel events targeted at the canvas itself flow straight through to
     * `OrbitControls` (which registers its own non-passive wheel listener
     * internally) — we skip those. Every other wheel event reaching us has
     * already bubbled past any scrollable subtree without being consumed
     * (scroll-chain pattern — each scroll container handles its own wheel
     * via `stopPropagation` when it can scroll; see e.g. the DetailsPanel
     * handler in `DesignerEntryPoint`). So when we get here, the user is
     * either over an unscrollable element OR at the scroll edge — in both
     * cases zoom is the right behavior.
     *
     * Re-dispatches a synthetic WheelEvent on the canvas rather than
     * calling `OrbitControls.onMouseWheel` directly — that method is
     * private three.js surface and renames between minor versions.
     */
    onWheel = (event) => {
        if (event.target === this.canvas)
            return;
        event.preventDefault();
        event.stopPropagation();
        this.canvas.dispatchEvent(new WheelEvent('wheel', {
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaZ: event.deltaZ,
            deltaMode: event.deltaMode,
            clientX: event.clientX,
            clientY: event.clientY,
            screenX: event.screenX,
            screenY: event.screenY,
            button: event.button,
            buttons: event.buttons,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            bubbles: false,
            cancelable: true
        }));
    };
    /**
     * Schedules a RAF-bounded flush of the current camera state into the
     * matching core signal. See `controlsRafId` docs for the rationale.
     *
     * Multiple `change` events between two RAF boundaries collapse into ONE
     * signal write at the next paint — the flush reads the camera state
     * fresh, so it always captures the latest. `requestRender()` is also
     * scoped inside the RAF so we get at most one render per visible frame.
     *
     * Public because the camera-focus tweens (`helpers/cameraFocus.ts`) publish
     * the resting camera pose through this same channel on settle.
     */
    onChangeControls = () => {
        if (this.controlsRafId !== null)
            return;
        this.controlsRafId = requestAnimationFrame(this.flushControls);
    };
    flushControls = () => {
        this.controlsRafId = null;
        switch (this.core.generalViewMode.get()) {
            case GeneralViewMode.floorPlan:
                {
                    this.fCamera.updateMatrixWorld();
                    this.fCamera.updateProjectionMatrix();
                    this.core.fCameraData.set({
                        left: this.fCamera.left,
                        right: this.fCamera.right,
                        top: this.fCamera.top,
                        bottom: this.fCamera.bottom,
                        near: this.fCamera.near,
                        far: this.fCamera.far,
                        zoom: this.fCamera.zoom,
                        name: '',
                        matrix: this.fCamera.matrix.toArray()
                    });
                }
                break;
            case GeneralViewMode.editor3D:
                {
                    this.e3Camera.updateMatrixWorld();
                    this.e3Camera.updateProjectionMatrix();
                    this.core.e3CameraData.set({
                        aspect: this.e3Camera.aspect,
                        fov: this.e3Camera.fov,
                        zoom: this.e3Camera.zoom,
                        matrix: this.e3Camera.matrix.toArray(),
                        far: this.e3Camera.far,
                        near: this.e3Camera.near,
                        name: ''
                    });
                }
                break;
            case GeneralViewMode.editor2D:
                {
                    this.e2Camera.updateMatrixWorld();
                    this.e2Camera.updateProjectionMatrix();
                    this.core.e2CameraData.set({
                        left: this.e2Camera.left,
                        right: this.e2Camera.right,
                        top: this.e2Camera.top,
                        bottom: this.e2Camera.bottom,
                        near: this.e2Camera.near,
                        far: this.e2Camera.far,
                        zoom: this.e2Camera.zoom,
                        name: '',
                        matrix: this.e2Camera.matrix.toArray()
                    });
                }
                break;
        }
        // Persist the live OrbitControls target alongside the camera pose above.
        // Pan/orbit moves BOTH the camera and the target; the camera pose is
        // captured in the *CameraData matrix, but the target lives only on the
        // controls and was previously mirrored into `core.controlsData` only at
        // load and on mode switch. Without syncing it here, `saveArea` serialises
        // the stale load-time target, so on reload the restored camera is forced
        // to `lookAt` the old center — tilting the floorplan ortho view into an
        // oblique, re-centered projection. `core.controlsData` has no reactive
        // subscribers, so this write only feeds save/restore.
        const viewMode = this.core.generalViewMode.get();
        if (viewMode === GeneralViewMode.floorPlan ||
            viewMode === GeneralViewMode.editor3D ||
            viewMode === GeneralViewMode.editor2D) {
            const prevControls = this.core.controlsData.get();
            this.core.controlsData.set({
                minDistance: prevControls.minDistance,
                maxDistance: prevControls.maxDistance,
                target: { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z }
            });
        }
        this.requestRender();
    };
    initPerspectiveCamera(cameraData) {
        const { fov, zoom, matrix, name } = cameraData;
        const camera = new PerspectiveCamera(fov, this.rootElement.clientWidth / this.rootElement.clientHeight, 1, 1000);
        camera.layers = renderLayers;
        camera.name = name;
        camera.zoom = zoom;
        camera.matrix.fromArray(matrix);
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
        return camera;
    }
    initOrthographicCamera(cameraData) {
        const { zoom, name, matrix } = cameraData;
        const camera = new OrthographicCamera();
        camera.layers = renderLayers;
        camera.left = -this.rootElement.clientWidth / 2;
        camera.right = this.rootElement.clientWidth / 2;
        camera.top = this.rootElement.clientHeight / 2;
        camera.bottom = -this.rootElement.clientHeight / 2;
        camera.near = 1;
        camera.far = 1000;
        camera.name = name;
        camera.zoom = zoom;
        // Restore camera position from the converter-provided matrix.
        // Three.js Matrix4 stores translation at column-major indices [12, 13, 14].
        // Orientation is set later by OrbitControls.update() → camera.lookAt(target).
        camera.position.set(matrix[12], matrix[13], matrix[14]);
        camera.updateProjectionMatrix();
        return camera;
    }
    getCamera = () => {
        const viewMode = this.core.generalViewMode.get();
        switch (viewMode) {
            case GeneralViewMode.floorPlan:
                return this.fCamera;
            case GeneralViewMode.editor3D:
            default:
                return this.e3Camera;
            case GeneralViewMode.editor2D:
                return this.e2Camera;
            case GeneralViewMode.walkthrough:
                return this.wCamera;
        }
    };
    async init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'CANVAS3D';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.touchAction = 'none';
        this.rootElement.appendChild(this.canvas);
        this.e3Camera = this.initPerspectiveCamera(this.core.e3CameraData.get());
        this.wCamera = this.initPerspectiveCamera(this.core.wCameraData.get());
        this.e2Camera = this.initOrthographicCamera(this.core.e2CameraData.get());
        this.fCamera = this.initOrthographicCamera(this.core.fCameraData.get());
        const viewMode = this.core.generalViewMode.get();
        const { target, maxDistance, minDistance } = this.controlsData[viewMode];
        this.controls = new OrbitControls(this.e3Camera, this.canvas);
        this.controls.target.set(target.x, target.y, target.z);
        this.controls.maxDistance = Math.min(maxDistance, 2000);
        this.controls.minDistance = Math.max(minDistance, 1);
        this.controls.minZoom = 1;
        this.controls.maxZoom = 100;
        this.controls.enableDamping = false;
        this.engine = new IWebGPU(this, this.canvas);
        // threeLog('WebGPURenderer using');
        // TODO: check is WebGPU available by console.warn
        await this.engine.init();
        // If `dispose()` landed during the engine.init() await, abandon the rest of
        // init: `dispose()` already ran (or is about to), and any side-effects we
        // attach below would leak past the view's lifetime. `engine.init()` may have
        // partially allocated the WebGPU device; dispose() handles its teardown.
        if (this.lifecycle.signal.aborted)
            return;
        this.initDone = true;
        this.inspector = new DesignerInspector(this.rootElement, this.engine.renderer);
        this.engine.initPostProcessing();
        // Transparent canvas — background comes from the host div in CSS
        // Match the CSS canvas background (#f8f7fa) — post-processing pipelines
        // (WebGPU RenderPipeline / WebGL EffectComposer) don't preserve canvas alpha
        // through their internal render targets, so we set the colour here instead.
        this.scene.background = new Color(0xf8f7fa);
        // Exponential fog — color matches background so the grid fades naturally
        // into the background at the edges. Density tuned for typical room scale (cm).
        // FogExp2 formula: opacity = 1 - exp(-density² * distance²)
        // At ~800 cm from centre the grid is ~85% fogged, room stays clear.
        // this.scene.fog = new FogExp2(0xf8f7fa, 0.0006);
        // ── Lighting ─────────────────────────────────────────────────────────────
        // Effectively ALL of the lighting comes from `scene.environment` — the studio
        // dome baked in `setupEnvironment`, scaled by `scene.environmentIntensity`
        // there (NOT the materials' `envMapIntensity`, which only applies when a
        // material has its OWN `envMap`; ours use `scene.environment`, so three uses
        // `scene.environmentIntensity`).
        //
        // There is deliberately NO AmbientLight. Flat ambient adds equal irradiance
        // from every direction, which is exactly the term the dome's ground→zenith
        // ramp and its two lobes exist to replace: mixing the two back together
        // washes out the directional structure and re-flattens every recess and
        // crevice. The dome's ground-bounce floor (~0.2 linear at the nadir) already
        // guarantees nothing goes black.
        //
        // A DirectionalLight is parallel: `position` sets only the incoming angle;
        // its magnitude is irrelevant and, because there is no distance falloff, the
        // inch-vs-metre world-scale issue never touches it (unlike Point/Spot lights).
        // It is kept, aligned EXACTLY with the dome's key lobe (`ENV_KEY_DIR`), for
        // two reasons: it puts a crisp specular core inside the lobe's soft halo, and
        // it is the light a shadow map would hang off if contact shadows are added
        // later. Intensity is low because the lobe now carries most of the key —
        // a mismatch here (bright directional from one side, bright environment from
        // another) is one of the most recognisable CG tells. No shadow map yet: the
        // extra render target is costly on the tile-based iPad GPU.
        // Intensity is low both because the lobe carries the key and because three's
        // directional term is `intensity * dotNL / PI` for a Lambert surface — 0.35
        // adds only ~0.09 to a face pointing at it, which is the intent: a crisp core
        // inside the lobe's halo, not a second broad light source competing with it.
        const keyLight = new DirectionalLight(0xffffff, 0.35);
        keyLight.position.copy(ENV_KEY_DIR).multiplyScalar(1000);
        this.scene.add(keyLight);
        // ── Floor grid — TSL shader plane matching the SVG reference (100/25) ────
        // A single plane drawn with a node material computes a two-level grid in
        // the fragment shader. Unlike LineSegments (GridHelper), screen-space
        // derivatives (fwidth) give true, constant pixel-width lines, so we can
        // reproduce the SVG's thin-fine / thick-bold hierarchy that GPU line width
        // alone can't express. The TSL graph runs on both the WebGPU primary path
        // and the WebGL2 fallback from the same source. The plane sits fractionally
        // below Y=0 so the room floor always renders cleanly on top.
        // Anti-aliased coverage (0..1) of the nearest grid line on either axis.
        // `spacing` is the cell size in world units; `halfWidthPx` is half the
        // rendered line width. `fwidth` keeps that width ~constant in device pixels
        // regardless of camera distance, so lines stay crisp like the flat SVG
        // instead of fading out with perspective.
        const axisGridCoverage = (spacing, halfWidthPx) => {
            const cellX = positionWorld.x.div(spacing);
            const cellZ = positionWorld.z.div(spacing);
            const distX = abs(fract(cellX.sub(0.5)).sub(0.5)).div(fwidth(cellX));
            const distZ = abs(fract(cellZ.sub(0.5)).sub(0.5)).div(fwidth(cellZ));
            return oneMinus(min(min(distX, distZ).div(halfWidthPx), float(1)));
        };
        // SVG small-grid: 25-unit cells, ~1px stroke. Faded slightly so the thin
        // lines read lighter than the bold ones, exactly as they do in the SVG.
        const fineCoverage = axisGridCoverage(25, 1);
        // SVG bold-grid: 100-unit cells (4 fine cells per section), ~2px stroke.
        const boldCoverage = axisGridCoverage(100, 5).mul(0.6);
        // Radial fade so the far field dissolves into the background instead of
        // shimmering — the plane is large but only the near field is drawn.
        const radialFade = oneMinus(smoothstep(1400, 2400, length(positionWorld.xz)));
        // One light-lavender colour for both grids, as in the SVG (which separates
        // them by stroke width, not colour). Kept dark enough to stay visible on
        // the #f8f7fa scene background; the fine/bold hierarchy comes from width.
        const gridMaterial = new MeshBasicNodeMaterial({
            color: 0xd2cdde,
            transparent: true,
            depthWrite: false,
            side: DoubleSide
        });
        gridMaterial.opacityNode = max(fineCoverage, boldCoverage).mul(radialFade);
        this.floorGrid = new Mesh(new PlaneGeometry(5000, 5000), gridMaterial);
        this.floorGrid.rotation.x = -Math.PI / 2;
        this.floorGrid.position.y = -0.15;
        this.floorGrid.layers.set(0);
        this.scene.add(this.floorGrid);
        this.controls.addEventListener('change', this.onChangeControls);
        this.controls.addEventListener('end', this.onChangeControls);
        // Forward every wheel event that lands on any overlay child (HTML widgets
        // from @moon/designer-ui — corner points, dimensions, draggable walls,
        // multi-closet sections, etc.) back to the canvas so OrbitControls handles
        // it as camera zoom. Without this, wheel + ctrlKey (the trackpad-pinch
        // signal on macOS / Windows precision touchpads) triggers the browser's
        // default page-zoom whenever the cursor is over an overlay element with
        // `pointer-events: auto`. `touch-action: none` only suppresses native
        // touch gestures and does NOT cover the wheel-pinch path.
        //
        // - Bubble phase, NOT capture — descendant scrollable subtrees
        //   (e.g. the DetailsPanel wheel handler in `DesignerEntryPoint`)
        //   need to `stopPropagation` BEFORE we receive the event when they
        //   can still scroll. Capture phase would intercept too early and
        //   break the scroll-chain pattern (M3D-241).
        // - `passive: false` is required to call preventDefault(); browsers
        //   default wheel listeners to passive.
        // - `signal: this.lifecycle.signal` ties the listener to the view's
        //   lifetime — `dispose()` aborts the controller and the browser removes
        //   the listener atomically. Replaces the previous manual
        //   removeEventListener path, which silently failed when `init()` landed
        //   the listener AFTER `dispose()` had already run.
        this.rootElement.addEventListener('wheel', this.onWheel, {
            passive: false,
            signal: this.lifecycle.signal
        });
        // ResizeObserver fires for any layout change that affects rootElement —
        // window resize, devtools open/drag, CSS changes — unlike window 'resize'.
        this.resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            this.resize(width, height);
        });
        this.resizeObserver.observe(this.rootElement);
        // Prime the viewport signals synchronously from the current layout.
        // `ResizeObserver` fires asynchronously after the first paint, so without
        // this, FloorPlanUI's first scaleX computation would see viewportWidth=0
        // and short-circuit; the overlay would render blank until the observer
        // fired one frame later. Reading `clientWidth` once at init is fine —
        // the hot-path layout flush is what we're eliminating from the render
        // loop, not the one-shot startup read.
        this.publishViewportSize(this.rootElement.clientWidth, this.rootElement.clientHeight);
        this.setupEnvironment();
        // Same guard as after engine.init(): if dispose happened during async init,
        // don't register reactive effects or schedule a render.
        if (this.lifecycle.signal.aborted)
            return;
        this.registerEffects();
        this.requestRender();
        threeLog('AreaDesigner3D started with render on demand');
    }
    /**
     * Image-based lighting from a neutral studio environment.
     *
     * The classic `PMREMGenerator` can't run on `WebGPURenderer` — it reaches into
     * WebGL-only state (`renderer.state.buffers`) and throws. The WebGPU way is to
     * bake `RoomEnvironment` into a cube render target with `CubeCamera` (which is
     * WebGPU-coordinate aware), then assign the cube texture to `scene.environment`.
     * The node lighting system (`EnvironmentNode`) wraps it in `pmremTexture()`
     * automatically, so reflections are roughness-prefiltered on BOTH the WebGPU
     * and WebGL2 backends — no manual PMREM step. A raw, non-prefiltered cube would
     * reflect sharply at every roughness level (the mirror-like / too-bright look).
     *
     * This mirrors three's own `CubeRenderTarget.fromEquirectangularTexture` path.
     * Assigned to `scene.environment`, so every `MeshPhysicalMaterial` picks it up
     * automatically, scaled by its `envMapIntensity`.
     */
    setupEnvironment() {
        try {
            const renderer = this.engine.renderer;
            // Studio-dome environment. Same "no hard edges anywhere" contract as the
            // flat gradient it replaces — `RoomEnvironment`'s emissive ceiling panels
            // have a step discontinuity, and a low-roughness horizontal face (an
            // appliance top, a gloss melamine door) mirrors that step almost directly,
            // so orbiting sweeps the reflection vector across it and flashes the whole
            // face ("blinking"). Every term below is C¹-continuous over the sphere, so
            // the same sweep produces a gradual tone shift instead.
            //
            // What it adds over the flat gradient: real dynamic range (the key lobe
            // peaks ~5× above white, so highlights can actually form) and azimuthal
            // structure (the old ramp was rotationally symmetric about Y, which means
            // every vertical face in the room received identical environment irradiance
            // no matter which way it pointed — the single biggest cause of the flat,
            // "everything is the same shade" read).
            //
            // Built as an inward-facing sphere whose unlit colour is a function of view
            // direction, baked through the same CubeCamera path so it still PMREM-
            // prefilters and works on both the WebGPU and WebGL2 backends.
            const envScene = new Scene();
            const envGeometry = new SphereGeometry(100, 32, 16);
            const envMaterial = new MeshBasicNodeMaterial({ side: BackSide });
            // The cube camera sits at the origin and the sphere is centred there, so
            // `normalize(positionWorld)` is exactly the ray direction through this
            // fragment — the sphere's tessellation does not affect the result.
            const dir = positionWorld.normalize();
            // ── 1. Vertical ramp: ground bounce → horizon → zenith ──────────────────
            // Remap dir.y ∈ [-1 (nadir) .. +1 (zenith)] to [0..1] and run two
            // smoothsteps that meet at the horizon (t = 0.5). Both reach their endpoint
            // with zero derivative, so the two halves join smoothly — no horizon line
            // is ever resolvable in a reflection, at any roughness.
            const t = dir.y.mul(0.5).add(0.5);
            const softness = ENV_HORIZON_SOFTNESS;
            const lower = mix(vec3(...ENV_GROUND), vec3(...ENV_HORIZON), smoothstep(0.5 - softness, 0.5, t));
            const base = mix(lower, vec3(...ENV_ZENITH), smoothstep(0.5, 0.5 + softness, t));
            // ── 2. Two cosine-power lobes standing in for softboxes ─────────────────
            // `max(dot(dir, L), 0) ^ N` is smooth everywhere and falls to zero with a
            // zero-slope tail, so unlike a rectangular area light it has no silhouette
            // to catch. Larger N = tighter source = sharper (but still soft) highlight.
            const keyLobe = dir
                .dot(vec3(ENV_KEY_DIR.x, ENV_KEY_DIR.y, ENV_KEY_DIR.z))
                .max(0)
                .pow(ENV_KEY_FOCUS);
            const fillLobe = dir
                .dot(vec3(ENV_FILL_DIR.x, ENV_FILL_DIR.y, ENV_FILL_DIR.z))
                .max(0)
                .pow(ENV_FILL_FOCUS);
            envMaterial.colorNode = base
                .add(vec3(...ENV_KEY_COLOR).mul(keyLobe.mul(ENV_KEY_INTENSITY)))
                .add(vec3(...ENV_FILL_COLOR).mul(fillLobe.mul(ENV_FILL_INTENSITY)));
            const envMesh = new Mesh(envGeometry, envMaterial);
            envScene.add(envMesh);
            this.envCubeRenderTarget = new CubeRenderTarget(256, { type: HalfFloatType });
            const cubeCamera = new CubeCamera(0.1, 1000, this.envCubeRenderTarget);
            // MRT is configured on the post-processing pipelines; null it for the
            // off-screen cube bake and restore after — the same guard three applies
            // internally before driving a CubeCamera.
            const currentMRT = renderer.getMRT();
            renderer.setMRT(null);
            cubeCamera.update(renderer, envScene);
            renderer.setMRT(currentMRT);
            // The render target's texture is aliased into scene.environment (not copied),
            // so we do NOT dispose the target here — it is stored on the instance and
            // disposed in dispose() (see `envCubeRenderTarget`).
            this.scene.environment = this.envCubeRenderTarget.texture;
            // Scales the IBL. The materials are built with `envMap: null` (they read the
            // scene environment), and three's node path uses `scene.environmentIntensity`
            // in that case — NOT material.envMapIntensity (see MaterialProperties
            // `materialEnvIntensity`). At 1.0 the dome is the scene's PRIMARY light
            // source, which is the point: the relative brightness of the ramp and the
            // lobes above is already the lighting design, so scaling it down (the old
            // 0.3) just flattened everything back toward the AmbientLight and handed the
            // look to the single DirectionalLight. Adjust the constants above to change
            // the lighting; adjust this only for overall exposure.
            this.scene.environmentIntensity = 1.0;
            // One-shot bake — the gradient scene is no longer needed; release it.
            envGeometry.dispose();
            envMaterial.dispose();
            threeLog('Environment set from smooth gradient (cube bake)');
        }
        catch (e) {
            getMonitor().error('Failed to set up environment', e instanceof Error ? e : null);
        }
    }
    requestRender = () => {
        if (this.isRenderScheduled || !this.initDone)
            return;
        this.isRenderScheduled = true;
        this.requestAnimationFrameId = requestAnimationFrame(this.animate);
    };
    animate = () => {
        this.isRenderScheduled = false;
        const needsUpdate = this.controls.update();
        this.engine.render();
        this.inspector.onRender();
        if (needsUpdate) {
            this.requestRender();
        }
    };
    dispose() {
        // Abort the lifecycle FIRST: this both
        //  (a) signals any in-flight `init()` await to bail out before attaching
        //      further side-effects (controls listeners, ResizeObserver, env-map,
        //      registerEffects, …), and
        //  (b) auto-removes every addEventListener registered with
        //      `{ signal: this.lifecycle.signal }` — currently the rootElement
        //      wheel listener. This replaces the previous manual
        //      `rootElement.removeEventListener('wheel', this.onWheel, …)`, which
        //      silently failed when init() landed the listener AFTER dispose() had
        //      already run.
        this.lifecycle.abort();
        cancelAnimationFrame(this.requestAnimationFrameId);
        if (this.controlsRafId !== null) {
            cancelAnimationFrame(this.controlsRafId);
            this.controlsRafId = null;
        }
        disposeCameraFocus(this);
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.disposeEffects) {
            this.disposeEffects();
        }
        this.isRenderScheduled = false;
        if (this.floorGrid) {
            this.scene.remove(this.floorGrid);
            this.floorGrid.geometry.dispose();
            this.floorGrid.material.dispose();
        }
        // Free the cubemap + framebuffer backing the environment. Clear the scene's
        // reference first so nothing samples a disposed texture, then dispose the
        // render target (its texture IS `scene.environment`). Must run before
        // `engine.dispose()` tears the renderer down.
        if (this.envCubeRenderTarget) {
            this.scene.environment = null;
            this.envCubeRenderTarget.dispose();
            this.envCubeRenderTarget = null;
        }
        if (this.engine) {
            this.engine.renderer.setAnimationLoop(null);
            this.engine.dispose();
        }
        if (this.controls) {
            this.controls.removeEventListener('change', this.onChangeControls);
            this.controls.removeEventListener('end', this.onChangeControls);
            this.controls.dispose();
        }
        if (this.inspector) {
            this.inspector.dispose();
        }
        if (this.handlers) {
            this.handlers.dispose();
        }
        if (this.canvas) {
            this.canvas.remove();
        }
        threeLog('AreaDesigner3D disposed');
    }
}

/**
 * Generate paperspace `IView` exports for every multiCloset system in the project, **grouped by
 * systemId** (`IViewsBySystem` — see designer-core for the shape). Delegates to the registered
 * designer3D view. The caller is responsible for persisting / displaying the returned views —
 * this helper only renders them.
 *
 * Returns `{}` when no designer3D view is registered yet (legitimate transient state during app
 * startup, before the renderer has mounted), or when the registered view doesn't implement the
 * `createAllViews` capability (e.g. a test stub).
 *
 * Callers that need a flat `IView[]` list can:
 *   `Object.values(result).flatMap(({ views }) => Object.values(views))`
 * — note `views` is a `Record<UUID, IView>` (`IViews`), NOT an array, so `flatMap(g => g.views)`
 * would produce garbage. The inner `Object.values(views)` is required.
 */
async function generatePaperSpaceViews(core, opts) {
    const view = core.getViewByType(ViewType.designer3D);
    if (!view)
        return {};
    // Narrow to the renderer-specific contract. The runtime guard catches the
    // edge case where a non-Designer3DView is ever registered under the
    // designer3D `ViewType` (e.g. a minimal test stub or legacy view).
    const designer3DView = view;
    if (typeof designer3DView.createAllViews !== 'function')
        return {};
    return designer3DView.createAllViews(opts);
}

/**
 * Rebuilds a `PointerEvent` with `offsetX` / `offsetY` relative to `canvas`
 * while keeping viewport `clientX` / `clientY`. Use when the listener is on
 * `window` or another element — native `offsetX` would be wrong for
 * `updatePointer` / raycasting on the 3D canvas.
 */
function toCanvasPointerEvent(canvas, native, options) {
    const rect = canvas.getBoundingClientRect();
    const ev = new PointerEvent(native.type, {
        bubbles: options?.bubbles ?? true,
        cancelable: options?.cancelable ?? true,
        clientX: native.clientX,
        clientY: native.clientY,
        pointerId: native.pointerId,
        pointerType: native.pointerType,
        isPrimary: native.isPrimary,
        button: native.button,
        buttons: native.buttons
    });
    Object.defineProperty(ev, 'offsetX', { value: native.clientX - rect.left });
    Object.defineProperty(ev, 'offsetY', { value: native.clientY - rect.top });
    return ev;
}

const designer3dVersion = '0.0.6';
// test code version 0.0.1

export { AreaDesigner3D, designer3dVersion, generatePaperSpaceViews, toCanvasPointerEvent };
