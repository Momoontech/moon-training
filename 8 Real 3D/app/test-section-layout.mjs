// Regression test for per-section Layout drag-and-drop (main.js's
// window.applyClosetSectionLayout / dropLayoutOnSection, wired from
// index.html's Customize > Hardware > Layouts drag cards).
//
// Drives the real engine call directly (applyClosetSectionLayout(index,
// desired), which is exactly what dropLayoutOnSection runs after resolving
// a screen point to a section index) rather than simulating mouse pixels -
// the raycast-to-section geometry is a separate, much simpler code path.
// This is the level the commit that shipped this feature (a02ade2) says it
// verified manually ("dropping on section 0 changes only that section...");
// this script makes that check repeatable instead of one-off.
//
// Usage: cd "8 Real 3D/app" && npm run build && node test-section-layout.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const server = createServer(async (req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(5175, r));

const browser = await chromium.launch({
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,UseSkiaRenderer', '--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage();
const consoleErrors = [];
page.on('pageerror', (err) => consoleErrors.push(`[pageerror] ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[console:error] ${msg.text()}`); });

await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Exposes a countByCategory(sectionIndex) helper on window for this test's
// own use, walking the real node graph the same way this session's
// probe-sections.mjs discovered it: closet.sections -> section.content
// (Part multiClosetSectionContent) -> .children (Carcass) -> .children
// (BoxContainer) -> .children (Part) -> .content (FreeBoxContainer) -> .bays
// (the stack Parts, each carrying multiClosetComponentType on ITS OWN child).
const setup = await page.evaluate(() => {
  const core = window.__core;
  const g = (v) => (v && v.get ? v.get() : v);
  let closetId = null, bestLen = -1;
  for (const [id, node] of core.nodes) {
    const raw = node.sections && g(node.sections);
    if (Array.isArray(raw) && raw.length > bestLen) { bestLen = raw.length; closetId = id; }
  }
  window.__closetId = closetId;
  window.__countByCategory = function (sectionIndex) {
    const closet = core.nodes.get(closetId);
    const sectionIds = g(closet.sections);
    const sectionId = sectionIds[sectionIndex];
    const counts = {};
    function walk(id, depth) {
      if (depth > 8) return;
      const n = core.nodes.get(id);
      if (!n) return;
      const t = g(n.multiClosetComponentType);
      if (t) counts[t] = (counts[t] || 0) + 1;
      for (const key of ['children', 'content', 'interiorComponents', 'exteriorComponents', 'bays']) {
        const raw = g(n[key]);
        if (Array.isArray(raw)) for (const kid of raw) walk(kid, depth + 1);
      }
    }
    walk(sectionId, 0);
    return counts;
  };
  return { closetId, sectionCount: bestLen };
});

console.log('Closet found:', setup.closetId, '| sections:', setup.sectionCount);
if (setup.sectionCount < 2) {
  console.log('FAIL: expected at least 2 sections to test cross-section isolation, found', setup.sectionCount);
  await browser.close(); server.close(); process.exit(1);
}

async function counts(i) { return page.evaluate((i) => window.__countByCategory(i), i); }
async function apply(i, desired) { return page.evaluate(([i, desired]) => window.applyClosetSectionLayout(i, desired), [i, desired]); }

let failed = false;
function expect(cond, msg) {
  console.log((cond ? 'PASS' : 'FAIL') + ': ' + msg);
  if (!cond) failed = true;
}

const before0 = await counts(0);
const before1 = await counts(1);
console.log('Before — section 0:', JSON.stringify(before0), '| section 1:', JSON.stringify(before1));

// Drop "Long Hang" onto section 0 — mirrors CLOSET_LAYOUT_3D.longHung in index.html.
const r1 = await apply(0, { multiClosetLongHangerPart: 5 });
expect(r1 === true, 'applyClosetSectionLayout(0, longHung) returned true');
const after0a = await counts(0);
const after1a = await counts(1);
expect((after0a.multiClosetLongHangerPart || 0) > 0, 'section 0 now has long hanger parts');
expect(!after0a.multiClosetDrawerPart && !after0a.multiClosetShelfPart, 'section 0 no longer has its original drawer/shelf parts');
expect(JSON.stringify(after1a) === JSON.stringify(before1), 'section 1 untouched by a change to section 0');

// Drop "Shelves Stack" onto section 1 — mirrors CLOSET_LAYOUT_3D.shelvesStack.
const r2 = await apply(1, { multiClosetShelfPart: 6 });
expect(r2 === true, 'applyClosetSectionLayout(1, shelvesStack) returned true');
const after0b = await counts(0);
const after1b = await counts(1);
expect(JSON.stringify(after0b) === JSON.stringify(after0a), "section 0's earlier change survives a change to section 1");
expect((after1b.multiClosetShelfPart || 0) > 0, 'section 1 now has shelf parts');
expect(!after1b.multiClosetShortHangerPart && !after1b.multiClosetLongHangerPart, 'section 1 no longer has its original hanger parts');

// The README's own "Known gaps" section documents exactly 2 cosmetic 404s
// on load (a missing texture/model asset) that don't block rendering -
// pre-existing and unrelated to this feature. Anything beyond that baseline
// is new and worth failing on.
const KNOWN_BASELINE_404_COUNT = 2;
const unexpectedErrors = consoleErrors.filter((e) => !e.includes('404'));
expect(unexpectedErrors.length === 0, `no unexpected console/page errors (saw ${unexpectedErrors.length})`);
expect(consoleErrors.length <= KNOWN_BASELINE_404_COUNT, `404 count (${consoleErrors.length}) within the known baseline (${KNOWN_BASELINE_404_COUNT}) - see 8 Real 3D/README.md "Known gaps"`);
if (unexpectedErrors.length) console.log(unexpectedErrors.join('\n'));

console.log(failed ? '\n=== OVERALL: FAIL ===' : '\n=== OVERALL: PASS ===');
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
