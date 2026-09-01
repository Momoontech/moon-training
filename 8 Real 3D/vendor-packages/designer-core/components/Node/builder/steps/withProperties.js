const withProperties = (namesValues) => (Base) => {
    const ConcreteBase = Base;
    class WithProperties extends ConcreteBase {
        properties = new Map();
        constructor(config, core) {
            super(config, core);
            const opts = { nodeId: this.id };
            for (let i = 0; i < namesValues.length; i++) {
                this.properties.set(namesValues[i], core.createValue(config[namesValues[i]], opts));
            }
        }
        toJSON() {
            const props = Object.fromEntries(Array.from(this.properties.entries()).map(([key, value]) => [key, value.get()]));
            return { ...super.toJSON(), ...props };
        }
    }
    return WithProperties;
};

export { withProperties };
