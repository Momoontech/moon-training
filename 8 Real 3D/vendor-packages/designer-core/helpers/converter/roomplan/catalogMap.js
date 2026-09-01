const FALLBACK_CATALOG_PATH = 'private/Products/Appliances/Unknown';
const OPENING_CATALOG_PATH = 'private/Products/Doors/GateRectOpening';
const DOOR_CATALOG_PATH = 'private/Products/Doors/GateRectDoor';
const WINDOW_CATALOG_PATH = 'private/Products/Windows/TwoDoorRegVertWindow';
const FRIDGE_CATALOG_PATH = 'private/Products/Appliances/Fridge';
const WASHING_MACHINE_CATALOG_PATH = 'private/Products/Appliances/DVE50R8500VB';
const DISHWASHER_CATALOG_PATH = 'private/Products/Appliances/Dishwasher';
const TV_CATALOG_PATH = 'master/Products/Appliances/TV001';
const BED_CATALOG_PATH = 'master/Products/Appliances/Bed001';
const SOFA_CATALOG_PATH = 'master/Products/Appliances/Sofa001';
const CHAIR_CATALOG_PATH = 'master/Products/Appliances/Chair001';
const TABLE_CATALOG_PATH = 'master/Products/Appliances/WoodenKitchenTable';
const STOVE_CATALOG_PATH = 'master/Products/Appliances/StoveGas';
const OVEN_CATALOG_PATH = 'master/Products/Appliances/Dishwasher'; //TODO: Add Oven catalog object
const BATHROOM_TUB_CATALOG_PATH = 'master/Products/Appliances/BathroomTub1';
const TOILET_CATALOG_PATH = 'master/Products/Appliances/Toilet001';
const STAIRS_CATALOG_PATH = 'master/Products/Appliances/Stairs002';
const STORAGE_CATALOG_PATH = 'master/Products/Cabinets/OneDoorTall';
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
const CATALOG_MAPPING_RULES = [
    // ── Openings ──────────────────────────────────────────────────────────────────
    { name: 'door', match: (o) => 'door' in o.category, catalogPath: DOOR_CATALOG_PATH },
    { name: 'window', match: (o) => 'window' in o.category, catalogPath: WINDOW_CATALOG_PATH },
    { name: 'opening', match: (o) => 'opening' in o.category, catalogPath: OPENING_CATALOG_PATH },
    // ── Appliances ─────────────────────────────────────────────────────────────
    { name: 'refrigerator', match: (o) => 'refrigerator' in o.category, catalogPath: FRIDGE_CATALOG_PATH },
    { name: 'washerDryer', match: (o) => 'washerDryer' in o.category, catalogPath: WASHING_MACHINE_CATALOG_PATH },
    { name: 'dishwasher', match: (o) => 'dishwasher' in o.category, catalogPath: DISHWASHER_CATALOG_PATH },
    { name: 'oven', match: (o) => 'oven' in o.category, catalogPath: OVEN_CATALOG_PATH },
    { name: 'stove', match: (o) => 'stove' in o.category, catalogPath: STOVE_CATALOG_PATH },
    { name: 'sink', match: (o) => 'sink' in o.category, catalogPath: FALLBACK_CATALOG_PATH },
    // ── Furniture ──────────────────────────────────────────────────────────────
    { name: 'table', match: (o) => 'table' in o.category, catalogPath: TABLE_CATALOG_PATH },
    { name: 'chair', match: (o) => 'chair' in o.category, catalogPath: CHAIR_CATALOG_PATH },
    { name: 'sofa', match: (o) => 'sofa' in o.category, catalogPath: SOFA_CATALOG_PATH },
    { name: 'bed', match: (o) => 'bed' in o.category, catalogPath: BED_CATALOG_PATH },
    { name: 'storage', match: (o) => 'storage' in o.category, catalogPath: STORAGE_CATALOG_PATH },
    // ── Bathroom ───────────────────────────────────────────────────────────────
    { name: 'bathtub', match: (o) => 'bathtub' in o.category, catalogPath: BATHROOM_TUB_CATALOG_PATH },
    { name: 'toilet', match: (o) => 'toilet' in o.category, catalogPath: TOILET_CATALOG_PATH },
    // ── Other ──────────────────────────────────────────────────────────────────
    { name: 'television', match: (o) => 'television' in o.category, catalogPath: TV_CATALOG_PATH },
    { name: 'fireplace', match: (o) => 'fireplace' in o.category, catalogPath: FALLBACK_CATALOG_PATH },
    { name: 'stairs', match: (o) => 'stairs' in o.category, catalogPath: STAIRS_CATALOG_PATH },
    // ── Catch-all ──────────────────────────────────────────────────────────────
    { name: 'fallback', match: () => true, catalogPath: FALLBACK_CATALOG_PATH }
];
/** Resolves the designer catalog path for a detected RoomPlan object. */
function resolveCatalogPath(obj) {
    return CATALOG_MAPPING_RULES.find((rule) => rule.match(obj))?.catalogPath ?? FALLBACK_CATALOG_PATH;
}

export { BATHROOM_TUB_CATALOG_PATH, BED_CATALOG_PATH, CATALOG_MAPPING_RULES, CHAIR_CATALOG_PATH, DISHWASHER_CATALOG_PATH, DOOR_CATALOG_PATH, FALLBACK_CATALOG_PATH, FRIDGE_CATALOG_PATH, OPENING_CATALOG_PATH, OVEN_CATALOG_PATH, SOFA_CATALOG_PATH, STAIRS_CATALOG_PATH, STORAGE_CATALOG_PATH, STOVE_CATALOG_PATH, TABLE_CATALOG_PATH, TOILET_CATALOG_PATH, TV_CATALOG_PATH, WASHING_MACHINE_CATALOG_PATH, WINDOW_CATALOG_PATH, resolveCatalogPath };
