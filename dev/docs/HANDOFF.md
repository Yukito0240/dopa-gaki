# HANDOFF — 引き継ぎ
最終更新: 2026-11-01 / v1.0.35（前の長い HANDOFF は GitHub の dev/docs/HANDOFF_archive_v1.0.35.md）

## 現在地
- ゲーム名「D.O.P.A. - G.A.K.I.」（Devastating Overmatch Power Against Generating Artificial Killing Intelligence／対生成型殺傷人工知能超絶破壊的圧倒火力）。旧名 BREAKTHROUGH
- スマホ縦・1タップ砲撃・2分の3D破壊ゲーム。単一HTML（Three.js 0.170＋Rapier 0.14＋Web Audio）。自己テスト 192/192 PASS
- ステージ: 前哨基地・要塞・市街地・空軍基地・海軍基地・襲来（ゾンビの群れ）。兵器9種＋FEVER、クリア後のリプレイ（4視点）、メニューBGM（ユーザーの曲）
- 公開先は2つ
  - GitHub版（本番・試験用）: https://yukito0240.github.io/dopa-gaki/ ＝ リポジトリ Yukito0240/dopa-gaki の index.html。オンライン記録あり
  - claude.ai版: https://claude.ai/artifact/FfXunUoJ7HLc7MhpuxdxSj（版55）。CSPで外へ送れないのでオンライン記録は出ない
- オンライン記録（GitHub版）: Google Apps Script＋スプレッドシート（記録サーバー v5、ユーザーのGoogleドライブ。URLは dev/server/url.txt）
  - コールサイン（端末IDにひも付け・変更1回）、個人の記録、ステージ別ランキング（タイム/スコア/クリア回数×全体/部屋）、部屋の集計、今プレイ中の人数
  - 部屋: 最初は 3TFS。公開／非公開（一覧に出ない）＋入室コード（任意、SHA-256で保存）。作った人が部屋長
  - ティッカー: 同じ部屋の出撃・クリア・撤退を無線ふうに流す（プレイ中は兵器ボタンの上に小さく）。僚機の数
  - 記録画面は bundle 1回でまとめ読み

## ファイルの置き場所（v1.0.35 で整理）
- **コードの正本は GitHub の dev/**（ナレッジは容量2MBを超えたので文書だけにした）
  - dev/index.html（正本）、dev/tests/run_test.mjs、dev/tools/build_artifact.py・build_pages.py・bgm_mix.py
  - dev/server/Code.gs（記録サーバー）・SETUP.md・gas_test.mjs（模擬テスト）・url.txt
  - dev/assets/*.glb.txt（ゾンビ4体）・sfx/・icon/AppIcon-1024.png
- ナレッジ: HANDOFF / RULES / FUNCTIONS / DECISIONS / REMAINING_TASKS / SPEC / KNOWLEDGE_INDEX / PROJECT_INSTRUCTIONS

## 再開の手順（作業環境）
1. `add_repo`（Yukito0240/dopa-gaki、access: push）→ `git clone --depth 1 https://github.com/Yukito0240/dopa-gaki /home/claude/dopa-gaki`
2. 作業場所を作る: `/home/claude/breakthrough` に dev/ の中身をコピー（index.html・tests・tools・server・assets）
3. テスト環境: `/home/claude/testenv` に `npm i three@0.170.0 @dimforge/rapier3d-compat@0.14.0 playwright`（ブラウザは入っているので playwright install は不要）→ `NM=/home/claude/testenv/node_modules node tests/run_test.mjs`
4. 記録サーバーの模擬テスト: `cd server && node gas_test.mjs`
5. 公開
   - GitHub版: `python3 tools/build_pages.py` → dist/pages/index.html を dopa-gaki の index.html に、dev/ にも正本を写して commit・push（Pages は main / root）
   - claude.ai版: `python3 tools/build_artifact.py` → dist/breakthrough.html を Artifact（url に上のリンク）で公開
   - 記録サーバーを変えた時: ユーザーに Code.gs を渡し「デプロイ → デプロイを管理 → 編集 → 新バージョン」（URLを変えない）。サーバーを先に、ゲームを後に
6. 作業の最後に dev/ とナレッジの文書を更新

## 次にやること
1. **通信の軽量化**（ユーザー希望。v1.0.36 から）。案と期待効果
   - hb（30秒ごと）をシートから切り離す: 今の人数・出撃・結果を CacheService だけで扱い、lastSeen の書き込みは間引く
   - ベスト記録の表（人×ステージ）を play のたびに更新し、ランキングは全記録を数え直さない
   - ランキング・部屋の集計を部屋ごとに10〜20秒キャッシュ
   - 前回の bundle を localStorage に残して開いた瞬間に表示（裏で更新）、自分の結果は送った瞬間に反映
   - play の返事に最新の bundle を入れて通信を1回減らす
   - さらに速くするなら Firebase（即時通信）へ。今は GAS のまま
2. REMAINING_TASKS の残り（アイコンの本案、部屋の一覧の改善など）

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
- 「援軍の爆撃は群れの塊を…」のテストは乱数でまれに落ちる。もう一度回すと通る
- 撮影（ヘッドレス）: 本番モードは描画が重い。stepN でゲーム時間を進め、重い処理中は NORAF で描画を止めた写しを使う。1スクリプト1ステージ。mp3 はヘッドレスで読めない
- 撮影スクリプトで `pkill -f 名前` を使うと自分のシェルまで止まる
- 作業環境から script.google.com には届かない（プロキシで拒否）。記録サーバーの確認は gas_test.mjs の模擬と、ユーザーの実機で
- このセッションの GitHub は新しいリポジトリを作れない・Pages の設定APIも通らない（ユーザーに頼む）
- 破壊済みの塊の blockPos（剛体を消した後）を呼ぶと Rapier が落ちる。位置は壊す前に取る
- classList.toggle(名前, undefined) は反転になる。真偽は !! で
- 試聴で選んだ音は再現合成しない。音源を埋め込む
