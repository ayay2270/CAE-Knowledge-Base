# Two-Stage Adaptive Time Increment Control — Review 記錄

## 範圍與版本

本次依 2026-10-29 使用者要求建立獨立 review 與 preview。起點為當時 main `90a29eba4604b1b5137bf5243a4f45f413779933`；該提交已含先前拆分後的 OCP Rail 知識線，與當時舊 review 的檔案內容相同。此任務不移動 main、不 merge、不寫入正式 Supabase。

- Review：`review/optistruct-two-stage-increments-20261029`
- Preview：`preview/optistruct-two-stage-increments-20261029`
- 新文章：[OptiStruct NLSTAT – Two-Stage Adaptive Time Increment Control](../knowledge/optistruct-nlstat-two-stage-adaptive-time-increment-control.md)
- 本機直接入口：`?source=local#optistruct-nlstat-two-stage-adaptive-time-increment-control-20261029`

原有 21 篇文章保留，新增 1 篇，共 22 篇。分類沿用既有 `optistruct`，主題以 `Nonlinear Analysis` 標籤表達，文章摘要顯示兩者，沒有引入不相容的第三層分類或 schema。原 OCP 索引、Force→SPCD、SPCFORCE 與 Test to Fail 文章補上新文章的明確連結。

## 內容通用化

依使用者偏好，OCP Rail 文章、Markdown 與圖解不再保存特定模型的 Node ID、單點位移、全域極值數字或原案例結果差異。保留的是識別實際驅動位置、同方向量測、SPCD 設定與反力／平衡驗證方法。原文章 ID 與路由保留，既有 28 步操作教學仍可使用。Auto-SPC 改為按實際位置與 DOF 判讀，不預設固定數量。

50 kgf 約 490 N 保留為單位換算示例；60 MPa 保留為使用者指定的專案判定門檻。這些不是新模型的求解結果。

## 官方 2026 文件查核與結論界線

文章列出可直接開啟的 10 個官方來源。查核時，root 線上說明導覽標示 OptiStruct／HyperMesh 2026。

| 查核項目 | 官方定位 | 本文結論 |
| --- | --- | --- |
| TTERM、NINC、DT | NLPARM Definitions、Comments 4–5 | TTERM 為本段時間；DT 留白才由 TTERM/NINC 得初始步長；另設 DT 則忽略 NINC |
| DTMAX、DIRECT | NLADAPT Definitions | 上限與自適應控制，不是輸出頻率或固定總步數 |
| FREQ、NINT、TIME | NLOUT Definitions、Comments 3–8 | FREQ 為正整數，控制中間結果儲存；不細化求解 |
| VALUE REAL | HyperMesh analysisparameters `value_real`、`freq_value_int` | FREQ=1 使用整數、VALUE REAL 不勾；實際 UI 呈現仍以安裝版／匯出卡片核對 |
| 狀態續接 | CNTNLSUB Definitions、Comments 5–7 | YES 依 deck 順序續接同型前段；移除邊界可能卸載；D=F 用於保持邊界 |
| SPCD | SPCD D 欄、Comments 1、4 | 指定自由度需在同段作用 SPC 中；Bulk LOAD 不可組合 SPCD |
| 總時間曲線 | TLOAD1 TYPE、TSTIME、Comments 8–9 | NLSTAT 可使用 DLOAD/TLOAD1；TOT 查總時間，SUB 查局部時間 |
| 操作位置 | OS-HM-T 3000、3020 | Load Step Inputs、Entity Editor、Load Step、輸出控制與 CNTNLSUB 欄位 |
| 反力 | SPCFORCE、NLOUT | 同增量請求／讀取主 H3D 的反力、位移與應力 |

**文件語意已查核，完整候選方案沒有 Solver 驗證。**

候選 Stage 1 為 TTERM=.75、NINC=8、DTMAX=.1；Stage 2 為 TTERM=.25、NINC=36、DTMAX=.007。兩段 DIRECT=NO、FREQ=1，第二段 CNTNLSUB=YES。初始步長的 .09375 與 .00694444… 僅為設定算術。

文章沒有把 TTERM=.75 解釋成自動 75% SPCD。它另提出以 TLOAD1／TABLED1／總時間定義 0 → .75u_T → u_T 的待測載入鏈；完整續接效果、連續性、實際步數、效能與門檻反力均須用最小模型與工程模型驗證。沒有製作聲稱可直接求解的假 FEM，沒有將 D=F 寫成持續增加位移。

## 審閱素材與驗證

- 新文章有 18 個操作步驟、5 張原創 SVG、候選設定表、deck 檢查骨架與待填的發布前驗證表；均標示待驗證／示意。
- `npm test`：32/32，含 schema、文字搜尋、明確互連、圖片與 Markdown 路徑、新文候選值／驗證狀態及案例數據清除檢查。
- `npm run test:adaptive`：搜尋、索引／SPCFORCE 連入與返回、直接網址／重載、18 步／5 張圖位置與放大、375／812／1440 寬度及 SVG 文字邊界通過；無正式資料庫請求或瀏覽器錯誤。
- `npm run test:ocp-browser`：11 篇既有 OCP 文章、全部圖、索引往返、搜尋、28 步教學、放大與手機版面通過。
- `npm run test:browser`：原有 17 項混合文章／mock API／響應式回歸檢查。
- 五張新圖與更新後的通用圖已做瀏覽器渲染及目視檢查；格式檢查使用 `git diff --check`。

以上皆為網站、內容與圖解驗證。**未執行 HyperMesh 2026 實機逐項點選、OptiStruct Solver 求解、實驗、材料門檻校準或網格收斂。**這些項目在文章中保留待驗證，不因網站測試通過而視為工程方案已通過。

## 發布方式

保持 Draft PR，讓使用者先審閱方法、候選值與圖解。Preview 指向同一候選提交；正式網站與正式 Supabase 文章庫均不在本次修改範圍。現有 seed 產生器尚未完整處理 knowledge 欄位，本次不以 seed 匯入。


## 本次修訂：Time 0.75 後結果停滯

更新原有文章 ID，未增加知識條目；總數仍為 22。原 18 步與 5 圖保留，補成 30 步與 7 圖。既有 OCP 通用教學仍不放特定模型資料；僅本篇依使用者本次明確要求新增 Node 26088／26087、-0.82575／-1.101 mm 的故障排查示例。這些為使用者指定候選資料，不是求解結果。

- A／B：使用者回報平台與高度懷疑根因分開標示；無本案 deck、H3D 或求解紀錄，未重現根因。
- C／D：保留原明定總時間曲線候選 A，另補直接 LOAD 分段 SPCD 候選 B；不疊加、不假定數值 D 是續接絕對目標，不盲填剩餘行程為增量。加入 HyperMesh Collector／SID／Subcase 逐項核對。
- E／F：HyperView UZ 三點、第二段起點連續與更負的位移歷程，同步 Stress／SPCFORCE／Contact；另列 .out／.monitor 的 CONVERGED、SUBCASE TIME、CURRENT TIME、LOAD FACTOR。MONITOR DISP 不直接視為指定點 UZ。
- G：新增正確目標與錯誤平台 2 張原創 SVG，均為示意，非實測。

官方 2026 再查核：NLPARM Comment 5 明文定義局部 TTERM；CNTNLSUB YES／Comments 6–7 說明續接、卸載、保持邊界；SPCD D 欄及 Comments 1、4–5 說明指定運動與 SPC／LOAD 限制。**所查參考頁未明文給出續接數值 SPCD 的絕對／增量解讀；此項保持待驗證，未從 SPC 教學推導成 SPCD 的已證實規則。** .monitor 官方頁明確區分 SUBCASE TIME 與 CURRENT TIME；新增該頁與 Runtime Monitoring 來源。候選步長控制原值保留，不保證實際步數、效能或門檻精度。

待完成工程驗證：安裝版 HyperMesh 2026 操作、最小模型的數值 SPCD 續接解讀、真實三點 UZ 與無跳變、本案平台根因、Contact 及 60 MPa 對應反力、單段全細步比較、增量敏感度與網格收斂。網站測試不能替代這些項目。

本次網站驗證：npm test 33/33 通過；test:adaptive 六組搜尋、互連／返回、直接連結與重載、30 步／7 圖位置與放大、375／812／1440 寬度、7 張 SVG 文字邊界、無瀏覽器錯誤及無正式資料庫請求均通過。兩張新圖經瀏覽器渲染與目視檢查。保持 Draft PR、不 merge、不移動 main，不寫正式 Supabase。
