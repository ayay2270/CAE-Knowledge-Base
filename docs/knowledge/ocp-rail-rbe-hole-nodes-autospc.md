# OCP Rail｜RBE2／RBE3 孔壁 Nodes、REFGRID 與 Auto-SPC 192 判讀

> 更新：2026-10-29 · 分類：OptiStruct · 類型：技術知識
> 圖片均為重繪示意，非原始軟體截圖；數值屬既有案例紀錄，SPCFORCE 尚待驗證。

[知識庫 local mode 閱讀](../../index.html?source=local#ocp-rail-rbe-hole-nodes-autospc-20261029)

## 知識摘要

區分孔壁載荷分配與真實 Pin 接觸，建立可量測的 Reference Node。案例左孔 RBE3 REFGRID 為 26088；Auto-SPC 192 必須逐項對照自由度與節點，不能只看數量判定模型正確。



![孔壁 Node 的正確選取區域](../../assets/figures/ocp-rail/02-rbe-hole-nodes.svg)

水平 Pin 載荷須選內壁沿厚度方向的節點，勿只選上口；示意圖，非原始模型截圖。

## 技術說明

RBE2 將被連接節點的指定運動綁定到中心，可能提高孔附近剛性；RBE3 由周圍節點的加權運動定義 REFGRID，並不等於孔壁單側承壓接觸。一般 Solid 孔壁節點主要使用 123 平移 DOF。水平 Pin 載荷的簡化節點集合，應考慮孔內壁沿深度的表面，不是只選孔口一圈或實心體積內部節點。受力半圈／整圈選擇需記錄物理假設。

RBE3 的 REFGRID 預設是 dependent GRID。Altair 文件允許在 Large Displacement Nonlinear Analysis 對 REFGRID 施加 SPC；這是本案例 NLSTAT + LGDISP 的適用前提，不可推廣為任意線性／小位移設定都可照抄。UM 重新定義不支援 LGDISP，不是本教學的通用解法。

## 操作／設定步驟

1. 在 HyperMesh Review 該 RBE3 卡，記錄 EID、REFGRID=26088、REFC、周圍 Gi/Ci、權重；勿把某個孔壁 Gi 誤認為控制中心。

2. 顯示孔內壁與 RBE 連線，核對沿厚度節點集合；重新劃網格後重建／更新集合。

3. 比對 RBE2／RBE3 的孔壁位移與剛性影響；若關注孔壁壓潰／拉裂，以實體 Pin + Contact 做敏感度分析。

4. 查 .out 的 Auto-SPC 清單與 DOF：既有紀錄將 192 解釋為 64 個 Solid 節點 × 456，仍應以實際清單核實；若包含 123 或承載位置，追查剛體模態、斷連或接觸未閉合。

5. 施加 SPCD 前確認是 NLSTAT + LGDISP、有效版本支援，沒有重複 dependent DOF 或其他 MPC/SPC 衝突；遇 dependent d.o.f. constrained／ERROR #176 時查分析設定與卡片，不要只靠換成 RBE2 隱藏差異。

## 關鍵參數／判斷規則

- 保留原 RBE3 才能比較相同載荷分配假設；改成 RBE2 後需重新建立 Force 基準。
- Solid 上無實際轉動剛度的 DOF 與 Shell／Beam 混接節點不可混為一談。
- RBE3 的加權運動不等於未加權的孔壁節點平均位移。

## 注意事項／限制

本次未拿到 .out 的 Auto-SPC 逐項清單，192 的來源屬既有案例轉述，仍待檔案確認。延伸：[指定 REFGRID 讀 UZ 並轉 SPCD](ocp-rail-hyperview-node-uz-force-to-spcd.md)、[Tetra4／Tetra10 節點集合檢查](ocp-rail-tetra4-tetra10-convergence.md)

延伸閱讀：[OCP Rail 知識線索引](ocp-rail-force-spcd-test-to-fail.md)

## 參考來源

案例來源：既有 OCP Rail 審核分支保存的 2026-10-28～29 對話／HyperView 2026 截圖轉述。未取得原始 FEM、H3D、OUT 或原始截圖，未執行新一輪 OptiStruct 求解。數值屬既有案例紀錄，不能視為本次獨立驗證。

官方規則核對（2026-10-29；2025／2025.1 文件，介面位置依安裝版本而異）：
- Altair rbe3: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm
