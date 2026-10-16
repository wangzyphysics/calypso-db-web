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
import { ContributionExamples } from "./contribution-examples";
import { contributionExample, prepareContributionExample, exampleDataPath, type ContributionExampleId } from "@/lib/materials/contribution-examples";
import { PhaseContributionEditor } from "./phase-contribution-editor";
import { ContributionRecordEditor } from "./contribution-record-editor";
import {
  applyGroupedManifest, batchSchema, phaseName, conditionName,
  batchLimits,
  batchReadiness,
  dataTypes,
  importBatchDraft,
  inspectFile,
  makeDraftFile,
  manifestTemplate,
  newBatch,
  type BatchDraft,
  type DraftRecord,
} from "@/lib/materials/batch-contribution";
import {
  downloadText,
  exportLocalBatch,
  readLocalBatch,
  saveLocalBatch,
} from "@/lib/materials/local-batches";
import { unpackZip, type ArchiveEntry } from "@/lib/materials/zip-import";
import { attachOriginalFiles, removeDraftItems, savedContributionHref } from "@/lib/materials/contribution-editing";
import { contactEmail, contactHref } from "@/lib/materials/site-information";

export function BatchContributionWorkspace() {
  const { user, ownerKey } = useAuth();
  const onServer = serverOwner(ownerKey);
  const [draft, setDraft] = useState<BatchDraft>(newBatch);
  const [activeConditionId, setActiveConditionId] = useState("");
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string|null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [undoRemoval, setUndoRemoval] = useState<{draft:BatchDraft;conditionId:string;recordId:string;dirty:boolean}|null>(null);
  const loadedDraft = useRef<{id:string;ownerKey:string}|null>(null);
  const [previewKey, setPreviewKey] = useState<ContributionExampleId | null>(null);
  const [hasOriginalDraft, setHasOriginalDraft] = useState(false);
  const previewOriginal = useRef<{ draft: BatchDraft; activeConditionId: string; selected: string; dirty: boolean } | null>(null);
  const exampleRequest = useRef(0);
  const filesInput = useRef<HTMLInputElement>(null);
  const manifestInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const recordSequence = useRef(0);
  const operationActive = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const params = useSearchParams(),
    router = useRouter();
  const draftId = params.get("draft");
  const requestedCondition = params.get("condition"), requestedRecord = params.get("record");
  useEffect(() => {
    let current = true;
    queueMicrotask(() => {
      if (!current) return;
      if (draftId && loadedDraft.current?.id===draftId && loadedDraft.current.ownerKey===ownerKey) return;
      loadedDraft.current=null; setUndoRemoval(null); setShowAllRecords(false); setSavedAt(null);
      exampleRequest.current++; previewOriginal.current = null; setPreviewKey(null); setHasOriginalDraft(false);
      if (!draftId) {
        setDraft(newBatch()); setActiveConditionId(""); setSelected("");
        setDirty(false); setError(""); setMessage(""); setBusy(""); operationActive.current=false;
        return;
      }
      setDraft(newBatch()); setDirty(false); setError(""); setMessage("");
      setBusy("Opening draft…"); operationActive.current = true;
      readLocalBatch(draftId, ownerKey).then(batch => {
        if (!current) return;
        if (!batch) throw new Error(onServer ? "This draft is unavailable for this account. Open My Contributions or create a new draft." : "This draft was not found in this browser. Import an exported JSON draft or create a new one.");
        const conditionId = batch.conditions.find(c=>c.id===requestedCondition)?.id ?? batch.conditions[0]?.id ?? "";
        const recordId = batch.records.find(r=>r.id===requestedRecord&&r.conditionId===conditionId)?.id ?? batch.records.find(r=>r.conditionId===conditionId)?.id ?? "";
        loadedDraft.current={id:batch.id,ownerKey};
        setDraft(batch); setSavedAt(batch.updatedAt); setSelected(recordId); setActiveConditionId(conditionId);
        setDirty(false); setMessage("Saved draft opened. Your original files and conditions have been restored.");
      }).catch(e => { if(current) setError(e.message); }).finally(() => {
        if(current) { operationActive.current=false; setBusy(""); }
      });
    });
    return () => { current=false; operationActive.current=false; };
  }, [draftId, ownerKey, onServer, requestedCondition, requestedRecord]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if ((!draft.exampleOnly && dirty && draft.files.length) || (draft.exampleOnly && previewOriginal.current?.dirty && previewOriginal.current.draft.files.length)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, draft.files.length, draft.exampleOnly]);
  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);
  useEffect(() => {
    if (!draft.exampleOnly) return;
    const frame = requestAnimationFrame(() => document.getElementById("example-preview-notice")?.scrollIntoView({block:"start",behavior:"instant"}));
    return () => cancelAnimationFrame(frame);
  }, [draft.exampleOnly, draft.id]);
  const change = (patch: Partial<BatchDraft>) => {
    const checked = batchSchema.safeParse({...draft,...patch});
    if (!checked.success) { setError(checked.error.issues[0]?.message ?? "This change could not be applied; your draft is unchanged."); return; }
    setDraft(checked.data); setUndoRemoval(null);
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
  const activeCondition = draft.conditions.find(c=>c.id===activeConditionId) ?? draft.conditions[0];
  const currentRecord = draft.records.find(record=>record.id===selected && record.conditionId===activeCondition?.id)
    ?? draft.records.find(record=>record.conditionId===activeCondition?.id);
  function selectCondition(id: string) { setActiveConditionId(id); setSelected(draft.records.find(r=>r.conditionId===id)?.id??""); setShowAllRecords(false); }
  const currentFile = draft.files.find(
    (file) => file.id === currentRecord?.fileId,
  );
  async function loadExample(id: ContributionExampleId) {
    if (operationActive.current) return;
    const requestId = ++exampleRequest.current;
    operationActive.current = true; setBusy("Loading a teaching example…"); setError("");
    try {
      const response = await fetch(exampleDataPath, {credentials:"omit"});
      if (!response.ok) throw new Error("Example unavailable. Your draft has not been changed.");
      const example = await prepareContributionExample(await response.json(), id);
      if (requestId !== exampleRequest.current) return;
      if (!draft.exampleOnly && !previewOriginal.current) previewOriginal.current = {draft,activeConditionId,selected,dirty};
      setHasOriginalDraft(Boolean(previewOriginal.current));
      setDraft(example); setPreviewKey(id); setDirty(false); setUndoRemoval(null); setShowAllRecords(false);
      setActiveConditionId(example.conditions[0]?.id ?? ""); setSelected(example.records[0]?.id ?? "");
      setMessage(previewOriginal.current ? "Teaching example loaded. Saving and submission are disabled; your original draft is preserved on this page." : "Teaching example loaded. Saving and submission are disabled.");
    } catch (e) { if(requestId===exampleRequest.current) setError(e instanceof Error?e.message:"The example could not be loaded. Your draft is unchanged."); }
    finally { if(requestId===exampleRequest.current) {operationActive.current=false;setBusy("");} }
  }
  function exitExample() {
    if (operationActive.current) return;
    const original=previewOriginal.current; previewOriginal.current=null; setPreviewKey(null); setHasOriginalDraft(false);
    setDraft(original?.draft ?? newBatch()); setActiveConditionId(original?.activeConditionId ?? "");
    setSelected(original?.selected ?? ""); setDirty(original?.dirty ?? false);
    setError(""); setMessage(original?"Returned to your original draft.":"Teaching data cleared. Start your own contribution.");
  }
  async function addFiles(input: FileList | File[]) {
    if (operationActive.current) return;
    if (draft.exampleOnly) {setError("Exit example preview before adding your own files.");return;}
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
      if (!data.length || data.length > batchLimits.files)
        throw new Error("Choose 1–100 data files per import.");
      const added = [];
      for (let i = 0; i < data.length; i++) {
        setBusy("Checking file " + (i + 1) + " of " + data.length + "…");
        added.push(await makeDraftFile(data[i].path, data[i].bytes));
      }
      if (!manifests.length) {
        const attached = attachOriginalFiles(draft,added,activeCondition?.id??"");
        if (attached.added || attached.draft.records.length!==draft.records.length) change(attached.draft);
        setActiveConditionId(attached.conditionId); setSelected(attached.recordId); setShowAllRecords(false);
        setMessage([
          attached.added ? `${attached.added} original file(s) added.` : "",
          attached.reused ? `${attached.reused} original file(s) reused without duplicating bytes.` : "",
          attached.skipped ? `${attached.skipped} already attached in this condition; the existing record is selected below. Use Add another curve for a distinct acquisition.` : "",
          ...attached.renamed.map(p=>`Same name, different content: ${p.from} retained separately as ${p.to}.`),
          "Review the selected data card below. Other conditions remain available in All records.",
        ].filter(Boolean).join(" "));
      } else {
        // A manifest explicitly maps the entire batch. Never silently redirect it to a renamed original.
        if (manifests[0].bytes.length > 1024 * 1024) throw new Error("The manifest must be no larger than 1 MiB.");
        const nextFiles=[...draft.files];
        for (const file of added) {
          const existing=nextFiles.find(f=>f.path===file.path);
          if (existing && existing.sha256!==file.sha256) throw new Error(`The manifest uses ${file.path}, but this batch already contains different bytes at that path. Give the new file a distinct ZIP folder and update its manifest path. Existing records can be viewed in All records.`);
          if (!existing) nextFiles.push(file);
        }
        const manifestText=new TextDecoder("utf-8",{fatal:true}).decode(manifests[0].bytes);
        const grouped=applyGroupedManifest(manifestText,nextFiles,draft);
        change(grouped); setActiveConditionId(grouped.conditions[0]?.id??""); setSelected(grouped.records[0]?.id??""); setShowAllRecords(false);
        setMessage("Manifest associations applied to the batch. Review all phases, conditions and original files before saving.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Files could not be read.");
    } finally {
      operationActive.current = false;
      setBusy("");
      if (filesInput.current) filesInput.current.value = "";
    }
  }
  async function importManifest(file: File | undefined) {
    if (draft.exampleOnly) {setError("Exit example preview before importing data.");return;}
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
        grouped = applyGroupedManifest(manifestText, draft.files, draft), records = grouped.records;
      change(grouped); setActiveConditionId(records[0].conditionId);
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
    if (draft.exampleOnly) {setError("Exit example preview before importing data.");return;}
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
      setDraft(batch); setSavedAt(null); loadedDraft.current=null; setUndoRemoval(null);
      setActiveConditionId(batch.conditions[0]?.id ?? "");
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
    if (draft.exampleOnly) {setError("Teaching examples cannot be saved. Return to your original draft.");return;}
    if (operationActive.current) return;
    operationActive.current = true;
    setError("");
    setBusy(onServer ? "Saving to the database…" : "Saving to this browser…");
    try {
      const saved = await saveLocalBatch({...draft,title:draft.title.trim()||"Untitled contribution"}, ownerKey);
      loadedDraft.current={id:saved.id,ownerKey};
      setDraft(saved); setSavedAt(saved.updatedAt);
      setDirty(false); setUndoRemoval(null);
      setMessage(
        onServer ? "Draft saved in PostgreSQL. Refreshing this page will reopen this submission. Find it in My contributions as well." : "Draft saved in this browser. Refreshing this page will reopen it. Nothing has been uploaded or published.",
      );
      if (view) router.push("/workspace?batch=" + encodeURIComponent(saved.id));
      else router.replace(savedContributionHref(saved,activeCondition?.id??"",currentRecord?.id??""),{scroll:false});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft could not be saved.");
    } finally {
      operationActive.current = false;
      setBusy("");
    }
  }
  function exportDraft() {
    if (draft.exampleOnly) {setError("Use the teaching ZIP download for examples. Return to your draft before exporting research data.");return;}
    try {
      exportLocalBatch(draft);
      setMessage(
        "JSON draft exported with original file bytes and checksums. Nothing has been submitted.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft could not be exported.");
    }
  }
  function updateRecord(patch: Partial<DraftRecord>) {
    if (patch.conditionId) setActiveConditionId(patch.conditionId);
    if (currentRecord)
      change({
        records: draft.records.map((r) =>
          r.id === currentRecord.id ? { ...r, ...patch, ...((patch.conditionId && patch.conditionId!==r.conditionId)?{structureRecordId:""}:{}) } : r,
        ),
      });
  }
  function removeItem(kind: "phase"|"condition"|"record", id: string) {
    if (operationActive.current) return;
    const next=removeDraftItems(draft,kind,id);
    const conditionId=next.conditions.find(c=>c.id===activeCondition?.id)?.id ?? next.conditions.find(c=>c.phaseId===activeCondition?.phaseId)?.id ?? next.conditions[0]?.id ?? "";
    const recordId=next.records.find(r=>r.id===selected&&r.conditionId===conditionId)?.id ?? next.records.find(r=>r.conditionId===conditionId)?.id ?? "";
    const original={draft,conditionId:activeCondition?.id??"",recordId:selected,dirty};
    change(next); setActiveConditionId(conditionId); setSelected(recordId); setUndoRemoval(original);
    setMessage("Removed from this draft. Save to keep the change, or undo before making another edit.");
  }
  function undoRemove() {
    if (!undoRemoval || operationActive.current) return;
    setDraft(undoRemoval.draft); setActiveConditionId(undoRemoval.conditionId); setSelected(undoRemoval.recordId); setDirty(undoRemoval.dirty);
    setUndoRemoval(null); setError(""); setMessage("Removal undone. Original file bytes and record links restored.");
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
  const groupRecords = draft.records.filter(r=>r.conditionId===activeCondition?.id);
  const visibleRecords = showAllRecords ? draft.records : groupRecords;
  const groupReady = visibleRecords.filter(r=>!readiness.issues[r.id]?.length).length;
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
            <strong>Private draft workspace.</strong>{" "}
            {onServer ? "Save original files and context, then submit for review from My Contributions." : "Files stay in this browser. Save a draft or export a copy to keep your work."}{" "}
            Platform-standard calculations are not available yet.
          </p>
        </div>
        <ContributionExamples load={id=>void loadExample(id)} busy={Boolean(busy)} selected={previewKey} requested={params.get("example")}/>
        {draft.exampleOnly && <div id="example-preview-notice" className="example-preview-notice" role="status">
          <Info size={20}/><div><strong>Teaching example · 教学示例</strong><p>{contributionExample(previewKey)?.title ?? "Imported teaching data"} · 可修改字段体验，但不能保存或提交。{hasOriginalDraft?"原草稿保留在当前页面，请返回后保存。":"开始真实上传前，请清除示例。"}</p><small>{contributionExample(previewKey)?.limitation}</small><a href="#batch-records-title" className="text-link">View data cards ↓</a></div>
          <button type="button" className="secondary-link" disabled={disabled} onClick={exitExample}>{hasOriginalDraft?"Return to my draft":"Clear example & start"}</button>
        </div>}
        <PhaseContributionEditor draft={draft} activeConditionId={activeCondition?.id??""} selectCondition={selectCondition} change={change} disabled={Boolean(busy)} removePhase={id=>removeItem("phase",id)} removeCondition={id=>removeItem("condition",id)}/>
        <section
          className="batch-setup surface-card"
          aria-labelledby="batch-setup-title"
          data-reveal
        >
          <div className="batch-section-heading">
            <span>02</span>
            <h2 id="batch-setup-title">Original files & visibility</h2>
            <span className="batch-save-state">
              {draft.exampleOnly ? "Teaching preview · not saved" : dirty ? "Unsaved changes" : savedAt ? onServer ? "Saved in database" : "Saved locally" : "New draft"}
            </span>
          </div>
          <fieldset
            disabled={disabled || draft.exampleOnly}
            className="batch-setup-grid batch-control-fieldset"
          >
            <div className="batch-files-column">
              <label>
                Submission title · 上传批次标题
                <input
                  value={draft.title}
                  maxLength={300}
                  onChange={(e) => change({ title: e.target.value })}
                  placeholder="Name this dataset"
                />
              </label>
              <p className="form-note submission-context-note">一次投稿的名称，可包含多个 Phase、P–T 条件和多次采集。XRD 测量轮次在各数据卡片的 Acquisition label / Sample or run 中区分。</p>
              <label>Add files to this condition group<select value={activeCondition?.id??""} onChange={e=>selectCondition(e.target.value)}><option value="" disabled>Create a phase and condition above</option>{draft.conditions.map(c=><option key={c.id} value={c.id}>{phaseName(draft.phases.find(p=>p.id===c.phaseId)!)} · {conditionName(c)}</option>)}</select></label>
              <p className="form-note">Choose theory / experiment and data type on each data card. New numerical files start as Raman records; CIF/POSCAR files start as structures. A manifest supplies explicit types and associations.</p>
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
                The manifest groups records by phase_key and condition_key. Repeated file paths can define multiple curves using
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
            <span>03</span>
            <h2 id="batch-records-title">Data records</h2>
            <span className="batch-record-summary">
              {draft.records.length} records · {draft.files.length} original
              files
            </span>
          </div>
          <div className="data-condition-heading"><strong>{activeCondition ? conditionName(activeCondition) : "Select a condition group above"}</strong><span>{draft.records.filter(r=>r.conditionId===activeCondition?.id).length} records in this group · {readiness.ready}/{draft.records.length} format-ready in batch</span></div>
          <div className="record-scope-controls"><div role="group" aria-label="Record list scope"><button type="button" aria-pressed={!showAllRecords} onClick={()=>setShowAllRecords(false)}>This condition ({groupRecords.length})</button><button type="button" aria-pressed={showAllRecords} onClick={()=>setShowAllRecords(true)}>All records ({draft.records.length})</button></div><Link href="/workspace" className="text-link">Saved submissions <ArrowUpRight size={13}/></Link></div>
          {undoRemoval && <div className="draft-removal-note" role="status"><span>Removed from the draft. Save to persist this change.</span><button type="button" className="text-link" disabled={disabled} onClick={undoRemove}>Undo removal</button></div>}
          {visibleRecords.length ? (
            <div className="batch-review-grid">
              <div className="batch-record-list surface-card" data-reveal>
                <div className="batch-list-heading">
                  <strong>{groupReady} format-ready {showAllRecords?"in batch":"in group"}</strong>
                  <span>
                    {visibleRecords.length - groupReady} need context
                  </span>
                </div>
                <p className="form-note">
                  Local checks are preparation checks, not scientific approval.
                </p>
                <div className="record-list-items">
                  {visibleRecords.map((record) => {
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
                          onClick={() => {setActiveConditionId(record.conditionId);setSelected(record.id);}}
                          aria-pressed={currentRecord?.id === record.id}
                        >
                          <span className="record-item-id">
                            {record.acquisitionLabel || record.id}
                            <span>{dataTypes[record.dataType]}</span>
                          </span>
                          <strong>{file.path}</strong>
                          {showAllRecords && <small className="record-condition-context">{phaseName(draft.phases.find(p=>p.id===record.phaseId)!)} · {conditionName(draft.conditions.find(c=>c.id===record.conditionId)!)}</small>}
                          <span>
                            {record.origin === "experimental" ? "Experimental" : "Theoretical"} ·{" "}
                            {record.pressureGPa.trim()
                              ? record.pressureGPa + " GPa" + (record.pressureMode==="target"?" target":"")
                              : "Pressure unreported"}
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
                          onClick={() => removeItem("record",record.id)}
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
                    phases={draft.phases}
                    conditions={draft.conditions}
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
              <h3>Add data to this condition group.</h3>
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
            <span>04</span>
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
                disabled={disabled || draft.exampleOnly}
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
            disabled={disabled || draft.exampleOnly}
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
              disabled={disabled || draft.exampleOnly}
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
            {draft.exampleOnly ? "Teaching example: saving and submission are disabled. Return to your draft to continue." : onServer ? "Metadata-only drafts may be saved privately before files are ready. Refresh restores the saved version; save again after editing. Export a copy for safekeeping; submit only when ready for review." : "Incomplete metadata may be saved as a draft. Saved files and contact details remain on this device; browser data clearing can remove them. Export a copy for safekeeping."}
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
              disabled={disabled || draft.exampleOnly}
              onClick={() => void save(true)}
            >
              <Save size={16} />
              Save & view batch
            </button>
            <button
              className="secondary-link"
              type="button"
              disabled={disabled || draft.exampleOnly}
              onClick={() => void save()}
            >
              Save draft
            </button>
            <button
              className="text-link"
              type="button"
              disabled={disabled || draft.exampleOnly}
              onClick={exportDraft}
            >
              <Download size={15} />
              Export JSON draft
            </button>
          </div>
          <div className="batch-service-footer">
            <span>{draft.exampleOnly ? "Example preview · cannot submit" : onServer ? "Submit for review from My Contributions" : "Submission service awaiting connection"}</span>
            <a href={contactHref("Data contribution")}>
              {contactEmail} <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </Container>
    </ScrollRevealPage>
  );
}
