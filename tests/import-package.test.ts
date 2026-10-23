import test from 'node:test';
import assert from 'node:assert/strict';
import { readImportPackage } from '../lib/materials/import-package.ts';
import { newBatch, newPhase, newCondition, defaultRecord, makeDraftFile, batchSchema, fileBytes } from '../lib/materials/batch-contribution.ts';
const csv = 'x,y\n100,2\n200,5\n';
test('admin file picker uses the same contribution manifest graph and retains original bytes', async () => {
    const manifest = 'record_id,file,origin,data_type,phase_key,condition_key,formula,pressure_mode,temperature_mode,method,source\na,spectrum.csv,experimental,raman,p1,c1,FeO,unreported,unreported,QA,QA\nb,spectrum.csv,theoretical,xrd,p1,c1,FeO,unreported,unreported,QA,QA\n';
    const batch = await readImportPackage([new File([manifest], 'manifest.csv'), new File([csv], 'spectrum.csv')]);
    assert.equal(batch.phases.length, 1);
    assert.equal(batch.conditions.length, 1);
    assert.equal(batch.records.length, 2);
    assert.equal(batch.files.length, 1);
    assert.equal(batch.records[1].origin, 'theoretical');
    assert.deepEqual(fileBytes(batch.files[0]), new TextEncoder().encode(csv));
    assert.equal(batch.permissionConfirmed, false);
    assert.equal(batch.visibility, 'private');
});
test('admin JSON packages preserve scientific values and permission while remapping local container identities', async () => {
    const b = newBatch(), p = { ...newPhase(), formula: 'FeO' }, c = newCondition(p.id), f = await makeDraftFile('spectrum.csv', new TextEncoder().encode(csv));
    const batch = batchSchema.parse({ ...b, phases: [p], conditions: [c], files: [f], records: [{ ...defaultRecord(f.id, 1, 'experimental', 'raman'), phaseId: p.id, conditionId: c.id }] });
    const loaded = await readImportPackage([new File([JSON.stringify(batch)], 'package.json')]);
    assert.notEqual(loaded.phases[0].id, p.id);
    assert.equal(loaded.records[0].phaseId, loaded.phases[0].id);
    assert.equal(loaded.files[0].sha256, f.sha256);
    assert.equal(loaded.visibility, 'private');
});
test('admin uploads reject missing manifests, duplicate paths and unsafe or ambiguous inputs', async () => {
    await assert.rejects(readImportPackage([]), /Choose/);
    await assert.rejects(readImportPackage([new File([csv], 'spectrum.csv')]), /manifest/);
    const manifest = 'record_id,file,origin,data_type\na,spectrum.csv,experimental,raman\n';
    await assert.rejects(readImportPackage([new File([manifest], 'manifest.csv'), new File([csv], 'spectrum.csv'), new File([csv], 'spectrum.csv')]), /unique|ambiguous/i);
});
