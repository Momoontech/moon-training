import { Direction } from '../../declarations/ProjectSettings.js';

/**
 * Folds a globally chosen `Direction` against per-side disabled flags
 * and returns the EFFECTIVE direction the badge should highlight.
 *
 * Rule: if the global side is disabled but the opposite side is free,
 * auto-switch to the opposite. Otherwise keep the global value
 * unchanged. When both sides are disabled, the global value is returned
 * as-is — there is nothing to commit, and the consumer is expected to
 * render the input read-only.
 *
 * Pure / allocation-free / deterministic — safe inside any computed.
 */
const applyDirectionLockOverride = (global, isCWDisabled, isCCWDisabled) => {
    if (global === Direction.CW && isCWDisabled && !isCCWDisabled)
        return Direction.CCW;
    if (global === Direction.CCW && isCCWDisabled && !isCWDisabled)
        return Direction.CW;
    return global;
};

export { applyDirectionLockOverride };
