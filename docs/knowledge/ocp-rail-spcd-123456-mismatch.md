# SPCD 位移控制與 490 N 應力／變形不同：RBE3 中心誤設 SPC 123456

> 更新：2026-10-29 · 分類：OptiStruct · 類型：問題排除
> 圖片均為重繪示意，非原始軟體截圖；數值屬既有案例紀錄，SPCFORCE 尚待驗證。

[知識庫 local mode 閱讀](../../index.html?source=local#ocp-rail-spcd-123456-mismatch-20261029)

## 問題現象

同一 OCP Rail 用 Force −490 N 或 SPCD −1.101 mm，左孔 Reference Node 26088 的 UZ 都是 −1.101 mm，但全模型最小 UZ、Stress Contour 差異明顯。最初 SPCD −1.379 mm 時又出現更大差異。

## 原因分析

(1) 用整個模型最小 UZ −1.379 mm 取代 Reference Node 位移 −1.101 mm，行程多了 0.278 mm；(2) 左孔 RBE3 Reference Node 26088 在 SPCD 版被設為 SPC 123456，額外限制 1、2、4、5、6 DOF。原 Force 版左孔為自由加力端；拘束條件不同導致孔壁變形／接觸／應力不同。

## 解決方法

1. 在原 Force Model 的最後已收斂結果套用 Displacement Z Contour，用 Measure → Nodal Contour → Node 26088（Visibility All）讀取 UZ=−1.101 mm，而非全模型最小值。

2. 對應 SPCD 設為 Node 26088、DOF 3、−1.101 mm，移除 FORCE −490 N。

3. SPC Collector 的左孔中心只留 DOF 3，別設 123 或 123456；右孔 RBE2 中心的 123456 保留。



![真正造成兩版結果不一致的 BC 差異](../../assets/figures/ocp-rail/04-spc-error.svg)

左孔原先使用 SPC 123456；修正為 SPC 3 後，Force 與 SPCD 結果接近。

4. 左孔 RBE3 不必為了位移控制改成 RBE2（仍需按 Solver 版本檢查相依 DOF）；Contact、Mesh、材料、右端固定皆保持不變。

5. 重新求解 NLSTAT + LGDISP，比較相同 Node UZ、全模型 Magnitude、應力、Contact；最後輸出 SPCFORCE 確認反力。

## 驗證結果

修改後左側 SPCD 版最大位移 Magnitude = 2.948 mm；右側 490 N Force 版 = 2.947 mm，相差約 0.034%，最大值皆為 Grid 1345，兩張 Von Mises Contour 外觀近乎相同。因兩圖 Stress Legend 上限 60 MPa，尚未確認未截斷的最大應力；SPCFORCE 反力仍待核對。



![Force vs SPCD 的驗證結果](../../assets/figures/ocp-rail/05-force-vs-spcd.svg)

原本 490 N 模型左孔中心 UZ=−1.101 mm；修正後最大位移幅值 2.947 vs 2.948 mm。

## 注意事項／限制

這是 BC 排查案例，不代表正式失效預測完成。SPC 456 何時有物理必要，應依實際試驗 Pin 治具約束決定。

延伸閱讀：[OCP Rail 知識線索引](ocp-rail-force-spcd-test-to-fail.md)、[指定 Node UZ 完整教學](ocp-rail-hyperview-node-uz-force-to-spcd.md)、[SPCFORCE 驗證](ocp-rail-spcforce-equivalence.md)。RBE3 REFGRID 上 SPC 以 NLSTAT + LGDISP 支援為前提；DOF 3 方向須核對有效 GRID CD。

【門檻載荷延伸】[SPCFORCE 反力與 60 MPa Stress-limit Load 教學](ocp-rail-spcforce-stress-limit.md)：先完成約 490 N 等效，再查同一已收斂增量的應力與反力；Time 不可直接當 SPCD 反力比例，應力門檻不等於破裂力。

## 參考來源

案例來源：既有 OCP Rail 審核分支保存的 2026-10-28～29 對話／HyperView 2026 截圖轉述。未取得原始 FEM、H3D、OUT 或原始截圖，未執行新一輪 OptiStruct 求解。數值屬既有案例紀錄，不能視為本次獨立驗證。

官方規則核對（2026-10-29；2025／2025.1 文件，介面位置依安裝版本而異）：
- Altair grid: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/grid_bulk_r.htm
- Altair spcd: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/spcd_bulk_r.htm
- Altair rbe3: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm
- Altair spcf: https://2025.help.altair.com/2025/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm

## 試過但無效

- 誤用全模型最小位移 −1.379 mm 作為施力中心行程。
- 左孔 SPCD 中心設定 123456，造成非預期側向／旋轉拘束。
- 用 Vector Plot 顯示整組位移向量查單點，畫面混亂；改使用 Nodal Contour Measure。
