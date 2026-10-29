(function(root){
  'use strict';
  const rows=[
    ['IC50 曲线拟合','IC50 curve fitting','IC50 曲線フィット','IC50 곡선 피팅'],
    ['导航','Navigation','ナビゲーション','탐색'],['分析','Analysis','解析','분석'],['使用说明','Help','使い方','사용 안내'],
    ['数据在浏览器内计算','Calculated in your browser','ブラウザー内で計算','브라우저에서 계산'],['输入数据不上传服务器','Input data is not uploaded','入力データは送信されません','입력 데이터는 서버에 업로드되지 않습니다'],
    ['数据','Data','データ','데이터'],['测试示例','Test example','テスト例','테스트 예제'],['清空','Clear','クリア','지우기'],['等待输入','No data entered','データ未入力','데이터 입력 대기'],
    ['粘贴浓度和存活率，每行一个浓度。','Paste concentrations and viability, one concentration per row.','濃度と生存率を貼り付けてください。1 行に 1 濃度を入力します。','농도와 생존율을 붙여 넣으세요. 한 행에 한 농도를 입력합니다.'],
    ['浓度、存活率（%）','Concentration, viability (%)','濃度、生存率（%）','농도, 생존율 (%)'],
    ['浓度,存活率1,存活率2…\n可直接粘贴 Excel 数据','Concentration,viability1,viability2…\nPaste directly from Excel','濃度,生存率1,生存率2…\nExcel から直接貼り付け可能','농도,생존율1,생존율2…\nExcel에서 직접 붙여 넣기'],
    ['浓度单位','Concentration unit','濃度の単位','농도 단위'],['输入格式说明','Input format','入力形式','입력 형식'],
    ['第一列为原始浓度，后续列为存活率或各复孔。支持逗号、Tab、空格分隔和表头。存活率填百分数（如 80，非 0.8）；单位设置仅修改标签，不换算浓度。每个复孔等权拟合。','Enter raw concentrations in the first column and viability replicates in subsequent columns. Commas, tabs, spaces and a header row are supported. Enter percentages (80, not 0.8). Changing the unit only changes labels; it does not convert values. All observations have equal weight.','1 列目に元の濃度、以降の列に生存率または各反復値を入力します。カンマ、タブ、空白、見出し行に対応しています。生存率は百分率（0.8 ではなく 80）で入力してください。単位の変更は表示のみで、数値は換算しません。各観測値は等しい重みでフィットします。','첫 열에 원래 농도를, 이후 열에 생존율 또는 반복 측정값을 입력하세요. 쉼표, 탭, 공백, 머리글을 지원합니다. 생존율은 백분율(0.8이 아닌 80)로 입력하세요. 단위 변경은 표시만 바꾸며 농도를 환산하지 않습니다. 모든 관측값에 동일한 가중치를 적용합니다.'],
    ['测试示例，非实验数据','Software test example, not experimental data','ソフトウェアのテスト例（実験データではありません）','소프트웨어 테스트 예제이며 실험 데이터가 아닙니다'],
    ['拟合模型','Fit model','フィットモデル','피팅 모델'],['下降型','Decreasing','下降型','감소형'],['4PL，可变斜率','4PL, variable slope','4PL、可変傾斜','4PL, 가변 기울기'],['4PL · 可变斜率','4PL · variable slope','4PL · 可変傾斜','4PL · 가변 기울기'],
    ['拟合 Top、Bottom、HillSlope、IC50','Fit Top, Bottom, HillSlope and IC50','Top、Bottom、HillSlope、IC50 を推定','Top, Bottom, HillSlope, IC50 추정'],
    ['固定 HillSlope = −1（3 参数）','Fixed HillSlope = −1 (3 parameters)','HillSlope = −1 に固定（3 パラメータ）','HillSlope = −1 고정 (3개 매개변수)'],
    ['固定 HillSlope = −1','Fixed HillSlope = −1','HillSlope = −1 に固定','HillSlope = −1 고정'],
    ['有标准斜率依据，或中间浓度较少时比较','Compare when a standard slope is justified or transition doses are sparse','標準傾斜の根拠がある場合や中間濃度が少ない場合に比較','표준 기울기의 근거가 있거나 중간 농도가 적을 때 비교'],
    ['固定 Top = 100、Bottom = 0（2 参数）','Fixed Top = 100, Bottom = 0 (2 parameters)','Top = 100、Bottom = 0 に固定（2 パラメータ）','Top = 100, Bottom = 0 고정 (2개 매개변수)'],
    ['固定 Top = 100 / Bottom = 0','Fixed Top = 100 / Bottom = 0','Top = 100 / Bottom = 0 に固定','Top = 100 / Bottom = 0 고정'],
    ['仅在真实对照准确界定两端平台时使用','Use only when controls accurately define both plateaus','対照により両端のプラトーが正確に定義されている場合のみ使用','대조군으로 양쪽 평탄부가 정확히 정의된 경우에만 사용'],
    ['存活率写成 %，并不意味着应固定 Top=100、Bottom=0。','Percentage data alone do not justify fixing Top=100 and Bottom=0.','百分率で表示していても、Top=100、Bottom=0 に固定すべきとは限りません。','백분율 데이터라고 해서 Top=100, Bottom=0으로 고정해야 하는 것은 아닙니다.'],
    ['非线性最小二乘，不加权','Unweighted nonlinear least squares','非加重の非線形最小二乗法','비가중 비선형 최소제곱법'],
    ['拟合中…','Fitting…','計算中…','피팅 중…'],['拟合','Fit','フィット','피팅'],['曲线','Curve','曲線','곡선'],['等待拟合','Not fitted','未フィット','피팅 대기'],['横轴刻度','X-axis scale','横軸スケール','X축 척도'],['线性','Linear','線形','선형'],
    ['log10 轴按浓度的倍数间隔排布，刻度仍标原始浓度；改变刻度不会改变拟合。','The log10 axis spaces concentrations by ratios and labels raw values. Axis scaling does not change the fit.','log10 軸は濃度の比に応じた間隔で配置し、元の濃度を表示します。軸の変更はフィット結果に影響しません。','log10 축은 농도 비율에 따라 배치하며 원래 농도를 표시합니다. 축 변경은 피팅 결과에 영향을 주지 않습니다.'],
    ['横轴显示 log10(C/所选单位)（0、1、2…）；输入区仍填原始浓度，不要重复取 log。','The axis shows log10(C / selected unit): 0, 1, 2… Enter raw concentrations, without taking logs again.','軸は log10(C/選択した単位)（0、1、2…）を表示します。入力欄には元の濃度を入力し、再度対数変換しないでください。','축은 log10(C/선택 단위)(0, 1, 2…)를 표시합니다. 입력란에는 원래 농도를 입력하고 로그를 다시 취하지 마세요.'],
    ['线性轴按浓度差值排布，0 浓度可直接显示；改变刻度不会改变拟合。','The linear axis spaces concentrations by differences and can show zero. Axis scaling does not change the fit.','線形軸は濃度差に応じた間隔で配置し、0 濃度も表示できます。軸の変更はフィット結果に影響しません。','선형 축은 농도 차이에 따라 배치하며 0 농도를 표시할 수 있습니다. 축 변경은 피팅 결과에 영향을 주지 않습니다.'],
    ['图形样式','Plot style','グラフ形式','그래프 스타일'],['Prism 样式','Prism style','Prism スタイル','Prism 스타일'],['自定义参考样式','Custom reference style','参照スタイルの設定','사용자 참조 스타일'],['分析样式','Analysis style','解析スタイル','분석 스타일'],['log 轴刻度标签','Log-axis labels','対数軸の目盛り','로그 축 눈금'],
    ['log10 数值（0、1、2…）','log10 values (0, 1, 2…)','log10 値（0、1、2…）','log10 값 (0, 1, 2…)'],['原始浓度（1、10、100…）','Raw concentrations (1, 10, 100…)','元の濃度（1、10、100…）','원래 농도 (1, 10, 100…)'],
    ['散点与误差棒','Points and error bars','点と誤差棒','데이터 점과 오차 막대'],['均值 ± SD','Mean ± SD','平均 ± SD','평균 ± SD'],['原始观测','Individual observations','個々の観測値','개별 관측값'],
    ['参考样式','Reference style','参照スタイル','참조 스타일'],['上传参考图或设置图形格式','Upload a reference or adjust formatting','参照画像の読み込み・書式設定','참조 이미지 업로드 또는 서식 설정'],['上传参考图或样式文件','Upload reference image or style file','参照画像・スタイルファイルを読み込む','참조 이미지 또는 스타일 파일 업로드'],['恢复默认','Reset style','初期設定に戻す','기본값 복원'],
    ['PNG / JPG / WebP 自动提取彩色主色；截图的字体、符号和布局不能自动完整识别，请在下方调整。可重新导入本工具的 SVG / 样式 JSON，恢复颜色、符号、字体、线宽和标题。文件仅在当前浏览器内读取。','PNG / JPG / WebP uploads estimate the dominant color only. Fonts, symbols and layout require manual adjustment. Reimport this tool’s SVG or style JSON to restore color, symbols, font, line widths and titles. Files are read in your browser.','PNG / JPG / WebP から主な色のみを推定します。フォント、記号、レイアウトは下で調整してください。本ツールの SVG・スタイル JSON を再読み込みすると、色、記号、フォント、線幅、タイトルを復元できます。ファイルはブラウザー内で読み取ります。','PNG / JPG / WebP에서 주 색상만 추정합니다. 글꼴, 기호, 배치는 아래에서 직접 조정하세요. 이 도구의 SVG 또는 스타일 JSON을 다시 불러오면 색상, 기호, 글꼴, 선 너비와 제목을 복원합니다. 파일은 브라우저 안에서 읽습니다.'],
    ['上传的 Prism 样式参考图','Uploaded style reference','読み込んだスタイル参照画像','업로드한 스타일 참조 이미지'],['或输入样式描述','Or describe the style','またはスタイルを記述','또는 스타일 설명 입력'],['例如：蓝色曲线，空心圆，Arial，线宽 2，字号 24','Example: blue, hollow circle, Arial, line width 2, font size 24','例：青色、白抜きの円、Arial、線幅 2、文字サイズ 24','예: 파란색, 빈 원, Arial, 선 너비 2, 글자 크기 24'],
    ['应用描述','Apply description','記述を適用','설명 적용'],['曲线与符号主色','Curve and marker color','曲線と記号の色','곡선 및 기호 색상'],['散点形状','Marker shape','記号の形','기호 모양'],['方块','Square','四角','사각형'],['圆形','Circle','円','원'],['三角形','Triangle','三角','삼각형'],['符号填充','Marker fill','記号の塗り','기호 채우기'],['空心','Hollow','白抜き','비움'],['实心','Solid','塗りつぶし','채움'],['字体','Font','フォント','글꼴'],['曲线线宽','Curve line width','曲線の線幅','곡선 너비'],['坐标轴线宽','Axis line width','軸の線幅','축 선 너비'],['字号','Font size','文字サイズ','글자 크기'],['符号大小','Marker size','記号サイズ','기호 크기'],
    ['横轴标题（空白 = 自动）','X-axis title (blank = auto)','横軸タイトル（空欄 = 自動）','X축 제목 (공란 = 자동)'],['随线性 / log 设置自动生成','Automatic for the selected axis','選択した軸に応じて自動設定','선택한 축에 따라 자동 설정'],['纵轴标题','Y-axis title','縦軸タイトル','Y축 제목'],['使用此参考样式','Apply reference style','参照スタイルを適用','참조 스타일 적용'],['保存样式 JSON','Save style JSON','スタイル JSON を保存','스타일 JSON 저장'],
    ['更改样式不会重新拟合或改动原始数据。','Style changes do not refit or modify input data.','スタイルの変更では再フィットせず、入力データも変更しません。','스타일 변경은 재피팅하거나 원본 데이터를 변경하지 않습니다.'],
    ['Prism 参考样式：橙色空心方块、黑色坐标轴、可编辑 IC50 标注。误差棒仅由实际复孔计算。','Prism-style orange hollow squares, black axes and editable IC50 label. Error bars use entered replicates only.','Prism 形式：オレンジ色の白抜き四角、黒い軸、編集可能な IC50。誤差棒は入力された反復値のみから計算します。','Prism 스타일: 주황색 빈 사각형, 검은 축, 편집 가능한 IC50 표기. 오차 막대는 입력된 반복값으로만 계산합니다.'],
    ['输入观测或复孔均值','Observations or replicate means','観測値または反復平均','관측값 또는 반복 평균'],['输入观测','Input observations','入力観測値','입력 관측값'],['复孔均值','Replicate means','反復平均','반복 평균'],['拟合曲线','Fitted curve','フィット曲線','피팅 곡선'],['误差棒','Error bars','誤差棒','오차 막대'],['无误差棒','No error bars','誤差棒なし','오차 막대 없음'],['模型预测曲线','Model prediction','モデル予測曲線','모델 예측 곡선'],['半最大响应','Half-maximal response','半最大応答','반최대 반응'],['显示残差','Show residuals','残差を表示','잔차 표시'],['残差 = 实测 − 预测','Residual = observed − predicted','残差 = 実測値 − 予測値','잔차 = 관측값 − 예측값'],['检查是否随机分布在 0 两侧','Check for random scatter around zero','0 の両側にランダムに分布するか確認','0 주위에 무작위로 분포하는지 확인'],
    ['拟合结果','Fit results','フィット結果','피팅 결과'],['参数尚未计算','No estimates yet','パラメータ未計算','매개변수 계산 전'],['参数','Parameter','パラメータ','매개변수'],['估计值','Estimate','推定値','추정값'],['说明','Description','説明','설명'],
    ['Top 与 Bottom 中点对应的浓度','Concentration at the midpoint of Top and Bottom','Top と Bottom の中点に対応する濃度','Top과 Bottom 중간점에 해당하는 농도'],['上平台','Upper plateau','上側プラトー','상단 평탄부'],['下平台','Lower plateau','下側プラトー','하단 평탄부'],['低浓度端的拟合响应','Fitted response at low concentrations','低濃度側の推定応答','저농도에서의 추정 반응'],['高浓度端的拟合响应','Fitted response at high concentrations','高濃度側の推定応答','고농도에서의 추정 반응'],
    ['下降曲线为负；绝对值越大越陡','Negative for a decreasing curve; larger magnitude means steeper','下降曲線では負。絶対値が大きいほど急峻','감소 곡선에서는 음수이며 절댓값이 클수록 가파름'],['观测数','Observations','観測数','관측 수'],['残差自由度','Residual degrees of freedom','残差自由度','잔차 자유도'],['百分点','percentage points','パーセントポイント','퍼센트포인트'],
    ['IC50 是曲线自身的半最大响应点。只有 Top=100、Bottom=0 时，它才对应存活率 50%。','IC50 is the curve’s half-maximal response point. It corresponds to 50% viability only when Top=100 and Bottom=0.','IC50 は曲線の半最大応答点です。Top=100、Bottom=0 のときのみ、生存率 50% に対応します。','IC50은 곡선의 반최대 반응점입니다. Top=100, Bottom=0인 경우에만 생존율 50%에 해당합니다.'],
    ['IC50 对应 Top 与 Bottom 的中点。仅当 Top=100、Bottom=0 时，该点存活率为 50%。','IC50 corresponds to the midpoint of Top and Bottom. Viability there is 50% only when Top=100 and Bottom=0.','IC50 は Top と Bottom の中点に対応します。この点の生存率が 50% になるのは Top=100、Bottom=0 のときのみです。','IC50은 Top과 Bottom의 중간점에 해당합니다. 이 지점의 생존율이 50%인 것은 Top=100, Bottom=0일 때뿐입니다.'],
    ['图形格式','Image format','画像形式','이미지 형식'],['SVG（矢量，可编辑）','SVG (editable vector)','SVG（編集可能なベクター）','SVG (편집 가능한 벡터)'],['PNG（无损图片）','PNG (lossless)','PNG（可逆圧縮）','PNG (무손실)'],['JPG（压缩图片）','JPG (compressed)','JPG（圧縮画像）','JPG (압축 이미지)'],['TIFF（无损图片）','TIFF (lossless)','TIFF（非圧縮画像）','TIFF (무손실)'],['PDF（高清图版）','PDF (high-resolution image)','PDF（高解像度画像）','PDF (고해상도 이미지)'],['分辨率','Resolution','解像度','해상도'],['图宽','Width','画像幅','이미지 너비'],['导出结果 CSV','Export results CSV','結果 CSV を出力','결과 CSV 내보내기'],['导出图形','Export chart','グラフを出力','그래프 내보내기'],
    ['SVG 中的文字、坐标轴、散点和曲线可分别编辑。','SVG text, axes, points and curves can be edited separately.','SVG の文字、軸、点、曲線は個別に編集できます。','SVG의 텍스트, 축, 데이터 점과 곡선은 각각 편집할 수 있습니다.'],
    ['使用说明：横轴、模型和 0 浓度','Help: axes, models and zero concentration','使い方：横軸・モデル・0 濃度','사용 안내: 축, 모델 및 0 농도'],['横轴与输入值','Axes and input values','横軸と入力値','축과 입력값'],
    ['这里始终输入原始浓度。若在 Prism 输入的 X 已是 log10(浓度)，应选择','Always enter raw concentrations here. In Prism, if X already contains log10(concentration), choose','ここでは元の濃度を入力します。Prism の X がすでに log10(濃度) の場合は、次を選択：','여기에는 항상 원래 농도를 입력합니다. Prism의 X가 이미 log10(농도)이면 다음을 선택하세요:'],
    ['；X 仍是原始浓度时，选择','; if X contains raw concentrations, choose','。X が元の濃度の場合は、次を選択：','; X가 원래 농도이면 다음을 선택하세요:'],['，再把图轴设为 log。',', then set the plot axis to log.','。その後、軸を対数表示にします。',', 그런 다음 축을 로그 척도로 설정합니다.'],
    ['等差浓度取 log 后通常不等距；等比浓度才等距。','Arithmetic dose sequences are usually not equally spaced after log transformation; geometric sequences are.','等差数列の濃度は通常、対数軸で等間隔にはなりません。等比数列は等間隔になります。','등차 농도는 일반적으로 로그 변환 후 등간격이 되지 않습니다. 등비 농도는 등간격이 됩니다.'],
    ['模型选择','Model selection','モデルの選択','모델 선택'],
    ['平台和中间过渡区覆盖充分时，可拟合完整 4PL。中间浓度少时，比较固定斜率模型需要科学依据。只有可靠对照界定了 0% 与 100%，才考虑固定平台。不要单凭更高的 R² 选模型。','Use the full 4PL when both plateaus and the transition region are well covered. A fixed slope needs scientific justification when transition doses are sparse. Fix plateaus only when reliable controls define 0% and 100%. Do not select a model solely by a higher R².','両端のプラトーと移行域を十分に測定できている場合は、完全な 4PL を使用できます。中間濃度が少ない場合でも、傾斜の固定には科学的根拠が必要です。信頼できる対照が 0% と 100% を定義する場合のみ、プラトーの固定を検討します。R² の高さだけでモデルを選ばないでください。','양쪽 평탄부와 전이 구간을 충분히 측정한 경우 전체 4PL을 사용할 수 있습니다. 중간 농도가 적어도 기울기 고정에는 과학적 근거가 필요합니다. 신뢰할 수 있는 대조군이 0%와 100%를 정의할 때만 평탄부 고정을 고려하세요. 높은 R²만으로 모델을 선택하지 마세요.'],
    ['本工具仅支持对称、单相下降；上升、双相与钟形响应需其他模型。','This tool fits symmetric, monophasic decreasing responses. Increasing, biphasic or bell-shaped responses need other models.','本ツールは対称・単相の下降応答に対応します。上昇、二相性、ベル型の応答には別のモデルが必要です。','이 도구는 대칭적인 단상 감소 반응을 피팅합니다. 증가형, 이상성 또는 종 모양 반응에는 다른 모델이 필요합니다.'],
    ['0 浓度处理','Zero concentration','0 濃度の扱い','0 농도 처리'],['log10(0) 没有有限值。这里用下降模型在 0 浓度的极限','log10(0) is not finite. Zero-dose observations enter the fit through the limit','log10(0) は有限値ではありません。0 濃度の観測値は、下降モデルの極限','log10(0)은 유한하지 않습니다. 0 농도 관측값은 감소 모델의 극한'],
    ['纳入拟合。log 图仅绘制正浓度，并在图旁列出 0 浓度观测；线性轴可直接显示它。','in the decreasing model. Log plots show positive concentrations only and list zero-dose observations beside the plot. Linear axes can show zero directly.','としてフィットに含めます。対数グラフには正の濃度のみを描き、0 濃度の観測値は図の横に表示します。線形軸では 0 を直接表示できます。','으로 피팅에 포함됩니다. 로그 그래프는 양의 농도만 표시하고, 0 농도 관측값은 그래프 옆에 나열합니다. 선형 축에서는 0을 직접 표시할 수 있습니다.'],
    ['不把 0 改成 1 或极小数，也不补造缺失实验点。','Zero is not replaced by 1 or a tiny value; missing measurements are not fabricated.','0 を 1 や微小値に置き換えたり、欠測の実験点を作ったりしません。','0을 1이나 매우 작은 값으로 바꾸지 않으며 누락된 측정값을 만들지 않습니다.'],
    ['公式、计算范围与 Prism 对应设置','Equation, numerical bounds and Prism settings','式・計算範囲・Prism の設定','방정식, 계산 범위 및 Prism 설정'],
    ['C 为原始浓度；C=0 时使用 Y=Top；IC50>0，HillSlope<0，Top>Bottom。正浓度上等价于 Prism 的下降型可变斜率公式。通过确定性多起点优化拟合 log(IC50) 和斜率幅度；自由平台在每步用线性最小二乘解出。数值搜索范围：IC50 为输入正浓度范围外扩 6 个数量级，|HillSlope| 约 0.001–50；命中边界会提示。','C is raw concentration; Y=Top at C=0. IC50>0, HillSlope<0 and Top>Bottom. At positive concentrations this is equivalent to Prism’s decreasing variable-slope equation. Deterministic multi-start optimization fits log(IC50) and slope magnitude; free plateaus are solved by linear least squares at each step. Search bounds extend IC50 six orders of magnitude beyond the positive input range; |HillSlope| is about 0.001–50. Boundary solutions are flagged.','C は元の濃度で、C=0 では Y=Top とします。IC50>0、HillSlope<0、Top>Bottom です。正の濃度では Prism の下降型可変傾斜式と等価です。決定論的な複数初期値の最適化で log(IC50) と傾斜の大きさを求め、自由プラトーは各ステップで線形最小二乗法により解きます。IC50 の探索範囲は正濃度の入力範囲から両側に 6 桁拡張し、|HillSlope| は約 0.001–50 です。境界に達した場合は警告します。','C는 원래 농도이며 C=0에서는 Y=Top입니다. IC50>0, HillSlope<0, Top>Bottom입니다. 양의 농도에서 Prism의 감소형 가변 기울기 식과 같습니다. 결정론적 다중 초기값 최적화로 log(IC50)과 기울기 크기를 구하며, 자유 평탄부는 각 단계에서 선형 최소제곱법으로 계산합니다. IC50 탐색 범위는 양의 입력 농도 범위를 양쪽으로 6자릿수 확장하고, |HillSlope|는 약 0.001–50입니다. 경계에 도달하면 알립니다.'],
    ['每个输入复孔等权。RMSE = √(SSE/n)，单位为百分点；R² = 1−SSE/SST，仅描述拟合，不验证模型。图线是预测值，散点是输入值。此版本不计算置信区间，不包含加权、离群值自动剔除或全局拟合；关键研究结论应在 Prism 中用匹配设置复核。与 Prism 的优化细节、约束或置信区间设置不同，结果可能存在差异。','Each entered replicate has equal weight. RMSE = √(SSE/n), in percentage points; R² = 1−SSE/SST describes fit, not model validity. Lines are predictions and points are inputs. This version has no confidence intervals, weighting, automatic outlier removal or global fitting. Verify key research conclusions in Prism with matching settings; differences in optimization, constraints or interval settings may produce different results.','各反復値は等しい重みで扱います。RMSE = √(SSE/n) の単位はパーセントポイントです。R² = 1−SSE/SST は適合の指標であり、モデルの妥当性を検証するものではありません。線は予測値、点は入力値です。本版は信頼区間、重み付け、外れ値の自動除去、グローバルフィットに対応しません。重要な研究結論は設定をそろえて Prism で確認してください。最適化、制約、信頼区間の設定の違いにより結果が異なる場合があります。','각 반복값에 동일한 가중치를 적용합니다. RMSE = √(SSE/n)의 단위는 퍼센트포인트입니다. R² = 1−SSE/SST는 적합도를 설명하지만 모델의 타당성을 검증하지 않습니다. 선은 예측값이고 점은 입력값입니다. 이 버전은 신뢰구간, 가중치, 자동 이상치 제거 또는 전역 피팅을 제공하지 않습니다. 주요 연구 결론은 같은 설정으로 Prism에서 확인하세요. 최적화, 제약 및 신뢰구간 설정에 따라 결과가 다를 수 있습니다.'],
    ['GraphPad：4PL 公式','GraphPad: 4PL equation','GraphPad：4PL の式','GraphPad: 4PL 방정식'],['GraphPad：模型选择','GraphPad: model selection','GraphPad：モデルの選択','GraphPad: 모델 선택']
  ];
  const extra=[];
  const languageIds={'zh-CN':0,en:1,ja:2,ko:3};let locale='zh-CN';
  let exactPattern,templatePatterns;const originals=new WeakMap(),attributes=new WeakMap();
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function compile(){
    const all=[...rows,...extra];
    const literals=all.filter(row=>!row[0].includes('{0}'));
    exactPattern=new RegExp(literals.map(r=>escape(r[0])).sort((a,b)=>b.length-a.length).join('|'),'g');
    templatePatterns=all.filter(row=>row[0].includes('{0}')).map(row=>({row,regex:new RegExp(escape(row[0]).replace(/\\\{\d+\\\}/g,'([0-9.eE+−-]+)'),'g')}));
  }
  function t(value){
    if(typeof value!=='string'||locale==='zh-CN')return value;
    const index=languageIds[locale];let text=value;
    for(const {row,regex} of templatePatterns)text=text.replace(regex,(...args)=>row[index].replace(/\{(\d+)\}/g,(_,n)=>args[Number(n)+1]));
    return text.replace(exactPattern,key=>{const row=rows.find(r=>r[0]===key)||extra.find(r=>r[0]===key);return row?row[index]:key;});
  }
  function refresh(scope){
    if(typeof document==='undefined'||!document.createTreeWalker)return;
    scope=scope||document;
    const walker=document.createTreeWalker(scope,4);let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style,textarea,[data-no-i18n],#reference-filename,metadata,desc,#axis-titles'))continue;
      let item=originals.get(node);if(!item||node.nodeValue!==item.last)item={source:node.nodeValue,last:node.nodeValue};
      node.nodeValue=t(item.source);item.last=node.nodeValue;originals.set(node,item);
    }
    for(const el of scope.querySelectorAll('[placeholder],[aria-label],[alt],meta[name="description"]')){
      if(el.closest('[data-no-i18n],#axis-titles'))continue;
      const map=attributes.get(el)||{};
      for(const attr of ['placeholder','aria-label','alt',...(el.tagName==='META'?['content']:[])])if(el.hasAttribute(attr)){
        const value=el.getAttribute(attr);let item=map[attr];if(!item||item.last!==value)item={source:value,last:value};el.setAttribute(attr,t(item.source));item.last=el.getAttribute(attr);map[attr]=item;
      }
      attributes.set(el,map);
    }
  }
  function setLanguage(id,persist=true){
    locale=languageIds[id]===undefined?'zh-CN':id;
    if(typeof document!=='undefined'){document.documentElement?.setAttribute('lang',locale);const select=document.getElementById('language');if(select)select.value=locale;}
    if(persist)try{root.localStorage?.setItem('ic50-language',locale);}catch{}
    refresh();return locale;
  }
  function init(){
    let saved;try{saved=root.localStorage?.getItem('ic50-language');}catch{}
    let requested;try{requested=new URLSearchParams(root.location?.search||'').get('lang');}catch{}
    setLanguage(requested||saved||'zh-CN',false);
    if(typeof document!=='undefined')document.getElementById('language')?.addEventListener('change',event=>setLanguage(event.target.value));
  }
  function svg(source){
    if(locale==='zh-CN'||typeof DOMParser==='undefined')return source;
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');refresh(doc);return new XMLSerializer().serializeToString(doc);
  }
  function add(newRows){extra.push(...newRows);compile();}
  compile();const api={t,refresh,setLanguage,init,svg,add,rows,extra,get locale(){return locale;}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.IC50I18n=api;
})(typeof globalThis!=='undefined'?globalThis:this);
