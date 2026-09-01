/**
 * Rule: sections wider than the standard width are "slightly more expensive".
 * Lets the count step prefer fewer-but-wider sections only when that actually
 * reduces component count.
 */
const isWideCostly = (width, config) => width > config.widths.standard;

export { isWideCostly };
