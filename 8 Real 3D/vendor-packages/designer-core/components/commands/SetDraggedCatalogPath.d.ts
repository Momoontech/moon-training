import { CatalogConfig } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetDraggedCatalogPathCommand extends FoldableSignalCommand<CatalogConfig | null> {
    constructor(newValue: CatalogConfig | null);
}
