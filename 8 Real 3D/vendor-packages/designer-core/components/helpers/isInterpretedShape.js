const isInterpretedShape = (value) => {
    return value && typeof value === 'object' && 'curve' in value;
};

export { isInterpretedShape };
