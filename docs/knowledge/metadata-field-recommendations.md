# CAE Knowledge Base — 建議新增的工程案例欄位（提案，尚未實作）

目前 `entries` 有技術知識 / 問題排除分型、分類、tags、內容、驗證、圖片及來源，已適合一般 FAQ。OCP Rail 案例揭露一個缺口：不易區分「模型已求解」「兩版結果一致」「已由實測驗證」三種不同可信度。

## 優先級 P0：建議真正新增欄位

| 欄位 | 目的 | 例子 |
|---|---|---|
| `validation_status` | 防止已收斂的模擬被誤記為實測已驗證 | `simulation-consistent` / `pending-test` / `validated-by-test` |
| `solver_and_version` | 搜尋版本依賴的 SPCD、RBE、Contact 行為 | `OptiStruct 2026.1`（實際求解版本需再核對） |
| `analysis_type` | 比對 NLSTAT / Linear / Explicit | `NLSTAT + LGDISP` |
| `unit_system` | 避免 50 kgf 與 490 N、N-mm-t 單位誤用 | `N-mm-MPa` |
| `model_revision` | 對應 FEM、H3D、Contact 版本 | `Current / Current_Contact_2nd` |
| `verification_metrics` | 保留可機讀數據與方法，不只是文字 | `[{metric:control_displacement,value:measured_value,unit:mm}]` |

## 優先級 P1：可先放在現有 Notes 欄位，無須立刻修改 DB

- `test_configuration`：右 Pin 固定、左 Pin 拉伸、是否有 BKT、是否有實際 Pin 接觸。
- `attachments`：原始 FEM / H3D / OUT、報告截圖、外部檔案 URL；需標示檔案版本與來源。
- `assumptions_and_limitations`：例如 Press Fit 干涉量未知、SPCFORCE 尚未驗證、斷裂模型尚未建立。
- `failed_trials`：錯誤 SPC 123456、誤拿全域 Min UZ、Vector Plot 查詢繞路。
- `derived_from_case` / `supersedes`：知識之間的版本關係，避免後來修改時舊結論仍被誤認有效。

## 表單 / 搜尋的 UX 優先建議

1. **分析條件卡片**：Solver、版本、Element Order、Contact、單位制、主要 Load/SPC 一眼可見。
2. **結論成熟度**：只有「初步觀察／求解對照通過／實測驗證」三種，避免一堆複雜 badge。
3. **Before–After Compare**：每張圖同一色階並放固定 metric 表；提醒色階截斷與 Node/Element Averaging。
4. **工程附件關聯**：保留 JSON/CSV/.out/.fem/.h3d 的檔名、日期、hash、關鍵結果；大檔不一定放 GitHub。
5. **圖說與圖類型**：`source_type: screenshot|diagram|simulation|measurement`，明確區分示意圖與實際求解結果。

## 本次不建議立即實作的變更

不修改既有 Supabase Schema、RLS、登入流程與 Owner 專用圖片庫。以上屬資料模型與 UI 改進提案，應在另一次開發階段單獨評估 migration、回填、相容性及測試。
