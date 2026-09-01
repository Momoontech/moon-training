/**
 * `Part.toJSON()` — the multiCloset discriminator contract.
 *
 * The two category fields are the only ones on `Part` whose ABSENCE is meaningful, which makes
 * their serialization asymmetric with `isAutoSized` / `separatorType`:
 *
 *   - they must be EMITTED when present, or the reloaded part loses its category and its layout
 *     effect (the behavioural half of this is covered in
 *     `helpers/multiCloset/stackLayoutEffects.test.ts`);
 *   - they must be ABSENT — not `undefined` — when the part has none, because the constructor
 *     turns a present-but-undefined key into the DEFAULT category. An ordinary part would come
 *     back claiming to be a shelves stack, and `isMultiClosetShelfBoard` would then treat its
 *     children as shelf boards.
 *
 * Hence the `in`-based assertions below rather than `toBeUndefined()`: the two express different
 * things here, and only one of them is correct.
 */
export {};
