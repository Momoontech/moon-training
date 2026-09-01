import { UUID } from './core';
import { EdgebandingType } from './Edgebanding';
import { ItemType } from './helpers';
import { HingeType } from './Model';
import { PanelType } from './Panel';
import { ValanceType } from './Valance';
/**
 * Core-native calculation (bill-of-materials) types.
 *
 * Ported from the moon-vesta `_I*Calculation` shapes, redesigned for
 * `@moon/designer-core`: the `_I` prefix is dropped, ids are `UUID` (not
 * `string`), the vesta `sceneType` split is gone (core has a single node tree),
 * and the post-transform per-material value shape is expressed as a proper
 * `MaterialQuantityMap` instead of vesta's `@ts-ignore` mutation.
 *
 * The mapping back to the exact backend `calculation_data` payload (re-adding
 * `_I`-style field names / `sceneType`) is an app-boundary concern and lives in
 * the consuming app, not here.
 */
/** Identity fields shared by every buildable calculation line. */
export interface CalculationEntryBase {
    uuid: UUID;
    itemId: UUID;
    parentId: UUID;
    name: string;
    /** Assigned during per-project grouping (see `groupProjectCalculations`). */
    itemNumber: number[];
    /** Absent when the node has no resolvable material — such lines are skipped by the roll-up. */
    materialId?: UUID;
}
export interface PanelCalculation extends CalculationEntryBase {
    panelType: PanelType;
    materialType: string;
    materialThickness: number;
    grainDirection: number;
    area: number;
    rectArea: number;
    width: number;
    height: number;
    leftDrillingDepth?: number;
    rightDrillingDepth?: number;
}
export interface GlassCalculation extends CalculationEntryBase {
    materialThickness: number;
    grainDirection: number;
    area: number;
    rectArea: number;
    width: number;
    height: number;
}
/** Was `_ILaminateBoxCalculation`; renamed to match the `laminate` category key. */
export interface LaminateCalculation extends CalculationEntryBase {
    materialThickness: number;
    grainDirection: number;
    area: number;
}
export interface EdgebandingCalculation extends CalculationEntryBase {
    materialThickness: number;
    width: number;
    edgebandingType: EdgebandingType;
}
export interface PartCalculation extends CalculationEntryBase {
    partType: string;
    width: number;
    height: number;
    depth: number;
}
export interface CountertopCalculation extends CalculationEntryBase {
    mergedIds: UUID[];
    materialThickness: number;
    area: number;
    rectArea: number;
    width: number;
    height: number;
}
export interface ToeKickCalculation extends CalculationEntryBase {
    mergedIds: UUID[];
    materialThickness: number;
    grainDirection: number;
    area: number;
    rectArea: number;
    width: number;
    height: number;
}
export interface ValanceCalculation extends CalculationEntryBase {
    mergedIds: UUID[];
    grainDirection: number;
    area: number;
    width: number;
    height: number;
    valanceType: ValanceType;
}
export interface CrownMoldingCalculation extends CalculationEntryBase {
    mergedIds: UUID[];
    width: number;
}
export type HandleCalculation = CalculationEntryBase;
export type LegCalculation = CalculationEntryBase;
export type DrawerSystemCalculation = CalculationEntryBase;
export type DrawerSlideCalculation = CalculationEntryBase;
export interface AccessoryCalculation extends CalculationEntryBase {
    width?: number;
}
export interface HingeCalculation extends CalculationEntryBase {
    hingeType: HingeType;
}
export interface FloorCalculation extends CalculationEntryBase {
    area: number;
}
/**
 * The 17 aggregation categories. Single source of truth for the transform and
 * the grouping helpers (`CATEGORY_KEYS` in `helpers/calculation/calculationCategories`
 * is derived from these keys).
 */
export interface CategoryCalculations {
    panels: PanelCalculation[];
    laminate: LaminateCalculation[];
    glass: GlassCalculation[];
    handles: HandleCalculation[];
    edgebandings: EdgebandingCalculation[];
    hinges: HingeCalculation[];
    legs: LegCalculation[];
    accessories: AccessoryCalculation[];
    drawerSystems: DrawerSystemCalculation[];
    drawerSlides: DrawerSlideCalculation[];
    parts: PartCalculation[];
    crownMoldings: CrownMoldingCalculation[];
    topValances: ValanceCalculation[];
    bottomValances: ValanceCalculation[];
    toeKicks: ToeKickCalculation[];
    countertops: CountertopCalculation[];
    floor: FloorCalculation[];
}
export type CalculationCategory = keyof CategoryCalculations;
/** Union of any single line a node emits — replaces vesta `_IObjectCalculation`. */
export type ObjectCalculation = CategoryCalculations[CalculationCategory][number];
/**
 * The per-node slice a single generator emits: exactly one category key is set.
 * `edgebandings` holds an array (a banded panel emits one entry per edge); every
 * other category holds a single entry.
 */
export type NodeCalculation = {
    [K in CalculationCategory]?: K extends 'edgebandings' ? EdgebandingCalculation[] : CategoryCalculations[K][number];
};
/** Per-item aggregate. `calculations` is retained pre-transform and stripped after. */
export interface ItemCalculation extends CategoryCalculations {
    uuid: UUID;
    itemType: ItemType;
    itemNumber: number | number[];
    name?: string;
    comment?: string;
    width: number;
    height: number;
    depth: number;
    calculations: NodeCalculation[];
}
/** Per-project aggregate before the per-material quantity fold. */
export type ProjectCalculation = CategoryCalculations;
/** Per-material rolled-up quantity map (post-transform value shape). */
export type MaterialQuantityMap = {
    [materialId: string]: {
        quantity: number;
    };
};
/**
 * Final transformed per-project shape: each remaining category becomes a
 * per-material quantity map. `parts` / `toeKicks` / `topValances` /
 * `bottomValances` are folded into `panels` and removed.
 */
export type ProjectCalculationSummary = Partial<Record<Exclude<CalculationCategory, 'parts' | 'toeKicks' | 'topValances' | 'bottomValances'>, MaterialQuantityMap>>;
/**
 * A single closet `perPart` entry — one buildable closet part (toe-kick, fix-shelf
 * divider, or stack) with its own rolled-up child components in the category
 * arrays. Core-native analogue of vesta's `_IPartCalculation & _IItemChildrenCalculations`.
 * Not grouped and not run through the aggregate transform.
 */
export interface PerPartCalculation extends CategoryCalculations {
    uuid: UUID;
    itemId: UUID;
    parentId: UUID;
    partType: string;
    name: string;
    catalogPath?: string;
    itemNumber: number[];
    /** Present only for wall-mounted closets (from the owning wall's RoomSegment `WallNumber`). */
    wallNumber?: number;
    /**
     * The multiCloset system the part's owning item is assigned to (from `item.system`). Absent for
     * singleCloset parts and for multiCloset items not yet assigned to a system. `perPart` stays a
     * flat array — consumers that need per-system output group by this field themselves and must
     * keep a bucket for the `undefined` case so unassigned parts are not silently dropped.
     */
    systemId?: UUID;
    width?: number;
    height?: number;
    depth?: number;
    materialId?: UUID;
    attributes?: {
        StripLightsPresent?: boolean;
        DrawerBoxHeight?: number;
    };
}
/** Top-level result returned by `core.getCalculation()`. */
export interface CalculationResult {
    perItem: Omit<ItemCalculation, 'calculations'>[];
    perProject: ProjectCalculationSummary;
    perPart: PerPartCalculation[];
}
