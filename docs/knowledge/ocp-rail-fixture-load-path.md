# OCP Rail｜50 kgf／−490 N 拉伸：治具、Pin 與載荷路徑

> 方法型知識文章；不保留特定模型 Node ID 或單點讀值。所有圖片為示意，非求解結果。

[開啟本機預覽](../../index.html?source=local#ocp-rail-fixture-load-path-20261029)

## 知識摘要

建立 Rail + 兩根 Pin 的獨立拉伸試驗邊界，先釐清實驗力從哪裡進入、由哪裡反力，再討論 RBE 或 Contact。此案例以 N–mm 表達，左側沿 Z 負向施加約 −490 N。

## 技術說明

50 kgf × 9.80665 N/kgf = 490.3325 N；既有模型採 −490 N，不應把 kg 質量直接填成 N。Rail 長度方向在本案例為顯示 Global Z，左孔為加載端、右孔為固定端。獨立試驗的 BKT 不在力路徑中；組裝狀態才另開含 BKT 的敏感度模型。右端 RBE2 Reference Node 支承點、左端 RBE3 REFGRID 驅動點 是既有網格識別碼，不是通用規範。

## 操作步驟

1. 列出實驗包含的零件、Pin 直徑、支承方式、左 Pin 可滑移／可轉動的方向，以及量測位移的位置。未知的治具自由度先列待確認。
2. 在未變形模型標出座標三軸；查 GRID 的有效 CD（含 GRDSET）及 FORCE 的 CID，確認輸入方向與顯示方向一致。
3. 以 Rail + 兩根 Pin 建立基準；右端拘束依實驗，左端加 FZ = −490 N。另存模型版本、單位與輸出檔名。
4. 若使用 RBE 代替實體 Pin，記下孔壁節點範圍、參考點位置、DOF 及權重；以 Pin + Contact 版本檢查孔壁局部結果。
5. 基準求解後核對固定端總反力、變形方向與接觸，再進入指定節點位移教學。

## 判讀規則

- 右端 SPC 123456 是既有理想化案例設定，不能取代實驗治具確認。
- 不要為了對齊別人的位移或應力，任意加上實驗不存在的 BKT。
- SPCD 的控制點必須對應原 FORCE 的作用位置與方向。

## 注意事項

試驗機橫樑行程、Pin 位移與 Rail 孔中心位移可能不同；若需對實測，還要考慮治具柔度、間隙與量測基準。下一步：[RBE／孔壁節點](#ocp-rail-rbe-hole-nodes-autospc-20261029)、[HyperView 指定 Node UZ 操作教學](#ocp-rail-hyperview-node-uz-force-to-spcd-20261029)

延伸閱讀：[OCP Rail 知識線索引](#ocp-rail-force-spcd-test-to-fail-20261029)

## 參考來源

方法型教學；不使用特定模型的節點編號、位移或峰值結果作為操作模板。未執行新的 OptiStruct 求解。官方文件依實際版本核對。
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/grid_bulk_r.htm

## 圖解

### 測試 A：只有 Rail + 兩根 Pin

![測試 A：只有 Rail + 兩根 Pin](../../assets/figures/ocp-rail/01-rail-test.svg)

水平拉伸力路徑與右端固定，Global Z 為 Rail 長度方向。
