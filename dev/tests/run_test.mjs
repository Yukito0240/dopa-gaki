// run_test.mjs: index.html?test=1 をヘッドレスChromeで実行し自己テスト結果とスクリーンショットを出力
// 使い方: node tests/run_test.mjs [--shots]   ※ three / @dimforge/rapier3d-compat / playwright を NODE_PATH の node_modules に用意
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NM = process.env.NM || join(ROOT, 'node_modules');
const require = createRequire(join(NM, 'x.js'));
const { chromium } = require('playwright');
const CDN = { 'three.module.js': join(NM, 'three/build/three.module.js'), 'rapier.es.js': join(NM, '@dimforge/rapier3d-compat/rapier.es.js') };
const SHOTS = process.argv.includes('--shots');
// 静的サーバ
const srv = createServer((q, r) => { const f = join(ROOT, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'application/javascript' }); r.end(readFileSync(f)); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/google/chrome/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
// CDNをローカルのnode_modulesに差し替え（v0.9.0: three の examples/jsm も）
await page.route('https://cdn.jsdelivr.net/**', r => { const u = r.request().url(), m = u.match(/three@[^/]+\/(.*)$/); if (m) return r.fulfill({ contentType: 'application/javascript', body: readFileSync(join(NM, 'three', m[1])) }); const k = Object.keys(CDN).find(k => u.endsWith(k)); return k ? r.fulfill({ contentType: 'application/javascript', body: readFileSync(CDN[k]) }) : r.abort(); });
await page.goto(`http://localhost:${port}/index.html?test=1`);
await page.waitForFunction(() => window.__TEST, null, { timeout: 120000 });
const T = await page.evaluate(() => window.__TEST);
// v1.0.5: 行の途中の「// コメント」が後ろの処理を飲み込んでいないかを調べる（コメントの中に「; 名前 =」「; return」などがあれば失敗）
{ const src = readFileSync(join(ROOT, 'index.html'), 'utf8'), mod = src.slice(src.indexOf('<script type="module">'), src.indexOf('</script>', src.indexOf('<script type="module">'))), pat = /;\s*(const |let |if \(|for \(|return\b|[A-Za-z_$][\w$]*(\.[\w$]+)*\s*(=[^=]|\())|(^|[\s;}])(if|for|while) \(|\b(continue|break);|\b(const|let) [A-Za-z_$][\w$]* =|[\w$]\.[\w$]+\(.*\)\s*;/, bad = mod.split('\n').map((l, i) => [i, l.indexOf(' // ') >= 0 ? l.slice(l.indexOf(' // ') + 4) : '']).filter(([, c]) => pat.test(c));
  T.results.push({ pass: !bad.length, name: 'コメントが処理を飲み込んでいない（静的検査）', info: bad.map(([i, c]) => `L${i}: ${c.slice(0, 60)}`).join(' / ') }); if (bad.length) T.pass = false; }
for (const r of T.results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  ${r.info}`);
console.log(`errors: ${errors.length ? errors.join(' | ') : 'none'}`);
console.log(`RESULT: ${T.pass && !errors.length ? 'ALL PASS' : 'FAILED'}  (${T.results.filter(r => r.pass).length}/${T.results.length}, ${T.ms}ms)`);
if (SHOTS) {
    // v0.2.0: スマホ縦画面（390x844, タッチ）で実プレイ相当を撮影。射撃は実際のタップ入力で行う
    mkdirSync(join(ROOT, 'tests/shots'), { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const mp = await ctx.newPage(); mp.on('pageerror', e => errors.push(e.message));
    await mp.route('https://cdn.jsdelivr.net/**', r => { const u = r.request().url(), m = u.match(/three@[^/]+\/(.*)$/); if (m) return r.fulfill({ contentType: 'application/javascript', body: readFileSync(join(NM, 'three', m[1])) }); const k = Object.keys(CDN).find(k => u.endsWith(k)); return k ? r.fulfill({ contentType: 'application/javascript', body: readFileSync(CDN[k]) }) : r.abort(); });
    await mp.goto(`http://localhost:${port}/index.html`);
    await mp.waitForFunction(() => window.G && window.G.ready, null, { timeout: 60000 });
    const shot = n => mp.screenshot({ path: join(ROOT, `tests/shots/${n}.png`), timeout: 120000 });  // ソフト描画は1〜2fpsなので長めに待つ
    const scr = (x, y, z) => mp.evaluate(([x, y, z]) => { const g = window.GAME, v = new g.THREE.Vector3(x, y, z).project(g.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, [x, y, z]);
    // v0.3.0: 8兵装を実タップで撃って撮影（時間は GAME.stepN で進める）
    const step = n => mp.evaluate(n => window.GAME.stepN(n), n), sel = i => mp.locator('.wb').nth(i).tap();
    const tapAt = async (x, y, z) => { const [sx, sy] = await scr(x, y, z); await mp.touchscreen.tap(sx, sy); };
    await mp.waitForTimeout(800); await shot('00_title');
    await mp.touchscreen.tap(195, 120); await mp.waitForTimeout(1500); await shot('01_deploy');
    const fz = await mp.evaluate(() => window.GAME.CFG.fortressZ);
    await tapAt(0, 1, fz + 16); await step(10); await shot('02_fire155'); await step(50); await shot('03_hit155');
    await sel(1); await tapAt(0, 2, fz + 3); await step(10); await shot('04_fire203'); await step(55); await shot('05_hit203');
    await sel(3); await tapAt(-19, 1, fz - 4); await step(50); await shot('06_mlrs'); await step(110); await shot('07_mlrs_hit');
    await sel(2); await mp.evaluate(fz => { const g = window.GAME, p = new g.THREE.Vector3(8, 0, fz + 14); for (let i = 0; i < 40; i++) { g.autoFire(p); g.stepN(1); } }, fz); await shot('08_40mm');
    await sel(5); await tapAt(0, 1.8, fz); await step(12); await shot('09_rail');
    await sel(4); await tapAt(0, 0, fz - 2); await step(60 * 5); await shot('09b_mortar');
    await sel(6); await tapAt(10, 0, fz - 12); await step(60 * 3.2); await shot('10_vls'); await step(20); await shot('11_vls_boom');
    await sel(7); await tapAt(-6, 0, fz + 2); await step(60 * 3); await shot('12_air'); await step(80); await shot('13_air_boom');
    await mp.evaluate(() => { const o = document.getElementById('overlay'); o.classList.add('hidden'); }); await step(60 * 9); await shot('15_workers');
    await mp.evaluate(() => { window.GAME.cam.zoom = 0.6; }); await mp.waitForTimeout(300); await shot('16_zoom');
    // v0.5.0: 市街地（タイトルのステージカードを実タップ）
    await mp.goto(`http://localhost:${port}/index.html`); await mp.waitForFunction(() => window.G && window.G.ready, null, { timeout: 60000 }); await mp.waitForTimeout(500);
    await mp.locator('.stg[data-stage=city]').tap(); await mp.waitForTimeout(1200); await shot('20_city_deploy');
    const selId = id => mp.evaluate(id => { const g = window.GAME; return g.BTN_ORDER.indexOf(id); }, id).then(i => sel(i));
    await mp.evaluate(() => { window.GAME.cam.zoom = 0.62; }); await mp.waitForTimeout(300); await shot('21_city_zoom'); await mp.evaluate(() => { window.GAME.cam.zoom = 1; });
    await selId('HEAVY'); await tapAt(-34, 4.5, -84); await step(10); await shot('22_city_203'); await step(70); await shot('23_city_203hit'); await step(180); await shot('24_city_collapse');
    await selId('MLRS'); await tapAt(-34, 0, -40); await step(60); await shot('25_city_mlrs'); await step(120); await shot('26_city_mlrs_hit');
    await selId('VLS'); await tapAt(7.5, 4.5, -100); await step(60 * 3.3); await shot('27_city_vls');
    await selId('AIR'); await tapAt(22, 0, -54); await step(60 * 3); await step(90); await shot('28_city_air');
    await mp.evaluate(() => { window.GAME.G.fever = 1; }); await mp.locator('#fvb').tap(); await selId('GUN76'); await mp.evaluate(() => { const g = window.GAME, p = new g.THREE.Vector3(30, 4.5, -82); for (let i = 0; i < 90; i++) { g.autoFire(p); g.stepN(1); } }); await shot('29_city_fever76');
    await step(60 * 4); await shot('30_city_after');
    await selId('HOWITZER'); await mp.evaluate(() => { window.GAME.player.reload.fill(0); }); await tapAt(22, 0.35, -50); await step(60 * 7.5); await shot('31_city_bridge'); await step(60 * 10); await shot('32_city_workers');
    console.log('city ratio:', await mp.evaluate(() => window.GAME.cityRatio().toFixed(3)));
    const st = await mp.evaluate(() => ({ shots: window.GAME.G.stats.shots, kills: window.GAME.G.stats.kills, workers: window.GAME.workers.length, ai: window.GAME.AI.stats, log: window.GAME.AI.log }));
    console.log('play:', JSON.stringify(st));
    // v0.6.0: 空軍基地（地上撃破・離陸・見越し射撃・滑走路の穴と工兵）
    await mp.goto(`http://localhost:${port}/index.html`); await mp.waitForFunction(() => window.G && window.G.ready, null, { timeout: 60000 }); await mp.waitForTimeout(500);
    await mp.locator('.stg[data-stage=airbase]').tap(); await mp.waitForTimeout(1200); await shot('40_air_deploy');
    await mp.evaluate(() => { window.GAME.cam.zoom = 0.62; }); await mp.waitForTimeout(300); await shot('41_air_zoom'); await mp.evaluate(() => { window.GAME.cam.zoom = 1; });
    await selId('HOWITZER'); await tapAt(-30.2, 0, -82); await step(50); await shot('42_air_ground_kill');
    await mp.evaluate(() => { window.GAME.G.airT = 0; }); await step(60 * 11); await shot('43_air_roll'); await step(60 * 3); await shot('44_air_takeoff'); await step(60 * 2);
    await mp.evaluate(() => { const g = window.GAME; for (let i = 0; i < 600; i++) { const p = g.PLANES.find(p => p.state === 'fly'); if (p && p.pos.z > -50) break; g.stepN(1); } });
    const pp = await mp.evaluate(() => { const g = window.GAME, p = g.PLANES.find(p => p.state === 'fly'); if (!p) return null; g.camera.updateMatrixWorld(); const v = p.pos.clone().project(g.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
    if (pp) await mp.touchscreen.tap(pp[0], pp[1]); await step(40); await shot('45_air_aa'); await step(60 * 2); await shot('46_air_fall');
    await selId('HEAVY'); await tapAt(-30, 0, -58); await step(70); await shot('47_air_runway'); await step(60 * 8); await shot('48_air_repair');
    console.log('air:', JSON.stringify(await mp.evaluate(() => ({ planes: window.GAME.PLANES.map(p => p.state), s: window.GAME.G.stats, ai: window.GAME.AI.stats }))));
    // v0.7.0: 海軍基地（停泊中の撃沈・出航・港外の艦への見越し射撃）
    await mp.goto(`http://localhost:${port}/index.html`); await mp.waitForFunction(() => window.G && window.G.ready, null, { timeout: 60000 }); await mp.waitForTimeout(500);
    await mp.locator('.stg[data-stage=naval]').tap(); await mp.waitForTimeout(1200); await shot('50_nav_deploy');
    await mp.evaluate(() => { window.GAME.cam.zoom = 0.62; }); await mp.waitForTimeout(300); await shot('51_nav_zoom'); await mp.evaluate(() => { window.GAME.cam.zoom = 1; });
    const shipScr = (pred) => mp.evaluate(src => { const g = window.GAME, f = new Function('s', 'return ' + src), s = g.SHIPS.find(f); if (!s) return null; g.camera.updateMatrixWorld(); const v = s.pos.clone().setY(s.pos.y + 2).project(g.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, pred);
    await selId('HEAVY'); let sp = await shipScr("s.pier === 0 && s.outer"); if (sp) await mp.touchscreen.tap(sp[0], sp[1]); await step(80); await shot('52_nav_hit');
    await selId('VLS'); sp = await shipScr("s.pier === 0 && s.outer"); if (sp) await mp.touchscreen.tap(sp[0], sp[1]); await step(60 * 2.6); await shot('53_nav_vls'); await step(60 * 4); await shot('54_nav_sinking');
    await step(60 * 10); await shot('55_nav_sail');
    await selId('HOWITZER'); sp = await shipScr("s.state === 'sail' || s.state === 'out'"); if (sp) await mp.touchscreen.tap(sp[0], sp[1]); await step(90); await shot('56_nav_lead');
    await step(60 * 8); await shot('57_nav_after');
    await selId('GUN76'); await mp.evaluate(() => { const g = window.GAME, s = g.SHIPS.find(s => s.state === 'sail' || s.state === 'out') || g.SHIPS.find(s => s.state === 'park'); g.camera.updateMatrixWorld(); const v = s.pos.clone().setY(s.pos.y + 2).project(g.camera); g.player.hold = { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }); await step(25); await mp.waitForTimeout(400); await shot('58_nav_loupe'); await mp.evaluate(() => { window.GAME.player.hold = null; });
    console.log('naval:', JSON.stringify(await mp.evaluate(() => ({ ships: window.GAME.SHIPS.map(s => s.type + ':' + s.state), s: window.GAME.G.stats }))));
    await ctx.close();
    console.log(`shots saved, errors after play: ${errors.length}`);
}
await browser.close(); srv.close();
process.exit(T.pass && !errors.length ? 0 : 1);
