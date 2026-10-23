import { newBatch, batchSchema, makeDraftFile, importBatchDraft, applyGroupedManifest, batchLimits, type BatchDraft } from './batch-contribution.ts';
import { unpackZip, type ArchiveEntry } from './zip-import.ts';
/** UI adapter only. Authoritative validation and writes always happen on the API. */
export async function readImportPackage(selected: File[]): Promise<BatchDraft> {
    if (!selected.length)
        throw new Error('Choose a JSON package, a ZIP with manifest.csv, or a manifest with its original files.');
    if (selected.length === 1 && selected[0].name.toLowerCase().endsWith('.json')) {
        if (selected[0].size > 72 * 1024 * 1024)
            throw new Error('JSON package is too large.');
        return importBatchDraft(JSON.parse(await selected[0].text()));
    }
    const entries: ArchiveEntry[] = [];
    for (const file of selected) {
        if (file.size > 64 * 1024 * 1024)
            throw new Error('Selected file is too large.');
        const bytes = new Uint8Array(await file.arrayBuffer());
        entries.push(...(file.name.toLowerCase().endsWith('.zip') ? await unpackZip(bytes) : [{ path: file.name, bytes }]));
    }
    const manifests = entries.filter(entry => entry.path.toLowerCase() === 'manifest.csv');
    if (manifests.length !== 1)
        throw new Error('Include exactly one manifest.csv at the ZIP root or alongside the original files.');
    if (manifests[0].bytes.length > 1024 * 1024)
        throw new Error('Manifest must be no larger than 1 MiB.');
    const originals = entries.filter(entry => entry !== manifests[0]);
    if (originals.length > batchLimits.files || originals.reduce((sum, entry) => sum + entry.bytes.length, 0) > batchLimits.totalBytes)
        throw new Error('Choose at most 100 original files and 50 MiB total.');
    const files = await Promise.all(originals.map(entry => makeDraftFile(entry.path, entry.bytes)));
    return batchSchema.parse(applyGroupedManifest(new TextDecoder('utf-8', { fatal: true }).decode(manifests[0].bytes), files, { ...newBatch(), title: 'Internal data import' }));
}
