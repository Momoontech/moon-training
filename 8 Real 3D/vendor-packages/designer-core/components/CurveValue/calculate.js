import { getMonitor } from '../../helpers/monitor.js';
import { importFromCatalog } from '../helpers/importFromCatalog.js';

const calculateCurve = (value, core) => {
    if (typeof value === 'string') {
        // `importFromCatalog` throws on any unresolvable path. This runs inside
        // `CurveValue`'s `computed()`, where a throw re-throws on every read and
        // permanently breaks any effect subscribed to it — so a missing entry degrades
        // to an empty curve (`InterpretedCurve` is an `InterpretedCurvePoint[]`),
        // mirroring `calculateShape`'s empty-shape fallback.
        try {
            return importFromCatalog(core, value);
        }
        catch (error) {
            getMonitor().warn('calculateCurve: catalog resolution failed, returning empty curve as fallback.', value, error);
            return [];
        }
    }
    else {
        return value;
    }
};

export { calculateCurve as default };
