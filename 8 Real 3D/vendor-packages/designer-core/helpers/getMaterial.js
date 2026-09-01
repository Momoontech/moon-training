import getNode from '../components/Node/helpers/getNode.js';
import getParentBoxContainer from '../components/Node/helpers/getParentBoxContainer.js';
import getParentPanel from '../components/Node/helpers/getParentPanel.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import { ModelType } from '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import { PanelType } from '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import { getMonitor } from './monitor.js';
import fallbackMaterial from './fallbackMaterial.js';
import { getDefaultMaterialId } from './getDefaultMaterialId.js';
import getMaterialById from './getMaterialById.js';
import getMaterialsSet from './getMaterialsSet.js';
import getPropertyValue from './getPropertyValue.js';

function getMaterial(core, id) {
    const node = getNode(core, id);
    // const styledPartConfig = getParent(core, node.parent.get()); // getObjectFromStore(object.parent.parent.uuid) as IPartConfig;
    // if (styledPartConfig?.partType === 'shelfPart') {
    //   mat = getMaterialById(core, config.materialId || materialsSet[object.panelType], [object.panelType, 'doorStyle']);
    // } else
    switch (node.type) {
        case NodeType.Panel: {
            const materialsSet = getMaterialsSet(core, id);
            let mat;
            let mat2;
            const panelType = node.panelType.get();
            const materialId = node.materialId.get();
            switch (panelType) {
                case PanelType.melamineBoxBottom:
                    mat = getMaterialById(core, materialId || materialsSet.melamineBox.get(), 'melamineBox');
                    return mat.matchingQuarterThick ? getMaterialById(core, mat.matchingQuarterThick, panelType) : mat;
                case PanelType.doorInsert:
                    mat = getMaterialById(core, materialId || materialsSet.door.get(), ['door', 'doorStyle']);
                    mat2 = getMaterialById(core, mat.matchingVisiblePanel, 'door');
                    return getMaterialById(core, mat2.matchingQuarterThick, panelType);
                default:
                    return getMaterialById(core, materialId || materialsSet[panelType].get(), [panelType, 'doorStyle']);
            }
        }
        case NodeType.Model: {
            switch (node.modelType) {
                case ModelType.hinge:
                    return getMaterialById(core, node.materialId.get(), node.hingeType.get());
                case ModelType.applianceModel:
                    return {};
                default:
                    return getMaterialById(core, node.materialId.get(), node.modelType);
            }
        }
        case NodeType.ToeKickPanel: {
            const materialsSet = getMaterialsSet(core, id);
            const materialId = node.materialId.get();
            return getMaterialById(core, materialId || materialsSet.toeKick.get(), 'toeKick');
        }
        case NodeType.Valance: {
            const materialsSet = getMaterialsSet(core, id);
            const materialId = node.materialId.get();
            return getMaterialById(core, materialId || materialsSet[node.valanceType.get()].get(), node.valanceType.get());
        }
        // case NodeType.GateFrame: {
        //   const materialsSet = getMaterialsSet(core, id);
        //   const materialId = node.materialId.get();
        //   return getMaterialById(core, materialId || materialsSet.door.get(), 'gateFrame');
        // }
        case NodeType.WindowFrame:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'windowFrame'), 'windowFrame')._id, 'windowFrame');
        case NodeType.GateFrame:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'gateFrame'), 'gateFrame')._id, 'gateFrame');
        case NodeType.CrownMolding:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'crownMolding'), 'crownMolding')._id, 'crownMolding');
        case NodeType.Wall2D:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'wall'), 'wall')._id, 'wall');
        case NodeType.Floor2D:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'floor'), 'floor')._id, 'floor');
        case NodeType.Ceiling2D:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'ceiling'), 'ceiling')._id, 'ceiling');
        case NodeType.Countertop:
            return getMaterialById(core, node.materialId.get() || getMaterialById(core, getDefaultMaterialId(core, 'countertop'), 'countertop')._id, 'countertop');
        default:
            getMonitor().warn(`Tried to calculate material for incorrect object type ${node.type}`);
            return fallbackMaterial;
    }
}
function getMaterials(core, id) {
    const node = getNode(core, id);
    switch (node.type) {
        case NodeType.Edgebanding: {
            const panel = getParentPanel(core, node.id);
            let materialIds = [];
            const { edgeMaterialIds } = panel;
            const isShelfPanel = getPropertyValue(panel, 'isShelfPanel');
            if (isShelfPanel) {
                const boxContainer = getParentBoxContainer(core, panel.id);
                materialIds = getPropertyValue(boxContainer, 'shelfEdgeMaterialIds');
            }
            else {
                materialIds = edgeMaterialIds.map((edgeMaterialId) => edgeMaterialId.get());
            }
            return materialIds.map((id) => {
                const ownMaterialId = id;
                // const calcOwnMaterialId = Array.isArray(ownMaterialId)
                //   ? (Reflect.apply(calculateValue, panel, [parseValue(ownMaterialId)]) as string | null)
                //   : ownMaterialId;
                const materialId = ownMaterialId === '' ? getMaterialsSet(core, panel.id)[node.edgebandingType.get()].get() : ownMaterialId;
                return materialId ? getMaterialById(core, materialId, node.edgebandingType.get()) : null;
                // this.setLookById(
                //   materialId === null
                //     ? 'particleBoard'
                //     : getMaterialById(materialId, this.edgebandingType).lookId || getDefaultLookId('body'),
                //   i,
                //   materialId === null ? 'service' : 'body'
                // );
            });
        }
        default:
            return [];
    }
}

export { getMaterial, getMaterials };
