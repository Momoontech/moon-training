import { computed } from '@preact/signals-react';
import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import { RoomType } from '../../../../declarations/helpers.js';
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
import { computeCathedralContext } from '../../../../helpers/cathedral/computeCathedralContext.js';
import { getEffects } from '../../helpers/effectRegistry.js';
import { getNodeAttributesConfig } from '../../helpers/getNodeAttributesConfig.js';
import { registerNodeEffects } from '../../helpers/registerNodeEffects.js';
import { BaseNode } from '../../BaseNode.js';

class Room extends BaseNode {
    type = NodeType.Room;
    floor2D;
    ceiling2D;
    path;
    holes;
    children;
    roomType;
    reachInClosetId;
    /**
     * Memoized cathedral-ceiling derivation. Re-evaluated automatically when any
     * `.get()` it performs (room attributes, segment endpoints, point positions,
     * etc.) changes. Consumed by both Wall2D and Ceiling2D rendering effects so
     * they share a single source of truth.
     */
    cathedralContext;
    effects = getEffects(NodeType.Room);
    disposeEffects;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        const attrs = config.attributes;
        if (attrs) {
            for (const [key, value] of Object.entries(attrs)) {
                // @typescript-eslint/no-explicit-any
                this.attributes.set(key, core.createValue(value, options));
            }
        }
        this.floor2D = core.createValue(config.floor2D, options);
        this.ceiling2D = core.createValue(config.ceiling2D, options);
        this.path = core.createValue(config.path, options);
        this.holes = core.createValue(config.holes, options);
        this.children = core.createValue(config.children ?? [], options);
        this.roomType = core.createValue(config.roomType ?? RoomType.general, options);
        if (config.roomType === RoomType.reachInCloset) {
            this.reachInClosetId = core.createValue(config.reachInClosetId ?? null, options);
        }
        this.cathedralContext = computed(() => computeCathedralContext(this));
        this.disposeEffects = registerNodeEffects(this);
        this.core.addNode(this);
    }
    dispose() {
        this.disposeEffects();
        super.dispose();
    }
    toJSON() {
        const roomType = this.roomType.get();
        return {
            ...this.baseJSON(),
            attributes: getNodeAttributesConfig(this),
            floor2D: this.floor2D.get(),
            ceiling2D: this.ceiling2D.get(),
            path: this.path.get(),
            holes: this.holes.get(),
            children: this.children.get(),
            ...(roomType !== RoomType.general ? { roomType } : {}),
            ...(this.reachInClosetId ? { reachInClosetId: this.reachInClosetId.get() ?? undefined } : {})
        };
    }
}

export { Room };
