# Your Closet — Real 3D

A genuine Three.js/WebGPU render of the actual Sales Designer App engine
(`@moon/designer-core` + `@moon/designer3d`, compiled from the real
`moon-designer` repo), embedded into the training app's Your Closet tab via
an iframe pointing at `app/dist/index.html`.

This is a real, fixed demo — one sample room, one sample closet system,
built once and displayed the same way every time. It is not wired to a
backend and does not save changes; it exists to show trainees what the real
app's 3D closet actually looks like and how it's actually assembled (real
catalog data, real section-planning algorithm), not an illustration.

## Layout

- `vendor-packages/` — the real engine, compiled from `moon-designer`'s
  source (`designer-core`, `designer3d`, `vesta-converter`). Not on public
  npm; vendored here as local `file:` dependencies since Vercel only serves
  this repo statically and never builds this sub-app itself.
- `app/` — a small Vite project that boots the engine with real project
  data and places a real `MultiCloset` system into it. **Vite is a local
  build tool only** — the deployed site serves the already-built `app/dist/`
  directly, so `app/dist/` must be committed and kept in sync with `src/`.

## Rebuilding after a change to `app/src/main.js` (or the vendored engine)

```
cd "8 Real 3D/app"
npm install        # first time only, or after package.json changes
npm run build       # writes app/dist/ - commit this
node test-browser.mjs   # optional smoke test: boots dist/ in a real
                         # (Playwright) Chromium and reports console errors
```

## Known gaps

- Two console 404s on load (a missing texture/model asset) — cosmetic,
  doesn't block rendering.
- Camera uses the engine's default framing, not a shot custom-aimed at the
  closet.
- The existing 2D "Customize" swatches (materials/colors) don't affect this
  3D view — they're independent systems today.
- Fixed sample room/system only; not per-user, not persisted.
