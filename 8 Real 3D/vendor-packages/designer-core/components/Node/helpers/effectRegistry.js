const registry = new Map();
const registerEffects = (key, effects) => {
    registry.set(key, effects);
};
const getEffects = (key) => {
    return registry.get(key) ?? [];
};

export { getEffects, registerEffects };
