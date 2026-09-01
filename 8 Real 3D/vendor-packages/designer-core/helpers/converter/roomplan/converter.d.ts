import { AppData, UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
import { type ConfidenceLevel } from './coordinates';
import type { CapturedRoom } from './types';
export declare const FLOORPLAN_ID: UUID;
export declare const STAGE_ID: UUID;
export type ConvertCapturedRoomOptions = {
    /**
     * Minimum RoomPlan confidence level to accept a floor surface.
     * Surfaces below this threshold are skipped with a console.warn.
     * Defaults to 'low' (accept all).
     */
    confidenceThreshold?: ConfidenceLevel;
    /**
     * Back-face wall-snap tolerance in designer units (cm).
     *
     * After all parent-based routing rules resolve an object to the floor
     * MountPlane, the object's back face (center of the local -Z face,
     * i.e. `position - halfDepth * col2_axis`) is tested against every wall
     * plane. If the nearest wall is within this distance the object is
     * re-routed to that wall MountPlane instead.
     *
     * 2 cm is chosen to absorb typical RoomPlan positional scan noise
     * (~1–1.5 cm) while being tight enough to exclude furniture with even
     * a small gap from the wall.
     *
     * Defaults to 2.
     */
    wallSnapTolerance?: number;
};
/**
 * Pure function — converts Apple RoomPlan `CapturedRoom` JSON into a complete
 * `AppData` object that can be loaded directly into a new designer room via
 * `CoreDesigner.setAppDataFromJSON`.
 *
 * - Uses fixed well-known UUIDs for Floorplan and Stage nodes.
 * - Generates fresh UUIDs for all other nodes (rooms, points, segments, …).
 * - Reads `floors[0].polygonCorners` for the room boundary.
 *   If the floor is missing or has fewer than 3 corners, a warning is emitted
 *   and an AppData with an empty Stage is returned.
 */
export declare function convertCapturedRoom(core: CoreDesigner, data: CapturedRoom, options?: ConvertCapturedRoomOptions): AppData;
/**
 * Places detected RoomPlan objects as designer Items on the appropriate MountPlane.
 *
 * Must be called AFTER `core.setAppDataFromJSON(convertCapturedRoom(data))` so that
 * the floorplan graph is loaded into the designer.
 *
 * Mount-plane routing rules (in order):
 *  1. parentIdentifier === null          → floor MountPlane (free-standing default)
 *  2. parent is another RoomPlan object  → floor MountPlane (child item, e.g. sink in a cabinet)
 *  3. parent is a floor surface          → floor MountPlane
 *  4. parent is a wall surface           → nearest wall MountPlane (plane-distance lookup)
 *  5. parent is a door/window/opening    → nearest wall MountPlane (wall-adjacent)
 *  6. unknown parent                     → floor MountPlane + console.warn
 */
export declare function applyRoomPlanProducts(core: CoreDesigner, data: CapturedRoom, options?: ConvertCapturedRoomOptions): void;
