import { ModelType, OtherModelConfig, UUID, V3Axes } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
import { BaseModel } from '../../BaseModel';
export declare class OtherModel extends BaseModel {
    readonly modelType: Exclude<ModelType, ModelType.applianceModel | ModelType.hinge>;
    readonly materialId: Value<UUID | undefined>;
    isSizable?: Value<boolean>;
    isScalable?: Value<boolean | 'x'>;
    isPositioned?: Value<true>;
    size?: Record<V3Axes, Value<number>>;
    constructor(config: OtherModelConfig, core: CoreDesigner);
    toJSON(): OtherModelConfig;
}
