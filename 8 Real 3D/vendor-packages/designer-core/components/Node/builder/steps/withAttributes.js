import { getNodeAttributesConfig } from '../../helpers/getNodeAttributesConfig.js';

const withAttributes = (Base) => {
    const ConcreteBase = Base;
    class WithAttributes extends ConcreteBase {
        constructor(config, core) {
            super(config, core);
            const opts = { nodeId: this.id };
            const attrs = config.attributes;
            if (attrs) {
                for (const [key, value] of Object.entries(attrs)) {
                    this.attributes.set(key, core.createValue(value, opts));
                }
            }
        }
        toJSON() {
            return { ...super.toJSON(), attributes: getNodeAttributesConfig(this) };
        }
    }
    return WithAttributes;
};

export { withAttributes };
