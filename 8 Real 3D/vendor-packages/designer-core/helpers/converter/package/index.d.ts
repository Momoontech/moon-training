import { AllData } from '..';
import { CoreStorage } from '../../../storage';
/**
 * Minimal core surface the legacy converters touch — just the `storage` cache
 * (materials + master/private catalogs). The converters resolve only string
 * catalog `source` paths during a version migration (never formula sources —
 * those would need scene nodes / project settings that don't exist yet), so a
 * bare storage object is sufficient and no live `CoreDesigner` is required.
 *
 * This is what lets `convertProjectData` run at the app data boundary, before
 * any core exists, keeping the dependency one-directional (converter → core).
 */
export type ConverterContext = {
    storage: CoreStorage;
};
declare class Converter {
    static convert(data: AllData, toVersion: number): AllData;
    static convertToCurrentVersion(data: AllData): AllData;
    static '2000To2001'(data: AllData): AllData;
    static readonly CURRENT_VERSION = 2001;
    static readonly INITIAL_VERSION = 2000;
}
export { Converter };
