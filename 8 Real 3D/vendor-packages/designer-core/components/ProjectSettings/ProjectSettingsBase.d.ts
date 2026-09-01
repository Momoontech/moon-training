import { AngularUnits, CoreMode, inches, informationType, IProjectSettings, IProjectSettingsShared, Language, LinearUnits } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import Value from '../Value';
import Materials from './Materials';
import { ProjectAttributes } from './ProjectAttributes';
import { RoomSettings } from './RoomSettings';
export declare abstract class ProjectSettingsBase {
    information: informationType;
    language: Value<Language>;
    units: Value<LinearUnits>;
    angularUnits: Value<AngularUnits>;
    snapSensitivity: Value<inches>;
    version: number;
    itemNumber: number;
    wallNumber: number;
    projectAttributes: ProjectAttributes;
    materials: Materials;
    roomSettings: RoomSettings;
    abstract coreMode: CoreMode;
    abstract serialize(): IProjectSettings;
    constructor(core: CoreDesigner, projectSettingsDB: IProjectSettings);
    protected serializeBase(): IProjectSettingsShared;
}
