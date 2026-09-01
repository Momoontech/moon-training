const withMountType = (Base) => {
    const ConcreteBase = Base;
    class WithMountType extends ConcreteBase {
        mountTypes;
        constructor(config, core) {
            super(config, core);
            this.mountTypes = core.createValue(config.mountTypes, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), mountTypes: this.mountTypes.get() };
        }
    }
    return WithMountType;
};

export { withMountType };
