"use client";
import Link from "next/link";
import { useAuth } from "@/components/accounts/auth-context";
import {
  AccountNavigation,
  TestModeNotice,
} from "@/components/accounts/account-navigation";
import { useSearchParams } from "next/navigation";
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
  const [unassigned, setUnassigned] = useState<BatchDraft[]>([]);
  const params = useSearchParams();
  const [batches, setBatches] = useState<BatchDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [tab, setTab] = useState<"records" | "status">("records");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setBatches(await listLocalBatches(ownerKey));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    listLocalBatches(ownerKey)
      .then((values) => {
        if (active) setBatches(values);
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
      setConfirmDelete("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting("");
    }
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
            <strong>This account’s local drafts</strong> The batches below are
            saved on this device under your current account. Actual submission,
            review, publication and live VASP progress will appear when their
            services are connected.
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
            <strong>—</strong>
            <small>Submission service pending</small>
          </div>
          <div>
            <span>VASP workflow progress</span>
            <strong>—</strong>
            <small>Workflow service pending</small>
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
            Loading local drafts…
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
                    Local draft
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
                    <span className="eyebrow">LOCAL DRAFT · NOT SUBMITTED</span>
                    <h2>{selected.title}</h2>
                    <p>
                      Updated {time(selected.updatedAt)} ·{" "}
                      {selected.contributor.name || "Contributor not set"}
                    </p>
                  </div>
                  <Link
                    href={
                      "/contribute?draft=" + encodeURIComponent(selected.id)
                    }
                    className="secondary-link"
                  >
                    Edit draft <ArrowUpRight size={14} />
                  </Link>
                </header>
                <div className="workspace-status-strip">
                  <div>
                    <span>Review</span>
                    <strong>Not submitted</strong>
                  </div>
                  <div>
                    <span>Public visibility</span>
                    <strong>Not published</strong>
                  </div>
                  <div>
                    <span>Computation</span>
                    <strong>Not started</strong>
                  </div>
                  <div>
                    <span>Standardized ingestion</span>
                    <strong>Not ingested</strong>
                  </div>
                </div>
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
                              {record.sampleId || "Sample not set"}
                            </p>
                          </div>
                          <div>
                            <strong>
                              {record.pressureGPa.trim()
                                ? record.pressureGPa + " GPa"
                                : "Pressure not set"}
                            </strong>
                            <small>
                              {record.temperatureK.trim()
                                ? record.temperatureK + " K"
                                : "Temperature not set"}
                            </small>
                          </div>
                          <div>
                            <strong>
                              {readiness?.issues[record.id].length
                                ? "Needs context"
                                : "Format ready"}
                            </strong>
                            <small>Review not started</small>
                          </div>
                        </article>
                      ))}
                    </div>
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
                        <h3>Awaiting submission and workflow services</h3>
                        <p>
                          No computation has been started. A percentage is
                          unavailable until a server reports the actual run and
                          its planned steps.
                        </p>
                      </div>
                    </div>
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
                    Delete local draft
                  </button>
                </footer>
                {confirmDelete === selected.id && (
                  <div className="local-delete-confirm" role="alert">
                    <p>
                      Delete this batch from this browser? Export a copy first
                      if you need to keep its original files.
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
                      {deleting ? "Deleting…" : "Delete from this browser"}
                    </button>
                  </div>
                )}
              </section>
            )}
            {!selected && (
              <div className="workspace-empty surface-card">
                <h2>Draft not found.</h2>
                <p>
                  This batch is unavailable in this browser. Open a saved batch
                  from the list or import an exported draft.
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
