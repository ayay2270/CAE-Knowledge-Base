# SPCFORCE 知識庫審核記錄（2026-10-29）

## 分支與內容核對

- 開始作業時，`review/ocp-rail-test-to-fail-20261029` 與 `ocp-rail-preview-20261029` 同為 `321bf205efac4e220e09735a9a7ee894450a30b2`；未發現較新的 OCP Rail 分支。
- `main` 起始為 `f04b1a5190cf6400924dad19d710527cbb8f2b18`。本次提交對象只有 review 分支，不合併 main，也不將預覽分支視為已同步。
- 現有 Draft PR #1 的 head 是 review 分支；本次延續該 PR。
- 原有 12 篇保留，新增 1 篇獨立 SPCFORCE 技術知識，共 13 篇；兩篇既有 OCP Rail 文章補上標籤、下一步提示與相關知識導覽。

## 索引與 schema

- 本機 `js/provider-local.js` 載入 `data/knowledge-base.json`；`?source=local` 強制使用此來源。
- `content_type: knowledge` 使用 `summary`、`technical_explanation`、`procedure`、`key_rules`、`notes` 與 `reference_source`；新文章沿用既有欄位，分類為 `optistruct`。
- `js/core.js` 的 `hay()`／`visible()` 直接搜尋標題、標籤及文字欄位；沒有另一份需要重建的搜尋索引。
- `js/figures.js` 依 section／step 放圖；`cRelated()` 依分類與標籤計分產生文章按鈕。本次實測兩篇既有 OCP Rail 都能連入 SPCFORCE，且新文章能連回兩篇既有文章。
- 已閱讀 Repo 的 `supabase/schema.sql` 與 `supabase/phase5-content-types.sql`，新內容對應既有 Phase 5 欄位。本次未執行資料庫查詢／寫入，未更動 schema、RLS、權限或登入。
- `scripts/build-seed.mjs` 目前仍只映射舊問題排除欄位，沒有輸出 Phase 5 的 knowledge 文字欄位；因此本次沒有重建 seed，也不以它作為正式匯入方案。正式文章庫尚未匯入此教學。

## 工程內容與證據界線

- 獨立文章：[SPCFORCE 與 Stress-limit Load](ocp-rail-spcforce-stress-limit.md)。官方來源直接列於文章，查核日期 2026-10-29。
- 包含 `SPCFORCE(H3D) = ALL`、NLOUT 選用與收斂中間增量、HyperView 同 Subcase／Frame／Node 的 Global Z 讀值、50 kgf 與約 490 N 對照、首次儲存超限增量、kgf 換算與治具合力／平衡。
- 明確保留 Time 不等於 SPCD 反力比例、平均法與結果位置、網格收斂／奇異點、Stress-limit Load 不等於真正 Crack Load 的限制。
- 四張 SVG 均標示「示意圖」，置於操作步驟 2、5、6、7；不是原始 HyperView 截圖，未以虛構反力填入案例結果。
- 沒有原始 `.fem`／`.h3d` 可重新求解；實際反力、60 MPa 對應載荷、材料門檻與網格收斂仍待工程驗證。

## 驗證結果

- `npm test`：23/23 通過。
- `npm run test:spcforce`：六組搜尋詞、雙向相關文章導覽、返回鍵、直接連結／重載、四張圖的位置／載入／放大、375／812／1440 寬度無水平溢出、SVG 文字範圍與瀏覽器錯誤檢查均通過。
- `npm run test:navigation`：8 組導覽回歸檢查通過。
- `npm run test:browser`：17/17 回歸項目通過；本機預設 8096 已被使用，因此以 `TEST_PORT=18196` 執行。涵蓋兩種文章、編輯、搜尋、舊資料、mock API 與響應式檢查；未呼叫正式資料庫。
- 基準版本先測得三項既存單元測試失敗，原因是把所有文章／第一篇文章當作 legacy 問題排除。本次改為驗證混合文章類型，並用明確的 legacy fixture 測舊資料；瀏覽器回歸同樣修正。
- 四張示意圖與桌面／手機文章截圖已逐張目視檢查；`git diff --check` 通過。

## 本機審閱入口

在此 review checkout 執行 `npm start` 後，開啟：

`http://localhost:8080/?source=local#ocp-rail-spcforce-stress-limit-20261029`

正式 GitHub Pages 目前從 main 發佈；上述 local 預覽內容不代表正式網站或預覽分支已更新。
