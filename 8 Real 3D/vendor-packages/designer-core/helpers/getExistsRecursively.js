import getNode from '../components/Node/helpers/getNode.js';

const getExistsRecursively = (node) => {
    let result = true;
    let parent = node;
    while (result && parent) {
        result = result && Boolean(parent.exists.get());
        if (!result || !parent.parent.get())
            return result;
        parent = getNode(parent.core, parent.parent.get());
    }
    return true;
};

export { getExistsRecursively as default };
