import { CoreDesigner } from '../designer-core';
declare const CoreSignals: {
    currentStageId: (core: CoreDesigner) => import("..").UUID;
    generalViewMode: (core: CoreDesigner) => import("..").GeneralViewMode;
    editor2DBaseNodeId: (core: CoreDesigner) => import("..").UUID | null;
    floorPlanDrawMode: (core: CoreDesigner) => import("..").FloorPlanDrawMode;
    selectedNodeId: (core: CoreDesigner) => import("..").UUID | null;
    selectedNodeType: (core: CoreDesigner) => import("..").NodeType | null;
    draggedNodeId: (core: CoreDesigner) => import("..").UUID | null;
    draggedNodeType: (core: CoreDesigner) => import("..").NodeType | null;
    hoveredNodeId: (core: CoreDesigner) => import("..").UUID | null;
    hoveredNodeType: (core: CoreDesigner) => import("..").NodeType | null;
    step: (core: CoreDesigner) => import("..").MobileStep | null;
    catalogDragPath: (core: CoreDesigner) => import("..").CatalogConfig | null;
    hasPages: (core: CoreDesigner) => boolean;
    hasSystems: (core: CoreDesigner) => boolean;
};
export default CoreSignals;
