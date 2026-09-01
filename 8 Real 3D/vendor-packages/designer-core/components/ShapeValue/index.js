import { signal, computed } from '@preact/signals-react';
import { calculateShape } from './calculate.js';

class ShapeValue {
    options;
    s;
    c;
    constructor(initialValue, core, options) {
        this.options = options;
        this.s = signal(initialValue);
        this.c = computed(() => calculateShape(this.s.value, core, options));
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

export { ShapeValue as default };
