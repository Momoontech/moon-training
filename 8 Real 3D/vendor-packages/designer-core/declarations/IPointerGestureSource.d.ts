import type CoreSignal from '../components/CoreSignal';
/**
 * Observe-only view of a `CoreSignal`: `get` (tracked) and `peek` (untracked)
 * are exposed, but `set` is not — consumers can react to the value, never
 * mutate it. Keeps the gesture latch authoritative inside its owner.
 */
export type ReadonlySignal<T> = Pick<CoreSignal<T>, 'get' | 'peek'>;
/**
 * Sealed contract for the designer-wide pointer-gesture source.
 *
 * `CoreHandlers` (the single owner of `window`/`document` pointer state)
 * `implements` this, so the compiler enforces that every member is provided.
 * Consumers in other packages (`@moon/designer-ui`, `@moon/designer3d`) type
 * against THIS interface, not against the concrete `CoreHandlers`, so they can
 * only consume the defined surface — lifecycle members (`attach`/`dispose`)
 * stay private to the owner. The contract is open for new implementations
 * (a future web variant, a test double) and closed against ad-hoc behaviour.
 */
export interface IPointerGestureSource {
    /** Live count of touch pointers currently down (pull). Capped at 2. */
    readonly count: number;
    /**
     * Latched "this gesture became multi-touch" flag (push). Flips to `true`
     * the instant a second touch pointer goes down anywhere in the designer
     * subtree, and back to `false` only when every finger has lifted. Exposed
     * as a read-only signal view so consumers can both `peek()` it synchronously
     * (entry guard) and react to it via signal effects (mid-gesture abort) —
     * the latter is what catches a delayed second finger while the first is
     * stationary and therefore emitting no `pointermove`.
     */
    readonly gestureWasMulti: ReadonlySignal<boolean>;
    /**
     * Subscribe to pinch-zoom factor notifications (`current / previous`
     * finger-pair distance; `> 1` = spreading/zoom-in, `< 1` = closing).
     * Returns an unsubscribe function.
     */
    onPinch(callback: (factor: number) => void): () => void;
    /**
     * Subscribe to gesture-reset notifications — fired when the owner drops all
     * live gesture state (foreground loss: app switch, Control Center,
     * navigation). Lets canvas-side trackers clear their own pointer sets
     * without listening to `window`/`document` themselves. Returns an
     * unsubscribe function.
     */
    onReset(callback: () => void): () => void;
}
