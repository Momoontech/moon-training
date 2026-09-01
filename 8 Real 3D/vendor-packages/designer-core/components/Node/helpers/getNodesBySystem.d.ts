import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
/**
 * Return the ids of every multiCloset Item assigned to the given system.
 *
 * Only multiCloset Items carry a `system` reference, so the result is the set
 * of closets that make up the system. Returns an empty array when no closet is
 * assigned to the given system.
 *
 * Pair with {@link getSystemById} to resolve a node id into its system first.
 */
declare const getNodesBySystem: (core: CoreDesigner, systemId: UUID) => UUID[];
export default getNodesBySystem;
