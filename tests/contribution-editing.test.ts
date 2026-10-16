import test from 'node:test';
import assert from 'node:assert/strict';
import {newBatch,newPhase,newCondition,makeDraftFile,batchSchema,batchReadiness,fileBytes} from '../lib/materials/batch-contribution.ts';
import {attachOriginalFiles,removeDraftItems,savedContributionHref} from '../lib/materials/contribution-editing.ts';
const bytes=new TextEncoder().encode('x,y\n10,1\n20,2\n');
async function fixture(){const phase={...newPhase(),formula:'FeO'}, c1={...newCondition(phase.id),label:'compression'},c2={...newCondition(phase.id),label:'decompression'};return {batch:batchSchema.parse({...newBatch(),phases:[phase],conditions:[c1,c2]}),file:await makeDraftFile('measurement.csv',bytes)};}
test('saved locations retain the submission and exact selected context without dangling IDs',async()=>{
 const {batch,file}=await fixture(), attached=attachOriginalFiles(batch,[file],batch.conditions[1].id);
 const url=new URL(savedContributionHref(attached.draft,attached.conditionId,attached.recordId),'http://localhost');
 assert.equal(url.searchParams.get('draft'),batch.id);assert.equal(url.searchParams.get('condition'),batch.conditions[1].id);assert.equal(url.searchParams.get('record'),attached.recordId);
 assert.equal(new URL(savedContributionHref(batch,'missing','missing'),'http://localhost').searchParams.size,1);
});
test('re-uploading the same bytes locates the current record or adds a separate condition record without copying bytes',async()=>{
 const {batch,file}=await fixture(), first=attachOriginalFiles(batch,[file],batch.conditions[0].id);
 const edited=batchSchema.parse({...first.draft,records:first.draft.records.map(r=>({...r,method:'Retain this method',dataType:'xrd',yColumn:0}))});
 const repeat=attachOriginalFiles(edited,[await makeDraftFile('measurement.csv',bytes)],batch.conditions[0].id);
 assert.equal(repeat.skipped,1);assert.equal(repeat.recordId,first.recordId);assert.equal(repeat.draft.records.length,1);assert.equal(repeat.draft.records[0].method,'Retain this method');assert.equal(repeat.draft.records[0].dataType,'xrd');assert.equal(repeat.draft.records[0].yColumn,0);
 const second=attachOriginalFiles(repeat.draft,[await makeDraftFile('measurement.csv',bytes)],batch.conditions[1].id);
 assert.equal(second.draft.files.length,1);assert.equal(second.draft.records.length,2);assert.notEqual(second.draft.records[0].conditionId,second.draft.records[1].conditionId);assert.equal(second.draft.records[0].fileId,second.draft.records[1].fileId);assert.equal(second.draft.records[1].method,'');assert.deepEqual(fileBytes(second.draft.files[0]),bytes);
});
test('same-name different-byte files are retained separately and repeated renamed content is reused',async()=>{
 const {batch,file}=await fixture(), first=attachOriginalFiles(batch,[file],batch.conditions[0].id);
 const other=await makeDraftFile('measurement.csv',new TextEncoder().encode('x,y\n10,7\n20,8\n'));
 const next=attachOriginalFiles(first.draft,[other],batch.conditions[1].id);
 assert.deepEqual(next.renamed,[{from:'measurement.csv',to:'measurement (2).csv'}]);assert.equal(next.draft.files[0].sha256,file.sha256);assert.equal(next.draft.files[1].sha256,other.sha256);assert.deepEqual(fileBytes(next.draft.files[1]),fileBytes(other));
 const repeat=attachOriginalFiles(next.draft,[other],batch.conditions[1].id);assert.equal(repeat.draft.files.length,2);assert.equal(repeat.draft.records.length,2);assert.equal(repeat.skipped,1);
 const a=await makeDraftFile('POSCAR',bytes), b=await makeDraftFile('POSCAR',new TextEncoder().encode('different geometry'));
 const structures=attachOriginalFiles(batch,[a,b],batch.conditions[0].id);assert.equal(structures.draft.files[1].path,'upload-2/POSCAR');assert.ok(structures.draft.records.every(r=>r.dataType==='structure'));
});
test('import limits apply to unique retained originals and rejection leaves the original graph untouched',async()=>{
 const {batch,file}=await fixture(), first=attachOriginalFiles(batch,[file],batch.conditions[0].id).draft;
 const full=batchSchema.parse({...first,files:Array.from({length:100},(_,i)=>({...file,id:'f'+i,path:i?'data-'+i+'.csv':file.path})),records:first.records.map(r=>({...r,fileId:'f0'}))});
 const original=JSON.stringify(full);assert.equal(attachOriginalFiles(full,[file],batch.conditions[0].id).draft.files.length,100);
 const extra=await makeDraftFile('one-more.csv',bytes);assert.throws(()=>attachOriginalFiles(full,[extra],batch.conditions[0].id),/100 original files/);assert.equal(JSON.stringify(full),original);
 const long=await makeDraftFile('a'.repeat(296)+'.csv',bytes);assert.equal(attachOriginalFiles(batch,[long],batch.conditions[0].id).draft.files[0].path,long.path);
});
test('record/condition/phase removal preserves shared bytes and clears exact links to removed structures',async()=>{
 const {batch,file}=await fixture(), one=attachOriginalFiles(batch,[file],batch.conditions[0].id);
 const two=attachOriginalFiles(one.draft,[file],batch.conditions[1].id).draft;
 const extra={...two.records[0],id:'linked',structureRecordId:two.records[0].id};
 const linked=batchSchema.parse({...two,records:[...two.records,extra]});
 const removed=removeDraftItems(linked,'record',two.records[0].id);assert.equal(removed.records.find(r=>r.id==='linked')?.structureRecordId,'');assert.equal(removed.files[0].sha256,file.sha256);
 const condition=removeDraftItems(two,'condition',batch.conditions[0].id);assert.equal(condition.records.length,1);assert.equal(condition.files.length,1);assert.equal(condition.conditions.length,1);assert.equal(condition.phases[0].id,batch.phases[0].id);
 const phase=removeDraftItems(condition,'phase',batch.phases[0].id);assert.deepEqual([phase.phases.length,phase.conditions.length,phase.records.length,phase.files.length],[0,0,0,0]);assert.equal(two.records.length,2);
});
test('private drafts support metadata-only editing and empty titles without qualifying for submission',async()=>{
 const {batch}=await fixture(), draft=batchSchema.parse({...batch,title:''});
 assert.equal(draft.phases.length,1);assert.equal(draft.records.length,0);assert.ok(batchReadiness(draft,{}).batchIssues.some(i=>i.includes('title')));assert.ok(batchReadiness(draft,{}).batchIssues.some(i=>i.includes('scientific record')));
});
