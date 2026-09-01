import type { UUID } from './core';
export declare enum CeilingType {
    Flat = "flat",
    Sloped = "sloped",
    Cathedral = "cathedral",
    Other = "other"
}
export type FlooringSettings = {
    enabled: boolean;
    materialId: string;
    patternId: string;
    colorId: string;
};
export type MoldingSettings = {
    enabled: boolean;
    height: number;
};
export type DecoMoldingSettings = {
    enabled: boolean;
    stayInPlace: boolean;
    height: number;
    depth: number;
};
export type BaseboardSettings = {
    enabled: boolean;
    stayInPlace: boolean;
    height: number;
    depth: number;
    notchingNeeded: boolean;
    notchDepth: number;
};
export type CeilingSettings = {
    type: CeilingType;
    baseWallId: UUID | null;
    points: {
        x: number;
        y: number;
    }[];
};
export type RoomSurfaceSettings = {
    flooring: FlooringSettings;
    molding: MoldingSettings;
    decoMolding: DecoMoldingSettings;
    baseboard: BaseboardSettings;
    ceiling: CeilingSettings;
};
export declare const getDefaultSurfaceSettings: () => RoomSurfaceSettings;
