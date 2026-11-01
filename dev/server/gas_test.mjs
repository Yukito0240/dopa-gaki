// GASの模擬環境で Code.gs v6 を動かす簡易テスト（v6: キャッシュの模擬と、シートの読み書きの回数を数える）
import { readFileSync } from 'fs'; import { createHash } from 'crypto';
const sheets = {}, props = {}, cc = {}, io = { read: 0, seen: 0 };
class Range { constructor(s, r, c) { Object.assign(this, { s, r, c }); } setValue(v) { if (this.s === sheets.Players && this.c === 5) io.seen++; this.s.d[this.r - 1][this.c - 1] = v; } getValues() { io.read++; return this.s.d.map(r => r.slice()); } }
class Sheet { constructor() { this.d = []; } appendRow(r) { this.d.push(r.slice()); } setFrozenRows() { } getDataRange() { return new Range(this, 1, 1); } getRange(r, c) { return new Range(this, r, c); } }
const g = { SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n], insertSheet: n => (sheets[n] = new Sheet()) }) }, LockService: { getScriptLock: () => ({ waitLock() { }, tryLock() { return true; }, releaseLock() { } }) }, CacheService: { getScriptCache: () => ({ get: k => cc[k] && cc[k].e > Date.now() ? cc[k].v : null, put: (k, v, sec) => { if (v.length > 100000) throw new Error('too big'); cc[k] = { v, e: Date.now() + sec * 1000 }; }, removeAll: ks => ks.forEach(k => delete cc[k]) }) }, PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k], setProperty: (k, v) => props[k] = v }) }, ContentService: { createTextOutput: t => ({ t, setMimeType() { return this; } }), MimeType: { JSON: 1 } }, Utilities: { formatDate: (d, tz, f) => f === 'M/d' ? `${d.getMonth() + 1}/${d.getDate()}` : d.toISOString().slice(0, 10).replace(/-/g, ''), computeDigest: (a, s) => createHash('sha256').update(s).digest(), base64Encode: b => Buffer.from(b).toString('base64'), DigestAlgorithm: { SHA_256: 1 } } };
const fn = new Function(...Object.keys(g), readFileSync('Code.gs', 'utf8') + '; return { route };')(...Object.values(g));
const R = q => fn.route(q); let fail = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n, x ? JSON.stringify(x).slice(0, 170) : ''); if (!c) fail++; };
const A = 'aaaaaaaa-1111', B = 'bbbbbbbb-2222', C = 'cccccccc-3333';
// v2 時代のデータ（本部）を先に置いて、v3 の移行を確かめる
sheets.Players = new Sheet(); sheets.Players.appendRow(['uid', 'name', 'room', 'created', 'lastSeen', 'renamed']); sheets.Players.appendRow([C, 'OLDIE', '本部', new Date(), new Date(), 0]);
sheets.Plays = new Sheet(); sheets.Plays.appendRow(['ts', 'uid', 'name', 'room', 'stage', 'win', 'score', 'time']); sheets.Plays.appendRow([new Date(), C, 'OLDIE', '本部', 'outpost', true, 5000, 30]);
ok('ping で移行', R({ a: 'ping' }).ok && sheets.Players.d[1][2] === '3TFS' && sheets.Plays.d[1][3] === '3TFS' && sheets.Rooms.d[1][0] === '3TFS');
ok('登録は 3TFS', R({ a: 'reg', uid: A, name: 'KENTI-01' }).room === '3TFS');
ok('同じ名前は不可', R({ a: 'reg', uid: B, name: 'kenti-01' }).err === 'name_taken');
ok('日本語名', R({ a: 'reg', uid: B, name: 'ゴースト' }).ok);
ok('改名1回', R({ a: 'reg', uid: B, name: 'ゴースト2' }).renamed === 1 && R({ a: 'reg', uid: B, name: 'ゴースト3' }).err === 'rename_used');
ok('記録', R({ a: 'play', uid: A, stage: 'fortress', win: true, score: 24880, time: 81 }).ok && R({ a: 'play', uid: A, stage: 'fortress', win: false, score: 9000, time: 120 }).ok && R({ a: 'play', uid: B, stage: 'fortress', win: true, score: 20000, time: 70 }).ok);
ok('不正な記録', R({ a: 'play', uid: A, stage: 'moon', score: 1, time: 1 }).err === 'bad_play');
const m = R({ a: 'me', uid: A }); ok('自分の記録', m.plays === 2 && m.clears === 1 && m.stages.fortress.best === 81 && m.room === '3TFS', m);
const rt = R({ a: 'rank', uid: A, stage: 'fortress', metric: 'time', room: 'all' }); ok('タイム順', rt.top[0].name === 'ゴースト2' && rt.mine.rank === 2, rt);
ok('部屋を作る（コード付き）', R({ a: 'mkroom', uid: B, name: '第3飛行隊 整備', code: '0240' }).room === '第3飛行隊 整備');
ok('同じ名前の部屋は不可', R({ a: 'mkroom', uid: A, name: '第3飛行隊 整備' }).err === 'room_taken');
const ls = R({ a: 'rooms', uid: A }).rooms; ok('一覧', ls.length === 2 && ls[0].name === '3TFS' && ls[1].locked && ls[1].owner === 'ゴースト2', ls);
ok('コード違いは入れない', R({ a: 'join', uid: A, name: '第3飛行隊 整備', code: '1111' }).err === 'bad_code');
ok('コードが合えば入れる', R({ a: 'join', uid: A, name: '第3飛行隊 整備', code: '0240' }).ok && R({ a: 'me', uid: A }).room === '第3飛行隊 整備');
const rmS = R({ a: 'room', uid: A }); ok('部屋の集計（部屋長・鍵）', rmS.members === 2 && rmS.owner === 'ゴースト2' && rmS.locked && !rmS.mine, rmS);
ok('部屋長でなければ変えられない', R({ a: 'editroom', uid: A, name: 'X部屋' }).err === 'not_owner');
ok('部屋長は名前を変えられる', R({ a: 'editroom', uid: B, name: '整備班', clear: true }).room === '整備班' && R({ a: 'me', uid: A }).room === '整備班' && !R({ a: 'room', uid: B }).locked);
ok('3TFSには誰でも戻れる', R({ a: 'join', uid: A, name: '3TFS' }).ok);
R({ a: 'hb', uid: C }); const h = R({ a: 'hb', uid: A }); ok('今プレイ中', h.room === '3TFS' && h.online >= 2 && !h.names.includes('ゴースト2'), h);  // v6: 3TFS にいる OLDIE が合図、別の部屋に移った人は数えない
ok('非公開の部屋を作る', R({ a: 'mkroom', uid: C, name: 'ひみつ基地', hidden: true }).ok && !R({ a: 'rooms', uid: A }).rooms.some(r => r.name === 'ひみつ基地') && R({ a: 'rooms', uid: C }).rooms.some(r => r.name === 'ひみつ基地' && r.hidden));
ok('非公開は名前で入れる', R({ a: 'join', uid: A, name: 'ヒミツ基地' }).err === 'no_room' && R({ a: 'join', uid: A, name: 'ひみつ基地' }).room === 'ひみつ基地' && R({ a: 'room', uid: A }).hidden);
R({ a: 'join', uid: A, name: '3TFS' }); R({ a: 'join', uid: C, name: '3TFS' });
ok('出撃の知らせ', R({ a: 'start', uid: C, stage: 'naval' }).ok && R({ a: 'hb', uid: A }).starts.some(x => x.name === 'OLDIE' && x.stage === 'naval') && !R({ a: 'hb', uid: C }).starts.length);
R({ a: 'play', uid: C, stage: 'naval', win: false, score: 3000, time: 120 }); ok('結果の知らせ', R({ a: 'hb', uid: A }).results.some(x => x.name === 'OLDIE' && x.stage === 'naval' && x.win === false) && !R({ a: 'hb', uid: C }).results.some(x => x.name === 'OLDIE'));
ok('部屋長は非公開にできる', R({ a: 'editroom', uid: C, hidden: false }).err === 'not_owner');
const bd = R({ a: 'bundle', uid: A }); ok('まとめて返す', bd.ok && bd.v === 6 && bd.rooms.length === 2 && bd.rank.fortress.time.all.top[0].name === 'ゴースト2' && !bd.rank.horde.time, { sz: JSON.stringify(bd).length });
// v6: 軽量化の確認
io.read = 0; io.seen = 0; R({ a: 'hb', uid: A }); R({ a: 'hb', uid: A }); R({ a: 'start', uid: A, stage: 'city' }); ok('hb・出撃はシートを読まない（v6）', io.read === 0, io);
ok('最後に見た時刻の書き込みは5分に1回（v6）', io.seen === 0 && (cc['s:' + A] = null, R({ a: 'hb', uid: A }), io.seen === 1), io);
io.read = 0; const b1 = R({ a: 'bundle', uid: A }), b2 = R({ a: 'bundle', uid: A }); ok('bundle は20秒キャッシュ（v6）', io.read === 0 && JSON.stringify(b1) === JSON.stringify(b2), io);
const pl = R({ a: 'play', uid: A, stage: 'city', win: true, score: 30000, time: 95 }); ok('play の返事に新しい bundle（v6）', pl.ok && pl.bundle && pl.bundle.me.stages.city.clears === 1 && pl.bundle.me.plays === b1.me.plays + 1, pl.bundle && pl.bundle.me.stages.city);
ok('部屋を移ると今の一覧も移る（v6）', R({ a: 'join', uid: B, name: 'ひみつ基地' }).ok && !R({ a: 'hb', uid: A }).names.includes('ゴースト2') && R({ a: 'join', uid: B, name: '3TFS' }).ok && R({ a: 'hb', uid: B }).room === '3TFS' && R({ a: 'hb', uid: A }).names.includes('ゴースト2') && R({ a: 'room', uid: A }).online >= 2);
console.log(fail ? `FAILED ${fail}` : 'ALL PASS');
