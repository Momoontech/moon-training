import { CoreMode, IProjectSettings, IWebProjectSettings } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { ProjectSettingsBase } from './ProjectSettingsBase';
import { WebSettings } from './WebSettings';
export declare class WebProjectSettings extends ProjectSettingsBase {
    readonly coreMode = CoreMode.web;
    webSettings: WebSettings;
    constructor(core: CoreDesigner, projectSettingsDB: IProjectSettings);
    serialize(): IWebProjectSettings;
}
