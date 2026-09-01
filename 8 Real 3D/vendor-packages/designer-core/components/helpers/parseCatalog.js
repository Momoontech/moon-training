import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import { NodeType } from '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { calculateValue } from '../Value/calculate.js';
import { importFromCatalog } from './importFromCatalog.js';
import { importSourceFromCatalog } from './importSourceFromCatalog.js';
import { isInterpretedValue } from './isInterpretedValue.js';

const parseCatalog = (core, catalogInput, parentId, nodeId) => {
    let catalog = catalogInput;
    while (isInterpretedValue(catalog) || typeof catalog === 'string') {
        if (isInterpretedValue(catalog)) {
            // formula results link to child - resolves according to parentNode which is always created before child
            catalog = calculateValue(catalog, core, { nodeId: parentId });
        }
        // `typeof catalog` (the resolved value), not `catalogInput`: checking the
        // original argument spun this loop forever when a formula resolved to a path.
        if (typeof catalog === 'string') {
            // link to catalog object - should be resolved from catalog
            catalog = importFromCatalog(core, catalog);
        }
    }
    // resolve catalog from sequence of sources
    const resolvedCatalog = importSourceFromCatalog(core, catalog, { nodeId: parentId });
    if ('attributes' in resolvedCatalog && resolvedCatalog.attributes) {
        if (Array.isArray(resolvedCatalog.attributes)) {
            let result = {};
            for (let i = 0; i < resolvedCatalog.attributes.length; i += 1) {
                const attribute = resolvedCatalog.attributes[i];
                if (typeof attribute === 'string') {
                    result = { ...result, ...importFromCatalog(core, attribute) };
                }
                else if (typeof attribute === 'object') {
                    result = { ...result, ...attribute };
                }
            }
            resolvedCatalog.attributes = result;
        }
    }
    // move carcass interiors, exterios catalog properties to carcass child box containers components
    if (resolvedCatalog.type === NodeType.Carcass) {
        resolvedCatalog.children = resolvedCatalog.children.map((child) => parseCatalog(core, child, nodeId, ''));
        const containerCatalogs = resolvedCatalog.children.filter((child) => child.type === NodeType.BoxContainer);
        for (let i = 0; i < Math.max(resolvedCatalog.interiors.length, resolvedCatalog.exteriors.length); i += 1) {
            if (containerCatalogs[i]) {
                const interior = resolvedCatalog.interiors[i];
                if (interior) {
                    const partArrayCatalog = parseCatalog(core, interior, nodeId, '');
                    if (partArrayCatalog && containerCatalogs[i]) {
                        insertPartArrayCatalogIntoContainerCatalog('interior', partArrayCatalog, containerCatalogs[i]);
                    }
                }
                const exterior = resolvedCatalog.exteriors[i];
                if (exterior) {
                    const partArrayCatalog = parseCatalog(core, exterior, nodeId, '');
                    if (partArrayCatalog && containerCatalogs[i]) {
                        insertPartArrayCatalogIntoContainerCatalog('exterior', partArrayCatalog, containerCatalogs[i]);
                    }
                }
            }
        }
    }
    return resolvedCatalog;
};
const insertPartArrayCatalogIntoContainerCatalog = (type, partArrayCatalog, containerCatalog) => {
    containerCatalog[`${type}Components`] = partArrayCatalog.parts;
    containerCatalog[`${type}Layout`] = partArrayCatalog.layout;
    if (partArrayCatalog.contentName) {
        containerCatalog[`${type}ContentName`] = partArrayCatalog.contentName;
    }
};

export { parseCatalog as default };
