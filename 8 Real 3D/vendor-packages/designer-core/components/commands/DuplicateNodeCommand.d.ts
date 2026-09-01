import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties';
import { Command } from './core/Command';
/** Optional explicit destination for the clone (parent + slot + index). */
export type DuplicateNodeTarget = {
    parentId: UUID;
    childProperty: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number];
    insertIndex?: number;
};
export declare class DuplicateNodeCommand implements Command {
    private readonly nodeId;
    private readonly target?;
    duplicatedRootId: UUID | null;
    private clone;
    /**
     * @param nodeId source subtree to clone.
     * @param target optional explicit destination. When omitted, the clone lands next to
     *   the source (same parent/slot; `index + 1` for ordered slots, appended otherwise).
     */
    constructor(nodeId: UUID, target?: DuplicateNodeTarget | undefined);
    execute(core: CoreDesigner): boolean;
    /** Resolves the destination and snapshots the source subtree under fresh ids. First execute only. */
    private buildClone;
    undo(core: CoreDesigner): boolean;
}
