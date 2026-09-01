import { UUID } from './core';
import { GeneralViewMode } from './CoreDesigner';
import { NodeConfig } from './Node';
export type AppData = {
    floorplan: UUID;
    perspectiveCamera: IPerspectiveCamera;
    orthoCamera: IOrthoCamera;
    floorplanCamera: IOrthoCamera;
    controls: IOrbitControls;
    orthoMode: boolean;
    floorplanMode: boolean;
    floorplanModeParams: {
        instruments: {
            mergeCorners: {
                enabled: boolean;
            };
            deleteObject: {
                enabled: boolean;
            };
        };
        currentStage: UUID;
    };
    objects3D: IObjects;
    objectsCalc: IObjects;
    selectedObject: UUID | null;
    selectedSystem: UUID | null;
};
export interface IObjects {
    [key: UUID]: NodeConfig;
}
export type IOrbitControls = {
    minDistance: number;
    maxDistance: number;
    target: IVector3;
};
export type IControls = Record<GeneralViewMode, IOrbitControls>;
type IVector3 = {
    x: number;
    y: number;
    z: number;
};
export interface IOrthoCamera extends INamed, IWithMatrix {
    left: number;
    right: number;
    top: number;
    bottom: number;
    zoom: number;
    far: number;
    near: number;
}
export interface IPerspectiveCamera extends INamed, IWithMatrix {
    aspect: number;
    fov: number;
    zoom: number;
    far: number;
    near: number;
}
interface INamed {
    name: string;
}
interface IWithMatrix {
    matrix: IMatrix4;
}
export type IMatrix4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
export {};
