const isInterpretedValue = (value) => {
    if (!Array.isArray(value) || !value[0] || typeof value[0] !== 'object') {
        return false;
    }
    // Nested sub-expression form: outer array whose first element is itself an
    // InterpretedValue array (e.g. [[token, ...]] to produce an array result).
    if (Array.isArray(value[0])) {
        return true;
    }
    if (!('type' in value[0] && 'value' in value[0])) {
        return false;
    }
    return true;
};

export { isInterpretedValue };
