# OCP Rail｜HyperView 指定 RBE3 Reference Node 量 UZ：Force −490 N → SPCD −1.101 mm 完整圖文教學

> 更新：2026-10-29 · 分類：OptiStruct · 類型：技術知識
> 圖片均為重繪示意，非原始軟體截圖；數值屬既有案例紀錄，SPCFORCE 尚待驗證。

[知識庫 local mode 閱讀](../../index.html?source=local#ocp-rail-hyperview-node-uz-force-to-spcd-20261029)

## 知識摘要

從 Force 結果定位 RBE3 REFGRID 26088，在 HyperView 讀出 Global UZ=−1.101 mm；以只宣告 SPC 3 的 SPCD 模型重現，最後用 SPCFORCE 與平衡檢查驗證是否等效 −490 N。28 個步驟涵蓋選 frame、By ID、隱藏節點、座標、Load Step、輸出與排錯。

## 技術說明

【範圍】此案例為 NLSTAT + LGDISP，採 N–mm；左孔 26088、右孔 26087。原圖在既有文章中僅留下數值紀錄，本次配圖是操作示意，不冒充 HyperView 截圖。

【控制量】UZ 是指定節點的位移 Z 分量。−1.379 mm 是全模型最小 UZ，2.947／2.948 mm 是 Max |U|；三者不能互換。控制點 −1.101 mm 是由原 −490 N 解的結果取得，並非普遍成立的單位轉換。

【等效範圍】相同邊界與狀態下重現同一控制自由度，是等效檢查起點。非線性接觸、摩擦、塑性與多重平衡路徑可能讓終點相同但反力／歷程不同；還必須查力與狀態。此處 WAIVE 僅表示以經驗證的位移控制替代該力載入，不代表自動豁免實驗或規範。

## 操作／設定步驟

1. 建立可追溯的 Force 基準：另存原 FEM、H3D、OUT，記錄模型／網格版本、單位 N–mm、OptiStruct 版本、NLSTAT + LGDISP、左孔 RBE3 與右端固定方式。此次教學使用既有案例值，不代表已開啟或重算原 H3D。

2. 在 HyperMesh 查左孔 RBE3 卡的 REFGRID，不靠畫面孔中心猜 ID。本案例 REFGRID=26088，右端 RBE2 中心=26087；記下 EID 與參考節點的實體位置。換網格後必須重新查。

3. 核對座標：檢查 Node 26088 的有效 GRID CD（含 GRDSET 預設）與 FORCE CID。本教學 DOF 3 對應畫面 Global Z 的條件是節點位移座標採 Basic／相同 Z 方向；CD 非零時先轉換到一致方向，不能直接把 Global UZ 填入任意 local DOF 3。

4. 在 HyperView 載入配對的模型與 Force 結果檔；若分開指定 model/result，兩者必須屬同一次網格版本。確認 active model，避免從疊圖的另一個模型選到同 ID。

5. 在 Loadcase／Simulation 選 Force −490 N 的子案例，停在實際已達到完整載荷的最後已收斂增量。查 .out 確認正常完成及載荷比例，不把中止前的最後一張圖當作已達 −490 N；不要使用跨步 Envelope。

6. 開啟 Contour（Results ribbon／傳統 Results 工具列，依版本），Result type 選 Displacement，Data component 選 Z；Resolved in 選 Global System。按 Apply。此時畫面顯示的是 UZ，不是 Magnitude、座標 Z 或 Stress。



![先固定結果、Z 分量與座標系](../../assets/figures/ocp-rail/07-hyperview-contour.svg)

操作欄位示意，非 HyperView 原始截圖；先確認完整載荷已收斂，再 Apply Displacement / Z / Global。

7. 開 Measure（Home／Measure 或傳統工具列，依版本），建立或選一個量測群組；Measure type 選 Nodal Contour，entity 選 Nodes，啟用 Value 與 Node ID 顯示。若沒有 Nodal Contour，先確認上一步已套用 nodal displacement contour。

8. 點 Nodes selector 進入延伸選取／By ID。把 Visibility Filter 設 All，讓被隱藏的參考節點可被查到；注意這是可見性篩選 All，不是點「All」把整個模型的 Nodes 全選。

9. By Node ID 輸入 26088（相等／單一 ID），確認選取後顯示的是該模型的 Node 26088；依版本按 Add／Apply／OK 接受。若清單有舊節點，先 reset，只留下目標 Node；不要誤用 Element ID、Component ID 或 RBE EID。



![Measure：用 ID 找到 Reference Node 26088](../../assets/figures/ocp-rail/08-reference-node-selection.svg)

操作示意，非軟體截圖。Visibility Filter=All 不等於全選 Nodes；By Node ID 只選 26088。

10. 回到 Measure 讀取 Node ID 與 Value。本案例既有紀錄為 Node 26088、Global UZ = −1.101 mm。提高顯示小數位並保存未四捨五入值供實際換算；截圖需同時看得到 model、subcase、frame、Displacement/Z、Global、Node ID 及單位註記。

11. 交叉檢查 Query：在已套用相同 contour 的視窗開 Results → Query／Query tool，顯示 Node ID 與 Contour (Displacement)，選同一 Node 26088。兩者數值應一致；Nodal Contour 跟隨目前 contour，切到 Stress 後它不再代表 UZ。

12. 排除錯讀：全模型 Min UZ = −1.379 mm 是另一位置的極值，不能取代 26088 的 −1.101 mm；Max Displacement Magnitude 約 2.947 mm 是向量長度極值，也不能當作負 Z 行程。用 Position 讀到的是位置座標，不能直接當成位移。



![控制點 UZ 與模型極值的差別](../../assets/figures/ocp-rail/09-uz-not-model-min.svg)

案例數值重繪示意，非新增求解；−1.101 mm 才是本案例 REFGRID 的位移。

13. 保存基準量測紀錄：Force=−490 N、Node=26088、方向 Global Z、UZ=−1.101 mm、完整載荷增量、網格版本；必要時由量測群組建立曲線，保存各已收斂增量的 UZ 與對應載荷，不只截一個數字。

14. 解讀「換算／WAIVE Force」：這是先以 Force 求解得到控制點的位移，再用同一點同方向 SPCD 重現該狀態；不是 N 直接換成 mm。單點割線剛性 |F/UZ|≈445.05 N/mm 只作此狀態檢查；接觸、塑性、LGDISP 下不可把它當作整段常數剛性。

15. 另存 SPCD 模型版本，保留網格、材料、Contact／Press Fit 初始狀態、左 RBE3、右 RBE2、NLSTAT + LGDISP、NLPARM、NLOUT 與其他真實外力。移除／停用原左端 actuator FORCE −490 N，並檢查 active Load Step 確實不再引用它；此比較不在同 DOF 同時疊加原 FORCE。

16. 在作用中的 SPC Collector 保留右端 Node 26087 的既有 SPC 123456=0；左端只新增 Node 26088、DOF 3、SPC value=0。1、2、4、5、6 保持原 Force 基準的自由狀態。SPC 的 0 是被 SPCD 選中的 DOF 宣告，該 DOF 的非零行程由 SPCD 指定。

17. 確認 RBE3 相依自由度的支援條件：本案例使用 NLSTAT + LGDISP；依 Altair RBE3 文件，LGDISP 非線性允許在 REFGRID 施加 SPC。若改成線性／小位移、出現 dependent DOF 錯誤或另有 MPC 衝突，先檢查，不把這套設定當作通用模板，也不盲目加 UM。

18. 另建 SPCD Collector：Node=26088、component=3、D=−1.101 mm（實作優先用基準未四捨五入值）。確認負號、mm 單位及所屬節點座標方向，且未誤選右端或孔壁 Node。

19. 在同一 Load Step 中，SPC 直接選含右固定端＋左 DOF3 的 SPC set（分多個 set 時用 SPCADD 組合）；LOAD 直接選 SPCD 的 SID，不能把 SPCD 當成 SPC set 選取。不要用 Bulk Data LOAD combination 包住 SPCD；這與 Subcase 的 LOAD 選集是兩件事。保留原 NLSTAT／LGDISP／非線性增量設定。



![SPC／SPCD／Load Step 的對應](../../assets/figures/ocp-rail/10-spc-spcd-loadstep.svg)

設定示意，非軟體截圖；LGDISP 前提，CD 方向核對，LOAD 直接選 SPCD SID。

20. 加入位移與反力輸出，例如 DISPLACEMENT(H3D)=ALL、SPCFORCE(H3D,OPTI)=ALL；若需增量歷程，依版本用 NLOUT／SPCFORCE 的 nlout 選項保存，避免只輸出最終值。先檢查 export FEM 的 SUBCASE、SPC、SPCD、LOAD 與輸出 request，不能只看 Collector 名稱。

21. 求解後先查 .out 是否正常完成、SPCD 是否到達完整目標、是否有 dependent DOF／Auto-SPC 新警告；未到完整行程就不能拿來對照 Force 完整載荷。

22. 在 SPCD 結果重複相同 Contour → Measure → Node 26088 操作，確認最後已收斂狀態 UZ≈−1.101 mm，並核對 UX／UY 與其他自由方向未被多鎖。若 UZ=0，優先查 LOAD 是否選到 SPCD、SPC set 是否作用與 frame 是否正確。

23. 比對整體位移場與最大值位置：既有案例 Force Max |U|≈2.947 mm、SPCD≈2.948 mm，皆 Grid 1345，差約 0.034%。這只是已記錄的位移場證據；尚不能據此宣稱 SPCD 等效 −490 N。



![Force vs SPCD 的驗證結果](../../assets/figures/ocp-rail/05-force-vs-spcd.svg)

原本 490 N 模型左孔中心 UZ=−1.101 mm；修正後最大位移幅值 2.947 vs 2.948 mm。

24. 在 HyperView 選 SPC Forces／SPC Force（依結果名稱）及 Z component，Resolved in Global System，仍查同一最終增量。用 Query／結果表逐一記錄驅動 Node 26088 的帶符號 FZ 及右端支承集合的 FZ；不能把 SPC Force Magnitude 或全模型最大值當作軸向反力。

25. 做反力驗證：採「對結構施力」的同一符號慣例，Force 基準為左 −490 N、右支承總和約 +490 N；SPCD 版預期左驅動約 −490 N、右支承約 +490 N（待實際輸出確認）。若工具顯示結構對治具反力，符號相反，先轉為同慣例再比。勿把兩端一起加總後的近 0 N 誤認為沒有 490 N 載荷。



![SPCFORCE：分開兩端，再查力平衡](../../assets/figures/ocp-rail/11-spcforce-balance.svg)

預期符號與驗證方法示意，非已量測反力；本案例約 490 N 仍待實際輸出確認。

26. 依團隊容許誤差分別算 eF=||Fdrive,Z|−490|/490×100%，及平衡殘差 eBal=|ΣFexternal,Z+ΣRSPC,Z|/490×100%。SPCD 版 external 不再含舊 actuator FORCE，兩端 SPC 各算一次；完整模型的內部 Contact 不另加到外力。若有其他外力／支承都要納入，並核對 X/Y 與力矩平衡。

27. 最後在同座標、同平均法、同材料／接觸歷程下比較 Von Mises、接觸開閉／滑移、塑性應變；取消 60 MPa 固定 legend 截斷後讀真正峰值。若反力不符，按座標、載荷比例、額外 SPC、原 FORCE 殘留、RBE 集合、接觸／塑性路徑、輸出 rounding 順序排查。

28. 完成證據表後才下結論：位移場接近＋SPCFORCE 約 490 N＋平衡通過＋接觸／材料狀態相符，才稱此模型此狀態的 Force／SPCD 等效；工程規範的 waive 還需要負責人接受。此 repo 目前反力欄位保持待驗證，不能記為已通過。

## 關鍵參數／判斷規則

- 只量原施力 Reference Node 的同一分量；每次看清 active model、subcase、frame、node、result type、component、resolved system、unit。
- Nodal Contour 值依目前 contour 改變；Stress N/A 不代表 Reference Node 沒有位移。
- 左端 SPC 3 的零值與同 DOF 的 SPCD 非零值是搭配使用；額外加 SPC 123／123456 會改變此案例邊界。
- DOF 3 由有效 GRID CD 決定；CD=0 為 Basic。不可只看到畫面 Global Z 就推定卡片方向相同。
- 本案例的 RBE3 REFGRID 上 SPC 以 LGDISP 非線性為前提；輸出 dependent DOF 錯誤時必須查清。
- SPCFORCE 490 N 尚待檔案核實；2.947 vs 2.948 mm 不足以代替反力驗證。

## 注意事項／限制

找不到節點：確認 model/result 配對、active model、By Node ID、Visibility Filter=All、ID 是否被重新編號，以及結果有無該 GRID。N/A：先排除沒有 contour、讀 Stress、錯 frame 或輸出未含該點；仍缺資料時回原 deck 請求位移輸出重算，不捏造數值。滿畫面向量：關 Vector plot，保留 Contour＋Measure 即可。

專題延伸：[SPCFORCE 詳細驗證與證據表](ocp-rail-spcforce-equivalence.md)、[SPC 123456 → 3 排錯紀錄](ocp-rail-spcd-123456-mismatch.md)、[RBE3 與 Auto-SPC 適用條件](ocp-rail-rbe-hole-nodes-autospc.md)

延伸閱讀：[OCP Rail 知識線索引](ocp-rail-force-spcd-test-to-fail.md)

後續專題：[SPCFORCE／NLOUT 與 60 MPa Stress-limit Load](ocp-rail-spcforce-stress-limit.md)（保留上游既有教學，門檻載荷仍待原模型驗證）。

## 參考來源

案例來源：既有 OCP Rail 審核分支保存的 2026-10-28～29 對話／HyperView 2026 截圖轉述。未取得原始 FEM、H3D、OUT 或原始截圖，未執行新一輪 OptiStruct 求解。數值屬既有案例紀錄，不能視為本次獨立驗證。

官方規則核對（2026-10-29；2025／2025.1 文件，介面位置依安裝版本而異）：
- Altair measure: https://2025.help.altair.com/2025.1/hwdesktop/hlife/topics/panels/measure_panel_define_measure_group_t.htm
- Altair select: https://2025.help.altair.com/2025.1/hwdesktop/hwx/topics/panels/input_collector_ext_entity_selection_menu_r.htm
- Altair selection: https://2025.help.altair.com/2025.1/hwdesktop/hwx/topics/user_interface/selection_advanced_t.htm
- Altair contour: https://2019.help.altair.com/2019/tutorials/hv-3000.pdf
- Altair grid: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/grid_bulk_r.htm
- Altair spcd: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/spcd_bulk_r.htm
- Altair rbe3: https://2025.help.altair.com/2025/hwsolvers/altair_help/topics/solvers/os/rbe3_bulk_r.htm
- Altair spcf: https://2025.help.altair.com/2025/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm

## 匯出 deck 對照（節錄，不是可獨立求解的模型）

以下 SID 100／200 是示例，須與既有模型 ID 避免衝突。保留原本的材料、網格、Contact、RBE3、NLPARM／NLOUT 與其他控制卡。此節錄以有效 GRID CD 對齊 Basic Z、NLSTAT + LGDISP 為前提。

```text
SUBCASE 1
  ANALYSIS = NLSTAT
  SPC = 100
  LOAD = 200
  DISPLACEMENT(H3D) = ALL
  SPCFORCE(H3D,OPTI) = ALL
BEGIN BULK
PARAM,LGDISP,1
SPC,100,26087,123456,0.0
SPC,100,26088,3,0.0
SPCD,200,26088,3,-1.101
$ 原 actuator FORCE 在此比較版停用；LOAD=200 直接選 SPCD SID
$ 其餘模型與非線性控制卡保留，並另核對增量輸出
```

SPC 的 0 不會把已選取的 SPCD 非零位移取消。Subcase `LOAD = 200` 是選載荷集，不是 Bulk Data `LOAD` combination；SPCD 不可被後者組合。

## 本案例證據表

| 指標 | Force 基準 | SPCD 版本 | 狀態 |
|---|---|---|---|
| 原 actuator | FZ = −490 N | 原 FORCE 停用 | 既有設定紀錄 |
| REFGRID 26088 UZ | −1.101 mm | −1.101 mm 目標 | 需依原檔確認完整精度 |
| Max Magnitude | 約 2.947 mm | 約 2.948 mm | 既有對照；約 0.034% |
| 最大值位置 | Grid 1345 | Grid 1345 | 既有紀錄 |
| 左驅動／右支承 FZ | 外力 −490 N／反力待查 | 兩端反力待查 | SPCFORCE 待驗證 |
| eF／eBal | 待計算 | 待計算 | 無實際反力資料 |
| 未截斷 stress／Contact／塑性 | 待核實 | 待核實 | 不能只看 60 MPa legend |

## 量測留存欄位

模型版次／FEM、H3D、OUT 檔名；軟體版本；單位；有效 CD／FORCE CID；RBE3 EID／REFGRID；subcase；已收斂 frame 與載荷比例；result/component/resolved system；Node ID；UZ 完整精度；SPCD SID／SPC SID；左右端帶符號反力；允收門檻；接觸／塑性狀態；判定與待補項目。
