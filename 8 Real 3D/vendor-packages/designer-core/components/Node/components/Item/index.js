import { IProductPropertyNamesValues } from '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
import '../../../../declarations/Loader.js';
import '../../../../declarations/Model.js';
import '../../../../declarations/Molding.js';
import { NodeType } from '../../../../declarations/Node.js';
import '../../../../declarations/Panel.js';
import '../../../../declarations/PaperSpace.js';
import '../../../../declarations/Part.js';
import '../../../../declarations/ProjectSettings.js';
import '../../../../declarations/Segment.js';
import '../../../../declarations/SurfaceSettings.js';
import '../../../../declarations/systems.js';
import '../../../../declarations/UIAttributes.js';
import '../../../../declarations/Valance.js';
import '../../../../declarations/views.js';
import { NodeBuilder } from '../../builder/NodeBuilder.js';
import '../../helpers/defaultHoleCurve.js';
import '../../../../helpers/multiCloset/contentPartTypes.js';
import '../../helpers/getResizableSides.js';
import '../../helpers/getSelectableNode.js';
import isWallHoleableNode from '../../helpers/isWallHoleableNode.js';
import '../../../../helpers/math/plane/unitBoxCorners.js';
import '../../../../helpers/math/plane/projectUnitBoxToFootprint2D.js';
import '@preact/signals-react';
import { getEffects } from '../../helpers/effectRegistry.js';
import { registerNodeEffects } from '../../helpers/registerNodeEffects.js';

const _ItemBase = NodeBuilder.create()
    .withPosition3D()
    .withRotation()
    .withSize()
    .withProperties(IProductPropertyNamesValues)
    .withMountType()
    .withItemType()
    .withChildren('sections')
    .withChildren('separators')
    .withMaterialsSet()
    .withChildren('children')
    .withAttributes()
    .toClass();
class Item extends _ItemBase {
    type = NodeType.Item;
    roomShape;
    roomId;
    effects = [];
    disposeEffects;
    cabinetType;
    multiClosetType;
    applianceType;
    // Grouping id for the multiCloset "system" this closet belongs to. Only present on
    // multiCloset items; written via `SetMultiClosetSystemCommand`.
    system;
    // Whether this closet's interior has already been auto-generated. Only present on
    // multiCloset items (defaults to `false`); flipped to `true` by `fillMultiClosets`
    // so a repeated fill leaves already-generated closets untouched.
    isGenerated;
    holeShape;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        if (config.itemType === ItemType.cabinet && 'cabinetType' in config && config.cabinetType !== undefined) {
            this.cabinetType = core.createValue(config.cabinetType, options);
        }
        if (config.itemType === ItemType.multiCloset &&
            'multiClosetType' in config &&
            config.multiClosetType !== undefined) {
            this.multiClosetType = core.createValue(config.multiClosetType, options);
        }
        if (config.itemType === ItemType.multiCloset && 'system' in config && config.system) {
            this.system = core.createValue(config.system, options);
        }
        if (config.itemType === ItemType.multiCloset) {
            this.isGenerated = core.createValue('isGenerated' in config && config.isGenerated !== undefined ? config.isGenerated : false, options);
        }
        if (config.itemType === ItemType.appliance && 'applianceType' in config && config.applianceType !== undefined) {
            this.applianceType = core.createValue(config.applianceType, options);
        }
        if (config.itemType === ItemType.multiCloset) {
            this.effects.push(...getEffects('multiCloset'));
        }
        if (config.itemType === ItemType.reachInCloset) {
            this.roomId = core.createValue('roomId' in config && config.roomId ? config.roomId : null, options);
            this.effects.push(...getEffects('reachInCloset'));
        }
        if (isWallHoleableNode(this)) {
            this.effects.push(...getEffects('wallHoleable'));
        }
        this.holeShape = 'holeShape' in config ? core.createCurveValue(config.holeShape, options) : undefined;
        this.roomShape = 'roomShape' in config ? core.createShapeValue(config.roomShape, options) : undefined;
        this.disposeEffects = registerNodeEffects(this);
        this.core.addNode(this);
    }
    dispose() {
        this.disposeEffects();
        super.dispose();
    }
    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.holeShape ? { holeShape: this.holeShape.getSignal() } : {}),
            ...(this.roomShape ? { roomShape: this.roomShape.getSignal() } : {}),
            ...(this.roomId && this.roomId.get() ? { roomId: this.roomId.get() } : {}),
            ...(this.cabinetType ? { cabinetType: this.cabinetType.get() } : {}),
            ...(this.multiClosetType ? { multiClosetType: this.multiClosetType.get() } : {}),
            ...(this.system && this.system.get() ? { system: this.system.get() } : {}),
            ...(this.isGenerated && this.isGenerated.get() ? { isGenerated: true } : {}),
            ...(this.applianceType ? { applianceType: this.applianceType.get() } : {})
        };
    }
}

export { Item };
