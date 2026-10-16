import { batchSchema, batchLimits, defaultRecord, newPhase, newCondition, safePath, type BatchDraft, type DraftFile } from './batch-contribution.ts';

/** A submission is a workflow envelope; files and scientific records have separate identities. */
function versionedPath(path: string, version: number) {
  const slash = path.lastIndexOf('/'), folder = path.slice(0, slash + 1), name = path.slice(slash + 1), dot = name.lastIndexOf('.');
  const candidate = dot > 0 ? `${folder}${name.slice(0,dot)} (${version})${name.slice(dot)}` : `${folder}upload-${version}/${name}`;
  return candidate;
}
export function attachOriginalFiles(batch: BatchDraft, incoming: DraftFile[], conditionId: string) {
  if (!incoming.length) throw new Error('Choose at least one original file.');
  const phases = [...batch.phases], conditions = [...batch.conditions];
  let target = conditions.find(c => c.id === conditionId);
  if (!target) { const p = newPhase(); target = newCondition(p.id); phases.push(p); conditions.push(target); }
  const files = [...batch.files], records = [...batch.records], ids = new Set(records.map(r=>r.id));
  let sequence = records.length, reused = 0, skipped = 0, recordId = '';
  const renamed: Array<{from:string;to:string}> = [];
  for (const input of incoming) {
    safePath(input.path);
    const family = new Set([input.path, ...Array.from({length:batchLimits.files},(_,i)=>versionedPath(input.path,i+2))]);
    let file = files.find(f => family.has(f.path) && f.sha256 === input.sha256 && f.size === input.size);
    if (file) reused++;
    else {
      let path = input.path, version = 2;
      while (files.some(f=>f.path===path)) path = versionedPath(input.path,version++);
      if (path !== input.path) renamed.push({from:input.path,to:path});
      if (path.length > 300) throw new Error('The filename is too long to distinguish versions. Use a shorter name or ZIP folder.');
      file = {...input,path:safePath(path)}; files.push(file);
    }
    const existing = records.find(r => r.fileId===file.id && r.conditionId===target.id);
    if (existing) { skipped++; recordId ||= existing.id; continue; }
    let id: string; do { id='record-'+ ++sequence; } while (ids.has(id)); ids.add(id);
    const kind = /\.cif$|\.vasp$|\.poscar$|(?:^|\/)POSCAR$/i.test(input.path) ? 'structure' : /\.(csv|txt|tsv|xy)$/i.test(input.path) ? 'raman' : 'attachment';
    const record = {...defaultRecord(file.id,sequence,'experimental',kind),id,phaseId:target.phaseId,conditionId:target.id};
    records.push(record); recordId ||= id;
  }
  if (files.length > batchLimits.files) throw new Error('A batch can hold at most 100 original files.');
  if (files.reduce((n,f)=>n+f.size,0)>batchLimits.totalBytes) throw new Error('A batch can hold at most 50 MiB of original files.');
  if (records.length>batchLimits.records) throw new Error('A batch can hold at most 300 records.');
  const draft = batchSchema.parse({...batch,phases,conditions,files,records});
  return {draft,conditionId:target.id,recordId,reused,skipped,renamed,added:files.length-batch.files.length};
}

/** Remove records only from this draft; shared originals survive while referenced elsewhere. */
export function removeDraftItems(batch: BatchDraft, kind: 'phase'|'condition'|'record', id: string): BatchDraft {
  const records = batch.records.filter(r=> kind==='phase' ? r.phaseId!==id : kind==='condition' ? r.conditionId!==id : r.id!==id);
  const ids = new Set(records.map(r=>r.id));
  return batchSchema.parse({...batch,
    phases:kind==='phase'?batch.phases.filter(p=>p.id!==id):batch.phases,
    conditions:batch.conditions.filter(c=>kind==='phase'?c.phaseId!==id:kind==='condition'?c.id!==id:true),
    records:records.map(r=>r.structureRecordId&&!ids.has(r.structureRecordId)?{...r,structureRecordId:''}:r),
    files:batch.files.filter(f=>records.some(r=>r.fileId===f.id)),
  });
}
export function savedContributionHref(batch: BatchDraft, conditionId: string, recordId: string) {
  const params = new URLSearchParams({draft:batch.id});
  if (batch.conditions.some(c=>c.id===conditionId)) params.set('condition',conditionId);
  if (batch.records.some(r=>r.id===recordId&&r.conditionId===conditionId)) params.set('record',recordId);
  return '/contribute?'+params.toString();
}
