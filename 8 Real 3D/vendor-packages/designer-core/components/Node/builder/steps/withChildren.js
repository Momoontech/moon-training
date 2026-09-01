const withChildren = (key, Base) => {
    const ConcreteBase = Base;
    class WithChildren extends ConcreteBase {
        constructor(config, core) {
            super(config, core);
            this[key] = core.createValue((config[key] ?? []), { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), [key]: this[key].get() };
        }
    }
    return WithChildren;
};

export { withChildren };
