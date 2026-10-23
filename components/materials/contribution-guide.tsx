import Link from "next/link";
import { ArrowUpRight, Download, BookOpen } from "lucide-react";
import { contributionExamples } from "@/lib/materials/contribution-examples";

export function ContributionGuide() {
  return <section id="contribution-guide" className="knowledge-section upload-documentation-guide">
    <div className="knowledge-section-heading"><BookOpen size={23}/><h2>Contribution guide <span className="guide-translation">上传教程</span></h2></div>
    <p>采用 <strong>Phase → P–T 条件 → 数据卡片</strong>。Contribute 提供按需加载的示例，下面说明如何准备自己的结构、谱图和物性数据。</p>
    <div className="guide-step-grid">
      {[
        ["01","定义 Phase","填写 formula/composition。相名称可留空，系统生成待鉴定名称和永久贡献 ID；已鉴定声明需有依据。结构未知也可以上传谱图。"],
        ["02","添加 P–T 条件","填真实已知条件。区分报告压力、计算目标压力和未报告；理论未显式考虑温度时注明，不自动填 0 K。"],
        ["03","添加数据卡片","每张卡片选择实验/理论来源与类型，核对 X/Y 列、物理量、单位、方法和来源。同一文件可对应多次采集。"],
        ["04","保存与提交","确认归属和可见范围。先保存私密草稿，再从 My Contributions 提交审核。示例浏览模式禁止保存与提交。"],
      ].map(([n,title,description])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{description}</p></article>)}
    </div>
    <div className="guide-key-note"><strong>先看示例，再填真实数据。</strong><p>Contribute 的 Browse examples 可以加载任一类别，体验实际表单；Return to my draft 恢复原草稿。示例全部是教学虚拟数据，不代表真实材料性质，也不进入数据库统计。</p></div>
    <h3 id="scalar-upload">单个数值怎么传？</h3>
    <p>目前 Physical property 使用数值文件。一个实际坐标加一个属性值，<strong>两列、一行</strong>即可显示单值；直接 value/unit 输入模式尚未实现。</p>
    <pre className="guide-code"><code>{"pressure_gpa,carrier_concentration_cm3\n50,1.2e18"}</code></pre>
    <p>这是教学示例：X=Pressure/GPa，Y=Carrier concentration/cm⁻³。不要为凑两列虚构压力或温度；没有真实独立坐标时先保留原文件为附件。量纲为 1 的属性也要明确单位，例如相对介电常数。</p>
    <Link href="/contribute?example=carrier#upload-examples" className="text-link">在表单中查看载流子浓度示例 <ArrowUpRight size={14}/></Link>
    <h3>按数据类别查看</h3>
    <p>以下类别说明和示例共同维护。红外及部分物性当前使用通用 Physical property；张量示例只代表一个注明的分量，没有完整张量解析。</p>
    <div className="guide-example-list">{contributionExamples.map(example=><details key={example.id} id={"example-"+example.id}>
      <summary><span>{example.title}</span><small>{example.format}</small></summary>
      <div><p>{example.description}</p><p className="guide-limitation">{example.limitation}</p><Link href={"/contribute?example="+example.id+"#upload-examples"} className="text-link">Open this example · 在表单中查看 <ArrowUpRight size={13}/></Link></div>
    </details>)}</div>
    <h3 id="batch-upload">批量上传与多次采集</h3>
    <p>ZIP 中放原始文件和 manifest.csv，每行对应一张数据卡片。phase_key 和 condition_key 明确关联层级；共享字段冲突会报错，不从名称、formula 或相同 P–T 猜测相身份。</p>
    <pre className="guide-code"><code>{"phase_key → condition_key → record_id → file + X/Y columns"}</code></pre>
    <p>一个 Raman 文件可以含 shift、repeat_1、repeat_2 三列；两张记录共用 file，分别选择不同 Y 列。同理，介电实部和虚部可以分别建卡。Add another curve from this file 保留原文件一份。</p>
    <div className="guide-downloads"><a href="/upload-examples/teaching-data.zip" download className="secondary-link"><Download size={14}/>教学 ZIP：15 文件 / 17 记录</a><a href="/upload-examples/upload-guide-zh.md" download className="text-link">下载完整中文教程 <Download size={13}/></a></div>
    <p className="knowledge-note">只导入或查看教学 ZIP，不作为研究数据提交。多文件上限 100，单文件 10 MiB，原字节总计 50 MiB，最多 300 记录；数值预览最多 10,000 行、64 列。专有仪器文件和二维图片保留为附件。</p>
    <h3 id="internal-imports">管理员导入与后端 CLI</h3>
    <p>用户 Contribute 和管理员 Data imports 使用同一份清单、Phase → P–T → 数据记录契约及服务端检查。管理员可以上传 JSON、ZIP 或清单与原文件，先看校验报告，再保存草稿并沿用现有审核流程。</p>
    <p>批量脚本在后端目录运行 <code>npm run data:ingest -- --help</code>。CLI 可从 CSV 和文件目录准备标准 JSON，也可读取 Contribute 导出的 JSON；通过网站账号登录 API，不直接连接数据库。认证配置使用本机私有文件，不能放进数据包或 Git。</p>
    <pre className="guide-code"><code>{"npm run data:ingest -- prepare --manifest ./input/manifest.csv --directory ./input --metadata ./metadata.json --out ./package.json\nnpm run data:ingest -- check --input ./package.json"}</code></pre>
    <p>来源命名空间和批次编号按登录账号隔离；相同编号及内容返回已有回执，不新增重复记录。内容修订请使用新的修订编号。上传不会自动公开、启动计算或证明相稳定性；网页和 CLI 沿用相同的文件/批次上限。</p>
    <Link href="/admin?section=imports" className="text-link">Data imports · 需要管理员权限 <ArrowUpRight size={14}/></Link>
    <h3>条件与科学解释</h3>
    <ul className="guide-science-notes">
      <li><strong>Tc 是结果值，不能作为固定采集温度。</strong>记录实际取值判据、来源和原始测量证据；上传曲线不自动判定超导。</li>
      <li><strong>R(T)、ε(f) 等扫描要保留每点坐标。</strong>当前不自动建立逐点 P–T 关系，扫描范围和没有单一固定值的情况需在方法/备注解释；专用扫描条件模式尚待补齐。</li>
      <li><strong>光照、频率、方向、外场和系数约定要说明。</strong>它们目前主要写入 method/notes，不能把不同条件的数值直接视为同一个可比较属性。</li>
      <li><strong>换类型后重新核对轴与单位。</strong>红外临时选 Physical property，应填写实际波数/频率/波长与吸收或透过信号，不保留 Raman 默认标签。</li>
    </ul>
    <h3>可见范围、审核与计算</h3>
    <p>草稿默认私密。公开意愿、贡献权限、批次审核和计算授权分别记录；只有获批且选择公开的贡献进入共享检索。相鉴定声明和审核通过都不证明稳定性。当前审核以整个批次为单位。</p>
    <p>连接本地服务时，草稿和原始文件保存在数据库；未连接服务的浏览器模式只保存在该账户的本机存储。可导出自己的 JSON 草稿备份。自动 VASP 工作流尚未接入，不显示虚构百分比或自动入库结果。</p>
    <Link href="/contribute#upload-examples" className="text-link">Browse examples in Contribute <ArrowUpRight size={14}/></Link>
  </section>;
}
