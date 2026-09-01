import { getMonitor } from '../../helpers/monitor.js';
import { evaluateToken } from './evaluateToken.js';

/**
 * Function to evaluate an interpreted value array and return the computed result.
 * @param arr - The interpreted value array to evaluate.
 * @param core - The CoreDesigner instance.
 * @param options - Additional options for evaluation.
 * @returns The computed result of the interpreted value.
 */
const calculateArray = (arr, core, options) => {
    const evaluatedParts = arr.map((item, i) => {
        try {
            // Sub-expression element: an array whose items are themselves InterpretedLines.
            // Evaluate it recursively and JSON-encode so the outer `new Function` round-trip
            // reconstructs the array value (e.g. [[projectSetting]] → array of points).
            if (Array.isArray(item)) {
                const subResult = calculateArray(item, core, options);
                if (options.debug) {
                    console.log(`Sub-expression ${i} evaluated to:`, subResult);
                }
                return JSON.stringify(subResult);
            }
            const val = evaluateToken(item, { core, options });
            if (options.debug) {
                console.log(`Token ${i} (${item.type} ${item.value}) evaluated to:`, val);
            }
            // Serialization logic for eval
            if (item.type === 'operator')
                return val;
            if (item.type === 'constant')
                return val;
            // If a string is returned (not an operator or constant) — escape it
            if (typeof val === 'string')
                return JSON.stringify(val);
            // If an object is returned — escape it
            if (typeof val === 'object') {
                if (options.debug) {
                    getMonitor().warn(`[Calc Warning] Token ${item.type} returned an object:`, val);
                }
                return JSON.stringify(val);
            }
            return val;
        }
        catch (e) {
            getMonitor().error(`Error calculating token ${i} (${item.type})`, e instanceof Error ? e : null, { arr });
            return 0;
        }
    });
    const expression = evaluatedParts.join(' ');
    if (options.debug) {
        console.log('Expr:', expression);
    }
    try {
        const r = new Function(`return ${expression};`)();
        if (options.debug) {
            console.log('Result:', r);
        }
        return r;
    }
    catch (e) {
        getMonitor().error('Math evaluation error', e instanceof Error ? e : null, { expression });
        return null;
    }
};

export { calculateArray };
