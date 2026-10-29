# OCP Rail｜SPCD Test to Fail：F–u 曲線、塑性與破裂判據的界線

> 更新：2026-10-29 · 分類：OptiStruct · 類型：技術知識
> 圖片均為重繪示意，非原始軟體截圖；數值屬既有案例紀錄，SPCFORCE 尚待驗證。

[知識庫 local mode 閱讀](../../index.html?source=local#ocp-rail-test-to-fail-limits-20261029)

## 知識摘要

完成 Force／SPCD 等效檢查後，可用位移控制逐步建立 Reaction Force–Displacement 曲線。但只有彈塑性材料、超過 Yield 或 Solver 不收斂，都不足以直接宣稱已預測塑膠破裂力。

## 技術說明

位移控制有助於追蹤受載反應；對非線性摩擦／塑性模型，必須保留載入歷程與初始接觸狀態。塑膠裂斷、Insert 拔出、孔壁壓潰與接觸滑移可能是不同模式，需要材料試驗與結構試驗對應。靜力失穩或多重平衡路徑也可能需要更適當的追蹤方法，單一 SPCD 不能保證走完整段失效路徑。



![測試 A：只有 Rail + 兩根 Pin](../../assets/figures/ocp-rail/01-rail-test.svg)

水平拉伸力路徑與右端固定，Global Z 為 Rail 長度方向。

## 操作／設定步驟

1. 先完成[SPCFORCE 等效檢查](ocp-rail-spcforce-equivalence.md)，以 −1.101 mm 作本案例第一個位移基準，反力仍需實際核實。

2. 在相同初始 Press Fit／Contact 狀態下逐步增加負向行程，合理設定非線性增量與輸出，保存已收斂步的 FZ、UZ、塑性應變、接觸滑移／開離。

3. 由驅動端帶符號反力與指定控制點位移建立 F–u 曲線；若與試驗機數據比較，記錄量測位置及治具柔度。

4. 出現 load drop、不收斂或應力超過 Yield 時，分別檢查接觸、失穩、材料參數、網格與數值設定；標記觀察，不直接命名破裂。

5. 若要預測斷裂，取得經校準的損傷／失效模型、適用應變率／溫度與網格客觀性，並以實驗破壞模式、位置與載荷驗證。

## 關鍵參數／判斷規則

- 現有紀錄僅有位移場對照，反力／失效驗證均未完成。
- 不把最後收斂點或 60 MPa 當成破裂載荷。
- 通過單點 Force／SPCD 等效，不代表材料、Contact 與破壞模型已由實測驗證。

## 注意事項／限制

待補：SPCFORCE、Pin + Contact、治具自由度、Press Fit 干涉與摩擦、材料失效資料、Tetra10 收斂序列。延伸：[Press Fit 知識線](ocp-rail-press-fit-contact.md)、[網格收斂](ocp-rail-tetra4-tetra10-convergence.md)

延伸閱讀：[OCP Rail 知識線索引](ocp-rail-force-spcd-test-to-fail.md)

後續專題：[SPCFORCE／NLOUT 與 60 MPa Stress-limit Load](ocp-rail-spcforce-stress-limit.md)（保留上游既有教學，門檻載荷仍待原模型驗證）。

## 參考來源

案例來源：既有 OCP Rail 審核分支保存的 2026-10-28～29 對話／HyperView 2026 截圖轉述。未取得原始 FEM、H3D、OUT 或原始截圖，未執行新一輪 OptiStruct 求解。數值屬既有案例紀錄，不能視為本次獨立驗證。

官方規則核對（2026-10-29；2025／2025.1 文件，介面位置依安裝版本而異）：
