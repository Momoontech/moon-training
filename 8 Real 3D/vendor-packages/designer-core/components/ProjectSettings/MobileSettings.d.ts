import { IMobileProjectSettings, MobileStep } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import Value from '../Value';
export declare class MobileSettings {
    step: Value<MobileStep>;
    constructor(core: CoreDesigner, mobileSettings: IMobileProjectSettings['mobileSettings']);
}
