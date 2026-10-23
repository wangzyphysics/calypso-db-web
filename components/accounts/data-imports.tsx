"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileUp, RefreshCw, Terminal, TriangleAlert } from 'lucide-react';
import { useAuth } from './auth-context';
import { contributionApi, type ImportPreview, type ImportList } from '@/lib/materials/contributions-api';
import { readImportPackage } from '@/lib/materials/import-package';
import { type BatchDraft, manifestTemplate } from '@/lib/materials/batch-contribution';
import { ContributionHierarchySummary } from '@/components/materials/contribution-hierarchy-summary';
export function DataImports() {
    const auth = useAuth(), fileInput = useRef<HTMLInputElement>(null);
    const [draft, setDraft] = useState<BatchDraft | null>(null), [source, setSource] = useState(''), [key, setKey] = useState(''), [reason, setReason] = useState('');
    const [preview, setPreview] = useState<ImportPreview | null>(null), [list, setList] = useState<ImportList | null>(null), [offset, setOffset] = useState(0);
    const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState(''), [resultId, setResultId] = useState('');
    const [useProfile, setUseProfile] = useState(false);
    const requestId = useRef(0), alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => { let current = true; void contributionApi.imports(offset).then(data => { if (current)
        setList(data); }).catch(e => { if (current)
        setError((e as Error).message); }).finally(() => { if (current)
        setLoading(false); }); return () => { current = false; }; }, [offset]);
    function invalidate() { setPreview(null); setResultId(''); setMessage(''); requestId.current++; }
    async function load(files: File[]) {
        if (busy)
            return;
        setBusy(true);
        setError('');
        invalidate();
        setDraft(null);
        const request = ++requestId.current;
        try {
            const next = await readImportPackage(files);
            if (alive.current && request === requestId.current) {
                setDraft(next);
                setUseProfile(false);
            }
        }
        catch (e) {
            if (alive.current)
                setError((e as Error).message);
        }
        finally {
            if (alive.current)
                setBusy(false);
            if (fileInput.current)
                fileInput.current.value = '';
        }
    }
    const profile = auth.user?.profile;
    const actualDraft = draft && useProfile && auth.user ? { ...draft, contributor: { ...draft.contributor, name: profile?.displayName ?? '', email: profile?.contactEmail || auth.user.email || '', institution: profile?.institution ?? '', department: profile?.department ?? '', researchGroup: profile?.researchGroup ?? '', careerStage: profile?.careerStage ?? '', orcid: profile?.orcid ?? '' } } : draft;
    const input = actualDraft ? { draft: actualDraft, sourceNamespace: source, externalBatchId: key, reason } : null;
    const sourceValid = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(source), canCheck = !!input && sourceValid && key.trim().length > 0 && reason.trim().length >= 3;
    async function check() {
        if (!input || !canCheck || busy)
            return;
        setBusy(true);
        setError('');
        setMessage('');
        const request = ++requestId.current;
        try {
            const data = await contributionApi.previewImport(input);
            if (alive.current && request === requestId.current)
                setPreview(data);
        }
        catch (e) {
            if (alive.current) {
                setPreview(null);
                setError((e as Error).message);
            }
        }
        finally {
            if (alive.current)
                setBusy(false);
        }
    }
    async function save() {
        if (!input || !preview || preview.action === 'conflict' || busy)
            return;
        setBusy(true);
        setError('');
        try {
            const saved = await contributionApi.importPackage(input);
            if (!alive.current)
                return;
            setResultId(saved.receipt.batchId);
            setMessage(saved.replayed ? 'Existing import returned. No duplicate records were created.' : 'Import saved as a draft. Open the editor to complete context and submit for review.');
            setPreview({ ...preview, receipt: saved.receipt, action: 'replay' });
            const next = await contributionApi.imports(offset);
            if (alive.current)
                setList(next);
        }
        catch (e) {
            if (alive.current) {
                setError((e as Error).message);
                setPreview(null);
            }
        }
        finally {
            if (alive.current)
                setBusy(false);
        }
    }
    function downloadTemplate() { const url = URL.createObjectURL(new Blob([manifestTemplate()], { type: 'text/csv' })); const a = document.createElement('a'); a.href = url; a.download = 'manifest.csv'; a.click(); URL.revokeObjectURL(url); }
    return <div className="data-imports">
  <section className="account-panel import-introduction"><div><span className="eyebrow">ONE DATA CONTRACT</span><h2>Data imports</h2><p>User contributions and internal batches share the same Phase → P–T → record model, file checks and review process.</p></div><Link className="text-link" href="/contribute">Open contribution editor <ArrowRight size={15}/></Link></section>
  <section className="account-panel import-workbench">
   <div className="account-panel-heading"><h3>Prepare an internal batch</h3><span>01 / Prepare · 02 / Validate · 03 / Save draft</span></div>
   <div className="import-workbench-grid"><div>
    <button type="button" className="import-upload" disabled={busy} onClick={() => fileInput.current?.click()}><FileUp size={26}/><strong>{draft ? 'Choose another package' : 'Choose a data package'}</strong><span>Exported JSON · ZIP with manifest.csv · manifest + original files</span><small>100 original files · 10 MiB each · 50 MiB total · 300 records</small></button>
    <input ref={fileInput} type="file" multiple hidden aria-label="Choose internal import package" disabled={busy} onChange={e => void load(Array.from(e.target.files ?? []))}/>
    <div className="import-upload-links"><button type="button" className="text-link" onClick={downloadTemplate}>Download CSV template</button><Link className="text-link" href="/docs#contribution-guide">Format & upload guide <ArrowRight size={13}/></Link></div>
    <div className="import-cli-note"><Terminal size={18}/><div><strong>Prefer the command line?</strong><code>npm run data:ingest -- --help</code><p>The backend CLI prepares the same package and calls these same APIs.</p></div></div>
   </div><div className="account-form import-metadata">
    <label>Source namespace · required<input value={source} maxLength={80} disabled={busy} placeholder="e.g. lab-xrd" onChange={e => { setSource(e.target.value); invalidate(); }} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]*"/></label>
    <label>External batch / revision key · required<input value={key} maxLength={200} disabled={busy} placeholder="Your stable run or batch identifier" onChange={e => { setKey(e.target.value); invalidate(); }}/></label>
    <label>Import reason · required<textarea value={reason} maxLength={2000} disabled={busy} placeholder="Describe this import and its source" onChange={e => { setReason(e.target.value); invalidate(); }}/></label>
    {draft && <><label>Submission title<input value={draft.title} maxLength={500} disabled={busy} onChange={e => { setDraft({ ...draft, title: e.target.value }); invalidate(); }}/></label><label className="import-profile-choice"><input type="checkbox" checked={useProfile} disabled={busy} onChange={e => { setUseProfile(e.target.checked); invalidate(); }}/>Use my Research Profile for attribution</label></>}
    <p className="account-muted">Source keys are scoped to your account. Reusing a key with changed content requires a new revision key. Saving does not publish data or start a calculation.</p>
   </div></div>
   {draft && <div className="import-package-summary"><h4>Package contents</h4><details><summary>View {draft.phases.length} phases · {draft.conditions.length} condition groups · {draft.records.length} records</summary><ContributionHierarchySummary phases={draft.phases} conditions={draft.conditions} records={draft.records} files={draft.files}/></details></div>}
   <div className="account-actions"><button className="primary-link" type="button" disabled={!canCheck || busy} onClick={() => void check()}>{busy ? 'Working…' : 'Validate & preview'}</button>{draft && <button className="text-link" disabled={busy} type="button" onClick={() => { setDraft(null); invalidate(); }}>Clear package</button>}</div>
   {preview && <section className="import-validation" aria-label="Server validation report"><header><div>{preview.action === 'conflict' ? <TriangleAlert size={20}/> : <CheckCircle2 size={20}/>}<h3>{preview.action === 'conflict' ? 'Source key conflict' : preview.action === 'replay' ? 'Previously imported package' : 'Validation complete'}</h3></div><span>{preview.report.canSubmit ? 'Ready for submission' : 'Draft context needs attention'}</span></header>
    <div className="import-counts">{(['phases', 'conditions', 'records', 'files'] as const).map(field => <div key={field}><strong>{preview.report.counts[field]}</strong><span>{field}</span></div>)}</div>
    <p>{preview.action === 'conflict' ? 'This key already identifies different content. Choose a new revision key. The existing batch will remain unchanged.' : preview.action === 'replay' ? 'This upload will return the original receipt and batch.' : 'A new batch will be created with permanent Phase and condition IDs. Scientific validation status remains unverified.'}</p>
    {preview.report.issues.length > 0 && <details open><summary>{preview.report.issues.length} items to complete before submission</summary><ul className="import-issues">{preview.report.issues.map((issue, i) => <li key={i}><strong>{issue.recordId || 'Batch'}</strong><span>{issue.message}</span></li>)}</ul></details>}
    <small className="import-package-hash">Package SHA-256: {preview.report.packageHash}</small>
    <div className="account-actions"><button type="button" className="primary-link" disabled={busy || preview.action === 'conflict'} onClick={() => void save()}>{preview.action === 'replay' ? 'Retrieve existing import' : 'Save import draft'}</button>{preview.receipt && <Link className="text-link" href={'/contribute?draft=' + encodeURIComponent(preview.receipt.batchId)}>Open existing batch <ArrowRight size={14}/></Link>}</div>
   </section>}
   {error && <p className="account-error" role="alert">{error}</p>}{message && <div className="import-success" role="status"><p>{message}</p>{resultId && <Link className="text-link" href={'/contribute?draft=' + encodeURIComponent(resultId)}>Open editor & submit <ArrowRight size={14}/></Link>}</div>}
  </section>
  <section className="account-panel"><div className="account-panel-heading"><h3>Your import history</h3><button type="button" className="text-link" disabled={loading || busy} onClick={() => { setLoading(true); void contributionApi.imports(offset).then(setList).catch(e => setError((e as Error).message)).finally(() => setLoading(false)); }}><RefreshCw size={14}/>Refresh</button></div>
   <p className="account-muted">Receipts describe the original upload. Subsequent draft edits and review decisions appear in the batch history. Original data remain labelled by their actual source.</p>
   {loading ? <p role="status">Loading imports…</p> : !list?.items.length ? <p>No internal imports yet. Saved drafts and receipts will appear here.</p> : <><div className="import-history-scroll"><table className="import-history"><thead><tr><th>Batch / source</th><th>Contents</th><th>Review / visibility</th><th>Imported</th><th>Action</th></tr></thead><tbody>{list.items.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.sourceNamespace} / {item.externalBatchId}</small></td><td>{item.counts.records} records<small>{item.counts.phases} phases · {item.counts.files} files</small></td><td>{item.archived ? 'Archived' : item.review.replaceAll('-', ' ')}<small>{item.visibility === 'private' ? 'Private' : 'Public after approval'}</small></td><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.archived ? <Link className="text-link" href="/workspace">Manage archive</Link> : <Link className="text-link" href={'/contribute?draft=' + encodeURIComponent(item.batchId)}>Open batch</Link>}</td></tr>)}</tbody></table></div><div className="admin-user-pagination"><button className="secondary-link" disabled={offset === 0 || busy} onClick={() => { setLoading(true); setOffset(Math.max(0, offset - 20)); }}>Previous</button><span>{offset + 1}–{Math.min(offset + list.items.length, list.total)} of {list.total} imports</span><button className="secondary-link" disabled={offset + 20 >= list.total || busy} onClick={() => { setLoading(true); setOffset(offset + 20); }}>Next</button></div></>}
  </section>
 </div>;
}
