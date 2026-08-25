# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An internal training program for Moon's new closet-design app ("Sales Designer App"), piloted with the first 5 designers (CBD & Closet World) before scaling to ~72 franchises. Plan: hand the materials to the pilot cohort, gather qualitative feedback on what they actually use, refine, then scale.

## Where things live

- **Local folder (source of truth):** `/Users/mo/Training Materials`
- **Live site (dashboard is the landing page):** https://moon-training.vercel.app
- **GitHub repo:** `Momoontech/moon-training` (public, branch `main`)
- **Vercel project:** `moon-training` under team `mo-5802's projects` (Hobby). Static site, framework preset "Other". Auto-deploys on push to `main`.

```
index.html                         # dashboard hub (landing page) - gamification + nav to everything below
moon-logo.png                      # circular Moon logo, also the "moon rock" currency icon
blob-truth/                        # real Sales Designer App catalog item images (local copies, ~23MB) - the durable
                                    # source for MOON_CATALOG.appCatalog `image` fields; falls back to the app's own
                                    # (dev-environment) hosted blob URLs only for the few items with no local copy
1 Decks/Day1_Deck.html             # Day 1 slide deck (approved, images embedded as base64)
1 Decks/Day2_Deck.html             # Day 2 slide deck
1 Decks/Day1_Presentation_Content.md  # slide-by-slide content for design (internal, NOT deployed)
1 Decks/Day 1 Slide Pictures/      # source images (NOT deployed; deck embeds its own copies)
2 Handouts & Guide/Interactive_Designer_Guide.html
2 Handouts & Guide/Handout_App_Flow_Quick_Reference.html   # exists but removed from dashboard nav
2 Handouts & Guide/Handout_Gestures_Cheat_Sheet.html       # exists but removed from dashboard nav
3 Quizzes/index.html + Quiz_1_Setup_and_Measure.html + Quiz_2_Design_and_Present.html + Quiz_3_Final.html
4 Day 2 Activities/Client_Cards_Checklist.html + Tournament_Voting.html
5 Planning/  (internal, NOT deployed): Training_Materials_Overview.html, App_Training_Presentation_Framework.md, Training_Dashboard_Refinement_Plan.md, SoCal_Closets_Configurator_Catalog_Oct2025.pdf, app-catalog-private.json (real Sales Designer App catalog export - product IDs/names/hosted thumbnail images, digested into catalog-data.js's `appCatalog`)
6 Daily Challenge/Daily_Challenge_Concept.html
6 Daily Challenge/challenge-chrome.js   # shared app chrome (topbar/toolbar/floor plan/panel shell/win feedback) - see note below
6 Daily Challenge/challenge-chrome.css  # shared app chrome CSS - loaded alongside challenge-chrome.js
catalog-data.js                    # MOON_CATALOG - shared source-of-truth data (real components/materials/pricing tiers/business rules), digested from the PDF above
```

Deployed to Vercel: everything EXCEPT `5 Planning/`, `1 Decks/Day1_Presentation_Content.md`, and `1 Decks/Day 1 Slide Pictures/`.

## Commands

There is no build step, package manager, linter, or test runner in this repo - every page is a self-contained HTML file (inline CSS/JS, Google Fonts via `<link>`). "Development" is edit-the-HTML-directly.

**Deploy** (Git-connected to Vercel; pushing to `main` auto-deploys):
```
git add -A && git commit -m "..." && git push
```

**Verify a change** (browser `file://` preview is blocked in this environment):
- JS correctness: load the file through **jsdom** (`runScripts: "dangerously"`), simulate clicks, assert on DOM state. Watch for thrown `errors`.
- Visual check: render HTML to PDF with **weasyprint**, then PDF to PNG with **pdftoppm**, and read the PNG. Known render-tool limits (not real bugs): weasyprint doesn't support `backdrop-filter` (glass panels look flat) or `aspect-ratio` (force an explicit height for the render), and shows emoji as tofu boxes.

## Architecture

**No shared code between files - each HTML file is fully standalone**, with two deliberate exceptions:
1. `catalog-data.js` (`MOON_CATALOG`) - the real Closet World component/pricing catalog digested into curated categories, materials, price tiers, and business rules. Shared (`<script src="catalog-data.js">` in `index.html`, `require()`'d by `api/_lib/shop.js`) because duplicating a catalog that size per-file would defeat the point of having one source of truth.
2. `6 Daily Challenge/challenge-chrome.js` + `challenge-chrome.css` - the app chrome (topbar, view tabs, bottom toolbar, floor plan, side-panel shell, win/wrong feedback) that every Daily Challenge task renders inside of, matched exactly against the real Sales Designer App's Figma file (node IDs cited in challenge-chrome.css's header comment). This became a shared file after the three tasks in `Daily_Challenge_Concept.html` visibly drifted from each other (only one task got rebuilt against the real Figma nodes at first) - with Mo's plan to build hundreds more challenges, hand-copying this chrome per-file is exactly how "does it look like the real app" silently stops being true for some of them. **Every new Daily Challenge file must load both files** (`<link rel="stylesheet" href="challenge-chrome.css">` + `<script src="challenge-chrome.js">`) and build task content with `measureTopbar()`/`measureViewTabs()`/`measureToolbar()`/`roomSVG()`/`bottombar()`/`chromeToast()`/`chromeWrong()`/`chromeWinToast()`/`wireChromeControls()` rather than reimplementing any of it. If the real app's chrome changes, update these two files once - never patch chrome inside an individual challenge file.

Everything else is zero `.js` files and zero `<script src=...>`. Every page reimplements its own inline `<script>` logic and its own `:root` CSS variables. This is a deliberate tradeoff for zero-build-step, file-portable pages, but it means:
- Fixing a bug or changing a design token in one file (e.g. the quiz scoring logic, or the primary purple) does **not** propagate anywhere else - each of the 3 quiz files, for example, carries a byte-identical copy of the same 5 scoring functions (`shuffle`/`prep`/`start`/`render`/`results`/`confetti`); only the `QUIZ` question-bank array and title differ between them.
- Design tokens have already drifted: `index.html` and the app-mock surfaces use primary purple `#7239EA`, but `3 Quizzes/index.html` independently defines `#6C5CE7`. Don't assume one file's `:root` vars match another's - check the specific file.
- `2 Handouts & Guide/Interactive_Designer_Guide.html` hardcodes absolute links out to a *different* deployed quiz site (`quizzes-pied-two.vercel.app`) rather than relative paths to `3 Quizzes/` in this repo - a real cross-deployment coupling point to be aware of if either site's URL changes.

### `index.html` - the dashboard hub

Tabs: Dashboard, Daily Puzzles, Quizzes, Trainings, Leaderboard, Shop, Videos, Guides (client-side show/hide via `data-sec`, no routing/framework). No sidebar - matches the Figma "07 User Auth + Dashboard" page.

All gamification state lives in one `localStorage` key `moonTrainingV1` = `{tokens, streak, visits, last, claimed, owned, triviaWeek}`, read/written by `loadS()`/`saveS()`. Key functions/data to know before editing:
- `stage()` = `min(9, visits-1)` drives everything closet-related (0-9).
- `closetSVG(s)` procedurally draws the 10-stage closet as inline SVG (helper functions `shirt()`, `dress()`, `rodRow()`, `stack()`, `drawer()`, `shoe()`, `monster()`, `crumple()` compose the scene by stage threshold, e.g. `s>=3` adds shelving, `s>=8` adds the second hang section + shoes). `STAGES[]` holds the mood copy per stage; `REWARDS[]` holds the daily-login-popup copy/icon per day.
- `earn(eid, amt)` credits moon rocks once per `data-eid`/`data-earn` element (any element with `data-eid` anywhere in the DOM auto-earns on click via a single delegated listener) - `updateEarnBadges()` marks already-claimed badges.
- `refreshAll()` is the central re-render call (closet, leaderboard, shop, earn badges) - call it after any state mutation.
- `openReward(day)` / `closeReward()` drive the daily login popup (auto-opens on load and after "Simulate next day").
- `PEOPLE[]` (leaderboard/"Everyone's work") and `SHOP[]` (8 items, buy/own) are hardcoded mock arrays - no backend.
- `weeklySet()`/`weekNo()` pick 5 questions from the hardcoded `POOL[]` deterministically by ISO week number, so trivia rotates weekly without a server.
- **Dev controls** on the closet card - "Simulate next day", "+10 rocks", "-10 rocks", "Reset" (`simBtn`/`addRocks`/`subRocks`/`resetBtn`) - are wired directly in the markup and MUST be removed/hidden before wider release (kept for internal demos).

### Decks (`1 Decks/`)

Paginated slide decks, not scrolling pages: `<section class="slide">` elements toggle an `active` class via a `show(k)` function; a `#progress` bar and `#count` (`i / n`) track position. Navigation: prev/next buttons plus keyboard (arrows, PageUp/PageDown, Space, Home, End). A `fit()` function scales a fixed 1280x720 `#frame` canvas to the viewport, re-run on resize. Font is **DM Sans** (not Manrope/Inter - decks aren't mocking app UI). Day 1's images are embedded as base64 data URIs (hence its 3.1MB size vs Day 2's 281KB, which has far fewer embedded images) - both decks use the same slide/nav mechanism, Day 2 is just shorter.

### Quizzes (`3 Quizzes/`)

`3 Quizzes/index.html` is a static landing page (three links, no JS/state). Each `Quiz_N_*.html` is independent: question bank is a hardcoded `var QUIZ=[{q, opts, a, exp}, ...]` array (see "no shared code" above for the duplication caveat). Mechanics: shuffles question order and per-question option order each run, tracks score/streak (streak resets on a wrong answer), progress bar, confetti animation on a perfect score. Font is Manrope, matching the hub.

### App-mock surfaces (Guide, Daily Challenge)

`2 Handouts & Guide/Interactive_Designer_Guide.html` and `6 Daily Challenge/Daily_Challenge_Concept.html` mock the real app's UI (Manrope font - see note below, gray walls `#6E6E7A`, purple `#7239EA` dimension pills, gold rods/accents) rather than the training-hub look.
- The Guide drives a step list (`STEPS[]` → `show(i)`) plus small looping inline-SVG gesture demos (`DEMOS` object, single `requestAnimationFrame` loop guarded so it no-ops on absent elements), an interactive draggable floor-plan sandbox with wall-snapping (`proj`/`snapDoor`), and a canned FAQ chat widget that keyword-matches a local `KB` array (`match()`) - no real LLM call.
- Daily Challenge builds mocked app screens per task (`buildMeasure`/`buildObstacles`/`buildSection`-style functions keyed off a `P[]` task array of `{screen, lvl, prompt, hint, exp}`) on top of the shared `challenge-chrome.js`/`.css` (see the "no shared code" exceptions above) and wires up its own pointer-drag-and-snap logic per task type - it does not share code with the Guide's sandbox despite similar drag-to-target mechanics. The whole screen is the puzzle (no branded header, no separate task/result cards) - a slim `.taskstrip` carries the prompt/hint/streak, and winning a task flashes the solved element green + a moon-rocks banner, then auto-advances - no "Nailed it" explanation card to click through.

### Day 2 Activities (`4 Day 2 Activities/`)

Standalone worksheet-style tools (DM Sans, `#6C5CE7`/`#1A1A2E` palette - not the app-mock or hub palette). `Client_Cards_Checklist.html` has a hardcoded `cards[]` of 10 client profiles driving a per-client ordered checklist (`buildSteps`) with a locked "Wants" section until "Needs" are done. `Tournament_Voting.html` is a live tally tool: editable candidate list, `votes[category][name]` counters, computes per-category and overall winners (tiebreak by total votes).

## Conventions

- **No em dashes anywhere** in any file. Use hyphens or rephrase.
- **Fonts:** hub, quizzes, and Day 2 activities/decks generally use Manrope or DM Sans. App-mock surfaces were previously believed to use Inter "to match the real app," but every real Figma pull this session (Options panel, Catalog panel, Room Settings panel) specifies Manrope, not Inter - that assumption was wrong. `Daily_Challenge_Concept.html` has been corrected to Manrope; `Interactive_Designer_Guide.html` has NOT been updated yet and still uses Inter.
- **Design system (canonical):** primary purple `#7239EA`, deep plum `#3E2472`/`#4A2596`, ink `#211C33`, green `#12B886`. App-mock screens: gray walls `#6E6E7A`, purple dimension pills, gold rods. (Note the quiz landing page drift documented above - flag it if asked to unify.)
- **Hub look:** glassy - frosted translucent panels (`backdrop-filter: blur`), soft colored gradient background.
- **Currency:** "moon rocks" (never "tokens" in UI text, though the internal localStorage field is still named `tokens`). Icon = `moon-logo.png`. Shop items must NOT be Moon-branded.
- **Everything is self-contained single-file HTML.** Folders with spaces work on Vercel via `%20` URL encoding.

## Tickets

- **PTP-202** Day 1 & 2 decks (approved).
- **PTP-204** Interactive Navigation Guide (built; GIFs still pending).
- **PTP-228** Quizzes (3, reviewed with Nazeli, live).
- **PTP-247** Create Training homepage and host it (done: dashboard hub + Vercel).
- **PTP-249** Refinement/release plan for the dashboard sections (see `5 Planning/Training_Dashboard_Refinement_Plan.md`).
- **MD-311** Claude skill for making presentations (design team, Deia/Heather). Day 1 Google Slides deck content placement was reviewed and approved. Exploring (a) generating decks as HTML via Claude, and (b) a self-serve branded "slides platform" where the team edits text/adds slides directly without prompting AI each time.

## Open items / next work

- Hide the closet dev buttons (see above) before sharing widely.
- Access/privacy: site is public. Options = Vercel password (needs Pro) or Moon SSO (engineering). Not yet decided.
- Guide: add the GIFs Mo is recording.
- Videos tab: record and add real how-to clips (currently "coming soon" placeholders).
- Leaderboard + Shop: real shared data needs a backend; currently mock/local.
- Day 1 deck review (MD-311) content-placement issues to relay to design: slide 11 missing "Catalog", slide 12 missing "Accessorize" as its own item, slide 2 has 2 empty card slots, slide 15 has 2 empty slots + no real QR, slide 3 has an added "one in forty orders reworked" stat to confirm. (Mo is approving on placement; these are the notes.)
- Day 2 presentation content doc not yet made (Day 1 exists).
- **Reconcile the uploaded `index_1 (1).html` (1.35MB, likely images embedded)** against the current `index.html` (58KB) - decide which is canonical before further hub edits.
- HTML deck sample + self-serve slides-platform prototype (MD-311 exploration).
- Earlier undefined asks to clarify with Mo: "fix the first page and the new box"; optional calendar reminders.

## Phase 2 roadmap (next, to build in VS Code)

Heather created a refined hub design (`index_1 (1).html`, ~1.35MB) that matches the real app better. **Keep this overall design as the base** and make `index.html` from it. It is the same structure/sections as the current hub, cleaner, Manrope, still localStorage-only, still has the dev buttons and some emojis. Reconcile it in as the canonical hub before Phase 2 work.

Four workstreams Mo wants (in rough priority):

1. **Limit emojis, use a real icon set.** The hub leans on emojis (mood faces on the closet, currency, chips, shop items, reward icons). Swap these for Moon's icon set (Heather/design has icons to use). Keep the moon-rock currency as the `moon-logo.png` mark. Keep the overall look.
2. **Auth0 login + per-user tracking. ARCHITECTURE SHIFT.** Today all state is per-browser `localStorage` (`moonTrainingV1`) with mock leaderboard/shop. To log people in by email (Auth0) and track each individual's moon rocks, streak, closet level, achievements, and purchases, the hub needs to stop being a static file and become an app with a backend + database:
   - Auth0: tenant + application (SPA or Next.js), email login for the cohort.
   - Backend/DB: store per-user state server-side (Supabase/Postgres or similar) via an authenticated API. Move `loadS()/saveS()` off localStorage onto API calls. The leaderboard then becomes real (query all users by rocks).
   - Hosting: move from static Vercel to a framework (Next.js on Vercel is the natural fit; keeps the same URL).
   - Then "test the moon rock system" = verify earn/spend/streak persist per user across devices.
3. **Lyssna integration.** Lyssna (usability-testing / user-research platform) for testing the training with the designers. Clarify what "integrate" means: embed a Lyssna study/test inside the hub, link out to a study, or pull results. Lyssna's public API is limited; embedding a study link is likely the pragmatic first step.
4. **Tighten the design.** General polish pass on Heather's design once the above are in.

### Open questions to answer before/while building Phase 2
- Which icon set (Moon's own vs a library like Lucide/Phosphor)? Get the assets from design.
- Auth0: is there a Moon Auth0 tenant already, or do we create one? Which login (email link, Google Workspace, password)? Who administers it?
- Backend/DB choice and who owns it (Supabase is fastest for a prototype; or Moon's own infra per the earlier eng discussion with John/Aren/Nazeli).
- Does per-user tracking need to be real for the first-5 test, or is local fine for the pilot and real tracking is v2?
- Lyssna: exact integration goal + do we have API access / an account.
- This all pushes the project from "static HTML in a repo" toward "small web app," which lines up with the earlier plan to eventually fold training into Moon's own app/infra. Confirm we are building a standalone app vs handing specs to engineering.

## Tone / working style

Mo prefers concise, direct output and rapid build-then-iterate. Keep changes verified before presenting. Match the real app UI closely (reference the Figma "Design Handoff" file, pages: Navigation, 06 3D Clean Up, 03 Design + Present, 07 User Auth + Dashboard).
