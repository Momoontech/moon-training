/**
 * Factory for a real `CoreDesigner` instance with sensible test defaults.
 *
 * Every constructor slot has a default coming from `coreInputs.ts`,
 * `materials.ts`, or `nodes.ts`. Tests pass overrides only when they need a
 * different shape (Tier 3 bespoke setup).
 *
 * Usage:
 *   const core = createMockCore();                 // canonical defaults
 *   const core = createMockCore({ nodes: [...] }); // override one slot
 */
import type { AppData } from '../../declarations/appData';
import type { ICatalog, ICatalogClassifications } from '../../declarations/Catalogs';
import { CoreMode } from '../../declarations/CoreDesigner';
import type { NodeConfig } from '../../declarations/Node';
import type { IAreaHeader, IPaperSpaceState } from '../../declarations/PaperSpace';
import type { IProjectSettings } from '../../declarations/ProjectSettings';
import type { SystemsAPI } from '../../declarations/systems';
import { CoreDesigner } from '../../designer-core';
import type { CapturedRoom } from '../../helpers/converter/roomplan/types';
export interface TestCoreOpts {
    appData?: AppData;
    looksAPI?: unknown;
    materialsAPI?: unknown;
    projectSettings?: IProjectSettings;
    models3DAPI?: unknown;
    catalogClassifications?: ICatalogClassifications;
    privateCatalog?: ICatalog;
    masterCatalog?: ICatalog;
    paperSpace?: IPaperSpaceState;
    areaHeader?: IAreaHeader;
    roomplanData?: CapturedRoom | null;
    systemData?: SystemsAPI;
    coreMode?: CoreMode;
    id?: string;
    domElement?: HTMLDivElement;
    nodes?: NodeConfig[];
}
export declare const createMockCore: (opts?: TestCoreOpts) => CoreDesigner;
