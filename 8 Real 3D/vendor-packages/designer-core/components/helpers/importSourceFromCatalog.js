import { calculateArray } from '../Value/calculateArray.js';
import { importFromCatalog } from './importFromCatalog.js';
import { isInterpretedValue } from './isInterpretedValue.js';
import { isCatalogPath } from './isCatalogPath.js';

function importSourceFromCatalog(core, c, options) {
    let config = JSON.parse(JSON.stringify(c));
    if (!('source' in config)) {
        return config;
    }
    const temp = { ...config };
    Reflect.deleteProperty(temp, 'source');
    if ('source' in config) {
        if (typeof config.source === 'string') {
            const obj = importFromCatalog(core, config.source);
            if ('source' in obj) {
                config = { ...importSourceFromCatalog(core, obj, options), ...temp };
            }
            else {
                config = { ...obj, ...temp };
            }
            return config;
        }
        else if (isInterpretedValue(config.source)) {
            const calcSource = calculateArray(config.source, core, options);
            // Reflect.apply(calculateValue, Storage.get('viewer').floorplan, [
            //   parseValue(config.source)
            // ]) as string;
            const obj = importFromCatalog(core, calcSource);
            if ('source' in obj) {
                config = { ...importSourceFromCatalog(core, obj, options), ...temp };
            }
            else {
                config = { ...obj, ...temp };
            }
            return config;
        }
        else if (Array.isArray(config.source)) {
            let acc = {};
            for (let i = 0; i < config.source.length; i += 1) {
                let currentSource = '';
                const prev = { ...acc };
                if (typeof config.source[i] === 'string') {
                    currentSource = config.source[i];
                }
                else {
                    const value = config.source[i];
                    if (isInterpretedValue(value)) {
                        currentSource = calculateArray(value, core, options);
                    }
                    else if (isCatalogPath(value)) {
                        const imported = importSourceFromCatalog(core, importFromCatalog(core, value), options);
                        if (isInterpretedValue(imported)) {
                            currentSource = calculateArray(imported, core, options);
                        }
                        else if (typeof imported === 'object') {
                            currentSource = value;
                        }
                        else {
                            currentSource = imported;
                        }
                    }
                    else {
                        currentSource = value;
                    }
                    // currentSource = calculateValue(config.source[i], core, options);
                    // Reflect.apply(calculateValue, Storage.get('viewer').floorplan, [
                    //   parseValue(config.source[i])
                    // ]) as string;
                }
                const obj = importFromCatalog(core, currentSource);
                if ('source' in obj) {
                    acc = { ...prev, ...importSourceFromCatalog(core, obj, options) };
                }
                else {
                    acc = { ...prev, ...obj };
                }
            }
            config = { ...acc, ...temp };
            return config;
        }
    }
    return config;
}

export { importSourceFromCatalog };
