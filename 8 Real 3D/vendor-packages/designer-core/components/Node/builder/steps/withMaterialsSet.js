const withMaterialsSet = (Base) => {
    const ConcreteBase = Base;
    class WithMaterialsSet extends ConcreteBase {
        materialsSet;
        constructor(config, core) {
            super(config, core);
            this.materialsSet = core.createValue(config.materialsSet, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), materialsSet: this.materialsSet.get() };
        }
    }
    return WithMaterialsSet;
};

export { withMaterialsSet };
