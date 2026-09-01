const magnitude = (x, y, z, w) => Math.sqrt(x * x + y * y + z * z + w * w);
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
const scoreOptionAgainstTarget = (profile, target) => {
    const pMag = magnitude(profile.multiClosetShelfPart, profile.multiClosetShortHangerPart, profile.multiClosetLongHangerPart, profile.multiClosetDrawerPart);
    const tMag = magnitude(target.multiClosetShelfPart, target.multiClosetShortHangerPart, target.multiClosetLongHangerPart, target.multiClosetDrawerPart);
    const ps = pMag > 0 ? profile.multiClosetShelfPart / pMag : 0;
    const psh = pMag > 0 ? profile.multiClosetShortHangerPart / pMag : 0;
    const plh = pMag > 0 ? profile.multiClosetLongHangerPart / pMag : 0;
    const pd = pMag > 0 ? profile.multiClosetDrawerPart / pMag : 0;
    const ts = tMag > 0 ? target.multiClosetShelfPart / tMag : 0;
    const tsh = tMag > 0 ? target.multiClosetShortHangerPart / tMag : 0;
    const tlh = tMag > 0 ? target.multiClosetLongHangerPart / tMag : 0;
    const td = tMag > 0 ? target.multiClosetDrawerPart / tMag : 0;
    return magnitude(ps - ts, psh - tsh, plh - tlh, pd - td);
};

export { scoreOptionAgainstTarget };
