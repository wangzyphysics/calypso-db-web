"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  FileUp,
  Check,
  Mail,
  Info,
} from "lucide-react";
import { Container } from "./foundations";
import { ScrollRevealPage } from "./scroll-reveal-page";
import {
  contributionSchema,
  createContributionDraft,
  maximumStructureBytes,
  reviewStructureFile,
  type FileReview,
} from "@/lib/materials/contribution";
import { contactEmail, contactHref } from "@/lib/materials/site-information";

type SelectedStructure = { name: string; text: string; review: FileReview };
export function ContributionWorkspace() {
  const [structure, setStructure] = useState<SelectedStructure | null>(null);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const fileSequence = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const reportError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };
  async function selectFile(file: File | undefined) {
    const request = ++fileSequence.current;
    setStructure(null);
    setFileError("");
    setExported(false);
    setError("");
    if (!file) {
      setReading(false);
      return;
    }
    if (file.size > maximumStructureBytes) {
      setReading(false);
      setFileError("Choose a structure file no larger than 5 MiB.");
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      const review = reviewStructureFile(file.name, text);
      if (request === fileSequence.current)
        setStructure({ name: file.name, text, review });
    } catch (problem) {
      if (request === fileSequence.current)
        setFileError(
          problem instanceof Error
            ? problem.message
            : "The file could not be read.",
        );
    } finally {
      if (request === fileSequence.current) setReading(false);
    }
  }
  async function exportDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setExported(false);
    if (!structure) {
      reportError(
        "Choose a structure file and resolve its format checks before exporting.",
      );
      return;
    }
    const fields = new FormData(event.currentTarget);
    const pressure = String(fields.get("pressureGPa") ?? "").trim();
    const result = contributionSchema.safeParse({
      contributorName: fields.get("contributorName"),
      email: fields.get("email"),
      formula: fields.get("formula"),
      pressureGPa: pressure ? Number(pressure) : NaN,
      calculationMethod: fields.get("calculationMethod"),
      source: fields.get("source"),
      notes: fields.get("notes"),
      permissionConfirmed: fields.get("permissionConfirmed") === "on",
    });
    if (!result.success) {
      reportError(result.error.issues[0].message);
      return;
    }
    setExporting(true);
    try {
      const checksum = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(structure.text),
      );
      const sha256 = [...new Uint8Array(checksum)]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
      const draft = createContributionDraft(result.data, {
        name: structure.name,
        text: structure.text,
        sha256,
      });
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(draft, null, 2) + "\n"], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "calypso-contribution-draft.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExported(true);
    } catch (problem) {
      reportError(
        problem instanceof Error
          ? problem.message
          : "The draft could not be exported.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <ScrollRevealPage className="contribution-page">
      <Container>
        <header className="knowledge-heading" data-reveal>
          <span className="eyebrow">CONTRIBUTE SCIENTIFIC DATA</span>
          <h1>
            Share a structure.
            <br />
            Add scientific context.
          </h1>
          <p>
            Prepare a contribution with its pressure, calculation method and
            source. Scientific records will enter the database only after
            review.
          </p>
        </header>
        <div className="contribution-layout">
          <aside className="contribution-guide" data-reveal>
            <span className="eyebrow">FROM YOUR FILE TO A RECORD</span>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <h2>Prepare</h2>
                  <p>
                    One CIF or POSCAR structure and its actual recorded
                    conditions.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h2>Review</h2>
                  <p>
                    Format, provenance, scientific consistency and permission to
                    share.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h2>Publish</h2>
                  <p>
                    A traceable record after an approved data-ingestion process.
                  </p>
                </div>
              </li>
            </ol>
            <div className="local-draft-note">
              <Info size={19} />
              <p>
                <strong>Local draft mode</strong>Your file and contact details
                stay in this page. No upload service is connected. Refreshing
                clears the form; export a draft to save it.
              </p>
            </div>
            <Link href="/docs" className="text-link">
              Methods & data policy <ArrowUpRight size={15} />
            </Link>
            <a
              href={contactHref("Data contribution")}
              className="contribution-contact"
            >
              <Mail size={15} />
              {contactEmail}
            </a>
          </aside>
          <form
            className="contribution-form"
            onSubmit={exportDraft}
            onChange={() => setExported(false)}
          >
            <section data-reveal>
              <div className="form-section-heading">
                <span>01</span>
                <h2>Structure file</h2>
              </div>
              <div className="structure-upload">
                <FileUp size={25} />
                <div>
                  <label htmlFor="structure-file">Choose a structure</label>
                  <p>CIF, POSCAR, .poscar or .vasp · up to 5 MiB</p>
                </div>
                <input
                  ref={fileRef}
                  id="structure-file"
                  type="file"
                  accept=".cif,.vasp,.poscar,text/plain"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                  aria-describedby="file-checks"
                />
              </div>
              <div id="file-checks" aria-live="polite">
                {reading && <p className="form-note">Reading the file…</p>}
                {fileError && <p className="field-error">{fileError}</p>}
                {structure && (
                  <div className="file-review">
                    <strong>{structure.name}</strong>
                    <ul>
                      {structure.review.checks.map((check) => (
                        <li key={check}>
                          <Check size={14} />
                          {check}
                        </li>
                      ))}
                    </ul>
                    <p>{structure.review.warnings[0]}</p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        fileSequence.current++;
                        setStructure(null);
                        setFileError("");
                        setExported(false);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      Remove file
                    </button>
                  </div>
                )}
              </div>
            </section>
            <section data-reveal>
              <div className="form-section-heading">
                <span>02</span>
                <h2>Scientific context</h2>
              </div>
              <div className="contribution-field-grid">
                <label>
                  Chemical formula
                  <input
                    name="formula"
                    placeholder="e.g. Fe₂O₃"
                    required
                    maxLength={120}
                  />
                </label>
                <label>
                  Recorded pressure (GPa)
                  <input
                    name="pressureGPa"
                    type="number"
                    step="any"
                    placeholder="Enter the recorded value"
                    required
                  />
                </label>
              </div>
              <label>
                Calculation method
                <textarea
                  name="calculationMethod"
                  placeholder="Software and version, exchange-correlation treatment, pseudopotentials or basis, sampling, cutoff and convergence settings…"
                  required
                  maxLength={10000}
                  rows={5}
                />
              </label>
              <label>
                Data source / reference
                <textarea
                  name="source"
                  placeholder="Original calculation, dataset, publication DOI or source URL; include provenance and attribution."
                  required
                  maxLength={4000}
                  rows={3}
                />
              </label>
              <label>
                Additional notes{" "}
                <span className="optional-label">Optional</span>
                <textarea
                  name="notes"
                  placeholder="Phase assignment, limitations, related records or other relevant context."
                  maxLength={10000}
                  rows={3}
                />
              </label>
              <p className="form-note">
                Use the pressure of this exact record. Phase stability should be
                supported by comparative evidence.
              </p>
            </section>
            <section data-reveal>
              <div className="form-section-heading">
                <span>03</span>
                <h2>Contributor</h2>
              </div>
              <div className="contribution-field-grid">
                <label>
                  Your name
                  <input
                    name="contributorName"
                    autoComplete="name"
                    required
                    maxLength={120}
                  />
                </label>
                <label>
                  Contact email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
              <label className="permission-checkbox">
                <input name="permissionConfirmed" type="checkbox" required />
                <span>
                  I have permission to share these data and have included their
                  source.
                </span>
              </label>
            </section>
            {error && (
              <div
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                className="submission-error"
              >
                {error}
              </div>
            )}
            {exported && (
              <div role="status" className="draft-exported">
                <Check size={18} />
                <div>
                  <strong>Draft exported</strong>
                  <p>
                    Nothing has been uploaded. Keep the JSON file for a future
                    submission or contact the team for the next step.
                  </p>
                </div>
              </div>
            )}
            <div className="contribution-form-actions" data-reveal>
              <button
                type="submit"
                className="primary-link"
                disabled={reading || exporting}
              >
                {exporting ? "Preparing draft…" : "Export submission draft"}
                <Download size={16} />
              </button>
              <a href={contactHref("Data contribution")} className="text-link">
                Email the team <ArrowRight size={15} />
              </a>
            </div>
            <p className="form-note">
              The exported JSON includes the structure text, your metadata,
              contact details and a checksum of the UTF-8 structure text.
              Exporting does not submit or publish it.
            </p>
          </form>
        </div>
      </Container>
    </ScrollRevealPage>
  );
}
