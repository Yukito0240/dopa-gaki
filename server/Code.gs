// D.O.P.A. - G.A.K.I. 記録サーバー（Google Apps Script + スプレッドシート）v1
// 置き方: スプレッドシート → 拡張機能 → Apps Script に貼り付け → デプロイ → ウェブアプリ（実行: 自分 / アクセス: 全員）
const STAGES = ['outpost', 'fortress', 'city', 'airbase', 'naval', 'horde'];
const ONLINE_SEC = 75, CACHE_SEC = 20, TZ = 'Asia/Tokyo';
const P_HEAD = ['uid', 'name', 'room', 'created', 'lastSeen', 'renamed'], L_HEAD = ['ts', 'uid', 'name', 'room', 'stage', 'win', 'score', 'time'];
// sh: シートを取得（無ければ見出し付きで作る）
function sh(n, head) { const ss = SpreadsheetApp.getActiveSpreadsheet(); let s = ss.getSheetByName(n); if (!s) { s = ss.insertSheet(n); s.appendRow(head); s.setFrozenRows(1); } return s; }
// rows: 見出しを除いた全行をオブジェクトの配列で
function rows(s, head) { const v = s.getDataRange().getValues(); v.shift(); return v.map((r, i) => { const o = { _row: i + 2 }; head.forEach((h, j) => o[h] = r[j]); return o; }); }
function doGet(e) { return out(route(e.parameter || {})); }
function doPost(e) { let q = {}; try { q = JSON.parse(e.postData.contents || '{}'); } catch (err) { } return out(route(q)); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
// route: 呼び出しの振り分け（a=reg/play/hb/me/rank/room）
function route(q) {
  try {
    if (q.uid && !/^[A-Za-z0-9-]{8,64}$/.test(String(q.uid))) return { ok: false, err: 'uid' };
    switch (q.a) { case 'reg': return reg(q); case 'play': return play(q); case 'hb': return hb(q); case 'me': return me(q); case 'rank': return rank(q); case 'room': return room(q); case 'ping': return { ok: true }; }
    return { ok: false, err: 'bad_action' };
  } catch (err) { return { ok: false, err: String(err) }; }
}
function cleanRoom(r) { r = String(r || '本部').trim().slice(0, 16); return r || '本部'; }
function player(uid) { return rows(sh('Players', P_HEAD), P_HEAD).find(p => p.uid === uid); }
// reg: コールサイン登録（2〜12文字・英数字と日本語・重複不可。変更は1回まで）
function reg(q) {
  const name = String(q.name || '').trim();
  if (!/^[A-Za-z0-9_\-぀-ヿ㐀-鿿ｦ-ﾟ]{2,12}$/.test(name)) return { ok: false, err: 'name_format' };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const s = sh('Players', P_HEAD), ps = rows(s, P_HEAD), me = ps.find(p => p.uid === q.uid);
    if (ps.some(p => p.uid !== q.uid && String(p.name).toLowerCase() === name.toLowerCase())) return { ok: false, err: 'name_taken' };
    const now = new Date(), rm = cleanRoom(q.room);
    if (!me) { s.appendRow([q.uid, name, rm, now, now, 0]); return { ok: true, name, renamed: 0 }; }
    if (me.name === name) return { ok: true, name, renamed: me.renamed };
    if (Number(me.renamed) >= 1) return { ok: false, err: 'rename_used' };
    s.getRange(me._row, 2).setValue(name); s.getRange(me._row, 6).setValue(1);
    const L = sh('Plays', L_HEAD), lr = rows(L, L_HEAD); lr.forEach(r => { if (r.uid === q.uid) L.getRange(r._row, 3).setValue(name); });
    return { ok: true, name, renamed: 1 };
  } finally { lock.releaseLock(); CacheService.getScriptCache().removeAll(['rank', 'room']); }
}
// touch: 最後に見た時刻と部屋を更新
function touch(uid, rm) { const s = sh('Players', P_HEAD), p = rows(s, P_HEAD).find(x => x.uid === uid); if (!p) return null; s.getRange(p._row, 3, 1, 3).setValues([[rm, p.created, new Date()]]); p.room = rm; return p; }
// play: 1回分の結果を記録
function play(q) {
  const stage = String(q.stage), score = Math.round(Number(q.score)), time = Number(q.time), win = q.win === true || q.win === 'true';
  if (STAGES.indexOf(stage) < 0 || !isFinite(score) || score < 0 || score > 10000000 || !isFinite(time) || time < 0 || time > 3600) return { ok: false, err: 'bad_play' };
  const p = touch(q.uid, cleanRoom(q.room)); if (!p) return { ok: false, err: 'no_player' };
  sh('Plays', L_HEAD).appendRow([new Date(), q.uid, p.name, p.room, stage, win, score, Math.round(time * 10) / 10]);
  return { ok: true };
}
// online: 部屋で今プレイ中（最近の合図あり）の人
function online(ps, rm) { const t = Date.now() - ONLINE_SEC * 1000; return ps.filter(p => p.room === rm && new Date(p.lastSeen).getTime() > t).map(p => p.name); }
// hb: 生存の合図（30秒ごと）。部屋の今の人数を返す
function hb(q) { const rm = cleanRoom(q.room); touch(q.uid, rm); const ps = rows(sh('Players', P_HEAD), P_HEAD); const on = online(ps, rm); return { ok: true, room: rm, online: on.length, names: on.slice(0, 8) }; }
// me: 自分の記録（プレイ数・クリア数・ステージ別）
function me(q) {
  const p = player(q.uid); if (!p) return { ok: true, name: null };
  const L = rows(sh('Plays', L_HEAD), L_HEAD).filter(r => r.uid === q.uid), st = {};
  STAGES.forEach(k => st[k] = { plays: 0, clears: 0, best: null, top: 0 });
  L.forEach(r => { const o = st[r.stage]; if (!o) return; o.plays++; o.top = Math.max(o.top, Number(r.score)); if (r.win === true) { o.clears++; o.best = o.best == null ? Number(r.time) : Math.min(o.best, Number(r.time)); } });
  const last = L.length ? Utilities.formatDate(new Date(L[L.length - 1].ts), TZ, 'M/d') : null;
  return { ok: true, name: p.name, room: p.room, renamed: p.renamed, plays: L.length, clears: L.filter(r => r.win === true).length, stages: st, last };
}
// rank: ステージ別ランキング（metric=time/score/clears、room=all か部屋名）上位20＋自分の順位
function rank(q) {
  const stage = String(q.stage), metric = ['time', 'score', 'clears'].indexOf(q.metric) >= 0 ? q.metric : 'score', rm = q.room && q.room !== 'all' ? cleanRoom(q.room) : 'all';
  const key = ['rank', stage, metric, rm].join('|'), c = CacheService.getScriptCache(), hit = c.get(key);
  let list = hit ? JSON.parse(hit) : null;
  if (!list) {
    const best = {}, ps = {}; rows(sh('Players', P_HEAD), P_HEAD).forEach(p => ps[p.uid] = p);
    rows(sh('Plays', L_HEAD), L_HEAD).forEach(r => {
      if (r.stage !== stage || !ps[r.uid] || (rm !== 'all' && ps[r.uid].room !== rm)) return;
      const b = best[r.uid] || (best[r.uid] = { uid: r.uid, name: ps[r.uid].name, v: null, d: null, n: 0 }), d = Utilities.formatDate(new Date(r.ts), TZ, 'M/d');
      if (metric === 'clears') { if (r.win === true) { b.n++; b.v = b.n; b.d = d; } return; }
      if (metric === 'time') { if (r.win === true && (b.v == null || Number(r.time) < b.v)) { b.v = Number(r.time); b.d = d; } return; }
      if (b.v == null || Number(r.score) > b.v) { b.v = Number(r.score); b.d = d; }
    });
    list = Object.keys(best).map(k => best[k]).filter(b => b.v != null).sort((a, b) => metric === 'time' ? a.v - b.v : b.v - a.v).map(b => ({ uid: b.uid, name: b.name, v: b.v, d: b.d }));
    c.put(key, JSON.stringify(list).slice(0, 90000), CACHE_SEC);
  }
  const mi = list.findIndex(x => x.uid === q.uid);
  return { ok: true, stage, metric, room: rm, top: list.slice(0, 20).map(x => ({ name: x.name, v: x.v, d: x.d, me: x.uid === q.uid })), mine: mi >= 0 ? { rank: mi + 1, v: list[mi].v } : null, total: list.length };
}
// room: 部屋の集計（人数・総プレイ・ステージ別・きょうのMVP・今プレイ中）
function room(q) {
  const rm = cleanRoom(q.room), ps = rows(sh('Players', P_HEAD), P_HEAD), mem = ps.filter(p => p.room === rm), ids = {}; mem.forEach(p => ids[p.uid] = p.name);
  const L = rows(sh('Plays', L_HEAD), L_HEAD).filter(r => ids[r.uid] !== undefined), st = {}, today = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd'), mvp = {};
  STAGES.forEach(k => st[k] = { plays: 0, clears: 0, best: null, who: null });
  L.forEach(r => { const o = st[r.stage]; if (!o) return; o.plays++; const nm = ids[r.uid];
    if (r.stage === 'horde') { if (o.best == null || Number(r.score) > o.best) { o.best = Number(r.score); o.who = nm; } }
    else if (r.win === true && (o.best == null || Number(r.time) < o.best)) { o.best = Number(r.time); o.who = nm; }
    if (r.win === true) { o.clears++; if (Utilities.formatDate(new Date(r.ts), TZ, 'yyyyMMdd') === today) mvp[nm] = (mvp[nm] || 0) + 1; } });
  const top = Object.keys(mvp).sort((a, b) => mvp[b] - mvp[a])[0], on = online(ps, rm);
  return { ok: true, room: rm, members: mem.length, plays: L.length, clears: L.filter(r => r.win === true).length, stages: st, mvp: top ? { name: top, n: mvp[top] } : null, online: on.length, names: on.slice(0, 8) };
}
