# CALYPSO 上传教程与当前能力评估

适用版本：2026-10-14，贡献草稿 v3。教程依照当前实际表单和导入器编写，不把规划功能写成已经实现。

**当前结论：通用文件保存和二维数值预览可用，但还没有完整覆盖红外与全部物性的结构化录入。** 单个数值需要暂时装进一行、两列 CSV；完整张量、多维数据和温度/频率/外场扫描条件还需要下一轮表单设计。

示例包中的组成、结构和所有数值都是人为构造的教学测试数据，不代表任何材料的真实性质或相稳定性。它们没有写入科学数据库。示例仅用于浏览，exampleOnly 教学标记禁止保存或提交审核。

## 页面内示例入口

在 Contribute 顶部选择 **Browse examples**，再点击某类 **Load example**。共 12 类，包括结构、XRD、Raman、红外与数值物性及混合批量上传。实际表单会加载教学文件和字段；**Return to my draft** 恢复预览前的原草稿。预览不能保存、提交或混入真实上传文件。恢复只在当前页面内有效，刷新或离开前仍需先保存自己的草稿。

Documentation 的 **Contribution guide** 提供步骤与逐类别说明，并可跳转到相应示例。跳转只打开示例库，不自动导入。单值、完整张量及扫描条件的限制见下表。

## 保存与重新打开（v15）

Submission title · 上传批次标题是一次投稿的名称，可以包含多个 Phase、P–T 条件和多次采集；它不是 XRD 测量轮次。相同条件下多次 XRD 用独立卡片与 Acquisition label / Sample or run 区分，不同 P–T 使用不同条件组。

自己的真实草稿可以先只保存元数据。Save draft 会将草稿与所选条件写入页面地址，刷新恢复保存的版本；从 My Contributions 也能重新打开。修改后需要再次保存。教学预览仍不能保存。

This condition / All records 控制列表范围。普通上传中，同路径同字节在同条件会定位旧卡，在其他条件复用原文件建新卡；同名不同字节另存独立路径。含数据的组移除前需确认，移除后可在继续编辑或保存之前撤销；共享文件保留至最后一张引用卡片被移除。完整 manifest 仍须明确映射全批次，不自动改写歧义路径。

直接输入物性值或粘贴谱图的入口尚未实现；本版先修复草稿与文件处理。

## 1. 先理解上传的三个层级

```text
Phase：formula/composition、相名称、永久 ID、相鉴定声明
  P–T 条件组：压力、温度、条件定义及实验/计算背景
    数据卡片：来源（实验/理论）+ 类型 + 原始文件 + 方法/单位/来源
```

- 一个 Phase 可以有多个条件组，每个组可以包含 XRD、Raman、结构和多次物性采集。
- 结构未知可以只传谱学/物性，Related structure 留空。
- 名称留空时生成待鉴定名称。名字不代表已完成鉴定。
- 结构文件格式不决定来源：CIF/POSCAR 都需要核对实验/理论标签；当前无清单的上传默认使用 Experimental 标签。
- 数据卡片默认继承选中的条件组，可明确开启 Record-specific pressure / temperature 记录实际差异。

## 2. 当前支持到什么程度

| 用户想上传的内容 | 目前选择 | 文件及预览 | 还缺什么 |
| --- | --- | --- | --- |
| 结构 | Crystal structure | CIF / POSCAR，基础格式检查 | 结构科学标准化、完整结构视图不是本轮能力 |
| XRD | XRD pattern | 两列或多列数值表；选 X/Y 列 | 波长、几何、校准等只有方法/备注文本；2D 图作为附件 |
| Raman | Raman spectrum | 数值谱，多个采集可共用文件 | 激发波长、功率、偏振等无独立字段 |
| 红外 | Physical property，标签写 Infrared spectrum | 波数/频率/波长与吸收/透过信号的数值表可存和预览 | 没有 infrared 独立类型，不能把它当 Raman 来获得错误分类 |
| 发光 | Physical property | 波长/能量与强度、寿命等数值文件 | 光致/电致发光、激发条件、时间分辨等没有专用分类 |
| 光电 | Physical property | I–V、响应随波长等二维曲线；单值也可存 | 照明/暗态、入射功率、面积、偏压等只有文本 |
| 极化 | Physical property | P–E 曲线；单个分量数值 | 方向、参考坐标系、分量、完整矢量/张量无专用模型 |
| 介电 | Physical property | ε′、ε″ 随频率曲线，或单个数值 | 频率、方向、复数/张量对应关系未结构化 |
| 非线性光学 | Physical property | 单个已注明定义/分量的数值或曲线 | 完整张量、系数约定、频率/波长组合、偏振/几何未结构化 |
| 载流子浓度 | Physical property | 一行两列 CSV 可显示单值 | 载流子类型、测量/拟合模型、误差和数值范围检索未结构化 |
| 超导相关数据 | Physical property | R(T)、磁性等二维曲线与声明的 Tc 单值 | 磁场、取值判据、扫描条件及证据关系没有专用模型；不自动判定超导 |
| 原始仪器文件、图片 | Original attachment | 原字节和校验值保留 | 不解析图片、专有格式、二维衍射图或完整数据立方体 |

“能保存/画二维数值图”与“已经成为可按属性名称、数值、单位、测量条件筛选比较的数据库字段”是不同能力。目前后者尚未实现。半导体/金属也没有现成研究标签。

## 3. 通用操作：每类数据都需要做的事情

1. 登录，进入 Contribute。
2. 在 **01 Phases & conditions** 点击 **Add phase**，填写 Formula / composition。Phase name 可选。鉴定为 Tentative/Identified 时填写依据。
3. 在该 Phase 下填写压力和温度。只写实际已知值；未报告选 Unreported；理论目标压力选 Calculation target pressure；未显式建模温度选 Not explicitly modelled。
4. 在 **02 Original files & visibility** 给批次命名，确认 Add files to this condition group 指向正确组。
5. Choose files or ZIP 添加文件。默认保持私密。
6. 在 **03 Data records** 选择数据卡片，核对 Experimental / Theoretical 和 Data type。
7. 数值数据选择 X/Y 列，填写两轴物理量和单位。**切换 Data type 后要重新核对轴标签和单位；当前表单不保证自动纠正之前的 Raman 默认值。**
8. 每条记录填写 Measurement method & setup / Original calculation method，以及 Data source / reference；备注补充缺失条件、误差、方向、仪器和处理情况。
9. 在 **04 Attribution & draft** 填归属，或明确选择 Apply my profile。Save draft 保存；Save & view batch 查看层级。
10. 真正准备好的研究数据，在 My Contributions 确认贡献权限后 Submit for review。格式检查通过不等于科学审核通过。

## 4. 结构：CIF / POSCAR

- 文件类型选择 Crystal structure；正确选择实验/理论来源。
- 一个记录对应一个具体结构文件和条件。不同压力的结构分开记录，不插值、不靠文件名猜压力。
- 数值谱不强制绑定结构。确需关联时，Exact structure record 指向同一 Phase、同一条件组的具体结构卡片。
- 现有检查只证明部分文本格式可读，不证明组成、结构、对称性或计算收敛正确。

示例文件：`example-files/structure/POSCAR`。它只是人为构造的语法示例，不是真实结构。POSCAR 的晶格、组分和坐标字段可参考 [VASP 官方格式说明](https://vasp.at/wiki/POSCAR)。

## 5. XRD、Raman、红外

| 内容 | Data type | X quantity / unit 示例 | Y quantity / unit 示例 |
| --- | --- | --- | --- |
| XRD | XRD pattern | 2θ / degree；也可用明确记录的 d-spacing 或 q | Intensity / 原文件实际单位 |
| Raman | Raman spectrum | Raman shift / cm⁻¹ | Intensity / 原文件实际单位 |
| 红外（临时方式） | Physical property | Wavenumber / cm⁻¹，或文件实际坐标 | Absorbance / 1；透过率须明确是比例 1 还是 % |

谱图至少提供两个有效数值点。Raman/XRD 类型会检查这一点；红外临时使用通用 property，尚无红外专用校验。

Raman 两次采集可以放在同一个文件：

```csv
raman_shift_cm1,acquisition_1,acquisition_2
100,2,3
200,5,4
300,1,2
```

首次选择 X=raman_shift_cm1、Y=acquisition_1；点击 **Add another curve from this file**，把新卡片 Y 改成 acquisition_2，并分别记录采集标签、来源和实际条件。原文件只保存一份。

红外文件示例：

```csv
wavenumber_cm1,absorbance
500,0.1
1000,0.3
1500,0.2
```

选择 Physical property，卡片标签填写 Infrared spectrum，X=波数，单位 cm⁻¹；Y=吸光度，单位 1。不要保留 Raman shift 轴标签。原始仪器文件或谱图图片选择 Original attachment。

## 6. 单个物性数值：载流子浓度、介电常数、Tc 等

**目前没有“属性名称 + 数值 + 单位”的直接输入模式。** 用一个实际条件坐标和一个属性数值构成两列、一个数据行，Physical property 可以显示 `1 recorded value`。

载流子浓度例子：

```csv
pressure_gpa,carrier_concentration_cm3
50,1.2e18
```

卡片设置：

| 字段 | 填写示例 |
| --- | --- |
| Data type | Physical property |
| Acquisition / calculation label | Carrier concentration · measurement 1 |
| X column | pressure_gpa |
| Y column | carrier_concentration_cm3 |
| X quantity / unit | Pressure / GPa |
| Y quantity / unit | Carrier concentration / cm⁻³ |
| P–T 条件 | 实际已知的压力与温度，与文件值一致 |
| Method / source | 实际方法、原始结果来源；说明分析模型和载流子类型 |

相对介电常数单值示例：

```csv
pressure_gpa,relative_permittivity
50,12
```

Y quantity 填 Relative permittivity，Y unit 填 1，并在方法/备注中说明频率、方向/分量与实部/虚部定义。只填 ε=12 无法完整表达这些条件。

声明的临界温度单值示例：

```csv
pressure_gpa,critical_temperature_k
50,45
```

X=Pressure/GPa，Y=Critical temperature/K。**Tc 是结果值，不是该实验的固定采集温度。** 需要保留来源数据和取值判据；本例数字没有科学含义，系统不确认超导。

不要为了凑两列虚构一个 0 K、0 GPa 或重复数据点。若没有任何可用的真实独立坐标，只能暂存为附件并解释，等待直接标量模式。当前不支持把单独一列 `value` 或一个文本数字当成 property 数值表。

## 7. 曲线物性：发光、光电、极化、介电与超导相关

均先选 Physical property，再准确填写属性名称（当前使用 Acquisition label / Y quantity）与坐标单位。

| 示例文件 | X | Y | 需要补充的实际上下文 |
| --- | --- | --- | --- |
| semiconductor/photoluminescence.csv | Wavelength / nm | Photoluminescence intensity / a.u. | 激发方式/波长、功率、采集几何和探测器等 |
| semiconductor/photoelectric.csv | Voltage / V | Photocurrent / A | 光照/暗态、光功率、受光面积、波长等 |
| semiconductor/polarization.csv | Electric field / kV/cm | Polarization / μC/cm² | 方向、坐标系、测量频率和扫描顺序等 |
| semiconductor/dielectric.csv | Frequency / Hz | ε′ 或 ε″ / 1 | 分量/方向、温度、偏压及实际约定等 |
| metal/resistance-temperature.csv | Temperature / K | Resistance / Ω | 压力、外磁场、测量方式及实际判据等 |

复数介电示例的实部与虚部是同一文件两条记录；本教程将它们分别选择为 Y 列，不把它们相加或只保留一个模长。极化扫描有重复 X 值，系统保留原文件顺序，不按 X 重排。

**扫描条件的边界：** R(T) 等文件中的每点温度已在 X 列记录，但当前条件组仅有一个温度数值或 unreported/not-modelled。教程将其固定温度留空，notes 明确说明“温度在文件中扫描、没有单一固定值”；这只是保留原始数据的临时方式，UI 的 T unreported 不表示文件里没有温度。它不会自动产生逐点 P–T 关系，也不适合直接作为完整的结构化扫描条件。下一版应增加 fixed / scanned / range 条件定义。

光学与样品环境条件的设计可参考 [NeXus optical spectroscopy](https://manual.nexusformat.org/classes/applications/NXoptical_spectroscopy.html) 和 [NXsample](https://manual.nexusformat.org/classes/base_classes/NXsample.html)。本教程只借鉴字段要求；当前网站没有实现这些完整数据标准。

## 8. 非线性光学：现在只能分量与原文件并存

示例：`semiconductor/nonlinear-optical-component.csv` 是声明的一个 χ^(2)_zzz 分量，Y unit 示例 pm/V。它仅演示一个有名称的数字记录；不能用它表示完整张量，也不能将 χ^(2)、d 系数、不同频率约定或坐标系的数据直接混为同一个属性。

多个已明确说明的分量可放在不同列，每列建立一张 property 卡片，再保留完整原始结果为 attachment。分量关系、坐标系、频率/波长与约定目前需写在 method/notes，系统不会恢复完整张量。正式张量上传应增加专用模式。

## 9. 批量上传：一包 15 原文件、17 条记录

`教学示例数据包.zip` 内只有数据文件和 manifest.csv，可直接从 Choose files or ZIP 导入。`上传教程与示例.zip` 是下载/归档用的完整包，请先解压，再选择里面的教学数据 ZIP；不要把整份教程包当作数据 ZIP 上传。它展示：

- 2 个显式教学 Phase、4 个独立条件组；不宣称已鉴定真实相。
- 1 个理论结构，实验 XRD/Raman，通用 property 形式的红外与所有列出的物性示例，1 个原始附件。
- Raman 两次采集、介电实部与虚部，各自共用一份原文件。
- 单个数值、重复 X 扫描顺序、科学计数法、理论目标压力和未建模温度。原文件支持科学计数法；当前单值预览可能展开为很长的十进制数字，后续需要专门的科学数值格式化。

`manifest.csv` 一行对应一张卡片。主要关系：

```text
phase_key → condition_key → record_id → file + X/Y columns
```

- phase_key 和 condition_key 是导入关联键；正式 ID 由系统为这次新草稿生成。
- 相同键的共享组成/条件不能冲突；不同实验轮次用不同 condition_key。
- 每条记录自己的 origin 与 data_type 分别设置。
- 单文件多曲线重复使用同一 file，改变 record_id 和 y_column。
- structure_record_id 可选，必须确实指向同一 Phase/条件中的具体结构。
- 导入后逐组查看，再打开每张卡片核对。不要直接将这份教学包提交审核。

需要现成的填好草稿时，可用 Import JSON draft 导入 `tutorial-draft.json`。它同样保持私密、未确认投稿权限、不请求平台计算。教程包未提供个人联系资料，因此不会通过真实提交的归属检查。

限制：100 原文件，单文件 10 MiB，总计 50 MiB；300 条记录；单条数值表预览最多 10,000 行、64 列。专有/二维文件只能作为附件保留。

## 10. 下一版建议的最小补齐

保持 Phase → P–T 条件 → 数据卡片，同时在卡片内分开：

1. **来源**：实验 / 理论。
2. **主类别**：结构 / 谱学 / 物性 / 原始附件。
3. **具体类型**：XRD、Raman、IR；载流子浓度、介电响应、极化、光电、发光、Tc 等，也允许自定义名称。
4. **数据形态**：单值（直接输入 value/unit/uncertainty）、曲线、向量/张量、表格/多维数据、附件。
5. **补充条件**：频率/波长、光照、电场/磁场、方向/分量、参考系与取值判据，按属性显示。
6. **条件模式**：固定值 / 扫描变量 / 区间 / 未报告，避免把扫描数据塞进一个假定 P–T 点。

半导体 / 金属作为可选研究标签，用来推荐常见属性，不限制其他性质的上传，也不根据化学式自动推断材料电子类型。名称、数值和单位需结构化后，才能进一步支持属性检索、范围过滤、比较和单位处理。

## 11. 教学包与范围

教学 ZIP 含 15 个原始数据文件及 manifest.csv，对应 17 条格式就绪记录、2 Phase、4 条件组。单值解析为一个有效点。根教学标记和已知来源标记被客户端及服务端识别，在写入前拒绝保存。示例不进入材料记录或统计。

教学包不含真实科学结果。格式就绪仅代表当前解析器接受文件，不是科学审核通过。原始附件只保留字节，不自动解码。结构、谱学和物性专业模型的缺口仍需后续完善。
