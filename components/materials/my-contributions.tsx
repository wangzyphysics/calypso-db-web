"use client";
import Link from "next/link";
import { useAuth } from "@/components/accounts/auth-context";
import { contributionApi, serverOwner, type BatchState } from "@/lib/materials/contributions-api";
import {
  AccountNavigation,
  TestModeNotice,
} from "@/components/accounts/account-navigation";
import { useSearchParams } from "next/navigation";
import { ContributionHierarchySummary } from "./contribution-hierarchy-summary";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Download,
  Files,
  LockKeyhole,
  Globe2,
  Plus,
  Trash2,
  Clock3,
  Info,
  Box,
  RefreshCw,
} from "lucide-react";
import { Container } from "./foundations";
import { ScrollRevealPage } from "./scroll-reveal-page";
import {
  batchReadiness,
  dataTypes,
  inspectFile,
  type BatchDraft,
} from "@/lib/materials/batch-contribution";
import {
  deleteLocalBatch,
  exportLocalBatch,
  listLocalBatches,
  listUnassignedBatches,
  copyUnassignedBatch,
} from "@/lib/materials/local-batches";

export function MyContributions() {
  const { ownerKey } = useAuth();
  const onServer = serverOwner(ownerKey);
  const [states, setStates] = useState<Record<string, BatchState>>({});
  const [archived, setArchived] = useState<BatchDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<Array<{ sequence: string; type: string; occurredAt: string }>>([]);
  const [unassigned, setUnassigned] = useState<BatchDraft[]>([]);
  const params = useSearchParams();
  const [batches, setBatches] = useState<BatchDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [tab, setTab] = useState<"records" | "status">("records");
  async function loadData() {
    if (onServer) {
      const [active, removed] = await Promise.all([contributionApi.list(), contributionApi.list(true)]);
      return { batches: active.items.map(i => i.draft), states: Object.fromEntries(active.items.map(i => [i.state.id, i.state])), archived: removed.items.map(i => i.draft) };
    }
    return { batches: await listLocalBatches(ownerKey), states: {}, archived: [] };
  }
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await loadData(); setBatches(data.batches); setStates(data.states); setArchived(data.archived);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    loadData()
      .then((data) => {
        if (active) { setBatches(data.batches); setStates(data.states); setArchived(data.archived); }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    void listUnassignedBatches()
      .then((values) => {
        if (active) setUnassigned(values);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [ownerKey]);
  const requestedId = params.get("batch");
  const selected = requestedId
    ? batches.find((b) => b.id === requestedId)
    : batches[0];
  const state = selected ? states[selected.id] : undefined;
  useEffect(() => {
    if (!onServer || !selected) return;
    const id = selected.id; let active = true;
    const poll = async () => {
      if (document.visibilityState === "hidden") return;
      try { const data = await contributionApi.events(id); if (active) { setStates(values => ({ ...values, [id]: data.state })); setEvents(data.events); } }
      catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not refresh batch status."); }
    };
    setEvents([]); void poll(); const timer = setInterval(() => void poll(), 15000);
    return () => { active = false; clearInterval(timer); };
  }, [onServer, selected?.id]);
  const readiness = useMemo(
    () =>
      selected
        ? batchReadiness(
            selected,
            Object.fromEntries(
              selected.files.map((file) => [file.id, inspectFile(file)]),
            ),
          )
        : null,
    [selected],
  );
  async function remove(id: string) {
    setDeleting(id);
    setError("");
    try {
      await deleteLocalBatch(id, ownerKey);
      setBatches((values) => values.filter((b) => b.id !== id));
      if (onServer) await refresh();
      setConfirmDelete("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting("");
    }
  }
  async function submit() {
    if (!selected || submitting) return;
    setSubmitting(true); setError("");
    try { await contributionApi.submit(selected.id); await refresh(); setTab("status"); }
    catch (e) { setError(e instanceof Error ? e.message : "Submission failed."); }
    finally { setSubmitting(false); }
  }
  const time = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  return (
    <ScrollRevealPage className="my-contributions-page">
      <Container>
        <header className="knowledge-heading batch-page-heading" data-reveal>
          <div>
            <span className="eyebrow">MY CONTRIBUTIONS</span>
            <h1>Your data. Every step.</h1>
            <p>
              A batch-level view of original records, review decisions and
              scientific workflows.
            </p>
          </div>
          <Link className="primary-link" href="/contribute">
            <Plus size={16} />
            New batch
          </Link>
        </header>
        <AccountNavigation active="contributions" />
        <TestModeNotice />
        {archived.length > 0 && <details className="unassigned-drafts"><summary>{archived.length} archived database batches</summary>
          <p>Archived originals remain in the database and are excluded from public search. Restore a batch to return it to this workspace.</p>
          {archived.map(batch => <div key={batch.id}><span>{batch.title}</span><button className="secondary-link" onClick={async () => { try { await contributionApi.restore(batch.id); await refresh(); } catch (e) { setError((e as Error).message); } }}>Restore batch</button></div>)}
        </details>}
        {unassigned.length > 0 && (
          <details className="unassigned-drafts">
            <summary>
              {unassigned.length} unassigned drafts from before accounts were
              introduced
            </summary>
            <p>
              These browser drafts have no recorded owner. Copy a draft only if
              it belongs to you. The original is preserved, and its permissions
              must be confirmed again.
            </p>
            {unassigned.map((batch) => (
              <div key={batch.id}>
                <span>
                  {batch.title} · {batch.records.length} records
                </span>
                <button
                  type="button"
                  className="secondary-link"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await copyUnassignedBatch(batch.id, ownerKey);
                      await refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Copy to this account
                </button>
              </div>
            ))}
          </details>
        )}
        <div className="batch-mode-notice" data-reveal>
          <Info size={17} />
          <p>
            <strong>{onServer ? "This account’s database batches" : "This account’s local drafts"}</strong> {onServer ? "Original files and metadata are saved in PostgreSQL. Submit a prepared draft for review; status below refreshes from the server. VASP execution is not connected." : "The batches below are saved on this device under your current account. Actual submission, review, publication and live VASP progress will appear when their services are connected."}
          </p>
        </div>
        <div className="workspace-summary" data-reveal>
          <div>
            <span>Saved batches</span>
            <strong>{loading ? "—" : batches.length}</strong>
          </div>
          <div>
            <span>Scientific records</span>
            <strong>
              {loading
                ? "—"
                : batches.reduce((n, b) => n + b.records.length, 0)}
            </strong>
          </div>
          <div>
            <span>Submitted to platform</span>
            <strong>{onServer ? Object.values(states).filter(s => s.review !== "not-submitted").length : "—"}</strong>
            <small>{onServer ? "Recorded submissions" : "Submission service pending"}</small>
          </div>
          <div>
            <span>VASP workflow progress</span>
            <strong>—</strong>
            <small>VASP workflow adapter pending</small>
          </div>
        </div>
        {error && (
          <div role="alert" className="submission-error">
            {error}
            <button
              type="button"
              className="text-link"
              onClick={() => void refresh()}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <div className="workspace-loading" role="status">
            {onServer ? "Loading database batches…" : "Loading local drafts…"}
          </div>
        ) : batches.length ? (
          <div className="workspace-batch-layout">
            <nav
              className="workspace-batch-list"
              aria-label="Saved contribution batches"
              data-reveal
            >
              <div className="batch-list-heading">
                <h2>Upload batches</h2>
                <span>{batches.length}</span>
              </div>
              {batches.map((batch) => (
                <Link
                  key={batch.id}
                  href={"/workspace?batch=" + encodeURIComponent(batch.id)}
                  scroll={false}
                  className={
                    "workspace-batch-item" +
                    (selected?.id === batch.id ? " active" : "")
                  }
                  aria-current={selected?.id === batch.id ? "true" : undefined}
                >
                  <span>
                    <Files size={16} />
                    {onServer ? states[batch.id]?.review === "not-submitted" ? "Database draft" : states[batch.id]?.review.replaceAll("-", " ") : "Local draft"}
                  </span>
                  <strong>{batch.title}</strong>
                  <small>
                    {batch.records.length} records · {batch.files.length} files
                  </small>
                  <small>{time(batch.updatedAt)}</small>
                  <span className="batch-visibility-label">
                    {batch.visibility === "private" ? (
                      <LockKeyhole size={12} />
                    ) : (
                      <Globe2 size={12} />
                    )}
                    {batch.visibility === "private"
                      ? "Private intent"
                      : "Public after approval"}
                  </span>
                </Link>
              ))}
            </nav>
            {selected && (
              <section
                className="workspace-batch-detail surface-card"
                aria-label="Selected batch details"
                data-reveal
              >
                <header className="workspace-detail-heading">
                  <div>
                    <span className="eyebrow">{onServer ? "DATABASE BATCH · " + (state?.review ?? "loading").replaceAll("-", " ").toUpperCase() : "LOCAL DRAFT · NOT SUBMITTED"}</span>
                    <h2>{selected.title}</h2>
                    <p>
                      Updated {time(selected.updatedAt)} ·{" "}
                      {selected.contributor.name || "Contributor not set"}
                    </p>
                  </div>
                  {(!onServer || !state || ["not-submitted", "needs-information"].includes(state.review)) && <Link
                    href={
                      "/contribute?draft=" + encodeURIComponent(selected.id)
                    }
                    className="secondary-link"
                  >
                    Edit draft <ArrowUpRight size={14} />
                  </Link>}
                </header>
                <div className="workspace-status-strip">
                  <div>
                    <span>Review</span>
                    <strong>{state ? state.review.replaceAll("-", " ") : "Not submitted"}</strong>
                  </div>
                  <div>
                    <span>Public visibility</span>
                    <strong>{state?.records[0]?.publication === "public" ? "Public contribution" : "Private"}</strong>
                  </div>
                  <div>
                    <span>Computation</span>
                    <strong>{state?.records.some(r => r.computation === "pending-eligibility") ? "Awaiting workflow adapter" : "Not started"}</strong>
                  </div>
                  <div>
                    <span>Standardized ingestion</span>
                    <strong>Not ingested</strong>
                  </div>
                </div>
                {state?.reviewNotes && <p className="form-note"><strong>Review notes: </strong>{state.reviewNotes}</p>}
                <div
                  className="workspace-tabs"
                  role="group"
                  aria-label="Batch detail view"
                >
                  <button
                    type="button"
                    aria-pressed={tab === "records"}
                    onClick={() => setTab("records")}
                  >
                    Records & files
                  </button>
                  <button
                    type="button"
                    aria-pressed={tab === "status"}
                    onClick={() => setTab("status")}
                  >
                    Review & workflow
                  </button>
                </div>
                {tab === "records" ? (
                  <>
                    <div className="workspace-readiness">
                      <span>
                        {readiness?.ready} / {selected.records.length} records
                        pass local preparation checks
                      </span>
                      <p>
                        These checks do not establish scientific validity or
                        phase stability.
                      </p>
                    </div>
                    <ContributionHierarchySummary phases={selected.phases} conditions={selected.conditions} records={selected.records} files={selected.files}/>
                    <details className="individual-record-details"><summary>Individual record conditions & preparation checks</summary>
                    <div className="workspace-records">
                      {selected.records.map((record) => (
                        <article key={record.id}>
                          <div>
                            <span>
                              {record.id} · {record.origin}
                            </span>
                            <h3>{record.formula || "Formula not set"}</h3>
                            <p>
                              {dataTypes[record.dataType]} ·{" "}
                              {record.acquisitionLabel || record.id}
                            </p>
                          </div>
                          <div>
                            <strong>
                              {record.pressureGPa.trim()
                                ? record.pressureGPa + " GPa" + (record.pressureMode==="target"?" target":"")
                                : "Pressure unreported"}
                            </strong>
                            <small>
                              {record.temperatureK.trim()
                                ? record.temperatureK + " K"
                                : record.temperatureMode==="not-modelled"?"T not modelled":"Temperature unreported"}
                            </small>
                          </div>
                          <div>
                            <strong>
                              {readiness?.issues[record.id].length
                                ? "Needs context"
                                : "Format ready"}
                            </strong>
                            <small>{state ? "Review: " + state.review.replaceAll("-", " ") : "Review not started"}</small>
                          </div>
                        </article>
                      ))}
                    </div>
                    </details>
                    {readiness?.batchIssues.length ? (
                      <p className="form-note">
                        Before submission: {readiness.batchIssues.join(" ")}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="workspace-workflow">
                    <div className="workflow-connection-note">
                      <Clock3 size={21} />
                      <div>
                        <h3>{onServer ? "Server-reported review & workflow" : "Awaiting submission and workflow services"}</h3>
                        <p>
                          No computation has been started. A percentage is
                          unavailable until a server reports the actual run and
                          its planned steps.
                        </p>
                      </div>
                    </div>
                    {state && <div className="server-record-statuses">{state.records.map(record => <article key={record.id}><strong>{record.id}</strong><dl>
                      <div><dt>Review</dt><dd>{record.review.replaceAll("-", " ")}</dd></div><div><dt>Publication</dt><dd>{record.publication}</dd></div>
                      <div><dt>Calculation</dt><dd>{record.computation.replaceAll("-", " ")}</dd></div><div><dt>Current step</dt><dd>{record.currentStep ?? "Not started"}</dd></div>
                      <div><dt>Progress</dt><dd>{record.percent === null ? "Unavailable" : record.percent + "%"}</dd></div><div><dt>Ingestion</dt><dd>{record.ingestion.replaceAll("-", " ")}</dd></div>
                    </dl></article>)}</div>}
                    {events.length > 0 && <div className="batch-event-list"><h3>Batch history</h3><ol>{events.map(event => <li key={event.sequence}><span>{event.type.replaceAll(".", " ")}</span><time>{time(event.occurredAt)}</time></li>)}</ol></div>}
                    <div className="workspace-policy-summary">
                      <p>
                        <strong>Visibility intent</strong>
                        {selected.visibility === "private"
                          ? "Keep private. Public search must exclude these records."
                          : "Publish approved contributions with source and processing labels."}
                      </p>
                      <p>
                        <strong>VASP authorization</strong>
                        {selected.computationRequested
                          ? "Requested for eligible, approved structures. Processing does not change visibility."
                          : "Not requested. This draft does not authorize platform calculations."}
                      </p>
                    </div>
                    <div className="workflow-outline">
                      <Box size={18} />
                      <div>
                        <strong>VASP workflow adapter</strong>
                        <p>
                          Existing scripts will report protocol/version, the
                          active stage, job state, retries and timestamps. Stage
                          definitions will follow the supplied workflow.
                        </p>
                      </div>
                    </div>
                    <ol className="workflow-stage-outline">
                      <li>
                        <span>01</span>
                        <div>
                          <strong>Review & eligibility</strong>
                          <p>
                            Format, provenance, permissions and calculation
                            applicability.
                          </p>
                        </div>
                        <small>Not started</small>
                      </li>
                      <li>
                        <span>02</span>
                        <div>
                          <strong>Queue & execution</strong>
                          <p>
                            Script-reported stages and attempts; no inferred SCF
                            percentage.
                          </p>
                        </div>
                        <small>Not started</small>
                      </li>
                      <li>
                        <span>03</span>
                        <div>
                          <strong>Quality review & ingestion</strong>
                          <p>
                            New platform results linked to the original
                            contribution.
                          </p>
                        </div>
                        <small>Not started</small>
                      </li>
                    </ol>
                    <p className="form-note">
                      Stages above describe the planned integration. They are
                      not a running task. Experimental spectra without a usable
                      structure can be reviewed and displayed without a VASP
                      run.
                    </p>
                    <Link href="/docs#contribution-guide" className="text-link">
                      Review, visibility & workflow guide{" "}
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                )}
                <footer className="workspace-detail-actions">
                  {onServer && state && ["not-submitted", "needs-information"].includes(state.review) && <button className="primary-link" disabled={submitting || !readiness || readiness.batchIssues.length > 0 || readiness.ready !== selected.records.length} onClick={() => void submit()}>{submitting ? "Submitting…" : "Submit for review"}</button>}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => exportLocalBatch(selected)}
                  >
                    <Download size={14} />
                    Export JSON draft
                  </button>
                  <button
                    type="button"
                    className="text-link destructive-link"
                    onClick={() => setConfirmDelete(selected.id)}
                  >
                    <Trash2 size={14} />
                    {onServer ? "Archive batch" : "Delete local draft"}
                  </button>
                </footer>
                {confirmDelete === selected.id && (
                  <div className="local-delete-confirm" role="alert">
                    <p>
                      {onServer ? "Archive this database batch? Original files are preserved; you can restore it from Archived batches." : "Delete this batch from this browser? Export a copy first if you need to keep its original files."}
                    </p>
                    <button
                      type="button"
                      className="secondary-link"
                      onClick={() => setConfirmDelete("")}
                    >
                      Keep draft
                    </button>
                    <button
                      type="button"
                      className="secondary-link destructive-link"
                      disabled={Boolean(deleting)}
                      onClick={() => void remove(selected.id)}
                    >
                      {deleting ? onServer ? "Archiving…" : "Deleting…" : onServer ? "Archive in database" : "Delete from this browser"}
                    </button>
                  </div>
                )}
              </section>
            )}
            {!selected && (
              <div className="workspace-empty surface-card">
                <h2>Draft not found.</h2>
                <p>
                  {onServer ? "This batch is unavailable for this account. Open a saved batch from the list or restore it from Archived batches." : "This batch is unavailable in this browser. Open a saved batch from the list or import an exported draft."}
                </p>
                <Link href="/workspace" className="primary-link">
                  Show saved drafts
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="workspace-empty surface-card" data-reveal>
            <Files size={32} />
            <span className="eyebrow">A PLACE FOR YOUR DATA</span>
            <h2>Your first batch starts here.</h2>
            <p>
              Prepare experimental spectra, physical properties or theoretical
              structures. Save a draft to manage its records together.
            </p>
            <Link className="primary-link" href="/contribute">
              Prepare a batch <ArrowUpRight size={15} />
            </Link>
          </div>
        )}
      </Container>
    </ScrollRevealPage>
  );
}
