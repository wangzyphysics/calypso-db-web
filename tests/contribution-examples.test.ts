import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { contributionExamples, prepareContributionExample } from "../lib/materials/contribution-examples.ts";
import { batchReadiness, batchSchema, inspectFile, fileBytes } from "../lib/materials/batch-contribution.ts";
import { unpackZip } from "../lib/materials/zip-import.ts";
import { saveLocalBatch } from "../lib/materials/local-batches.ts";
const readAsset = async()=>JSON.parse(await readFile(new URL("../public/upload-examples/examples-v1.json",import.meta.url),"utf8"));
test("each advertised category loads a complete isolated example with correct file/phase references",async()=>{
  const asset=await readAsset();
  for(const example of contributionExamples){
    const draft=await prepareContributionExample(asset,example.id);
    assert.equal(draft.exampleOnly,true);assert.equal(draft.visibility,"private");
    assert.equal(draft.permissionConfirmed,false);assert.equal(draft.computationRequested,false);
    assert.equal(draft.contributor.name,"");assert.equal(draft.contributor.email,"");
    assert.notEqual(draft.id,asset.id);
    assert.ok(draft.records.every(r=>draft.phases.some(p=>p.id===r.phaseId)&&draft.conditions.some(c=>c.id===r.conditionId)));
    assert.ok(draft.files.every(f=>draft.records.some(r=>r.fileId===f.id)));
    const ready=batchReadiness(draft,Object.fromEntries(draft.files.map(f=>[f.id,inspectFile(f)])));
    assert.equal(ready.ready,draft.records.length,example.id);
    assert.ok(ready.batchIssues.some(issue=>issue.includes("Teaching examples")));
  }
});
test("teaching clones preserve raw bytes while remapping identities and separating repeated acquisitions",async()=>{
  const asset=await readAsset(),raman=await prepareContributionExample(asset,"raman");
  assert.equal(raman.files.length,1);assert.equal(raman.records.length,2);
  assert.equal(raman.records[0].fileId,raman.records[1].fileId);
  assert.notEqual(raman.records[0].yColumn,raman.records[1].yColumn);
  assert.deepEqual(fileBytes(raman.files[0]),fileBytes(asset.files.find((f:{id:string})=>f.id===raman.files[0].id)));
  assert.notEqual(raman.phases[0].id,asset.phases[0].id);
  const second=await prepareContributionExample(asset,"raman");assert.notEqual(second.phases[0].id,raman.phases[0].id);
  const all=await prepareContributionExample(asset,"batch");assert.equal(all.records.length,17);assert.equal(all.files.length,15);assert.equal(all.phases.length,2);assert.equal(all.conditions.length,4);
});
test("teaching mode survives JSON import and cannot access real or browser storage",async()=>{
  const asset=await readAsset(),draft=await prepareContributionExample(asset,"carrier");
  assert.equal(batchSchema.parse({...draft,exampleOnly:false}).exampleOnly,true);
  assert.equal(batchSchema.parse({...draft,exampleOnly:true,records:draft.records.map(r=>({...r,source:"Edited teaching source"}))}).exampleOnly,true);
  await assert.rejects(()=>saveLocalBatch(draft,"local:qa"),/Teaching examples/);
  await assert.rejects(()=>saveLocalBatch(draft,"service:qa"),/Teaching examples/);
});
test("unknown, incomplete and corrupted examples fail rather than loading unrelated data",async()=>{
  const asset=await readAsset();
  await assert.rejects(()=>prepareContributionExample(asset,"does-not-exist"),/Unknown/);
  await assert.rejects(()=>prepareContributionExample({...asset,records:asset.records.filter((r:{id:string})=>r.id!=="tutorial-carrier-scalar")},"carrier"),/incomplete/);
  await assert.rejects(()=>prepareContributionExample({...asset,files:asset.files.map((f:{sha256:string})=>({...f,sha256:"0".repeat(64)}))},"carrier"),/checksum/);
});
test("published teaching ZIP is readable by the real import path and contains all original files",async()=>{
  const entries=await unpackZip(new Uint8Array(await readFile(new URL("../public/upload-examples/teaching-data.zip",import.meta.url))));
  assert.equal(entries.length,16);assert.ok(entries.some(e=>e.path==="manifest.csv"));
  const asset=await readAsset();for(const file of asset.files){const raw=entries.find(e=>e.path===file.path);assert.ok(raw);assert.deepEqual(raw.bytes,fileBytes(file));}
});
