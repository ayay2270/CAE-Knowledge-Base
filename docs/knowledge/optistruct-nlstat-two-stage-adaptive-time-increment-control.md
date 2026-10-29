# OptiStruct NLSTAT – Two-Stage Adaptive Time Increment Control

> 方法型知識文章；本次排查示例使用使用者指定的 Node 與候選位移。所有圖為原創示意，非求解證據。

[開啟本機預覽](../../index.html?source=local#optistruct-nlstat-two-stage-adaptive-time-increment-control-20261029)

## 知識摘要

【審核草案／尚未完成求解驗證】分類：OptiStruct / Nonlinear Analysis（軟體分類／主題標籤）。目標是在總載入參數 Time 0–0.75 使用粗增量，0.75–1.0 使用細增量，按載入順序找材料首次達到專案 60 MPa 門檻時同增量的 SPCFORCE。
2026 官方文件已核對卡片語意；候選數值、完整兩階段載入組合與 HyperMesh 操作仍須以實際 2026 安裝版與小模型試跑確認。本次補入使用者指定的 Node 26088／26087 與候選位移作為故障排查示例，並非求解證據；未提供虛構反力。新增 Time 0.75 後結果停滯的排查與正確／錯誤位移歷程示意。

## 官方規則、候選設定與載入設計

【文件已確認：時間與步長】NLPARM 的 TTERM 使用各 Subcase 的局部持續時間。未另設 DT 時，初始步長為 TTERM/NINC；一旦指定 DT，NINC 會被忽略。NLADAPT 的 DIRECT=NO 採自適應增量，DTMAX 限制增量上限；NLOUT 的 FREQ 僅控制儲存頻率，不會加密求解。

【候選數值／非驗證成果】Stage 1：TTERM=0.75、NINC=8、DT 留白；DTMAX=0.1、DIRECT=NO；NLOUT FREQ=1。Stage 2：TTERM=0.25、NINC=36、DT 留白；DTMAX=0.007、DIRECT=NO；NLOUT FREQ=1，CNTNLSUB=YES。依公式計算初始步長分別 0.09375 與約 0.00694444；這是設定算術，不是觀察到的步長。自適應 cutback／growth 會改變實際增量數，不保證剛好 8 與 36 步，也不保證更快。

【文件已確認：續接】CNTNLSUB=YES 接續 deck 順序中前一個同型非線性 Subcase；SID 可明確指定前一 Subcase。它續接已求解狀態，不會自動替你建立想要的 SPCD 曲線。移除上一階段的 SPC／SPCD／外力會引發等效內力逐步卸載；D=F 用於保持前段變形邊界，不能當作繼續增加行程。

【候選載入設計：明定總時間曲線】先定義終點帶符號位移 u_T。設計意圖為 u(t)=t×u_T：總時間 0、0.75、1.0 分別為 0、0.75u_T、u_T。可用同一 SPCD 作基底，透過 TLOAD1 的 TYPE=DISP、TID 曲線及 TSTIME=TOT，再由兩個 NLSTAT Subcase 的 DLOAD 選用；官方文件支援 NLSTAT 的這類曲線與總時間切換。本文將此完整組合作為待測方案，尚未執行邊界連續性驗證。

【不要混淆兩種控制】只填 TTERM=0.75 並沿用直接 LOAD 的完整 SPCD 目標，不足以證明 Stage 1 停在 75% 行程。若改採兩個直接 LOAD／SPCD 端點，必須另外確認該版 Solver 的端點解讀與續接 ramp，不能把第二段直接填成 0.25u_T 當作增量。主教學採明定總時間曲線的候選方式，避免把時間長度誤當位移倍率。

【問題現象／使用者回報，未獨立重現】實際運算在累積 Time 0.75 後，Displacement、Stress 等結果幾乎不再變化。目前未取得本次 .fem、H3D、.out／.monitor，不能確認根本原因。高度懷疑兩段共用相同的完整 SPCD 目標，Stage 1 已達完整行程，Stage 2 沒有額外行程；這是待驗證的根因假說，不能由色階或 Time 單獨證明。

【根因分析／文件與推論分開】NLPARM Comment 5 明確定義 TTERM 為 Subcase time；CNTNLSUB 定義與 Comments 6–7 說明續接、移除邊界的逐步卸載與 D=F 保持。它們沒有規定 TTERM=0.75 就自動把直接 LOAD 的 SPCD 乘 0.75。SPCD 的 D 欄為指定運動值，且覆蓋同段 SPC 的值；但本次查閱的 SPCD／CNTNLSUB 2026 參考頁未明文定義「續接 Subcase 中數值 D 的絕對／增量解讀及插值起點」。因此不能把 Stage 2 D=-1.101 mm 當作已核實的絕對終點規則，也不能擅自改成增量 -0.27525 mm。若兩段保持相同已達位移，後段可能呈平台；此機制與本案是否相符，須由真實 UZ 歷程與 deck 驗證。

【本次指定示例／候選，不是已驗證操作】左孔 RBE3 參考 Node 26088、SPC DOF 3，以 SPCD 控制；右孔 RBE2 Node 26087、SPC DOF 123456。兩段保留相同 Contact、Material、Property、Mesh 與其他必要邊界。期望總位移檢查點為 Time 0 → UZ=0 mm、Time 0.75 → UZ≈-0.82575 mm、Time 1.0 → UZ≈-1.101 mm。-0.82575=0.75×(-1.101)，餘下位移差為 -0.27525 mm；這些是設計算術，並非 Solver 讀值或卡片增量語意。負 Z 拉伸時 UZ 應更負、|UZ| 增加，不能把帶符號 UZ 的增加與位移量增加混為一談。

【候選修正 B／獨立端點 Collector】為排查直接 LOAD 的現有模型，另存副本並分開 SPCD_STAGE1、SPCD_STAGE2：各自只含 Node 26088、DOF 3；候選 D 分別 -0.82575 與 -1.101 mm。Stage 1 的 LOAD 指第一個 SID；Stage 2 的 LOAD 指第二個 SID，CNTNLSUB=YES 接前段，SPC 兩段均涵蓋同一受控 DOF。這組 D 值只有在小模型確認它們產生所列總位移檢查點後才能採用；若實際解讀不同，先依實測與 Altair 確認修正，不把 -1.101 與前段手動相加，也不盲填差值。原文候選 A 的 DLOAD→TLOAD1(TYPE=DISP,TSTIME=TOT)→SPCD／TABLED1 總時間曲線仍保留，與此 B 方案擇一，不在同一受控 DOF 同時疊加。兩方案均未經本案 Solver 試跑。

【時間紀錄／官方已確認】.monitor 的 SUBCASE TIME 在續接段從 0 開始；CURRENT TIME 延續前段終點；LOAD FACTOR 是各 Subcase 的正規化時間，不是累積 Time，更不是非線性反力比。此候選 Stage 2 局部 0–0.25 對應累積 0.75–1.0。核對檔案表頭，不把 HyperView 顯示的 0–1 Load Factor 直接當累積時間。

## HyperMesh 2026 操作步驟

1. 確認工作副本與適用範圍：HyperMesh 2026 New Session 選 OptiStruct Profile，匯入配對 Solver Deck。保持原材料、接觸、治具及 LGDISP 條件；本教學是 NLSTAT 載入參數控制，不是實際試驗速度控制。先另存工作版本。

2. 先定義物理載入：在模型上識別驅動控制點與對應方向，使用符號 u_T 表示終點行程。列出預期三點曲線 (總時間, 位移倍率)=(0,0)、(0.75,0.75)、(1,1)。對不同載入歷程另建曲線，不從 60 MPa 推定位移，也不預設門檻一定發生在最後四分之一。

3. 建立兩張 NLPARM：Model Browser 空白處右鍵 Create → Load Step Inputs，在 Entity Editor 選 Config type=Nonlinear Parameters、Type=NLPARM，命名 NLPARM_STAGE1／NLPARM_STAGE2。輸入 Stage 1 的 NINC=8、TTERM=0.75，Stage 2 的 NINC=36、TTERM=0.25；DT 保持未指定。保留經批准的收斂準則，不能為了加速任意放寬。

4. 建立兩張 NLADAPT：同一 Create → Load Step Inputs，Config type=Time step Parameters、Type=NLADAPT，命名 NLADAPT_STAGE1／NLADAPT_STAGE2。分別啟用 DTMAX=0.1／0.007，DIRECT 都選 NO。檢查 DTMIN、NCUTS 與其他既有控制，不混用另一套 NLCTRL 控制；它們不在這份候選數值的已驗證範圍。

5. 建立 NLOUT：Create → Load Step Inputs，Config type=Output Parameters、Type=NLOUT。選輸出選項 FREQ，整數 Value 填 1，VALUE REAL 不勾；讓匯出卡片為 NLOUT,<輸出ID>,FREQ,1。NLOUT 頁面可有整數與實數欄位切換，但 FREQ 的 Solver 定義是正整數；不是填 1.0 秒或 0.007。兩段可共用同一 NLOUT。

6. 只將收斂解用於判定：可在 NLOUT 設 SVNONCNV=NO，或保留非收斂診斷結果但在後處理明確排除。不要以 FREQ=1 宣稱每次 Newton iteration 都是有效結果；若同時殘留 TIME／NINT，先移除衝突，核對 TIME 優先於 FREQ、FREQ 優先於 NINT。

7. 建立 SPC 與 SPCD：在 Model Browser 建立相應 Load Collectors，再由 Analyze → BCs／Constraints 的約束建立功能，選實際控制點與 Component。兩階段的有效 SPC 都要包含 SPCD 的同一自由度；其他治具自由度按實際條件維持。SPCD 的 D 使用基底幅值 u_T，符號、單位與有效座標必須一致。一般模型請使用自己的 Node ID；第 20 步起另列使用者指定的排查示例，也不要另疊加已替代的驅動 FORCE。

8. 建立候選 TLOAD1 曲線載入：建立 TABLED1 曲線，使用總時間與倍率三點 (0,0)、(0.75,0.75)、(1,1)；建立 TLOAD1，EXCITEID 選 SPCD、TYPE=DISP、TID 選此曲線，DELAY 留白／零，EXTN 的 TSTIME 選 TOT（介面可能標 TOTAL）。再用 DLOAD 組合選取 TLOAD1，倍率為 1。這是待試跑的載入鏈，不把 SPCD 包進 Bulk Data LOAD combination。此路徑以 DLOAD 選用，不再同時以 LOAD 引用同一 SPCD。

9. 建立 Stage 1：Model Browser → Create → Load Step，命名 Stage1_Coarse，Analysis type=Non-linear static（NLSTAT）。SPC 選作用約束集合、DLOAD 選上一步載入、NLPARM(LGDISP) 選 NLPARM_STAGE1、NLADAPT 選 NLADAPT_STAGE1、NLOUT 選輸出控制。若專案以全域 PARAM,LGDISP,1 啟用 LGDISP，保留一致的既有方式。第一段不續接其他歷程，確認沒有全域 CNTNLSUB 意外套用。

10. 複製並建立 Stage 2：命名 Stage2_Fine，放在 Stage 1 後面，保持相同 NLSTAT／LGDISP、SPC 與同一總時間 DLOAD 曲線。切換 NLPARM_STAGE2 與 NLADAPT_STAGE2，保留 NLOUT；在該 Load Step 的 Subcase Definition／選用欄位啟用 CNTNLSUB=YES。檢查 deck 順序真的是前一段；若中間會插入其他 Subcase，改用明確的前段 SID 並重新驗證。

11. 核對兩種時間：Stage 1 的局部時間 0–0.75，Stage 2 的局部時間 0–0.25，設計總時間分別 0–0.75 與 0.75–1.0。TLOAD1 使用 TOT 才沿同一總時間曲線查值；若改 SUB，第二段會從自己的局部零開始查表，必須另設表格與起點，不能照抄本候選。

12. 建立結果輸出：Analyze ribbon 的 Run 工具組選 Control Cards → GLOBAL_OUTPUT_REQUEST，請求 SPCFORCE(H3D)=ALL、DISPLACEMENT(H3D)=ALL、STRESS(H3D)=ALL；確認兩段都有效。需要時補接觸與材料歷程輸出。此處 ALL 是結果範圍，NLOUT 才控制中間增量儲存。

13. 匯出 .fem／Solver Deck 逐項核對：兩個 SUBCASE、ANALYSIS NLSTAT、SPC、DLOAD、NLPARM／LGDISP、NLADAPT、NLOUT 與第二段 CNTNLSUB。再查 Bulk 的 TTERM、NINC、空白 DT、DTMAX、DIRECT、整數 FREQ=1、TLOAD1 TYPE=DISP／TSTIME=TOT、TABLED1 與各 ID 對應。不要只看實體名稱；本文示意片段不包含可直接求解的幾何與邊界模型。

14. 先做最小驗證：使用可確認反應的簡單彈性模型，保留一致單位。檢查第一段終點 u/u_T≈0.75、第二段起點連續、總終點 u/u_T≈1，沒有意外卸載／跳位移；並對照單段全細步解的力–位移曲線。這是待執行驗證，不是本篇已有結果。

15. 再跑工程模型並讀 .out／_nl.out：核對實際起訖總時間、局部 TTERM、實際步長與 cutback、收斂、接觸及材料歷程。確認第二段沒有回到初始應力自由狀態。若不收斂，記錄中止與原因，不將最後收斂點命名為材料失效。

16. HyperView 載入同次求解模型與 H3D，依 Stage 1→Stage 2 的載入順序檢查已收斂結果，保持相同材料區域、應力種類、Centroid／Corner 與 Averaging。保存 Subcase、Frame、顯示 Time 及其局部／總時間對應；在這些位置讀真實應力數值，不用 60 MPa Legend 截斷色階代替門檻。

17. 找第一個評估應力 ≥60 MPa 的已儲存已收斂增量 i，並保留前一低於門檻的 i−1。保持同一 Subcase／Frame，切 SPC Forces → 載入方向分量，Resolved in 共同座標，透過 Node Query／Nodal Contour 讀實際驅動位置的帶符號反力；多點治具先做分量加總或投影，再取絕對值換算 kgf。F_limit=|R_drive|/9.80665，並以全部外部作用查平衡，不重複計左右端。

18. 完成可審查的門檻報告：保存 i−1／i 的時間、實際位移、應力、反力、kgf、收斂與顯示設定；在門檻附近進一步縮小 DTMAX／初始步長做時間增量敏感度，再做網格收斂。若首次超限落在 Stage 1，就把細化區間往前移；沒有達門檻則記為所求行程內未達。結論稱 Predicted Load at 60 MPa Stress Limit，不稱真正 Crack Load。

19. 記錄停滯現象與假說：另存目前 deck、.out、.monitor、H3D，列出 Time 0.75 前後實際 Subcase／Frame 與 UZ。使用者回報的位移／應力平台尚未在此重現；先確認不是重複顯示同一 Frame、只看 Legend 上下限、看錯 Subcase 或缺少中間結果。下圖是「Stage 1 已達完整位移、Stage 2 保持」的錯誤歷程示意，不是本案實測曲線。

20. 核對本次示例的共同邊界：在 HyperMesh 2026 Model Browser 選左孔 RBE3 與參考 Node 26088，在 Entity Editor 核對連接與方向；選 SPC Load Collector 確認該 Node 的 DOF 3 在兩段有效。右孔 RBE2 Node 26087 維持 SPC 123456；保留兩段相同的 Contact、Material、Property、Mesh 及其他必要約束。節點編號是本次使用者提供的示例，其他模型需換成實際位置；同時核對座標，不能僅憑 DOF 3 就假設一定是全域 Z。

21. 建立分段 SPCD 的候選 B 副本：Model Browser 空白處右鍵 Create → Load Collector，建立 SPCD_STAGE1 與 SPCD_STAGE2 並記下各 SID。由 Analyze → BCs 的 Constraints／Enforced Displacement 建立工具或 Card Editor 選 SPCD，選 Node 26088、Component C=3；第一個 Collector 候選 D=-0.82575 mm，第二個候選 D=-1.101 mm。檢查卡片 G、C、D、SID，不是修改右孔 SPC。這些是待確認的卡片候選值；不可先認定第二個 D 已有絕對目標語意。

22. 核對第一段引用與控制：Model Browser → Load Steps → Stage1_Coarse，在 Entity Editor 的 LOAD 欄直接選 SPCD_STAGE1 對應的 load set；不要用 Bulk LOAD combination 包 SPCD，也不要只改 Collector 名稱。SPC 選共同約束；NLPARM_STAGE1 為 TTERM=0.75、NINC=8、DT 留白；NLADAPT_STAGE1 為 DTMAX=0.1、DIRECT=NO；NLOUT 為 FREQ=1、VALUE REAL 不勾。候選 B 在這個驅動 DOF 不同時啟用候選 A 的 DLOAD。

23. 核對第二段引用與續接：複製第一段為 Stage2_Fine，放在 Stage 1 後；將 LOAD 改指 SPCD_STAGE2，不能讓複製後仍指 SPCD_STAGE1 或舊完整行程 Collector。保留共同 SPC、LGDISP 與其他邊界；NLPARM_STAGE2 為 TTERM=0.25、NINC=36、DT 留白；NLADAPT_STAGE2 為 DTMAX=0.007、DIRECT=NO；NLOUT FREQ=1、VALUE REAL 不勾。在 Subcase Definition／選用欄位啟用 CNTNLSUB=YES，或明確指定 Stage 1 的 SID。核對續接的是同型前段，而非另一分析。

24. 匯出候選 deck 後再查引用：逐一比對兩個 SUBCASE 的 LOAD、SPC、NLPARM、NLADAPT、NLOUT 及 CNTNLSUB，往 Bulk 追到兩張不同的 SPCD，檢查 Node 26088／DOF 3／D 值。移除被替代的 FORCE；不可同一 DOF 同時疊加 LOAD 與 DLOAD，不能漏掉 SPCD 或用 D=F 代替後續拉伸。先用簡單彈性小模型確認數值 D 的續接解讀與無跳變，再決定是否採用本候選 B；若未通過，不把本設定列為正式操作。

25. 在 HyperView 2026 建立同一節點的位移歷程：載入同次 .fem 與主結果 .h3d，Results／Contour 選 Displacement → Z，Resolved in 選與載入一致的共同座標。以 Query → Nodes（或 Nodal Query）輸入 26088，Apply 後記錄數值；再用 Create Curves／Measure 的隨時間結果功能選同一節點、同一分量，送 HyperGraph 或匯出表格。不同工作區的工具位置可能不同，須以安裝版核對；不要讀變形後螢幕座標當位移。將兩段依 .monitor 的 CURRENT TIME 對齊，不直接拼接兩個局部 Time 軸。

26. 核對 Stage 1 起訖：起點 Node 26088 UZ 應為 0 mm，最後收斂增量應約 -0.82575 mm。若第一個儲存結果不是 t=0，不把它強當零點；用未載入初始狀態或補輸出核對。若終點已到 -1.101 mm，記為「Stage 1 完整行程已達」證據，回查直接 SPCD、LOAD SID／曲線；這支持先到終點的假說，但仍須檢查第二段引用與續接。

27. 核對 Stage 2 連續與持續拉伸：起始狀態應延續約 -0.82575 mm，不跳回 0；終點應約 -1.101 mm。逐個已收斂儲存增量檢查，UZ 應由 -0.82575 變得更負、|UZ| 持續增加，不能整段停在 -0.82575 mm。若 Stage 2 未儲存恰好起點，先核對前段終點與第二段首個非零增量的曲線連續趨勢，不能要求首個增量仍等於起點。下圖是驗收目標，非求解結果；保存實際讀值、Frame 與容許誤差，容許誤差由模型精度決定，不由本圖保證。

28. 同步比較四種結果：固定相同 Subcase／Frame／累積 Time，依序讀 Node 26088 Displacement Z、材料區 Von Mises Stress、SPC Forces → Z（SPCFORCE Z，Node 26088）與 Contact Status。保持共同座標、相同應力輸出位置與 Averaging，排除非收斂幀；若 Contact Status 不在 H3D，先補相應接觸輸出再求解。UZ 有變化但應力／反力不變時，檢查接觸開閉、治具傳力與選取區域，不僅憑平台判定相同 SPCD。再找第一個 ≥60 MPa 的有效增量與前一低於門檻的增量，於同幀取 RZ，F_limit=|RZ|/9.80665 kgf；50 kgf≈490.33 N≈490 N 只是換算參照。此為 stress-limit 對應負載，非真正 Crack Load；Time 不可簡單乘力換算，Averaging 與網格收斂限制仍適用。

29. 核對 .out／.monitor 與必要的 _nl.out：.out 查兩個 Subcase 的完成、警告與錯誤；.monitor 逐段查 SUBCASE SID、INCREMENT、CONVERGED、TIME INCR、SUBCASE TIME、CURRENT TIME、LOAD FACTOR 與 cutback。Stage 2 的 SUBCASE TIME 應由 0 到 0.25，CURRENT TIME 由 0.75 到 1.0；以實際表頭與續接鏈核對。MONITOR DISP 預設是跨自由度選取的值，不能當作 Node 26088 UZ；要定點監測需另依 NLMON 的 GRID／DOF 設定並與 HyperView 對照。_nl.out 為額外非線性診斷，按官方 runtime monitoring／NLMON 設定啟用；未產生此檔不等同未收斂。

30. 若 Stage 2 仍不變，依序排查並留下證據：SPCD 兩個 D 值是否正確 → LOAD 是否選到各自 SID／是否意外共用舊 Collector → 兩段 SPC 是否涵蓋同一 DOF → CNTNLSUB 與前段類型／順序 → LOAD／DLOAD、曲線 TSTIME 及倍率是否重複或錯用 → SPCD 是否被移除而卸載、是否誤用 D=F 或手動重複累加 → H3D 儲存與當前 Frame。一次只改一項，先重跑最小模型，再跑工程模型與單段全細步基準比較。將實際 UZ、應力、反力、接觸、收斂和 deck 放入驗證記錄；未取得這些證據前，根因、絕對／增量 SPCD 規則與候選修正均維持待驗證。

## 參數差異與判讀規則

- NINC：分段初始離散，DT 留白時 Δt_initial=TTERM/NINC；不是自適應模式最終步數。
- DTMAX：自適應步長上限，不是輸出頻率，也不是保證每步固定大小。Stage 2 初始約 0.00694444 小於候選上限 0.007。
- FREQ=1：每個指定載荷層級儲存增量結果，不會改變求解步長、不會儲存每次 Newton 迭代為有效解。VALUE REAL 不勾，匯出核對整數 1。
- TTERM=0.25 是第二段的持續時間；不是總時間終點 0.25，也不等於 25% 位移。總時間與 Subcase time 必須分開記錄。
- TSTIME=TOT 與 TTERM 的時間定義不同：前者決定曲線查值用總時間，後者定義本段長度。
- CNTNLSUB=YES 依 deck 順序續接同型前段，非依編號大小。省略續接、移除邊界、D=F 凍結，都不能當作同一個持續增加 SPCD 的操作。
- 60 MPa 是專案指定判據，需核准應力種類與材料適用性；Time 不是反力倍率，首次儲存超限幀也不是精確的連續門檻。
- 停滯排查須用實際 UZ 歷程；候選端點為總位移驗收目標，不等於已核實的續接數值 SPCD 卡片語意。Stage 2 的 -0.27525 mm 僅為剩餘行程算術，不可盲當卡片 D。
- .monitor SUBCASE TIME、CURRENT TIME、LOAD FACTOR 各有不同定義；不可用局部正規化 Load Factor 代替累積時間或反力倍率。

## 限制與常見錯誤

【常見錯誤→驗證】第二段 TTERM 寫成 1.0：查局部／總時間，避免總長變成 1.75。NINC 改了卻沒效果：查是否仍指定 DT。步長仍太粗：查該 Subcase 的 NLADAPT 選集、DTMAX 與增量紀錄。只改 FREQ：這只能增加存檔，不能細化解。

【續接錯誤→驗證】Stage 1 已拉到完整行程：TTERM 不自動縮放直接 LOAD 的 SPCD；檢查實際 u/u_T。Stage 2 卸載／跳變：查 SPC／SPCD 是否移除、LOAD／DLOAD 是否重複、TSTIME 是否誤用 SUB、曲線起點及 CNTNLSUB 的前段目標。將 D=F 用於驅動點會保持前段邊界，不是拉到更大行程。

【結果錯誤→驗證】非收斂 Frame、跨步 Envelope、不同平均法、錯材料範圍或把 SPC Force Magnitude 當軸向反力，都可能造成門檻誤判。局部尖峰需查理想化與網格收斂；未平均應力也不自動等於真實材料應力。

【審核狀態】官方 2026 線上說明於 2026-10-29 查核；本文操作位置依官方 HyperMesh 教學整理，未在本機 HyperMesh 2026 逐項實機點選。VALUE REAL 的實際欄位呈現須核對安裝版；Solver 正整數 FREQ 規則已確認。候選參數組合、SPCD 續接連續性、效能與 60 MPa 對應反力均未經 Solver 試跑。所有圖均為原創示意，不是 UI 截圖或求解結果。

延伸閱讀：[OCP Rail 知識線索引](#ocp-rail-force-spcd-test-to-fail-20261029)、[HyperView UZ→SPCD](#ocp-rail-hyperview-node-uz-force-to-spcd-20261029)、[SPCFORCE 與應力門檻](#ocp-rail-spcforce-stress-limit-20261029)。

【本次停滯修正的驗證界線】Time 0.75 後平台是使用者回報；相同 SPCD 完整目標造成平台是高度懷疑，尚未重現。原主候選總時間曲線與新增分段直接 LOAD 端點候選均保留，須擇一測試。未取得 .fem／H3D／.out／.monitor，未執行 HyperMesh 2026 實機或 OptiStruct 求解；沒有聲稱數值 D 的續接絕對／增量解讀已由官方明文或本案測試確認。建議以小模型、版本與完整 deck 向 Altair 確認後填入實測記錄。

## 官方來源

2026 官方文件查核日期：2026-10-29。下列 root 線上說明的版本導覽顯示 2026；未以舊版規則冒稱 2026 已測通。
NLPARM（TTERM 為 Subcase time；DT／NINC 優先序）：https://help.altair.com/hwsolvers/os/topics/solvers/os/nlparm_bulk_r.htm
NLADAPT（DTMAX、DIRECT）：https://help.altair.com/hwsolvers/os/topics/solvers/os/nladapt_bulk_r.htm
NLOUT（FREQ、NINT、TIME 及中間結果）：https://help.altair.com/hwsolvers/os/topics/solvers/os/nlout_bulk_r.htm
CNTNLSUB（狀態續接、移除邊界時卸載、D=F）：https://help.altair.com/hwsolvers/os/topics/solvers/os/cntnlsub_sub_r.htm
SPCD（指定運動及作用 SPC 自由度）：https://help.altair.com/hwsolvers/os/topics/solvers/os/spcd_bulk_r.htm
TLOAD1（NLSTAT 的 DLOAD 曲線、DISP、TSTIME）：https://help.altair.com/hwsolvers/os/topics/solvers/os/tload1_bulk_r.htm
SPCFORCE（H3D 反力輸出）：https://help.altair.com/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm
HyperMesh analysisparameters（VALUE REAL 與整數 FREQ）：https://help.altair.com/hwdesktop/hwd/topics/reference/hm/data_names-analysisparameters_r.htm
HyperMesh 2026 官方操作參照 OS-HM-T 3000：https://help.altair.com/hwsolvers/os/topics/solvers/os/rubber_ring_hwx_tutorial_r.htm
NLSTAT 續接官方教學 OS-HM-T 3020：https://help.altair.com/hwsolvers/os/topics/solvers/os/nlstat_analysis_solid_blocks_in_contact_intro_r-1.htm
.monitor（CONVERGED、SUBCASE TIME、CURRENT TIME、LOAD FACTOR 與位移監測）：https://help.altair.com/hwsolvers/os/topics/solvers/os/monitor_file.htm
Runtime Monitoring（.out、_nl.out、NLMON 診斷）：https://help.altair.com/hwsolvers/os/topics/solvers/os/runtime_monitoring_os_r.htm
本次新增定位：NLPARM Comment 5；CNTNLSUB YES 定義、Comments 6–7；SPCD D 定義、Comments 1、4–5。上述參考頁不足以將續接數值 SPCD 的絕對／增量解讀標為已驗證。

## Time 0.75 後停滯：候選端點設定與驗收

本次示例是使用者指定的排查資料，並非已驗證的工程讀值。新增內容見操作 Step 19–30；原 Step 1–18、NLPARM／NLADAPT／NLOUT 說明與總時間曲線方案保留。

| 欄位 | Stage 1：Coarse | Stage 2：Fine |
| --- | --- | --- |
| 累積 Time（設計） | 0–0.75 | 0.75–1.0 |
| NLPARM TTERM／NINC；DT 留白 | 0.75／8 | 0.25／36 |
| NLADAPT DTMAX／DIRECT | 0.1／NO | 0.007／NO |
| NLOUT FREQ；VALUE REAL | 整數 1；不勾 | 整數 1；不勾 |
| CNTNLSUB | 無前段續接 | YES，接 Stage 1 |
| 左孔參考點／受控 DOF | RBE3；26088／3 | 同一位置及 DOF |
| 右孔固定點／SPC | RBE2；26087／123456 | 同一約束 |
| 直接 LOAD 候選 B | SPCD_STAGE1 的 SID | SPCD_STAGE2 的 SID |
| 候選 SPCD D（待驗證解讀） | -0.82575 mm | -1.101 mm |
| 期望總 UZ 終點（驗收目標） | 約 -0.82575 mm | 約 -1.101 mm |
| Contact／Material／Property／Mesh | 保留原模型 | 與 Stage 1 一致 |

**Stage 2 的候選 D=-1.101 mm 尚未被核實為續接絕對目標。** -0.27525 mm 是剩餘位移差的算術，不是已確認的卡片增量；不得任意累加成 -1.92675 mm。須先用最小模型證明實際總 UZ 達到以下檢查點，再採用直接 LOAD 端點方案。也可測試原文明定總時間的 DLOAD／TLOAD1 方案，兩方案不疊加。

| 驗證位置 | 預期總 UZ（mm）／條件 | 實際數值、Frame 與收斂證據 |
| --- | --- | --- |
| Stage 1 起點；總 Time 0 | 0 | 待填；若未儲存零點則查初始狀態 |
| Stage 1 終點；總 Time 0.75 | 約 -0.82575 | 待填 |
| Stage 2 起始狀態；總 Time 0.75 | 延續前段，不回 0 | 待填；首個非零增量不必等於起點 |
| Stage 2 期間 | UZ 更負，絕對位移量增加，不能整段維持 -0.82575 | 待填；各收斂儲存增量 |
| Stage 2 終點；總 Time 1.0 | 約 -1.101 | 待填 |
| 同步結果 | UZ／Von Mises／SPCFORCE Z／Contact Status | 待填；同一 Subcase、Frame、共同座標 |
| 求解紀錄 | .out／.monitor；局部時間與 CURRENT TIME 分開 | 待 Solver 試跑 |

若 UZ 已持續變化而應力／反力不變，應再查接觸、治具傳力、結果選取區域與輸出，不直接套用相同 SPCD 的根因假說。平台本身不足以證明卸載、位移累加或 Solver 錯誤。

- [.monitor：SUBCASE TIME／CURRENT TIME／LOAD FACTOR](https://help.altair.com/hwsolvers/os/topics/solvers/os/monitor_file.htm)
- [Runtime Monitoring：非線性診斷檔](https://help.altair.com/hwsolvers/os/topics/solvers/os/runtime_monitoring_os_r.htm)

## 候選設定對照（未求解驗證）

| 項目 | Stage 1 | Stage 2 |
| --- | --- | --- |
| 設計總時間範圍 | 0–0.75 | 0.75–1.0 |
| NLPARM TTERM（局部持續時間） | 0.75 | 0.25 |
| NLPARM NINC；DT 留白 | 8 | 36 |
| 初始 Δt（算術） | 0.09375 | 0.00694444… |
| NLADAPT DTMAX | 0.1 | 0.007 |
| DIRECT | NO | NO |
| NLOUT FREQ；VALUE REAL 不勾 | 整數 1 | 整數 1 |
| CNTNLSUB | 不續接其他歷程 | YES，明確接前段 |

## 設定核對骨架（不可直接求解）

以下為閱讀匯出 deck 的檢查表，角括號是必須由實際模型替換的參照；沒有模型、材料、SPC 或 NLPARM 完整 Bulk 配置，不能當作已驗證 FEM。主方案使用 DLOAD 時不要又用 LOAD 疊加 SPCD。

```text
SPCFORCE(H3D) = ALL
DISPLACEMENT(H3D) = ALL
STRESS(H3D) = ALL
SUBCASE <stage1>
  ANALYSIS = NLSTAT
  SPC = <same constraints>
  DLOAD = <global-time displacement history>
  NLPARM(LGDISP) = <TTERM .75 / NINC 8 / DT blank>
  NLADAPT = <DTMAX .1 / DIRECT NO>
  NLOUT = <FREQ integer 1>
SUBCASE <stage2>
  ANALYSIS = NLSTAT
  CNTNLSUB = YES
  SPC = <same constraints>
  DLOAD = <same global-time displacement history>
  NLPARM(LGDISP) = <TTERM .25 / NINC 36 / DT blank>
  NLADAPT = <DTMAX .007 / DIRECT NO>
  NLOUT = <FREQ integer 1>
```

## 正式發布前的驗證記錄（待填）

| 驗證 | 應保存證據 | 狀態 |
| --- | --- | --- |
| 安裝版介面／匯出 | 2026 build、卡片、VALUE REAL 對應 | 待實機確認 |
| 最小彈性模型續接 | u/u_T 在邊界為 .75，終點為 1；無跳變／卸載 | 待 Solver 試跑 |
| 步長控制 | .out／_nl.out 實際 Δt、cutback、總／局部時間 | 待 Solver 試跑 |
| 門檻與反力 | i−1／i 的同幀 stress、u、SPCFORCE、kgf | 待工程模型 |
| 精度與效能 | 全細步參考、增量敏感度、網格收斂、耗時 | 待比較 |

## 官方文件定位

- [NLPARM（TTERM 為 Subcase time；DT／NINC 優先序）](https://help.altair.com/hwsolvers/os/topics/solvers/os/nlparm_bulk_r.htm)
- [NLADAPT（DTMAX、DIRECT）](https://help.altair.com/hwsolvers/os/topics/solvers/os/nladapt_bulk_r.htm)
- [NLOUT（FREQ、NINT、TIME 及中間結果）](https://help.altair.com/hwsolvers/os/topics/solvers/os/nlout_bulk_r.htm)
- [CNTNLSUB（狀態續接、移除邊界時卸載、D=F）](https://help.altair.com/hwsolvers/os/topics/solvers/os/cntnlsub_sub_r.htm)
- [SPCD（指定運動及作用 SPC 自由度）](https://help.altair.com/hwsolvers/os/topics/solvers/os/spcd_bulk_r.htm)
- [TLOAD1（NLSTAT 的 DLOAD 曲線、DISP、TSTIME）](https://help.altair.com/hwsolvers/os/topics/solvers/os/tload1_bulk_r.htm)
- [SPCFORCE（H3D 反力輸出）](https://help.altair.com/hwsolvers/os/topics/solvers/os/spcforce_io_r.htm)
- [HyperMesh analysisparameters（VALUE REAL 與整數 FREQ）](https://help.altair.com/hwdesktop/hwd/topics/reference/hm/data_names-analysisparameters_r.htm)
- [HyperMesh 2026 官方操作參照 OS-HM-T 3000](https://help.altair.com/hwsolvers/os/topics/solvers/os/rubber_ring_hwx_tutorial_r.htm)
- [NLSTAT 續接官方教學 OS-HM-T 3020](https://help.altair.com/hwsolvers/os/topics/solvers/os/nlstat_analysis_solid_blocks_in_contact_intro_r-1.htm)

## 步驟圖解

### Step 11｜局部時間、總時間與候選步長

![局部時間、總時間與候選步長](../../assets/figures/ocp-rail/adaptive-01-timeline.svg)

原創技術示意圖；候選設計尚未完成求解驗證，非 HyperMesh 截圖或工程結果。

### Step 5｜NINC、DTMAX 與 FREQ 各管什麼

![NINC、DTMAX 與 FREQ 各管什麼](../../assets/figures/ocp-rail/adaptive-02-controls.svg)

原創技術示意圖；候選設計尚未完成求解驗證，非 HyperMesh 截圖或工程結果。

### Step 8｜SPCD 總時間曲線與續接載入鏈

![SPCD 總時間曲線與續接載入鏈](../../assets/figures/ocp-rail/adaptive-03-load-chain.svg)

原創技術示意圖；候選設計尚未完成求解驗證，非 HyperMesh 截圖或工程結果。

### Step 10｜兩階段 Subcase 欄位核對

![兩階段 Subcase 欄位核對](../../assets/figures/ocp-rail/adaptive-04-subcases.svg)

原創技術示意圖；候選設計尚未完成求解驗證，非 HyperMesh 截圖或工程結果。

### Step 17｜同增量應力門檻與反力讀取

![同增量應力門檻與反力讀取](../../assets/figures/ocp-rail/adaptive-05-threshold.svg)

原創技術示意圖；候選設計尚未完成求解驗證，非 HyperMesh 截圖或工程結果。


### Step 27｜目標位移歷程：Stage 2 繼續拉伸

![目標位移歷程：Stage 2 繼續拉伸](../../assets/figures/ocp-rail/adaptive-06-uz-target-history.svg)

原創示意圖／待驗證設計目標。三個檢查點為使用者提供的候選位移，非求解數據；不據此宣稱 SPCD 的續接絕對／增量規則。

### Step 19｜錯誤歷程示意：完整行程後呈平台

![錯誤歷程示意：完整行程後呈平台](../../assets/figures/ocp-rail/adaptive-07-uz-plateau-error.svg)

原創錯誤示意圖。說明 Stage 1 已達完整行程、Stage 2 保持不變的疑似機制；未以本案 deck／H3D 驗證，非實測曲線。
