import { CoreMode, IMobileProjectSettings, IProjectSettings } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { MobileSettings } from './MobileSettings';
import { ProjectSettingsBase } from './ProjectSettingsBase';
export declare class MobileProjectSettings extends ProjectSettingsBase {
    readonly coreMode = CoreMode.mobile;
    mobileSettings: MobileSettings;
    constructor(core: CoreDesigner, projectSettingsDB: IProjectSettings);
    serialize(): IMobileProjectSettings;
}
