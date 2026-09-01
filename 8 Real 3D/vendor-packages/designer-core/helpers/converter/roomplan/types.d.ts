/**
 * TypeScript mirror of the serialized Apple RoomPlan `CapturedRoom` JSON schema.
 *
 * Key structural notes (confirmed from real scan data):
 *  - `category` and `confidence` are discriminated-union objects, NOT plain strings.
 *  - `transform` is a column-major simd_float4x4 flattened to 16 numbers.
 *  - Surface `dimensions` is [length, height, thickness] — thickness may be 0 in older scans.
 *  - Object `dimensions` is [width, height, depth] — bounding box in the object's local frame.
 *  - `polygonCorners` is always empty for walls; always populated for floors.
 *  - Swift's `washerDryer` enum case serialises as "washerDryer" in JSON (not "washer").
 *  - `CapturedRoom.Section` JSON has no `identifier` field (confirmed from real scans).
 */
import type { UUID } from '../../../declarations';
/** simd_float4x4 as a flat column-major 16-element array. */
export type SimdFloat4x4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
/** simd_float3 as a 3-element tuple [x, y, z]. */
export type SimdFloat3 = [number, number, number];
export type RoomPlanConfidence = {
    high: Record<string, never>;
} | {
    medium: Record<string, never>;
} | {
    low: Record<string, never>;
};
export type RoomplanSurface = {
    identifier: string;
    parentIdentifier: string | null;
    confidence: RoomPlanConfidence;
    /** Column-major simd_float4x4: col0=localX, col1=localY, col2=normal, col3=center. */
    transform: SimdFloat4x4;
    /** [length, height, thickness] in meters. Thickness may be 0 for older scans. */
    dimensions: SimdFloat3;
    /**
     * Local-plane polygon corners in meters.
     * Always empty [] for walls. Always populated (4–8+ pts) for floors.
     * The z component is negligible floating-point noise (~0) for floor surfaces.
     */
    polygonCorners: SimdFloat3[];
    curve: null;
    story: number;
};
export type RoomplanWall = RoomplanSurface & {
    category: {
        wall: Record<string, any>;
    };
};
export type RoomplanFloor = RoomplanSurface & {
    category: {
        floor: Record<string, any>;
    };
};
export type RoomplanDoor = RoomplanSurface & {
    category: {
        door: {
            isOpen: boolean;
        };
    };
};
export type RoomplanWindow = RoomplanSurface & {
    category: {
        window: Record<string, any>;
    };
};
export type RoomplanOpening = RoomplanSurface & {
    category: {
        opening: Record<string, any>;
    };
};
/** Attributes for `chair` objects (ChairType, ChairLegType, ChairArmType, ChairBackType). */
export type ChairAttributesJSON = {
    ChairType?: 'dining' | 'stool' | 'swivel' | 'unidentified';
    ChairLegType?: 'four' | 'star' | 'unidentified';
    ChairArmType?: 'existing' | 'missing';
    ChairBackType?: 'existing' | 'missing';
};
/** Attributes for `table` objects (TableType, TableShapeType). */
export type TableAttributesJSON = {
    TableType?: 'dining' | 'coffee' | 'unidentified';
    TableShapeType?: 'rectangular' | 'circularElliptic' | 'lShaped' | 'unidentified';
};
/** Attributes for `storage` objects (StorageType). */
export type StorageAttributesJSON = {
    StorageType?: 'cabinet' | 'shelf';
};
/** Attributes for `sofa` objects (SofaType). */
export type SofaAttributesJSON = {
    SofaType?: 'rectangular' | 'singleSeat' | 'lShaped' | 'lShapedExtension' | 'unidentified';
};
type RoomplanObjectShared = {
    identifier: UUID;
    /** UUID of a parent object or surface, or null for top-level objects. */
    parentIdentifier: UUID | null;
    confidence: RoomPlanConfidence;
    /** Column-major simd_float4x4: col3 = world center, col0 = local X (encodes Y-rotation). */
    transform: SimdFloat4x4;
    /** Bounding box [width, height, depth] in meters (local object frame). */
    dimensions: SimdFloat3;
    story: number;
};
export type RoomplanChairObject = RoomplanObjectShared & {
    category: {
        chair: {};
    };
    attributes: ChairAttributesJSON;
};
export type RoomplanTableObject = RoomplanObjectShared & {
    category: {
        table: {};
    };
    attributes: TableAttributesJSON;
};
export type RoomplanStorageObject = RoomplanObjectShared & {
    category: {
        storage: {};
    };
    attributes: StorageAttributesJSON;
};
export type RoomplanSofaObject = RoomplanObjectShared & {
    category: {
        sofa: {};
    };
    attributes: SofaAttributesJSON;
};
export type RoomplanBedObject = RoomplanObjectShared & {
    category: {
        bed: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanBathtubObject = RoomplanObjectShared & {
    category: {
        bathtub: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanDishwasherObject = RoomplanObjectShared & {
    category: {
        dishwasher: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanFireplaceObject = RoomplanObjectShared & {
    category: {
        fireplace: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanOvenObject = RoomplanObjectShared & {
    category: {
        oven: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanRefrigeratorObject = RoomplanObjectShared & {
    category: {
        refrigerator: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanSinkObject = RoomplanObjectShared & {
    category: {
        sink: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanStairsObject = RoomplanObjectShared & {
    category: {
        stairs: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanStoveObject = RoomplanObjectShared & {
    category: {
        stove: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanTelevisionObject = RoomplanObjectShared & {
    category: {
        television: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanToiletObject = RoomplanObjectShared & {
    category: {
        toilet: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanWasherDryerObject = RoomplanObjectShared & {
    category: {
        washerDryer: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanOtherObject = RoomplanObjectShared & {
    category: {
        [k: string]: {};
    };
    attributes: Record<string, any>;
};
export type RoomplanObject = RoomplanChairObject | RoomplanTableObject | RoomplanStorageObject | RoomplanSofaObject | RoomplanBedObject | RoomplanBathtubObject | RoomplanDishwasherObject | RoomplanFireplaceObject | RoomplanOvenObject | RoomplanRefrigeratorObject | RoomplanSinkObject | RoomplanStairsObject | RoomplanStoveObject | RoomplanTelevisionObject | RoomplanToiletObject | RoomplanWasherDryerObject | RoomplanOtherObject;
export type RoomPlanSectionLabel = 'livingRoom' | 'kitchen' | 'diningRoom' | 'bedroom' | 'bathroom' | 'unidentified';
export type RoomPlanSection = {
    label: RoomPlanSectionLabel;
    center: SimdFloat3;
    story: number;
};
export type CapturedRoom = {
    walls: RoomplanWall[];
    floors: RoomplanFloor[];
    doors: RoomplanDoor[];
    windows: RoomplanWindow[];
    openings: RoomplanOpening[];
    objects: RoomplanObject[];
    sections: RoomPlanSection[];
    story: number;
    version: number;
    /** Encrypted native model blob — ignore. */
    coreModel: string;
};
export {};
