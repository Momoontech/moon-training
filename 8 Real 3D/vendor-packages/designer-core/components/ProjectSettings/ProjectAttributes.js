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
import { unitsAttributesList, qtyAttributesList, booleanNumberAttributesList, stringAttributesList, directionAttributesList, mdfColorList, tieredCrownNumberList, drawerBoxKeysList, drawerSlideKeysList, secondPartTopValanceKeysList, handleTypeKeysList, toeKickKeysTypesList, multiClosetsJointTypeKeysList, integratedFinishPanelHideList, materialSetVisiblePanelHideList, materialSetEdgebadingHideList, materialSetFinishEndHideList, partPropertyHideList, firstHoleDirectionList, firstHoleOffsetList, lastHoleOffsetList } from '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getMonitor } from '../../helpers/monitor.js';
import { isInterpretedValue } from '../helpers/isInterpretedValue.js';

class ProjectAttributes {
    attributes = new Map();
    constructor(core, projectAttributesDB) {
        // Sort keys to ensure interpreted values are added last
        const sortedKeys = Object.keys(projectAttributesDB).sort((keyA, keyB) => {
            const attrA = projectAttributesDB[keyA];
            const attrB = projectAttributesDB[keyB];
            const isValAInterpreted = isInterpretedValue(attrA?.value ?? attrA);
            const isValBInterpreted = isInterpretedValue(attrB?.value ?? attrB);
            return isValAInterpreted && !isValBInterpreted ? 1 : !isValAInterpreted && isValBInterpreted ? -1 : 0;
        });
        for (const key of sortedKeys) {
            const attributeName = key;
            if ([
                ...unitsAttributesList,
                ...qtyAttributesList,
                ...booleanNumberAttributesList,
                ...stringAttributesList,
                ...directionAttributesList,
                ...mdfColorList,
                ...tieredCrownNumberList,
                ...drawerBoxKeysList,
                ...drawerSlideKeysList,
                ...secondPartTopValanceKeysList,
                ...handleTypeKeysList,
                ...toeKickKeysTypesList,
                ...multiClosetsJointTypeKeysList,
                ...integratedFinishPanelHideList,
                ...materialSetVisiblePanelHideList,
                ...materialSetEdgebadingHideList,
                ...materialSetFinishEndHideList,
                ...partPropertyHideList,
                ...firstHoleDirectionList,
                ...firstHoleOffsetList,
                ...lastHoleOffsetList
            ].includes(attributeName)) {
                const raw = projectAttributesDB[attributeName];
                const rawValue = raw?.value !== undefined ? raw.value : raw;
                this.set(attributeName, core.createValue(rawValue));
            }
            else {
                getMonitor().warn(`Unknown key "${key}" found in projectAttributesDB. Skipping...`);
            }
        }
    }
    hasAttribute(attribute) {
        return this.attributes.has(attribute);
    }
    set(attribute, value) {
        this.attributes.set(attribute, value);
    }
    getValue(attribute) {
        return this.attributes.get(attribute);
    }
    serialize() {
        const result = {};
        for (const [key, signal] of this.attributes) {
            result[key] = signal.getSignal();
        }
        return result;
    }
}

export { ProjectAttributes };
