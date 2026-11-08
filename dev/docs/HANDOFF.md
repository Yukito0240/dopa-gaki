# HANDOFF — 引き継ぎ
最終更新: 2026-11-09 / v1.0.43・記録サーバー v6（前の長い HANDOFF は GitHub の dev/docs/HANDOFF_archive_v1.0.35.md）

## 現在地
- ゲーム名「D.O.P.A. - G.A.K.I.」（Devastating Overmatch Power Against Generating Artificial Killing Intelligence／対生成型殺傷人工知能超絶破壊的圧倒火力）。旧名 BREAKTHROUGH
- スマホ縦・1タップ砲撃・2分の3D破壊ゲーム。単一HTML（Three.js 0.170＋Rapier 0.14＋Web Audio）。自己テスト 202/202 PASS（関数 347）、記録サーバーの模擬テスト 30項目 ALL PASS
- ステージ: 前哨基地・要塞・市街地・空軍基地・海軍基地・襲来（ゾンビの群れ）。兵器9種＋FEVER、クリア後のリプレイ（4視点）、メニューBGM（ユーザーの曲）、サウンドルーム（v1.0.38）
- 公開先は2つ
  - GitHub版（本番・試験用）: https://yukito0240.github.io/dopa-gaki/ ＝ リポジトリ Yukito0240/dopa-gaki の index.html。オンライン記録あり
  - claude.ai版: https://claude.ai/artifact/FfXunUoJ7HLc7MhpuxdxSj（版63）。CSPで外へ送れないのでオンライン記録は出ない（claude.ai の仕組みで作る案はユーザー判断で見送り）
- オンライン記録（GitHub版）: Google Apps Script＋スプレッドシート（記録サーバー v6、ユーザーのGoogleドライブ。URLは dev/server/url.txt）
  - コールサイン（端末IDにひも付け・変更1回）、個人の記録、ステージ別ランキング（タイム/スコア/クリア回数×全体/部屋）、部屋の集計、今プレイ中の人数
  - 部屋: 最初は 3TFS。公開／非公開（一覧に出ない）＋入室コード（任意、SHA-256で保存）。作った人が部屋長
  - ティッカー: 同じ部屋の出撃・クリア・撤退を無線ふうに流す（プレイ中は兵器ボタンの上に小さく）。僚機の数
  - v6（通信の軽量化）: 今いる人・出撃・結果は CacheService の部屋ごとの一覧（キー L:部屋名）だけで扱い、hb・start はシートを読まない。最後に見た時刻のシート書き込みは1人5分に1回。人の名前と部屋もキャッシュ（p:uid）。bundle は「世代＋人」で20秒キャッシュし、記録・部屋が変わると bump で全員分を古くする。play の返事に bundle
  - v1.0.36（ゲーム側）: bundle を端末（localStorage bt_bundle_v1）に残し、記録画面は開いた瞬間に前回分を出して裏で更新（読めなくても消さない）。自分の結果は送った瞬間に「個人」へ足し、play の返事の bundle をそのまま使う
- v1.0.37: 遊び方・設定・⚙・遊び方のページ移動でも選択音。記録画面は上寄せ（個人・ランキング・部屋で見出しとタブの行が動かない）
- v1.0.43: 再生中の笛は B（普通の速さ）を初期に、最初の投弾から最終機までに散らした4本までを0.6倍の音量で
- v1.0.42: 再生中の爆弾の笛を見比べる「笛」ボタン（A一定・B普通・C鳴らさない・D速さに合わせる、初期はA）。襲来の最後の爆撃の再生で、笛が再生の速さに釣られて高さが揺れる件の対策
- v1.0.41: 大砲の排出音・装填音とも M119 の動画の音（調整台の値、155mm と 203mm で間合いと高さが違う）
- v1.0.40: 爆弾の笛は鳴っている間もゲームの速さに合わせる（スローでずれない）／装填音を M119 の装填の動画の音に（撃った直後は今の排出音）／笛を5本×+3半音×±2.25半音に／サウンドルームに空爆の通常・スロー・援軍8機
- v1.0.39: ブリーフィングの間は画面を引いて上へずらし印が説明の箱に重ならない／大砲の最後の金属音（152mm の装填の動画）と爆弾の落下の笛（爆弾の動画の笛5本）を調整台で決めた値で
- v1.0.38: 再生で視点を替えても爆弾の跡・黒煙が先に出ない／襲来の援軍は外側の2機から内側へ・先の組ほど低い、再生は列の真ん中が中心／サウンドルーム（タイトルの「サウンド」、チェックで着弾音・無線なども）

## ファイルの置き場所（v1.0.35 で整理）
- **コードの正本は GitHub の dev/**（ナレッジは容量2MBを超えたので文書だけにした）
  - dev/index.html（正本）、dev/tests/run_test.mjs、dev/tools/build_artifact.py・build_pages.py・bgm_mix.py
  - dev/server/Code.gs（記録サーバー）・SETUP.md・gas_test.mjs（模擬テスト。v6 で CacheService の模擬とシートの読み書き回数の計測を追加）・url.txt
  - リポジトリ直下の server/Code.gs はユーザーが貼る用の写し（dev/server と同じものにする）
  - dev/docs/ にナレッジ文書の写し（HANDOFF・FUNCTIONS・DECISIONS・REMAINING_TASKS など）。ここを書き換えてから project_write の local_path でナレッジへ上げると、長い文書を書き写さずに済む
  - dev/assets/*.glb.txt（ゾンビ4体）・sfx/・icon/AppIcon-1024.png
- ナレッジ: HANDOFF / RULES / FUNCTIONS / DECISIONS / REMAINING_TASKS / SPEC / KNOWLEDGE_INDEX / PROJECT_INSTRUCTIONS

## 再開の手順（作業環境）
1. `add_repo`（Yukito0240/dopa-gaki、access: push）→ `git clone --depth 1 https://github.com/Yukito0240/dopa-gaki /home/claude/dopa-gaki`（タイムアウトは長めに）
2. 作業場所を作る: `/home/claude/breakthrough` に dev/ の中身をコピー（index.html・tests・tools・server・assets）
3. テスト環境: `/home/claude/testenv` に `npm i three@0.170.0 @dimforge/rapier3d-compat@0.14.0 playwright`（ブラウザは入っているので playwright install は不要）→ `NM=/home/claude/testenv/node_modules node tests/run_test.mjs`
4. 記録サーバーの模擬テスト: `cd server && node gas_test.mjs`
5. 公開
   - GitHub版: `python3 tools/build_pages.py` → dist/pages/index.html を dopa-gaki の index.html に、dev/ にも正本を写して commit・push（Pages は main / root）。push の前に `git fetch --depth 1 origin main && git rebase origin/main`
   - claude.ai版: `python3 tools/build_artifact.py` → dist/breakthrough.html を Artifact（url に上のリンク。新しい会話では先に action read で読む）で公開
   - 記録サーバーを変えた時: ユーザーに Code.gs を渡し「デプロイ → デプロイを管理 → 編集 → 新バージョン」（URLを変えない）。サーバーを先に、ゲームを後に
6. 作業の最後に dev/docs とナレッジの文書を更新

## 次にやること
0. 再生中の笛は B に決定（v1.0.43）。「笛」ボタンを外すか残すかはユーザーに確認
1. **記録サーバー v6 のデプロイ確認**（ユーザーに Code.gs を渡し済み。デプロイ後に実機で: 記録画面がすぐ出る・ティッカー・僚機の数・ランキングに結果がすぐ載る）
2. 実機で v1.0.38〜40 を確認（援軍の編隊と再生の視点、サウンドルームの空爆、装填音の 155mm/203mm の割り当て、笛の音量）
3. REMAINING_TASKS の残り（援軍の列を左右等間隔に、アイコンの本案、部屋の一覧の改善など）

## 音の調整台（v1.0.39）
- 調整台は排出・装填それぞれ素材を選べる（背景を削った／動画のまま／今のゲームの音／両方／なし）。iPhone で他の音やアラームの後に止まる件は、押した時に音の仕組みを戻す・戻らなければ作り直すで対処
- 「砲と爆弾の音 調整台」https://claude.ai/artifact/1ggK9SY3A9b5s7nxJo8CkU（動画の音をつまみで組み合わせる。高さと速さは別々に変わる WSOLA の伸び縮み）。元: スクラッチの audition/workbench.html（作業環境が消えたら作り直し）
- ゲームへの入れ方: 調整台と同じ stretch() で伸び縮み→Python の resample_poly で高さ→重ねて mp3 → window.SFX に埋め込み、dev/assets/sfx/n_*.mp3 にも置く。音量は調整台の値÷書き出しの正規化の倍率
- 素材: M119 の1秒動画（排出のかちゃ）と2秒動画（装填、2.4kHz の機械音を削った版）、152mm の装填の動画（v1.0.39 で使用、今は不使用）、爆弾の動画の笛（基音・2倍音・3倍音の帯だけ残し、2.15〜2.7秒の急な大きさはならした）

## ユーザーの進め方（必ず守る）
- 説明は日本語。回答の最後に【このチャットの消費トークン／残りトークン】
- 実装の前に方針を確認。**見た目は写真、音は試聴を見せてから入れる**（タイミングも）
- ユーザーはスマホで確認している。「聞こえない」は音量の話
- 電子音（矩形波・のこぎり波・三角波）を使わない
- 「待機して」→「待機します」とだけ返す

## 注意（失敗から）
- 行の途中に `// コメント` を入れると後ろの処理を飲み込む（何度も再発）。行の途中は必ず `/* */`。静的テストが検出する
- 粒子（Points）は「サイズ0」でもGPUが1ピクセルで描く。消した粒は画面外へ（v1.0.21 のチリ）。CPU側の数え上げでは見つからないので撮影して比べる
- スロー中に「毎フレーム確率」で出す演出は密に残る。発生は dt に比例
- 何度も呼ばれる関数（buildSettings など）で addEventListener しない（v1.0.29 視点ボタンの二重登録）
- 「読み込みを待ってもう一度呼ぶ」は、待った後に有無を確かめる（v1.0.28 Sound.sel が無限ループで画面が固まった）
- 埋め込み音を Sound.trim に通すと頭が削られる。ループ位置のある menu と落下音は trim しない
- テストの中で await すると前のテストの setTimeout（タイトル背景の切替）が走る。G.stage / G.state を戻す
- 「援軍の爆撃は群れの塊を…」のテストは乱数でまれに落ちる（合格は残り2体以下）。v1.0.38 の編隊で残りは0〜1体（前は0体）。狙いを早く決めすぎると群れが動いて増える
- 撮影（ヘッドレス）: 本番モードは描画が重い。stepN でゲーム時間を進め、重い処理中は NORAF で描画を止めた写しを使う。1スクリプト1ステージ。mp3 はヘッドレスで読めない。再生は GAME.updateReplay を手で回すと速い。GitHub版の撮影はコールサイン画面が出るので localStorage bt_name_v1 を入れる
- 撮影スクリプトで `pkill -f 名前` を使うと自分のシェルまで止まる
- 作業環境から script.google.com には届かない（プロキシで拒否）。記録サーバーの確認は gas_test.mjs の模擬と、ユーザーの実機で
- このセッションの GitHub は新しいリポジトリを作れない・Pages の設定APIも通らない（ユーザーに頼む）
- 破壊済みの塊の blockPos（剛体を消した後）を呼ぶと Rapier が落ちる。位置は壊す前に取る
- classList.toggle(名前, undefined) は反転になる。真偽は !! で
- 試聴で選んだ音は再現合成しない。音源を埋め込む
- v6: CacheService は1つの値が100KBまで・最長6時間。キャッシュが空でも動くように作る（デプロイ直後は「今プレイ中」が約1分0人に見える）。キャッシュは鍵を列挙できないので、まとめて古くするには世代（gen）をキーに入れる
- v6: 部屋を移る処理（join・mkroom）では前の部屋の一覧からも外す（残すと75秒「今いる」に数えられる）
- 記録画面の裏の読み直しが失敗した時に、出ていた記録を「読めませんでした」で上書きしていた（v1.0.36 で修正）。失敗の描画は、何も出ていない時だけ
- 再生中に爆発を再現すると、焦げ跡・煙の柱が「新しく」作られる。最初からやり直す処理（replayNextView など）では、再生中にできた物を必ず片付ける（v1.0.38）
- 新しいテストは、直す前のコードで落ちることを確かめる（v1.0.38 では再生の速さ sp が未定で再生が1歩も進まず、古いコードでも通っていた。`G.rp.sp || 1`）
- テストの後は G.stage を元に戻す（別のステージのまま次のテストに渡すと、次が前提を崩されて落ちる）
- 動画から取った素材は、編集で一時的に大きくなっている所がある。伸び縮みや重ねで目立つので、なだらかな大きさを超えた所をならしてから使う（v1.0.39 の笛の「ピュルリ」）
- 読み込んだ埋め込み音は Sound.trim で頭が削られる。間合いを決めた音（whistle5・load155・load203）は除外の一覧に入れる
- 音を「投下の瞬間に長さを決めて」鳴らすと、その後のスローや再生の速さの変化でずれる。鳴っている音は毎フレーム今の速さに合わせる（v1.0.40 Sound.followSpeed）
