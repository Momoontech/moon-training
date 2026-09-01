import { ReadonlySignal } from '@preact/signals-react';
import { NodeType, UUID } from '../../../../declarations';
import { RoomType } from '../../../../declarations/helpers';
import { RoomConfig } from '../../../../declarations/Room';
import { CoreDesigner, NodeEffect } from '../../../../designer-core';
import { CathedralContext } from '../../../../helpers/cathedral/computeCathedralContext';
import Value from '../../../Value';
import { BaseNode } from '../../BaseNode';
export declare class Room extends BaseNode<RoomConfig, NodeType.Room> {
    readonly type: NodeType.Room;
    readonly floor2D: Value<UUID>;
    readonly ceiling2D: Value<UUID>;
    readonly path: Value<UUID[]>;
    readonly holes: Value<UUID[][]>;
    readonly children: Value<UUID[]>;
    readonly roomType: Value<RoomType>;
    readonly reachInClosetId?: Value<UUID | null>;
    /**
     * Memoized cathedral-ceiling derivation. Re-evaluated automatically when any
     * `.get()` it performs (room attributes, segment endpoints, point positions,
     * etc.) changes. Consumed by both Wall2D and Ceiling2D rendering effects so
     * they share a single source of truth.
     */
    readonly cathedralContext: ReadonlySignal<CathedralContext>;
    effects: NodeEffect[];
    readonly disposeEffects: () => void;
    constructor(config: RoomConfig, core: CoreDesigner);
    dispose(): void;
    toJSON(): RoomConfig;
}
