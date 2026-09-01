import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import { EShapeType } from '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { generateId } from '../../helpers/id.js';
import { getMonitor } from '../../helpers/monitor.js';
import '../Node/components/AdjustableBox/index.js';
import '../Node/components/AdjustableExtrusion/index.js';
import '../Node/components/BoxContainer/index.js';
import '../Node/components/Carcass/index.js';
import '../Node/components/Ceiling2D/index.js';
import '../Node/components/Countertop/index.js';
import '../Node/components/CrownMolding/index.js';
import '../Node/components/Edgebanding/index.js';
import '../Node/components/Floor2D/index.js';
import '../Node/components/Frame/index.js';
import '../Node/components/FreeBoxContainer/index.js';
import '../Node/components/GateFrame/index.js';
import '../Node/components/Glass/index.js';
import '../Node/components/Image/index.js';
import '../Node/components/Item/index.js';
import '../Node/components/LaminateBox/index.js';
import '../Node/components/MiteredPanel/index.js';
import '../Node/BaseModel.js';
import '../Node/components/Molding/index.js';
import '../Node/components/MountLine/index.js';
import '../Node/components/MountPlane/index.js';
import '../Node/components/MountPoint/index.js';
import '../Node/components/Panel/index.js';
import '../Node/components/Part/index.js';
import '../Node/components/Point/index.js';
import '../Node/components/PointLight/index.js';
import '../Node/components/RawPanel/index.js';
import '@preact/signals-react';
import '../../helpers/cathedral/computeCathedralContext.js';
import '../Node/components/ShapedBoxContainer/index.js';
import '../Node/components/SpotLight/index.js';
import '../Node/components/Tiles/index.js';
import '../Node/components/ToeKickPanel/index.js';
import '../Node/components/Valance/index.js';
import '../Node/components/Wall2D/index.js';
import '../Node/components/WindowFrame/index.js';
import '../../helpers/math/plane/unitBoxCorners.js';
import '../../helpers/math/plane/projectUnitBoxToFootprint2D.js';
import SetCoreSignalCommand from '../commands/SetCoreSignalCommand.js';
import '../../helpers/getMultiClosetJointTarget.js';
import { AddElementCommand, UpdateElementCommand, DeleteElementCommand, AddPageCommand, AddEmptyPageCommand, AddCollagePageCommand, RemovePageCommand, AddViewCommand, RemoveViewCommand, AddPageViewCommand, UpdateViewPropertiesCommand } from '../commands/PaperSpaceCommands.js';
import '../commands/core/Command.js';
import { TransactionManager } from '../commands/core/TransactionManager.js';
import CoreSignal from '../CoreSignal/index.js';
import { createRulerSizes } from './helper.js';

const deepClone = (obj) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
};
const CLONE_OFFSET = 40;
/**
 * Build a minimal stand-in for a standalone (read-only) `PaperSpace` — used when no real core is
 * supplied. Structurally typed against `PaperSpaceHost`, not `CoreDesigner`, so the type system
 * only accepts the two fields paperspace actually reads. Adding a new `this.core.foo` access
 * anywhere in `PaperSpace` that isn't on `PaperSpaceHost` fails to compile — no more
 * typechecks-but-crashes trap on the documents-step route.
 *
 * PaperSpace no longer requires the stand-in to expose `createValue` — its fields are `CoreSignal`s
 * allocated inline (`new CoreSignal(...)`), which do not depend on a `CoreDesigner`. `Value<T>` and
 * its formula-resolving `calculateValue` are used only for token / catalog-bearing state (nodes,
 * project settings), never in paperspace, so paperspace can stand alone without a real core.
 *
 * What's deliberately absent: `runCommandsAsTransaction`. The two mutation seams in this file
 * (`_executeCommand` and `addView`) call it through `?.`, which on the stand-in evaluates to
 * `undefined` and silently drops the command. Consequently a standalone PaperSpace is
 * **effectively read-only**:
 *
 *   - Every mutator (`addText`, `addLine`, `addBlock`, `addView`, `updateElement`, …) is a no-op.
 *   - Because no commands ever land in `transactionManager.history`, `undo()` / `redo()` walk an
 *     empty list — they don't throw, they just have nothing to do.
 *   - Direct signal writes (e.g. `paperSpace.selectedPageID.set(id)` from `usePaperSpacePages`)
 *     bypass the command pipeline and DO work on standalone — they mutate signals directly,
 *     outside the undo history. This is the same pattern as the connected flow; it is a
 *     deliberate non-history channel.
 *
 * If you need editable paperspace with working undo/redo, instantiate `new PaperSpace(db, core)`
 * with a real `CoreDesigner`.
 *
 * The scoped `stub as unknown as CoreDesigner` cast on the `TransactionManager` constructor
 * argument is intentional and narrow — `TransactionManager`'s constructor still declares
 * `CoreDesigner`, but it only reads `.transactionManager` and the `core.paperSpace` back-ref
 * (both of which the stub provides). Widening `TransactionManager`'s param is a separate
 * refactor; the local cast is the minimum-viable seam.
 */
function createStandalonePaperSpaceCore(paperSpace) {
    const stub = {
        paperSpace,
        transactionManager: undefined
    };
    stub.transactionManager = new TransactionManager(stub);
    return stub;
}
/**
 * PaperSpace - High-performance reactive state management
 *
 * Architecture:
 * - Atomic signals: Each element has its own signal
 * - Command-based undo/redo: Only affected elements touched
 * - Map-based storage: O(1) lookups
 */
class PaperSpace {
    /**
     * Owning core — always present, but in TWO flavours that differ in what mutators do:
     *
     *   - **Connected (real `CoreDesigner`)** — passed from the main canvas flow
     *     (`new PaperSpace(db, this)` in `designer-core.ts`). Mutators dispatch through
     *     `core.runCommandsAsTransaction`, joining the project-wide undo/redo history. Full
     *     read/write semantics.
     *
     *   - **Standalone (stand-in)** — built by `createStandalonePaperSpaceCore` when the second
     *     constructor arg is omitted (the documents-step / `@moon/designer-paperspace` read-only
     *     flow). The stand-in provides only `paperSpace` and `transactionManager`;
     *     `runCommandsAsTransaction` is intentionally absent. The mutation seams call it through
     *     `?.`, so every `addText` / `addLine` / `addView` / `updateElement` / … is a silent no-op.
     *     `undo()` / `redo()` resolve to a `TransactionManager` that never receives commands, so
     *     they have nothing to undo. Direct signal writes (e.g. `selectedPageID.set(...)`) still
     *     work — they bypass the command pipeline. **Standalone PaperSpace is effectively
     *     read-only; instantiate with a real `CoreDesigner` if you need editing or working
     *     undo/redo.**
     *
     * `core` is never null in either flavour, so every consumer reads `this.core.*` uniformly with
     * no branching. The field is typed against the narrow `PaperSpaceHost` interface rather than
     * the full `CoreDesigner` — a `CoreDesigner` instance satisfies it structurally, and the
     * standalone stub is authored to match it directly. Any new `this.core.<name>` access outside
     * the interface fails to compile, so the "typechecks-but-throws-at-runtime-on-standalone" trap
     * is closed at the type level.
     */
    core;
    // ── Selection ────────────────────────────────────────────────────────────
    selectedPageID;
    selectedShapeId;
    selectedViewID;
    // ── Pages ─────────────────────────────────────────────────────────────────
    pages;
    pagesOrder;
    // ── Per-canvas state (keyed by pageID or collage-slot pageViewUUID) ───────
    pageCanvasZoom;
    pageCanvasPan;
    pageCanvasContentSize;
    /** Tracks which canvas is currently active (drives toolbar zoom/pan/reset). */
    activeCanvasKey;
    // ── View metadata ─────────────────────────────────────────────────────────
    viewProperties;
    allViewIDs;
    allPageIDs;
    rulerLinesMap;
    dimensionsMap;
    viewTypeMap;
    imageUrlMap;
    // ── Atomic element storage: Map<viewID, Map<itemID, CoreSignal<Item>>> ─────────
    textsMap;
    linesMap;
    tracesMap;
    leadersMap;
    blocksMap;
    labelsMap;
    numbersMap;
    // ── Element ID tracking: Map<viewID, CoreSignal<Set<itemID>>> ─────────────────
    viewTextsIDs;
    viewLinesIDs;
    viewTracesIDs;
    viewLeadersIDs;
    viewBlocksIDs;
    viewLabelsIDs;
    viewNumbersIDs;
    // ── Mode flags ────────────────────────────────────────────────────────────
    traceMode;
    orthoMode;
    leaderMode;
    lineMode;
    textMode;
    pasteMode;
    // ── Continuous measurement ────────────────────────────────────────────────
    continuousMeasurementMode;
    continuousMeasurementPoints;
    continuousMeasurementViewID;
    continuousMeasurementLockedAxis;
    // ── Element visibility ────────────────────────────────────────────────────
    visibility;
    // ── Canvas size (container dimensions, updated by PageCanvas) ────────────
    canvasSize;
    // ── Style settings ────────────────────────────────────────────────────────
    currentScale;
    fontSize;
    textColor;
    bgColor;
    lineWidth;
    lineColor;
    blocks;
    snapping;
    // ── UI state ──────────────────────────────────────────────────────────────
    isDraggingElement;
    /**
     * Fields present in `IPaperSpaceState` but never modeled as live PaperSpace
     * state (the constructor ignores them). Retained verbatim at construction so
     * `serialize()` can round-trip them losslessly instead of inventing values.
     */
    untrackedState;
    constructor(paperSpaceDB, core = null) {
        // Standalone callers pass no core; build a minimal stand-in so mutation seams can read
        // `this.core.runCommandsAsTransaction?.(...)` uniformly. Field signals are plain `CoreSignal`s
        // (`new CoreSignal(...)` below) and do not depend on the core at all.
        this.core = core ?? createStandalonePaperSpaceCore(this);
        this.textsMap = new Map();
        this.linesMap = new Map();
        this.tracesMap = new Map();
        this.leadersMap = new Map();
        this.blocksMap = new Map();
        this.labelsMap = new Map();
        this.numbersMap = new Map();
        this.viewTextsIDs = new Map();
        this.viewLinesIDs = new Map();
        this.viewTracesIDs = new Map();
        this.viewLeadersIDs = new Map();
        this.viewBlocksIDs = new Map();
        this.viewLabelsIDs = new Map();
        this.viewNumbersIDs = new Map();
        this.viewProperties = new Map();
        this.pageCanvasZoom = new Map();
        this.pageCanvasPan = new Map();
        this.pageCanvasContentSize = new Map();
        this.rulerLinesMap = new Map();
        this.dimensionsMap = new Map();
        this.viewTypeMap = new Map();
        this.imageUrlMap = new Map();
        this.selectedShapeId = new CoreSignal(paperSpaceDB.selectedShape?.uuid);
        this.pages = new CoreSignal(JSON.parse(JSON.stringify(paperSpaceDB.pages || {})));
        this.pagesOrder = new CoreSignal(paperSpaceDB.pagesOrder);
        const pageViewByViewID = new Map();
        Object.values(paperSpaceDB.pages || {}).forEach((page) => {
            Object.values(page.pageViews || {}).forEach((pageView) => {
                pageViewByViewID.set(pageView.viewID, pageView);
            });
        });
        const initialViewIDs = new Set();
        Object.entries(paperSpaceDB.views || {}).forEach(([viewID, view]) => {
            const pageView = pageViewByViewID.get(viewID);
            this._initializeViewCollections(viewID, view, pageView);
            initialViewIDs.add(viewID);
        });
        Object.entries(paperSpaceDB.pages || {}).forEach(([pageID, page]) => {
            const firstPageView = Object.values(page.pageViews || {})[0];
            const initialPan = firstPageView?.position ?? { x: 0, y: 0 };
            this.pageCanvasZoom.set(pageID, new CoreSignal(0));
            this.pageCanvasPan.set(pageID, new CoreSignal(initialPan));
        });
        this.allViewIDs = new CoreSignal(initialViewIDs);
        this.allPageIDs = new CoreSignal(new Set(Object.keys(paperSpaceDB.pages || {})));
        this.selectedViewID = new CoreSignal(paperSpaceDB.selectedViewID ?? Array.from(initialViewIDs)[0]);
        this.selectedPageID = new CoreSignal(paperSpaceDB.selectedPageID ?? Array.from(this.allPageIDs.get())[0]);
        this.activeCanvasKey = new CoreSignal(this.selectedPageID.get());
        this.traceMode = new CoreSignal(paperSpaceDB.traceMode ?? false);
        this.orthoMode = new CoreSignal(paperSpaceDB.orthoMode ?? false);
        this.leaderMode = new CoreSignal(paperSpaceDB.leaderMode ?? false);
        this.lineMode = new CoreSignal(paperSpaceDB.lineMode ?? false);
        this.textMode = new CoreSignal(paperSpaceDB.textMode ?? false);
        this.pasteMode = {
            isOn: new CoreSignal(paperSpaceDB.pasteMode?.isOn ?? false),
            copiedShape: new CoreSignal(paperSpaceDB.pasteMode?.copiedShape ?? null)
        };
        this.continuousMeasurementMode = new CoreSignal(false);
        this.continuousMeasurementPoints = new CoreSignal([]);
        this.continuousMeasurementViewID = new CoreSignal(undefined);
        this.continuousMeasurementLockedAxis = new CoreSignal(null);
        this.visibility = new CoreSignal({
            view: true,
            dimensions: true,
            blocks: true,
            traces: true,
            labels: true,
            lines: true,
            leaders: true,
            numbers: true,
            texts: true
        });
        this.canvasSize = new CoreSignal({ width: 0, height: 0 });
        this.currentScale = new CoreSignal(paperSpaceDB.currentScale ?? 1);
        this.fontSize = new CoreSignal(paperSpaceDB.fontSize ?? 12);
        this.textColor = new CoreSignal(paperSpaceDB.textColor ?? '#000000');
        this.bgColor = new CoreSignal(paperSpaceDB.bgColor ?? '#ffffff');
        this.lineWidth = new CoreSignal(paperSpaceDB.lineWidth ?? 1);
        this.lineColor = new CoreSignal(paperSpaceDB.lineColor ?? '#000000');
        this.blocks = new CoreSignal(paperSpaceDB.blocks);
        this.snapping = new CoreSignal(paperSpaceDB.snapping ?? {});
        this.isDraggingElement = new CoreSignal(false);
        this.untrackedState = {
            selectedShape: paperSpaceDB.selectedShape,
            draggableView: paperSpaceDB.draggableView,
            draggableBlock: paperSpaceDB.draggableBlock,
            stage: paperSpaceDB.stage ?? 1,
            pdf: paperSpaceDB.pdf ?? false,
            pdfLocal: paperSpaceDB.pdfLocal ?? false,
            loadingImages: paperSpaceDB.loadingImages ?? null,
            showMainPage: paperSpaceDB.showMainPage ?? false,
            previewHeight: paperSpaceDB.previewHeight ?? 0,
            cameraDistanceFromWall: paperSpaceDB.cameraDistanceFromWall ?? 0,
            offsetLeft: paperSpaceDB.offsetLeft ?? 0,
            offsetRight: paperSpaceDB.offsetRight ?? 0,
            wallViewType: paperSpaceDB.wallViewType ?? 'allVisibleProducts'
        };
    }
    // ============================================================================
    // SERIALIZATION
    // ============================================================================
    /**
     * Serialize the live PaperSpace state back into an `IPaperSpaceState` — the
     * inverse of the constructor, mirroring `ProjectSettings.serialize()` /
     * `CoreDesigner.saveArea()`. Views are rebuilt per-id via `_getViewData`;
     * `pages` is taken from its whole-object signal; scalar mode/style state is
     * read from its signals; and fields the runtime never models are restored
     * from `untrackedState`.
     */
    serialize() {
        const views = {};
        for (const viewID of this.allViewIDs.get()) {
            const view = this._getViewData(viewID);
            if (view)
                views[viewID] = view;
        }
        const pagesOrder = this.pagesOrder.get();
        return {
            ...this.untrackedState,
            selectedPageID: this.selectedPageID.get(),
            selectedViewID: this.selectedViewID.get(),
            views,
            pages: deepClone(this.pages.get()),
            pagesOrder: pagesOrder ? [...pagesOrder] : undefined,
            traceMode: this.traceMode.get(),
            orthoMode: this.orthoMode.get(),
            leaderMode: this.leaderMode.get(),
            lineMode: this.lineMode.get(),
            textMode: this.textMode.get(),
            pasteMode: {
                isOn: this.pasteMode.isOn.get(),
                copiedShape: (this.pasteMode.copiedShape.get() ?? null)
            },
            currentScale: this.currentScale.get(),
            fontSize: this.fontSize.get(),
            textColor: this.textColor.get(),
            bgColor: this.bgColor.get(),
            lineWidth: this.lineWidth.get(),
            lineColor: this.lineColor.get(),
            blocks: deepClone(this.blocks.get()),
            snapping: deepClone(this.snapping.get())
        };
    }
    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================
    _initializeViewCollections(viewID, view, pageView) {
        this.viewProperties.set(viewID, new CoreSignal({
            dimensionsFS: view.dimensionsFS,
            textsFS: view.textsFS,
            tracesFS: view.tracesFS,
            labelsFS: view.labelsFS,
            leadersFS: view.leadersFS,
            numbersFS: view.numbersFS,
            viewType: view.viewType,
            dimensions: view.dimensions,
            width: view.width,
            height: view.height,
            extraSpace: view.extraSpace,
            fontSize: view.fontSize,
            fixedScale: pageView?.fixedScale,
            position: pageView?.position
        }));
        this.imageUrlMap.set(viewID, new CoreSignal(view.imageUrl));
        this.rulerLinesMap.set(viewID, new CoreSignal(view.rulerLines));
        this.dimensionsMap.set(viewID, new CoreSignal(view.dimensions));
        this.viewTypeMap.set(viewID, new CoreSignal(view.viewType));
        const initCollection = (map, idsMap, source) => {
            const itemsForView = new Map();
            const ids = new Set();
            Object.entries(source || {}).forEach(([id, item]) => {
                itemsForView.set(id, new CoreSignal(item));
                ids.add(id);
            });
            map.set(viewID, itemsForView);
            idsMap.set(viewID, new CoreSignal(ids));
        };
        if (view.texts)
            initCollection(this.textsMap, this.viewTextsIDs, view.texts);
        if (view.lines)
            initCollection(this.linesMap, this.viewLinesIDs, view.lines);
        if (view.traces)
            initCollection(this.tracesMap, this.viewTracesIDs, view.traces);
        if (view.leaders)
            initCollection(this.leadersMap, this.viewLeadersIDs, view.leaders);
        if (view.blocks)
            initCollection(this.blocksMap, this.viewBlocksIDs, view.blocks);
        if (view.labels)
            initCollection(this.labelsMap, this.viewLabelsIDs, view.labels);
        if (view.numbers)
            initCollection(this.numbersMap, this.viewNumbersIDs, view.numbers);
    }
    _executeCommand(command, name) {
        // Route the command through the core's transaction manager so PaperSpace edits join undo/redo.
        // Each command's `execute(core)` mutates `core.paperSpace` (this instance) via its direct
        // methods (`addElement`, `_addViewDirect`, …), which never re-enter `_executeCommand` — no
        // recursion.
        //
        // The `?.` is load-bearing for the STANDALONE flow: the stand-in core
        // (`createStandalonePaperSpaceCore`) intentionally omits `runCommandsAsTransaction`, so this
        // call evaluates to `undefined` and the command is dropped silently. Every public mutator on
        // this class funnels through here, which is why standalone PaperSpace is effectively
        // read-only. See the class-level JSDoc on `core` for the full contract.
        const label = name ?? `PaperSpace: ${Array.isArray(command) ? 'batch' : command.constructor.name}`;
        this.core.runCommandsAsTransaction?.(command, label, true);
    }
    _ensureViewExists(viewID) {
        const currentViewIDs = this.allViewIDs.get();
        if (!currentViewIDs.has(viewID)) {
            this.allViewIDs.set(new Set([...currentViewIDs, viewID]));
        }
        if (!this.textsMap.has(viewID)) {
            this.textsMap.set(viewID, new Map());
            this.viewTextsIDs.set(viewID, new CoreSignal(new Set()));
        }
        if (!this.linesMap.has(viewID)) {
            this.linesMap.set(viewID, new Map());
            this.viewLinesIDs.set(viewID, new CoreSignal(new Set()));
        }
        if (!this.tracesMap.has(viewID)) {
            this.tracesMap.set(viewID, new Map());
            this.viewTracesIDs.set(viewID, new CoreSignal(new Set()));
        }
        if (!this.leadersMap.has(viewID)) {
            this.leadersMap.set(viewID, new Map());
            this.viewLeadersIDs.set(viewID, new CoreSignal(new Set()));
        }
        if (!this.blocksMap.has(viewID)) {
            this.blocksMap.set(viewID, new Map());
            this.viewBlocksIDs.set(viewID, new CoreSignal(new Set()));
        }
        if (!this.labelsMap.has(viewID)) {
            this.labelsMap.set(viewID, new Map());
            this.viewLabelsIDs.set(viewID, new CoreSignal(new Set()));
        }
        if (!this.numbersMap.has(viewID)) {
            this.numbersMap.set(viewID, new Map());
            this.viewNumbersIDs.set(viewID, new CoreSignal(new Set()));
        }
    }
    _initPageCanvasState(pageID) {
        if (!this.pageCanvasZoom.has(pageID)) {
            this.pageCanvasZoom.set(pageID, new CoreSignal(0));
        }
        if (!this.pageCanvasPan.has(pageID)) {
            this.pageCanvasPan.set(pageID, new CoreSignal({ x: 0, y: 0 }));
        }
        if (!this.pageCanvasContentSize.has(pageID)) {
            this.pageCanvasContentSize.set(pageID, new CoreSignal({ totalW: 0, totalH: 0 }));
        }
    }
    getElementMapViaType(viewID, type) {
        const map = (() => {
            switch (type) {
                case EShapeType.Text:
                    return this.textsMap.get(viewID);
                case EShapeType.Line:
                    return this.linesMap.get(viewID);
                case EShapeType.Trace:
                    return this.tracesMap.get(viewID);
                case EShapeType.Leader:
                    return this.leadersMap.get(viewID);
                case EShapeType.Block:
                    return this.blocksMap.get(viewID);
                case EShapeType.Label:
                    return this.labelsMap.get(viewID);
                case EShapeType.Number:
                    return this.numbersMap.get(viewID);
                default:
                    throw new Error(`Invalid element type: ${type}`);
            }
        })();
        return map;
    }
    getElementIdsMapViaType(viewID, type) {
        switch (type) {
            case EShapeType.Text:
                return this.viewTextsIDs.get(viewID);
            case EShapeType.Line:
                return this.viewLinesIDs.get(viewID);
            case EShapeType.Trace:
                return this.viewTracesIDs.get(viewID);
            case EShapeType.Leader:
                return this.viewLeadersIDs.get(viewID);
            case EShapeType.Block:
                return this.viewBlocksIDs.get(viewID);
            case EShapeType.Label:
                return this.viewLabelsIDs.get(viewID);
            case EShapeType.Number:
                return this.viewNumbersIDs.get(viewID);
            default:
                throw new Error(`Invalid element type: ${type}`);
        }
    }
    // ============================================================================
    // SELECTION
    // ============================================================================
    getSelectedShapeId() {
        return this.selectedShapeId.get();
    }
    setSelectedShapeId(uuid) {
        this.selectedShapeId.set(uuid);
    }
    clearSelectedShapeId() {
        this.selectedShapeId.set(undefined);
    }
    toggleSelectedShapeId(uuid) {
        if (this.selectedShapeId.get() === uuid) {
            this.clearSelectedShapeId();
        }
        else {
            this.setSelectedShapeId(uuid);
        }
    }
    setSelectedViewID(id) {
        this.selectedViewID.set(id);
    }
    setPagesOrder(order) {
        this.pagesOrder.set(order);
    }
    // ============================================================================
    // VIEW METADATA
    // ============================================================================
    getAllViewIDs() {
        return this.allViewIDs.get();
    }
    getAllViewIDsSignal() {
        return this.allViewIDs;
    }
    getAllPageIDs() {
        return this.allPageIDs.get();
    }
    getViewIDByPageID(pageID) {
        const pageViews = this.pages.get()?.[pageID]?.pageViews;
        const firstPageView = Object.values(pageViews || {})[0];
        return firstPageView?.viewID;
    }
    getViewPropertiesSignal(viewID) {
        return this.viewProperties.get(viewID);
    }
    getViewPropertiesValue(viewID) {
        if (!viewID) {
            const selectedViewID = this.selectedViewID.get();
            if (!selectedViewID)
                return undefined;
            return this.viewProperties.get(selectedViewID)?.get();
        }
        return this.viewProperties.get(viewID)?.get();
    }
    /** Used by UpdateViewPropertiesCommand only (no undo/redo from this call). */
    _updateViewPropertiesDirect(viewID, updates) {
        const propsSignal = this.viewProperties.get(viewID);
        if (!propsSignal)
            return;
        propsSignal.set({ ...propsSignal.get(), ...updates });
    }
    getRulerLinesValue(viewID) {
        return this.rulerLinesMap.get(viewID)?.get();
    }
    getDimensionsValue(viewID) {
        return this.dimensionsMap.get(viewID)?.get();
    }
    getViewTypeValue(viewID) {
        return this.viewTypeMap.get(viewID)?.get();
    }
    getImageUrlValue(viewID) {
        return this.imageUrlMap.get(viewID)?.get();
    }
    getImageUrlValueByPageID(pageID) {
        const viewID = this.getViewIDByPageID(pageID);
        if (!viewID)
            return undefined;
        return this.getImageUrlValue(viewID);
    }
    getEffectiveFontSize(viewID) {
        return this.getViewPropertiesValue(viewID)?.dimensionsFS || this.fontSize.get();
    }
    getRulerSizes(viewID) {
        if (!viewID) {
            const selectedViewID = this.selectedViewID.get();
            if (!selectedViewID)
                return { left: 0, right: 0, top: 0, bottom: 0 };
            return this.getRulerSizes(selectedViewID);
        }
        const rulerLines = this.getRulerLinesValue(viewID);
        const dimensions = this.getDimensionsValue(viewID);
        const vType = this.getViewTypeValue(viewID);
        if (!rulerLines || !dimensions || !vType) {
            return { left: 0, right: 0, top: 0, bottom: 0 };
        }
        return createRulerSizes({ fontSize: this.getEffectiveFontSize(viewID), rulerLines, dimensions, viewType: vType });
    }
    // ============================================================================
    // GENERIC ELEMENT OPERATIONS (used by commands and typed CRUD below)
    // ============================================================================
    addElement(viewID, element) {
        this._ensureViewExists(viewID);
        const uuid = element.uuid || generateId();
        const elementWithUUID = { ...element, uuid };
        const itemsMap = this.getElementMapViaType(viewID, element.type);
        const idsMap = this.getElementIdsMapViaType(viewID, element.type);
        if (!itemsMap.has(uuid)) {
            itemsMap.set(uuid, new CoreSignal(elementWithUUID));
        }
        if (!idsMap.get().has(uuid)) {
            idsMap.set(new Set([...idsMap.get(), uuid]));
        }
        return uuid;
    }
    updateElement(viewID, elementID, type, updates) {
        const itemSignal = this.getElementMapViaType(viewID, type).get(elementID);
        if (!itemSignal)
            return;
        itemSignal.set({ ...itemSignal.get(), ...updates });
    }
    deleteElement(viewID, elementID, type) {
        const itemsMap = this.getElementMapViaType(viewID, type);
        const idsMap = this.getElementIdsMapViaType(viewID, type);
        itemsMap.delete(elementID);
        const newIDs = new Set(idsMap.get());
        newIDs.delete(elementID);
        idsMap.set(newIDs);
        if (this.selectedShapeId.get() === elementID) {
            this.clearSelectedShapeId();
        }
    }
    /** Used by UpdateElementCommand and DeleteElementCommand to snapshot state for undo. */
    getElement(viewID, elementID, type) {
        const itemsMap = this.textsMap.has(viewID) ? this.getElementMapViaType(viewID, type) : undefined;
        return itemsMap?.get(elementID)?.get();
    }
    hasElement(viewID, elementID, type) {
        const itemsMap = this.textsMap.has(viewID) ? this.getElementMapViaType(viewID, type) : undefined;
        return itemsMap?.has(elementID) ?? false;
    }
    // ============================================================================
    // ELEMENT CRUD — TEXT
    // ============================================================================
    addText(viewID, text) {
        const uuid = text.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...text, uuid }));
        return uuid;
    }
    updateText(viewID, textID, updates) {
        if (!this.hasElement(viewID, textID, EShapeType.Text)) {
            getMonitor().warn(`Text ${textID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, textID, EShapeType.Text, updates));
        return true;
    }
    deleteText(viewID, textID) {
        if (!this.hasElement(viewID, textID, EShapeType.Text)) {
            getMonitor().warn(`Text ${textID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, textID, EShapeType.Text));
        return true;
    }
    // ============================================================================
    // ELEMENT CRUD — LINE
    // ============================================================================
    addLine(viewID, line) {
        const uuid = line.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...line, uuid }));
        return uuid;
    }
    updateLine(viewID, lineID, updates) {
        if (!this.hasElement(viewID, lineID, EShapeType.Line)) {
            getMonitor().warn(`Line ${lineID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, lineID, EShapeType.Line, updates));
        return true;
    }
    deleteLine(viewID, lineID) {
        if (!this.hasElement(viewID, lineID, EShapeType.Line)) {
            getMonitor().warn(`Line ${lineID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, lineID, EShapeType.Line));
        return true;
    }
    // ============================================================================
    // ELEMENT CRUD — TRACE
    // ============================================================================
    addTrace(viewID, trace) {
        const uuid = trace.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...trace, uuid }));
        return uuid;
    }
    updateTrace(viewID, traceID, updates) {
        if (!this.hasElement(viewID, traceID, EShapeType.Trace)) {
            getMonitor().warn(`Trace ${traceID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, traceID, EShapeType.Trace, updates));
        return true;
    }
    deleteTrace(viewID, traceID) {
        if (!this.hasElement(viewID, traceID, EShapeType.Trace)) {
            getMonitor().warn(`Trace ${traceID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, traceID, EShapeType.Trace));
        return true;
    }
    // ============================================================================
    // ELEMENT CRUD — LEADER
    // ============================================================================
    addLeader(viewID, leader) {
        const uuid = leader.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...leader, uuid }));
        return uuid;
    }
    updateLeader(viewID, leaderID, updates) {
        if (!this.hasElement(viewID, leaderID, EShapeType.Leader)) {
            getMonitor().warn(`Leader ${leaderID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, leaderID, EShapeType.Leader, updates));
        return true;
    }
    deleteLeader(viewID, leaderID) {
        if (!this.hasElement(viewID, leaderID, EShapeType.Leader)) {
            getMonitor().warn(`Leader ${leaderID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, leaderID, EShapeType.Leader));
        return true;
    }
    // ============================================================================
    // ELEMENT CRUD — BLOCK
    // ============================================================================
    addBlock(viewID, block) {
        const uuid = block.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...block, uuid }));
        return uuid;
    }
    updateBlock(viewID, blockID, updates) {
        if (!this.hasElement(viewID, blockID, EShapeType.Block)) {
            getMonitor().warn(`Block ${blockID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, blockID, EShapeType.Block, updates));
        return true;
    }
    deleteBlock(viewID, blockID) {
        if (!this.hasElement(viewID, blockID, EShapeType.Block)) {
            getMonitor().warn(`Block ${blockID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, blockID, EShapeType.Block));
        return true;
    }
    // ============================================================================
    // ELEMENT CRUD — LABEL
    // ============================================================================
    addLabel(viewID, label) {
        const uuid = label.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...label, uuid }));
        return uuid;
    }
    updateLabel(viewID, labelID, updates) {
        if (!this.hasElement(viewID, labelID, EShapeType.Label)) {
            getMonitor().warn(`Label ${labelID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, labelID, EShapeType.Label, updates));
        return true;
    }
    deleteLabel(viewID, labelID) {
        if (!this.hasElement(viewID, labelID, EShapeType.Label)) {
            getMonitor().warn(`Label ${labelID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, labelID, EShapeType.Label));
        return true;
    }
    // ============================================================================
    // ELEMENT CRUD — NUMBER
    // ============================================================================
    addNumber(viewID, number) {
        const uuid = number.uuid || generateId();
        this._executeCommand(new AddElementCommand(viewID, { ...number, uuid }));
        return uuid;
    }
    updateNumber(viewID, numberID, updates) {
        if (!this.hasElement(viewID, numberID, EShapeType.Number)) {
            getMonitor().warn(`Number ${numberID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new UpdateElementCommand(viewID, numberID, EShapeType.Number, updates));
        return true;
    }
    deleteNumber(viewID, numberID) {
        if (!this.hasElement(viewID, numberID, EShapeType.Number)) {
            getMonitor().warn(`Number ${numberID} not found in view ${viewID}`);
            return false;
        }
        this._executeCommand(new DeleteElementCommand(viewID, numberID, EShapeType.Number));
        return true;
    }
    // ============================================================================
    // ELEMENT GETTERS (signals and values for reactive subscriptions)
    // ============================================================================
    getTextsIDsSignal(viewID) {
        return this.viewTextsIDs.get(viewID);
    }
    getTextsIDs(viewID) {
        return this.viewTextsIDs.get(viewID)?.get() || new Set();
    }
    getTextSignal(viewID, id) {
        return this.textsMap.get(viewID)?.get(id);
    }
    getTextValue(viewID, id) {
        return this.textsMap.get(viewID)?.get(id)?.get();
    }
    getLinesIDsSignal(viewID) {
        return this.viewLinesIDs.get(viewID);
    }
    getLinesIDs(viewID) {
        return this.viewLinesIDs.get(viewID)?.get() || new Set();
    }
    getLineSignal(viewID, id) {
        return this.linesMap.get(viewID)?.get(id);
    }
    getLineValue(viewID, id) {
        return this.linesMap.get(viewID)?.get(id)?.get();
    }
    getTracesIDsSignal(viewID) {
        return this.viewTracesIDs.get(viewID);
    }
    getTracesIDs(viewID) {
        return this.viewTracesIDs.get(viewID)?.get() || new Set();
    }
    getTraceSignal(viewID, id) {
        return this.tracesMap.get(viewID)?.get(id);
    }
    getTraceValue(viewID, id) {
        return this.tracesMap.get(viewID)?.get(id)?.get();
    }
    getLeadersIDsSignal(viewID) {
        return this.viewLeadersIDs.get(viewID);
    }
    getLeadersIDs(viewID) {
        return this.viewLeadersIDs.get(viewID)?.get() || new Set();
    }
    getLeaderSignal(viewID, id) {
        return this.leadersMap.get(viewID)?.get(id);
    }
    getLeaderValue(viewID, id) {
        return this.leadersMap.get(viewID)?.get(id)?.get();
    }
    getBlocksIDsSignal(viewID) {
        return this.viewBlocksIDs.get(viewID);
    }
    getBlocksIDs(viewID) {
        return this.viewBlocksIDs.get(viewID)?.get() || new Set();
    }
    getBlockSignal(viewID, id) {
        return this.blocksMap.get(viewID)?.get(id);
    }
    getBlockValue(viewID, id) {
        return this.blocksMap.get(viewID)?.get(id)?.get();
    }
    getLabelsIDsSignal(viewID) {
        return this.viewLabelsIDs.get(viewID);
    }
    getLabelsIDs(viewID) {
        return this.viewLabelsIDs.get(viewID)?.get() || new Set();
    }
    getLabelSignal(viewID, id) {
        return this.labelsMap.get(viewID)?.get(id);
    }
    getLabelValue(viewID, id) {
        return this.labelsMap.get(viewID)?.get(id)?.get();
    }
    getNumbersIDsSignal(viewID) {
        return this.viewNumbersIDs.get(viewID);
    }
    getNumbersIDs(viewID) {
        return this.viewNumbersIDs.get(viewID)?.get() || new Set();
    }
    getNumberSignal(viewID, id) {
        return this.numbersMap.get(viewID)?.get(id);
    }
    getNumberValue(viewID, id) {
        return this.numbersMap.get(viewID)?.get(id)?.get();
    }
    // ============================================================================
    // CLONE
    // ============================================================================
    cloneText(viewID, textID) {
        const original = this.getTextValue(viewID, textID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addText(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            position: { x: original.position.x + CLONE_OFFSET, y: original.position.y + CLONE_OFFSET }
        });
        return newUUID;
    }
    cloneLine(viewID, lineID) {
        const original = this.getLineValue(viewID, lineID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addLine(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            from: { x: original.from.x + CLONE_OFFSET, y: original.from.y + CLONE_OFFSET },
            to: { x: original.to.x + CLONE_OFFSET, y: original.to.y + CLONE_OFFSET }
        });
        return newUUID;
    }
    cloneTrace(viewID, traceID) {
        const original = this.getTraceValue(viewID, traceID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addTrace(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            from: { x: original.from.x + CLONE_OFFSET, y: original.from.y + CLONE_OFFSET },
            to: { x: original.to.x + CLONE_OFFSET, y: original.to.y + CLONE_OFFSET },
            points: original.points?.map((p) => ({ x: p.x + CLONE_OFFSET, y: p.y + CLONE_OFFSET }))
        });
        return newUUID;
    }
    cloneLeader(viewID, leaderID) {
        const original = this.getLeaderValue(viewID, leaderID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addLeader(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            from: { x: original.from.x + CLONE_OFFSET, y: original.from.y + CLONE_OFFSET },
            to: { x: original.to.x + CLONE_OFFSET, y: original.to.y + CLONE_OFFSET },
            secondaryLines: original.secondaryLines?.map((line) => ({
                ...deepClone(line),
                uuid: generateId(),
                from: { x: line.from.x + CLONE_OFFSET, y: line.from.y + CLONE_OFFSET },
                to: { x: line.to.x + CLONE_OFFSET, y: line.to.y + CLONE_OFFSET }
            }))
        });
        return newUUID;
    }
    cloneBlock(viewID, blockID) {
        const original = this.getBlockValue(viewID, blockID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addBlock(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            position: { x: original.position.x + CLONE_OFFSET, y: original.position.y + CLONE_OFFSET }
        });
        return newUUID;
    }
    cloneLabel(viewID, labelID) {
        const original = this.getLabelValue(viewID, labelID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addLabel(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            position: { x: original.position.x + CLONE_OFFSET, y: original.position.y + CLONE_OFFSET }
        });
        return newUUID;
    }
    cloneNumber(viewID, numberID) {
        const original = this.getNumberValue(viewID, numberID);
        if (!original)
            return undefined;
        const newUUID = generateId();
        this.setSelectedShapeId(newUUID);
        this.addNumber(viewID, {
            ...deepClone(original),
            uuid: newUUID,
            position: { x: original.position.x + CLONE_OFFSET, y: original.position.y + CLONE_OFFSET }
        });
        return newUUID;
    }
    // ============================================================================
    // PAGE MANAGEMENT
    // ============================================================================
    addPage(viewID) {
        const cmd = new AddPageCommand(viewID);
        this._executeCommand(cmd, 'Add page');
        return cmd.pageID;
    }
    addEmptyPage() {
        const cmd = new AddEmptyPageCommand();
        this._executeCommand(cmd, 'Add empty page');
        return cmd.pageID;
    }
    addCollagePage(config) {
        const cmd = new AddCollagePageCommand(config);
        this._executeCommand(cmd, 'Add collage page');
        return cmd.pageID;
    }
    removePage(pageID) {
        this._executeCommand(new RemovePageCommand(pageID), 'Remove page');
    }
    /**
     * Register a paperspace view and select it, as a single undo step. Selection is a separate
     * `SetCoreSignalCommand` so add+select apply/undo cleanly together.
     *
     * Standalone (stand-in) flow: the `?.` drops this call (no `runCommandsAsTransaction` on the
     * stand-in) so `addView` becomes a no-op. The documents flow never reaches this — views are
     * fed in via the constructor's `paperSpaceDB.views`, which goes through `_addViewDirect`
     * synchronously. See the class-level JSDoc on `core` for the full standalone contract.
     */
    addView(view) {
        // Add+select as one (non-history) step.
        this.core.runCommandsAsTransaction?.([new AddViewCommand(view), new SetCoreSignalCommand(() => this.selectedViewID, view.uuid)], 'Add view', false);
        return view.uuid;
    }
    /** Remove a view's data only (pages/pageViews and selection are untouched). */
    removeView(viewID) {
        this._executeCommand(new RemoveViewCommand(viewID), 'Remove view');
    }
    addPageView(pageID, viewID, position, width, height) {
        const cmd = new AddPageViewCommand(pageID, viewID, position, width, height);
        this._executeCommand(cmd, 'Add view to page');
        return cmd.pageViewID;
    }
    updatePageViewport(pageID, pageViewID, x, y, w, h) {
        const pages = this.pages.get();
        const page = pages[pageID];
        if (!page)
            return;
        const pageView = page.pageViews[pageViewID];
        if (!pageView)
            return;
        this.pages.set({
            ...pages,
            [pageID]: {
                ...page,
                pageViews: {
                    ...page.pageViews,
                    [pageViewID]: { ...pageView, position: { x, y }, sizes: { width: w, height: h } }
                }
            }
        });
    }
    updateCollageSlotView(pageID, slotID, viewID) {
        const pages = this.pages.get();
        const page = pages[pageID];
        if (!page?.collageConfig)
            return;
        const slot = page.collageConfig.slots.find((s) => s.uuid === slotID);
        if (!slot)
            return;
        const updatedPageViews = { ...page.pageViews };
        let { pageViewUUID } = slot;
        if (pageViewUUID && updatedPageViews[pageViewUUID]) {
            updatedPageViews[pageViewUUID] = { ...updatedPageViews[pageViewUUID], viewID };
        }
        else {
            pageViewUUID = generateId();
            updatedPageViews[pageViewUUID] = {
                uuid: pageViewUUID,
                viewID,
                pageID,
                position: { x: 0, y: 0 },
                rotation: 0,
                sizes: { width: 0, height: 0 },
                fontSize: 12,
                extraSpace: { left: 0, right: 0, top: 0, bottom: 0 }
            };
            this._initPageCanvasState(pageViewUUID);
        }
        this.pages.set({
            ...pages,
            [pageID]: {
                ...page,
                pageViews: updatedPageViews,
                collageConfig: {
                    ...page.collageConfig,
                    slots: page.collageConfig.slots.map((s) => (s.uuid === slotID ? { ...s, pageViewUUID } : s))
                }
            }
        });
    }
    updateCollageConfig(pageID, slots) {
        const pages = this.pages.get();
        const page = pages[pageID];
        if (!page?.collageConfig)
            return;
        this.pages.set({
            ...pages,
            [pageID]: { ...page, collageConfig: { ...page.collageConfig, slots } }
        });
    }
    /** Called by AddPageCommand. */
    _addPageDirect(viewID, pageID) {
        const pageViewUUID = generateId();
        const newPage = {
            uuid: pageID,
            pageViews: {
                [pageViewUUID]: {
                    uuid: pageViewUUID,
                    viewID,
                    pageID,
                    position: { x: 0, y: 0 },
                    rotation: 0,
                    sizes: { width: 0, height: 0 },
                    fontSize: 12,
                    extraSpace: { left: 0, right: 0, top: 0, bottom: 0 }
                }
            },
            texts: {},
            textsFS: 12
        };
        this.pages.set({ ...this.pages.get(), [pageID]: newPage });
        const newAllPageIDs = new Set(this.allPageIDs.get());
        newAllPageIDs.add(pageID);
        this.allPageIDs.set(newAllPageIDs);
        this.pagesOrder.set([...(this.pagesOrder.get() ?? []), pageID]);
        this._initPageCanvasState(pageID);
    }
    /** Called by AddEmptyPageCommand. */
    _addEmptyPageDirect(pageID) {
        this.pages.set({ ...this.pages.get(), [pageID]: { uuid: pageID, pageViews: {}, texts: {}, textsFS: 12 } });
        const newAllPageIDs = new Set(this.allPageIDs.get());
        newAllPageIDs.add(pageID);
        this.allPageIDs.set(newAllPageIDs);
        this.pagesOrder.set([...(this.pagesOrder.get() ?? []), pageID]);
        this._initPageCanvasState(pageID);
    }
    /** Called by AddCollagePageCommand. */
    _addCollagePageDirect(pageID, config) {
        this.pages.set({
            ...this.pages.get(),
            [pageID]: { uuid: pageID, pageViews: {}, texts: {}, textsFS: 12, collageConfig: config }
        });
        const newAllPageIDs = new Set(this.allPageIDs.get());
        newAllPageIDs.add(pageID);
        this.allPageIDs.set(newAllPageIDs);
        this.pagesOrder.set([...(this.pagesOrder.get() ?? []), pageID]);
        this._initPageCanvasState(pageID);
        for (const slot of config.slots) {
            this._initPageCanvasState(slot.uuid);
        }
    }
    /** Called by AddPageViewCommand. */
    _addPageViewDirect(pageID, pageViewID, viewID, position, width, height) {
        const pages = this.pages.get();
        const page = pages[pageID];
        if (!page)
            return;
        this.pages.set({
            ...pages,
            [pageID]: {
                ...page,
                pageViews: {
                    ...page.pageViews,
                    [pageViewID]: {
                        uuid: pageViewID,
                        viewID,
                        pageID,
                        position,
                        rotation: 0,
                        sizes: { width, height },
                        fontSize: 12,
                        extraSpace: { left: 0, right: 0, top: 0, bottom: 0 }
                    }
                }
            }
        });
    }
    /** Called by AddPageViewCommand.undo. */
    _removePageViewDirect(pageID, pageViewID) {
        const pages = this.pages.get();
        const page = pages[pageID];
        if (!page)
            return;
        const newPageViews = { ...page.pageViews };
        delete newPageViews[pageViewID];
        this.pages.set({ ...pages, [pageID]: { ...page, pageViews: newPageViews } });
    }
    /** Called by RemovePageCommand / AddPageCommand.undo. */
    _removePageDirect(pageID) {
        this.pagesOrder.set((this.pagesOrder.get() ?? []).filter((id) => id !== pageID));
        const newAllPageIDs = new Set(this.allPageIDs.get());
        newAllPageIDs.delete(pageID);
        this.allPageIDs.set(newAllPageIDs);
        const newPages = { ...this.pages.get() };
        delete newPages[pageID];
        this.pages.set(newPages);
        this.pageCanvasZoom.delete(pageID);
        this.pageCanvasPan.delete(pageID);
        this.pageCanvasContentSize.delete(pageID);
    }
    /** Called by RemovePageCommand.undo. */
    _restorePageDirect(pageID, page, orderIndex) {
        this.pages.set({ ...this.pages.get(), [pageID]: page });
        const newAllPageIDs = new Set(this.allPageIDs.get());
        newAllPageIDs.add(pageID);
        this.allPageIDs.set(newAllPageIDs);
        const currentOrder = [...(this.pagesOrder.get() ?? [])];
        currentOrder.splice(orderIndex, 0, pageID);
        this.pagesOrder.set(currentOrder);
        this._initPageCanvasState(pageID);
    }
    /** Called by AddViewCommand / RemoveViewCommand.undo. Registers a view's data only. */
    _addViewDirect(view) {
        this._initializeViewCollections(view.uuid, view);
        const newAllViewIDs = new Set(this.allViewIDs.get());
        newAllViewIDs.add(view.uuid);
        this.allViewIDs.set(newAllViewIDs);
    }
    /**
     * Called by RemoveViewCommand / AddViewCommand.undo. Removes a view's own data
     * only — every per-view container plus `allViewIDs` membership. Deliberately
     * leaves `pages`, `pageViews`, collage slots, and `selectedViewID` untouched.
     */
    _removeViewDirect(viewID) {
        this.viewProperties.delete(viewID);
        this.imageUrlMap.delete(viewID);
        this.rulerLinesMap.delete(viewID);
        this.dimensionsMap.delete(viewID);
        this.viewTypeMap.delete(viewID);
        this.textsMap.delete(viewID);
        this.linesMap.delete(viewID);
        this.tracesMap.delete(viewID);
        this.leadersMap.delete(viewID);
        this.blocksMap.delete(viewID);
        this.labelsMap.delete(viewID);
        this.numbersMap.delete(viewID);
        this.viewTextsIDs.delete(viewID);
        this.viewLinesIDs.delete(viewID);
        this.viewTracesIDs.delete(viewID);
        this.viewLeadersIDs.delete(viewID);
        this.viewBlocksIDs.delete(viewID);
        this.viewLabelsIDs.delete(viewID);
        this.viewNumbersIDs.delete(viewID);
        const newAllViewIDs = new Set(this.allViewIDs.get());
        newAllViewIDs.delete(viewID);
        this.allViewIDs.set(newAllViewIDs);
    }
    /**
     * Reconstruct an `IView` from live state — the inverse of
     * `_initializeViewCollections`. Used by `RemoveViewCommand` to snapshot the
     * view for undo. Fields not persisted into the per-view maps (`index`,
     * `rotation`, `settings`, `wallDistance`, `wallViewType`, color/`show*` flags)
     * are defaulted; they are not read at runtime, so the runtime-relevant state
     * round-trips losslessly. Returns `undefined` if the view does not exist.
     */
    _getViewData(viewID) {
        const props = this.viewProperties.get(viewID)?.get();
        if (!props)
            return undefined;
        const collect = (map) => {
            const out = {};
            const forView = map.get(viewID);
            if (forView) {
                for (const [id, signal] of forView)
                    out[id] = signal.get();
            }
            return out;
        };
        const width = props.width ?? 0;
        const height = props.height ?? 0;
        return {
            uuid: viewID,
            viewType: this.viewTypeMap.get(viewID)?.get() ?? 'wall',
            imageUrl: this.imageUrlMap.get(viewID)?.get() ?? '',
            rulerLines: this.rulerLinesMap.get(viewID)?.get() ?? { top: [], bottom: [], left: [], right: [] },
            dimensions: this.dimensionsMap.get(viewID)?.get() ?? {
                dpi: 0,
                root: {
                    uuid: viewID,
                    type: this.viewTypeMap.get(viewID)?.get() ?? 'wall',
                    vertices: [],
                    walls: {}
                },
                cabinets: { upper: [], tall: [], base: [] },
                appliances: { upper: [], tall: [], base: [] },
                windows: [],
                doors: []
            },
            width,
            height,
            extraSpace: props.extraSpace ?? { top: 0, bottom: 0, left: 0, right: 0 },
            fontSize: props.fontSize ?? this.fontSize.get(),
            dimensionsFS: props.dimensionsFS,
            textsFS: props.textsFS,
            tracesFS: props.tracesFS,
            labelsFS: props.labelsFS,
            leadersFS: props.leadersFS,
            numbersFS: props.numbersFS,
            index: 0,
            rotation: 0,
            settings: {
                content: { offsetLeft: 0, offsetRight: 0, width, height },
                camera: []
            },
            texts: collect(this.textsMap),
            lines: collect(this.linesMap),
            traces: collect(this.tracesMap),
            leaders: collect(this.leadersMap),
            blocks: collect(this.blocksMap),
            labels: collect(this.labelsMap),
            numbers: collect(this.numbersMap)
        };
    }
    // ============================================================================
    // CANVAS STATE (zoom, pan, content size, active key, visibility)
    // ============================================================================
    setActiveCanvasKey(key) {
        this.activeCanvasKey.set(key);
    }
    updateCanvasSize(width, height) {
        this.canvasSize.set({ width, height });
    }
    getPageCanvasZoom(pageID) {
        return this.pageCanvasZoom.get(pageID);
    }
    updatePageCanvasZoom(pageID, zoom) {
        const signal = this.pageCanvasZoom.get(pageID);
        if (signal) {
            signal.set(zoom);
        }
        else {
            this.pageCanvasZoom.set(pageID, new CoreSignal(zoom));
        }
    }
    getPageCanvasPan(pageID) {
        return this.pageCanvasPan.get(pageID);
    }
    updatePageCanvasPan(pageID, pan) {
        const signal = this.pageCanvasPan.get(pageID);
        if (signal) {
            signal.set(pan);
        }
        else {
            this.pageCanvasPan.set(pageID, new CoreSignal(pan));
        }
    }
    getPageCanvasContentSize(key) {
        return this.pageCanvasContentSize.get(key);
    }
    updatePageCanvasContentSize(key, totalW, totalH) {
        const signal = this.pageCanvasContentSize.get(key);
        if (signal) {
            signal.set({ totalW, totalH });
        }
        else {
            this.pageCanvasContentSize.set(key, new CoreSignal({ totalW, totalH }));
        }
    }
    updateVisibility(updates) {
        this.visibility.set({ ...this.visibility.get(), ...updates });
    }
    toggleVisibility(key) {
        const current = this.visibility.get();
        this.visibility.set({ ...current, [key]: !current[key] });
    }
    // ============================================================================
    // CONTINUOUS MEASUREMENT
    // ============================================================================
    startContinuousMeasurement(viewID) {
        this.continuousMeasurementMode.set(true);
        this.continuousMeasurementPoints.set([]);
        this.continuousMeasurementViewID.set(viewID);
        this.continuousMeasurementLockedAxis.set(null);
    }
    addContinuousMeasurementPoint(point) {
        const current = this.continuousMeasurementPoints.get();
        const lockedAxis = this.continuousMeasurementLockedAxis.get();
        const newPoints = [...current, point];
        if (lockedAxis === 'x')
            newPoints.sort((a, b) => a.x - b.x);
        else if (lockedAxis === 'y')
            newPoints.sort((a, b) => a.y - b.y);
        this.continuousMeasurementPoints.set(newPoints);
    }
    setContinuousMeasurementLockedAxis(axis) {
        this.continuousMeasurementLockedAxis.set(axis);
    }
    finalizeContinuousMeasurement() {
        const points = this.continuousMeasurementPoints.get();
        const viewID = this.continuousMeasurementViewID.get();
        const lockedAxis = this.continuousMeasurementLockedAxis.get();
        if (points.length >= 2 && viewID) {
            this.addTrace(viewID, {
                uuid: generateId(),
                viewID,
                type: EShapeType.Trace,
                from: points[0],
                to: points[points.length - 1],
                points,
                lockedAxis,
                text: '',
                padding: 2,
                isDragged: false,
                isAuto: false,
                draggable: true
            });
        }
        this.continuousMeasurementPoints.set([]);
        this.continuousMeasurementLockedAxis.set(null);
    }
    cancelContinuousMeasurement() {
        this.continuousMeasurementMode.set(false);
        this.continuousMeasurementPoints.set([]);
        this.continuousMeasurementViewID.set(undefined);
        this.continuousMeasurementLockedAxis.set(null);
    }
    // ============================================================================
    // FONT SIZE
    // ============================================================================
    updateGlobalFontSize(viewID, fontSizeKey, fontSize) {
        if (!this.viewProperties.has(viewID)) {
            getMonitor().warn(`View ${viewID} not found`);
            return;
        }
        this._executeCommand(new UpdateViewPropertiesCommand(viewID, { [fontSizeKey]: fontSize }));
    }
    // ============================================================================
    // UNDO / REDO
    // ============================================================================
    /*
     * Delegate to the owning core's transaction manager.
     *
     *   - With a real `CoreDesigner` this is project-wide undo/redo — every mutator on this class
     *     dispatched through `runCommandsAsTransaction`, so the history contains a mix of paperspace
     *     edits and scene-graph edits, undoable in order.
     *   - With the standalone stand-in the manager is a real `TransactionManager` instance, but it
     *     NEVER receives commands (mutators no-op on standalone — see the class-level JSDoc on
     *     `core`). `undo()` / `redo()` here resolve to no-ops at runtime, and `canUndo` / `canRedo`
     *     are always `false`. Wiring an Undo/Redo button to a standalone PaperSpace is harmless
     *     but pointless — there's nothing for it to undo.
     */
    undo() {
        this.core.transactionManager.undo();
    }
    redo() {
        this.core.transactionManager.redo();
    }
    canUndo() {
        return this.core.transactionManager.canUndo.value;
    }
    canRedo() {
        return this.core.transactionManager.canRedo.value;
    }
    // ============================================================================
    // DESTROY
    // ============================================================================
    destroy() {
        this.textsMap.forEach((map) => map.clear());
        this.linesMap.forEach((map) => map.clear());
        this.tracesMap.forEach((map) => map.clear());
        this.leadersMap.forEach((map) => map.clear());
        this.blocksMap.forEach((map) => map.clear());
        this.labelsMap.forEach((map) => map.clear());
        this.numbersMap.forEach((map) => map.clear());
        this.textsMap.clear();
        this.linesMap.clear();
        this.tracesMap.clear();
        this.leadersMap.clear();
        this.blocksMap.clear();
        this.labelsMap.clear();
        this.numbersMap.clear();
        this.viewTextsIDs.clear();
        this.viewLinesIDs.clear();
        this.viewTracesIDs.clear();
        this.viewLeadersIDs.clear();
        this.viewBlocksIDs.clear();
        this.viewLabelsIDs.clear();
        this.viewNumbersIDs.clear();
        this.viewProperties.clear();
    }
}

export { PaperSpace };
