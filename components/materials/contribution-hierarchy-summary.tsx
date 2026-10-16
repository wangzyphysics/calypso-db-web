"use client";
import { phaseName, phaseStates, conditionName, dataTypes, type DraftPhase, type DraftCondition, type DraftRecord } from "@/lib/materials/batch-contribution";
export function ContributionHierarchySummary({phases,conditions,records,files}:{phases:DraftPhase[];conditions:DraftCondition[];records:DraftRecord[];files:{id:string;path:string}[]}) {
  if(!phases.length)return null;
  return <div className="contribution-hierarchy-summary">{phases.map(p=><article className="contribution-phase-summary" key={p.id}>
    <header><div><h3>{phaseName(p)}</h3><p>{p.formula} · {p.id}</p></div><span className="contribution-phase-state">{phaseStates[p.identification]} · contributor assignment</span></header>
    {p.evidence && <p className="form-note">Assignment evidence: {p.evidence}</p>}
    {conditions.filter(c=>c.phaseId===p.id).map(c=><section className="contribution-condition-summary" key={c.id}><h4>{conditionName(c)}</h4><p className="form-note">{c.path} · {records.filter(r=>r.conditionId===c.id).length} records</p><ul>{records.filter(r=>r.conditionId===c.id).map(r=><li key={r.id}><span className={"record-origin-tag "+r.origin}>{r.origin==="experimental"?"Experimental":"Theoretical"}</span><span><strong>{r.acquisitionLabel||r.id}</strong><small>{dataTypes[r.dataType]} · {files.find(f=>f.id===r.fileId)?.path || r.fileId}{r.overrideConditions?" · record-specific conditions":""}</small></span></li>)}</ul></section>)}
  </article>)}</div>;
}
