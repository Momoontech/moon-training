/**
 * Rule: minimum number of sections = ceil(width / widest preferred width).
 * e.g. 105" / 42" = 2.5 -> 3 sections. Always at least 1.
 */
export declare const getMinSectionCount: (availableWidth: number, targetWidth: number) => number;
export default getMinSectionCount;
