import { signal, computed } from '@preact/signals-react';
import calculateCurve from './calculate.js';

class CurveValue {
    options;
    s;
    c;
    constructor(initialValue, core, options) {
        this.options = options;
        this.s = signal(initialValue);
        this.c = computed(() => calculateCurve(this.s.value, core));
    }
    getOptions() {
        return this.options;
    }
    get() {
        return this.c.value;
    }
    getSignal() {
        return this.s.value;
    }
    set(value) {
        this.s.value = value;
    }
}

export { CurveValue as default };
