/**
 * Rule: minimum number of sections = ceil(width / widest preferred width).
 * e.g. 105" / 42" = 2.5 -> 3 sections. Always at least 1.
 */
const getMinSectionCount = (availableWidth, targetWidth) => {
    if (targetWidth <= 0)
        return 1;
    return Math.max(1, Math.ceil(availableWidth / targetWidth));
};

export { getMinSectionCount };
