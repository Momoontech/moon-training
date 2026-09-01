import { dimensions, EShapeType, IBlock, IBlockSVG, ICollageConfig, ICollageSlot, IDimension, IElementVisibility, ILabel, ILeader, ILine, IMarginSizes, INumber, IPage, IPages, IPaperSpaceState, IPoint2d, IRulerLines, IShape, IText, IView, IViewProperties, snapping, UUID, viewType } from '../../declarations';
import type { CoreDesigner } from '../../designer-core';
import CoreSignal from '../CoreSignal';
export type Wrapped<T> = {
    [K in keyof T]: CoreSignal<T[K]>;
};
/**
 * PaperSpace - High-performance reactive state management
 *
 * Architecture:
 * - Atomic signals: Each element has its own signal
 * - Command-based undo/redo: Only affected elements touched
 * - Map-based storage: O(1) lookups
 */
export declare class PaperSpace {
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
    private core;
    selectedPageID: CoreSignal<UUID | undefined>;
    selectedShapeId: CoreSignal<UUID | undefined>;
    selectedViewID: CoreSignal<UUID | undefined>;
    pages: CoreSignal<IPages>;
    pagesOrder: CoreSignal<UUID[] | undefined>;
    private pageCanvasZoom;
    private pageCanvasPan;
    private pageCanvasContentSize;
    /** Tracks which canvas is currently active (drives toolbar zoom/pan/reset). */
    activeCanvasKey: CoreSignal<UUID | undefined>;
    private viewProperties;
    private allViewIDs;
    private allPageIDs;
    private rulerLinesMap;
    private dimensionsMap;
    private viewTypeMap;
    private imageUrlMap;
    private textsMap;
    private linesMap;
    private tracesMap;
    private leadersMap;
    private blocksMap;
    private labelsMap;
    private numbersMap;
    private viewTextsIDs;
    private viewLinesIDs;
    private viewTracesIDs;
    private viewLeadersIDs;
    private viewBlocksIDs;
    private viewLabelsIDs;
    private viewNumbersIDs;
    traceMode: CoreSignal<boolean>;
    orthoMode: CoreSignal<boolean>;
    leaderMode: CoreSignal<boolean>;
    lineMode: CoreSignal<boolean>;
    textMode: CoreSignal<boolean>;
    pasteMode: Wrapped<{
        isOn: boolean;
        copiedShape: any | null;
    }>;
    continuousMeasurementMode: CoreSignal<boolean>;
    continuousMeasurementPoints: CoreSignal<IPoint2d[]>;
    continuousMeasurementViewID: CoreSignal<UUID | undefined>;
    continuousMeasurementLockedAxis: CoreSignal<'x' | 'y' | null>;
    visibility: CoreSignal<IElementVisibility>;
    canvasSize: CoreSignal<{
        width: number;
        height: number;
    }>;
    currentScale: CoreSignal<number>;
    fontSize: CoreSignal<number>;
    textColor: CoreSignal<string>;
    bgColor: CoreSignal<string>;
    lineWidth: CoreSignal<number>;
    lineColor: CoreSignal<string>;
    blocks: CoreSignal<IBlockSVG[] | undefined>;
    snapping: CoreSignal<snapping>;
    isDraggingElement: CoreSignal<boolean>;
    /**
     * Fields present in `IPaperSpaceState` but never modeled as live PaperSpace
     * state (the constructor ignores them). Retained verbatim at construction so
     * `serialize()` can round-trip them losslessly instead of inventing values.
     */
    private untrackedState;
    constructor(paperSpaceDB: IPaperSpaceState, core?: CoreDesigner | null);
    /**
     * Serialize the live PaperSpace state back into an `IPaperSpaceState` — the
     * inverse of the constructor, mirroring `ProjectSettings.serialize()` /
     * `CoreDesigner.saveArea()`. Views are rebuilt per-id via `_getViewData`;
     * `pages` is taken from its whole-object signal; scalar mode/style state is
     * read from its signals; and fields the runtime never models are restored
     * from `untrackedState`.
     */
    serialize(): IPaperSpaceState;
    private _initializeViewCollections;
    private _executeCommand;
    private _ensureViewExists;
    private _initPageCanvasState;
    private getElementMapViaType;
    private getElementIdsMapViaType;
    getSelectedShapeId(): UUID | undefined;
    setSelectedShapeId(uuid: UUID): void;
    clearSelectedShapeId(): void;
    toggleSelectedShapeId(uuid: UUID): void;
    setSelectedViewID(id: UUID | undefined): void;
    setPagesOrder(order: UUID[]): void;
    getAllViewIDs(): Set<UUID>;
    getAllViewIDsSignal(): CoreSignal<Set<UUID>>;
    getAllPageIDs(): Set<UUID>;
    getViewIDByPageID(pageID: UUID): UUID | undefined;
    getViewPropertiesSignal(viewID: UUID): CoreSignal<IViewProperties> | undefined;
    getViewPropertiesValue(viewID?: UUID): IViewProperties | undefined;
    /** Used by UpdateViewPropertiesCommand only (no undo/redo from this call). */
    _updateViewPropertiesDirect(viewID: UUID, updates: Partial<IViewProperties>): void;
    getRulerLinesValue(viewID: UUID): IRulerLines | undefined;
    getDimensionsValue(viewID: UUID): dimensions;
    getViewTypeValue(viewID: UUID): viewType | undefined;
    getImageUrlValue(viewID: UUID): string | undefined;
    getImageUrlValueByPageID(pageID: UUID): string | undefined;
    getEffectiveFontSize(viewID: UUID): number;
    getRulerSizes(viewID?: UUID): IMarginSizes;
    addElement<T extends IShape>(viewID: UUID, element: T): UUID;
    updateElement(viewID: UUID, elementID: UUID, type: EShapeType, updates: Partial<IShape>): void;
    deleteElement(viewID: UUID, elementID: UUID, type: EShapeType): void;
    /** Used by UpdateElementCommand and DeleteElementCommand to snapshot state for undo. */
    getElement<T extends IShape>(viewID: UUID, elementID: UUID, type: EShapeType): T | undefined;
    private hasElement;
    addText(viewID: UUID, text: IText): UUID;
    updateText(viewID: UUID, textID: UUID, updates: Partial<IText>): boolean;
    deleteText(viewID: UUID, textID: UUID): boolean;
    addLine(viewID: UUID, line: ILine): UUID;
    updateLine(viewID: UUID, lineID: UUID, updates: Partial<ILine>): boolean;
    deleteLine(viewID: UUID, lineID: UUID): boolean;
    addTrace(viewID: UUID, trace: IDimension): UUID;
    updateTrace(viewID: UUID, traceID: UUID, updates: Partial<IDimension>): boolean;
    deleteTrace(viewID: UUID, traceID: UUID): boolean;
    addLeader(viewID: UUID, leader: ILeader): UUID;
    updateLeader(viewID: UUID, leaderID: UUID, updates: Partial<ILeader>): boolean;
    deleteLeader(viewID: UUID, leaderID: UUID): boolean;
    addBlock(viewID: UUID, block: IBlock): UUID;
    updateBlock(viewID: UUID, blockID: UUID, updates: Partial<IBlock>): boolean;
    deleteBlock(viewID: UUID, blockID: UUID): boolean;
    addLabel(viewID: UUID, label: ILabel): UUID;
    updateLabel(viewID: UUID, labelID: UUID, updates: Partial<ILabel>): boolean;
    deleteLabel(viewID: UUID, labelID: UUID): boolean;
    addNumber(viewID: UUID, number: INumber): UUID;
    updateNumber(viewID: UUID, numberID: UUID, updates: Partial<INumber>): boolean;
    deleteNumber(viewID: UUID, numberID: UUID): boolean;
    getTextsIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getTextsIDs(viewID: UUID): Set<UUID>;
    getTextSignal(viewID: UUID, id: UUID): CoreSignal<IText> | undefined;
    getTextValue(viewID: UUID, id: UUID): IText | undefined;
    getLinesIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getLinesIDs(viewID: UUID): Set<UUID>;
    getLineSignal(viewID: UUID, id: UUID): CoreSignal<ILine> | undefined;
    getLineValue(viewID: UUID, id: UUID): ILine | undefined;
    getTracesIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getTracesIDs(viewID: UUID): Set<UUID>;
    getTraceSignal(viewID: UUID, id: UUID): CoreSignal<IDimension> | undefined;
    getTraceValue(viewID: UUID, id: UUID): IDimension | undefined;
    getLeadersIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getLeadersIDs(viewID: UUID): Set<UUID>;
    getLeaderSignal(viewID: UUID, id: UUID): CoreSignal<ILeader> | undefined;
    getLeaderValue(viewID: UUID, id: UUID): ILeader | undefined;
    getBlocksIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getBlocksIDs(viewID: UUID): Set<UUID>;
    getBlockSignal(viewID: UUID, id: UUID): CoreSignal<IBlock> | undefined;
    getBlockValue(viewID: UUID, id: UUID): IBlock | undefined;
    getLabelsIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getLabelsIDs(viewID: UUID): Set<UUID>;
    getLabelSignal(viewID: UUID, id: UUID): CoreSignal<ILabel> | undefined;
    getLabelValue(viewID: UUID, id: UUID): ILabel | undefined;
    getNumbersIDsSignal(viewID: UUID): CoreSignal<Set<UUID>> | undefined;
    getNumbersIDs(viewID: UUID): Set<UUID>;
    getNumberSignal(viewID: UUID, id: UUID): CoreSignal<INumber> | undefined;
    getNumberValue(viewID: UUID, id: UUID): INumber | undefined;
    cloneText(viewID: UUID, textID: UUID): UUID | undefined;
    cloneLine(viewID: UUID, lineID: UUID): UUID | undefined;
    cloneTrace(viewID: UUID, traceID: UUID): UUID | undefined;
    cloneLeader(viewID: UUID, leaderID: UUID): UUID | undefined;
    cloneBlock(viewID: UUID, blockID: UUID): UUID | undefined;
    cloneLabel(viewID: UUID, labelID: UUID): UUID | undefined;
    cloneNumber(viewID: UUID, numberID: UUID): UUID | undefined;
    addPage(viewID: UUID): UUID;
    addEmptyPage(): UUID;
    addCollagePage(config: ICollageConfig): UUID;
    removePage(pageID: UUID): void;
    /**
     * Register a paperspace view and select it, as a single undo step. Selection is a separate
     * `SetCoreSignalCommand` so add+select apply/undo cleanly together.
     *
     * Standalone (stand-in) flow: the `?.` drops this call (no `runCommandsAsTransaction` on the
     * stand-in) so `addView` becomes a no-op. The documents flow never reaches this — views are
     * fed in via the constructor's `paperSpaceDB.views`, which goes through `_addViewDirect`
     * synchronously. See the class-level JSDoc on `core` for the full standalone contract.
     */
    addView(view: IView): UUID;
    /** Remove a view's data only (pages/pageViews and selection are untouched). */
    removeView(viewID: UUID): void;
    addPageView(pageID: UUID, viewID: UUID, position: IPoint2d, width: number, height: number): UUID;
    updatePageViewport(pageID: UUID, pageViewID: UUID, x: number, y: number, w: number, h: number): void;
    updateCollageSlotView(pageID: UUID, slotID: UUID, viewID: UUID): void;
    updateCollageConfig(pageID: UUID, slots: ICollageSlot[]): void;
    /** Called by AddPageCommand. */
    _addPageDirect(viewID: UUID, pageID: UUID): void;
    /** Called by AddEmptyPageCommand. */
    _addEmptyPageDirect(pageID: UUID): void;
    /** Called by AddCollagePageCommand. */
    _addCollagePageDirect(pageID: UUID, config: ICollageConfig): void;
    /** Called by AddPageViewCommand. */
    _addPageViewDirect(pageID: UUID, pageViewID: UUID, viewID: UUID, position: IPoint2d, width: number, height: number): void;
    /** Called by AddPageViewCommand.undo. */
    _removePageViewDirect(pageID: UUID, pageViewID: UUID): void;
    /** Called by RemovePageCommand / AddPageCommand.undo. */
    _removePageDirect(pageID: UUID): void;
    /** Called by RemovePageCommand.undo. */
    _restorePageDirect(pageID: UUID, page: IPage, orderIndex: number): void;
    /** Called by AddViewCommand / RemoveViewCommand.undo. Registers a view's data only. */
    _addViewDirect(view: IView): void;
    /**
     * Called by RemoveViewCommand / AddViewCommand.undo. Removes a view's own data
     * only — every per-view container plus `allViewIDs` membership. Deliberately
     * leaves `pages`, `pageViews`, collage slots, and `selectedViewID` untouched.
     */
    _removeViewDirect(viewID: UUID): void;
    /**
     * Reconstruct an `IView` from live state — the inverse of
     * `_initializeViewCollections`. Used by `RemoveViewCommand` to snapshot the
     * view for undo. Fields not persisted into the per-view maps (`index`,
     * `rotation`, `settings`, `wallDistance`, `wallViewType`, color/`show*` flags)
     * are defaulted; they are not read at runtime, so the runtime-relevant state
     * round-trips losslessly. Returns `undefined` if the view does not exist.
     */
    _getViewData(viewID: UUID): IView | undefined;
    setActiveCanvasKey(key: UUID | undefined): void;
    updateCanvasSize(width: number, height: number): void;
    getPageCanvasZoom(pageID: UUID): CoreSignal<number> | undefined;
    updatePageCanvasZoom(pageID: UUID, zoom: number): void;
    getPageCanvasPan(pageID: UUID): CoreSignal<IPoint2d> | undefined;
    updatePageCanvasPan(pageID: UUID, pan: IPoint2d): void;
    getPageCanvasContentSize(key: UUID): CoreSignal<{
        totalW: number;
        totalH: number;
    }> | undefined;
    updatePageCanvasContentSize(key: UUID, totalW: number, totalH: number): void;
    updateVisibility(updates: Partial<IElementVisibility>): void;
    toggleVisibility(key: keyof IElementVisibility): void;
    startContinuousMeasurement(viewID: UUID): void;
    addContinuousMeasurementPoint(point: IPoint2d): void;
    setContinuousMeasurementLockedAxis(axis: 'x' | 'y' | null): void;
    finalizeContinuousMeasurement(): void;
    cancelContinuousMeasurement(): void;
    updateGlobalFontSize(viewID: UUID, fontSizeKey: 'dimensionsFS' | 'textsFS' | 'tracesFS' | 'labelsFS' | 'leadersFS' | 'numbersFS', fontSize: number | undefined): void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    destroy(): void;
}
