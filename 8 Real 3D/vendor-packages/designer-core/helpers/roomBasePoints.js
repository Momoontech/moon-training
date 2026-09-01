import { CeilingType } from '../declarations/SurfaceSettings.js';

/** Fallback span for a base wall whose length is not resolvable yet. */
const FALLBACK_LENGTH = 100;
/** The three knots a fresh profile starts from: left end, peak, right end. */
const seedPoints = (length, roomHeight) => [
    { x: 0, y: roomHeight },
    { x: (length || FALLBACK_LENGTH) / 2, y: roomHeight * 1.5 },
    { x: length || FALLBACK_LENGTH, y: roomHeight }
];
/**
 * The base-wall profile a room should hold for its ceiling type. Sloped carries its two
 * ends; cathedral and other keep every edited knot, with only the far end re-anchored to
 * the base wall's length; any other ceiling carries no profile.
 */
const nextRoomBasePoints = (ceilingType, existing, length, roomHeight) => {
    if (ceilingType === CeilingType.Sloped) {
        return [
            { x: 0, y: existing[0]?.y || roomHeight },
            { x: length || FALLBACK_LENGTH, y: existing[1]?.y || roomHeight + 20 }
        ];
    }
    if (ceilingType === CeilingType.Cathedral) {
        if (existing.length < 3)
            return seedPoints(length, roomHeight);
        return [...existing.slice(0, -1), { x: length, y: roomHeight }];
    }
    // A free-form profile is the one place a knot's own height always survives — including
    // the far end's, which only has its position pinned to the wall.
    if (ceilingType === CeilingType.Other) {
        if (existing.length < 3)
            return seedPoints(length, roomHeight);
        const last = existing[existing.length - 1];
        return [...existing.slice(0, -1), { x: length, y: last?.y ?? roomHeight }];
    }
    return [];
};

export { nextRoomBasePoints };
