import Value from './index.js';
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
import { NodeType } from '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getAttributeValue from '../../helpers/getAttributeValue.js';
import getClosetNeighborAttribute from '../../helpers/getClosetNeighborAttribute.js';
import getNegativeShapeOffset from '../../helpers/getNegativeShapeOffset.js';
import getProductOffset from '../../helpers/getProductOffset.js';
import getMountPoint from '../Node/helpers/getMountPoint.js';
import getNode from '../Node/helpers/getNode.js';
import getParentBoxContainer from '../Node/helpers/getParentBoxContainer.js';
import getParentCarcass from '../Node/helpers/getParentCarcass.js';
import getParentCountertop from '../Node/helpers/getParentCountertop.js';
import getParentFreeBoxContainer from '../Node/helpers/getParentFreeBoxContainer.js';
import getParentItem from '../Node/helpers/getParentItem.js';
import getParentModel from '../Node/helpers/getParentModel.js';
import getParentPanel from '../Node/helpers/getParentPanel.js';
import getParentPart from '../Node/helpers/getParentPart.js';
import { getMaterial } from '../../helpers/getMaterial.js';
import { getModelBBox } from '../../helpers/getModelBBox.js';
import getMaterialById from '../../helpers/getMaterialById.js';
import getMaterialsSet from '../../helpers/getMaterialsSet.js';
import getPropertyValue from '../../helpers/getPropertyValue.js';
import getMultiClosetNeighborAttribute from '../../helpers/getMultiClosetNeighborAttribute.js';
import getMultiClosetNeighborProperty from '../../helpers/getMultiClosetNeighborProperty.js';
import getMultiClosetNeighborSize from '../../helpers/getMultiClosetNeighborSize.js';
import { getMonitor } from '../../helpers/monitor.js';
import getOptionalParentRoom from '../Node/helpers/getOptionalParentRoom.js';

const evaluateToken = (item, { core, options }) => {
    const nodeId = options.nodeId;
    switch (item.type) {
        // --- Basic ---
        case 'operator':
            return item.value;
        case 'constant':
            return item.value;
        // --- Size ---
        case 'size': {
            const node = getNode(core, nodeId);
            if (!('size' in node) || !node.size) {
                // Models (hardware pulls, legs, …) carry no explicit `size` Value — their
                // footprint is the loaded GLB's bounding box, published by the renderer
                // (designer3d `loadModel3D`) into the `models` store. Fall back to it so
                // pull-centering formulas (`defaultPullPositionX/Y`) offset by the real
                // handle size instead of `0`, which otherwise pins the handle to a panel
                // edge (off-centre by half the handle's dimension). Headless core leaves
                // the store empty, so this still resolves to `0` there — unchanged.
                if (node.type === NodeType.Model) {
                    const bbox = getModelBBox(core, node);
                    return bbox ? bbox.size.get()[item.value] : 0;
                }
                return 0;
            }
            return node.size[item.value].get();
        }
        case 'modelSize': {
            const model = getParentModel(core, nodeId);
            if (!('size' in model) || !model.size) {
                getMonitor().warn('Size handler called on node without size property', item.value, model);
                return 0;
            }
            return model.size[item.value].get();
        }
        case 'initialSize': {
            // const node = getNode(core, nodeId);
            // if (node.type !== NodeType.Model) return 0;
            // const sourceInfo = getModelSource(core, node);
            // const modelData = core.storage.get('models')[sourceInfo.source];
            // if (!modelData) {
            //   core.storage.get('models')[sourceInfo.source] = {
            //     size: core.createValue<Record<V3Axes, number>>({ x: 1, y: 1, z: 1 }),
            //     origin: core.createValue<Record<V3Axes, number>>({ x: 0, y: 0, z: 0 })
            //   };
            // }
            // return core.storage.get('models')[sourceInfo.source].size.get()[item.value];
            return 1;
        }
        case 'productSize':
            return getParentItem(core, nodeId).size[item.value].get();
        case 'partSize':
            return getParentPart(core, nodeId).size[item.value].get();
        case 'boxContainerSize':
            return getParentBoxContainer(core, nodeId).size[item.value].get();
        case 'freeBoxContainerSize':
            return getParentFreeBoxContainer(core, nodeId).size[item.value].get();
        case 'coreFreeBoxContainerSize':
            //@TODO NEED TO FIX, INFINITE LOOP
            return 0; //getCoreFreeBoxContainer(core, nodeId).size[item.value].get();
        case 'countertopSize':
            return getParentCountertop(core, nodeId).size[item.value].get();
        case 'panelSize':
            return getParentPanel(core, nodeId).size[item.value].get();
        case 'carcassSize':
            return getParentCarcass(core, nodeId).size[item.value].get();
        // --- Position ---
        case 'position': {
            const node = getNode(core, nodeId);
            if (!('position' in node)) {
                getMonitor().warn('Position handler called on node without position', item.value, node);
                return 0;
            }
            return node.position[item.value].get();
        }
        case 'productPosition':
            return getParentItem(core, nodeId).position[item.value].get();
        case 'partPosition':
            return getParentPart(core, nodeId).position[item.value].get();
        case 'relativePosition': {
            //@TODO NEED TO FIX, INFINITE LOOP
            // const [targetType, axis] = item.value;
            // if (targetType === 'coreFreeBoxContainer') {
            //   const node = getNode(core, nodeId);
            //   const container = getCoreFreeBoxContainer(core, nodeId);
            //   return getRelativePosition(node, container)[axis];
            // }
            // default logic
            return 0; //node.position[axis].get();
        }
        // --- Offsets ---
        case 'negativeShapeOffset': {
            const node = getNode(core, nodeId);
            if (!('shape' in node) || !node.shape) {
                getMonitor().warn('NegativeShapeOffset handler called on node without shape', item.value, nodeId);
                return 0;
            }
            return getNegativeShapeOffset();
        }
        case 'productOffset': {
            const node = getNode(core, nodeId);
            if (node.type !== NodeType.Panel) {
                getMonitor().warn('ProductOffset handler called on invalid node', item.value, nodeId);
                return 0;
            }
            return getProductOffset( /*core, node*/)[item.value];
        }
        // --- Attributes ---
        case 'attribute':
            return getAttributeValue(getNode(core, nodeId), item.value);
        case 'productAttribute':
            return getAttributeValue(getParentItem(core, nodeId), item.value);
        case 'partAttribute':
            return getAttributeValue(getParentPart(core, nodeId), item.value);
        case 'roomAttribute':
            const room = getOptionalParentRoom(core, nodeId);
            if (!room) {
                getMonitor().warn('roomAttribute called on non-room node', item.value);
                return 0;
            }
            return getAttributeValue(room, item.value);
        case 'boxContainerAttribute':
            return getAttributeValue(getParentBoxContainer(core, nodeId), item.value);
        case 'countertopAttribute':
            return getAttributeValue(getParentCountertop(core, nodeId), item.value);
        case 'panelAttribute':
            return getAttributeValue(getParentPanel(core, nodeId), item.value);
        case 'mountPointAttribute': {
            return getAttributeValue(getMountPoint(core, nodeId), item.value);
        }
        case 'carcassAttribute':
            return getAttributeValue(getParentCarcass(core, nodeId), item.value);
        case 'closetNeighborAttribute':
            return getClosetNeighborAttribute(core, nodeId, item.value[0], item.value[1]);
        case 'multiClosetNeighborProperty':
            return getMultiClosetNeighborProperty(core, nodeId, item.value[0], item.value[1]);
        case 'multiClosetNeighborAttribute':
            return getMultiClosetNeighborAttribute(core, nodeId, item.value[0], item.value[1]);
        case 'multiClosetNeighborSize':
            return getMultiClosetNeighborSize(core, nodeId, item.value[0], item.value[1]);
        case 'projectSetting': {
            const path = item.value;
            // Unwrap a `Value<T>` reactive wrapper. Specifically does NOT unwrap a
            // Map (Map also has a `.get` method but with different semantics —
            // takes a key arg). Map traversal is handled below via `.get(segment)`.
            const unwrapValue = (v) => (v instanceof Value ? v.get() : v);
            let cursor = core.projectSettings;
            for (const key of path) {
                cursor = unwrapValue(cursor);
                if (cursor == null) {
                    getMonitor().warn('projectSetting could not resolve path', path, 'failed at key', key);
                    return 0;
                }
                if (cursor instanceof Map) {
                    cursor = cursor.get(key);
                    continue;
                }
                if (typeof cursor !== 'object' || !(key in cursor)) {
                    getMonitor().warn('projectSetting could not resolve path', path, 'failed at key', key);
                    return 0;
                }
                cursor = cursor[key];
            }
            cursor = unwrapValue(cursor);
            if (typeof cursor === 'number' ||
                typeof cursor === 'string' ||
                typeof cursor === 'boolean' ||
                cursor === null ||
                Array.isArray(cursor)) {
                return cursor;
            }
            getMonitor().warn('projectSetting resolved to non-primitive value', path, cursor);
            return 0;
        }
        case 'projectAttribute': {
            const projectAttributes = core.projectSettings.projectAttributes;
            if (!projectAttributes.hasAttribute(item.value)) {
                getMonitor().warn('projectAttribute called on non-existent project attribute', item.value);
                return 0;
            }
            const attribute = projectAttributes.getValue(item.value);
            if (!attribute) {
                getMonitor().warn('projectAttribute could not retrieve attribute', item.value);
                return 0;
            }
            return attribute.get();
        }
        // --- Properties ---
        case 'productProperty':
            return getPropertyValue(getParentItem(core, nodeId), item.value);
        case 'partProperty':
            return getPropertyValue(getParentPart(core, nodeId), item.value);
        case 'property':
            return getPropertyValue(getNode(core, nodeId), item.value);
        case 'boxContainerProperty':
            return getPropertyValue(getParentBoxContainer(core, nodeId), item.value);
        case 'boxContainerLayout': {
            const container = getParentBoxContainer(core, nodeId);
            return item.value === 'Interior' ? container.interiorLayout.get() : container.exteriorLayout.get();
        }
        case 'neightborContainerHasFreeExteriors': {
            //@TODO NEED TO FIX, INFINITE LOOP
            // const neighbor = getNeighborContainer(core, getCoreBoxContainer(core, nodeId), item.value);
            // // @ts-expect-error need to implement type properly
            // return Number(hasFreeExteriorParts(core, neighbor));
            return 0;
        }
        case 'materialsSetAttribute':
            return getMaterialsSet(core, nodeId)[item.value].get();
        case 'materialsSetAttributeValue':
            return getMaterialsSet(core, nodeId)[item.value].value.get();
        case 'materialAttributeN': {
            const val = item.value;
            const node = getNode(core, nodeId);
            if (Array.isArray(val[0])) {
                // const complexVal = val as [string[], string];
                // const [sourceType, subType, propName] = complexVal[0];
                // const attrName = complexVal[1];
                // if (subType === 'panel') {
                //   const panel = getPanelByProperty(core, propName);
                //   const material = getMaterial(core, panel.id);
                //   return material[attrName] || getMaterialById(core, getMaterialsSet(core, node).body, 'body')[attrName];
                // }
                getMonitor().warn('materialAttributeN complex value format is not implemented yet', item);
                return 0;
            }
            else {
                const [type, attr] = val;
                if (type === 'panel') {
                    return Number(getMaterial(core, getParentPanel(core, nodeId).id)[attr]);
                }
                if (type === 'glass') {
                    if (node.type !== NodeType.Glass) {
                        getMonitor().warn('materialAttributeN type "glass" called on non-glass node', item);
                        return 0;
                    }
                    return Number(getMaterialById(core, node.materialId.get(), 'glass')[attr]);
                }
                // Default
                return Number(getMaterial(core, nodeId)[attr]);
            }
        }
        case 'materialAttributeS': {
            const [type, attr] = item.value;
            const node = getNode(core, nodeId);
            if (type === 'panel') {
                return String(getMaterial(core, getParentPanel(core, nodeId).id)[attr]);
            }
            if (type === 'glass') {
                if (node.type !== NodeType.Glass) {
                    getMonitor().warn('materialAttributeN type "glass" called on non-glass node', item);
                    return 0;
                }
                return String(getMaterialById(core, node.materialId.get(), 'glass')[attr]);
            }
            // Default
            return String(getMaterial(core, nodeId)[attr]);
        }
        case 'materialsSetMaterialAttributeS': {
            const [type, attr] = item.value;
            const node = getNode(core, nodeId);
            const matSet = getMaterialsSet(core, nodeId);
            if (type === 'panelType') {
                if (node.type !== NodeType.Panel) {
                    getMonitor().warn('materialsSetMaterialAttributeN type "panelType" called on non-panel node', item);
                    return '';
                }
                const matId = matSet[node.panelType.get()];
                return String(getMaterialById(core, matId, node.panelType.get())[attr]);
            }
            if (type === 'edgebandingType') {
                if (node.type !== NodeType.Edgebanding) {
                    getMonitor().warn('materialsSetMaterialAttributeN type "edgebandingType" called on non-panel node', item);
                    return '';
                }
                const matId = matSet[node.edgebandingType.get()].get();
                return String(getMaterialById(core, matId, node.edgebandingType.get())[attr]);
            }
            return String(getMaterialById(core, matSet[type], type)[attr]);
        }
        case 'materialsSetMaterialAttributeN': {
            const [type, attr] = item.value;
            const node = getNode(core, nodeId);
            const matSet = getMaterialsSet(core, nodeId);
            if (type === 'panelType') {
                if (node.type !== NodeType.Panel) {
                    getMonitor().warn('materialsSetMaterialAttributeN type "panelType" called on non-panel node', item);
                    return 0;
                }
                const panelType = node.panelType.get();
                if (panelType === 'melamineBoxBottom' || panelType === 'doorInsert') {
                    return 0.25;
                }
                const matId = matSet[panelType].get();
                return Number(getMaterialById(core, matId, panelType)[attr]);
            }
            if (type === 'edgebandingType') {
                if (node.type !== NodeType.Edgebanding) {
                    getMonitor().warn('materialsSetMaterialAttributeN type "edgebandingType" called on non-panel node', item);
                    return 0;
                }
                const matId = matSet[node.edgebandingType.get()].get();
                return Number(getMaterialById(core, matId, node.edgebandingType.get())[attr]);
            }
            return Number(getMaterialById(core, matSet[type].get(), type)[attr]);
        }
        case 'materialsSetStyleAttributeS': {
            const [key, attr] = item.value;
            const matSet = getMaterialsSet(core, nodeId);
            return String(getMaterialById(core, matSet[key], [key, 'doorStyle'])[attr]);
        }
        case 'materialsSetStyleAttributeN': {
            const [key, attr] = item.value;
            const matSet = getMaterialsSet(core, nodeId);
            return Number(getMaterialById(core, matSet[key], [key, 'doorStyle'])[attr]);
        }
        default:
            getMonitor().warn(`Unknown token type: ${item.type}`, item);
            return 0;
    }
};

export { evaluateToken };
