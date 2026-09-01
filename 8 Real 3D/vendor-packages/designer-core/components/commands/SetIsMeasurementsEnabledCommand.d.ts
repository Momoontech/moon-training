import { FoldableSignalCommand } from './SetCoreSignalCommand';
/**
 * Toggles the global "show dimension badges" switch on the core.
 *
 * Consumers (designer-ui) read `core.isMeasurementsEnabled` at the
 * overlay-host level and short-circuit the dimension subtrees when it is
 * false — see `FloorPlanUI/index.tsx`, `Editor2DUI/index.tsx`,
 * `Editor3DUI/index.tsx`. Boolean signal mirrors the pattern of
 * `SetCornerOrthoSnapCommand` (also a boolean toggle command via
 * `SetCoreSignalCommand`).
 *
 * History-eligible by default — the user explicitly flips the toolbar
 * toggle, undo should restore the previous visibility state. Callers
 * that want a non-history flip (e.g. wiring a temporary preview) can
 * still pass it through `runCommandsAsTransaction(_, '', false)`.
 */
export default class SetIsMeasurementsEnabledCommand extends FoldableSignalCommand<boolean> {
    constructor(newValue: boolean);
}
