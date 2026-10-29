# OCP Rail｜知識線索引：Force、SPCD、Contact 到應力門檻判定

> 方法型知識文章；不保留特定模型 Node ID 或單點讀值。所有圖片為示意，非求解結果。

[開啟本機預覽](../../index.html?source=local#ocp-rail-force-spcd-test-to-fail-20261029)

## 知識摘要

本索引整理可重複使用的建模與驗證方法：治具載荷路徑、RBE、位移量測、Force→SPCD、SPCFORCE、接觸、網格收斂與失效判定。文章使用通用控制點與符號，不依賴特定模型的節點編號或讀值。

## 技術說明

先定義實際治具、載荷方向與模型假設，再以 Force 基準求解量測驅動位置的位移，用相同位置／方向的 SPCD 重現，並比較反力、平衡與接觸／材料歷程。達到專案應力門檻的載荷與實際裂紋載荷是不同判定。下列圖面均為技術示意，不是求解證據。

## 操作步驟

1. [治具與載荷路徑](#ocp-rail-fixture-load-path-20261029)
2. [RBE／孔壁節點／Auto-SPC](#ocp-rail-rbe-hole-nodes-autospc-20261029)
3. [HyperView 指定 Node UZ → Force／SPCD 完整圖文教學](#ocp-rail-hyperview-node-uz-force-to-spcd-20261029)
4. [SPCFORCE 反力與等效驗證](#ocp-rail-spcforce-equivalence-20261029)
5. [Nut／Insert Press Fit 接觸](#ocp-rail-press-fit-contact-20261029)
6. [Tetra4／Tetra10 與網格收斂](#ocp-rail-tetra4-tetra10-convergence-20261029)
7. [Stress Legend／平均法／N/A](#ocp-rail-stress-contour-reading-20261029)
8. [Test to Fail 與失效判據](#ocp-rail-test-to-fail-limits-20261029)
9. [SPC 123456 → 3 排錯紀錄](#ocp-rail-spcd-123456-mismatch-20261029)
10. [SPCFORCE／NLOUT 與 60 MPa 門檻載荷（保留既有專題）](#ocp-rail-spcforce-stress-limit-20261029)
11. [NLSTAT 兩階段自適應時間增量（待驗證草案）](#optistruct-nlstat-two-stage-adaptive-time-increment-control-20261029)

## 判讀規則

- 同一物理位置、自由度、座標與單位才可比較。
- 位移場接近不能代替反力與路徑驗證。
- 50 kgf 約 490 N 是單位換算示例；實際基準載荷由專案指定。
- 特定節點編號與案例讀值不屬於操作模板。

## 注意事項

尚待檔案／實驗核實：SPCFORCE、未截斷應力峰值、Auto-SPC 清單、實驗治具自由度、Pin + Contact、Press Fit 初始狀態、Tetra10 收斂與材料損傷／斷裂模型。

本分支為公開 local-mode 範例；用 ?source=local 檢視。此次不會自動寫入正式私人文章庫。配圖是既有案例與操作流程的重繪說明，未取得原 FEM／H3D／原始截圖，沒有新增實測或求解結果。

【門檻載荷延伸】[SPCFORCE 反力與 60 MPa Stress-limit Load 教學](#ocp-rail-spcforce-stress-limit-20261029)：先完成約 490 N 等效，再查同一已收斂增量的應力與反力；Time 不可直接當 SPCD 反力比例，應力門檻不等於破裂力。

候選方法：[Two-Stage Adaptive Time Increment Control](#optistruct-nlstat-two-stage-adaptive-time-increment-control-20261029)（官方規則已核對，兩階段完整組合待求解驗證）。

## 參考來源

方法型教學；不使用特定模型的節點編號、位移或峰值結果作為操作模板。未執行新的 OptiStruct 求解。官方文件依實際版本核對。
https://2025.help.altair.com/2025.1/hwdesktop/hlife/topics/panels/measure_panel_define_measure_group_t.htm
https://2025.help.altair.com/2025.1/hwdesktop/hwx/topics/panels/input_collector_ext_entity_selection_menu_r.htm
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/grid_bulk_r.htm
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/spcd_bulk_r.htm
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm
https://2025.help.altair.com/2025/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm

## 圖解

### 測試 A：只有 Rail + 兩根 Pin

![測試 A：只有 Rail + 兩根 Pin](../../assets/figures/ocp-rail/01-rail-test.svg)

水平拉伸力路徑與右端固定，Global Z 為 Rail 長度方向。

### 孔壁 Node 的正確選取區域

![孔壁 Node 的正確選取區域](../../assets/figures/ocp-rail/02-rbe-hole-nodes.svg)

水平 Pin 載荷須選內壁沿厚度方向的節點，勿只選上口；示意圖，非原始模型截圖。

### 壓入式 Nut：TIE 與 Contact

![壓入式 Nut：TIE 與 Contact](../../assets/figures/ocp-rail/03-pressfit-interface.svg)

壓入固定應評估干涉、預緊及摩擦，不可把 SLIDE Contact 視同完全黏合。

### 真正造成兩版結果不一致的 BC 差異

![真正造成兩版結果不一致的 BC 差異](../../assets/figures/ocp-rail/04-spc-error.svg)

左孔原先使用 SPC 123456；修正為 SPC 3 後，Force 與 SPCD 結果接近。

### Force→SPCD：量測與驗證流程

![Force→SPCD：量測與驗證流程](../../assets/figures/ocp-rail/05-force-vs-spcd.svg)

方法示意：以實際驅動位置的量測位移重現狀態，並核對反力、平衡與歷程。

### 一階與二階四面體單元比較

![一階與二階四面體單元比較](../../assets/figures/ocp-rail/06-tetra-order.svg)

Tetra10 可改善部分彎曲及孔邊應力精度，但需核對中點節點、Contact 和網格收斂。
