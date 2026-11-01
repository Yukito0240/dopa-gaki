# KNOWLEDGE_INDEX — ナレッジ登録一覧と更新ルール
最終更新: 2026-11-01（v1.0.35 で整理: コードは GitHub へ移し、ナレッジは文書だけ）

## ナレッジ（claude.ai プロジェクト）
| ファイル | 役割 | 更新タイミング |
|---|---|---|
| HANDOFF.md | 現在地・再開の手順・次にやること・注意（最初に読む） | 毎チャット終了時 |
| RULES.md | 開発規約 | 規約を変えたとき |
| FUNCTIONS.md | コードの地図（関数一覧・版ごとの追加） | 関数を追加・変更したとき |
| SPEC.md | 仕様（版ごとの変更の要約） | 仕様が変わったとき |
| DECISIONS.md | 決定ログ（理由つき） | 決定のたび |
| REMAINING_TASKS.md | 残タスク | 毎チャット終了時 |
| PROJECT_INSTRUCTIONS.md | プロジェクトの指示文の案（設定画面に貼る用） | 進め方を変えたとき |
| KNOWLEDGE_INDEX.md | 本ファイル | 構成が変わったとき |

## GitHub（Yukito0240/dopa-gaki）
| 場所 | 中身 |
|---|---|
| index.html | GitHub版の公開ページ（build_pages.py の出力。記録サーバーのURL入り） |
| dev/index.html | ゲームの正本 |
| dev/tests/run_test.mjs | 自己テストの実行 |
| dev/tools/ | build_pages.py（GitHub版）・build_artifact.py（claude.ai版）・bgm_mix.py（BGM加工・保留中） |
| dev/server/ | Code.gs（記録サーバー v5）・SETUP.md・gas_test.mjs・url.txt |
| dev/assets/ | ゾンビの模型（*.glb.txt）・効果音の素材（sfx/）・アイコンの正本 |
| dev/docs/ | 古い HANDOFF の控え・参考動画の解析（REFERENCE_VIDEO.md） |
| server/・icons/ | 公開用の記録サーバーのコードとアイコン一式 |

## 更新ルール
- Claude がナレッジを直接上書きする（同じパスに書き込み＝置換）
- コードを変えたら dev/ にも写して commit・push する（正本は dev/index.html）
- 版の確認は index.html 冒頭の履歴、各MDの「最終更新」
