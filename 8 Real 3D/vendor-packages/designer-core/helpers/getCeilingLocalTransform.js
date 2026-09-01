import { CeilingType } from '../declarations/SurfaceSettings.js';
import getAttributeValue from './getAttributeValue.js';

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
const getCeilingLocalTransform = (room) => {
    const ctx = room.cathedralContext.value;
    if (ctx.type !== CeilingType.Flat) {
        return {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        };
    }
    const wallHeight = getAttributeValue(room, 'WallHeight');
    return {
        position: { x: 0, y: 0, z: wallHeight },
        rotation: { x: Math.PI, y: 0, z: 0 }
    };
};

export { getCeilingLocalTransform };
