import { getMonitor } from '../../../helpers/monitor.js';
import CoreSignal from '../../CoreSignal/index.js';

class MaterialsSets {
    core;
    setsIds;
    sets = new Map();
    constructor(core, materialsSetsDB) {
        this.core = core;
        try {
            this.setsIds = new CoreSignal([]);
            for (const id in materialsSetsDB) {
                const value = materialsSetsDB[id];
                const wrappedSet = {
                    body: core.createValue(value.body),
                    door: core.createValue(value.door),
                    doorGrain: {
                        label: core.createValue(value.doorGrain.label),
                        value: core.createValue(value.doorGrain.value)
                    },
                    doorsAndDrawersConfiguration: core.createValue(value.doorsAndDrawersConfiguration),
                    drawerGrain: {
                        label: core.createValue(value.drawerGrain.label),
                        value: core.createValue(value.drawerGrain.value)
                    },
                    finishEndGrain: {
                        label: core.createValue(value.finishEndGrain.label),
                        value: core.createValue(value.finishEndGrain.value)
                    },
                    finishEnd: core.createValue(value.finishEnd),
                    // bottomFinishEnd: string;
                    melamineBox: core.createValue(value.melamineBox),
                    melamineBoxEdgebanding: core.createValue(value.melamineBoxEdgebanding),
                    finishEndsConfiguration: core.createValue(value.finishEndsConfiguration),
                    edgebanding: core.createValue(value.edgebanding),
                    bodyEdgebanding: core.createValue(value.bodyEdgebanding),
                    doorEdgebanding: core.createValue(value.doorEdgebanding),
                    finishEndEdgebanding: core.createValue(value.finishEndEdgebanding),
                    topValanceEdgebanding: core.createValue(value.topValanceEdgebanding),
                    bottomValanceEdgebanding: core.createValue(value.bottomValanceEdgebanding),
                    fillerEdgebanding: core.createValue(value.fillerEdgebanding),
                    visibleCarcassEdgebanding: core.createValue(value.visibleCarcassEdgebanding),
                    filler: core.createValue(value.filler),
                    toeKick: core.createValue(value.toeKick),
                    topValance: core.createValue(value.topValance),
                    bottomValance: core.createValue(value.bottomValance),
                    visiblePanel: core.createValue(value.visiblePanel),
                    visibleCarcass: core.createValue(value.visibleCarcass),
                    name: core.createValue(value.name)
                };
                this.add(id, wrappedSet);
            }
        }
        catch (error) {
            getMonitor().error(error instanceof Error ? error.message : String(error), error instanceof Error ? error : null);
        }
    }
    get(id) {
        return this.sets.get(id);
    }
    getSetsIds() {
        return this.setsIds.get();
    }
    add(id, value) {
        this.sets.set(id, value);
        this.setsIds.set([...this.setsIds.get(), id]);
    }
    delete(id) {
        this.sets.delete(id);
        this.setsIds.set(this.setsIds.get().filter((setId) => setId !== id));
    }
    serialize() {
        const result = {};
        for (const id of this.getSetsIds()) {
            const set = this.get(id);
            if (!set)
                continue;
            result[id] = {
                body: set.body.getSignal(),
                door: set.door.getSignal(),
                doorGrain: { label: set.doorGrain.label.getSignal(), value: set.doorGrain.value.getSignal() },
                doorsAndDrawersConfiguration: set.doorsAndDrawersConfiguration.getSignal(),
                drawerGrain: { label: set.drawerGrain.label.getSignal(), value: set.drawerGrain.value.getSignal() },
                finishEndGrain: { label: set.finishEndGrain.label.getSignal(), value: set.finishEndGrain.value.getSignal() },
                finishEnd: set.finishEnd.getSignal(),
                melamineBox: set.melamineBox.getSignal(),
                melamineBoxEdgebanding: set.melamineBoxEdgebanding.getSignal(),
                finishEndsConfiguration: set.finishEndsConfiguration.getSignal(),
                edgebanding: set.edgebanding.getSignal(),
                bodyEdgebanding: set.bodyEdgebanding.getSignal(),
                doorEdgebanding: set.doorEdgebanding.getSignal(),
                finishEndEdgebanding: set.finishEndEdgebanding.getSignal(),
                topValanceEdgebanding: set.topValanceEdgebanding.getSignal(),
                bottomValanceEdgebanding: set.bottomValanceEdgebanding.getSignal(),
                fillerEdgebanding: set.fillerEdgebanding.getSignal(),
                visibleCarcassEdgebanding: set.visibleCarcassEdgebanding.getSignal(),
                filler: set.filler.getSignal(),
                toeKick: set.toeKick.getSignal(),
                topValance: set.topValance.getSignal(),
                bottomValance: set.bottomValance.getSignal(),
                visiblePanel: set.visiblePanel.getSignal(),
                visibleCarcass: set.visibleCarcass.getSignal(),
                name: set.name.getSignal()
            };
        }
        return result;
    }
    cloneMaterialSet(id) {
        const set = this.get(id);
        if (!set) {
            throw new Error(`Material set with id ${id} not found`);
        }
        return {
            body: this.core.createValue(set.body.getSignal()),
            door: this.core.createValue(set.door.getSignal()),
            doorGrain: {
                label: this.core.createValue(set.doorGrain.label.getSignal()),
                value: this.core.createValue(set.doorGrain.value.getSignal())
            },
            doorsAndDrawersConfiguration: this.core.createValue(set.doorsAndDrawersConfiguration.getSignal()),
            drawerGrain: {
                label: this.core.createValue(set.drawerGrain.label.getSignal()),
                value: this.core.createValue(set.drawerGrain.value.getSignal())
            },
            finishEndGrain: {
                label: this.core.createValue(set.finishEndGrain.label.getSignal()),
                value: this.core.createValue(set.finishEndGrain.value.getSignal())
            },
            finishEnd: this.core.createValue(set.finishEnd.getSignal()),
            melamineBox: this.core.createValue(set.melamineBox.getSignal()),
            melamineBoxEdgebanding: this.core.createValue(set.melamineBoxEdgebanding.getSignal()),
            finishEndsConfiguration: this.core.createValue(set.finishEndsConfiguration.getSignal()),
            edgebanding: this.core.createValue(set.edgebanding.getSignal()),
            bodyEdgebanding: this.core.createValue(set.bodyEdgebanding.getSignal()),
            doorEdgebanding: this.core.createValue(set.doorEdgebanding.getSignal()),
            finishEndEdgebanding: this.core.createValue(set.finishEndEdgebanding.getSignal()),
            topValanceEdgebanding: this.core.createValue(set.topValanceEdgebanding.getSignal()),
            bottomValanceEdgebanding: this.core.createValue(set.bottomValanceEdgebanding.getSignal()),
            fillerEdgebanding: this.core.createValue(set.fillerEdgebanding.getSignal()),
            visibleCarcassEdgebanding: this.core.createValue(set.visibleCarcassEdgebanding.getSignal()),
            filler: this.core.createValue(set.filler.getSignal()),
            toeKick: this.core.createValue(set.toeKick.getSignal()),
            topValance: this.core.createValue(set.topValance.getSignal()),
            bottomValance: this.core.createValue(set.bottomValance.getSignal()),
            visiblePanel: this.core.createValue(set.visiblePanel.getSignal()),
            visibleCarcass: this.core.createValue(set.visibleCarcass.getSignal()),
            name: this.core.createValue(set.name.getSignal())
        };
    }
}

export { MaterialsSets };
