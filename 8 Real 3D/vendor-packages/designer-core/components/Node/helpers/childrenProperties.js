const childrenProperties = [
    'children',
    'points',
    'segments',
    'rooms',
    'walls3D',
    'stages',
    'walls2D',
    'interiorComponents',
    'exteriorComponents',
    'sections',
    'separators',
    'content',
    'bays'
];
const singleChildProperties = ['floor2D', 'ceiling2D', 'wall2D'];
const orderedChildrenProperties = [
    'sections',
    'content',
    'separators',
    'bays'
];
function isOrderedChildrenProperty(property) {
    return orderedChildrenProperties.includes(property);
}

export { childrenProperties, isOrderedChildrenProperty, orderedChildrenProperties, singleChildProperties };
