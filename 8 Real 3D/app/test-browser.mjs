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
await new Promise((r) => server.listen(5173, r));
console.log('serving dist/ on :5173');

const browser = await chromium.launch({
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,UseSkiaRenderer', '--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage();
const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[console:${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const statusText = await page.locator('#status').textContent();
console.log('--- #status content ---');
console.log(statusText);

const canvasInfo = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll('canvas')];
  return canvases.map((c) => ({
    width: c.width,
    height: c.height,
    contextTypes: ['webgpu', 'webgl2', 'webgl'].filter((t) => { try { return !!c.getContext(t); } catch { return false; } })
  }));
});
console.log('--- canvases found ---');
console.log(JSON.stringify(canvasInfo, null, 2));

console.log('--- console/page messages ---');
console.log(consoleMsgs.slice(0, 60).join('\n'));

await page.screenshot({ path: 'screenshot.png' });
console.log('screenshot saved to screenshot.png');

await browser.close();
server.close();
