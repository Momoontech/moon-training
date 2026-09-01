import { effect } from '@preact/signals-react';
import { AreaHeader } from './components/AreaHeader/index.js';
import { CoreHandlers } from './components/CoreHandlers/index.js';
import CurveValue from './components/CurveValue/index.js';
import { saveRecursive } from './components/Node/index.js';
import { PaperSpace } from './components/PaperSpace/index.js';
import { createProjectSettings } from './components/ProjectSettings/helpers/createProjectSettings.js';
import ShapeValue from './components/ShapeValue/index.js';
import Value from './components/Value/index.js';
import TransformedValue from './components/Value/TransformedValue.js';
import { CreateNodeCommand, RemoveNodeCommand } from './components/commands/CreateNodeCommand.js';
import { TransactionManager } from './components/commands/core/TransactionManager.js';
import './declarations/Attributes.js';
import './declarations/BoxContainer.js';
import { GeneralViewMode, FloorPlanDrawMode, CoreMode, MobileStep } from './declarations/CoreDesigner.js';
import './declarations/Edgebanding.js';
import './declarations/FreeBoxContainer.js';
import './declarations/helpers.js';
import { V2Axes } from './declarations/InterpretedLine.js';
import './declarations/Loader.js';
import './declarations/Model.js';
import './declarations/Molding.js';
import './declarations/Node.js';
import './declarations/Panel.js';
import './declarations/PaperSpace.js';
import './declarations/Part.js';
import './declarations/ProjectSettings.js';
import './declarations/Segment.js';
import './declarations/SurfaceSettings.js';
import { SystemStatus } from './declarations/systems.js';
import './declarations/UIAttributes.js';
import './declarations/Valance.js';
import { ViewType } from './declarations/views.js';
import { getCalculations } from './helpers/calculation/getCalculations.js';
import { convertCapturedRoom, applyRoomPlanProducts } from './helpers/converter/roomplan/converter.js';
import { getMonitor } from './helpers/monitor.js';
import { fillMultiClosets } from './helpers/multiCloset/fillMultiClosets.js';
import { CoreStorage } from './storage/index.js';
import { mapMaterials } from './helpers/Loader.js';
import CoreSignal from './components/CoreSignal/index.js';
import getOptionalNode from './components/Node/helpers/getOptionalNode.js';
import getRoom from './components/Node/helpers/getRoom.js';
import getRoomSegment from './components/Node/helpers/getRoomSegment.js';
import { hasUprightViewCounterpart } from './components/Node/helpers/getSelectableNode.js';
import getStage from './components/Node/helpers/getStage.js';
import './helpers/id.js';
import SetMultiClosetSystemStatusCommand from './components/commands/SetMultiClosetSystemStatusCommand.js';
import { Vector2 } from './helpers/math/Vector2.js';
import { Vector3 } from './helpers/math/Vector3.js';
import './helpers/math/plane/unitBoxCorners.js';
import './helpers/math/plane/projectUnitBoxToFootprint2D.js';
import './components/Node/components/AdjustableBox/index.js';
import './components/Node/components/AdjustableExtrusion/index.js';
import './components/Node/components/BoxContainer/index.js';
import './components/Node/components/Carcass/index.js';
import './components/Node/components/Ceiling2D/index.js';
import './components/Node/components/Countertop/index.js';
import './components/Node/components/CrownMolding/index.js';
import './components/Node/components/Edgebanding/index.js';
import './components/Node/components/Floor2D/index.js';
import './components/Node/components/Frame/index.js';
import './components/Node/components/FreeBoxContainer/index.js';
import './components/Node/components/GateFrame/index.js';
import './components/Node/components/Glass/index.js';
import './components/Node/components/Image/index.js';
import './components/Node/components/Item/index.js';
import './components/Node/components/LaminateBox/index.js';
import './components/Node/components/MiteredPanel/index.js';
import './components/Node/BaseModel.js';
import './components/Node/components/Molding/index.js';
import './components/Node/components/MountLine/index.js';
import './components/Node/components/MountPlane/index.js';
import './components/Node/components/MountPoint/index.js';
import './components/Node/components/Panel/index.js';
import './components/Node/components/Part/index.js';
import './components/Node/components/Point/index.js';
import './components/Node/components/PointLight/index.js';
import './components/Node/components/RawPanel/index.js';
import './helpers/cathedral/computeCathedralContext.js';
import './components/Node/components/ShapedBoxContainer/index.js';
import './components/Node/components/SpotLight/index.js';
import './components/Node/components/Tiles/index.js';
import './components/Node/components/ToeKickPanel/index.js';
import './components/Node/components/Valance/index.js';
import './components/Node/components/Wall2D/index.js';
import './components/Node/components/WindowFrame/index.js';
import './components/commands/core/Command.js';
import './helpers/getMultiClosetJointTarget.js';
import SetEditor2DBaseNodeIdCommand from './components/commands/SetEditor2DBaseNodeIdCommand.js';
import SetSelectedNodeIdCommand from './components/commands/SetSelectedNodeIdCommand.js';
import './helpers/calculation/getPerPartCalculations.js';
import './components/Node/helpers/defaultHoleCurve.js';
import './helpers/multiCloset/contentPartTypes.js';
import './components/Node/helpers/getResizableSides.js';
import 'polygon-clipping';
import './helpers/itemClearances.js';
import './helpers/multiCloset/fundamentalDesign.js';
import './helpers/multiCloset/systemNeeds.js';
import { save, MimeType } from './helpers/save.js';

// const callback = (view: View) => (node: Node) => {
//   view.addNode(node);
// };
const updateStepEffect = (core) => {
    if (core.projectSettings.coreMode === CoreMode.mobile) {
        const step = core.projectSettings.mobileSettings.step.get();
        if (step) {
            core.runCommandsAsTransaction([new SetSelectedNodeIdCommand(null) /*new SetSelectedRoomIdCommand(null)*/], 'updateStepEffect', false);
        }
    }
    return undefined;
};
/**
 * Policy: whether entering `step` resets undo/redo history. Each wizard step is a fresh
 * editing context, so by default any real step resets. This is the single knob — change
 * this one function to alter the rule (reset only on specific transitions, never, …).
 */
const shouldResetHistoryOnStep = (step) => step !== MobileStep.None;
/**
 * Clears undo/redo history when the mobile wizard step changes, so undo never crosses a
 * step boundary. Deliberately isolated from {@link updateStepEffect}: the "when" is this
 * effect (re-runs when `mobileSettings.step` changes), the "whether" is
 * {@link shouldResetHistoryOnStep}, and the "how" is {@link TransactionManager.clear} —
 * each is a one-spot edit. No-op on non-mobile cores (the web target never sets a step).
 */
const resetHistoryOnStepEffect = (core) => {
    if (core.projectSettings.coreMode !== CoreMode.mobile)
        return undefined;
    const step = core.projectSettings.mobileSettings.step.get(); // tracked → re-runs on step change
    if (shouldResetHistoryOnStep(step)) {
        core.transactionManager.clear();
    }
    return undefined;
};
/**
 * Self-healing invariant: `editor2DBaseNodeId` must never reference a disposed node.
 *
 * Tracking `core.nodeIds` re-runs this effect whenever a node is added or
 * removed; `core.nodes.has(id)` is O(1). The clear is dispatched through
 * `SetEditor2DBaseNodeIdCommand` (not a raw `signal.set`) with
 * `addToHistory: false` so auto-recovery never pollutes the undo stack —
 * mirroring `updateStepEffect`.
 */
const validateEditor2DBaseNodeIdEffect = (core) => {
    const id = core.editor2DBaseNodeId.get();
    if (!id)
        return undefined;
    void core.nodeIds.get();
    if (core.nodes.has(id))
        return undefined;
    core.runCommandsAsTransaction(new SetEditor2DBaseNodeIdCommand(null), 'validateEditor2DBaseNodeIdEffect', false);
    return undefined;
};
const updateSystemStatusEffect = (core) => {
    if (core.projectSettings.coreMode !== CoreMode.mobile)
        return undefined;
    const step = core.projectSettings.mobileSettings.step.get();
    const systems = core.systemData.get();
    switch (step) {
        case MobileStep.Catalog: {
            for (let i = 0; i < systems.length; i++) {
                if (systems[i].state === SystemStatus.Plot) {
                    core.runCommandsAsTransaction(new SetMultiClosetSystemStatusCommand(systems[i].id, SystemStatus.Design), '', false);
                }
            }
            return undefined;
        }
        case MobileStep.Present: {
            for (let i = 0; i < systems.length; i++) {
                if (systems[i].state === SystemStatus.Design) {
                    core.runCommandsAsTransaction(new SetMultiClosetSystemStatusCommand(systems[i].id, SystemStatus.Present), '', false);
                }
            }
            return undefined;
        }
        default:
            return undefined;
    }
};
/**
 * Self-healing invariant: when the user is in `editor2D` view mode,
 * `editor2DBaseNodeId` must point at some `Wall2D`. If it is `null` (the
 * default — the signal is not persisted in `appData`), pick the first wall
 * of the current stage so the renderer's `changeAreaGeneralViewModeEffect`
 * has a wall to center the camera on.
 *
 * Dispatched through `SetEditor2DBaseNodeIdCommand` with `addToHistory: false`
 * so this auto-fill never pollutes the undo stack — mirroring
 * `validateEditor2DBaseNodeIdEffect`.
 */
const fillEditor2DBaseNodeIdEffect = (core) => {
    if (core.generalViewMode.get() !== GeneralViewMode.editor2D)
        return undefined;
    if (core.editor2DBaseNodeId.get())
        return undefined;
    const stage = getStage(core, core.currentStage.get());
    for (const roomId of stage.rooms.get()) {
        const room = getRoom(core, roomId);
        for (const segmentId of room.path.get()) {
            const segment = getRoomSegment(core, segmentId);
            const wall2DId = segment.wall2D.get();
            if (wall2DId) {
                core.runCommandsAsTransaction(new SetEditor2DBaseNodeIdCommand(wall2DId), 'fillEditor2DBaseNodeIdEffect', false);
                return undefined;
            }
        }
    }
    return undefined;
};
/**
 * Selection invariant across a view-mode switch: a selection with nothing to stand
 * on in editor2D / editor3D is dropped on entering those modes.
 *
 * Selection is a SINGLE id shared by every view, and each view highlights its own
 * representation of it — the floor plan its SVG overlay, the 3D scene the matching
 * `NodeView`. Two cases have no such representation and would otherwise linger as
 * an invisible selection carrying a floor-plan-only toolbar:
 *
 *   - a corner `Point` — nothing in the 3D scene belongs to it (the wall meshes
 *     meeting at the corner belong to the adjacent `RoomSegment`s);
 *   - a `RoomSegment` **where a wall is not selectable at all**. It normally
 *     survives the switch as its `Wall2D` (`getSelectableNode`'s fold + designer3d's
 *     `changeSelectedObjectEffect`), but the mobile design steps drop `Wall2D` from
 *     the selectable set (`designStepSelectableNodeTypes`) precisely so walls don't
 *     swallow taps meant for products — so a wall selected in the top view and
 *     carried into editor2D / editor3D on e.g. the Architecture step must go.
 *
 * `hasUprightViewCounterpart` owns that decision (it probes the real per-mode /
 * per-step resolver rather than re-deriving the matrix here).
 *
 * Reads `generalViewMode` + `selectedNodeId` so it re-runs on either — and, through
 * the probe, the mobile step, so a step change re-evaluates too. Dispatched through
 * `SetSelectedNodeIdCommand` with `addToHistory: false` — the same self-healing
 * pattern as `validateEditor2DBaseNodeIdEffect`, so an automatic deselect never
 * becomes its own undo step.
 */
const clearSelectionWithoutSceneCounterpartEffect = (core) => {
    const mode = core.generalViewMode.get();
    if (mode !== GeneralViewMode.editor2D && mode !== GeneralViewMode.editor3D)
        return undefined;
    const id = core.selectedNodeId.get();
    if (!id)
        return undefined;
    // Only a LIVE node is cleared. An id with no node behind it is left alone: stale-id
    // healing is not this effect's job, and clearing it here would fight the selection
    // the caller just made (a selection set before its node lands, e.g. in tests /
    // catalog previews).
    const node = getOptionalNode(core, id);
    if (!node || hasUprightViewCounterpart(core, node))
        return undefined;
    core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(null), 'clearSelectionWithoutSceneCounterpartEffect', false);
    return undefined;
};
/**
 * Coerce the loaded `systemData` blob into the reactive `core.systemData` value: a nullish or
 * non-array input collapses to `[]`, otherwise the array is passed through as-is. Entries are
 * expected to already carry the `id` that the granular Remove / SetName commands target — both the
 * loaded blob and `AddMultiClosetSystemCommand` provide one; this coercion does not synthesize
 * missing ids.
 */
const normalizeSystemData = (systemDataAPI) => {
    if (!Array.isArray(systemDataAPI))
        return [];
    return systemDataAPI;
};
class CoreDesigner {
    id;
    rootId = '';
    nodes = new Map();
    nodeIds = new CoreSignal([]);
    pointerPosition = new CoreSignal(new Vector2());
    domElement;
    /**
     * Designer-wide pointer-gesture source — single source of truth for touch
     * count, the multi-touch latch, pinch deltas, and gesture-reset across both
     * `@moon/designer-ui` (drag-session arbitration) and `@moon/designer3d`
     * (canvas two-finger gesture promotion). Exposed as the read-only
     * {@link IPointerGestureSource} contract so consumers cannot reach lifecycle
     * members; the concrete owner is held privately in {@link _handlers} for
     * disposal. Attached to `domElement` on construction, disposed in `dispose()`.
     */
    handlers;
    /** Concrete owner of {@link handlers}, kept private for lifecycle only. */
    _handlers;
    storage = new CoreStorage();
    projectSettings;
    transactionManager = new TransactionManager(this);
    paperSpace;
    areaHeader;
    // TODO: generalViewMode get from projectSettings
    generalViewMode = this.createValue(GeneralViewMode.floorPlan);
    editor2DBaseNodeId = this.createValue(null);
    // roomMode = this.createValue(RoomMode.single);
    // pointDragMode = this.createValue(PointDragMode.allCorner);
    selectedNodeId;
    selectedSystemId;
    /**
     * Loaded systems config (`systemData.json`) as a reactive value. Replaces the old
     * `projectSettings.multiClosetSystems` registry and the `storage.systemData` slot.
     * `SystemsAPI` is a typed array of `{ id, name, … }` entries (see `declarations/systems.ts`);
     * entry ids are opaque strings. Mutated via the granular system commands
     * (Add / Remove / SetName) and re-emitted on `saveArea`.
     */
    systemData;
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
    sectionOptions = [];
    draggedNodeId = this.createValue(null);
    draggedNodeOffset = this.createValue(new Vector3());
    hoveredNodeId = this.createValue(null);
    /** Set when dragging from catalog. Carries a full `CatalogConfig` — a path string,
     * an `IValue<string>` formula, a `source`-linked partial, or a full inline catalog object. */
    draggedCatalogPath = this.createValue(null);
    currentStage;
    isMeasurementsEnabled = this.createValue(true);
    /**
     * M3D-309 — the node whose dimension is currently being EDITED (its overlay input
     * has focus). The designer-ui `DimensionFocusTarget` wrapper sets this + the target
     * zoom below on focus-in and clears them on blur / unmount. The designer3d
     * camera-focus effect frames this node (top-view ortho `fCamera`) while set.
     * Ephemeral UI state — set directly, NOT through a command (no undo history), same
     * as {@link hoveredNodeId}.
     */
    dimensionFocusNodeId = this.createValue(null);
    /**
     * M3D-309 — target orthographic zoom the floorplan camera animates TO when framing
     * {@link dimensionFocusNodeId} (the wrapper's `zoom` prop). `null` when nothing is
     * focused. Ephemeral, set alongside `dimensionFocusNodeId`.
     */
    dimensionFocusZoom = this.createValue(null);
    /**
     * M3D-309 — explicit world-floor `(x, z)` point to frame instead of {@link dimensionFocusNodeId}'s
     * node centre. Used when the edited dimension is NOT a node — e.g. a product clearance, whose
     * line runs from the item edge out to a boundary and so is offset from the item centre. The
     * `DimensionFocusTarget` wrapper sets this (alongside the node id, kept for the clear guard) to
     * the dimension's own midpoint; the designer3d effect prefers it over the node centre when
     * present. `null` for wall / corner dimensions (they frame their node). Ephemeral.
     */
    dimensionFocusPoint = this.createValue(null);
    /**
     * "Any-mode" input-centring — the CANVAS-space screen centre (CSS px, top-left origin, same frame
     * as `projectWorld3DToScreen`) of the currently-focused dimension input. The `DimensionFocusTarget`
     * wrapper measures the field's rect on focus-in and clears on blur / unmount. The designer3d
     * camera-focus effect uses it (with {@link dimensionFocusNodeId} for the perspective depth) to pan
     * the editor2D / editor3D camera so the EXACT field — not just the node centre — lands at screen
     * centre. Floorplan ignores it (its node/point framing already centres the field). Ephemeral.
     */
    dimensionFocusScreenPoint = this.createValue(null);
    floorPlanDrawMode = this.createValue(FloorPlanDrawMode.none);
    drawRoomData = {
        pointer: {
            [V2Axes.x]: this.createValue(0),
            [V2Axes.y]: this.createValue(0)
        },
        prevPointer: this.createValue(null),
        transaction: null
    };
    // selectedRoomId: Value<UUID | null | undefined> = this.createValue(undefined);
    // bundleGroup = new BundleGroup();
    effects = [
        updateStepEffect,
        resetHistoryOnStepEffect,
        validateEditor2DBaseNodeIdEffect,
        fillEditor2DBaseNodeIdEffect,
        clearSelectionWithoutSceneCounterpartEffect,
        updateSystemStatusEffect
    ];
    disposeEffects = () => { };
    e3CameraData;
    fCameraData;
    wCameraData;
    e2CameraData;
    controlsData;
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
    viewportWidth = this.createValue(0);
    viewportHeight = this.createValue(0);
    viewsCount = 0;
    views = [];
    constructor(coreMode, id, domElement, appDataAPI, looksAPI, materialsAPI, projectSettingsAPI, models3DAPI, catalogClassificationsAPI, privateCatalogAPI, masterCatalogAPI, paperSpaceAPI, areaHeaderAPI, roomplanData, systemDataAPI) {
        this.id = id;
        this.domElement = domElement;
        this._handlers = new CoreHandlers(domElement);
        this.handlers = this._handlers;
        this.systemData = this.createValue(normalizeSystemData(systemDataAPI));
        this.setLooksFromJSON(looksAPI);
        this.setMaterialsFromJSON(materialsAPI);
        this.setModels3DFromJSON(models3DAPI);
        // Data must already be at the current version — the app runs
        // `@moon/vesta-converter`'s `convertProjectData()` at the data boundary before
        // constructing the core: it migrates legacy blobs and builds brand-new empty
        // projects directly in the current format (via `createDefaultFloorplan`). The
        // constructor never migrates; it only seeds the catalogs into storage
        // (previously done inside the converter).
        if (!appDataAPI || Object.keys(appDataAPI).length === 0) {
            throw new Error('CoreDesigner expects non-empty, already-current appData — convert it in the app via convertProjectData().');
        }
        getMonitor().debug('areaHeaderDB>', areaHeaderAPI);
        this.storage.set('catalog', { master: masterCatalogAPI, private: privateCatalogAPI });
        const convertedAppData = JSON.parse(JSON.stringify(appDataAPI));
        const projectSettings = projectSettingsAPI;
        const catalogClassifications = catalogClassificationsAPI;
        const paperSpace = paperSpaceAPI;
        const areaHeader = areaHeaderAPI;
        // if roomPlanData is provided, convert it, replace existing appData and apply room plan products
        const appData = roomplanData ? convertCapturedRoom(this, roomplanData) : convertedAppData;
        this.e3CameraData = this.createValue(appData.perspectiveCamera);
        this.fCameraData = this.createValue(appData.floorplanCamera);
        this.wCameraData = this.createValue(appData.perspectiveCamera);
        this.e2CameraData = this.createValue(appData.orthoCamera);
        this.controlsData = this.createValue(appData.controls);
        this.currentStage = this.createValue(appData.floorplanModeParams.currentStage);
        this.setCatalogClassificationsFromJSON(catalogClassifications);
        this.projectSettings = createProjectSettings(this, projectSettings, coreMode);
        // PaperSpace can run standalone (built from its DB blob with no core) for the documents /
        // `@moon/designer-paperspace` read-only flow. Here we pass `this`, so PaperSpace runs connected:
        // its mutators dispatch through `runCommandsAsTransaction`, joining the project undo/redo history.
        this.paperSpace = new PaperSpace(paperSpace, this);
        this.areaHeader = new AreaHeader(this, areaHeader);
        this.setAppDataFromJSON(appData);
        if (roomplanData)
            applyRoomPlanProducts(this, roomplanData);
        this.selectedNodeId = this.createValue(appData.selectedObject);
        this.selectedSystemId = this.createValue(appData.selectedSystem ?? null);
        getMonitor().debug(`CoreDesigner created with id:${this.id}`, coreMode, this, 904);
        const effectDisposers = [];
        for (const cb of this.effects) {
            effectDisposers.push(this.registerEffect(() => cb(this)));
        }
        this.disposeEffects = () => {
            for (const dispose of effectDisposers)
                dispose();
        };
    }
    getViews = () => {
        return this.views.filter((view) => Boolean(view));
    };
    getViewByType = (type) => {
        return this.views.find((view) => view?.viewType === type);
    };
    addView = (view) => {
        const index = this.views.indexOf(undefined);
        if (index !== -1) {
            view.setViewIndex(index);
            // applyRecursive(this.rootId, this, () => {});
            this.views[index] = view;
            return index;
        }
        view.setViewIndex(this.viewsCount);
        // applyRecursive(this.rootId, this, () => {});
        this.views.push(view);
        this.viewsCount += 1;
        return this.viewsCount - 1;
    };
    removeView = (index) => {
        if (this.views[index]) {
            this.views[index].dispose();
            this.views[index] = undefined;
        }
    };
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
    generatePaperSpaceViews = async (opts) => {
        const view = this.getViewByType(ViewType.designer3D);
        if (!view?.createAllViews)
            return {};
        return view.createAllViews(opts);
    };
    addNode(node) {
        // const views = this.getViews();
        // for (const view of views) {
        //   view.addNode(node);
        // }
        // Signal fired here — after full construction — so reactive views (e.g. AreaDesigner3D)
        // receive the node only when all its fields are ready.
        this.nodeIds.set([...this.nodeIds.get(), node.id]);
    }
    // public disposeNode(node: Node) {
    //   // const views = this.getViews();
    //   // for (const view of views) {
    //   //   view.removeNode(node);
    //   // }
    // }
    registerNode(node) {
        // Only registers the node in the Map; nodeIds signal is updated later in addNode
        // so reactive effects never see a half-constructed node.
        this.nodes.set(node.id, node);
    }
    unregisterNode(id) {
        this.nodes.delete(id);
        this.nodeIds.set(this.nodeIds.get().filter((nId) => nId !== id));
    }
    createValue(initialValue, options = {}) {
        return new Value(initialValue, this, options);
    }
    createTransformedValue(initialValue, options = {}, transform) {
        return new TransformedValue(initialValue, this, options, transform);
    }
    createShapeValue(initialValue, options = {}) {
        return new ShapeValue(initialValue, this, options);
    }
    createCurveValue(initialValue, options = {}) {
        return new CurveValue(initialValue, this, options);
    }
    registerEffect(callBack) {
        const dispose = effect(() => {
            const cleanup = callBack();
            if (cleanup && typeof cleanup === 'function') {
                return cleanup;
            }
            return undefined;
        });
        return dispose;
    }
    setAppDataFromJSON(appData) {
        this.rootId = appData.floorplan;
        // createRecursive(appData.objects3D, this.rootId, this);
        this.runCommandsAsTransaction([new CreateNodeCommand(appData.objects3D, this.rootId, undefined)], '', false);
        // coreLog(`CoreDesigner loaded from JSON :`, appData);
    }
    getCatalogClassifications() {
        return this.storage.get('catalogClassifications');
    }
    /**
     * Bill-of-materials calculation for the current scene. Walks the node subtree
     * from `rootId`, generates a per-node calculation, groups it per item and per
     * project, and rolls each category up into per-material quantities. One-shot
     * (non-reactive) read — intended for save / export, not for the render loop.
     */
    getCalculation() {
        return getCalculations(this);
    }
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
    fillMultiClosets() {
        return fillMultiClosets(this, this.sectionOptions);
    }
    setModels3DFromJSON(models3DAPI) {
        this.storage.set('models3D', models3DAPI);
    }
    setCatalogClassificationsFromJSON(catalogClassificationsAPI) {
        this.storage.set('catalogClassifications', catalogClassificationsAPI);
    }
    setSystemDataFromJSON(systemDataAPI) {
        this.systemData.set(normalizeSystemData(systemDataAPI));
    }
    /**
     * Seed the app-loaded multiCloset content-option catalog (see {@link sectionOptions}).
     * A nullish or non-array payload collapses to `[]`, mirroring `setSystemDataFromJSON` — a
     * failed fetch app-side then degrades to "auto-fill does nothing, and says so" instead of
     * throwing from inside the fill.
     */
    setSectionOptionsFromJSON(sectionOptionsAPI) {
        this.sectionOptions = Array.isArray(sectionOptionsAPI) ? sectionOptionsAPI : [];
    }
    setMaterialsFromJSON(materialsAPI) {
        this.storage.set('materials', mapMaterials(materialsAPI));
    }
    setLooksFromJSON(looksDB) {
        this.storage.set('looks', looksDB);
    }
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
    saveArea = async (options) => {
        const objects3D = {};
        saveRecursive(objects3D, this.rootId, this);
        const appData = {
            floorplan: this.rootId,
            perspectiveCamera: this.e3CameraData.get(),
            orthoCamera: this.e2CameraData.get(),
            floorplanCamera: this.fCameraData.get(),
            controls: this.controlsData.get(),
            orthoMode: false,
            floorplanMode: false,
            floorplanModeParams: {
                instruments: {
                    mergeCorners: { enabled: false },
                    deleteObject: { enabled: false }
                },
                currentStage: this.currentStage.get()
            },
            objects3D,
            objectsCalc: {},
            selectedObject: null,
            selectedSystem: null
        };
        const projectSettings = this.projectSettings.serialize();
        const systemData = this.systemData.peek();
        const result = { appData, projectSettings, systemData };
        // Opt-out gates on the WORK (see the method doc): only an explicit `false` skips.
        if (options?.designSheetData !== false) {
            result.designSheetData = await this.generatePaperSpaceViews();
        }
        if (options?.calcData !== false) {
            result.calcData = this.getCalculation();
        }
        return result;
    };
    /**
     * The dev/debug "Save Area" action: run the FULL {@link saveArea} and download every
     * slice as its own JSON file (`appData.json`, `projectSettings.json`,
     * `designSheetData.json`, `systemData.json`, `calcData.json`). The successor of the old
     * `saveArea(true)` download flag, split out when `saveArea` gained its options.
     */
    downloadArea = async () => {
        const { appData, projectSettings, designSheetData, systemData, calcData } = await this.saveArea();
        save(JSON.stringify(appData), 'appData.json', MimeType.JSON);
        save(JSON.stringify(projectSettings), 'projectSettings.json', MimeType.JSON);
        save(JSON.stringify(designSheetData), 'designSheetData.json', MimeType.JSON);
        save(JSON.stringify(systemData), 'systemData.json', MimeType.JSON);
        save(JSON.stringify(calcData), 'calcData.json', MimeType.JSON);
    };
    runCommandsAsTransaction(commands, transactionName = '', addToHistory) {
        return this.transactionManager.runCommandsAsTransaction(commands, transactionName, addToHistory);
    }
    beginTransaction(name, addToHistory) {
        return this.transactionManager.beginTransaction(name, addToHistory);
    }
    endTransaction(transaction) {
        this.transactionManager.endTransaction(transaction);
    }
    abortTransaction(transaction) {
        this.transactionManager.abortTransaction(transaction);
    }
    dispose() {
        getMonitor().debug(`Disposing CoreDesigner with id:${this.id}`);
        this.disposeEffects();
        this._handlers.dispose();
        this.runCommandsAsTransaction([new RemoveNodeCommand(this.rootId)], 'dispose', false);
        this.nodes.clear();
        this.nodeIds.set([]);
        this.storage.dispose();
        for (let i = 0; i < this.views.length; i++) {
            this.removeView(i);
        }
    }
}

export { CoreDesigner };
