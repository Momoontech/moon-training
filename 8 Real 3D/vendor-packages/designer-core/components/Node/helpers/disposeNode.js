import isWallHoleableNode from './isWallHoleableNode.js';
import removeWallHoleCurve from './removeWallHoleCurve.js';
import { getMonitor } from '../../../helpers/monitor.js';
import { childrenProperties } from './childrenProperties.js';
import getNode from './getNode.js';

const disposeNode = (node) => {
    const parent = getNode(node.core, node.parent.get());
    for (let i = 0; i < childrenProperties.length; i += 1) {
        if (childrenProperties[i] in parent) {
            parent[childrenProperties[i]].set(parent[childrenProperties[i]].get().filter((child) => child !== node.id));
        }
    }
    if (isWallHoleableNode(node)) {
        removeWallHoleCurve(node);
    }
    node.core.unregisterNode(node.id);
    getMonitor().debug(`disposing node ${node.type} ${node.id}`);
};

export { disposeNode as default };
