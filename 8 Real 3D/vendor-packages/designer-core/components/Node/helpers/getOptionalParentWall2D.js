import getParentWall2D from './getParentWall2D.js';

const getOptionalParentWall2D = (core, nodeId) => {
    try {
        return getParentWall2D(core, nodeId);
    }
    catch {
        return undefined;
    }
};

export { getOptionalParentWall2D as default };
