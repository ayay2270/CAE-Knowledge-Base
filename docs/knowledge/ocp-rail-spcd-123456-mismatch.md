# SPCD 與 Force 應力／變形不同：驅動參考點額外 SPC 拘束排查

> 方法型知識文章；不保留特定模型 Node ID 或單點讀值。所有圖片為示意，非求解結果。

[開啟本機預覽](../../index.html?source=local#ocp-rail-spcd-123456-mismatch-20261029)

## 問題現象

Force 與 SPCD 的驅動方向位移相近，但整體變形或應力不同。此文說明通用排查方法，不保存特定模型的節點編號與結果數值。

## 原因分析

常見原因是以全模型最小位移取代驅動點位移，或在 SPCD 版額外加入側向／轉動 SPC，使兩版邊界不同。另需查座標、殘留外力及接觸／材料路徑。

## 解決步驟

1. 在基準 Force 模型的目標已收斂增量讀取實際驅動點的位移分量。
2. 以同點、同方向、同座標 SPCD 重現量測位移，移除原驅動 FORCE。
3. 檢查驅動點僅宣告必要 SPC 自由度，維持實際支承約束，不任意增加 123 或 123456。
4. 保持 RBE、材料、網格、接觸與載入歷程一致；依 LGDISP／相依 DOF 條件排查。
5. 重新求解並比較位移場、SPCFORCE、整體平衡、應力與接觸狀態。

## 驗證方法

保存兩版帶符號反力、同點位移、平衡殘差與接觸／材料狀態，依事先定義的專案容許差判定。此文沒有求解驗證數據。

## 注意事項

這是 BC 排查案例，不代表正式失效預測完成。SPC 456 何時有物理必要，應依實際試驗 Pin 治具約束決定。

延伸閱讀：[OCP Rail 知識線索引](#ocp-rail-force-spcd-test-to-fail-20261029)、[指定 Node UZ 完整教學](#ocp-rail-hyperview-node-uz-force-to-spcd-20261029)、[SPCFORCE 驗證](#ocp-rail-spcforce-equivalence-20261029)。RBE3 REFGRID 上 SPC 以 NLSTAT + LGDISP 支援為前提；DOF 3 方向須核對有效 GRID CD。

【門檻載荷延伸】[SPCFORCE 反力與 60 MPa Stress-limit Load 教學](#ocp-rail-spcforce-stress-limit-20261029)：先完成約 490 N 等效，再查同一已收斂增量的應力與反力；Time 不可直接當 SPCD 反力比例，應力門檻不等於破裂力。

## 參考來源

方法型教學；不使用特定模型的節點編號、位移或峰值結果作為操作模板。未執行新的 OptiStruct 求解。官方文件依實際版本核對。
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/grid_bulk_r.htm
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/spcd_bulk_r.htm
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm
https://2025.help.altair.com/2025/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm

## 圖解

### Step 3｜真正造成兩版結果不一致的 BC 差異

![真正造成兩版結果不一致的 BC 差異](../../assets/figures/ocp-rail/04-spc-error.svg)

左孔原先使用 SPC 123456；修正為 SPC 3 後，Force 與 SPCD 結果接近。

### Force→SPCD：量測與驗證流程

![Force→SPCD：量測與驗證流程](../../assets/figures/ocp-rail/05-force-vs-spcd.svg)

方法示意：以實際驅動位置的量測位移重現狀態，並核對反力、平衡與歷程。
