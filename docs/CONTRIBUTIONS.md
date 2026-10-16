# 数据贡献：Phase → P–T 条件 → 数据记录

2026-10-14（v13）。当前网站通过同源 API 连接本机 PostgreSQL，草稿、原始文件、提交、批次审核与可恢复归档均已接入。VASP 自动计算适配器尚未接入，不展示虚构计算进度。

## 页面与数据组织

### 示例与上传教程（v14）

贡献页的 **Examples & templates → Browse examples** 默认折叠。12 类按需示例覆盖结构、XRD、Raman、红外、发光、光电、极化、介电、非线性光学、载流子浓度、超导相关记录与混合批次。点击 Load example 后直接在实际表单中浏览和体验字段，Return to my draft 恢复进入预览前的原草稿、选中记录与未保存状态。恢复仅限当前页面内存，离开或刷新前仍应保存自己的草稿。

`/docs#contribution-guide` 提供四步上传说明、逐类别限制、单值 CSV、共用文件的多次采集与 ZIP/manifest 教程。文档链接 `/contribute?example=<id>#upload-examples` 只展开并提示相应示例，仍需明确点击加载。教学 ZIP 和完整中文教程可下载；真实上传的空白 CSV 模板仍使用原入口。

所有教学字节、组成和数值是人为构造的。预览不自动复制个人资料，默认私密且无贡献或计算授权；保存、提交、真实文件导入和导出研究草稿均禁用。v3 根字段 `exampleOnly` 是兼容的可选布尔值，默认 false；已知 `TUTORIAL ONLY:` 来源标记也会被识别。浏览器持久化与服务端 PUT 均在写入前拒绝标记的教学草稿。该机制避免误提交本项目示例，不是对任意伪造数据的科学真实性检测。

红外和多数物性使用现有 Physical property 模式，单值暂用真实独立坐标加属性值的两列一行 CSV。完整张量、扫描条件模型、直接 value/unit 输入仍待实现；示例不会扩充科学数据库字段或假装这些能力已经具备。

1. 建立 Phase，填写 formula/composition；相名称建议填写，允许留空。
2. 在 Phase 下建立独立 P–T 条件组，可注明加压、卸压、加热、冷却或计算背景。
3. 在条件组下添加数据卡片，每张卡片分别选择 `experimental` / `theoretical`，再选择 structure / xrd / raman / property / attachment。
4. 填写归属和公开意愿，保存草稿；完整批次在 My Contributions 中提交审核。

Phase 的 composition 是主要组成信息。投料组成和实测元素组成可选，分别保存，不替代主 formula。结构未知的实验数据可以上传；没有可计算结构的谱图不会自动进入 VASP 工作流。

每个 Phase 从创建草稿起拥有 `PH-…` 永久贡献 ID。名称留空时显示 `Unidentified phase · <ID 最后八个字符>`，完整 ID 在编辑页显示。改名或审核不重新编号。名称、ID、提供者相鉴定状态、批次审核、计算与入库状态独立；名字不是相鉴定证据。`tentative` / `identified` 须提供鉴定依据，属于贡献者声明，不代表平台独立确认，更不代表稳定。

当前贡献 Phase 归属一个批次，数据库全局唯一；跨批次追加到既有 Phase、与正式材料/相注册表关联、相合并/拆分、混相的共享测量关联，留待后续明确审核与权限策略。不能靠名称、formula、空间群或相同 P–T 自动认定相身份。

## 投稿草稿、重传与删除（v15）

**Submission title · 上传批次标题** 是一次投稿的工作流容器名称，不是 XRD 测量轮次，也不改变 Phase → P–T → 数据卡片的科学层级。一份投稿可以含多 Phase、多条件和多次采集。相同 P–T 下的多次 XRD 建独立卡片，用 acquisition label、sample/run、时间和仪器区分；不同 P–T 使用独立条件组。独立投稿可从 My Contributions 的 New batch 创建，跨投稿不根据 formula/名称自动合并 Phase。

Save draft 会保存文件和元数据，并将草稿 ID、当前条件和记录写入 `/contribute?draft=…&condition=…&record=…`。刷新恢复同一投稿与所选上下文；My Contributions / Saved submissions 也可重新打开。尚无原文件或已经删除全部记录的元数据草稿同样可保存，但不能提交审核。未再次保存的后续改动仍不会凭空持久化。

普通文件上传按相对路径与校验值处理：同内容重传到同一条件时定位已有记录，不覆盖其方法、类型、列选择，也不重复建卡；重传到其他条件时复用原始字节并建立独立卡片；同名不同字节保留两份，显示明确的新存储路径（如 `measurement (2).csv`），不覆盖或修改字节。文件名不同的原文件仍有独立身份。单个条件内要增加另一条曲线/采集，应使用 Add another curve from this file 并注明实际条件。

Data records 可切换 This condition / All records，后者显示每条记录所属 Phase 和条件。含数据的 Phase/条件移除前有数量明确的确认；空条件可直接移除，一个 Phase 保留至少一个条件组，可通过 Remove phase 移除最后的组。移除只改当前草稿，保存前可 Undo removal；继续编辑或保存会结束此次撤销机会。共享原文件在仍被其他记录引用时保留。保存删除后的空草稿，刷新不会恢复已移除记录。

带 manifest 的 ZIP 继续使用**整份批次清单**语义。已有同路径但不同字节时明确拒绝，并提示使用独立 ZIP 文件夹及相应 manifest 路径，绝不静默将清单指向旧文件或新版本。JSON 草稿导入仍作为新副本重映射身份。教学示例仍禁止保存。

直接数值、粘贴谱图和粘贴结构的界面不在 v15 中实现，保持后续独立设计。

## 条件与记录

条件使用独立 ID，相同 P–T 的不同实验轮次可以分别建立组。压力明确区分 `reported` / `target` / `unreported`；温度区分 `reported` / `not-modelled` / `unreported`。未报告或未建模没有数值，不默认填 0；0 GPa 与 0 K 本身是明确数值。目标压力不作为实测/报告压力进入公共压力筛选。

卡片继承 Phase 组成和条件组 P–T。实际采集/计算条件有差异时，开启 record-specific conditions，单独保存覆盖值与定义。实验记录不能将计算目标压力或未建模温度当成实验条件；确实缺失时可显式声明 unreported。

样品/实验轮次标识、采集标签、时间、仪器/软件为记录附加信息，不占主层级。一个条件组可以含多类数据、同类多次采集和两种来源。

文件与记录分离：同一原始文件可定义多个记录，各自指定 X/Y 列、来源和条件；原始字节只保存一份。不同 Phase 也可以分别引用同批次的同一个原文件，但不会自动解释为已确认混相。可选结构关联须指向同一 Phase、同一条件组中的具体结构记录；实际条件覆盖仍需贡献者/审核者核对。

EOS 等跨条件曲线目前可作为带说明的 property 原始记录保存；逐点关联多个条件、拟合方法与参数等结构化模型尚未实现，不假装已建立 Pressure Explorer。

## 文件与批量导入

- 多文件、ZIP（一个可选 manifest.csv）、CSV 清单、JSON 草稿均支持。
- 100 原文件，单文件 10 MiB，原始字节总计 50 MiB，300 数据记录；ZIP 展开后按此检查。
- CIF/POSCAR 做基础格式检查。数值 CSV/TXT/TSV/XY 可预览；Raman/XRD 至少两个有效点，property 至少一个。保留原值和顺序，不平滑、拟合或转单位。
- 2D 图像、仪器专有文件作为 attachment 保留，不声称已解析谱图。
- SHA-256 验证原始字节；绝对路径、父目录跳转、文件映射歧义和未映射文件拒绝导入。

清单一行对应一个数据记录。下载的空白 CSV 不插入示例科学记录。

| 字段 | 含义 |
| --- | --- |
| `record_id`, `file`, `origin`, `data_type` | 必需列；唯一记录 ID、原文件路径、来源和类型 |
| `phase_key`, `condition_key` | 本次导入关联键；condition_key 在 phase_key 内分组，不是正式数据库 ID |
| `formula`, `phase_name`, `phase_status`, `phase_evidence` | Phase 共享组成、名称和鉴定声明；旧 `phase_label` 仍兼容 |
| `feed_composition`, `measured_composition` | 可选补充组成 |
| `pressure_gpa`, `temperature_k`, `pressure_mode`, `temperature_mode` | 条件组共享数值与定义；无模式但有数值时按 reported，无数值时 unreported |
| `condition_label`, `condition_path`, `condition_notes` | 条件组标签、路径与说明 |
| `acquisition_label`, `acquired_at`, `instrument`, `sample_id` | 单次采集/计算标签、时间、仪器/软件及可选样品标识 |
| `structure_record_id`, `processing` | 可选具体结构记录关联；raw / processed |
| `x_quantity`, `x_unit`, `y_quantity`, `y_unit` | 坐标物理量及单位 |
| `x_column`, `y_column` | 唯一列名或从 0 起列索引 |
| `method`, `source`, `notes` | 每条记录的实际方法、来源与科学备注 |

共享键的重复行可以省略已经给出的共享字段；出现冲突则报错，不采用最后一行覆盖。没有 phase_key/condition_key 的旧清单逐记录建立独立容器，不靠文件名或数值猜测分组。同一文件路径可以重复用于不同采集/曲线。

## 保存、审核与公开

保存允许科学上下文不完整，保持私密。实际提交时服务端重新校验关联、文件、组成、条件、方法、来源、鉴定依据、联系信息与贡献权限。空 Phase 需移除或添加数据。当前审核以整个批次为单位，逐记录部分审批尚未实现。

`private` 仅所有者与具备权限的审核者可访问；未提交私密原文件不向管理员开放。`public-after-review` 只有提交并获批后才能进入检索。理论贡献保留红星及标准化待处理说明，实验数据保留实验来源标签。贡献 ID 用于组织同批相的数据，不将贡献者鉴定等同平台科学结论。首页科学统计仍明确仅计导入数据，不把待鉴定贡献加入已确认晶相数量。

用户上传结果与未来平台标准计算输出将是不同记录，保持输入/输出关联。公开意愿与计算授权分别保存；计算不能自动改变私密范围。未经工作流适配器返回的真实步骤与完成数，不生成百分比或剩余时间。

## 数据库与兼容

草稿版本为 3：`phases[]`、`conditions[]`、`records[]`、`files[]`。每个 record 有 phaseId / conditionId，保留 formula / phaseLabel / pressureGPa / temperatureK 兼容投影；Phase 和共享条件是权威来源，服务端重新计算投影，禁止记录伪造另一个组成。

PostgreSQL 以 draft_json 保存完整元数据，原字节在 files，记录在 records；增量迁移 004 建立 contribution_phases / contribution_conditions，以全局主键及批次内外键保护身份关联。不修改已应用迁移或 calypso_lab 科学表。

旧 v2 草稿读取时逐记录生成独立 Phase/条件容器，ID 确定且重读稳定，不回写原库；编辑保存后写 v3。原文件、记录 ID、方法、归属、私密范围与权限保留。v1 单结构 JSON 导入仍支持。导出后作为新批次导入时重新生成批次、Phase 和条件 ID，并完整映射关联，避免跨批次身份冲突。

HTTP 路径保持 `/api/contributions/batches`、`/batches/:id`、`/:id/submit`、`/:id/events`、`/:id/files/:fileId`、`/admin/review` 与 `/:id/restore`；写操作保持认证、CSRF 和版本冲突检测。审核队列增补 phases / conditions，旧响应缺失时客户端按空数组兼容。
