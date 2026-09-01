/**
 * Replace — swapping a placed thing for another catalog preset: `canReplace` (the gates),
 * `replaceScope` (what a picker may offer), `replaceNode` (the swap). All three dispatch off the same
 * per-kind predicates, so a new kind is one gate plus one branch in each of the others.
 */
export * from './canReplace';
export * from './replaceScope';
export * from './replaceNode';
