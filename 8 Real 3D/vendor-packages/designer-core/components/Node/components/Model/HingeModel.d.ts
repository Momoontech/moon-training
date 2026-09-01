import { HingeModelConfig, HingeType, ModelType, UUID } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
import { BaseModel } from '../../BaseModel';
export declare class HingeModel extends BaseModel {
    readonly modelType: ModelType.hinge;
    readonly hingeType: Value<HingeType>;
    readonly materialId: Value<UUID | undefined>;
    constructor(config: HingeModelConfig, core: CoreDesigner);
    toJSON(): HingeModelConfig;
}
