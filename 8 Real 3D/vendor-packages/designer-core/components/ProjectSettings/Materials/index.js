import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import { materialVariants } from '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import { getMonitor } from '../../../helpers/monitor.js';
import { MaterialsSets } from './MaterialsSets.js';

class Materials {
    materials = new Map();
    markUp;
    materialsSets;
    stockMaterialsSets;
    closetMaterialsSets;
    constructor(core, materialsDB) {
        for (const k in materialsDB) {
            if (materialVariants.includes(k)) {
                const wrappedValue = core.createValue(materialsDB[k]);
                this.set(k, wrappedValue);
            }
            else {
                switch (k) {
                    case 'markup':
                        this.markUp = {
                            label: core.createValue(materialsDB[k].label),
                            value: core.createValue(materialsDB[k].value)
                        };
                        break;
                    case 'materialsSets':
                        this.materialsSets = new MaterialsSets(core, materialsDB[k]);
                        break;
                    case 'stockMaterialsSets':
                        this.stockMaterialsSets = new MaterialsSets(core, materialsDB[k]);
                        break;
                    case 'closetMaterialsSets':
                        this.closetMaterialsSets = new MaterialsSets(core, materialsDB[k]);
                        break;
                    default:
                        getMonitor().warn(`Unknown key "${k}" found in materialsDB. Skipping...`);
                        break;
                }
            }
        }
    }
    get(materialType) {
        return this.materials.get(materialType);
    }
    set(materialType, value) {
        this.materials.set(materialType, value);
    }
    serialize() {
        const result = {};
        for (const [variant, value] of this.materials) {
            result[variant] = value.getSignal();
        }
        if (this.markUp) {
            result.markup = {
                label: this.markUp.label.getSignal(),
                value: this.markUp.value.getSignal()
            };
        }
        if (this.materialsSets)
            result.materialsSets = this.materialsSets.serialize();
        if (this.stockMaterialsSets)
            result.stockMaterialsSets = this.stockMaterialsSets.serialize();
        if (this.closetMaterialsSets)
            result.closetMaterialsSets = this.closetMaterialsSets.serialize();
        return result;
    }
}

export { Materials as default };
