import { CoreDesigner } from '../../';
import { Direction, inches, IRoomWidthDepth, PaperSizeRatio, roomSettingsType, roomTemplateValue } from '../../declarations';
import { SurfaceSettings } from './SurfaceSettings';
import Value from '../Value';
export declare class RoomSettings {
    wHeight: Value<inches>;
    wDepth: Value<inches>;
    ambientLightIntensity: Value<number>;
    disabledAmbientIntensity: Value<number>;
    spotLightsPower: Value<number>;
    printMode: {
        cabinetNamesOnElevation: Value<number>;
        cabinetNamesOnFloor: Value<number>;
        paperSizeRatio: Value<PaperSizeRatio>;
    };
    roomTemplate: Value<roomTemplateValue>;
    roomWidthDepth: Value<IRoomWidthDepth>;
    snap: {
        corner: {
            ortho: Value<boolean>;
        };
    };
    /**
     * Globally-selected edit direction for dimension / angle badges. Single
     * source of truth shared across every overlay (FloorPlanUI, Editor2DUI,
     * Editor3DUI). Mutate via `SetEditingDirectionCommand`; reads in React
     * components go through the `useDirection` hook in `@moon/designer-ui`.
     *
     * Always non-null at runtime — the constructor falls back to {@link
     * Direction.CW} when `db.editingDirection` is missing (legacy projects
     * saved before this field was added). That default also matches the spec:
     * every consumer starts clockwise.
     */
    editingDirection: Value<Direction>;
    surfaceSettings: SurfaceSettings;
    constructor(core: CoreDesigner, db: roomSettingsType);
    serialize(): roomSettingsType;
}
