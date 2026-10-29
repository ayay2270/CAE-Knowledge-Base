# OCP Rail｜知識線索引與案例概述：Force、SPCD、Contact 到 Test to Fail

> 更新：2026-10-29 · 分類：OptiStruct · 類型：技術知識
> 圖片均為重繪示意，非原始軟體截圖；數值屬既有案例紀錄，SPCFORCE 尚待驗證。

[知識庫 local mode 閱讀](../../index.html?source=local#ocp-rail-force-spcd-test-to-fail-20261029)

## 知識摘要

本頁保留原大型技術文章的固定 ID，改作 OCP Rail 案例概述與知識線索引。獨立條目依治具、連接、量測操作、反力驗證、界面、網格、應力與失效判據拆分，可直接搜尋。

既有紀錄：Force −490 N 時，RBE3 REFGRID 26088 的 Global UZ=−1.101 mm；全模型 Min UZ=−1.379 mm。修正左孔 SPC 123456 為只 SPC 3 後，SPCD／Force 的 Max |U| 約 2.948／2.947 mm（約 0.034%），皆 Grid 1345。這是原紀錄的位移場對照，SPCFORCE 約 490 N 尚待驗證。



![測試 A：只有 Rail + 兩根 Pin](../../assets/figures/ocp-rail/01-rail-test.svg)

水平拉伸力路徑與右端固定，Global Z 為 Rail 長度方向。

## 技術說明

【閱讀路線】先確認治具／載荷路徑與 RBE 定義，再依完整操作教學量指定控制點 UZ、設定 SPC 3／SPCD，最後用反力與狀態判斷是否等效。Press Fit、網格、應力與失效判定各有獨立知識線，不需再從大文章逐段找答案。

【適用前提】本案例採 N–mm、NLSTAT + LGDISP；節點 26088／26087 及 −1.101 mm 均為此網格案例值。DOF 3 的方向須查有效 GRID CD；RBE3 REFGRID 上 SPC 的 LGDISP 支援條件須確認。



![孔壁 Node 的正確選取區域](../../assets/figures/ocp-rail/02-rbe-hole-nodes.svg)

水平 Pin 載荷須選內壁沿厚度方向的節點，勿只選上口；示意圖，非原始模型截圖。



![壓入式 Nut：TIE 與 Contact](../../assets/figures/ocp-rail/03-pressfit-interface.svg)

壓入固定應評估干涉、預緊及摩擦，不可把 SLIDE Contact 視同完全黏合。



![真正造成兩版結果不一致的 BC 差異](../../assets/figures/ocp-rail/04-spc-error.svg)

左孔原先使用 SPC 123456；修正為 SPC 3 後，Force 與 SPCD 結果接近。



![Force vs SPCD 的驗證結果](../../assets/figures/ocp-rail/05-force-vs-spcd.svg)

原本 490 N 模型左孔中心 UZ=−1.101 mm；修正後最大位移幅值 2.947 vs 2.948 mm。



![一階與二階四面體單元比較](../../assets/figures/ocp-rail/06-tetra-order.svg)

Tetra10 可改善部分彎曲及孔邊應力精度，但需核對中點節點、Contact 和網格收斂。

## 操作／設定步驟

1. [治具與載荷路徑](ocp-rail-fixture-load-path.md)

2. [RBE／孔壁節點／Auto-SPC](ocp-rail-rbe-hole-nodes-autospc.md)

3. [HyperView 指定 Node UZ → Force／SPCD 完整圖文教學](ocp-rail-hyperview-node-uz-force-to-spcd.md)

4. [SPCFORCE 反力與等效驗證](ocp-rail-spcforce-equivalence.md)

5. [Nut／Insert Press Fit 接觸](ocp-rail-press-fit-contact.md)

6. [Tetra4／Tetra10 與網格收斂](ocp-rail-tetra4-tetra10-convergence.md)

7. [Stress Legend／平均法／N/A](ocp-rail-stress-contour-reading.md)

8. [Test to Fail 與失效判據](ocp-rail-test-to-fail-limits.md)

9. [SPC 123456 → 3 排錯紀錄](ocp-rail-spcd-123456-mismatch.md)

## 關鍵參數／判斷規則

- Force → SPCD 是以原解的指定節點位移重現狀態，不是 N 直接換成 mm。
- 原 6 張示意圖全部保留於本頁，並沿用到對應獨立條目；新增圖均標明操作示意，非軟體截圖。
- 位移場接近不等於反力等效，反力等效不等於已預測破裂。
- 知識條目沿用既有 category、content_type、tags、內容欄與 images／figures，未引入新資料庫欄位。

## 注意事項／限制

尚待檔案／實驗核實：SPCFORCE、未截斷應力峰值、Auto-SPC 清單、實驗治具自由度、Pin + Contact、Press Fit 初始狀態、Tetra10 收斂與材料損傷／斷裂模型。

本分支為公開 local-mode 範例；用 ?source=local 檢視。此次不會自動寫入正式私人文章庫。配圖是既有案例與操作流程的重繪說明，未取得原 FEM／H3D／原始截圖，沒有新增實測或求解結果。

【門檻載荷延伸】[SPCFORCE 反力與 60 MPa Stress-limit Load 教學](ocp-rail-spcforce-stress-limit.md)：先完成約 490 N 等效，再查同一已收斂增量的應力與反力；Time 不可直接當 SPCD 反力比例，應力門檻不等於破裂力。

## 參考來源

案例來源：既有 OCP Rail 審核分支保存的 2026-10-28～29 對話／HyperView 2026 截圖轉述。未取得原始 FEM、H3D、OUT 或原始截圖，未執行新一輪 OptiStruct 求解。數值屬既有案例紀錄，不能視為本次獨立驗證。

官方規則核對（2026-10-29；2025／2025.1 文件，介面位置依安裝版本而異）：
- Altair measure: https://2025.help.altair.com/2025.1/hwdesktop/hlife/topics/panels/measure_panel_define_measure_group_t.htm
- Altair select: https://2025.help.altair.com/2025.1/hwdesktop/hwx/topics/panels/input_collector_ext_entity_selection_menu_r.htm
- Altair grid: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/grid_bulk_r.htm
- Altair spcd: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/spcd_bulk_r.htm
- Altair rbe3: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm
- Altair spcf: https://2025.help.altair.com/2025/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm
