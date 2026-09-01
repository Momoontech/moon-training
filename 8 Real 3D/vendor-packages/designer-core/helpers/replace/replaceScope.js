import { resolveCatalogConfig } from '../../components/helpers/resolveCatalogConfig.js';
import { resolveCatalogPreview } from '../../components/helpers/resolveCatalogPreview.js';
import getItem from '../../components/Node/helpers/getItem.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
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
import { findClassificationIdsByLabel } from '../catalogClassifications.js';
import getPropertyValue from '../getPropertyValue.js';
import { canReplaceSectionContent, canReplaceItem } from './canReplace.js';

/** Catalog classification holding the section-content presets (Double Hung, Long Hung, Shelves, …). */
const SECTION_CONTENT_CLASSIFICATION = 'Contents';
/** The path a section's CONTENT was built from, or `null` for an empty section / no `catalogPath`. */
const getSectionContentCatalogPath = (core, nodeId) => {
    const section = getOptionalNode(core, nodeId);
    if (section?.type !== NodeType.Part)
        return null;
    const content = getOptionalNode(core, section.content.get()[0]);
    if (content?.type !== NodeType.Part)
        return null;
    const path = getPropertyValue(content, 'catalogPath');
    return typeof path === 'string' && path ? path : null;
};
/**
 * The FAMILY `bucketId` belongs to, not the bucket itself, so a single door can become a sliding one.
 * Never climbs into a ROOT: that would merge `Doors` with `Windows` under `Architecture`.
 */
const scopeClassificationId = (classifications, bucketId) => {
    const parentId = classifications[bucketId]?.parent;
    if (!parentId)
        return bucketId;
    return classifications[parentId]?.parent ? parentId : bucketId;
};
/**
 * The classification + path a placed product was built from, located by NAME (`catalogPath` is seeded
 * on `Part`, not `Item`) via `resolveCatalogPreview` — the resolver a picker's TILES render from.
 */
const getItemCatalogEntry = (core, nodeId) => {
    const name = getPropertyValue(getItem(core, nodeId), 'name');
    if (typeof name !== 'string' || !name)
        return null;
    const { classifications, items } = core.storage.get('catalogClassifications');
    for (const [bucketId, paths] of Object.entries(items ?? {})) {
        if (!classifications?.[bucketId])
            continue;
        for (const path of paths) {
            if (resolveCatalogPreview(core, path).name !== name)
                continue;
            const classificationId = scopeClassificationId(classifications, bucketId);
            return { classification: classifications[classificationId].label, classificationId, currentPath: path };
        }
    }
    return null;
};
/**
 * Can `catalogPath` stand in for `nodeId` — today the MOUNT, matched as a FULL SET: a candidate must
 * declare exactly the selection's `mountTypes`, so a `['wall']` upper is never offered for a base.
 */
const isCompatibleReplacement = (core, nodeId, catalogPath) => {
    const node = getOptionalNode(core, nodeId);
    const mountTypes = node && 'mountTypes' in node ? node.mountTypes.get() : [];
    // A selection declaring no mount has nothing to match against, so nothing is filtered out.
    if (mountTypes.length === 0)
        return true;
    // `resolveCatalogConfig` catches its own errors, so an unresolvable path arrives as `null` rather
    // than throwing — it leaves the candidate set empty, which the size check below refuses.
    const config = resolveCatalogConfig(core, catalogPath);
    const candidateMountTypes = config && 'mountTypes' in config ? (config.mountTypes ?? []) : [];
    // Set equality, so a repeated mount (`['wall','wall']`) still matches `['wall']`. An empty
    // candidate falls out for free: sizes differ, the selection being non-empty by here.
    const selected = new Set(mountTypes);
    const candidate = new Set(candidateMountTypes);
    return selected.size === candidate.size && [...candidate].every((mount) => selected.has(mount));
};
/**
 * The picker's scope for `nodeId`, or `null` when it has nothing to offer — a SECTION gets the content
 * presets, a product ITEM its own category. Mirrors `applyReplaceNode`'s branches, so they can't drift.
 */
const getReplaceScope = (core, nodeId) => {
    if (canReplaceSectionContent(core, nodeId)) {
        const { classifications } = core.storage.get('catalogClassifications');
        return {
            classification: SECTION_CONTENT_CLASSIFICATION,
            classificationId: findClassificationIdsByLabel(classifications ?? {}, SECTION_CONTENT_CLASSIFICATION)[0] ?? '',
            currentPath: getSectionContentCatalogPath(core, nodeId)
        };
    }
    return canReplaceItem(core, nodeId) ? getItemCatalogEntry(core, nodeId) : null;
};

export { SECTION_CONTENT_CLASSIFICATION, getItemCatalogEntry, getReplaceScope, getSectionContentCatalogPath, isCompatibleReplacement };
