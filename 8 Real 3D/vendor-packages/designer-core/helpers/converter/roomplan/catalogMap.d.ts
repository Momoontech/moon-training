import type { RoomplanDoor, RoomplanObject, RoomplanOpening, RoomplanWindow } from './types';
export declare const FALLBACK_CATALOG_PATH = "private/Products/Appliances/Unknown";
export declare const OPENING_CATALOG_PATH = "private/Products/Doors/GateRectOpening";
export declare const DOOR_CATALOG_PATH = "private/Products/Doors/GateRectDoor";
export declare const WINDOW_CATALOG_PATH = "private/Products/Windows/TwoDoorRegVertWindow";
export declare const FRIDGE_CATALOG_PATH = "private/Products/Appliances/Fridge";
export declare const WASHING_MACHINE_CATALOG_PATH = "private/Products/Appliances/DVE50R8500VB";
export declare const DISHWASHER_CATALOG_PATH = "private/Products/Appliances/Dishwasher";
export declare const MICROWAVE_CATALOG_PATH = "private/Products/Appliances/Microwave";
export declare const TV_CATALOG_PATH = "master/Products/Appliances/TV001";
export declare const BED_CATALOG_PATH = "master/Products/Appliances/Bed001";
export declare const SOFA_CATALOG_PATH = "master/Products/Appliances/Sofa001";
export declare const CHAIR_CATALOG_PATH = "master/Products/Appliances/Chair001";
export declare const TABLE_CATALOG_PATH = "master/Products/Appliances/WoodenKitchenTable";
export declare const STOVE_CATALOG_PATH = "master/Products/Appliances/StoveGas";
export declare const OVEN_CATALOG_PATH = "master/Products/Appliances/Dishwasher";
export declare const BATHROOM_TUB_CATALOG_PATH = "master/Products/Appliances/BathroomTub1";
export declare const TOILET_CATALOG_PATH = "master/Products/Appliances/Toilet001";
export declare const STAIRS_CATALOG_PATH = "master/Products/Appliances/Stairs002";
export declare const STORAGE_CATALOG_PATH = "master/Products/Cabinets/OneDoorTall";
export type CatalogMappingRule = {
    /** Human-readable label for debugging. */
    name: string;
    /**
     * Returns true if this rule applies to the object.
     * Has access to the full RoomPlan object: category, dimensions (meters), and attributes.
     */
    match: (obj: RoomplanObject | RoomplanDoor | RoomplanWindow | RoomplanOpening) => boolean;
    /** Designer catalog source path to use when this rule matches. */
    catalogPath: string;
};
/**
 * Ordered catalog mapping rules — first match wins.
 *
 * Authoring tips:
 *  - Put more-specific rules ABOVE their general category rule.
 *  - obj.dimensions are in meters: [0]=width, [1]=height, [2]=depth
 *  - obj.attributes carries per-category RoomPlan metadata, e.g.:
 *      obj.attributes.StorageType === 'cabinet'
 *      obj.attributes.TableType   === 'dining'
 *  - Keep the final { match: () => true } catch-all as the last entry.
 *
 * Example of more-specific rules (insert above the broad category rule):
 *   { name: 'tall-cabinet', match: (o) => 'storage' in o.category && o.dimensions[1] > 1.7, catalogPath: 'private/Products/...' },
 *   { name: 'base-cabinet', match: (o) => 'storage' in o.category && o.attributes.StorageType === 'cabinet', catalogPath: 'private/Products/...' },
 *   { name: 'large-table',  match: (o) => 'table'   in o.category && o.dimensions[0] > 1.6, catalogPath: 'private/Products/...' },
 */
export declare const CATALOG_MAPPING_RULES: CatalogMappingRule[];
/** Resolves the designer catalog path for a detected RoomPlan object. */
export declare function resolveCatalogPath(obj: RoomplanObject | RoomplanDoor | RoomplanWindow | RoomplanOpening): string;
