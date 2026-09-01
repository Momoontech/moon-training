import { Wrapped } from '..';
import { CoreDesigner } from '../../../';
import { materialsSets, materialsSetAPI, UUID, GrainDirectionLabel } from '../../../declarations';
import Value from '../../Value';
export type LabelAndValue<T> = {
    label: GrainDirectionLabel;
    value: T;
};
export type materialsSet = {
    body: Value<UUID>;
    door: Value<UUID>;
    doorGrain: Wrapped<LabelAndValue<number>>;
    doorsAndDrawersConfiguration: Value<string>;
    drawerGrain: Wrapped<LabelAndValue<number>>;
    finishEndGrain: Wrapped<LabelAndValue<number>>;
    finishEnd: Value<UUID>;
    melamineBox: Value<UUID>;
    melamineBoxEdgebanding: Value<UUID>;
    finishEndsConfiguration: Value<string>;
    edgebanding: Value<UUID>;
    bodyEdgebanding: Value<UUID>;
    doorEdgebanding: Value<UUID>;
    finishEndEdgebanding: Value<UUID>;
    topValanceEdgebanding: Value<UUID>;
    bottomValanceEdgebanding: Value<UUID>;
    fillerEdgebanding: Value<UUID>;
    visibleCarcassEdgebanding: Value<UUID>;
    filler: Value<UUID>;
    toeKick: Value<UUID>;
    topValance: Value<UUID>;
    bottomValance: Value<UUID>;
    visiblePanel: Value<UUID>;
    visibleCarcass: Value<UUID>;
    name: Value<string>;
};
export declare class MaterialsSets {
    private readonly core;
    private setsIds;
    private sets;
    constructor(core: CoreDesigner, materialsSetsDB: materialsSets);
    get(id: UUID): materialsSet | undefined;
    getSetsIds(): UUID[];
    add(id: UUID, value: materialsSet): void;
    delete(id: UUID): void;
    serialize(): Record<UUID, materialsSetAPI>;
    cloneMaterialSet(id: UUID): materialsSet | undefined;
}
