import { AreaHeader } from './components/AreaHeader';
import CurveValue from './components/CurveValue';
import { Node } from './components/Node';
import { PaperSpace } from './components/PaperSpace';
import { ProjectSettings } from './components/ProjectSettings';
import ShapeValue from './components/ShapeValue';
import Value, { ValueOptionsType } from './components/Value';
import TransformedValue from './components/Value/TransformedValue';
import { Command } from './components/commands/core/Command';
import Transaction from './components/commands/core/Transaction';
import { TransactionManager } from './components/commands/core/TransactionManager';
import { AppData, CatalogConfig, CoreMode, FloorPlanDrawMode, GeneralViewMode, IAreaHeader, ICatalog, ICatalogClassifications, IOrbitControls, IOrthoCamera, IPaperSpaceState, IPerspectiveCamera, IPointerGestureSource, IProjectSettings, IShapeValue, IValue, IViewsBySystem, looksAPI, materialsAPI, models3DAPI, SystemsAPI, UUID, V2Axes, View, ViewType } from './declarations';
import { ICurveValue } from './declarations/ICurveValue';
import { CalculationResult } from './declarations/calculation';
import { CapturedRoom } from './helpers/converter/roomplan/types';
import { FillMultiClosetResult } from './helpers/multiCloset/fillMultiClosets';
import { SectionContentProfile } from './helpers/multiCloset/types';
import { CoreStorage } from './storage';
import CoreSignal from './components/CoreSignal';
import { Vector2, Vector3 } from './helpers';
export type DisposeFn = () => void;
export type NodeEffect = (node: Node) => void | DisposeFn | undefined;
export type Effect = () => void | DisposeFn | undefined;
/** External catalog drag: catalog `path` plus optional preview node id once a preview instance exists. */
export type CatalogDragState = {
    path: string;
    nodeId: UUID | null;
};
export declare class CoreDesigner {
    id: UUID;
    rootId: UUID;
    nodes: Map<UUID, Node>;
    nodeIds: CoreSignal<UUID[]>;
    pointerPosition: CoreSignal<Vector2>;
    domElement: HTMLDivElement;
    /**
     * Designer-wide pointer-gesture source — single source of truth for touch
     * count, the multi-touch latch, pinch deltas, and gesture-reset across both
     * `@moon/designer-ui` (drag-session arbitration) and `@moon/designer3d`
     * (canvas two-finger gesture promotion). Exposed as the read-only
     * {@link IPointerGestureSource} contract so consumers cannot reach lifecycle
     * members; the concrete owner is held privately in {@link _handlers} for
     * disposal. Attached to `domElement` on construction, disposed in `dispose()`.
     */
    handlers: IPointerGestureSource;
    /** Concrete owner of {@link handlers}, kept private for lifecycle only. */
    private readonly _handlers;
    storage: CoreStorage;
    projectSettings: ProjectSettings;
    transactionManager: TransactionManager;
    paperSpace: PaperSpace;
    areaHeader: AreaHeader;
    generalViewMode: Value<GeneralViewMode>;
    editor2DBaseNodeId: Value<UUID | null>;
    selectedNodeId: Value<UUID | null>;
    selectedSystemId: Value<UUID | null>;
    /**
     * Loaded systems config (`systemData.json`) as a reactive value. Replaces the old
     * `projectSettings.multiClosetSystems` registry and the `storage.systemData` slot.
     * `SystemsAPI` is a typed array of `{ id, name, … }` entries (see `declarations/systems.ts`);
     * entry ids are opaque strings. Mutated via the granular system commands
     * (Add / Remove / SetName) and re-emitted on `saveArea`.
     */
    systemData: Value<SystemsAPI>;
    /**
     * Loaded multiCloset content-option catalog (`multiClosetSectionOptions.json`) — the
     * self-describing list of section types auto-fill may instantiate, and the CLOSED set it may
     * choose from: a category no option carries is dropped from the desire before planning.
     *
     * App-supplied, exactly like {@link systemData}: the file sits behind an app-owned endpoint and
     * core owns no URLs (CLAUDE.md rule 11), so the app seeds it via
     * {@link setSectionOptionsFromJSON} and `fillMultiClosets()` reads it from here. Seeding once
     * beats passing it per call — the app has a single place that loads project blobs, and every
     * consumer then shares one list instead of each growing its own fetch.
     *
     * A PLAIN field, not a `Value`: this is static configuration, not project state. Nothing needs
     * to react to it, it is not part of `appData`, and `saveArea` does not re-emit it. Defaults to
     * `[]`, which makes `fillMultiClosets()` a logged no-op rather than a crash when the app has not
     * seeded it yet.
     */
    sectionOptions: SectionContentProfile[];
    draggedNodeId: Value<UUID | null>;
    draggedNodeOffset: Value<Vector3>;
    hoveredNodeId: Value<UUID | null>;
    /** Set when dragging from catalog. Carries a full `CatalogConfig` — a path string,
     * an `IValue<string>` formula, a `source`-linked partial, or a full inline catalog object. */
    draggedCatalogPath: Value<CatalogConfig | null>;
    currentStage: Value<UUID>;
    isMeasurementsEnabled: Value<boolean>;
    /**
     * M3D-309 — the node whose dimension is currently being EDITED (its overlay input
     * has focus). The designer-ui `DimensionFocusTarget` wrapper sets this + the target
     * zoom below on focus-in and clears them on blur / unmount. The designer3d
     * camera-focus effect frames this node (top-view ortho `fCamera`) while set.
     * Ephemeral UI state — set directly, NOT through a command (no undo history), same
     * as {@link hoveredNodeId}.
     */
    dimensionFocusNodeId: Value<UUID | null>;
    /**
     * M3D-309 — target orthographic zoom the floorplan camera animates TO when framing
     * {@link dimensionFocusNodeId} (the wrapper's `zoom` prop). `null` when nothing is
     * focused. Ephemeral, set alongside `dimensionFocusNodeId`.
     */
    dimensionFocusZoom: Value<number | null>;
    /**
     * M3D-309 — explicit world-floor `(x, z)` point to frame instead of {@link dimensionFocusNodeId}'s
     * node centre. Used when the edited dimension is NOT a node — e.g. a product clearance, whose
     * line runs from the item edge out to a boundary and so is offset from the item centre. The
     * `DimensionFocusTarget` wrapper sets this (alongside the node id, kept for the clear guard) to
     * the dimension's own midpoint; the designer3d effect prefers it over the node centre when
     * present. `null` for wall / corner dimensions (they frame their node). Ephemeral.
     */
    dimensionFocusPoint: Value<{
        x: number;
        z: number;
    } | null>;
    /**
     * "Any-mode" input-centring — the CANVAS-space screen centre (CSS px, top-left origin, same frame
     * as `projectWorld3DToScreen`) of the currently-focused dimension input. The `DimensionFocusTarget`
     * wrapper measures the field's rect on focus-in and clears on blur / unmount. The designer3d
     * camera-focus effect uses it (with {@link dimensionFocusNodeId} for the perspective depth) to pan
     * the editor2D / editor3D camera so the EXACT field — not just the node centre — lands at screen
     * centre. Floorplan ignores it (its node/point framing already centres the field). Ephemeral.
     */
    dimensionFocusScreenPoint: Value<{
        x: number;
        y: number;
    } | null>;
    floorPlanDrawMode: Value<FloorPlanDrawMode>;
    drawRoomData: {
        pointer: {
            [V2Axes.x]: Value<number>;
            [V2Axes.y]: Value<number>;
        };
        prevPointer: Value<{
            id: UUID;
            position: Vector2;
        } | null>;
        /**
         * Long-lived transaction that wraps an in-progress room-drawing gesture.
         * Owned by the draw-session helpers (`beginDrawSession` / `commitDrawSession` /
         * `cancelDrawSession`) — do not mutate directly. Held here (not in component
         * state) so non-UI consumers (toolbar, Esc handler, mode switcher) can
         * cooperate with the cleanup in `DrawRoomPoint` without duplicating logic.
         */
        transaction: Transaction | null;
    };
    effects: ((core: CoreDesigner) => undefined)[];
    disposeEffects: () => void;
    e3CameraData: Value<IPerspectiveCamera>;
    fCameraData: Value<IOrthoCamera>;
    wCameraData: Value<IPerspectiveCamera>;
    e2CameraData: Value<IOrthoCamera>;
    controlsData: Value<IOrbitControls>;
    /**
     * CSS-pixel size of the rendering surface (`domElement.clientWidth` /
     * `clientHeight`). Maintained imperatively by the active 3D view
     * (`AreaDesigner3D` writes from its `ResizeObserver`) so consumers in the
     * render hot path (`projectWorld3DToScreen`, `coordinatesToNDC`,
     * `FloorPlanUI` overlay) can read the viewport size **without** triggering
     * a synchronous layout flush by reading `clientWidth` / `clientHeight`
     * directly. Each per-frame layout read used to cost ~6% of CPU in the
     * Chrome trace (5 100 sampling-snapshots on `get clientWidth` over 8.4 s);
     * routing those reads through a signal eliminates that cost entirely.
     *
     * Renderer-internal signal — written via `.set()` from view code without a
     * Command (mirrors the existing `fCameraData` / `e2CameraData` precedent).
     * Bypasses the command system because it is not user-actionable and not
     * part of project state.
     *
     * Initial value `0` is fine: every projection consumer already short-circuits
     * on a degenerate frustum (`scaleX <= 0` / `clientWidth === 0`) until the
     * first `ResizeObserver` fires from the view.
     */
    viewportWidth: Value<number>;
    viewportHeight: Value<number>;
    private viewsCount;
    private views;
    constructor(coreMode: CoreMode, id: string, domElement: HTMLDivElement, appDataAPI: AppData, looksAPI: looksAPI, materialsAPI: materialsAPI, projectSettingsAPI: IProjectSettings, models3DAPI: models3DAPI, catalogClassificationsAPI: ICatalogClassifications, privateCatalogAPI: ICatalog, masterCatalogAPI: ICatalog, paperSpaceAPI: IPaperSpaceState, areaHeaderAPI: IAreaHeader, roomplanData: CapturedRoom | null, systemDataAPI?: SystemsAPI);
    getViews: () => View[];
    getViewByType: (type: ViewType) => View | undefined;
    addView: (view: View) => number;
    removeView: (index: number) => void;
    /**
     * Render per-system paperspace `IView` exports for every multiCloset system in the loaded
     * project. Dispatches to the registered `designer3D` view's optional `createAllViews`
     * capability (see `View.createAllViews?` in the declarations). Returns `{}` when no
     * `designer3D` view is registered yet, or when the registered view doesn't implement the
     * capability (e.g. a test stub / non-rendering placeholder).
     *
     * Result is grouped by systemId (`IViewsBySystem`) — see the type in
     * `declarations/PaperSpace.ts` for shape docs, flat-map recipes, and the pass-through-to-
     * `PaperSpaceProvider` trick.
     */
    generatePaperSpaceViews: (opts?: {
        maxSize?: number;
        wallDistance?: number;
    }) => Promise<IViewsBySystem>;
    addNode(node: Node): void;
    registerNode(node: Node): void;
    unregisterNode(id: UUID): void;
    createValue<T>(initialValue: IValue<T>, options?: ValueOptionsType): Value<T>;
    createTransformedValue<T>(initialValue: IValue<T>, options: ValueOptionsType | undefined, transform: (value: T) => T): TransformedValue<T>;
    createShapeValue(initialValue: IShapeValue, options?: ValueOptionsType): ShapeValue;
    createCurveValue(initialValue: ICurveValue, options?: ValueOptionsType): CurveValue;
    registerEffect(callBack: Effect): () => void;
    setAppDataFromJSON(appData: AppData): void;
    getCatalogClassifications(): ICatalogClassifications;
    /**
     * Bill-of-materials calculation for the current scene. Walks the node subtree
     * from `rootId`, generates a per-node calculation, groups it per item and per
     * project, and rolls each category up into per-material quantities. One-shot
     * (non-reactive) read — intended for save / export, not for the render loop.
     */
    getCalculation(): CalculationResult;
    /**
     * Auto-fill every not-yet-generated multiCloset in the project with a section
     * layout. Non-history: the fill runs on a step switch (which already clears
     * undo/redo) and is not meant to be undoable. Intended to be called from the
     * consuming app when its relevant step is switched — each closet is filled with
     * the same closest-fit planner as the per-closet "Fill Multi Closet" action,
     * then marked `isGenerated` so a repeated switch skips already-filled closets.
     *
     * Zero-arg, and SYNCHRONOUS — core performs no I/O here. Both inputs are already
     * on the core:
     *   - the content-option list from {@link sectionOptions}, seeded by the app via
     *     {@link setSectionOptionsFromJSON} (core owns no URLs — CLAUDE.md rule 11);
     *   - the per-category desire from {@link systemData}, read off the `needs` of the
     *     system each closet belongs to. There are no intensity sliders: what the
     *     customer asked for lives on the system.
     *
     * With `sectionOptions` never seeded the call is a logged no-op rather than a
     * crash, so a missing app-side seed degrades to "auto-fill did nothing".
     *
     * Returns one result per PENDING closet, including the ones that were skipped
     * rather than filled (`skipReason` says which: no system, no recognisable need,
     * or no content option able to build any requested category). A skipped closet
     * keeps `isGenerated === false`, so it is filled on a later call once the
     * missing piece appears. Empty when no closet is pending.
     *
     * BREAKING (was `Promise<FillMultiClosetResult[]>`) — **migration: drop `await` /
     * `.then()` at every call site.** The method became synchronous when the
     * content-option fetch moved out to the app (core owns no URLs), leaving no I/O
     * to await. `await` on the result is harmless in JavaScript but is now a
     * TypeScript error; `.then()` fails at RUNTIME with ".then is not a function",
     * and a consumer compiled against the old types gets no warning — so this must
     * be called out in the PR rather than left to the type checker.
     */
    fillMultiClosets(): FillMultiClosetResult[];
    setModels3DFromJSON(models3DAPI: models3DAPI): void;
    setCatalogClassificationsFromJSON(catalogClassificationsAPI: ICatalogClassifications): void;
    setSystemDataFromJSON(systemDataAPI?: SystemsAPI): void;
    /**
     * Seed the app-loaded multiCloset content-option catalog (see {@link sectionOptions}).
     * A nullish or non-array payload collapses to `[]`, mirroring `setSystemDataFromJSON` — a
     * failed fetch app-side then degrades to "auto-fill does nothing, and says so" instead of
     * throwing from inside the fill.
     */
    setSectionOptionsFromJSON(sectionOptionsAPI?: SectionContentProfile[]): void;
    setMaterialsFromJSON(materialsAPI: materialsAPI): void;
    setLooksFromJSON(looksDB: any): void;
    /**
     * Serialize the loaded area for persistence: the scene (`appData`), project settings, the
     * systems config (re-emitted verbatim), and — optionally — the two EXPENSIVE slices:
     * `designSheetData` (per-system paperspace views, rendered through the registered
     * `designer3D` view) and `calcData` (the full bill-of-materials scene walk).
     *
     * Each option is an OPT-OUT defaulting to `true`, and it gates the WORK, not just the
     * payload: only an explicit `false` skips the computation (and omits the field from the
     * result), so a partial object still computes every field it does not mention.
     * `saveArea()`, `saveArea({})`, and `saveArea({ designSheetData: true })` are all the
     * full save. A caller that only needs the scene snapshot (e.g. a periodic autosave)
     * passes `{ designSheetData: false, calcData: false }` and pays for neither.
     *
     * Reads the scene through tracked `Value.get()`s — never call inside a reactive effect
     * scope (see `registerAutosave`, which defers every flush through a timer for this reason).
     */
    saveArea: (options?: {
        designSheetData?: boolean;
        calcData?: boolean;
    }) => Promise<{
        appData: AppData;
        projectSettings: IProjectSettings;
        designSheetData?: IViewsBySystem;
        calcData?: CalculationResult;
        systemData: SystemsAPI;
    }>;
    /**
     * The dev/debug "Save Area" action: run the FULL {@link saveArea} and download every
     * slice as its own JSON file (`appData.json`, `projectSettings.json`,
     * `designSheetData.json`, `systemData.json`, `calcData.json`). The successor of the old
     * `saveArea(true)` download flag, split out when `saveArea` gained its options.
     */
    downloadArea: () => Promise<void>;
    runCommandsAsTransaction(commands: Command | Command[], transactionName?: string, addToHistory?: boolean): boolean;
    beginTransaction(name: string, addToHistory?: boolean): Transaction;
    endTransaction(transaction: Transaction): void;
    abortTransaction(transaction: Transaction): void;
    dispose(): void;
}
