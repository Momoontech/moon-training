import getNode from '../components/Node/helpers/getNode.js';

const mergeRadius = 0.01;
const getMergedPoints = (core, draggedPoint) => {
    const points = [draggedPoint];
    const stageNode = getNode(core, draggedPoint.parent.get());
    for (const childId of stageNode.points.get()) {
        const child = getNode(core, childId);
        const pointPosition = child.position;
        const draggedPointPosition = draggedPoint.position;
        const x = pointPosition.x.get() - draggedPointPosition.x.get();
        const y = pointPosition.y.get() - draggedPointPosition.y.get();
        if (!points.includes(child) && Math.sqrt(x ** 2 + y ** 2) <= mergeRadius) {
            points.push(child);
        }
    }
    return points;
};

export { getMergedPoints, mergeRadius };
