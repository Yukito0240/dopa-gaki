// D.O.P.A. - G.A.K.I. 記録サーバー（Google Apps Script + スプレッドシート）v4
// v4: 非公開の部屋（一覧に出ない・名前を知っている人だけ入れる）、出撃の知らせ（start → hb で同じ部屋の人へ）
// v5: 結果の知らせ（クリア・失敗も hb で同じ部屋の人へ）
// v2: bundle（記録画面の中身を1回で返す） v3: 部屋の一覧・作成・入室コード・部屋長、最初の部屋は 3TFS（旧「本部」から移す）
// 置き方: スプレッドシート → 拡張機能 → Apps Script に貼り付け → デプロイ → デプロイを管理 → 編集 → 新バージョン
const STAGES = ['outpost', 'fortress', 'city', 'airbase', 'naval', 'horde'];
const HOME = '3TFS', OLD_HOME = '本部', START_SEC = 75, ONLINE_SEC = 75, CACHE_SEC = 20, TZ = 'Asia/Tokyo';
const P_HEAD = ['uid', 'name', 'room', 'created', 'lastSeen', 'renamed', 'stage', 'startAt'], L_HEAD = ['ts', 'uid', 'name', 'room', 'stage', 'win', 'score', 'time'], R_HEAD = ['name', 'code', 'owner', 'created', 'hidden'];
const NAME_RE = /^[A-Za-z0-9_\-぀-ヿ㐀-鿿ｦ-ﾟ]{2,12}$/, ROOM_RE = /^[A-Za-z0-9_\-぀-ヿ㐀-鿿ｦ-ﾟ ]{2,16}$/;
// sh: シートを取得（無ければ見出し付きで作る）
function sh(n, head) { const ss = SpreadsheetApp.getActiveSpreadsheet(); let s = ss.getSheetByName(n); if (!s) { s = ss.insertSheet(n); s.appendRow(head); s.setFrozenRows(1); } return s; }
// rows: 見出しを除いた全行をオブジェクトの配列で
function rows(s, head) { const v = s.getDataRange().getValues(); v.shift(); return v.map((r, i) => { const o = { _row: i + 2 }; head.forEach((h, j) => o[h] = r[j]); return o; }); }
function doGet(e) { return out(route(e.parameter || {})); }
function doPost(e) { let q = {}; try { q = JSON.parse(e.postData.contents || '{}'); } catch (err) { } return out(route(q)); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
// route: 呼び出しの振り分け
function route(q) {
  try {
    if (q.uid && !/^[A-Za-z0-9-]{8,64}$/.test(String(q.uid))) return { ok: false, err: 'uid' };
    setup(); setup4();
    switch (q.a) {
      case 'reg': return reg(q); case 'play': return play(q); case 'hb': return hb(q); case 'me': return me(q); case 'rank': return rank(q); case 'room': return room(q);
      case 'bundle': return bundle(q); case 'rooms': return { ok: true, rooms: rooms(q) }; case 'mkroom': return mkroom(q); case 'join': return join(q); case 'editroom': return editroom(q); case 'start': return start(q); case 'ping': return { ok: true };
    }
    return { ok: false, err: 'bad_action' };
  } catch (err) { return { ok: false, err: String(err) }; }
}
// setup: 最初の部屋 3TFS を用意し、旧「本部」の人を 3TFS へ移す（1回だけ）
function setup() {
  const pr = PropertiesService.getScriptProperties(); if (pr.getProperty('v3')) return;
  const R = sh('Rooms', R_HEAD); if (!rows(R, R_HEAD).some(r => r.name === HOME)) R.appendRow([HOME, '', '', new Date()]);
  const P = sh('Players', P_HEAD); rows(P, P_HEAD).forEach(p => { if (!p.room || p.room === OLD_HOME) P.getRange(p._row, 3).setValue(HOME); });
  const L = sh('Plays', L_HEAD); rows(L, L_HEAD).forEach(r => { if (r.room === OLD_HOME) L.getRange(r._row, 4).setValue(HOME); });
  pr.setProperty('v3', '1');
}
// setup4: 見出しに v4 の列を足す（1回だけ）
function setup4() { const pr = PropertiesService.getScriptProperties(); if (pr.getProperty('v4')) return; sh('Players', P_HEAD).getRange(1, 7).setValue('stage'); sh('Players', P_HEAD).getRange(1, 8).setValue('startAt'); sh('Rooms', R_HEAD).getRange(1, 5).setValue('hidden'); pr.setProperty('v4', '1'); }
function hash(s) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'dopa:' + String(s))); }
// load: 3つのシートを1回だけ読む
function load() { return { ps: rows(sh('Players', P_HEAD), P_HEAD), L: rows(sh('Plays', L_HEAD), L_HEAD), R: rows(sh('Rooms', R_HEAD), R_HEAD) }; }
function roomOf(p) { return p && p.room ? String(p.room) : HOME; }
// reg: コールサイン登録（2〜12文字・英数字と日本語・重複不可。変更は1回まで）。新しい人は 3TFS に入る
function reg(q) {
  const name = String(q.name || '').trim(); if (!NAME_RE.test(name)) return { ok: false, err: 'name_format' };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const s = sh('Players', P_HEAD), ps = rows(s, P_HEAD), me = ps.find(p => p.uid === q.uid);
    if (ps.some(p => p.uid !== q.uid && String(p.name).toLowerCase() === name.toLowerCase())) return { ok: false, err: 'name_taken' };
    const now = new Date();
    if (!me) { s.appendRow([q.uid, name, HOME, now, now, 0]); return { ok: true, name, renamed: 0, room: HOME }; }
    if (me.name === name) return { ok: true, name, renamed: me.renamed, room: roomOf(me) };
    if (Number(me.renamed) >= 1) return { ok: false, err: 'rename_used' };
    s.getRange(me._row, 2).setValue(name); s.getRange(me._row, 6).setValue(1);
    const L = sh('Plays', L_HEAD); rows(L, L_HEAD).forEach(r => { if (r.uid === q.uid) L.getRange(r._row, 3).setValue(name); });
    return { ok: true, name, renamed: 1, room: roomOf(me) };
  } finally { lock.releaseLock(); }
}
// touch: 最後に見た時刻を更新（部屋は join / mkroom でだけ変わる）
function touch(uid) { const s = sh('Players', P_HEAD), p = rows(s, P_HEAD).find(x => x.uid === uid); if (!p) return null; s.getRange(p._row, 5).setValue(new Date()); return p; }
// play: 1回分の結果を記録（部屋はサーバー側の所属）
function play(q) {
  const stage = String(q.stage), score = Math.round(Number(q.score)), time = Number(q.time), win = q.win === true || q.win === 'true';
  if (STAGES.indexOf(stage) < 0 || !isFinite(score) || score < 0 || score > 10000000 || !isFinite(time) || time < 0 || time > 3600) return { ok: false, err: 'bad_play' };
  const p = touch(q.uid); if (!p) return { ok: false, err: 'no_player' };
  sh('Plays', L_HEAD).appendRow([new Date(), q.uid, p.name, roomOf(p), stage, win, score, Math.round(time * 10) / 10]);
  return { ok: true };
}
// online: 部屋で今プレイ中（最近の合図あり）の人
function online(ps, rm) { const t = Date.now() - ONLINE_SEC * 1000; return ps.filter(p => roomOf(p) === rm && new Date(p.lastSeen).getTime() > t).map(p => p.name); }
// hb: 生存の合図（30秒ごと）。自分の部屋の今の人数を返す
function hb(q) { const p = touch(q.uid); if (!p) return { ok: false, err: 'no_player' }; const rm = roomOf(p), ps = rows(sh('Players', P_HEAD), P_HEAD), on = online(ps, rm), t = Date.now() - START_SEC * 1000;
  const starts = ps.filter(x => x.uid !== q.uid && roomOf(x) === rm && x.startAt && new Date(x.startAt).getTime() > t).map(x => ({ name: x.name, stage: x.stage, t: new Date(x.startAt).getTime() }));
  const results = rows(sh('Plays', L_HEAD), L_HEAD).filter(r => r.uid !== q.uid && r.room === rm && new Date(r.ts).getTime() > t).map(r => ({ name: r.name, stage: r.stage, win: r.win === true, time: Number(r.time), score: Number(r.score), t: new Date(r.ts).getTime() }));
  return { ok: true, room: rm, online: on.length, names: on.slice(0, 8), starts, results }; }
// start: 出撃の知らせ（同じ部屋の人の hb に START_SEC 秒のあいだ載る）
function start(q) { const stage = String(q.stage); if (STAGES.indexOf(stage) < 0) return { ok: false, err: 'bad_stage' }; const s = sh('Players', P_HEAD), p = rows(s, P_HEAD).find(x => x.uid === q.uid); if (!p) return { ok: false, err: 'no_player' }; const now = new Date(); s.getRange(p._row, 5).setValue(now); s.getRange(p._row, 7).setValue(stage); s.getRange(p._row, 8).setValue(now); return { ok: true }; }
// me: 自分の記録（プレイ数・クリア数・ステージ別）
function me(q, D) {
  D = D || load(); const p = D.ps.find(x => x.uid === q.uid); if (!p) return { ok: true, name: null };
  const L = D.L.filter(r => r.uid === q.uid), st = {};
  STAGES.forEach(k => st[k] = { plays: 0, clears: 0, best: null, top: 0 });
  L.forEach(r => { const o = st[r.stage]; if (!o) return; o.plays++; o.top = Math.max(o.top, Number(r.score)); if (r.win === true) { o.clears++; o.best = o.best == null ? Number(r.time) : Math.min(o.best, Number(r.time)); } });
  const last = L.length ? Utilities.formatDate(new Date(L[L.length - 1].ts), TZ, 'M/d') : null;
  return { ok: true, name: p.name, room: roomOf(p), renamed: p.renamed, plays: L.length, clears: L.filter(r => r.win === true).length, stages: st, last };
}
// rank: ステージ別ランキング（metric=time/score/clears、room=all か自分の部屋）上位20＋自分の順位
function rank(q, D) {
  D = D || load(); const p = D.ps.find(x => x.uid === q.uid), stage = String(q.stage), metric = ['time', 'score', 'clears'].indexOf(q.metric) >= 0 ? q.metric : 'score', rm = q.room === 'all' ? 'all' : roomOf(p);
  const best = {}, ps = {}; D.ps.forEach(x => ps[x.uid] = x);
  D.L.forEach(r => {
    if (r.stage !== stage || !ps[r.uid] || (rm !== 'all' && roomOf(ps[r.uid]) !== rm)) return;
    const b = best[r.uid] || (best[r.uid] = { uid: r.uid, name: ps[r.uid].name, v: null, d: null, n: 0 }), d = Utilities.formatDate(new Date(r.ts), TZ, 'M/d');
    if (metric === 'clears') { if (r.win === true) { b.n++; b.v = b.n; b.d = d; } return; }
    if (metric === 'time') { if (r.win === true && (b.v == null || Number(r.time) < b.v)) { b.v = Number(r.time); b.d = d; } return; }
    if (b.v == null || Number(r.score) > b.v) { b.v = Number(r.score); b.d = d; }
  });
  const list = Object.keys(best).map(k => best[k]).filter(b => b.v != null).sort((a, b) => metric === 'time' ? a.v - b.v : b.v - a.v), mi = list.findIndex(x => x.uid === q.uid);
  return { ok: true, stage, metric, room: rm, top: list.slice(0, 20).map(x => ({ name: x.name, v: x.v, d: x.d, me: x.uid === q.uid })), mine: mi >= 0 ? { rank: mi + 1, v: list[mi].v } : null, total: list.length };
}
// room: 自分の部屋の集計（人数・総プレイ・ステージ別・きょうのMVP・今プレイ中・部屋長か）
function room(q, D) {
  D = D || load(); const p = D.ps.find(x => x.uid === q.uid), rm = roomOf(p), R = D.R.find(r => r.name === rm), mem = D.ps.filter(x => roomOf(x) === rm), ids = {}; mem.forEach(x => ids[x.uid] = x.name);
  const L = D.L.filter(r => ids[r.uid] !== undefined), st = {}, today = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd'), mvp = {};
  STAGES.forEach(k => st[k] = { plays: 0, clears: 0, best: null, who: null });
  L.forEach(r => { const o = st[r.stage]; if (!o) return; o.plays++; const nm = ids[r.uid];
    if (r.stage === 'horde') { if (o.best == null || Number(r.score) > o.best) { o.best = Number(r.score); o.who = nm; } }
    else if (r.win === true && (o.best == null || Number(r.time) < o.best)) { o.best = Number(r.time); o.who = nm; }
    if (r.win === true) { o.clears++; if (Utilities.formatDate(new Date(r.ts), TZ, 'yyyyMMdd') === today) mvp[nm] = (mvp[nm] || 0) + 1; } });
  const top = Object.keys(mvp).sort((a, b) => mvp[b] - mvp[a])[0], on = online(D.ps, rm), ow = R && R.owner ? D.ps.find(x => x.uid === R.owner) : null;
  return { ok: true, room: rm, members: mem.length, plays: L.length, clears: L.filter(r => r.win === true).length, stages: st, mvp: top ? { name: top, n: mvp[top] } : null, online: on.length, names: on.slice(0, 8), owner: ow ? ow.name : null, mine: !!(R && R.owner && R.owner === q.uid), locked: !!(R && R.code), hidden: !!(R && R.hidden) };
}
// rooms: 部屋の一覧（名前・入室コードの有無・人数・今プレイ中・部屋長）
function rooms(q, D) {
  D = D || load(); const t = Date.now() - ONLINE_SEC * 1000, me = D.ps.find(x => x.uid === q.uid);
  return D.R.filter(r => !r.hidden || r.owner === q.uid || roomOf(me) === r.name).map(r => { const mem = D.ps.filter(x => roomOf(x) === r.name), ow = r.owner ? D.ps.find(x => x.uid === r.owner) : null;
    return { name: r.name, locked: !!r.code, members: mem.length, online: mem.filter(x => new Date(x.lastSeen).getTime() > t).length, owner: ow ? ow.name : null, here: roomOf(me) === r.name, hidden: !!r.hidden }; })
    .sort((a, b) => (b.name === HOME) - (a.name === HOME) || b.online - a.online || b.members - a.members);
}
// mkroom: 部屋を作る（名前2〜16文字・同じ名前は不可・入室コードは空なら誰でも入れる・hidden=非公開で一覧に出さない）。作った人が部屋長になり、その部屋に入る
function mkroom(q) {
  const name = String(q.name || '').trim(), code = String(q.code || '').trim(); if (!ROOM_RE.test(name)) return { ok: false, err: 'room_format' }; if (code.length > 16) return { ok: false, err: 'code_format' };
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const R = sh('Rooms', R_HEAD), P = sh('Players', P_HEAD), p = rows(P, P_HEAD).find(x => x.uid === q.uid); if (!p) return { ok: false, err: 'no_player' };
    if (rows(R, R_HEAD).some(r => String(r.name).toLowerCase() === name.toLowerCase() || r.name === OLD_HOME && name === OLD_HOME)) return { ok: false, err: 'room_taken' };
    R.appendRow([name, code ? hash(code) : '', q.uid, new Date(), q.hidden ? 1 : '']); P.getRange(p._row, 3).setValue(name);
    return { ok: true, room: name };
  } finally { lock.releaseLock(); }
}
// join: 部屋に入る（入室コードのある部屋はコードが合った時だけ）
function join(q) {
  const name = String(q.name || '').trim(), R = rows(sh('Rooms', R_HEAD), R_HEAD).find(r => String(r.name).toLowerCase() === name.toLowerCase()); if (!R) return { ok: false, err: 'no_room' };
  if (R.code && hash(String(q.code || '').trim()) !== R.code && R.owner !== q.uid) return { ok: false, err: 'bad_code' };
  const P = sh('Players', P_HEAD), p = rows(P, P_HEAD).find(x => x.uid === q.uid); if (!p) return { ok: false, err: 'no_player' };
  P.getRange(p._row, 3).setValue(R.name); return { ok: true, room: R.name };
}
// editroom: 部屋長が名前と入室コードを変える（code: 新しいコード、clear=true でコードなし）
function editroom(q) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const Rs = sh('Rooms', R_HEAD), P = sh('Players', P_HEAD), ps = rows(P, P_HEAD), p = ps.find(x => x.uid === q.uid), R = rows(Rs, R_HEAD).find(r => r.name === roomOf(p));
    if (!R || !R.owner || R.owner !== q.uid) return { ok: false, err: 'not_owner' };
    const nn = String(q.name || R.name).trim(); if (!ROOM_RE.test(nn)) return { ok: false, err: 'room_format' };
    if (nn !== R.name && rows(Rs, R_HEAD).some(r => r.name.toLowerCase() === nn.toLowerCase())) return { ok: false, err: 'room_taken' };
    if (q.hidden !== undefined) Rs.getRange(R._row, 5).setValue(q.hidden ? 1 : '');
    if (q.clear) Rs.getRange(R._row, 2).setValue(''); else if (q.code) { if (String(q.code).length > 16) return { ok: false, err: 'code_format' }; Rs.getRange(R._row, 2).setValue(hash(String(q.code).trim())); }
    if (nn !== R.name) { Rs.getRange(R._row, 1).setValue(nn); ps.forEach(x => { if (roomOf(x) === R.name) P.getRange(x._row, 3).setValue(nn); }); const L = sh('Plays', L_HEAD); rows(L, L_HEAD).forEach(r => { if (r.room === R.name) L.getRange(r._row, 4).setValue(nn); }); }
    return { ok: true, room: nn };
  } finally { lock.releaseLock(); }
}
// bundle: 記録画面の中身（自分・部屋・部屋の一覧・全ステージのランキング［並べ方3種×全体/部屋］）を1回で返す
function bundle(q) {
  const D = load(), out = { ok: true, v: 5, me: me(q, D), room: room(q, D), rooms: rooms(q, D), rank: {} };
  STAGES.forEach(st => { out.rank[st] = {}; (st === 'horde' ? ['score'] : ['time', 'score', 'clears']).forEach(m => { out.rank[st][m] = { all: rank({ uid: q.uid, stage: st, metric: m, room: 'all' }, D), room: rank({ uid: q.uid, stage: st, metric: m, room: 'mine' }, D) }; }); });
  return out;
}
