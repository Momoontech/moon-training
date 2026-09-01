export type MoonTrackEvents = {
    '3d:object_selected': {
        nodeId: string;
        nodeType: string;
    };
    '3d:object_deselected': {
        nodeId: string;
    };
    '3d:object_placed': {
        nodeId: string;
        catalogPath: string;
    };
    '3d:object_moved': {
        nodeId: string;
    };
    '3d:object_deleted': {
        nodeId: string;
        nodeType: string;
    };
    '3d:camera_orbit': {
        deltaX: number;
        deltaY: number;
    };
    '3d:camera_zoom': {
        delta: number;
    };
    '3d:camera_reset': Record<string, never>;
    '3d:material_changed': {
        nodeId: string;
        materialId: string;
    };
    'history:undo': {
        transactionKey: string;
    };
    'history:redo': {
        transactionKey: string;
    };
};
