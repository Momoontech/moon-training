import { getMonitor } from '../helpers/monitor.js';

class CoreStorage {
    hash = {
        wallsPath: [],
        models: {}
    };
    get(key) {
        return this.hash[key];
    }
    set(key, value) {
        this.hash[key] = value;
    }
    dispose() {
        this.hash = {};
        getMonitor().debug('UtilitiesStorage disposed');
    }
}

export { CoreStorage };
