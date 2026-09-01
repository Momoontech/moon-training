import { Node, Point } from '../components/Node';
import { RoomSegment } from '../components/Node/components/RoomSegment';
import { UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
import { Vector2, Vector3 } from './math';
export declare const projectVector3ToNDC: (_core: CoreDesigner, v3: Vector3, sceneOffset?: Vector3) => Vector2;
export declare const projectVector3: (core: CoreDesigner, v3: Vector3, sceneOffset?: Vector3) => Vector2;
export declare const projectNodeToNDC: (node: Node, sceneOffset?: Vector3) => Vector2;
export declare const getNodeSceneOffset: (node: Node) => Vector3;
export declare const getNodeScreenOffset: () => Vector2;
export declare const projectNode: (core: CoreDesigner, nodeId: Node | UUID, sceneOffset?: Vector3) => Vector2;
export declare const getSegmentSceneOffset: (segment: RoomSegment) => Vector3;
export declare const getPointSceneOffset: (point: Point) => Vector3;
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
export declare const projectWorld3DToNDC: (core: CoreDesigner, world: Vector3, out?: Vector3) => Vector3;
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
export declare const projectWorld3DToScreen: (core: CoreDesigner, world: Vector3) => {
    x: number;
    y: number;
};
