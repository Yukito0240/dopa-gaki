# dev — 開発用の正本
- `index.html` がゲームの正本。公開ページは `tools/build_pages.py`（GitHub版）・`tools/build_artifact.py`（claude.ai版）で作る
- テスト: `npm i three@0.170.0 @dimforge/rapier3d-compat@0.14.0 playwright` → `NM=<node_modules> node tests/run_test.mjs`
- 記録サーバー: `server/Code.gs`（GAS）、模擬テスト `node server/gas_test.mjs`
- 引き継ぎ・規約・関数の地図は `docs/`（claude.ai プロジェクトのナレッジと同じもの）
