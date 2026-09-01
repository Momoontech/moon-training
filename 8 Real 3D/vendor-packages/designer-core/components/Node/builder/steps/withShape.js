const withShape = (Base) => {
    const ConcreteBase = Base;
    class WithShape extends ConcreteBase {
        shape;
        constructor(config, core) {
            super(config, core);
            this.shape = core.createShapeValue(config.shape, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), shape: this.shape.getSignal() };
        }
    }
    return WithShape;
};

export { withShape };
