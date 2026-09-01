import { MultiClosetStackNumbers, SectionContentProfile } from '../types';
/** Target emphasis vector — same shape as a desire/profile triple. */
export type CategoryVector = MultiClosetStackNumbers;
/**
 * Closest-fit distance metric — the single knob that defines "closest match".
 *
 * Both the option's profile and the target emphasis are L2-normalized so only
 * the *direction* (relative mix of shelves/hangers/drawers) matters, not the
 * absolute counts; the result is the Euclidean distance between the unit
 * vectors (0 = identical mix, larger = worse). A profile with no descriptive
 * attributes yet (all zeros) normalizes to the zero vector and scores a
 * constant distance of 1 against any unit target, so selection stays
 * deterministic until the attributes are filled in.
 */
export declare const scoreOptionAgainstTarget: (profile: SectionContentProfile, target: CategoryVector) => number;
export default scoreOptionAgainstTarget;
