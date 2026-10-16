"use client";
import { ContributionHierarchySummary } from "@/components/materials/contribution-hierarchy-summary";
import { useEffect, useState } from "react";
import { contributionApi } from "@/lib/materials/contributions-api";
type Queue = Awaited<ReturnType<typeof contributionApi.reviewQueue>>["items"];

export function ContributionReview() {
  const [items, setItems] = useState<Queue>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(""), [notes, setNotes] = useState("");
  async function refresh() { setLoading(true); try { setItems((await contributionApi.reviewQueue()).items); setError(""); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } }
  useEffect(() => { void refresh(); }, []);
  async function decide(item: Queue[number], status: "approved" | "rejected" | "needs-information") {
    if (busy) return; setBusy(true); setError("");
    try { await contributionApi.review(item.state, status, notes); setSelected(""); setNotes(""); await refresh(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="account-panel contribution-review-panel">
    <div className="account-panel-heading"><h2>Contribution review</h2><button className="text-link" disabled={busy} onClick={() => void refresh()}>Refresh queue</button></div>
    <p className="account-muted">Only submitted batches enter this queue. Approval makes contributions with public intent searchable with a red star and an unstandardized label. Private submissions remain private. Approval does not establish phase stability or start a VASP calculation.</p>
    {error && <p role="alert" className="account-error">{error}</p>}
    {loading ? <p role="status">Loading submitted batches…</p> : items.length === 0 ? <p>No submitted batches.</p> : items.map(item => <article key={item.state.id} className="review-batch-card">
      <header><div><h3>{item.title}</h3><p>{item.contributor.name} · {item.visibility} · {item.state.review.replaceAll("-", " ")}</p></div>
        {["pending", "needs-information"].includes(item.state.review) && <button className="secondary-link" disabled={busy} onClick={() => { setSelected(item.state.id); setNotes(item.state.reviewNotes); }}>Review batch</button>}
      </header>
      <ContributionHierarchySummary phases={item.phases} conditions={item.conditions} records={item.records} files={item.files}/>
      <details className="individual-record-details" open={!item.phases.length}><summary>Record methods & provenance</summary><ul>{item.records.map(record => <li key={record.id}>{record.formula || "Formula not supplied"} · {record.dataType} · {record.origin} · {record.pressureGPa ? record.pressureGPa+" GPa"+(record.pressureMode==="target"?" target":"") : "P unreported"} · {record.method} · Source: {record.source}</li>)}</ul></details>
      <div className="review-file-links">{item.files.map(file => <a key={file.id} className="text-link" href={contributionApi.fileHref(item.state.id, file.id)}>Download {file.path}</a>)}</div>
      {item.state.reviewNotes && <p className="form-note">Decision notes: {item.state.reviewNotes}</p>}
      {selected === item.state.id && <div className="account-form review-decision-form"><label>Review notes<textarea value={notes} maxLength={4000} disabled={busy} onChange={e => setNotes(e.target.value)} /></label>
        <p className="account-muted">Check original files, methods, provenance and publication permission before approval. The resulting entry retains its contributor origin and awaits standardized calculation/quality review.</p>
        <div className="account-actions"><button className="primary-link" disabled={busy || notes.trim().length < 3} onClick={() => void decide(item, "approved")}>Approve contribution</button><button className="secondary-link" disabled={busy || notes.trim().length < 3} onClick={() => void decide(item, "needs-information")}>Request information</button><button className="secondary-link" disabled={busy || notes.trim().length < 3} onClick={() => void decide(item, "rejected")}>Reject</button><button className="text-link" disabled={busy} onClick={() => setSelected("")}>Cancel</button></div>
      </div>}
    </article>)}
  </section>;
}
