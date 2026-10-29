# OCP Rail｜壓入式 Nut／Insert：TIE、Frictional Contact 與 Press Fit 初始狀態

> 更新：2026-10-29 · 分類：OptiStruct · 類型：技術知識
> 圖片均為重繪示意，非原始軟體截圖；數值屬既有案例紀錄，SPCFORCE 尚待驗證。

[知識庫 local mode 閱讀](../../index.html?source=local#ocp-rail-press-fit-contact-20261029)

## 知識摘要

本案例 Nut／Insert 為塑膠成型後壓入；TIE 可作比較基準，但不能據此代表真實干涉預壓、摩擦滑移與拔出。建立接觸版本時，需要壓入後的初始狀態與實驗參數。



![壓入式 Nut：TIE 與 Contact](../../assets/figures/ocp-rail/03-pressfit-interface.svg)

壓入固定應評估干涉、預緊及摩擦，不可把 SLIDE Contact 視同完全黏合。

## 技術說明

TIE 是理想化連結；無干涉的可滑動 Contact 也不等同壓入固定。真實界面可能透過干涉、摩擦與幾何卡合傳力；缺少法向壓力時容易過度滑動。干涉量、摩擦係數與製程殘留狀態尚未取得，本條目提供建模與比對路線，不宣稱已驗證任何數值。

## 操作／設定步驟

1. 確認 Insert 是壓入、射出包覆、膠合或其他製程；記錄尺寸公差、干涉量與試驗狀態。

2. 保留 TIE 理想化基準，另外建立 Frictional Contact 版本，記錄接觸對、初始間隙、摩擦、面法向與允許開離。

3. 以適合求解器的干涉／壓入程序建立預壓狀態；主拉伸分析須繼承相同初始狀態，不能每個比較模型各用不同接觸起點。

4. 比對 Contact Pressure、開離、滑移、Insert 相對 Rail 位移與塑性應變；若缺少實驗參數，將範圍列為敏感度，不填假精準常數。

5. 力／位移控制比較時保持界面設定與載入歷程；完成[SPCFORCE 驗證](ocp-rail-spcforce-equivalence.md)後，才討論後續拔出或破裂。

## 關鍵參數／判斷規則

- Contact 名稱不是物理驗證；確認實際卡片與傳力方式。
- TIE 可用來辨識界面柔度影響，不能當作唯一真實模型。
- Insert pull-out 與塑膠裂斷是不同失效模式。

## 注意事項／限制

本次未建立新接觸模型或決定摩擦係數。延伸：[載荷路徑與治具](ocp-rail-fixture-load-path.md)、[Test to Fail 限制](ocp-rail-test-to-fail-limits.md)

延伸閱讀：[OCP Rail 知識線索引](ocp-rail-force-spcd-test-to-fail.md)

## 參考來源

案例來源：既有 OCP Rail 審核分支保存的 2026-10-28～29 對話／HyperView 2026 截圖轉述。未取得原始 FEM、H3D、OUT 或原始截圖，未執行新一輪 OptiStruct 求解。數值屬既有案例紀錄，不能視為本次獨立驗證。

官方規則核對（2026-10-29；2025／2025.1 文件，介面位置依安裝版本而異）：
