import { Room } from '../components/Node/components/Room';
export type CeilingLocalTransform = {
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
 * Single source of truth for the local pose of a `Ceiling2D` node relative
 * to its parent `Room`.
 *
 * Consumed by:
 * - `getMatrixWorld` (composes the world matrix used for hit-testing,
 *   `getNodePlane`, screen projection, etc.),
 * - `updateCeilingTransformEffect` (drives the Three.js group transform).
 *
 * Modes:
 * - **Flat**: ceiling geometry is a 2D `ShapeGeometry` built in XY at z = 0.
 *   We translate it up to `WallHeight` and flip it (`rotation.x = π`) so the
 *   shaded side faces down into the room.
 * - **Cathedral**: each facet mesh is already authored in floorplan-local 3D
 *   (XY in the floor plane, per-vertex Z). The group must therefore stay at
 *   identity — any extra translation/rotation here would be applied twice.
 *
 * NOTE: For cathedral ceilings, "the ceiling pose" is conceptually undefined
 * (there is no single plane). Callers that need a per-surface pose for
 * mounting/hit-testing should target the per-facet `MountPlane` children
 * instead of the `Ceiling2D` node itself.
 */
export declare const getCeilingLocalTransform: (room: Room) => CeilingLocalTransform;
export default getCeilingLocalTransform;
