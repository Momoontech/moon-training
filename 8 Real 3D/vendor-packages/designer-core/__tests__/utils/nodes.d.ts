import type { UUID } from '../../declarations/core';
import type { ItemConfig } from '../../declarations/Item';
import type { PanelConfig } from '../../declarations/Panel';
import type { PartConfig } from '../../declarations/Part';
import { MultiClosetComponentType, MultiClosetStackType } from '../../declarations/Part';
import type { CarcassConfig } from '../../declarations/Carcass';
import type { BoxContainerConfig } from '../../declarations/BoxContainer';
import type { CountertopConfig } from '../../declarations/Countertop';
import type { FreeBoxContainerConfig } from '../../declarations/FreeBoxContainer';
import type { NodeConfig } from '../../declarations/Node';
import type { Item } from '../../components/Node/components/Item';
import type { CoreDesigner } from '../../designer-core';
export declare const MOCK_ITEM_ID: UUID;
export declare const MOCK_WINDOW_ITEM_ID: UUID;
/**
 * Canonical parent Item that owns `MOCK_ITEM_ID` and `MOCK_WINDOW_ITEM_ID`.
 * Tests that need a parent-child relationship (`DuplicateNodeCommand`,
 * `CreateNodeCommand`, `RemoveNodeCommand`) get it from the default mock graph.
 */
export declare const MOCK_PARENT_ITEM_ID: UUID;
/**
 * Minimum-viable cabinet `ItemConfig`. Pass overrides for fields under test.
 *
 * Note: `sections` / `separators` are NOT cabinet fields (they live on
 * `MultiClosetConfig`). The real `Item` constructor handles their absence via
 * `'sections' in config ? config.sections : []`, so omitting them is safe.
 */
export declare const createMinItemConfig: (overrides?: Partial<ItemConfig>) => ItemConfig;
/** Minimum-viable `PanelConfig`. Pass overrides for fields under test. */
export declare const createMinPanelConfig: (overrides?: Partial<PanelConfig>) => PanelConfig;
/** Minimum-viable `PartConfig`. Used for `partSize` / `partPosition` / `partAttribute` token tests. */
export declare const createMinPartConfig: (overrides?: Partial<PartConfig>) => PartConfig;
/**
 * A multiCloset content STACK Part — `partType` says "this is a stack", the separate
 * `multiClosetStackType` discriminator says which category of stack it is.
 *
 * Both halves are required: `partType` is what the guards
 * (`isMultiClosetStackPartType`) and the resize behaviour table match on, while the
 * per-category effects (`registerEffects(MultiClosetStackType.…)`) and
 * `getCategoryForStackPartType` read the discriminator. A config carrying only one of
 * the two typechecks but behaves as a partially-wired node, so tests build stacks
 * through this factory rather than by hand — mirrors what the catalog emits
 * (`master.json` → `multiClosetShelvesStack` & co.).
 */
export declare const createMultiClosetStackPartConfig: (multiClosetStackType: MultiClosetStackType, overrides?: Partial<PartConfig>) => PartConfig;
/**
 * A multiCloset content COMPONENT Part — one shelf compartment / hanger / drawer.
 * The `partType` + `multiClosetComponentType` pair mirrors
 * {@link createMultiClosetStackPartConfig}; see its doc for why both are needed.
 */
export declare const createMultiClosetComponentPartConfig: (multiClosetComponentType: MultiClosetComponentType, overrides?: Partial<PartConfig>) => PartConfig;
/** Minimum-viable `CarcassConfig`. Used for `carcassSize` / `carcassAttribute` token tests. */
export declare const createMinCarcassConfig: (overrides?: Partial<CarcassConfig>) => CarcassConfig;
/** Minimum-viable `BoxContainerConfig`. Used for boxContainer* token tests and layout tests. */
export declare const createMinBoxContainerConfig: (overrides?: Partial<BoxContainerConfig>) => BoxContainerConfig;
/** Minimum-viable `CountertopConfig`. Used for `countertopSize` / `countertopAttribute` token tests. */
export declare const createMinCountertopConfig: (overrides?: Partial<CountertopConfig>) => CountertopConfig;
/** Minimum-viable `FreeBoxContainerConfig`. Used for `freeBoxContainerSize` token tests. */
export declare const createMinFreeBoxContainerConfig: (overrides?: Partial<FreeBoxContainerConfig>) => FreeBoxContainerConfig;
export declare const mockItemConfig: ItemConfig;
export declare const mockWindowItemConfig: ItemConfig;
export declare const mockParentItemConfig: ItemConfig;
/** The canonical seed node graph used by `createMockCore` when no `nodes` override is given. */
export declare const mockNodes: NodeConfig[];
/**
 * Field-level reset for the canonical mock Item. Clears `attributes`. Extend
 * as new tests mutate other Item fields (size/position/parent/etc.).
 * Call in `beforeEach` for tests that share `core.nodes.get(MOCK_ITEM_ID)`.
 */
export declare const resetMockItem: (node: Item) => void;
/**
 * Re-creates `MOCK_PARENT_ITEM_ID`, `MOCK_ITEM_ID`, and `MOCK_WINDOW_ITEM_ID`
 * if a prior test removed any of them, then re-stamps the parent's `children`
 * list and the children's `parent` references. Use in `beforeEach` for
 * `RemoveNodeCommand` tests (or any test) that may delete a seed node and
 * otherwise leak that deletion to the next test in the file.
 *
 * Bypasses the command pipeline (uses `createNode` directly) so a broken
 * `CreateNodeCommand` cannot make these tests look broken transitively.
 *
 * The parent is restored first so the `.children.set(...)` call below always
 * has a live target — without that guard, a test that deletes the parent
 * would crash the next `beforeEach` with a confusing TypeError.
 */
export declare const restoreMockItemSeeds: (core: CoreDesigner) => void;
