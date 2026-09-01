import type { ICatalogClassifications } from '../declarations';
type Classifications = ICatalogClassifications['classifications'];
/** Label → matching category IDs (case-insensitive). */
export declare const findClassificationIdsByLabel: (classifications: Classifications, label: string) => string[];
/** Build a parent → children lookup map from flat categories. O(n) once. */
export declare const buildChildrenMap: (classifications: Classifications) => Map<string, string[]>;
/** BFS from rootIds using a pre-built children map. Returns all descendant IDs (including roots). */
export declare const getDescendantIds: (rootIds: string[], childrenOf: Map<string, string[]>) => string[];
export {};
