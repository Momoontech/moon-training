import { Vector2 } from './math/Vector2.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

// import { Panel } from '../components/Node/components/Panel';
// import { CoreDesigner } from '..';
const getProductOffset = ( /*_core: CoreDesigner, _panel: Panel*/) => {
    // const item = getParentItem(core, panel.id);
    // const v3 = new Vector3().setFromMatrixPosition(
    // this is incorrect, group.matrixWorld are not signals,
    // we need to calculate matrix world recursively based on positions, rotations of parent
    // which are all signals to get correct updates
    // panel.group.matrixWorld.clone().premultiply(item ? item.group.matrixWorld.clone().invert() : m)
    // );
    return new Vector2(0, 0);
};

export { getProductOffset as default };
