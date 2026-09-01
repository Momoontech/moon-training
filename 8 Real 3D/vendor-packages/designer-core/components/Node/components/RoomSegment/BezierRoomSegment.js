import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
import '../../../../declarations/Loader.js';
import '../../../../declarations/Model.js';
import '../../../../declarations/Molding.js';
import { NodeType } from '../../../../declarations/Node.js';
import '../../../../declarations/Panel.js';
import '../../../../declarations/PaperSpace.js';
import '../../../../declarations/Part.js';
import '../../../../declarations/ProjectSettings.js';
import { SegmentType } from '../../../../declarations/Segment.js';
import '../../../../declarations/SurfaceSettings.js';
import '../../../../declarations/systems.js';
import '../../../../declarations/UIAttributes.js';
import '../../../../declarations/Valance.js';
import '../../../../declarations/views.js';
import { BaseRoomSegment } from '../../BaseRoomSegment.js';

class BezierRoomSegment extends BaseRoomSegment {
    segmentType = SegmentType.bezier;
    point1;
    constructor(config, core) {
        super(config, core);
        this.point1 = core.createValue(config.point1, { nodeId: this.id });
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...this.baseJSON(),
            type: NodeType.RoomSegment,
            segmentType: this.segmentType,
            from: this.from.get(),
            to: this.to.get(),
            point1: this.point1.get(),
            wall2D: this.wall2D.get()
        };
    }
}

export { BezierRoomSegment };
