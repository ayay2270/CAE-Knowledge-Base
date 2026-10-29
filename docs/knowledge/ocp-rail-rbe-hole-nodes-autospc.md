# OCP Rail｜RBE2／RBE3 孔壁節點、REFGRID 與 Auto-SPC 判讀

> 方法型知識文章；不保留特定模型 Node ID 或單點讀值。所有圖片為示意，非求解結果。

[開啟本機預覽](../../index.html?source=local#ocp-rail-rbe-hole-nodes-autospc-20261029)

## 知識摘要

識別 RBE 的參考點、周圍孔壁節點與有效自由度，並用 Auto-SPC 清單檢查模型。保留選點與排錯方法，不使用特定節點編號或固定的 Auto-SPC 數量。

## 技術說明

RBE2 施加剛性運動關係，RBE3 用權重連結參考點與周圍節點。兩者不等於真實 Pin–Hole 接觸。一般 Solid 不提供節點轉動剛度，轉動 DOF 的 Auto-SPC 與承載平移 DOF 被自動拘束，必須分開判讀；混有 Shell／Beam 時需查實際剛度與連接。

## 操作步驟

1. Review RBE 卡，識別參考點 REFGRID、REFC、周圍 Gi/Ci 與權重；不要用 RBE 元素編號代替參考節點。
2. 顯示孔內壁與連線，核對沿厚度的節點集合；網格改版後重新選取。
3. 比對 RBE2／RBE3 的剛性影響；若關注局部孔壁破壞，以 Pin + Contact 做敏感度分析。
4. 查 .out 的 Auto-SPC 清單，按位置與 DOF 分類；無剛度的轉動 DOF 與受力平移 DOF 不可一概而論，後者須追查斷連、剛體模態與接觸。
5. 在參考點使用 SPCD 前，依 Solver 版本、NLSTAT／LGDISP 與 RBE 相依關係確認支援；遇 dependent DOF 錯誤須先排查，不盲目增加拘束。

## 判讀規則

- 保留原 RBE3 才能比較相同載荷分配假設；改成 RBE2 後需重新建立 Force 基準。
- Solid 上無實際轉動剛度的 DOF 與 Shell／Beam 混接節點不可混為一談。
- RBE3 的加權運動不等於未加權的孔壁節點平均位移。

## 注意事項

Auto-SPC 必須依實際位置、DOF 與模型連接逐項判讀；沒有通用固定數量。延伸：[指定 REFGRID 讀 UZ 並轉 SPCD](#ocp-rail-hyperview-node-uz-force-to-spcd-20261029)、[Tetra4／Tetra10 節點集合檢查](#ocp-rail-tetra4-tetra10-convergence-20261029)

延伸閱讀：[OCP Rail 知識線索引](#ocp-rail-force-spcd-test-to-fail-20261029)

## 參考來源

方法型教學；不使用特定模型的節點編號、位移或峰值結果作為操作模板。未執行新的 OptiStruct 求解。官方文件依實際版本核對。
https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm

## 圖解

### 孔壁 Node 的正確選取區域

![孔壁 Node 的正確選取區域](../../assets/figures/ocp-rail/02-rbe-hole-nodes.svg)

水平 Pin 載荷須選內壁沿厚度方向的節點，勿只選上口；示意圖，非原始模型截圖。
