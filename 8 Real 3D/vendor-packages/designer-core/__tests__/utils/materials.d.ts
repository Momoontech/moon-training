import type { materialsSet } from '../../components/ProjectSettings/Materials/MaterialsSets';
import type { attributesType } from '../../declarations';
import type { IWebProjectSettings, materialsSetAPI, materialsType } from '../../declarations/ProjectSettings';
import type { UUID } from '../../declarations/core';
import type { CoreDesigner } from '../../designer-core';
export declare const MOCK_CLOSET_SET_ID: UUID;
export declare const MOCK_MATERIALS_SET_ID: UUID;
/** Material IDs used by `mockStorageMaterials` cascade lookups. */
export declare const MOCK_DOOR_ID: UUID;
export declare const MOCK_VISIBLE_PANEL_ID: UUID;
export declare const MOCK_EDGEBAND_ID: UUID;
export declare const MOCK_BODY_ID: UUID;
export declare const MOCK_MELAMINE_BOX_ID: UUID;
export declare const MOCK_FINISH_END_ID: UUID;
/** Canonical project-attribute name seeded into `mockProjectSettings`. */
export declare const MOCK_PROJECT_ATTRIBUTE_NAME: attributesType;
/**
 * Returns a complete `materialsSetAPI` raw JSON object.
 * All UUID fields default to empty string; all string fields default to ''.
 * Grain fields default to { label: '', value: 0 }.
 */
export declare const createMinMaterialsSetAPI: (overrides?: Partial<materialsSetAPI>) => materialsSetAPI;
export declare const mockClosetMaterialsSets: {
    [MOCK_CLOSET_SET_ID]: materialsSetAPI;
};
export declare const mockMaterialsSets: {
    [MOCK_MATERIALS_SET_ID]: materialsSetAPI;
};
/** Returns the minimal materials block used by `createMinProjectSettings`. */
export declare const createMinMaterialsBlock: () => materialsType;
export declare const createMinProjectSettings: () => IWebProjectSettings;
/** Pre-built canonical project settings — used as default by `createMockCore`. */
export declare const mockProjectSettings: IWebProjectSettings;
/**
 * Stub materialsSet with a single observable `name` field.
 * All other signals are read-only stubs (`set()` is a no-op).
 * Use when you only need to verify set identity, not cascade mutations.
 */
export declare const createStubMaterialsSet: (name: string) => materialsSet;
/** Shape of `core.storage.get('materials')?.obj` as accessed by cascade commands. */
export type StorageMaterialsObj = {
    doorStyle: Record<string, {
        matchingVisiblePanel: string | null;
    }>;
    visiblePanel: Record<string, {
        matchingEdgeband: string;
    }>;
    melamineBox: Record<string, {
        matchingEdgeband: string;
    }>;
};
/**
 * Returns a fresh storage materials object.
 * The three maps are keyed by UUID string; provide only the entries your test needs.
 */
export declare const createStorageMaterialsMock: (overrides?: Partial<StorageMaterialsObj>) => StorageMaterialsObj;
/**
 * Installs a narrow `StorageMaterialsObj` mock as the `materials` entry on
 * `core.storage`. Pass `null` to simulate undefined storage.
 */
export declare const installStorageMaterials: (core: {
    storage: {
        set: (key: never, value: never) => void;
    };
}, obj: StorageMaterialsObj | null) => void;
/**
 * Re-installs the default cascade lookup data onto `core.storage`. Use in
 * `beforeEach` after any test that nullifies storage (e.g. the
 * storage-undefined guard test).
 */
export declare const resetMockStorage: (core: CoreDesigner) => void;
/**
 * Resets every field on a real `materialsSet` instance to empty defaults.
 * Use in `beforeEach` when sharing a single materialsSet across tests.
 */
export declare const resetMaterialsSet: (set: materialsSet) => void;
/** Anything with the MaterialsSets public API (real class or mock). */
export type MaterialsSetsLike = {
    get: (id: UUID) => materialsSet | undefined;
    add: (id: UUID, set: materialsSet) => void;
    delete: (id: UUID) => void;
    getSetsIds: () => UUID[];
};
/** Capture every (id → set reference) currently in the store. */
export declare const captureMaterialsSetsSnapshot: (sets: MaterialsSetsLike) => Map<UUID, materialsSet>;
/**
 * Restore a MaterialsSets collection to a previously-captured snapshot.
 * - Deletes any id present now but absent in the snapshot.
 * - Re-adds any id absent now but present in the snapshot (preserving the
 *   original `materialsSet` reference so reference-equality assertions hold).
 */
export declare const restoreMaterialsSetsSnapshot: (sets: MaterialsSetsLike, snap: Map<UUID, materialsSet>) => void;
/**
 * Captures the closet/regular materialsSets baseline. Called once by
 * `createMockCore()` after the core is constructed. Tests should not call
 * this directly — use `resetMockMaterials(core)` instead.
 */
export declare const captureMaterialsBaseline: (core: CoreDesigner) => void;
/**
 * Restores `core.projectSettings.materials.closetMaterialsSets` and
 * `materialsSets` to the post-construction baseline captured by
 * `captureMaterialsBaseline()`. Works for both Add tests (extras stripped)
 * and Remove tests (deleted seeds re-added with their original instance
 * reference). Call in `beforeEach`.
 */
export declare const resetMockMaterials: (core: CoreDesigner) => void;
