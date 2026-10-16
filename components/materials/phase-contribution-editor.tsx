"use client";
import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { Plus, Layers3, Thermometer, ChevronRight, Trash2 } from "lucide-react";
import { phaseName, conditionName, phaseStates, newPhase, newCondition, type BatchDraft, type DraftPhase, type DraftCondition } from "@/lib/materials/batch-contribution";

export function PhaseContributionEditor({ draft, activeConditionId, selectCondition, change, disabled, removePhase, removeCondition }: {
  draft: BatchDraft; activeConditionId: string; selectCondition: (id: string) => void;
  change: (patch: Partial<BatchDraft>) => void; disabled: boolean;
  removePhase: (id:string) => void; removeCondition: (id:string) => void;
}) {
  const [removal, setRemoval] = useState<{kind:"phase"|"condition";id:string;label:string;count:number}|null>(null);
  const condition = draft.conditions.find(c => c.id === activeConditionId) ?? draft.conditions[0];
  const phase = draft.phases.find(p => p.id === condition?.phaseId) ?? draft.phases[0];
  const updatePhase = (patch: Partial<DraftPhase>) => change({phases:draft.phases.map(p => p.id === phase.id ? {...p,...patch}:p)});
  const updateCondition = (patch: Partial<DraftCondition>) => change({conditions:draft.conditions.map(c => c.id === condition.id ? {...c,...patch}:c)});
  function addPhase() {
    const p = newPhase(), c = newCondition(p.id);
    change({phases:[...draft.phases,p],conditions:[...draft.conditions,c]}); selectCondition(c.id);
  }
  function addCondition() {
    const c = newCondition(phase.id); change({conditions:[...draft.conditions,c]}); selectCondition(c.id);
  }
  function requestRemoval(kind:"phase"|"condition") {
    const id=kind==="phase"?phase.id:condition.id;
    const count=draft.records.filter(r=>kind==="phase"?r.phaseId===id:r.conditionId===id).length;
    if (!count) { if(kind==="phase") removePhase(id); else removeCondition(id); return; }
    setRemoval({kind,id,count,label:kind==="phase"?phaseName(phase):conditionName(condition)});
  }
  return <section className="phase-composer surface-card" aria-labelledby="phase-composer-title">
    <div className="batch-section-heading"><span>01</span><h2 id="phase-composer-title">Phases & conditions</h2><span className="batch-record-summary">{draft.phases.length} phases · {draft.conditions.length} condition groups</span></div>
    <p className="form-note">Start with a formula. Structure files are optional. Each condition group can hold experimental and theoretical records.</p>
    <fieldset disabled={disabled} className="batch-control-fieldset phase-composer-layout">
      <nav className="phase-tree" aria-label="Contribution phases">
        {draft.phases.map(p => {
          const conditions=draft.conditions.filter(c=>c.phaseId===p.id);
          const n=draft.records.filter(r=>r.phaseId===p.id).length;
          return <div className={"phase-tree-group"+(p.id===phase?.id?" active":"")} key={p.id}>
            <button type="button" className="phase-tree-title" onClick={()=>selectCondition(conditions[0]?.id??"")}><Layers3 size={16}/><span><strong>{phaseName(p)}</strong><small>{p.formula || "Formula pending"} · {n} records</small></span></button>
            {conditions.map(c=><button type="button" key={c.id} className="phase-tree-condition" aria-current={c.id===condition?.id?"true":undefined} onClick={()=>selectCondition(c.id)}><ChevronRight size={13}/><span>{conditionName(c)}<small>{draft.records.filter(r=>r.conditionId===c.id).length} records · {c.path.replaceAll("-"," ")}</small></span></button>)}
          </div>;
        })}
        <button type="button" className="phase-add-button" onClick={addPhase} disabled={draft.phases.length>=300}><Plus size={15}/>Add phase</button>
      </nav>
      {phase ? <div className="phase-composer-fields">
        <div className="phase-panel-heading"><div><span className="eyebrow">PHASE</span><h3>{phaseName(phase)}</h3></div><button type="button" className="text-link" onClick={()=>requestRemoval("phase")}><Trash2 size={14}/>Remove phase</button></div>
        <div className="record-field-grid">
          <label>Formula / composition · required<input value={phase.formula} maxLength={300} placeholder="e.g. FeO" onChange={e=>updatePhase({formula:e.target.value})}/></label>
          <label>Phase name · optional<input value={phase.name} maxLength={300} placeholder="Leave blank for a generated name" onChange={e=>updatePhase({name:e.target.value})}/></label>
          <label>Identification status<select value={phase.identification} onChange={e=>updatePhase({identification:e.target.value as DraftPhase["identification"]})}>{Object.entries(phaseStates).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <label>Identification evidence · {phase.identification==="unassigned"?"optional":"required"}<input value={phase.evidence} maxLength={4000} placeholder="Reference, supporting records or assignment rationale" onChange={e=>updatePhase({evidence:e.target.value})}/></label>
        </div>
        <p className="phase-identity">Permanent ID <code>{phase.id}</code></p>
        <details className="phase-supplementary"><summary>Optional composition metadata</summary><div className="record-field-grid"><label>Feed / starting composition<input value={phase.feedComposition} maxLength={300} onChange={e=>updatePhase({feedComposition:e.target.value})}/></label><label>Measured elemental composition<input value={phase.measuredComposition} maxLength={300} onChange={e=>updatePhase({measuredComposition:e.target.value})}/></label></div></details>
        <div className="phase-condition-heading"><h3><Thermometer size={17}/>P–T condition group</h3><button type="button" className="text-link" onClick={addCondition} disabled={draft.conditions.length>=300}><Plus size={14}/>Add condition</button></div>
        {condition?.phaseId===phase.id ? <>
          <div className="record-field-grid">
            <label>Condition label · optional<input value={condition.label} maxLength={300} placeholder="Run 1 · compression" onChange={e=>updateCondition({label:e.target.value})}/></label>
            <label>Experimental / calculation path<select value={condition.path} onChange={e=>updateCondition({path:e.target.value as DraftCondition["path"]})}>{["unspecified","compression","decompression","heating","cooling","calculation"].map(v=><option value={v} key={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label>
            <label>Pressure definition<select value={condition.pressureMode} onChange={e=>updateCondition({pressureMode:e.target.value as DraftCondition["pressureMode"],...(e.target.value==="unreported"?{pressureGPa:""}:{})})}><option value="unreported">Unreported</option><option value="reported">Reported pressure</option><option value="target">Calculation target pressure</option></select></label>
            <label>Pressure · GPa{condition.pressureMode==="unreported"?<span className="condition-unreported">Explicitly unreported</span>:<input type="number" step="any" value={condition.pressureGPa} placeholder="Enter the value" onChange={e=>updateCondition({pressureGPa:e.target.value})}/>}</label>
            <label>Temperature definition<select value={condition.temperatureMode} onChange={e=>updateCondition({temperatureMode:e.target.value as DraftCondition["temperatureMode"],...(e.target.value!=="reported"?{temperatureK:""}:{})})}><option value="unreported">Unreported</option><option value="reported">Specified temperature</option><option value="not-modelled">Not explicitly modelled · theory</option></select></label>
            <label>Temperature · K{condition.temperatureMode!=="reported"?<span className="condition-unreported">{condition.temperatureMode==="not-modelled"?"No temperature value inferred":"Explicitly unreported"}</span>:<input type="number" min="0" step="any" value={condition.temperatureK} placeholder="Enter the value" onChange={e=>updateCondition({temperatureK:e.target.value})}/>}</label>
          </div>
          <label className="phase-condition-notes">Condition notes · optional<textarea rows={2} value={condition.notes} maxLength={4000} placeholder="Sample/run context, uncertainty, pressure range or shared acquisition details" onChange={e=>updateCondition({notes:e.target.value})}/></label>
          <div className="phase-condition-footer"><p className="form-note">Matching P–T values do not merge groups. Naming or review approval does not establish phase identity or stability.</p><button type="button" className="text-link" disabled={draft.conditions.filter(c=>c.phaseId===phase.id).length<=1} title={draft.conditions.filter(c=>c.phaseId===phase.id).length<=1?"A phase keeps one condition group. Remove the phase to clear its final group.":undefined} onClick={()=>requestRemoval("condition")}>{draft.records.some(r=>r.conditionId===condition.id)?"Remove condition":"Remove empty condition"}</button></div>
          {draft.conditions.filter(c=>c.phaseId===phase.id).length<=1 && <p className="form-note condition-removal-help">This is the phase’s final condition group. Use Remove phase to clear the phase and its data, or add another condition first.</p>}
        </>:<p className="form-note">Add a condition group to attach data.</p>}
      </div>:<div className="phase-empty"><Layers3 size={28}/><h3>Create your first phase.</h3><p>Add its composition, then organize measurements or calculations by P–T conditions.</p><p>Use “Add phase” to begin.</p></div>}
    </fieldset>
    <AlertDialog.Root open={Boolean(removal)} onOpenChange={open=>{if(!open)setRemoval(null);}}>
      <AlertDialog.Portal><AlertDialog.Overlay className="draft-removal-overlay"/><AlertDialog.Content className="draft-removal-dialog">
        <AlertDialog.Title>Remove this {removal?.kind} from the draft?</AlertDialog.Title>
        <AlertDialog.Description>{removal?.label} contains {removal?.count} data record(s). These records will be removed from this draft. Original files referenced by other records are retained. You can undo before editing again or saving; the database changes only when you save.</AlertDialog.Description>
        <div><AlertDialog.Cancel asChild><button type="button" className="secondary-link">Keep data</button></AlertDialog.Cancel><AlertDialog.Action asChild><button type="button" className="danger-link" onClick={()=>{if(removal?.kind==="phase")removePhase(removal.id);else if(removal)removeCondition(removal.id);}}>Remove from draft</button></AlertDialog.Action></div>
      </AlertDialog.Content></AlertDialog.Portal>
    </AlertDialog.Root>
  </section>;
}
