import { serializeV3 } from '../../helpers/nodeSerialize.js';
import { initV3Record } from './withPosition3D.js';

const withRotation = (Base) => {
    const ConcreteBase = Base;
    class WithRotation extends ConcreteBase {
        rotation;
        constructor(config, core) {
            super(config, core);
            this.rotation = initV3Record(core, config.rotation, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), rotation: serializeV3(this.rotation) };
        }
    }
    return WithRotation;
};

export { withRotation };
