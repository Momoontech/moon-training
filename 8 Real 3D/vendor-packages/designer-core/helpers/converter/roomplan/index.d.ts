export { CATALOG_MAPPING_RULES, FALLBACK_CATALOG_PATH, resolveCatalogPath } from './catalogMap';
export type { CatalogMappingRule } from './catalogMap';
export { applyRoomPlanProducts, convertCapturedRoom, FLOORPLAN_ID, STAGE_ID } from './converter';
export type { ConvertCapturedRoomOptions } from './converter';
export { findNearestWallMountPlane, getConfidenceLevel, meetsConfidenceThreshold, transformFloorCorner } from './coordinates';
export type { ConfidenceLevel, ProductPlacement } from './coordinates';
export type { CapturedRoom, ChairAttributesJSON, RoomPlanConfidence, RoomplanObject, RoomPlanSection, RoomPlanSectionLabel, RoomplanSurface, SimdFloat3, SimdFloat4x4, SofaAttributesJSON, StorageAttributesJSON, TableAttributesJSON } from './types';
