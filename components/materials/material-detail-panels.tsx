"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Fingerprint,
  FlaskConical,
  Microscope,
} from "lucide-react";
import {
  cellLabels,
  fractionalToCartesian,
  latticeMetrics,
  type MaterialDetail,
  type StructureCell,
} from "@/lib/materials/detail";
import {
  formatDetailNumber as num,
  formatDetailValue as value,
} from "@/lib/materials/detail-format";

export function LatticePanel({
  cell,
  detail,
}: {
  cell: StructureCell;
  detail: MaterialDetail;
}) {
  const metrics = latticeMetrics(cell.lattice);
  return (
    <aside className="detail-panel detail-lattice-panel">
      <h3>
        <Box size={17} /> Unit cell
      </h3>
      <p className="detail-cell-role">{cellLabels[cell.role] ?? cell.role}</p>
      <div className="detail-cell-volume">
        <strong>
          {num(cell.volumeA3, 3)}
          <span>Å³</span>
        </strong>
        <small>Cell volume · {cell.siteCount} atomic sites</small>
      </div>
      <dl className="detail-lattice-metrics">
        {Object.entries(metrics).map(([key, v]) => (
          <div key={key}>
            <dt>
              {(
                { alpha: "α", beta: "β", gamma: "γ" } as Record<string, string>
              )[key] ?? key}
            </dt>
            <dd>
              {num(v, 4)}
              <span>{key.length === 1 ? "Å" : "°"}</span>
            </dd>
          </div>
        ))}
      </dl>
      <details className="detail-lattice-vectors">
        <summary>
          Lattice vectors <span>Å</span>
        </summary>
        <div className="detail-matrix">
          {cell.lattice.map((row, i) => (
            <div key={i}>
              <i>{["a", "b", "c"][i]}</i>
              {row.map((v, j) => (
                <span key={j}>{num(v, 6)}</span>
              ))}
            </div>
          ))}
        </div>
      </details>
      <div className="detail-cell-note">
        {cell.role === "display_unit_cell"
          ? `Source symmetry: ${detail.spaceGroup ?? "not reported"}. Symmetry labels refer to this display representation.`
          : "Calculation output geometry. Source display-cell symmetry is not reassigned to this cell."}
        <br />
        Volume and lattice parameters describe this selected cell only.
      </div>
    </aside>
  );
}
export function Coordinates({ cell }: { cell: StructureCell }) {
  const [mode, setMode] = useState<"fractional" | "cartesian">("fractional"),
    [page, setPage] = useState(0),
    size = 10;
  const pages = Math.ceil(cell.sites.length / size),
    start = page * size;
  return (
    <div className="detail-panel detail-coordinate-panel">
      <div className="detail-coordinate-tools">
        <p>{cell.siteCount} sites · occupancies preserved</p>
        <div
          className="detail-segmented"
          aria-label="Coordinate representation"
        >
          {(["fractional", "cartesian"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={mode === v}
              onClick={() => setMode(v)}
            >
              {v === "fractional" ? "Fractional" : "Cartesian · Å"}
            </button>
          ))}
        </div>
      </div>
      <div
        className="detail-table-scroll"
        tabIndex={0}
        aria-label="Atomic coordinate table, scroll horizontally"
      >
        <table className="detail-coordinate-table">
          <thead>
            <tr>
              <th scope="col">Site</th>
              <th scope="col">Species</th>
              <th scope="col">Occupancy</th>
              {(mode === "fractional"
                ? ["x / a", "y / b", "z / c"]
                : ["x (Å)", "y (Å)", "z (Å)"]
              ).map((v) => (
                <th scope="col" key={v}>
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cell.sites.slice(start, start + size).map((site, i) => (
              <tr key={start + i}>
                <td>{String(start + i + 1).padStart(2, "0")}</td>
                <td>
                  <strong>
                    {site.species.map((sp) => sp.element).join(" / ")}
                  </strong>
                </td>
                <td>
                  {site.species.map((sp) => num(sp.occupancy, 6)).join(" / ")}
                </td>
                {(mode === "fractional"
                  ? site.frac_coords
                  : fractionalToCartesian(site.frac_coords, cell.lattice)
                ).map((v, j) => (
                  <td key={j}>{v.toFixed(6)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="detail-coordinate-footer">
        <span>
          Showing {start + 1}–{Math.min(start + size, cell.siteCount)} of{" "}
          {cell.siteCount} sites
        </span>
        <div>
          <button
            aria-label="Previous coordinate page"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            aria-label="Next coordinate page"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <p className="detail-table-note">
        Coordinates follow the stored full-cell site order. Wyckoff labels are
        omitted where a verified site-to-label mapping is unavailable.
      </p>
    </div>
  );
}
export function CalculationSection({
  detail: d,
  selectCell,
}: {
  detail: MaterialDetail;
  selectCell: (id: string) => void;
}) {
  const energies = d.calculations.filter((t) => t.energy),
    contribution = d.contribution;
  return (
    <>
      <div className="detail-science-status">
        <FlaskConical size={19} />
        <div>
          <strong>Source results, with their calculation context</strong>
          <p>
            {contribution
              ? "Contributor data retain their experimental or theoretical origin. Review approval does not imply platform-standard calculation or thermodynamic validation."
              : "Raw source energies are not validated formation energies, enthalpies or energy-above-hull values. Stability is not inferred from these records."}
          </p>
        </div>
      </div>
      {energies.length > 0 && (
        <div className="detail-energy-grid">
          {energies.map((task) => (
            <div className="detail-panel detail-energy-card" key={task.id}>
              <span>
                {task.type === "relax" ? "Relaxation" : "Static calculation"} ·
                source energy
              </span>
              <strong>
                {num(task.energy!.rawEvCell, 7)}
                <small>eV / calculation cell</small>
              </strong>
              <p>
                {task.energy!.nAtomsCell} sites ·{" "}
                {num(task.energy!.volumeA3, 4)} Å³ · definition{" "}
                {task.energy!.definition}
              </p>
              {task.energy!.structureId && (
                <button
                  className="text-link"
                  onClick={() => {
                    selectCell(task.energy!.structureId);
                    document.getElementById("structure")?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "auto"
                        : "smooth",
                    });
                  }}
                >
                  Inspect corresponding cell <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="detail-task-list">
        {d.calculations.map((task) => {
          const settings = task.settings,
            parameters = (
              typeof settings.parameters === "object" && settings.parameters
                ? settings.parameters
                : {}
            ) as Record<string, unknown>;
          return (
            <details key={task.id} className="detail-task">
              <summary>
                <span className="detail-task-icon">
                  {task.type === "symmetry" ? (
                    <Fingerprint size={17} />
                  ) : task.type === "synthesizability" ? (
                    <Microscope size={17} />
                  ) : (
                    <FlaskConical size={17} />
                  )}
                </span>
                <span>
                  <strong>
                    {(
                      {
                        relax: "Structure relaxation",
                        static: "Static calculation",
                        symmetry: "Symmetry analysis",
                        synthesizability: "Source synthesizability record",
                      } as Record<string, string>
                    )[task.type] ?? task.type}
                  </strong>
                  <small>
                    {value(settings.codeversion)} ·{" "}
                    {task.externalIds[0] ?? task.id}
                  </small>
                </span>
                <span className="detail-task-state">
                  Source state: {task.runState}
                </span>
                <ChevronDown size={15} />
              </summary>
              <div className="detail-task-body">
                <dl className="detail-definition">
                  <div>
                    <dt>Validation</dt>
                    <dd>{task.validationState} · compatibility unverified</dd>
                  </div>
                  <div>
                    <dt>Code / version</dt>
                    <dd>{value(settings.codeversion)}</dd>
                  </div>
                  <div>
                    <dt>Calculation ID</dt>
                    <dd>
                      <code>{task.id}</code>
                    </dd>
                  </div>
                  {[
                    "ENCUT",
                    "ENMAX",
                    "EDIFF",
                    "EDIFFG",
                    "ISPIN",
                    "GGA",
                    "METAGGA",
                    "IBRION",
                    "NSW",
                    "ISIF",
                    "ISMEAR",
                    "SIGMA",
                  ]
                    .filter((k) => parameters[k] != null)
                    .map((k) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{value(parameters[k])}</dd>
                      </div>
                    ))}
                  {settings.input_pstress_kbar != null && (
                    <div>
                      <dt>Input PSTRESS</dt>
                      <dd>
                        {value(settings.input_pstress_kbar)} kbar · target
                        input, not measured pressure
                      </dd>
                    </div>
                  )}
                  {d.symmetry && task.type === "symmetry" && (
                    <>
                      <div>
                        <dt>Space group / point group</dt>
                        <dd>
                          {value(d.spaceGroup)} / {value(d.symmetry.pointGroup)}
                        </dd>
                      </div>
                      <div>
                        <dt>symprec (source)</dt>
                        <dd>{value(d.symmetry.tolerance)}</dd>
                      </div>
                      <div>
                        <dt>Cell association</dt>
                        <dd>{d.symmetry.scope}</dd>
                      </div>
                    </>
                  )}
                </dl>
                {task.structureId && (
                  <button
                    className="text-link"
                    onClick={() => {
                      selectCell(task.structureId!);
                      document.getElementById("structure")?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "auto"
                          : "smooth",
                      });
                    }}
                  >
                    View output structure <ArrowUpRight size={13} />
                  </button>
                )}
                <details className="detail-raw-data">
                  <summary>Source settings & result summary</summary>
                  <pre>
                    {JSON.stringify(
                      {
                        settings: task.settings,
                        results: task.results,
                        qualityFlags: task.qualityFlags,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </div>
            </details>
          );
        })}
      </div>
      {d.calculations.length === 0 && (
        <div className="detail-empty">
          No platform calculation results are linked to this record.
          {contribution &&
            " Submitted methods and original observations are preserved in the record metadata."}
        </div>
      )}
      <div className="detail-availability">
        {[
          {
            name: "Enthalpy & equation of state",
            description:
              "No validated pressure–energy–volume analysis is linked to this record.",
            available: false,
          },
          {
            name: "Electronic & vibrational data",
            description:
              "DOS, bands, phonons and derived properties appear when source data are available.",
            available: false,
          },
          {
            name:
              d.dataType === "property"
                ? "Reported physical property"
                : "XRD & spectroscopy",
            description: contribution?.curve
              ? "The original numerical dataset is shown above with its reported axes and units."
              : "No linked numerical diffraction or spectroscopy dataset is available.",
            available: Boolean(contribution?.curve),
          },
        ].map((item) => (
          <div key={item.name}>
            <span className="detail-availability-dot" />
            <div>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
            </div>
            <span>{item.available ? "Source data" : "Unavailable"}</span>
          </div>
        ))}
      </div>
    </>
  );
}
export function ContributionData({ detail }: { detail: MaterialDetail }) {
  const c = detail.contribution;
  if (!c)
    return (
      <div className="detail-empty">
        No structure geometry is available for this record.
      </div>
    );
  const curve = c.curve;
  if (detail.dataType === "property" && curve?.points.length === 1) {
    const [x, y] = curve.points[0];
    return (
      <div className="detail-panel detail-scalar-property">
        <div>
          <span className="detail-section-note">
            Reported physical property · {detail.origin}
          </span>
          <h3>{curve.yQuantity || "Property value"}</h3>
          <strong>
            {num(y, 6)} <small>{curve.yUnit || "Unit not reported"}</small>
          </strong>
        </div>
        <div>
          <span>{curve.xQuantity || "Reported independent variable"}</span>
          <p>
            {num(x, 6)} {curve.xUnit || "(unit not reported)"}
          </p>
          <small>
            One original numerical observation. No fit or derived result is
            inferred.
          </small>
        </div>
      </div>
    );
  }
  let path = "",
    range: [number, number, number, number] | null = null;
  if (curve?.points.length) {
    const xs = curve.points.map((p) => p[0]),
      ys = curve.points.map((p) => p[1]);
    const xmin = Math.min(...xs),
      xmax = Math.max(...xs),
      ymin = Math.min(...ys),
      ymax = Math.max(...ys);
    range = [xmin, xmax, ymin, ymax];
    path = curve.points
      .map(
        ([x, y], i) =>
          `${i ? "L" : "M"}${65 + ((x - xmin) / (xmax - xmin || 1)) * 650},${270 - ((y - ymin) / (ymax - ymin || 1)) * 220}`,
      )
      .join(" ");
  }
  return (
    <div className="detail-panel detail-original-data">
      {curve && range ? (
        <>
          <div className="detail-original-header">
            <h3>
              {detail.dataType === "property"
                ? "Reported physical property"
                : detail.dataType === "xrd"
                  ? "XRD pattern"
                  : "Raman spectrum"}
            </h3>
            <span>
              {curve.points.length.toLocaleString()} points · original order
            </span>
          </div>
          <svg
            viewBox="0 0 780 335"
            role="img"
            aria-label={`${curve.yQuantity} versus ${curve.xQuantity}, original uploaded values`}
          >
            <line x1="65" y1="50" x2="65" y2="270" stroke="#cbd5e1" />
            <line x1="65" y1="270" x2="715" y2="270" stroke="#cbd5e1" />
            {curve.points.length > 1 ? (
              <path d={path} fill="none" stroke="#467dad" strokeWidth="1.6" />
            ) : (
              <circle cx="65" cy="270" r="4" fill="#467dad" />
            )}
            <text x="65" y="292" fontSize="11" fill="#64748b">
              {num(range[0])}
            </text>
            <text x="715" y="292" textAnchor="end" fontSize="11" fill="#64748b">
              {num(range[1])}
            </text>
            <text x="55" y="55" textAnchor="end" fontSize="11" fill="#64748b">
              {num(range[3])}
            </text>
            <text x="55" y="270" textAnchor="end" fontSize="11" fill="#64748b">
              {num(range[2])}
            </text>
            <text
              x="390"
              y="323"
              textAnchor="middle"
              fontSize="12"
              fill="#475569"
            >
              {curve.xQuantity}
              {curve.xUnit ? ` (${curve.xUnit})` : " · unit not reported"}
            </text>
            <text x="68" y="28" fontSize="12" fill="#475569">
              {curve.yQuantity}
              {curve.yUnit ? ` (${curve.yUnit})` : " · unit not reported"}
            </text>
          </svg>
          <p>
            No smoothing, fitting, peak assignment or phase identification is
            applied. Original rows and units are retained.
          </p>
        </>
      ) : (
        <div className="detail-empty">
          <FileText size={25} />
          <h3>{c.file?.name ?? "Original record"}</h3>
          <p>
            {detail.dataType === "structure"
              ? "The uploaded structure file is preserved. Parsed full-cell geometry is not yet available for this contributed record; no atomic structure is inferred."
              : (c.curveError ??
                "Download the original attachment to inspect this dataset.")}
          </p>
        </div>
      )}
    </div>
  );
}
export function ContributionMetadata({ detail }: { detail: MaterialDetail }) {
  const c = detail.contribution;
  if (!c) return null;
  const r = c.record;
  return (
    <div className="detail-panel">
      <dl className="detail-definition detail-contribution-definition">
        {[
          ["Origin", detail.origin],
          ["Data type", detail.dataType],
          ["Phase identification", c.identification],
          ["Identification evidence", c.evidence],
          [
            "Pressure",
            r.pressureMode === "unreported"
              ? "Not reported"
              : `${value(r.pressureGPa)} GPa · ${value(r.pressureMode)}`,
          ],
          [
            "Temperature",
            r.temperatureMode === "reported"
              ? `${value(r.temperatureK)} K`
              : r.temperatureMode,
          ],
          ["Acquisition", r.acquisitionLabel],
          ["Acquired at", r.acquiredAt],
          ["Instrument", r.instrument],
          ["Method", r.method],
          ["Processing", r.processing],
          ["Notes", r.notes],
        ].map(([label, v]) => (
          <div key={String(label)}>
            <dt>{String(label)}</dt>
            <dd>{value(v)}</dd>
          </div>
        ))}
        {c.file && (
          <div>
            <dt>Original file / SHA-256</dt>
            <dd>
              {c.file.name}
              <code className="detail-checksum">{c.file.sha256}</code>
            </dd>
          </div>
        )}
      </dl>
      {c.curve && (
        <details className="detail-raw-data">
          <summary>
            Original numerical values · {c.curve.points.length.toLocaleString()}{" "}
            rows
          </summary>
          <pre>
            {[
              `${c.curve.xQuantity} (${c.curve.xUnit})\t${c.curve.yQuantity} (${c.curve.yUnit})`,
              ...c.curve.points.map((p) => p.join("\t")),
            ].join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}
