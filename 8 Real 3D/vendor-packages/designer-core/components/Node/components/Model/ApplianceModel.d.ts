import { ApplianceModelConfig, ModelType, UUID, V3Axes } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
import { BaseModel } from '../../BaseModel';
export declare class ApplianceModel extends BaseModel {
    readonly modelType: ModelType.applianceModel;
    readonly modelId: Value<UUID>;
    isSizable?: Value<boolean | undefined>;
    isScalable?: Value<boolean | 'x' | undefined>;
    isPositioned?: Value<boolean | undefined>;
    size?: Record<V3Axes, Value<number>>;
    constructor(config: ApplianceModelConfig, core: CoreDesigner);
    toJSON(): ApplianceModelConfig;
}
