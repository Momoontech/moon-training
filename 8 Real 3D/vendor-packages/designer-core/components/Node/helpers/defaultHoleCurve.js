import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import { V3Axes } from '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';

const offset = 1e-3;
const defaultHoleCurve = [
    {
        x: offset,
        y: offset
    },
    {
        type: 'lineTo',
        x: [
            {
                type: 'size',
                value: V3Axes.x
            },
            {
                type: 'operator',
                value: `-${offset}`
            }
        ],
        y: offset
    },
    {
        type: 'lineTo',
        x: [
            {
                type: 'size',
                value: V3Axes.x
            },
            {
                type: 'operator',
                value: `-${offset}`
            }
        ],
        y: [
            {
                type: 'size',
                value: V3Axes.y
            },
            {
                type: 'operator',
                value: `-${offset}`
            }
        ]
    },
    {
        type: 'lineTo',
        x: offset,
        y: [
            {
                type: 'size',
                value: V3Axes.y
            },
            {
                type: 'operator',
                value: `-${offset}`
            }
        ]
    },
    {
        type: 'lineTo',
        x: offset,
        y: offset
    }
];

export { defaultHoleCurve as default };
