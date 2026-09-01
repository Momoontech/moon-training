const withItemType = (Base) => {
    const ConcreteBase = Base;
    class WithItemType extends ConcreteBase {
        itemType;
        constructor(config, core) {
            super(config, core);
            this.itemType = core.createValue(config.itemType, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), itemType: this.itemType.get() };
        }
    }
    return WithItemType;
};

export { withItemType };
