const withMount = (Base) => {
    const ConcreteBase = Base;
    class WithMount extends ConcreteBase {
        mountSlotTypes;
        constructor(config, core) {
            super(config, core);
            this.mountSlotTypes = core.createValue(config.mountSlotTypes, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), mountSlotTypes: this.mountSlotTypes.get() };
        }
    }
    return WithMount;
};

export { withMount };
