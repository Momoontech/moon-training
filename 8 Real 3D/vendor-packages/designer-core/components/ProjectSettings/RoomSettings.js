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
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import { Direction } from '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { SurfaceSettings } from './SurfaceSettings.js';

class RoomSettings {
    wHeight;
    wDepth;
    ambientLightIntensity;
    disabledAmbientIntensity;
    spotLightsPower;
    printMode;
    roomTemplate;
    roomWidthDepth;
    snap;
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
    editingDirection;
    surfaceSettings;
    constructor(core, db) {
        // Data is already plain (labels stripped by converter) — create signals directly
        this.wHeight = core.createValue(db.wHeight);
        this.wDepth = core.createValue(db.wDepth);
        this.ambientLightIntensity = core.createValue(db.ambientLightIntensity);
        this.disabledAmbientIntensity = core.createValue(db.disabledAmbientIntensity);
        this.spotLightsPower = core.createValue(db.spotLightsPower);
        this.printMode = {
            cabinetNamesOnElevation: core.createValue(db.printMode.cabinetNamesOnElevation),
            cabinetNamesOnFloor: core.createValue(db.printMode.cabinetNamesOnFloor),
            paperSizeRatio: core.createValue(db.printMode.paperSizeRatio)
        };
        this.roomTemplate = core.createValue(db.roomTemplate);
        this.roomWidthDepth = core.createValue(db.roomWidthDepth);
        this.snap = {
            corner: {
                ortho: core.createValue(db.snap.corner.ortho)
            }
        };
        // Default to CW for legacy projects that pre-date the field. New projects
        // and migrations are expected to populate `editingDirection` explicitly.
        this.editingDirection = core.createValue(db.editingDirection ?? Direction.CW);
        this.surfaceSettings = new SurfaceSettings(core, db.surfaceSettings);
    }
    serialize() {
        return {
            wHeight: this.wHeight.getSignal(),
            wDepth: this.wDepth.getSignal(),
            ambientLightIntensity: this.ambientLightIntensity.getSignal(),
            disabledAmbientIntensity: this.disabledAmbientIntensity.getSignal(),
            spotLightsPower: this.spotLightsPower.getSignal(),
            printMode: {
                cabinetNamesOnElevation: this.printMode.cabinetNamesOnElevation.getSignal(),
                cabinetNamesOnFloor: this.printMode.cabinetNamesOnFloor.getSignal(),
                paperSizeRatio: this.printMode.paperSizeRatio.getSignal()
            },
            roomTemplate: this.roomTemplate.getSignal(),
            roomWidthDepth: this.roomWidthDepth.getSignal(),
            snap: {
                corner: {
                    ortho: this.snap.corner.ortho.getSignal()
                }
            },
            editingDirection: this.editingDirection.getSignal(),
            surfaceSettings: this.surfaceSettings.toJSON()
        };
    }
}

export { RoomSettings };
