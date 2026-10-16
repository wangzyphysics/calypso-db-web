"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronDown, ArrowUpRight, FlaskConical, Download } from "lucide-react";
import { contributionExamples, contributionExample, type ContributionExampleId } from "@/lib/materials/contribution-examples";

export function ContributionExamples({ load, busy, selected, requested }: {
  load: (id: ContributionExampleId) => void; busy: boolean; selected: string | null; requested: string | null;
}) {
  const [expanded, setExpanded] = useState(Boolean(contributionExample(requested)));
  return <section id="upload-examples" className="contribution-examples surface-card" aria-labelledby="upload-examples-title">
    <div className="example-library-heading">
      <div><span className="eyebrow">LEARN BY EXAMPLE</span><h2 id="upload-examples-title">Examples & templates <span>示例与模板</span></h2><p>选择一种数据，直接在下面的表单中查看填写方式。教学数值不代表真实材料数据。</p></div>
      <div className="example-library-actions">
        <button type="button" className="secondary-link" aria-expanded={expanded} aria-controls="example-library-content" onClick={()=>setExpanded(value=>!value)}><BookOpen size={15}/>{expanded?"Hide examples":"Browse examples"}<ChevronDown size={14} className={expanded?"expanded":""}/></button>
        <Link href="/docs#contribution-guide" target="_blank" rel="noopener noreferrer" className="text-link">Upload guide <ArrowUpRight size={14}/><span className="sr-only"> opens in a new tab</span></Link>
      </div>
    </div>
    {expanded && <div id="example-library-content">
      {["Structure & spectra","Physical properties","Batch import"].map(family=><div className="example-family" key={family}>
        <h3>{family}</h3><div className="example-library-grid">{contributionExamples.filter(example=>example.family===family).map(example=><article key={example.id} className={"example-library-card"+(selected===example.id?" selected":"")+(requested===example.id?" requested":"")}>
          <h4>{example.title}</h4><span className="example-format">{example.format}</span><p>{example.description}</p><small>{example.limitation}</small>
          <button type="button" disabled={busy} onClick={()=>{load(example.id);setExpanded(false);}} aria-label={"Load example: "+example.title}><FlaskConical size={14}/>{selected===example.id?"Reload example":"Load example"}</button>
        </article>)}</div>
      </div>)}
      <div className="example-library-footer"><p>Preview only · 示例可以体验字段，但不能保存或提交。退出后恢复原草稿。</p><a href="/upload-examples/teaching-data.zip" download className="text-link"><Download size={14}/>Download teaching ZIP</a></div>
    </div>}
  </section>;
}
