# FUNCTIONS — コードの地図（最新 v1.0.38 の変更は「v1.0.36〜38」の節。冒頭の表は index.html v0.7.5, 2405行 時点。旧: 1819行。末尾1行は埋め込み音 window.SFX）
新しい関数を作る前にここを確認。行番号は目安（検索は関数名で）。

## 定数・状態
| 名前 | 内容 |
|---|---|
| CFG | 時間・重力・要塞位置・砲兵配置(battery, batteryScale)・ドット(pixel)・誘爆(tankBoom)・照準・カメラ(cam)・HP・密度・AI・工兵(workers)・揺れ・物理・煙(fx)・色(palette) |
| WEAPONS / widx(id) / NW / BTN_ORDER | 兵装9種（v0.5.0: GUN76=番号7を追加。ボタン順は BTN_ORDER）。 兵装8種（id,label,sub,type: shell/rocket/auto/rail/vls/air, speed, reload, count, interval, radius, damage, impulse, spread, arc, fire=発射音, boom=着弾音, muzzle, uses, mag, rate, pierce, alt…）/ id→番号 / 数 |
| SET / reloadOf(wi) | ユーザー設定（reloadMul, repairMul, workers, time, pixel, volume, shake。端末保存）/ 設定倍率込みの装填時間 |
| window.SFX | 埋め込み効果音（base64 mp3: boom, cannon, blast, debris, heavy, gun, amb）※ファイル末尾 |
| G | ゲーム状態（state: title/play/win/lose/test, time, timeScale, stats{shots,destroyed,kills}, noSpread） |
| AI | 防衛AI状態（res, timer, heat[], log[], stats, enabled, spawnT, spawnOn） |
| player / guns / bombers / cam | 射撃状態（weapon, reload[], burst[], pending[], uses[], mag{兵装:残弾}, cool{兵装:冷却}, hold）/ 自軍6両 / 飛行中の爆撃機 / カメラ |
| timers / PIX / KIND_COL / PG | 遅延実行 / ドット描画（rt, mat）/ 構造物の基本色 / 部品ジオメトリ生成 |
| blocks / slots / targets / shells | ブロック / 設計スロット（job付き）/ 目標 / 飛翔中の弾 |
| workers / jobs | 工兵一覧 / 作業依頼一覧 |
| MOBILE, glowPts, impactRing | タッチ端末判定 / 結晶の発光点 / タップ地点の六角マーク |

## Sound（v0.3.0: 提供効果音＋合成の下支え。電子音禁止＝osc は sine のみ）
| 関数 | 役割 |
|---|---|
| init / ok / setMute / loadSamples | 初期化 / 再生可否 / 消音 / 埋め込み音のデコード（Sound.ready） |
| makeNoise / makeImpulse / bus / env / osc / noise / trim | 部品（trim=先頭の無音を除去）。v0.4.0で sub（合成低音＝「ぽん」の原因）は廃止 |
| play(name, opt) / far(dist) | 効果音再生（rate, vary, vol, lp, pan, delay, wet, dur）/ 距離→遅延・こもり・音量 |
| fire(kind, dist, pan) | 発射音（f155/f203/f40/fRocket/fMortar/fRail/fVls） |
| boom(kind, dist, pan) | 着弾・爆破音（tiny/mid/big/huge/nuke） |
| collapse / whistle / jet / hammer / clunk | 倒壊 / 飛来音 / 爆撃機 / 工兵 / 装填 |
| startAmbience / startBattleBed | 風 / 遠い戦場（amb素材） |

## シーン
| 関数 | 役割 |
|---|---|
| buildSky / buildLights / buildTextures / canvasTex / speckle | 曇天の空 / 拡散光と影 / 手続きテクスチャ |
| terrainH / crystalDensity / buildTerrain | 地形高さ / 赤い結晶原の濃さ / 地形（灰＋赤の頂点色）＋物理地面 |
| hexPad(parent,r,h,x,z) | 六角コンクリ台座（赤縁） |
| buildProps | 結晶群(InstancedMesh)・発光点・遠景廃墟・対戦車障害物・司令部台座 |

## FX
| 関数・クラス | 役割 |
|---|---|
| ParticlePool(spawn/update) / DebrisPool(spawn/update) | 煙・火の粒子 / 瓦礫 |
| buildFX / updateFX | 生成 / 更新 |
| fxRing / fxFlash / fxMuzzle(p,dir,k) / fxExplosion / fxBlockBreak / fxHolo(b) | 衝撃波 / 閃光 / 発射（k=規模）/ 爆発 / 崩壊 / 修理・完成の光 |
| fxBeam / fxNuke / fxScorch | レールガンの光線 / VLSのキノコ雲 / 地面の焦げ跡 |

## ブロック・要塞
| 関数 | 役割 |
|---|---|
| boxGeo / part / mergeParts / shade | 箱キャッシュ / 部品配置 / 部品結合（1ブロック=1メッシュ）/ 色の明暗 |
| blockGeo(kind,size,v) / blockMat(kind) | 種類別の作り込み形状（concrete, barrier, sandbag, slab, armor, core, tower, antenna, tank, container, radar ＋ v0.5.0: floor（v0.5.1: v=様式×100＋最上階10＋1階20＋色。様式0オフィス=ガラス・桟・角柱・ロビー/1マンション=バルコニー・室外機/2雑居=枠付き窓・袖看板・店）, house, roof, ware, deck, pier, car）/ 頂点色マテリアル |
| aimPoint(x,y) | v0.6.0: タップ位置の照準点（近くに動く敵機があれば leadPoint、なければ screenToWorld）。handleTap と長押し連射が使用 |
| arcClear(from,to,sol,v) / pickArc(m,t,w) | v0.5.2: 弾道の途中（85%まで）が地面の上を通るか / 低伸が地面に阻まれるなら曲射を選ぶ（aimGun・fireOne が使用） |
| createBlock / blockPos / destroyBlock / wakeNear / damageBlock / syncBlocks | 生成（b.v を保存）・位置・破壊・起こす・ダメージ（v0.5.1: HP50%未満で損傷表示）・同期 |
| DMG / dmgMat(kind) / setDamaged(b,on) / updateDamaged(dt) | v0.5.1: 損傷した塊の一覧（最大 CFG.dmg.max）/ 焦げたマテリアル / 損傷表示の切替（修理で戻る）/ 煙と火の粉 |
| buildFortress / addTarget / addFortifySlot | 要塞配置（コンテナ・燃料タンク・レーダー含む）/ 目標 / 増設予備スロット |

## 防衛AI
| 関数 | 役割 |
|---|---|
| aiHeat / slotFree / slotSupported | 脅威度 / 空き判定（形状交差）/ 下支え判定 |
| aiUpdate / aiExecute / aiLog | 採点 → 作業依頼（工兵に割当）→ ログ |

## 工兵（v0.2.0）
| 関数 | 役割 |
|---|---|
| workerHome / buildBarracks | 出現地点 / 兵舎（固定コライダー） |
| buildWorkerMesh / workerPose / spawnWorker | 関節付きの体 / 姿勢（idle/walk/work/kneel）/ 1体出す |
| workerStand / workerPath | 作業位置 / 経路（外壁の端を回る・司令部を迂回） |
| assignJob / nearestIdle | 割当 / 手の空いた最寄りの工兵 |
| makeGhost / endJob / completeJob / workTick | 足場 / 終了処理 / 完成 / 作業中の動作 |
| killWorker / updateWorkers | 吹き飛ばす / 毎フレーム更新（出現・移動・作業・死亡） |

## 砲兵・兵装（v0.3.0）
| 関数 | 役割 |
|---|---|
| buildVehicle / poseVehicle / gunOf | 自軍6両の生成 / 姿勢・リコイル / 兵装→車両 |
| solveBallistic / muzzlePos(wi) / aimGun | 弾道解 / 発射点 / 照準設定 |
| updatePlayer / tryFire(target) / autoFire(target,n) / fireOne(wi,target) | 毎フレーム / 射撃要求 / 40mm連射 / 1発発射 |
| fireRail / launchVLS / launchAir / updateBombers | レールガン貫通 / 巡航ミサイル / 空爆 / 爆撃機の投下 |
| launchShell(w,p,v,kind) / updateShells / explode | 弾（shell/mortar/tracer/rocket/missile/bomb）/ 弾道＋命中 / 範囲ダメージ・工兵撃破・演出・爆破音 |

## ステージ・地形（v0.5.0）
| 関数・定数 | 役割 |
|---|---|
| STAGES / loadStage(id) / selectStage(id, play) | ステージ定義（goal: targets/ratio、ai、gnd=高さ表、h/wild/tint、cam、statics、build）/ 静的物の作り直し（STG.root, STG.bodies）/ 選択して出撃 |
| STG / groundY(x,z) / groundColor | 現ステージの静的物・高さ表・水面 / 地面の高さ（双線形補間）/ 頂点色 |
| buildTerrain(st) / buildProps(st) | 遠景の大平面＋詳細地形（heightfield物理）/ 結晶・廃墟・障害物（市街地は外周のみ） |

## 市街地（v0.5.0）
| 関数・定数 | 役割 |
|---|---|
| CITY | 川(riverZ, riverW, bank, bed, water)・崖(cliffZ, upper)・砲兵の丘(ridge)・外周(edgeX/Z)・橋・区画(rows, cols) |
| cityH / cityRamp / cityHill / cityWild / cityPark / cityTint / cityRoads | 高さ（崖・坂道・丘・川の溝）/ 坂道 / 外周の丘 / 荒野らしさ / 公園 / 地面の色 / 道路一覧 |
| buildCityStatic | 道路・歩道・白線・擁壁・階段・川面・街灯・木（InstancedMesh） |
| buildCity | 高層ビル（各階を塊で）・ランドマーク塔・家（壁＋屋根）・商店・倉庫・橋（桁＋脚）・車 |
| cityRatio | 破壊率（壊れた・崩れ落ちた・ずれた塊の体積比） |
| TREES / resetTrees / setTreeMatrix / hitTrees / updateTrees | 木の状態 / 立て直し / 傾き / 爆風で倒す・焦がす / 倒れるアニメ |
| crashDamage | 落下した塊が強く着地したら自分と真下を傷める（連鎖崩壊） |
| fxSplash | 川への着弾の水柱 |

## フィーバー（v0.5.0）
| 関数 | 役割 |
|---|---|
| addFever / startFever / updateFever | ゲージ加算（破壊・撃破）/ 発動（装填ほぼゼロ・速射が速い）/ 時間経過と画面縁の演出（v0.5.1: SET.feverAlways なら常に発動中） |

## ドット絵風フィルター
| 関数 | 役割 |
|---|---|
| buildPixelPass / resizePixel / renderFrame | 低解像度の描画先＋仕上げシェーダー（輪郭線・色数削減・ディザ）/ 解像度更新 / 描画 |

## カメラ・入力
| 関数 | 役割 |
|---|---|
| addTrauma / panFor / updateCamera | 揺れ / 音のパン / 斜め見下ろし固定（縦横比で距離調整） |
| showMarker / updateArc | タップ地点マーク / マークのフェード |
| screenToWorld（v0.5.0: 当たらなければ地面の高さに沿って探す）/ handleTap / buildButtons / selectWeapon / bindInput | 画面→地上座標 / タップ射撃 / 兵装ボタン生成 / 兵装切替 / ポインタ（40mm長押し）・ピンチ・キー |

## 進行・HUD・起動・テスト
| 関数 | 役割 |
|---|---|
| later / updateTimers | 遅延実行 |
| startGame / resetGame / checkTargets / endGame / update | 開始 / 初期化 / 目標判定（コアはHPのみ）/ 勝敗 / 1フレーム進行 |
| fmtTime / flashMsg / updateHUD / frame / boot | 表示 / メッセージ / HUD（変化時のみ書換）/ 描画（一時停止対応）/ 起動 |
| scoreOf / isCustom / loadRecords / saveRecord / recordsHtml | 記録（端末保存 bt_records_v1、ステージ別上位10件） |
| SET_ROWS / loadSettings / saveSettings / applySettings / buildSettings / openSettings | 設定画面（bt_settings） |
| showOverlay / showTitle / bestText | タイトル（ステージカード）・結果画面 / ベスト記録の一言 |
| buildMarkers / updateMarkers | 目標マーカー（名前＋HPバー、画面外は端に） |
| stepN / stepUntil / fireAt / runTests | 固定dt更新 / 条件まで更新 / 即時射撃 / 自己テスト55項目 |
| window.GAME | テスト・デバッグ用API（THREE, camera, workers, handleTap など） |

## 廃止した関数
- v0.4.0: Sound.sub（合成のサブ低音）
- v0.3.0: Sound.fireHowitzer / Sound.rocket / Sound.explosion → Sound.fire / Sound.boom（提供素材）
- v0.2.0: Sound.build / Sound.ui / Sound.startEngine / Sound.setEngine（電子音・エンジン音の廃止）→ hammer / clunk / startAmbience / setMute に置換

## 空軍基地（v0.6.0）
| 名前 | 役割 |
|---|---|
| CFG.air | 敵機の数値（first/interval=出発、hp、taxi/acc/vRot=地上、speed/turn/climb/alt/alt2=飛行、orbitR/center/loiter=旋回、away=逃走判定、proxR/airMul=近接信管と飛行中の脆さ、tapR=タップ判定、gap=誘導路の車間、scoreGround/scoreAir、boom=機体の爆発） |
| AIRB | 配置（滑走路 rwyZ/rwyW/seg/n、誘導路 twZ、エプロン apronZ、格納庫、管制塔 tower/ops、レーダー、停止線 holdX、浮上点 liftX、外周 edgeX/edgeZ、兵舎 home、駐機と出発順 spots） |
| PLANES / PLANE_GEO / PLANE_MAT・WRECK_MAT | 敵機の一覧 / 形のキャッシュ / 機体と残骸のマテリアル |
| airHill / airH / airWild / airTint | 外周の丘 / 高さ（砲兵の丘は CITY.ridge を共用）/ 荒野らしさ / 地面の色 |
| buildAirbaseStatic | 路肩・誘導路・エプロン・標示・停止線・滑走路灯・進入灯・柵・吹き流し（静的） |
| buildAirbase | 滑走路22区画（固定・工兵が再建）、格納庫3棟×3区画、管制塔（cab=目標）、レーダー（目標）、燃料タンク、弾薬コンテナ、駐機6機 |
| planform / planeGeo / planeMat / makePlane / syncPlane / clearPlanes | 翼の板 / 機体の形（f=戦闘機 c=輸送機）/ マテリアル / 1機置く（戦闘機は噴射炎）/ メッシュ同期 / 全消去 |
| planeActive / planeAir / planesDone / wrapA | 未処理か / 飛行中か / 全機処理済みか / 角度の正規化 |
| rwyOk / runwayClear | その位置の滑走路が無事か / 滑走区間がすべて無事か |
| startTaxi / damagePlane / killPlane / hitPlanes / proxPlane | 誘導開始 / ダメージ / 撃破（飛行中=墜落、地上=爆発して残骸）/ 爆風 / 近接信管 |
| planeAt / leadPoint / flySteer / predictPlane | 画面上の敵機 / 未来位置（旋回も再現）/ 飛行の1ステップ（予測と共用）/ T秒後の位置 |
| updatePlanes | 出発→誘導路（車間）→停止線（穴があれば待つ）→滑走（穴で大破）→離陸→旋回 loiter 秒→逃走、墜落・残骸の煙 |
| blockGeo: rwy / hangar / ctower / cab | 滑走路の区画（v=1 進入端）/ かまぼこ形格納庫（v=1 正面、v=2 背面）/ 管制塔の塔身 / 管制室 |
| STAGES.airbase | home（兵舎）・hint（開始時の案内）を持つ。workerHome / workerStand / workerPath は home があれば直行 |

## v0.6.1 追加
| 名前 | 役割 |
|---|---|
| CFG.cam.holdDelay | 長押し連射が始まるまでの時間（0.15秒。それより早い横ドラッグは視点移動） |
| KIND_LABEL | AIログの表示名（ビル・家・橋桁…） |
| nWorkers() | ステージの工兵の数（STAGES.workerK があれば設定×k。市街地は2/3） |
| cityPath(from,to) | 市街地の工兵の経路（南・河川敷・上段の間は近い方の橋と坂道を通る） |
| cityRatio | スロット単位の破壊率（再建されると戻る） |
| arcClear(…, blk) / pickArc | blk=true で手前の建物も判定（目標の4m手前まで）。STAGES.autoArc のステージ（市街地・空軍基地）だけ |
| onRunway / wreckAt / addWreckJob / clearWreck | 滑走路上か / 区間に残骸があるか / 残骸を撤去対象のスロットに / 撤去完了 |
| AIの作業 clear | 残骸の撤去（CFG.workers.workClear 秒。残骸が小さくなっていく）。AI.stats.clear |
| STAGES.city | ai:true・home=CITY.home（河川敷公園の資材置き場）・workerK・autoArc。スロットに city/vol を持たせ工兵が再建 |
| AIRB（拡大） | 滑走路28区画・幅11、格納庫5棟、駐機8機、ridgeZ（砲兵の丘）、fenceZ/fenceX、depotZ。砲兵は batteryDZ 30 |

## 海軍基地（v0.7.0）
| 名前 | 役割 |
|---|---|
| CFG.navy | 出航（first/interval）、acc・gap（車間）、dive（潜航までの秒）、sinkRate・breakChance（沈没・折れる確率）、scoreIn/scoreOut、tapR、smoke、boom（誘爆）、spec（d駆逐艦/fフリゲート/t輸送船/s潜水艦: L・B・top・speed・turn・hp） |
| NAVB | 配置（shoreZ岸壁、water海面-1、bed海底-7、piers桟橋x、pierEnd、berthZ、channelZ水路、breakZ防波堤、mouth/mouthX港口、outZ港外判定、away逃走、westX/eastX、ridgeZ、home、berths[外,内]、order出航順） |
| SHIPS / SHIP_GEO / SHIP_MAT・SHIP_WRECK | 敵艦 / 形のキャッシュ（front=船首側・back=船尾側）/ マテリアル |
| navLand / navHill / navH / navWild / navTint | 陸地 / 両脇の丘 / 高さ / 荒野らしさ / 地面の色 |
| buildNavalStatic | 岸壁・係船柱・レール・桟橋3本・防波堤＋消波ブロック・灯台・ブイ・海面（STG.water）。桟橋・防波堤・岸壁は当たり判定あり |
| buildNaval | 司令部（3階建て、最上階が目標）、沿岸レーダー（目標）、クレーン3基、乾ドック、燃料タンク、弾薬庫、倉庫（工兵が再建）、艦6隻（桟橋ごとに内側・外側を横付け） |
| hullHalf / hullOutline / shipGeo / shipMat / makeShip / syncShip / clearShips | 船体の幅 / 輪郭 / 艦の形（前後2分割）/ マテリアル / 1隻置く / 揺れ・向き / 全消去 |
| shipActive / shipHittable / shipsDone / canSail / startSail | 未処理か / 当たるか（潜航中は×）/ 全艦処理済み / 出航できるか（内側は外側の後、外側が桟橋で沈むと閉じ込め）/ 出航 |
| shipLocal / shipHit / hitShips / damageShip / sinkShip / shipAt | 艦の座標へ / 船体内の判定 / 爆風 / ダメージ / 撃沈（港内1200・港外1800、誘爆で折れる）/ タップ判定 |
| updateShips | 出航の順番→水路→港口→外洋（港外でボーナス対象、潜水艦は潜航）→逃走。撃沈は傾いて沈み、折れた艦は船首と船尾が立つ |
| updateShells（v0.7.0） | 船体に当たる・海面（川面）で炸裂 |
| screenToWorld（v0.7.0） | 水の下を指したら水面を返す |
| leadPoint / aimPoint（v0.7.0） | 艦は等速で見越し、艦の近くのタップは艦を狙う |

## v0.7.1 追加・変更
| 名前 | 役割 |
|---|---|
| CFG.charges | 障害物越しに試す装薬（弾速の倍率 0.9〜0.55） |
| pickArc | 低伸が阻まれたら装薬を減らした低伸（中くらいの弾道）を順に試し、駄目なら真上の曲射。返す sol.v＝弾速（fireOne が使う） |
| updateMarkers / buildMarkers | 画面外（カメラの後ろも）の目標は端に寄せ、黄色枠＋矢印（◀▶▲▼）。.mk の先頭 s 要素が矢印 |
| startSail / updateShips | 最初の点は艦尾が桟橋を抜けるまで直進（2mまで寄る）、曲がり角の点を追加、曲がるときは減速 |
| NAVB（変更） | channelZ -100・breakZ -124・outZ -128（水路を広げた） |

## v0.7.2 追加・変更
| 名前 | 役割 |
|---|---|
| Sound.tail / Sound.majestic / boom('bomb') | 空爆の締め（低く伸ばした爆破音＋低域ノイズの地鳴り約4秒）/ VLSの余韻（こだま3回＋深い地鳴り約5秒）/ 空爆1発（短く重ねて「どどどど」） |
| updateBombers（変更） | 最後の1発の落下時間後に Sound.tail（G.stats.tails） |
| CFG.loupe / updateReticle / renderLoupe / LCAM | 拡大の吹き出し（大きさ・指から上の距離・倍率）/ 照準・ロック枠・見越し点・吹き出しの位置（player.aimP・aimObj・loupe）/ 狭い画角で狙いを写し画面の一部に重ねる / その用のカメラ |
| updatePlayer（変更） | 長押し中の狙い（player.aimP・aimObj）を保存 |
| bridgeOk / cityReach / cityPath（変更） | 橋桁がすべて無事か / 工兵が行けるか（川の南は無事な橋が要る、橋は北岸から）/ 無事な橋を選び、渡る橋を path.bx に。壊れたら updateWorkers で引き返す |
| shipRoute / lineTo / routeStep / routeAt | 角を半径 NAVB.turnR で丸めた航路 / 直線の点 / 航路を進む / 先の点を見る |
| startSail / updateShips（変更） | 航路の上を進み、先の曲がりを見て減速、舵は0.6rad/秒まで、旋回の外側へ傾く、艦首・艦尾の航跡 |
| NAVB（変更） | channelZ -115・turnR 18・ridgeZ [20,24]。砲兵は batteryDZ 34 |

## v0.7.3 追加・変更
| 名前 | 役割 |
|---|---|
| Sound.fall / Sound.incoming | 爆弾の落下音（細い帯域ノイズの「ヒューー」、2発に1つ・音程をずらす）/ ミサイルの突入音（「ゴォォ」が高く大きくなり着弾で最大） |
| updateBombers / launchVLS（変更） | 落下音（G.stats.falls）/ 突入音（G.stats.incoming） |
| updateShips（変更） | 船首は常に航路の接線（1m先）。航路の角は48分割 |
| updateWorkers（変更） | 市街地で川の上を歩くときは、前後2点の真下へのレイで橋桁・橋脚の上面に乗る |

## v0.7.4 追加・変更
| 名前 | 役割 |
|---|---|
| CFG.combo / addCombo / updateCombo / slowMo / frameScale / updateComboHUD | 連鎖コンボの数値 / 続けて壊すと加点（destroyBlock・killWorker・killPlane・sinkShip から呼ぶ）/ win秒で途切れる / 一瞬のスロー（節目・燃料タンク誘爆・VLS・艦の誘爆）/ frame の時間倍率 / 「×n COMBO」表示（#combo） |
| G.combo / G.slowT / G.stats.comboBonus | コンボの状態（n・残り秒・最大）/ スローの残り（実時間）/ 加点（scoreOf に加算、記録に combo） |
| startSail / shipRoute（変更） | 直進（艦尾が桟橋を抜ける深さを計算）→港口へ斜め→港口で南。角は本物の円弧（半径 turnR、脚が短ければ縮める） |
| buildWake / updateWake | 白波の帯メッシュ（艦首のV字2本＋艦尾の泡。CFG.navy.wakeN 点・wakeDt 秒ごと）と艦首の水しぶき |
| NAVB（変更） | turnR 40・gateZ -148（港口の手前の点）・breakZ -160・mouth [40,76]・outZ -165・away -300 |
| 海軍基地のカメラ（変更） | targetZP -58・fitHalfW 54・maxDist 290（防波堤と砲兵が両方入る） |
| CFG.navy.acc（変更） | 0.5 m/秒²（ゆっくり加速して定速） |

## v1.0.42 追加・変更（最新 v1.0.42、関数 347）
- rpSpeed(rp, t)（新）: 再生の時刻 t の速さ（updateReplay の式を取り出した）。rpReal(rp, a, b)（新）: 再生の時刻 a〜b にかかる実際の秒
- rpFall(rp, dur, p)（新）: 再生中の爆弾の笛。G.rpWh＝0:A 着弾までの実際の秒に合う一定の速さ／1:B 普通の速さ／2:C 鳴らさない／3:D 速さに合わせる（v1.0.40 の動き）。CFG.rpWhistle（表示名）
- Sound.bombFall(dur, dist, pan, fix): fix={delay, rate} で固定（followSpeed が触らない）。Sound.stopFalls()（新）: 鳴っている笛を止める（replayNextView から）
- 再生の画面に #rpWh「笛」ボタン（押すと鳴らし方を替えて再生を最初から）。setViewBtn が表示を更新

## v1.0.41 変更（関数 344）
- CFG.mech: HOWITZER=['ejectM119' 0.30秒 音量0.592]+['loadM119' 1.30秒 0.169]、HEAVY=['ejectM119' 0.50秒 0.774]+['loadM119b' 1.75秒 0.316]。eject1 は大砲では使わない
- window.SFX: ejectM119（M119 の1秒動画の排出音）・loadM119（2秒動画の後半 +2.5半音）・loadM119b（同 +1半音）。trim しない一覧にも追加

## v1.0.40 追加・変更（関数 344）
- Sound.followSpeed(k)（新）: 鳴っている爆弾の笛（Sound.falls）の再生速度を今のゲームの速さに合わせる。frame から毎回（再生中は rp.sp、サウンドルームのスローは G.sroomK、ほかは G.ts）。範囲 CFG.sfx.fall.slow [0.25, 2]
- Sound.bombFall(dur, dist, pan): dur はゲームの秒。始まりの遅れは今の速さで割る。slow 引数は廃止（再生の 'fall' 出来事も素の秒で呼ぶ）
- airDemo(mode)（新）: サウンドルームの空爆（n=通常 s=スロー CFG.sroom.slow 0.35 f=援軍8機）。ゲームと同じ Sound.radio・jet・bombFall・boom・tail
- CFG.mech: HOWITZER=['eject1' 0.45秒]+['loadM119' 1.3秒 音量0.513]、HEAVY=['eject1' 0.65秒]+['loadM119' 1.15秒 音量0.327]。load155・load203 は廃止
- window.SFX: loadM119（M119 の装填の動画）、whistle5（5本×+3半音×±2.25半音×0.25秒ずれ、2.65秒）に差し替え

## v1.0.39 追加・変更（関数 343）
- briefFit(top)（新）: ブリーフィングの間だけ camera.setViewOffset で画面を引いて上へずらし、目標・艦・敵機を説明の箱（.bbox の上端 top）より上に収める（G.briefView、G.stats.briefK＝倍率）。CFG.briefFit（m・pin・maxK）
- showBrief: 画面合わせの後に印（mkPins）を箱の前に入れる。updateCamera: G.state==='brief' なら G.briefView を当て、それ以外は clearViewOffset
- Sound.bombFall(dur, dist, pan, slow): 素材 whistle5（爆弾の動画の笛5本を重ねた2.6秒）を着弾の時刻に鳴り終わるよう（短ければ途中から、長ければ遅らせる）。slow=true（再生）は低く長く。CFG.sfx.fall { vol, wet, lp, slow, finK }（旧 low・n・small・rate・lead・gap は廃止）
- CFG.mech.HOWITZER / HEAVY: 最後の金属音 eject2 → load155 / load203（152mm の装填の動画、発射から2.0秒）。Sound.loadSamples: whistle5・load155・load203 は trim しない
- window.SFX に load155・load203・whistle5（元の mp3 は dev/assets/sfx/n_*.mp3）

## v1.0.36〜38 追加・変更（関数 342）
- v1.0.38 showSoundRoom（新）: サウンドルーム（タイトルの data-act=sound から。背景はタイトルのステージ、メニューBGMは止める）。G.sroomAll＝チェック「着弾音・無線なども鳴らす」
- v1.0.38 soundDemo(wi, all)（新）: 兵器の音をその場で鳴らす（ゲームと同じ Sound.fire・mechSound・railCharge、all なら Sound.boom、VLS は incoming、空爆は radio・jet・jetWhine・bombFall・tail）。CFG.sroom（dist・hitDist・hitT・radioT・airDrop・flash）
- v1.0.38 startFinale: 最初の組が出る時（clearT）に狙い8本をまとめて finaleTarget で決め、左右の一番外側の2機から内側へ（G.finale.waves）。組 k は alt＋k×altStep。CFG.horde.finale の alts は廃止→ altStep 6・gap 0.45（組の間隔）
- v1.0.38 explode: 援軍の再生の基準点 G.hordeHit.p は爆撃の列（G.finale.lines）の真ん中（時刻は最初の着弾）。beginReplay: 襲来は追う爆撃機を横の距離だけで選ぶ（真ん中の列の機）
- v1.0.38 fxScorch: 再生中（G.rp.phase==='play'）は作らない。replayNextView: FX.emit（煙の柱・燃え残り）も消す
- v1.0.37 showOverlay: 遊び方・設定・遊び方のページ移動（data-hp）で Sound.sel。buildSettings: ⚙でも Sound.sel。CSS: 記録画面（.recs、.cs 以外）は上寄せ、名前の行（h2）は高さ30px
- v1.0.36 NET.keep(j)（新）: bundle を覚えて端末（localStorage bt_bundle_v1）にも残す。NET.addMine(stage, rec)（新）: 送った結果を手元の「個人」へすぐ足す
- v1.0.36 NET.init: 保存した bundle を戻す。NET.play: 返事の bundle を keep（無ければ読み直し）。NET.prefetch: keep を使う。showRecords: 裏の読み直しが失敗しても出ている記録は消さない
- 記録サーバー Code.gs v6（新）: cacheGet / cachePut / cacheDel / bump（bundle の世代を進める）/ who（人のキャッシュ p:uid）/ liveGet / liveEdit（部屋の今の一覧 L:部屋名＝いる人 u・出撃 s・結果 r）。定数 SEEN_SEC 300・LIVE_TTL 21600・LOCK_MS 2000
- Code.gs v6（変更）: touch（一覧へ入れ、シートの最後に見た時刻は5分に1回）・hb / start（シートを読まない）・play（結果を一覧へ、bump、返事に bundle）・bundle（20秒キャッシュ、v: 6）・online(rm)・rooms・room・reg・mkroom・join・editroom（キャッシュを捨てる。部屋を移る時は前の部屋の一覧から外す）

## v1.0.32〜35 追加・変更
- showRoomForm(mode, o, done)（新）: 部屋を作る／部屋の設定（公開・非公開・入室コード）
- ticker / tickNext / tickText / wingLine（新）、NET.setRoom / NET.sortie（新）、NET.seen
- server/Code.gs v5: setup（3TFS 移行）/ setup4 / rooms / mkroom / join / editroom / start（新）、hb は starts・results も返す

## v1.0.31 追加・変更
- NET.prefetch / recPart（新）。showRecords はまとめ読みから即表示。CFG.net.stale / short
- server/Code.gs v2: load / bundle（新）、me・rank・room は読み込み済みデータを受け取れる

## v1.0.30 追加・変更
- NET（新）: init / on / call(a, q) / hb / start / play(stage, rec)。CFG.net { url, room, hb, timeout, give }
- showCallsign(back) / showRecords(tab, opt) / liveLine / esc / fmtT（新）
- showTitle: 初回はコールサイン、#live、記録ボタン。endGame: NET.play。boot: NET.start
- server/Code.gs（GAS）: route → reg / play / hb / me / rank / room。シート Players・Plays
- tools/build_pages.py（新）: GitHub Pages 用

## v1.0.29 追加・変更
- buildSettings: rpView は onpointerdown。showTitle: #hud を隠す

## v1.0.28 追加・変更
- Sound.sel: 読み込み後も buf.sel が無ければ再試行しない。AIR.spacing 6.5

## v1.0.27 追加・変更
- updateAAA: G.stats.shots が0で爆撃機もいなければ撃たない

## v1.0.26 追加・変更
- CFG.flare.vol は固定値（距離で下げない）

## v1.0.25 追加・変更
- タイトル h1.ttl / h2.ttl2 / .ttl3、<link rel=icon / apple-touch-icon>

## v1.0.24 追加・変更
- CFG.horde.finale.camAt [0,18,-180]・lookUp 3

## v1.0.23 追加・変更
- Sound.bedBus（新）: 背景音の音量。menuBgm で切り替え

## v1.0.22 追加・変更
- Sound.menuBgm(on)（新）: メニューBGM。CFG.bgm（vol・loop・fade・fadeIn）。SFX.menu
- Sound.flarePop(dist, pan, k): k<1（スロー）で低く長く。G.ts（frame で今の速さ）。再生の flare 出来事でも鳴らす

## v1.0.21 追加・変更
- clearFlash（新）: 衝撃波の輪と閃光を消す（resetGame・replayNextView）
- PVS: サイズ0の粒は画面外。Sound.flarePop: 試聴D。CFG.flare.pair（2発ずつの組の間隔）

## v1.0.20 追加・変更
- sightBlocked（新）: 真横の視点の遮り判定
- DebrisPool.update: trail/burn を dt 比例。rplFrame: sb（艦の折れ方）。beginReplay/updateReplay: 焦げ跡を rt で
- bestText: 襲来はスコア。Sound.flarePop: 低く短く

## v1.0.19 追加・変更
- Sound.revive / Sound.rebuild（新）。visibilitychange・pageshow・touchend でも
- updateReplay: flare / fall の出来事。frame の再生中に updateFlares
- showOverlay: data-act=again（再出撃）

## v1.0.18 追加・変更
- debrisGeosM / debrisGeosW / debrisPool / clearDebris / DEBRIS_KIND（新）。fxBlockBreak(p, size, color, kind)
- cityDecay（新）。cityHill に fbm
- replayStart: 候補は t.killT 順。explode: CFG.dmgSurf / dmgFloor
- buildButtons: --wc（CFG.wcat/wcol）

## v1.0.17 追加・変更
- vnoise / fbm（新）: hordeH・terrainH の小さな起伏
- startEmbark（新）・updateWorkers の sailor・killWorker の乗組員処理・NAVB.deckY・CFG.navy.crew
- topCam / rpBombs（新）: 真上視点・追っている列の爆弾。chaseCam は rpBombs を使う
- arcClear: 狙った建物への当たりは障害物にしない。startGame(go)

## v1.0.16 追加・変更
- GUIDE / guideBars / showHowto / seenBrief / markBrief / showBrief（新）。startGame は初回 showBrief（TESTMODE は除く）
- tgtRings（新）: buildMarkers から。updateMarkers が輪と▼を動かす
- FLARES / updateFlares（updateBombers の先頭）/ Sound.flarePop（新）
- finaleTarget（新）: 援軍の狙い。hitHorde: 援軍の時の吹き飛び。updateHorde: 援軍の間は遅く壁を越えない
- ruinTowers（新）: 遠景の廃墟ビル。hordeTint: 土の色
- updateShells: G.curShot。markHit: hit.shot。killHit: とどめの一撃

## v1.0.15 追加・変更
- loadClears / addClear / titleCycle（新）。selectStage は G.pick も設定
- launchAir: 行の数＝count/pair。updateBombers: 1行で pair 発を pairSep 間隔で投下、roll は side*bank
- replayStart: 襲来は G.lastRp だけ用意（自動の再生なし）

## v1.0.13 変更
- rplFrame: wa（工兵の w.g → [w, w.cur]）。updateReplay: 工兵の playAnim と mixer。endReplay: 死んだ工兵を die に
- chaseCam: 弾がない時は撃った側から。Sound.sel: Sound.selN も数える
- showOverlay: [data-stage] で Sound.sel(menuVol)

## v1.0.12 追加・変更
- replayInput(type, e, pts)（新）: 再生中の指の操作。CFG.rpCtl
- replayView: rp.user（yaw/pitch/zoom/px/py）を最後に足す
- bindInput: 再生中は replayInput に回す。縦ドラッグと2本指で cam.panZ（CFG.cam.panZ/panKZ）
- updateCamera: 注視点の z に cam.panZ

## v1.0.11 追加・変更
- chaseCam(rp) / rpVel(o)（新）: 「弾を追う」視点。replayView から呼ぶ。updateReplay は rp.A / rp.B を残す
- Sound.jetWhine(dur) / Sound.bombFall(dur, dist, pan)（新）。Sound.sel(v, L) は並びを渡せる
- replayStart: 襲来は G.lastRp だけ用意して false（RPL.frozen）。beginReplay: rp.air・rp.tv・rp.laneX、表示 FINAL STRIKE / AIR SUPPORT
- window.GAME に launchAir

## v1.0.10 変更
- Sound.radio: 交話開始音 rstart→交信（ザッのノイズはやめた）。Sound.boom('bomb'): CFG.sfx.bomb の heavy・debris を重ねる

## v1.0.9 追加・変更
- markHit(t, p, b, s) / killHit(t)（新）: 目標への命中を強さ付きで記録、壊れた時に直前 CFG.replay.killWin 秒の最も強い一撃を t.hit に
- startIntro / updateIntro / introView（新）: 襲来の開始演出（CFG.horde.intro）。tryFire は演出中 false、G.time は減らない
- rplHorde(A, B, k)（新）: 記録した群れを補間し HG.z を記録の配列に差し替えて drawHorde。endReplay で rp.hzLive に戻す
- setViewBtn / replayNextView（新）: 再生の視点切替（CFG.replay.views）。replayView は rp.view 0〜3
- rplFrame: 襲来は hz/hd/ha/ht、全ステージで bm（爆撃機の集合）を記録。keep の保持幅は襲来だと CFG.replay.horde.after
- replayStart: 襲来も G.hordeHit で再生（待ち horde.wait）。explode: 援軍の最初の爆弾で G.finale.hit / G.hordeHit
- shellFx: SHELL_FX の op / normal に対応。fireOne: CFG.railCharge が0なら溜めずに撃つ
- Sound.sel は G.stats.sel を数える。startFever・再装填完了でも Sound.sel

## v1.0.8 追加・変更
- Sound.clip(name, {off, rate, vol, dur, delay, wet, lp, pan})（新）: 素材の途中から高さ・長さを変えて鳴らす
- Sound.sel(v)（新）: CFG.sfx.sel の2段（前半を短く高く→後半を詰める）。selectWeapon・メニューのボタン（#overlay/#settings/#gear の click を捕まえる）・addFever の満タンの瞬間（G.stats.feverSnd）
- Sound.mechClips(M, dist, pan)（新）: CFG.mech の kind 'clips'（[素材, 遅れ, 高さ, 音量]）。Sound.brass(M, dist, pan)（新）: kind 'brass'（rate, n, vol, dur, jit, spread）
- Sound.radio()（新）: 空爆要請の無線（CFG.sfx.radio）。launchAir で襲来の援軍以外。G.stats.radio
- Sound.bgTick()（新）: startBattleBed から開始。プレイ中だけ CFG.sfx.bg の割合で遠い銃声・砲声・無線
- mechSound: kind clips / brass に対応。addFever: 満タンになった瞬間を検出
- window.GAME に beginReplay / updateReplay を追加（再生の長さの計測用）

## v1.0.7 追加・変更
- Sound.metal / railCharge / railRing / servo（新）。fire('fRocket') に点火のパチッ
- fireOne: レールは Sound.railCharge→CFG.railCharge 秒後に fireRail
- mechSound: kind servo / ring に対応（CFG.mech.MLRS / RAIL）
- explode: 爆弾は G.hitStop で一瞬止める（CFG.bombStutter）。目標から CFG.replay.nearTarget m 内の爆発は t.hit と RPL.keep
- rplFrame: RPL.keep の前後（pre+0.4〜after+0.6）は buf を過ぎても残す。replayStart の候補に keep を許す
- beginReplay: 空軍基地は rp.dir を自軍の兵器（guns の平均）の方向に

## v1.0.6 変更
- launchAir(w, t, from=230): 進入を始める距離。startFinale は CFG.horde.finale.from（640）
- updateShells: CFG.shellSpin の種類は軸まわりに回る（s.roll）
- updateReplay: 着弾後は CFG.replay.afterSp で余韻、終わりの fadeT 秒で #rpfade を暗転

## v1.0.5 追加・変更
- Sound.mech(kind, dist, pan)（新）: breech=ガシャン→シャッ→ガシャン→薬莢、eject=薬莢のカラン、rack=シャッ・ガチャ。mechSound(w, cd, pan)（新）: fireOne / レールで CFG.mech に従い later で鳴らす
- warmLoupe（新）: 1x1 で LCAM 描画。resetGame 後 0.2秒・群れのメッシュ追加時（HG.warm）に frame から呼ぶ
- startBoard（新）: 搭乗員（workers に state=pilot, plane）。updateWorkers で機体へ走り、着いたら startTaxi。killWorker で搭乗員を倒すと機体は park に戻り G.airT を retry 秒以内に。planeActive に board
- addFever: STAGES[].feverK を掛ける（前哨基地 0.4）
- finaleView: CFG.horde.finale.camAt に固定
- tests/run_test.mjs: コメントが処理を飲み込んでいないかの静的検査

## v1.0.4 追加・変更
- explode / fireRail: 目標の塊に当たると target.hit={t,p,b}、街の塊なら G.cityHit。killPlane / sinkShip: G.lastKill
- replayStart: 上の中で最も新しいものを clearT/clearP/tb に
- replayCam（新）: 目標の大きさで距離・高さ、CFG.replay.angles を順に試しレイで見通しを確認して rp.camPos、rp.aim は再生開始時の目標の中心。replayView は camPos 固定で弾と aim の間を見る
- finaleView: 防壁の方向（CFG.horde.wallZ、高さ lookUp）に固定

## v1.0.3 追加・変更
- winFx / updateWinFx（新）: クリアの瞬間（G.hitStop で一瞬止める、#flash、#win に「○○ DOWN / MISSION COMPLETE」）
- replayAgain（新）: 結果画面の「▶ リプレイ」
- updateReplay: 速さ rp.sp = slow〜fast（着弾からの時間 |t-clearT| で smooth）、rp.skip（画面タップ）で終了
- replayStart: G.lastRp を保存、クリア直後は CFG.replay.liveSlow 倍速。beginReplay: RPL.frozen で記録を止め、曳光弾 TRC を隠す
- showOverlay: リプレイボタン、スコア .cnt の数え上げ、表示直後0.45秒はタップを無視（G.ovT）
- CFG.replay: pre/after/post/liveSlow/hitStop/fast/slow/core/ramp（speed は削除）

## v1.0.2 変更
- rplFrame: mats（マテリアル）も記録。rplMat（新）で再生・終了時に戻す。fxScorch が rplEv('scorch') を記録し、beginReplay で再生開始より後の焦げ跡を隠し FX.emit を退避（endReplay で戻す）

## v1.0.1 追加・変更
- RPL / rplReset / rplEv / rplFrame（新）: 再生用の記録（update の先頭で記録、explode・fxBlockBreak・fxGlass・fxBeam・fxNuke が出来事を記録）
- replayStart / beginReplay / updateReplay / replayView / endReplay / shellTrailFx（新）: クリア後の再生（CFG.replay）。frame() は再生中 update を止め updateReplay。endGame は show() を再生後に呼ぶ
- killcamCheck / killcamView / CFG.killcam: 削除
- shellGeos / SHELL_MAT / SHELL_FX / shellFx（新）: 実物風の弾と光の筋・噴射炎。launchShell は共有マテリアル（dispose しない）、updateShells は筋の長さを速さに比例、砲弾の光の玉をやめ淡い煙
- startFinale / updateFinale: 「DEFENSE COMPLETE」(#clear) を clearT 秒→援軍。編隊は alts で高さ、dx/dz で前後左右をずらす。hitHorde は援軍中は得点・コンボ・+N を出さない。body.cine で #hordeHud も隠す

## v1.0.0 追加・変更
- startFinale / updateFinale / finaleView（新）: 襲来の援軍爆撃（CFG.horde.finale）。G.finale 中は時間・波・突破判定・射撃を止め、#hud に cine（ボタン類を隠す）
- hitHorde: 斜め上へ薙ぎ払う（CFG.horde knock/impK/upK/airDrag/spin）
- frameScale: 援軍の爆弾が落ちる間スロー。launchAir: 援軍中はメッセージを出さない

## v0.9.9 追加・変更
- debrisGeos / glassGeos（新）: 破片の3形状・ガラス片2形状
- DebrisPool: 形ごとのInstancedMeshを複数（at(i)）、縦横奥行きのばらつき、clear()、opt（geos/mat/bounce/noShadow/noTrail）。FX.glass を追加
- ParticlePool.clear()
- fxGlass / fxCollapse / updateCollapse（新）: ガラス飛散・倒壊の土煙・「倒壊！」（CFG.glass / CFG.collapse）
- killcamCheck / killcamView（新）: 最後の目標に当たる弾を先読みして G.kc、frameScale でスロー、updateCamera で目標の後ろからのカメラ（CFG.killcam）
- destroyBlock: car/gas の誘爆（CFG.carBoom / gasBoom / gasChain）、オフィス階のガラス。damageBlock: 大きな被弾でガラス少し
- blockGeo('gas')（新）: ガソリンスタンド。buildCity: 南西の区画にスタンド＋燃料タンク2基
- resetGame: 破片・ガラス・煙・火・曳光弾・キルカムを消す
- buildSettings / openSettings: 「ステージをやめる」（#setQuit、2回押し）
- showTitle: 説明を3つの<p>（折り返さない）
- shipGeo: 艦の色を暗く（hc/sc/s2/wh）、shipMat roughness 0.78 metalness 0.15

## v0.9.8 追加・変更
- buildTextures: TEX.weather（細かいむら・雨だれ・下の汚れ）・TEX.asphalt（つぎはぎ・ひび）
- blockMat: 街の建物（floor/house/roof/ware/deck/pier）は TEX.weather
- buildCityStatic: 車道を舗装テクスチャの別メッシュに、最後に buildCityProps を呼ぶ
- buildCityProps（新）: 横断歩道・信号機・電柱と電線・自販機を1メッシュ `cityProps`（CFG.city.look）
- hitHorde: 吹き飛び f=(1-d/R)×heavy、o.vy・o.spin・knock（impulse×0.8、上限 knock）。updateHorde: 宙で o.tip を回し着地で戻す。drawHorde: 回転順 YXZ で o.tip を反映
- CFG.horde: knock 14 / lift 11 / liftR 2.5 / spin 7 / heavy {mutant:0.25}

## v0.9.7 追加・変更
- cbox(w,h,d,c,kx,kz): 縦の角を面取りし上面を絞った箱（艦橋・砲塔・煙突・格納庫・マスト）
- hullLoft(sp,z0,z1,deckY,cols): 反り（艦首へ上がる甲板）と張り出しのある船体の半分。帯ごとに色（船底赤・水線黒・舷側灰・甲板）、艦尾は平面
- shipGeo: 軍艦（c/d/f）を作り直し。内部の補助: blk/at（面取り箱）、winRow（窓）、rail（手すり）、ciws、vls、oct（八角形レーダー）、digits（7セグ風の艦番号）、sideX（舷側の外面位置）。輸送船 t・潜水艦 s は従来のまま
- shipMat: 石目のテクスチャをやめた
- propGeo: 細い灰色の羽根と黄色い先端・スピナー
- planeGeo: canopy（青いガラスと枠）・edge（動翼の切れ目と前縁の線）・patch（迷彩）を追加。CFG.air.fightK=0.75 / bigK=0.56

## v0.9.6 追加・変更
- frus(w,h,d,kx,kz): 上面を絞った箱（傾斜側面）。艦橋・砲塔・煙突・マスト・操縦席に使う
- propGeo(r,n): プロペラの羽根とハブ
- planeGeo(type): f=MiG-29 g=Su-35(1.15倍) c=C-130 b=Tu-95 h=H-6（大型は CFG.air.bigK=0.8倍）。戻り値に noz（噴射口）・props（[x,y,z,半径,羽根,向き]）・k
- makePlane: 噴射炎を noz から、プロペラを子メッシュ pl.props に（円盤のぶれ表示つき）。syncPlane: 動き出したら回す。killPlane: プロペラも焦げ色に
- CFG.air: hp/vRot/speed に g/b/h、name（ログ用の機名）、parkDZ（大型機は奥に）、bigK
- shipGeo: 軍艦は c=055型風 d=052D風 f=054A風（ステルス艦橋・四面レーダー・前後VLS・近接防御機関砲・格納庫・ヘリ甲板、054Aは76mm砲・回転レーダー・舷側の対艦ミサイル）。甲板より上は CFG.navy.superK 倍
- CFG.navy.spec.c（大型駆逐艦 L30 B4.2 hp800）、NAVB.berths 1本目を [c, f]

## v0.9.5 変更
- buildWaste: 塊（ruin/wreck/rocks/junk）の中心を間隔16mで46か所、塊の外はまばらな小石と草。種類ごとにInstancedMesh `waste_<種類>`、STG.wasteN に塊の数（CFG.waste）
- blockGeo('aa'): 十字脚・旋回台・座席・揺架・2本の長砲身と消炎器・弾薬箱・照準器の連装機関砲
- window.GAME に STG を追加（撮影・テスト用）

## v0.9.4 追加・変更
| 名前 | 役割 |
|---|---|
| smokeK / fxExplosion・fxLinger（変更） | 煙の量の倍率（襲来は薄く手前はさらに）/ 煙の量を掛ける・襲来は煙の柱なし |
| notOwn / explode・updateShells・arcClear（変更） | 自分の防壁（b.own）を当たり判定から外す・爆風で壊さない |
| updateHordeHUD | 叩かれた防壁の⚠と矢印・ミュータントの体力バー（#hordeHud。updateHUD から） |
| STAGES.horde.uses / resetGame（変更） | ステージごとの使用回数（襲来は空爆3・VLS3） |
| CFG.fever.burstK・burstInt / updatePlayer（変更） | フィーバー中のMLRSは本数1.5倍・間隔半分 |

## v0.9.3 追加・変更
| 名前 | 役割 |
|---|---|
| pathSeg（laneX を置き換え）/ hordeH・hordeWild（変更）/ hordeTint | 道（折れ線＋幅）の区間 / Y字の谷・崖・広場・土手 / 崖と土手は岩の色 |
| spawnZombie / spawnWave / updateHorde（変更） | 道の入口から塊で、左右交互、ミュータント多め / 道の区間に沿って進み崖に登らない（o.seg）、最後の区間の後は防壁へ |
| hitHorde（変更）/ killPop | 範囲を広く・大きい爆発は少し浮く（o.vy）/ 倒した数「+N」を浮かべる（.kpop） |
| CFG.horde（変更） | paths・openZ・sideX・cliff・slope・rock・lift・liftR、波と大きさ |

## v0.9.2 追加・変更
| 名前 | 役割 |
|---|---|
| CFG.horde（変更）/ hordeH（変更） | 出現を手前に・速く・走る個体を増やす / 砲兵の高台（deckZ・deck） |
| loadHorde / buildHorde（変更） | window.HORDE（公開ページに埋め込み）を優先、無ければ assets から。読み込み中・失敗を画面に出す |
| tools/build_artifact.py（変更） | assets/*.glb.txt を window.HORDE として公開ページに埋め込む |
| CFG.arcMargin / arcClear（変更） | 障害物越しの判定を少し低めに |
| STAGES.city / fortress（変更） | 砲兵を下げる（batteryDZ 28 / 12）、CITY.ridgeZ も移動 |

## v0.9.1 追加・変更（襲来）
| 名前 | 役割 |
|---|---|
| CFG.horde | 防壁・防衛線・出現・谷道・丘・群れの数・押し合い・攻撃間隔・倒れた体・爆風・波・種類（体力/速さ/壁へのダメージ/得点/大きさ） |
| HG / laneX / hordeH / hordeWild | 群れの状態 / 谷道の中心 / 地形 / 荒れ地の小物の濃さ |
| buildHorde / loadHorde / bakeVAT | 防壁を置き模型の準備 / assets/*.glb.txt を読み焼き付け（初回のみ・非同期）/ 動きを頂点の表に焼き付け InstancedMesh とシェーダーを作る |
| spawnZombie / spawnWave / wallAt / zAnim | 1体出す / 波 / xの位置の防壁 / 動きの切替 |
| updateHorde / drawHorde / hitHorde / wallRatio | 移動・押し合い・攻撃・突破で負け・片付け / 描画の書き込み / 爆風で倒す（explode から）/ 残った防壁の割合 |
| update / checkTargets / scoreOf / endGame / updateHUD（変更） | goal='survive' は時間切れで勝ち・目標判定なし・群れの得点と防壁のボーナス・結果の文言・HUDに防壁%と波 |

## v0.9.0 追加・変更
| 名前 | 役割 |
|---|---|
| MDL / loadModels | 3Dモデルの置き場 / 末尾の window.MODELS（base64のglb）を読み込み、腰の水平移動を消してその場の動きにする（boot で await） |
| attachModel / playAnim | 工兵に兵士のモデルを付け手作りの体を隠す（関節の値は判定用に残る）/ 動きの切替（少し重ねる）。w.mdl・w.mixer・w.acts・w.cur |
| CFG.model | 縮尺（cm→m）・切替の重ね時間・吹き飛びの倍率（fling・lift）・走る動きの速さ・待機の速さ |
| spawnWorker / killWorker / updateWorkers（変更） | モデルを付ける / モデルは軽く飛んで die の動き（回転しない）/ 状態に合わせて run・work・die、mixer を更新 |
| tests/run_test.mjs（変更） | jsDelivr の three@…/ 以下（examples/jsm）もローカルの node_modules から返す |

## v0.8.6 追加・変更
| 名前 | 役割 |
|---|---|
| craterTexture / fxCrater（変更） | クレーターの絵（128px のキャンバス）/ 着弾点に貼る（焦げ跡と同数を使い回す）。buildWaste の古いクレーターも同じ絵 |

## v0.8.5 追加・変更
| 名前 | 役割 |
|---|---|
| wasteDensity（crystalDensity から改名） | 荒れ地の濃さ（小物の配置と地面の乾いた色） |
| buildWaste | 荒野の小物を種類ごとに InstancedMesh 1つで散らす（CFG.waste の数、スマホは mobile 倍） |
| buildProps（変更） | 結晶と発光の点（glowPts）を廃止して buildWaste を呼ぶ |
| CFG.palette（変更） | groundRed・crystal・crystalGlow を廃止、groundDry を追加 |

## v0.8.4 追加・変更
| 名前 | 役割 |
|---|---|
| fxExplosion（作り直し） | 閃光の芯・火球・黒煙（later）・土煙・土の柱と土くれ・燃える破片・衝撃波・焦げ跡・クレーター・煙の柱 |
| fxCrater / fxLinger / updateEmitters | クレーターの縁（焦げ跡と同数を使い回す）/ 煙の柱と燃え残る火の発生源 / その更新（updateFX から） |
| DebrisPool（変更） | 回転の設定がコメントに入っていた不具合を修正。burnNext＝燃える破片、着地で転がる・土ぼこり |
| CFG.fx（変更） | column / fires / fireT / emitMax / crater / burn / dirt |

## v0.8.3 追加・変更
| 名前 | 役割 |
|---|---|
| buildVehicle（作り直し） | 部品を kit（色つきの部品＋発光部品）に集めて hull/tur/piv/slide ごとに1メッシュへ結合。内部の tracked / wheeled / cupola / smoke / basket で共通部品。g.spin＝回るレーダー |
| CFG.vehCol / CFG.vehSink | 車両の色 / 撃ったときに車体が沈む量 |
| poseVehicle（変更） | 車体が沈んで戻る、レーダーが回る |

## v0.8.2 追加・変更
| 名前 | 役割 |
|---|---|
| CFG.bomber / buildBomberMesh | 全翼の爆撃機の形（翼幅・色・進入の高さ・揺れ・爆弾倉・離脱の上昇と旋回）。g.userData.doors＝爆弾倉の扉 |
| launchAir / updateBombers（変更） | 進入（降下・揺れ）→投下（水平・扉が開く）→離脱（上昇旋回）。life 秒で消す。爆弾の投下位置は従来どおり |

## v0.8.1 追加・変更
| 名前 | 役割 |
|---|---|
| buildOutpost / STAGES.outpost / CFG.outpostZ | 前哨基地（v0.7.6までの要塞をそのまま。司令部z=-72） |
| baseZ | 要塞・前哨基地の司令部の中心z（workerHome / workerStand / crystalDensity / buildProps が使う） |
| outpostPath | 前哨基地の工兵の経路（前の要塞の経路）。workerPath から呼ぶ |
| updateAAA（作り直し）/ TRC / addTracer / updateTracers | 連射のうち every 発に1発が曳光弾。InstancedMesh の細長い箱で光の筋、重力で落ち、flak 本に1本が空中で炸裂 |
| CFG.fort（変更） | 14m手前へ。aa に every/len/width/drop/flak/max |

## v0.8.0 追加・変更（要塞の作り直し）
| 名前 | 役割 |
|---|---|
| CFG.fort | 要塞の配置（front/back/halfW/tower/gate/trenchZ/hedgeZ/aaX/aaZ/gunZ/hqR）、gun（撃ち返しの間隔・警告・飛行時間・着弾範囲・爆発）、aa（曳光弾）、ammoBoom、pipeT |
| buildFortress（作り直し） | 外壁・正門・側壁・後壁・見張り塔・前面装甲スロット・塹壕・トーチカ・コンテナ・燃料タンク・配管・弾薬庫・発電所・通信塔・レーダー・大型砲 |
| buildFortHQ / buildPillbox / buildEnemyGun | 司令部（コア＝目標）/ 六角形の対空トーチカ / 敵の大型砲（固定・砲身は別メッシュ＝目標） |
| FORT / fortChain | 要塞の敵の状態 / 弾薬庫・配管・大型砲の誘爆（destroyBlock から呼ぶ） |
| updateFortress / updateEnemyGun / enemyFire / updateEnemyShells / updateAAA | 要塞の敵の更新（play中のみ。テストは FORT.force）/ 撃ち返しの準備と発射 / 自陣の手前へ撃つ / 敵の砲弾（何も壊さない）/ 曳光弾 |
| blockGeo: wall / pipe / ammo / plant / bigGun / aa | 外壁の板・配管・弾薬庫・発電所・大型砲の車体・対空機関砲 |
| workerStand / workerPath（変更） | 外壁は内側から直す / 内外は正門を通り、裏へは外を回る |
| crystalDensity（変更） | 要塞は四角く結晶を空ける（box） |
| updateMarkers（変更） | 大型砲のマーカーは高め |

## v0.7.6 追加・変更
| 名前 | 役割 |
|---|---|
| startSail / updateShips（変更） | 艦首の点（s.ri/rf）が航路をなぞり、艦尾の点 s.st は艦首へ引かれて艦の軸方向にだけ動く（トレーラー式）。中心＝2点の中点、向き＝艦尾→艦首。間隔は CFG.navy.span×艦長 |
| NAVB.turnX / exitX | 港口の曲がり角と出口の航路を港口中心から外（東）へずらす量（艦尾が内側を切っても防波堤に触れない） |
| Sound.fall（変更） / CFG.whistle | 埋め込み音源 SFX.fall（H_4600_side35）を、鳴り終わりが着弾に重なるように1回鳴らす。CFG.whistle は音量と残響だけ。makeWhistle / makeWhistleBuf は廃止 |
| updateBombers（変更） | 落下音は1回の爆撃に1回（b.fell） |

## v0.7.5 追加・変更
| 名前 | 役割 |
|---|---|
| （v0.7.6で廃止）CFG.whistle / Sound.makeWhistle / Sound.makeWhistleBuf / Sound.fall（変更） | 落下の笛（試聴で決定: 4.6kHzから加速して下がる主音＋半分の高さの管の響き＋正弦の芯＋0.7倍で平行に下がる息の笛 強さ0.35）を落下時間ぶんの波形として一度だけ作り、再生速度でわずかに音程をずらして鳴らす |
| CFG.navy.wake / updateWake（変更） | 白波の形（試作W1を元に艦尾の帯＝艦の幅、V字を太く）。帯は5本: V字2・艦尾1・船首波の泡2。スプレーレールの飛沫 |
| CFG.navy.harbor / updateShips（変更） | 港内（state=sail）は2.5m/秒、港外で巡航速度へ加速して一定 |
| NAVB / startSail（変更） | v0.7.3 の大きさに戻す（channelZ -115・turnR 18・breakZ -124・mouth [46,66]）。航路は直進→水路→港口→外洋の円弧 |
