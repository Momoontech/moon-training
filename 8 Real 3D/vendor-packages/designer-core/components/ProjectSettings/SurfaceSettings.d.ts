import { BaseboardSettings, CeilingSettings, DecoMoldingSettings, FlooringSettings, MoldingSettings, RoomSurfaceSettings } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import SetValueCommand from '../commands/SetValueCommand';
import Value, { ValueOptionsType } from '../Value';
export type SurfaceFlatField = {
    id: string;
    value: unknown;
    group: string;
};
export declare class SurfaceSettings {
    readonly flooring: Value<FlooringSettings>;
    readonly molding: Value<MoldingSettings>;
    readonly decoMolding: Value<DecoMoldingSettings>;
    readonly baseboard: Value<BaseboardSettings>;
    readonly ceiling: Value<CeilingSettings>;
    constructor(core: CoreDesigner, data: RoomSurfaceSettings, valueOptions?: ValueOptionsType);
    /** setField('flooring', 'enabled', true) */
    setField<G extends keyof RoomSurfaceSettings, K extends keyof RoomSurfaceSettings[G]>(group: G, key: K, val: RoomSurfaceSettings[G][K]): SetValueCommand<RoomSurfaceSettings[G]>;
    /** Get a value by dot-path, e.g. 'flooring.enabled' or 'ceiling.finishedHeight' */
    getByPath(path: string): unknown;
    /** Set a value by dot-path, e.g. 'flooring.enabled' or 'ceiling.finishedHeight' */
    setByPath(path: string, val: unknown): SetValueCommand<unknown>;
    toJSON(): RoomSurfaceSettings;
    /** Flattens toJSON() into [{ id: 'flooring.enabled', value: true, group: 'flooring' }, ...] */
    toFlatItems(): SurfaceFlatField[];
    /** Flat key-value lookup: { 'flooring.enabled': true, 'molding.height': 0, ... } */
    toFlatValues(): Record<string, unknown>;
}
