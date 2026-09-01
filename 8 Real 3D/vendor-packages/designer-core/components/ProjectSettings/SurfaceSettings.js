import SetValueCommand from '../commands/SetValueCommand.js';

const VALID_GROUPS = new Set([
    'flooring', 'molding', 'decoMolding', 'baseboard', 'ceiling'
]);
class SurfaceSettings {
    flooring;
    molding;
    decoMolding;
    baseboard;
    ceiling;
    constructor(core, data, valueOptions) {
        this.flooring = core.createValue(data.flooring, valueOptions);
        this.molding = core.createValue(data.molding, valueOptions);
        this.decoMolding = core.createValue(data.decoMolding, valueOptions);
        this.baseboard = core.createValue(data.baseboard, valueOptions);
        this.ceiling = core.createValue(data.ceiling, valueOptions);
    }
    /** setField('flooring', 'enabled', true) */
    setField(group, key, val) {
        const target = this[group];
        return new SetValueCommand(target, { ...target.get(), [key]: val });
    }
    /** Get a value by dot-path, e.g. 'flooring.enabled' or 'ceiling.finishedHeight' */
    getByPath(path) {
        const parts = path.split('.');
        if (parts.length !== 2) {
            throw new Error(`Invalid surface settings path: "${path}" (expected 2 segments)`);
        }
        const [groupName, key] = parts;
        if (!VALID_GROUPS.has(groupName)) {
            throw new Error(`Unknown surface settings group: "${groupName}"`);
        }
        const data = this[groupName].get();
        return data[key];
    }
    /** Set a value by dot-path, e.g. 'flooring.enabled' or 'ceiling.finishedHeight' */
    setByPath(path, val) {
        const parts = path.split('.');
        if (parts.length !== 2) {
            throw new Error(`Invalid surface settings path: "${path}" (expected 2 segments)`);
        }
        if (!VALID_GROUPS.has(parts[0])) {
            throw new Error(`Unknown surface settings group: "${parts[0]}"`);
        }
        return this.setField(parts[0], parts[1], val);
    }
    toJSON() {
        return {
            flooring: this.flooring.get(),
            molding: this.molding.get(),
            decoMolding: this.decoMolding.get(),
            baseboard: this.baseboard.get(),
            ceiling: this.ceiling.get()
        };
    }
    /** Flattens toJSON() into [{ id: 'flooring.enabled', value: true, group: 'flooring' }, ...] */
    toFlatItems() {
        const data = this.toJSON();
        const items = [];
        for (const [group, groupData] of Object.entries(data)) {
            for (const [key, value] of Object.entries(groupData)) {
                items.push({ id: `${group}.${key}`, value, group });
            }
        }
        return items;
    }
    /** Flat key-value lookup: { 'flooring.enabled': true, 'molding.height': 0, ... } */
    toFlatValues() {
        const result = {};
        for (const { id, value } of this.toFlatItems()) {
            result[id] = value;
        }
        return result;
    }
}

export { SurfaceSettings };
