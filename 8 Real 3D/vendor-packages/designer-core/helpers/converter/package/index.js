import { getMonitor } from '../../monitor.js';

class Converter {
    static convert(data, toVersion) {
        let converted = data;
        const fromVersion = data.projectSettings.version || Converter.INITIAL_VERSION;
        if (fromVersion === toVersion) {
            console.debug(`no conversion needed from ${fromVersion} to ${toVersion} : `, data, converted);
            return converted;
        }
        if (fromVersion < Converter.INITIAL_VERSION) {
            throw new Error(`fromVersion ${fromVersion} is not supported`);
        }
        if (fromVersion < toVersion) {
            converted = Converter[`${fromVersion}To${toVersion}`](converted);
        }
        else {
            const message = `Area with version ${fromVersion} cannot be opened in app version${toVersion}. Please contact your app administrator`;
            getMonitor().error(message);
        }
        return converted;
    }
    static convertToCurrentVersion(data) {
        return Converter.convert(data, Converter.CURRENT_VERSION);
    }
    static '2000To2001'(data) {
        console.log('2000To2001', data);
        data.projectSettings.version = 2001;
        return data;
    }
    static CURRENT_VERSION = 2001;
    static INITIAL_VERSION = 2000;
}

export { Converter };
