import getParentRoom from './getParentRoom.js';

const getOptionalParentRoom = (core, nodeId) => {
    try {
        return getParentRoom(core, nodeId);
    }
    catch {
        return undefined;
    }
};

export { getOptionalParentRoom as default };
