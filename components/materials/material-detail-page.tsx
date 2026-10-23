"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  Copy,
  Database,
  Download,
  FileJson,
  FileText,
  Fingerprint,
  Gauge,
  Grid2X2,
  Layers3,
  Microscope,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { materialsClient } from "@/lib/materials/api";
import {
  cellLabels,
  detailHref,
  downloadHref,
  type MaterialDetail,
} from "@/lib/materials/detail";
import { ChemicalFormula, Container, LoadingSkeleton } from "./foundations";
import { useResource } from "./data-sections";
import { CrystalViewer } from "./crystal-viewer";
import {
  LatticePanel,
  Coordinates,
  CalculationSection,
  ContributionData,
  ContributionMetadata,
} from "./material-detail-panels";
import {
  formatDetailNumber as num,
  formatDetailValue as value,
} from "@/lib/materials/detail-format";

const pressure = (p: number | null) =>
  p == null ? "Not reported" : num(p) + " GPa";
function CopyValue({
  text,
  label = "Copy identifier",
}: {
  text: string;
  label?: string;
}) {
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 2500);
    return () => clearTimeout(timer);
  }, [status]);
  return (
    <>
      <button
        className="detail-icon-button"
        aria-label={label}
        onClick={() =>
          void navigator.clipboard.writeText(text).then(
            () => setStatus("Copied"),
            () => setStatus("Copy unavailable"),
          )
        }
      >
        {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <span className="detail-copy-status" role="status">
        {status}
      </span>
    </>
  );
}
function PanelHeading({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="detail-panel-heading">
      <div>
        <span className="detail-section-number">{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function MaterialDetailPage({ recordId }: { recordId: string }) {
  const load = useCallback(
    (signal: AbortSignal) => materialsClient.detail(recordId, signal),
    [recordId],
  );
  const { state, retry } = useResource(load);
  if (state.status !== "ready")
    return (
      <main id="main-content" className="structure-page">
        <Container>
          <Link className="detail-back" href="/explore">
            <ArrowLeft size={15} /> Explore Materials
          </Link>
          {state.status === "loading" ? (
            <div className="detail-loading" aria-busy="true">
              <LoadingSkeleton label="Loading structure, calculations and provenance" />
              <LoadingSkeleton label="Loading crystal geometry" />
            </div>
          ) : (
            <div className="detail-error" role="status">
              <Database size={28} />
              <h1>
                {state.status === "error" && state.kind === "not-found"
                  ? "Record unavailable"
                  : "Structure data unavailable"}
              </h1>
              <p>
                {state.status === "error"
                  ? state.message
                  : "Connect a materials data service to open structure records."}
              </p>
              <div>
                {state.status === "error" && state.kind === "unauthorized" ? (
                  <Link
                    className="primary-link"
                    href={
                      "/login?returnTo=" +
                      encodeURIComponent(detailHref(recordId))
                    }
                  >
                    Sign in again
                  </Link>
                ) : (
                  <button className="primary-link" onClick={retry}>
                    Try again
                  </button>
                )}
                <Link className="text-link" href="/explore">
                  Back to materials
                </Link>
              </div>
            </div>
          )}
        </Container>
      </main>
    );
  return <RecordWorkspace key={state.data.recordId} detail={state.data} />;
}
function RecordWorkspace({ detail: d }: { detail: MaterialDetail }) {
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const requested = params.get("cell"),
    cell =
      d.cells.find((c) => c.id === (requested ?? d.defaultCellId)) ??
      d.cells.find((c) => c.id === d.defaultCellId) ??
      d.cells[0];
  const [activeSection, setActiveSection] = useState("structure"),
    [downloadError, setDownloadError] = useState(""),
    [downloading, setDownloading] = useState(false);
  const contribution = d.contribution;
  const sections = [
    { id: "structure", label: cell ? "Crystal structure" : "Original data" },
    {
      id: "coordinates",
      label: cell ? "Atomic coordinates" : "Record metadata",
    },
    { id: "calculations", label: "Calculations & properties" },
    { id: "provenance", label: "Provenance & export" },
  ];
  // Geometry arrives after authentication/data loading, so a fragment may have
  // been visited before its target existed. Restore it against the ready page.
  useEffect(() => {
    const reveal = () => {
      const id = window.location.hash.slice(1);
      if (
        [
          "main-content",
          "structure",
          "coordinates",
          "calculations",
          "provenance",
        ].includes(id)
      )
        document
          .getElementById(id)
          ?.scrollIntoView({ block: "start", behavior: "instant" });
    };
    const frame = requestAnimationFrame(reveal);
    window.addEventListener("hashchange", reveal);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", reveal);
    };
  }, [d.recordId]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = "structure";
        for (const id of [
          "structure",
          "coordinates",
          "calculations",
          "provenance",
        ]) {
          const node = document.getElementById(id);
          if (node && node.getBoundingClientRect().top <= 180) current = id;
        }
        setActiveSection(current);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);
  function selectCell(id: string) {
    const next = new URLSearchParams(params);
    if (id === d.defaultCellId) next.delete("cell");
    else next.set("cell", id);
    router.replace(
      pathname + (next.size ? "?" + next : "") + window.location.hash,
      { scroll: false },
    );
  }
  function navigateSection(
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) {
    event.preventDefault();
    // Same-document sections do not need an RSC navigation. Preserve the
    // framework history state and keep Back/Forward and reloadable hashes.
    window.history.pushState(window.history.state, "", "#" + id);
    document
      .getElementById(id)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    setActiveSection(id === "main-content" ? "structure" : id);
  }
  async function download(format: string) {
    if (downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(
        downloadHref(materialsClient.baseUrl, d.recordId, format, cell?.id),
        { credentials: "same-origin", signal: AbortSignal.timeout(30000) },
      );
      if (!response.ok) {
        let message = "The download could not be completed. Please try again.";
        try {
          const body = (await response.json()) as { error?: unknown };
          if (typeof body.error === "string") message = body.error;
        } catch {}
        throw new Error(message);
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      const file = response.headers
        .get("content-disposition")
        ?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      a.href = url;
      a.download = file ? decodeURIComponent(file) : d.recordId + "." + format;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setDownloadError(
        e instanceof Error ? e.message : "Download unavailable.",
      );
    } finally {
      setDownloading(false);
    }
  }
  const ordered = cell?.sites.every(
    (s) =>
      s.species.length === 1 && Math.abs(s.species[0].occupancy - 1) < 1e-10,
  );
  return (
    <main id="main-content" className="structure-page">
      <Container>
        <div className="detail-breadcrumb">
          <Link className="detail-back" href="/explore">
            <ArrowLeft size={15} /> Explore Materials
          </Link>
          <span>/</span>
          <span>{d.externalIds[0] ?? "Structure record"}</span>
        </div>
        <header className="detail-hero">
          <div>
            <p className="detail-eyebrow">
              {d.provenance === "imported"
                ? "CALYPSO / STRUCTURE RECORD"
                : "CALYPSO / CONTRIBUTED RECORD"}
            </p>
            <div className="detail-title-row">
              <h1>
                <ChemicalFormula formula={d.formula} />
              </h1>
              <span className="detail-source-badge">
                {d.provenance === "imported" ? (
                  <>
                    <Database size={13} /> Source dataset
                  </>
                ) : (
                  <>
                    {d.origin === "theoretical" ? (
                      <b>★</b>
                    ) : (
                      <Microscope size={13} />
                    )}{" "}
                    {d.origin} · {contribution?.reviewStatus}
                  </>
                )}
              </span>
            </div>
            <div className="detail-identifiers">
              <span>{d.externalIds.join(" · ") || d.recordId}</span>
              <CopyValue text={d.externalIds[0] ?? d.recordId} />
            </div>
          </div>
          <div className="detail-header-actions">
            <Link
              className="detail-related-search"
              href={
                "/explore?type=formula&query=" +
                encodeURIComponent(d.formula) +
                "#results"
              }
            >
              Related composition <ArrowUpRight size={14} />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="detail-download-button"
                disabled={downloading}
              >
                <Download size={15} />
                {downloading ? "Preparing…" : "Export data"}
                <ChevronDown size={13} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                collisionPadding={16}
                className="detail-download-menu"
              >
                <DropdownMenuLabel>Selected record</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => void download("json")}>
                  <FileJson size={15} /> Record JSON
                </DropdownMenuItem>
                {contribution?.file && (
                  <DropdownMenuItem onSelect={() => void download("original")}>
                    <FileText size={15} /> Original uploaded file
                  </DropdownMenuItem>
                )}
                {cell && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>
                      {cellLabels[cell.role] ?? cell.role}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => void download("cif")}>
                      CIF · full-cell representation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!ordered}
                      onSelect={() => void download("poscar")}
                    >
                      POSCAR {ordered ? "" : "· occupancy unsupported"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void download("csv")}>
                      Atomic coordinates · CSV
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {downloadError && (
          <p className="detail-alert" role="alert">
            {downloadError}
          </p>
        )}
        <div className="detail-summary-strip">
          <div>
            <Gauge size={17} />
            <span>
              Recorded pressure<strong>{pressure(d.pressureGPa)}</strong>
              <small className="detail-temperature">
                {d.temperatureK == null
                  ? d.temperatureStatus === "not-modelled"
                    ? "T not modelled"
                    : "T not reported"
                  : num(d.temperatureK) + " K"}
              </small>
            </span>
          </div>
          <div>
            <Fingerprint size={17} />
            <span>
              Space group
              <strong>
                {d.spaceGroup ?? "Not reported"}
                {d.spaceGroupNumber != null && (
                  <small> No. {d.spaceGroupNumber}</small>
                )}
              </strong>
            </span>
          </div>
          <div>
            <Grid2X2 size={17} />
            <span>
              Crystal system<strong>{d.crystalSystem ?? "Not reported"}</strong>
            </span>
          </div>
          <div>
            <Layers3 size={17} />
            <span>
              Source phase<strong>{d.phaseLabel ?? "Unassigned"}</strong>
            </span>
          </div>
        </div>
        <nav className="detail-section-nav" aria-label="Record sections">
          {sections.map((s) => (
            <button
              type="button"
              key={s.id}
              aria-current={activeSection === s.id ? "location" : undefined}
              onClick={(event) => navigateSection(event, s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <section id="structure" className="detail-section">
          <PanelHeading
            number="01"
            title={cell ? "Crystal structure" : "Original data"}
          >
            <span className="detail-section-note">
              {cell
                ? `${cell.siteCount} sites in selected cell`
                : contribution?.record.processing + " · " + d.dataType}
            </span>
          </PanelHeading>
          {requested && !d.cells.some((c) => c.id === requested) && (
            <p className="detail-alert" role="status">
              The requested cell is not part of this record. Showing the display
              cell.
            </p>
          )}
          {cell ? (
            <div className="detail-structure-grid">
              <div className="detail-viewer-panel">
                <div className="detail-cell-selector">
                  <label htmlFor="detail-cell">Cell representation</label>
                  <select
                    id="detail-cell"
                    value={cell.id}
                    onChange={(e) => selectCell(e.target.value)}
                  >
                    {d.cells.map((c) => (
                      <option key={c.id} value={c.id}>
                        {cellLabels[c.role] ?? c.role} · {c.siteCount} sites
                      </option>
                    ))}
                  </select>
                </div>
                <CrystalViewer key={cell.id} cell={cell} />
              </div>
              <LatticePanel cell={cell} detail={d} />
            </div>
          ) : (
            <ContributionData detail={d} />
          )}
          {d.phaseId && d.relatedRecords.length > 0 && (
            <div className="detail-pressure-records">
              <div>
                <Layers3 size={17} />
                <h3>Records in this phase</h3>
                <span>
                  {d.relatedRecords.length}
                  {d.relatedHasMore ? "+" : ""} records
                </span>
              </div>
              <div className="detail-pressure-links">
                {d.relatedRecords.map((r, i) => (
                  <Link
                    key={r.recordId}
                    href={detailHref(r.recordId)}
                    aria-current={
                      r.recordId === d.recordId ? "page" : undefined
                    }
                  >
                    <small>
                      {r.pressureGPa == null ? "Pressure" : "Recorded"}
                    </small>
                    <strong>{pressure(r.pressureGPa)}</strong>
                    <span>
                      {r.recordId === d.recordId
                        ? "Current record"
                        : `Record ${i + 1}`}
                    </span>
                  </Link>
                ))}
              </div>
              <p>
                {d.phaseDefinition} Selecting a pressure opens an available
                record; no interpolation is performed.
              </p>
              {d.relatedHasMore && (
                <Link
                  className="text-link"
                  href={
                    "/explore?type=phase&query=" +
                    encodeURIComponent(d.phaseId) +
                    "#results"
                  }
                >
                  View all phase records <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
          )}
        </section>
        <section id="coordinates" className="detail-section">
          <PanelHeading
            number="02"
            title={cell ? "Atomic coordinates" : "Record metadata"}
          >
            {cell && (
              <span className="detail-section-note">
                Selected cell · {cellLabels[cell.role] ?? cell.role}
              </span>
            )}
          </PanelHeading>
          {cell ? (
            <Coordinates key={cell.id} cell={cell} />
          ) : (
            <ContributionMetadata detail={d} />
          )}
        </section>
        <section id="calculations" className="detail-section">
          <PanelHeading number="03" title="Calculations & properties">
            <span className="detail-section-note">
              {d.calculations.length} source tasks
            </span>
          </PanelHeading>
          <CalculationSection detail={d} selectCell={selectCell} />
        </section>
        <section id="provenance" className="detail-section">
          <PanelHeading number="04" title="Provenance & export" />
          <div className="detail-provenance-grid">
            <div className="detail-panel">
              <h3>
                <Database size={17} /> Source & attribution
              </h3>
              {d.sources.map((s, i) => (
                <div className="detail-source-entry" key={s.id + ":" + i}>
                  <strong>{s.label}</strong>
                  <dl className="detail-definition">
                    <div>
                      <dt>Source identifier</dt>
                      <dd>{s.externalId}</dd>
                    </div>
                    <div>
                      <dt>Dataset namespace</dt>
                      <dd>{s.id}</dd>
                    </div>
                    <div>
                      <dt>License</dt>
                      <dd>{s.license ?? "Not supplied by source"}</dd>
                    </div>
                    {s.reference && (
                      <div>
                        <dt>Source reference</dt>
                        <dd>
                          {value(s.reference.file)}
                          {s.reference.line != null
                            ? ` · line ${s.reference.line}`
                            : ""}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Source updated</dt>
                      <dd>{value(s.metadata.last_updated)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
              {contribution && (
                <>
                  <strong>
                    {contribution.attribution.name || "Contributor"}
                  </strong>
                  <p>
                    {[
                      contribution.attribution.institution,
                      contribution.attribution.researchGroup,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <dl className="detail-definition">
                    <div>
                      <dt>Submission batch</dt>
                      <dd>{contribution.batchTitle || contribution.batchId}</dd>
                    </div>
                    <div>
                      <dt>Publication</dt>
                      <dd>
                        {contribution.access === "public"
                          ? "Public after review"
                          : "Restricted · " + contribution.access}
                      </dd>
                    </div>
                    <div>
                      <dt>Source / reference</dt>
                      <dd>{value(contribution.record.source)}</dd>
                    </div>
                    <div>
                      <dt>Review</dt>
                      <dd>
                        {contribution.reviewStatus} · scientific claims retain
                        their source status
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </div>
            <div className="detail-panel">
              <h3>
                <Download size={17} /> Reproducible records
              </h3>
              <p>
                Export the selected cell with its actual lattice, fractional
                coordinates and occupancies. Calculation cells remain separate
                from the display representation.
              </p>
              <div className="detail-export-grid">
                <button
                  onClick={() => void download("json")}
                  disabled={downloading}
                >
                  <FileJson size={17} />
                  <span>
                    Record JSON<small>Metadata, cells & task summaries</small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
                {cell && (
                  <>
                    <button
                      onClick={() => void download("cif")}
                      disabled={downloading}
                    >
                      <Box size={17} />
                      <span>
                        Structure CIF
                        <small>Full cell · P1 export representation</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => void download("poscar")}
                      disabled={downloading || !ordered}
                    >
                      <FileText size={17} />
                      <span>
                        POSCAR
                        <small>
                          {ordered
                            ? "Ordered, fully occupied sites"
                            : "Use CIF to retain partial occupancy"}
                        </small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => void download("csv")}
                      disabled={downloading}
                    >
                      <Grid2X2 size={17} />
                      <span>
                        Coordinate CSV
                        <small>Species, occupancy & fractional positions</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  </>
                )}
                {contribution?.file && (
                  <button
                    onClick={() => void download("original")}
                    disabled={downloading}
                  >
                    <FileText size={17} />
                    <span>
                      Original file<small>{contribution.file.name}</small>
                    </span>
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="detail-record-footer">
            <span>
              Record ID <code>{d.recordId}</code>
              <CopyValue text={d.recordId} />
            </span>
            <span>
              Material ID <code>{d.materialId}</code>
              <CopyValue text={d.materialId} label="Copy material identifier" />
            </span>
            {d.phaseId && (
              <span>
                Phase ID <code>{d.phaseId}</code>
                <CopyValue text={d.phaseId} label="Copy phase identifier" />
              </span>
            )}
            <button
              type="button"
              className="detail-back"
              onClick={(event) => navigateSection(event, "main-content")}
            >
              Back to overview ↑
            </button>
          </div>
        </section>
      </Container>
    </main>
  );
}
