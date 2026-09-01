import { CoreDesigner } from '../../../';
/** How a command participates in undo history; `TransactionManager` routes on it. */
export declare enum HistoryBehavior {
    /** A real document edit — anchors its own undo step. The default. */
    Edit = "edit",
    /** Selection / view-mode change — folds into the previous edit. */
    Fold = "fold"
}
export interface Command {
    execute: (core: CoreDesigner) => boolean;
    undo: (core: CoreDesigner) => boolean;
    /** Undo-history role. Absent ⇒ {@link HistoryBehavior.Edit}. */
    readonly historyBehavior?: HistoryBehavior;
}
