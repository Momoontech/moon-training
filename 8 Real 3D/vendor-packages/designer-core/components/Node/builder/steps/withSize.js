import { serializeV3 } from '../../helpers/nodeSerialize.js';
import { initV3Record } from './withPosition3D.js';

const withSize = (Base) => {
    const ConcreteBase = Base;
    class WithSize extends ConcreteBase {
        size;
        constructor(config, core) {
            super(config, core);
            this.size = initV3Record(core, config.size, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), size: serializeV3(this.size) };
        }
    }
    return WithSize;
};

export { withSize };
