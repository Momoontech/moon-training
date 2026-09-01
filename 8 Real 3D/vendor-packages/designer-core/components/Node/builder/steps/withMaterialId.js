const withMaterialId = (Base) => {
    const ConcreteBase = Base;
    class WithMaterialId extends ConcreteBase {
        materialId;
        constructor(config, core) {
            super(config, core);
            this.materialId = core.createValue(config.materialId, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), materialId: this.materialId.get() };
        }
    }
    return WithMaterialId;
};

export { withMaterialId };
