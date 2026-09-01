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
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getNode from './helpers/getNode.js';
import { childrenProperties, singleChildProperties } from './helpers/childrenProperties.js';
export { AdjustableBox } from './components/AdjustableBox/index.js';
export { AdjustableExtrusion } from './components/AdjustableExtrusion/index.js';
export { BoxContainer } from './components/BoxContainer/index.js';
export { Carcass } from './components/Carcass/index.js';
export { Ceiling2D } from './components/Ceiling2D/index.js';
export { Countertop } from './components/Countertop/index.js';
export { CrownMolding } from './components/CrownMolding/index.js';
export { Edgebanding } from './components/Edgebanding/index.js';
export { Floor2D } from './components/Floor2D/index.js';
export { Frame } from './components/Frame/index.js';
export { FreeBoxContainer, defaultFirstHoleOffset } from './components/FreeBoxContainer/index.js';
export { GateFrame } from './components/GateFrame/index.js';
export { Glass } from './components/Glass/index.js';
export { Image } from './components/Image/index.js';
export { Item } from './components/Item/index.js';
export { LaminateBox } from './components/LaminateBox/index.js';
export { MiteredPanel } from './components/MiteredPanel/index.js';
import './BaseModel.js';
export { Molding, SimpleMolding } from './components/Molding/index.js';
export { MountLine } from './components/MountLine/index.js';
export { MountPlane } from './components/MountPlane/index.js';
export { MountPoint } from './components/MountPoint/index.js';
export { Panel } from './components/Panel/index.js';
export { Part } from './components/Part/index.js';
export { Point } from './components/Point/index.js';
export { PointLight } from './components/PointLight/index.js';
export { RawPanel } from './components/RawPanel/index.js';
import '@preact/signals-react';
import '../../helpers/cathedral/computeCathedralContext.js';
export { ShapedBoxContainer } from './components/ShapedBoxContainer/index.js';
export { SpotLight } from './components/SpotLight/index.js';
export { Tiles } from './components/Tiles/index.js';
export { ToeKickPanel } from './components/ToeKickPanel/index.js';
export { Valance } from './components/Valance/index.js';
export { Wall2D } from './components/Wall2D/index.js';
export { WindowFrame } from './components/WindowFrame/index.js';
import createNode from './helpers/createNode.js';
import './helpers/effects.js';
import './helpers/effects.reachInCloset.js';
import './helpers/effects.wallHole.js';
export { default as defaultHoleCurve } from './helpers/defaultHoleCurve.js';
import '../../helpers/multiCloset/contentPartTypes.js';
export { collectSectionAutoStates, getEffectiveContentLocked, getResizableSides, getResizeAbsorberCommands, resolveResizeAbsorber } from './helpers/getResizableSides.js';
export { getSelectableNode } from './helpers/getSelectableNode.js';
import '../../helpers/math/plane/unitBoxCorners.js';
import '../../helpers/math/plane/projectUnitBoxToFootprint2D.js';

const createRecursive = (json, id, core) => {
    const config = json[id];
    createNode(config, core);
    for (let i = 0; i < childrenProperties.length; i += 1) {
        if (childrenProperties[i] in config) {
            for (let j = 0; j < config[childrenProperties[i]].length; j += 1) {
                createRecursive(json, config[childrenProperties[i]][j], core);
            }
        }
    }
    for (let i = 0; i < singleChildProperties.length; i += 1) {
        if (singleChildProperties[i] in config) {
            createRecursive(json, config[singleChildProperties[i]], core);
        }
    }
};
const applyRecursive = (id, core, callback) => {
    const node = getNode(core, id);
    callback(node);
    for (let i = 0; i < childrenProperties.length; i += 1) {
        if (childrenProperties[i] in node) {
            for (let j = 0; j < node[childrenProperties[i]].get().length; j += 1) {
                applyRecursive(node[childrenProperties[i]].get()[j], core, callback);
            }
        }
    }
    for (let i = 0; i < singleChildProperties.length; i += 1) {
        if (singleChildProperties[i] in node) {
            applyRecursive(node[singleChildProperties[i]].get(), core, callback);
        }
    }
};
const saveRecursive = (json, id, core) => {
    const node = getNode(core, id);
    json[id] = node.toJSON();
    for (let i = 0; i < childrenProperties.length; i += 1) {
        if (childrenProperties[i] in json[id]) {
            for (let j = 0; j < json[id][childrenProperties[i]].length; j += 1) {
                saveRecursive(json, json[id][childrenProperties[i]][j], core);
            }
        }
    }
    for (let i = 0; i < singleChildProperties.length; i += 1) {
        if (singleChildProperties[i] in json[id]) {
            saveRecursive(json, json[id][singleChildProperties[i]], core);
        }
    }
};

export { applyRecursive, childrenProperties, createNode, createRecursive, getNode, saveRecursive, singleChildProperties };
