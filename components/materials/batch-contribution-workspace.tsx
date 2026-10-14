"use client";
import Link from "next/link";
import { useAuth } from "@/components/accounts/auth-context";
import { contributionAttribution } from "@/lib/accounts/model";
import { serverOwner } from "@/lib/materials/contributions-api";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Beaker,
  Box,
  Check,
  Download,
  FilePlus2,
  Files,
  LockKeyhole,
  Globe2,
  Info,
  Save,
  Trash2,
  Star,
} from "lucide-react";
import { Container } from "./foundations";
import { ScrollRevealPage } from "./scroll-reveal-page";
import { ContributionRecordEditor } from "./contribution-record-editor";
import {
  applyManifest,
  batchLimits,
  batchReadiness,
  dataTypes,
  defaultRecord,
  importBatchDraft,
  inspectFile,
  makeDraftFile,
  manifestTemplate,
  newBatch,
  type BatchDraft,
  type DataType,
  type DraftRecord,
  type Origin,
} from "@/lib/materials/batch-contribution";
import {
  downloadText,
  exportLocalBatch,
  readLocalBatch,
  saveLocalBatch,
} from "@/lib/materials/local-batches";
import { unpackZip, type ArchiveEntry } from "@/lib/materials/zip-import";
import { contactEmail, contactHref } from "@/lib/materials/site-information";

export function BatchContributionWorkspace() {
  const { user, ownerKey } = useAuth();
  const onServer = serverOwner(ownerKey);
  const [draft, setDraft] = useState<BatchDraft>(newBatch);
  const [origin, setOrigin] = useState<Origin>("experimental");
  const [defaultType, setDefaultType] = useState<DataType>("raman");
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const filesInput = useRef<HTMLInputElement>(null);
  const manifestInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const recordSequence = useRef(0);
  const operationActive = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const params = useSearchParams(),
    router = useRouter();
  const draftId = params.get("draft");
  useEffect(() => {
    let current = true;
    if (!draftId) {
      setDraft(newBatch());
      setSelected("");
      setDirty(false);
      setError("");
      setMessage("");
      return;
    }
    setBusy("Opening draft…");
    operationActive.current = true;
    readLocalBatch(draftId, ownerKey)
      .then((batch) => {
        if (!current) return;
        if (!batch)
          throw new Error(
            onServer ? "This draft is unavailable for this account. Open My Contributions or create a new draft." : "This draft was not found in this browser. Import an exported JSON draft or create a new one.",
          );
        setDraft(batch);
        setSelected(batch.records[0]?.id ?? "");
        setDirty(false);
        setMessage("Saved draft opened.");
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) {
          operationActive.current = false;
          setBusy("");
        }
      });
    return () => {
      current = false;
      operationActive.current = false;
    };
  }, [draftId, ownerKey]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && draft.files.length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, draft.files.length]);
  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);
  const change = (patch: Partial<BatchDraft>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setDirty(true);
    setMessage("");
    setError("");
  };
  const inspections = useMemo(
    () =>
      Object.fromEntries(
        draft.files.map((file) => [file.id, inspectFile(file)]),
      ),
    [draft.files],
  );
  const readiness = useMemo(
    () => batchReadiness(draft, inspections),
    [draft, inspections],
  );
  const currentRecord =
    draft.records.find((record) => record.id === selected) ?? draft.records[0];
  const currentFile = draft.files.find(
    (file) => file.id === currentRecord?.fileId,
  );
  async function addFiles(input: FileList | File[]) {
    if (operationActive.current) return;
    const chosen = [...input];
    if (!chosen.length) return;
    if (chosen.length > batchLimits.files + 1) {
      setError("Choose no more than 100 data files and one manifest.");
      return;
    }
    operationActive.current = true;
    setBusy("Reading original files…");
    setError("");
    setMessage("");
    try {
      const entries: ArchiveEntry[] = [];
      for (const file of chosen) {
        if (file.name.toLowerCase().endsWith(".zip")) {
          if (file.size > 64 * 1024 * 1024)
            throw new Error("ZIP archives must be no larger than 64 MiB.");
          entries.push(
            ...(await unpackZip(new Uint8Array(await file.arrayBuffer()))),
          );
        } else {
          if (!file.size || file.size > batchLimits.fileBytes)
            throw new Error(
              "Each original file must be nonempty and no larger than 10 MiB.",
            );
          entries.push({
            path: file.webkitRelativePath || file.name,
            bytes: new Uint8Array(await file.arrayBuffer()),
          });
        }
        if (
          entries.length > batchLimits.files + 1 ||
          entries.reduce((total, entry) => total + entry.bytes.length, 0) >
            batchLimits.totalBytes + 1024 * 1024
        )
          throw new Error(
            "This import exceeds the batch file count or expanded size limits.",
          );
      }
      const metadata = entries.filter(
        (e) =>
          e.path.startsWith("__MACOSX/") ||
          e.path.split("/").pop() === ".DS_Store",
      );
      const useful = entries.filter((e) => !metadata.includes(e));
      const manifests = useful.filter((e) =>
        /^manifest\.csv$/i.test(e.path.split("/").pop()!),
      );
      if (manifests.length > 1)
        throw new Error("Use one manifest.csv per import.");
      const data = useful.filter((e) => !manifests.includes(e));
      if (!data.length || data.length + draft.files.length > batchLimits.files)
        throw new Error("Choose 1–100 data files per batch.");
      if (
        data.reduce(
          (n, e) => n + e.bytes.length,
          draft.files.reduce((n, f) => n + f.size, 0),
        ) > batchLimits.totalBytes
      )
        throw new Error("A batch can hold at most 50 MiB of original files.");
      const added = [];
      for (let i = 0; i < data.length; i++) {
        setBusy("Checking file " + (i + 1) + " of " + data.length + "…");
        added.push(await makeDraftFile(data[i].path, data[i].bytes));
      }
      const nextFiles = [...draft.files, ...added];
      if (new Set(nextFiles.map((f) => f.path)).size !== nextFiles.length)
        throw new Error(
          "File paths must be unique. Rename duplicate files or use ZIP folders.",
        );
      const usedIds = new Set(draft.records.map((r) => r.id));
      const records = added.map((file) => {
        let id: string;
        do {
          id = "record-" + ++recordSequence.current;
        } while (usedIds.has(id));
        usedIds.add(id);
        const structure = /\.cif$|\.vasp$|\.poscar$|(?:^|\/)POSCAR$/i.test(
          file.path,
        );
        const table = /\.(csv|txt|tsv|xy)$/i.test(file.path);
        const kind = structure
          ? "structure"
          : table
            ? defaultType === "structure"
              ? "property"
              : defaultType
            : "attachment";
        return {
          ...defaultRecord(file.id, recordSequence.current, origin, kind),
          id,
        };
      });
      let nextRecords = [...draft.records, ...records],
        manifestText = draft.manifestText;
      if (manifests[0]) {
        if (manifests[0].bytes.length > 1024 * 1024)
          throw new Error("The manifest must be no larger than 1 MiB.");
        manifestText = new TextDecoder("utf-8", { fatal: true }).decode(
          manifests[0].bytes,
        );
        nextRecords = applyManifest(manifestText, nextFiles);
      }
      if (nextRecords.length > batchLimits.records)
        throw new Error("A batch can hold at most 300 records.");
      change({ files: nextFiles, records: nextRecords, manifestText });
      setSelected(nextRecords[0]?.id ?? "");
      setMessage(
        added.length +
          " original files added." +
          (manifests.length
            ? " Manifest associations applied."
            : " Add context below or import a manifest.") +
          (metadata.length ? " macOS metadata files omitted." : ""),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Files could not be read.");
    } finally {
      operationActive.current = false;
      setBusy("");
      if (filesInput.current) filesInput.current.value = "";
    }
  }
  async function importManifest(file: File | undefined) {
    if (!file || operationActive.current) return;
    operationActive.current = true;
    setBusy("Applying manifest…");
    setError("");
    try {
      if (file.size > 1024 * 1024)
        throw new Error("The manifest must be no larger than 1 MiB.");
      if (!draft.files.length)
        throw new Error(
          "Add the original data files before importing their manifest.",
        );
      const manifestText = await file.text(),
        records = applyManifest(manifestText, draft.files);
      change({ records, manifestText });
      setSelected(records[0].id);
      setMessage(
        "Manifest applied. Review associations, units and conditions before saving.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Manifest could not be read.");
    } finally {
      operationActive.current = false;
      setBusy("");
      if (manifestInput.current) manifestInput.current.value = "";
    }
  }
  async function importDraft(file: File | undefined) {
    if (!file || operationActive.current) return;
    if (dirty && draft.files.length) {
      setError(
        "Save this draft first, then start a new batch to import another draft.",
      );
      return;
    }
    operationActive.current = true;
    setBusy("Verifying imported draft…");
    setError("");
    try {
      if (file.size > 75 * 1024 * 1024)
        throw new Error("The JSON draft exceeds the import limit.");
      const imported = JSON.parse(await file.text());
      const batch = await importBatchDraft(imported);
      setDraft(batch);
      setSelected(batch.records[0]?.id ?? "");
      setDirty(true);
      setMessage(
        imported.schemaVersion === 1
          ? "Imported legacy draft with decoded structure text. Reconfirm its context and permissions."
          : "Imported as a new local draft. Original file checksums verified.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft could not be imported.");
    } finally {
      operationActive.current = false;
      setBusy("");
      if (importInput.current) importInput.current.value = "";
    }
  }
  async function save(view = false) {
    if (operationActive.current) return;
    operationActive.current = true;
    setError("");
    setBusy(onServer ? "Saving to the database…" : "Saving to this browser…");
    try {
      if (!draft.files.length || !draft.records.length)
        throw new Error("Add at least one record before saving.");
      const saved = await saveLocalBatch(draft, ownerKey);
      setDraft(saved);
      setDirty(false);
      setMessage(
        onServer ? "Draft and original files saved in PostgreSQL. Submit from My Contributions when ready for review." : "Draft saved in this browser. Nothing has been uploaded or published.",
      );
      if (view) router.push("/workspace?batch=" + encodeURIComponent(saved.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft could not be saved.");
    } finally {
      operationActive.current = false;
      setBusy("");
    }
  }
  function exportDraft() {
    try {
      if (!draft.files.length) throw new Error("Add files before exporting.");
      exportLocalBatch(draft);
      setMessage(
        "JSON draft exported with original file bytes and checksums. Nothing has been submitted.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft could not be exported.");
    }
  }
  function updateRecord(patch: Partial<DraftRecord>) {
    if (currentRecord)
      change({
        records: draft.records.map((r) =>
          r.id === currentRecord.id ? { ...r, ...patch } : r,
        ),
      });
  }
  function removeRecord(id: string) {
    const remaining = draft.records
      .filter((r) => r.id !== id)
      .map((r) =>
        r.structureRecordId === id ? { ...r, structureRecordId: "" } : r,
      );
    change({
      records: remaining,
      files: draft.files.filter((f) =>
        remaining.some((r) => r.fileId === f.id),
      ),
    });
    if (selected === id) setSelected(remaining[0]?.id ?? "");
  }
  function duplicateCurve() {
    if (
      !currentRecord ||
      !["raman", "xrd", "property"].includes(currentRecord.dataType)
    )
      return;
    if (draft.records.length >= batchLimits.records) {
      setError("A batch can hold at most 300 records.");
      return;
    }
    const ids = new Set(draft.records.map((r) => r.id));
    let id: string;
    do {
      id = "record-" + ++recordSequence.current;
    } while (ids.has(id));
    change({ records: [...draft.records, { ...currentRecord, id }] });
    setSelected(id);
    setMessage(
      "New curve record created from the same original file. Choose its columns and actual conditions.",
    );
  }
  const disabled = Boolean(busy);
  return (
    <ScrollRevealPage className="batch-contribution-page">
      <Container>
        <header className="knowledge-heading batch-page-heading" data-reveal>
          <div>
            <span className="eyebrow">CONTRIBUTE SCIENTIFIC DATA</span>
            <h1>Every dataset has a story.</h1>
            <p>
              Bring structures, spectra and properties together, with their
              original conditions and provenance.
            </p>
          </div>
          <Link href="/workspace" className="text-link">
            My contributions <ArrowUpRight size={16} />
          </Link>
        </header>
        <div className="batch-mode-notice" data-reveal>
          <Info size={17} />
          <p>
            <strong>{onServer ? "Database draft workspace" : "Local draft workspace"}</strong> {onServer ? "Saving stores original files in the local PostgreSQL database. Submission is a separate step; drafts are private." : "Files stay in this browser."}
            Save account-specific drafts to return later, or export a copy.
            {onServer ? "Submit saved, complete batches from My Contributions. VASP execution awaits the workflow adapter." : "Submission, review and VASP workflow services are awaiting connection."}
          </p>
        </div>
        <section
          className="batch-setup surface-card"
          aria-labelledby="batch-setup-title"
          data-reveal
        >
          <div className="batch-section-heading">
            <span>01</span>
            <h2 id="batch-setup-title">Prepare a batch</h2>
            <span className="batch-save-state">
              {draft.files.length
                ? dirty
                  ? "Unsaved changes"
                  : onServer ? "Saved in database" : "Saved locally"
                : "New draft"}
            </span>
          </div>
          <fieldset
            disabled={disabled}
            className="batch-setup-grid batch-control-fieldset"
          >
            <div className="batch-files-column">
              <label>
                Batch title
                <input
                  value={draft.title}
                  maxLength={300}
                  onChange={(e) => change({ title: e.target.value })}
                  placeholder="Name this dataset"
                />
              </label>
              <div
                className="batch-origin-controls"
                role="group"
                aria-label="Default origin for new files"
              >
                <button
                  type="button"
                  aria-pressed={origin === "experimental"}
                  onClick={() => {
                    setOrigin("experimental");
                    setDefaultType("raman");
                  }}
                >
                  <Beaker size={17} />
                  Experimental
                </button>
                <button
                  type="button"
                  aria-pressed={origin === "theoretical"}
                  onClick={() => {
                    setOrigin("theoretical");
                    setDefaultType("structure");
                  }}
                >
                  <Box size={17} />
                  Theoretical
                </button>
              </div>
              <label>
                Default data type for new files
                <select
                  value={defaultType}
                  onChange={(e) => setDefaultType(e.target.value as DataType)}
                >
                  {Object.entries(dataTypes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="form-note">
                A batch may contain both origins and multiple data types. Each
                record keeps its own context.
              </p>
              <div
                className={"batch-dropzone" + (dropActive ? " dragging" : "")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropActive(true);
                }}
                onDragLeave={() => setDropActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropActive(false);
                  if (!disabled) void addFiles(e.dataTransfer.files);
                }}
              >
                <Files size={27} />
                <strong>Add original files</strong>
                <p>
                  Drop multiple files or a ZIP with an optional manifest.csv.
                </p>
                <span>
                  CIF / POSCAR · CSV / TXT / XY · instrument files and images
                </span>
                <button
                  className="secondary-link"
                  type="button"
                  disabled={disabled}
                  onClick={() => filesInput.current?.click()}
                >
                  <FilePlus2 size={15} />
                  Choose files or ZIP
                </button>
                <input
                  ref={filesInput}
                  type="file"
                  multiple
                  aria-label="Original data files"
                  onChange={(e) =>
                    e.target.files && void addFiles(e.target.files)
                  }
                  className="batch-file-input"
                />
                <small>
                  Up to 100 files · 10 MiB per file · 50 MiB total after
                  unpacking
                </small>
                {busy && <p>{busy}</p>}
              </div>
              <div className="batch-import-actions">
                <button
                  type="button"
                  onClick={() =>
                    downloadText("manifest.csv", manifestTemplate(), "text/csv")
                  }
                >
                  <Download size={14} />
                  CSV template
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => manifestInput.current?.click()}
                >
                  Import manifest
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => importInput.current?.click()}
                >
                  Import JSON draft
                </button>
                <input
                  ref={manifestInput}
                  type="file"
                  accept=".csv"
                  aria-label="Batch manifest CSV"
                  className="batch-file-input"
                  onChange={(e) => void importManifest(e.target.files?.[0])}
                />
                <input
                  ref={importInput}
                  type="file"
                  accept=".json"
                  aria-label="Exported contribution draft"
                  className="batch-file-input"
                  onChange={(e) => void importDraft(e.target.files?.[0])}
                />
              </div>
              <p className="form-note">
                The manifest associates files with records, samples and
                conditions. Repeated file paths can define multiple curves using
                different columns.{" "}
                <Link href="/docs#contribution-guide">
                  Read the import guide ↗
                </Link>
              </p>
            </div>
            <div className="batch-policy-column">
              <h3>Choose who can see your data</h3>
              <div
                className="batch-visibility-options"
                role="group"
                aria-label="Requested data visibility"
              >
                <button
                  type="button"
                  aria-pressed={draft.visibility === "private"}
                  onClick={() =>
                    change({
                      visibility: "private",
                      permissionConfirmed: false,
                    })
                  }
                >
                  <LockKeyhole size={19} />
                  <span>
                    <strong>Keep private</strong>
                    <small>
                      Visible to you and authorized reviewers. Excluded from
                      public search.
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={draft.visibility === "public-after-review"}
                  onClick={() =>
                    change({
                      visibility: "public-after-review",
                      permissionConfirmed: false,
                    })
                  }
                >
                  <Globe2 size={19} />
                  <span>
                    <strong>Public after approval</strong>
                    <small>
                      Approved records become searchable, with source and
                      processing status.
                    </small>
                  </span>
                </button>
              </div>
              <p className="visibility-draft-note">
                Saving a draft keeps it private. Publication requires submission,
                approval and your public visibility choice.
              </p>
              <div className="batch-public-legend">
                <Star size={15} />
                <p>
                  <strong>Contribution label</strong>Public theoretical
                  contributions awaiting platform standardization will carry a
                  red star and an explicit status. Experimental data retain
                  their measurement label.
                </p>
              </div>
              <label className="permission-checkbox">
                <input
                  type="checkbox"
                  checked={draft.computationRequested}
                  onChange={(e) =>
                    change({ computationRequested: e.target.checked })
                  }
                />
                <span>
                  Request platform-standard VASP processing for eligible
                  structures after approval.
                </span>
              </label>
              <p className="form-note">
                Private data may be processed under this authorization. Spectra
                without a usable structure do not enter a VASP calculation
                automatically.
              </p>
              <div className="batch-flow-summary">
                <span>Prepare</span>
                <ArrowRight size={13} />
                <span>Human review</span>
                <ArrowRight size={13} />
                <span>Display & processing</span>
              </div>
              <p className="form-note">
                Original contributions and platform-calculated results remain
                separate, linked records. Your VASP scripts will be connected
                through a server-side workflow adapter.
              </p>
            </div>
          </fieldset>
          <div ref={feedback} tabIndex={-1} className="batch-feedback">
            {error && (
              <div role="alert" className="submission-error">
                {error}
              </div>
            )}
            {message && (
              <div role="status" className="batch-operation success">
                <Check size={16} />
                {message}
              </div>
            )}
          </div>
        </section>
        <section
          className="batch-records-section"
          aria-labelledby="batch-records-title"
        >
          <div className="batch-section-heading" data-reveal>
            <span>02</span>
            <h2 id="batch-records-title">Review records & associations</h2>
            <span className="batch-record-summary">
              {draft.records.length} records · {draft.files.length} original
              files
            </span>
          </div>
          {draft.records.length ? (
            <div className="batch-review-grid">
              <div className="batch-record-list surface-card" data-reveal>
                <div className="batch-list-heading">
                  <strong>{readiness.ready} format-ready</strong>
                  <span>
                    {draft.records.length - readiness.ready} need context
                  </span>
                </div>
                <p className="form-note">
                  Local checks are preparation checks, not scientific approval.
                </p>
                <div className="record-list-items">
                  {draft.records.map((record) => {
                    const file = draft.files.find(
                      (f) => f.id === record.fileId,
                    )!;
                    const count = readiness.issues[record.id]?.length ?? 0;
                    return (
                      <div
                        className={
                          "batch-record-item" +
                          (currentRecord?.id === record.id ? " active" : "")
                        }
                        key={record.id}
                      >
                        <button
                          type="button"
                          onClick={() => setSelected(record.id)}
                          aria-pressed={currentRecord?.id === record.id}
                        >
                          <span className="record-item-id">
                            {record.id}
                            <span>{dataTypes[record.dataType]}</span>
                          </span>
                          <strong>{file.path}</strong>
                          <span>
                            {record.sampleId || "Sample not set"} ·{" "}
                            {record.pressureGPa.trim()
                              ? record.pressureGPa + " GPa"
                              : "Pressure not set"}
                          </span>
                          <small
                            className={
                              count ? "needs-context" : "context-ready"
                            }
                          >
                            {count ? count + " context checks" : "Format ready"}{" "}
                            · {record.origin}
                          </small>
                        </button>
                        <button
                          type="button"
                          className="record-remove"
                          disabled={disabled}
                          aria-label={"Remove " + record.id}
                          onClick={() => removeRecord(record.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {currentRecord &&
                  ["raman", "xrd", "property"].includes(
                    currentRecord.dataType,
                  ) && (
                    <button
                      className="batch-add-curve"
                      disabled={disabled}
                      type="button"
                      onClick={duplicateCurve}
                    >
                      <FilePlus2 size={14} />
                      Add another curve from this file
                    </button>
                  )}
              </div>
              {currentRecord && currentFile && (
                <fieldset
                  disabled={disabled}
                  data-reveal
                  className="record-editor-fieldset"
                >
                  <ContributionRecordEditor
                    record={currentRecord}
                    file={currentFile}
                    records={draft.records}
                    inspection={inspections[currentFile.id]}
                    issues={readiness.issues[currentRecord.id] ?? []}
                    update={updateRecord}
                  />
                </fieldset>
              )}
            </div>
          ) : (
            <div className="batch-empty-records surface-card" data-reveal>
              <Files size={28} />
              <h3>Your batch starts with original data.</h3>
              <p>
                Add files to inspect structures or preview numerical curves. No
                example datasets are inserted.
              </p>
            </div>
          )}
        </section>
        <section
          className="batch-contributor surface-card"
          aria-labelledby="batch-contributor-title"
          data-unsaved={dirty ? "true" : "false"}
          data-reveal
        >
          <div className="batch-section-heading">
            <span>03</span>
            <h2 id="batch-contributor-title">Attribution & draft</h2>
          </div>
          {user && (
            <div className="use-profile-attribution">
              <div>
                <strong>Use my research profile</strong>
                <p>
                  Copy your saved name, contact and affiliation into this batch.
                  Later profile edits will not change this attribution.
                </p>
              </div>
              <button
                type="button"
                className="secondary-link"
                disabled={disabled}
                onClick={() => {
                  change({
                    contributor: contributionAttribution({ ...user.profile, contactEmail: user.profile.contactEmail || user.email || "" }),
                    permissionConfirmed: false,
                  });
                  setMessage(
                    "Saved profile copied into this draft. Review attribution and confirm permission again.",
                  );
                }}
              >
                Apply my profile
              </button>
              <Link href="/account" className="text-link">
                Edit profile
              </Link>
            </div>
          )}
          <fieldset
            disabled={disabled}
            className="record-field-grid batch-control-fieldset"
          >
            <label>
              Contributor name
              <input
                value={draft.contributor.name}
                autoComplete="name"
                maxLength={300}
                onChange={(e) =>
                  change({
                    contributor: { ...draft.contributor, name: e.target.value },
                    permissionConfirmed: false,
                  })
                }
              />
            </label>
            <label>
              Contact email
              <input
                value={draft.contributor.email}
                type="email"
                autoComplete="email"
                maxLength={300}
                onChange={(e) =>
                  change({
                    contributor: {
                      ...draft.contributor,
                      email: e.target.value,
                    },
                    permissionConfirmed: false,
                  })
                }
              />
            </label>
            {(
              [
                "institution",
                "department",
                "researchGroup",
                "careerStage",
                "orcid",
              ] as const
            ).map((field) => (
              <label key={field}>
                {
                  {
                    institution: "Institution",
                    department: "Department",
                    researchGroup: "Research group",
                    careerStage: "Career stage",
                    orcid: "ORCID iD",
                  }[field]
                }{" "}
                <span className="account-optional">Optional</span>
                <input
                  value={draft.contributor[field]}
                  maxLength={300}
                  onChange={(e) =>
                    change({
                      contributor: {
                        ...draft.contributor,
                        [field]: e.target.value,
                      },
                      permissionConfirmed: false,
                    })
                  }
                />
              </label>
            ))}
          </fieldset>
          <label className="permission-checkbox">
            <input
              type="checkbox"
              disabled={disabled}
              checked={draft.permissionConfirmed}
              onChange={(e) =>
                change({ permissionConfirmed: e.target.checked })
              }
            />
            <span>
              I am authorized to provide these files for review under the chosen
              visibility and processing permissions.
            </span>
          </label>
          {readiness.batchIssues.length > 0 && draft.records.length > 0 && (
            <p className="form-note">{readiness.batchIssues.join(" ")}</p>
          )}
          <p className="form-note">
            {onServer ? "Incomplete metadata may be saved privately in the database. Export a copy for safekeeping; submit only when the batch is ready for review." : "Incomplete metadata may be saved as a draft. Saved files and contact details remain on this device; browser data clearing can remove them. Export a copy for safekeeping."}
          </p>
          {busy && (
            <p role="status" className="batch-operation">
              {busy}
            </p>
          )}
          {message && (
            <div className="batch-operation success">
              <Check size={16} />
              {message}
            </div>
          )}
          <div className="batch-draft-actions">
            <button
              className="primary-link"
              type="button"
              disabled={disabled || !draft.records.length}
              onClick={() => void save(true)}
            >
              <Save size={16} />
              Save & view batch
            </button>
            <button
              className="secondary-link"
              type="button"
              disabled={disabled || !draft.records.length}
              onClick={() => void save()}
            >
              Save draft
            </button>
            <button
              className="text-link"
              type="button"
              disabled={disabled || !draft.records.length}
              onClick={exportDraft}
            >
              <Download size={15} />
              Export JSON draft
            </button>
          </div>
          <div className="batch-service-footer">
            <span>{onServer ? "Submit for review from My Contributions" : "Submission service awaiting connection"}</span>
            <a href={contactHref("Data contribution")}>
              {contactEmail} <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </Container>
    </ScrollRevealPage>
  );
}
