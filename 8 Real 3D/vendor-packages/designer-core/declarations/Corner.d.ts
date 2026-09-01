import { IAttributes } from './Attributes';
import { UUID } from './core';
import { NodeSharedConfig } from './Node';
export type CornerConfig = NodeSharedConfig & {
    type: 'Corner';
    parent: UUID;
    children: UUID[];
    position: {
        x: number;
        y: number;
    };
    attributes: IAttributes;
};
