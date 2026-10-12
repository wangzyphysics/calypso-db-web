"use client";
import { useMemo } from "react";
import { FileText, Check, AlertCircle } from "lucide-react";
import {
  curvePoints,
  dataTypes,
  type DraftRecord,
  type DraftFile,
  type FileInspection,
} from "@/lib/materials/batch-contribution";

export function CurvePreview({
  record,
  inspection,
}: {
  record: DraftRecord;
  inspection: FileInspection;
}) {
  const result = useMemo(() => {
    try {
      return inspection.table
        ? {
            points: curvePoints(
              inspection.table,
              record.xColumn,
              record.yColumn,
              record.dataType === "property" ? 1 : 2,
            ),
          }
        : null;
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [inspection, record.xColumn, record.yColumn, record.dataType]);
  if (!result || !("points" in result))
    return (
      <div className="curve-preview-empty">
        <FileText size={22} />
        <p>
          {result?.error ??
            inspection.error ??
            "Original file retained. Numeric curve preview is unavailable."}
        </p>
      </div>
    );
  const points = result.points!;
  if (points.length === 1)
    return (
      <figure className="batch-curve-preview">
        <figcaption>
          {record.yQuantity || "Y"}
          <span>1 recorded value</span>
        </figcaption>
        <div className="batch-property-value">
          <strong>
            {points[0][1]} <small>{record.yUnit}</small>
          </strong>
          <span>
            {record.xQuantity || "X"}: {points[0][0]} {record.xUnit}
          </span>
        </div>
        <p>Original table value · no conversion</p>
      </figure>
    );
  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (const [x, y] of points) {
    xMin = Math.min(xMin, x);
    xMax = Math.max(xMax, x);
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
  const path = points
    .map(([x, y]) =>
      [
        (48 + ((x - xMin) / (xMax - xMin || 1)) * 302).toFixed(2),
        (145 - ((y - yMin) / (yMax - yMin || 1)) * 125).toFixed(2),
      ].join(","),
    )
    .join(" ");
  return (
    <figure className="batch-curve-preview">
      <figcaption>
        {record.yQuantity || "Y"}
        {record.yUnit && " (" + record.yUnit + ")"}
        <span>{points.length.toLocaleString()} points</span>
      </figcaption>
      <svg
        viewBox="0 0 380 185"
        role="img"
        aria-label={
          dataTypes[record.dataType] + " preview from original numeric values"
        }
      >
        <path d="M48 20V145H350" fill="none" stroke="#dce5ee" />
        <line x1="48" y1="82.5" x2="350" y2="82.5" stroke="#eef2f7" />
        <polyline
          points={path}
          stroke="#426b93"
          strokeWidth="1.4"
          fill="none"
        />
        <text x="42" y="25" textAnchor="end">
          {yMax.toPrecision(3)}
        </text>
        <text x="42" y="145" textAnchor="end">
          {yMin.toPrecision(3)}
        </text>
        <text x="48" y="163">
          {xMin.toPrecision(3)}
        </text>
        <text x="350" y="163" textAnchor="end">
          {xMax.toPrecision(3)}
        </text>
        <text x="199" y="180" textAnchor="middle">
          {record.xQuantity || "X"}
          {record.xUnit && " (" + record.xUnit + ")"}
        </text>
      </svg>
      <p>Original values in file order · no smoothing or fitting</p>
    </figure>
  );
}

export function ContributionRecordEditor({
  record,
  file,
  inspection,
  records,
  issues,
  update,
}: {
  record: DraftRecord;
  file: DraftFile;
  inspection: FileInspection;
  records: DraftRecord[];
  issues: string[];
  update: (patch: Partial<DraftRecord>) => void;
}) {
  const curve = ["raman", "xrd", "property"].includes(record.dataType);
  const field = (
    label: string,
    key: keyof DraftRecord,
    placeholder = "",
    numeric = false,
  ) => (
    <label>
      {label}
      <input
        value={String(record[key])}
        onChange={(e) => update({ [key]: e.target.value })}
        placeholder={placeholder}
        type={numeric ? "number" : "text"}
        step={numeric ? "any" : undefined}
        maxLength={300}
      />
    </label>
  );
  return (
    <aside className="record-editor" aria-label="Selected record editor">
      <div className="record-editor-heading">
        <div>
          <span className="eyebrow">{record.id}</span>
          <h3>Record context</h3>
        </div>
        <span className="record-check-badge">
          {issues.length ? <AlertCircle size={13} /> : <Check size={13} />}
          {issues.length ? "Needs context" : "Format ready"}
        </span>
      </div>
      <p className="record-original-path">{file.path}</p>
      <div className="record-field-grid">
        <label>
          Data origin
          <select
            value={record.origin}
            onChange={(e) =>
              update({ origin: e.target.value as DraftRecord["origin"] })
            }
          >
            <option value="experimental">Experimental</option>
            <option value="theoretical">Theoretical</option>
          </select>
        </label>
        <label>
          Data type
          <select
            value={record.dataType}
            onChange={(e) =>
              update({ dataType: e.target.value as DraftRecord["dataType"] })
            }
          >
            {Object.entries(dataTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {field(
          "Sample ID",
          "sampleId",
          "Your sample or calculation identifier",
        )}
        {field("Chemical formula", "formula", "e.g. Fe₂O₃")}
        {field(
          "Recorded pressure (GPa)",
          "pressureGPa",
          "Actual recorded value",
          true,
        )}
        {field(
          "Temperature (K)",
          "temperatureK",
          record.origin === "experimental"
            ? "Measurement temperature"
            : "Optional",
          true,
        )}
      </div>
      <div className="record-field-grid">
        {field(
          "Phase assignment · optional",
          "phaseLabel",
          "Leave blank if not established",
        )}
        <label>
          Related structure · optional
          <select
            value={record.structureRecordId}
            onChange={(e) => update({ structureRecordId: e.target.value })}
          >
            <option value="">No structure association</option>
            {records
              .filter((r) => r.id !== record.id && r.dataType === "structure")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.sampleId || "sample not set"}
                </option>
              ))}
          </select>
        </label>
      </div>
      {record.structureRecordId && (
        <p className="form-note">
          A declared association does not establish phase identity. Different
          conditions and experimental/theoretical origins remain separate.
        </p>
      )}
      {curve && (
        <>
          <div className="record-subheading">
            {record.dataType === "property"
              ? "Property coordinates"
              : "Curve coordinates"}
          </div>
          <div className="record-field-grid">
            {(["xColumn", "yColumn"] as const).map((key, i) => (
              <label key={key}>
                {i ? "Y column" : "X column"}
                <select
                  value={record[key]}
                  onChange={(e) => update({ [key]: Number(e.target.value) })}
                >
                  {(inspection.table?.columns ?? ["Column 1", "Column 2"]).map(
                    (column, index) => (
                      <option value={index} key={index}>
                        {column}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ))}
            {field(
              "X quantity",
              "xQuantity",
              record.dataType === "xrd"
                ? "2θ, d-spacing or q"
                : "Raman shift, temperature…",
            )}
            {field("X unit", "xUnit", "cm⁻¹, degree, K…")}
            {field("Y quantity", "yQuantity", "Intensity or property name")}
            {field("Y unit", "yUnit", "a.u., Ω·m…")}
          </div>
          <label>
            Processing state
            <select
              value={record.processing}
              onChange={(e) =>
                update({
                  processing: e.target.value as DraftRecord["processing"],
                })
              }
            >
              <option value="raw">Raw / unprocessed</option>
              <option value="processed">Processed / derived</option>
            </select>
          </label>
          <CurvePreview record={record} inspection={inspection} />
        </>
      )}
      {record.dataType === "structure" && (
        <div className="structure-preflight">
          {inspection.structureChecks?.map((check) => (
            <span key={check}>
              <Check size={13} />
              {check}
            </span>
          ))}
          <p>
            {inspection.error ??
              "Basic format checks only. Scientific validity and symmetry require review."}
          </p>
        </div>
      )}
      {record.dataType === "attachment" && (
        <div className="curve-preview-empty">
          <FileText size={21} />
          <p>
            Original instrument files and images are retained as attachments.
            This page does not interpret them.
          </p>
        </div>
      )}
      <label>
        {record.origin === "experimental"
          ? "Measurement method & setup"
          : "Original calculation method"}
        <textarea
          rows={3}
          value={record.method}
          maxLength={10000}
          onChange={(e) => update({ method: e.target.value })}
          placeholder={
            record.origin === "experimental"
              ? "Instrument, wavelength, geometry, calibration, uncertainties and processing; state what was not reported."
              : "VASP version, functional, potentials, sampling, cutoff, spin treatment and convergence settings."
          }
        />
      </label>
      <label>
        Data source / reference
        <textarea
          rows={2}
          value={record.source}
          maxLength={4000}
          onChange={(e) => update({ source: e.target.value })}
          placeholder="Original measurement/calculation, dataset or publication; attribution and ownership."
        />
      </label>
      <label>
        Scientific notes · optional
        <textarea
          rows={2}
          value={record.notes}
          maxLength={10000}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Uncertainty, phase assignment, processing details and limitations."
        />
      </label>
      {issues.length > 0 && (
        <div className="record-context-issues">
          <strong>Before submission</strong>
          <ul>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <p>Incomplete records can still be saved as local drafts.</p>
        </div>
      )}
      <p className="record-checksum">SHA-256 · {file.sha256}</p>
    </aside>
  );
}
