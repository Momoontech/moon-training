/** How a command participates in undo history; `TransactionManager` routes on it. */
var HistoryBehavior;
(function (HistoryBehavior) {
    /** A real document edit — anchors its own undo step. The default. */
    HistoryBehavior["Edit"] = "edit";
    /** Selection / view-mode change — folds into the previous edit. */
    HistoryBehavior["Fold"] = "fold";
})(HistoryBehavior || (HistoryBehavior = {}));

export { HistoryBehavior };
