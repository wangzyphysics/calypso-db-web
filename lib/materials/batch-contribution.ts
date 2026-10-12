import { z } from "zod";
import { reviewStructureFile } from "./contribution.ts";
import { normalizeSearch } from "./search.ts";

export const batchLimits = {
  files: 100,
  records: 300,
  fileBytes: 10 * 1024 * 1024,
  totalBytes: 50 * 1024 * 1024,
  curveRows: 10000,
};
export const dataTypes = {
  structure: "Crystal structure",
  raman: "Raman spectrum",
  xrd: "XRD pattern",
  property: "Physical property",
  attachment: "Original attachment",
} as const;
export type DataType = keyof typeof dataTypes;
export type Origin = "experimental" | "theoretical";
export type Visibility = "private" | "public-after-review";
const shortText = z.string().max(300);
export const recordSchema = z.object({
  id: shortText.min(1),
  fileId: shortText.min(1),
  origin: z.enum(["experimental", "theoretical"]),
  dataType: z.enum(["structure", "raman", "xrd", "property", "attachment"]),
  sampleId: shortText,
  formula: shortText,
  pressureGPa: shortText,
  temperatureK: shortText,
  phaseLabel: shortText,
  structureRecordId: shortText,
  method: z.string().max(10000),
  source: z.string().max(4000),
  processing: z.enum(["raw", "processed"]),
  notes: z.string().max(10000).default(""),
  xQuantity: shortText,
  xUnit: shortText,
  yQuantity: shortText,
  yUnit: shortText,
  xColumn: z.number().int().min(0).max(63),
  yColumn: z.number().int().min(0).max(63),
});
const fileSchema = z.object({
  id: shortText.min(1),
  path: shortText.min(1),
  size: z.number().int().min(1).max(batchLimits.fileBytes),
  mediaType: shortText,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  contentBase64: z.string().max(Math.ceil(batchLimits.fileBytes / 3) * 4),
});
export const batchSchema = z
  .object({
    schemaVersion: z.literal(2),
    kind: z.literal("contribution-batch"),
    status: z.literal("local-draft"),
    id: shortText.min(1),
    title: shortText.min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    visibility: z.enum(["private", "public-after-review"]),
    contributor: z.object({ name: shortText, email: shortText }),
    permissionConfirmed: z.boolean(),
    computationRequested: z.boolean(),
    manifestText: z
      .string()
      .max(1024 * 1024)
      .default(""),
    files: z.array(fileSchema).max(batchLimits.files),
    records: z.array(recordSchema).max(batchLimits.records),
  })
  .superRefine((batch, ctx) => {
    const ids = batch.files.map((f) => f.id);
    if (
      new Set(ids).size !== ids.length ||
      new Set(batch.files.map((f) => f.path)).size !== ids.length
    )
      ctx.addIssue({
        code: "custom",
        message: "File identities and paths must be unique.",
      });
    if (new Set(batch.records.map((r) => r.id)).size !== batch.records.length)
      ctx.addIssue({
        code: "custom",
        message: "Record IDs must be unique within a batch.",
      });
    if (batch.files.reduce((n, f) => n + f.size, 0) > batchLimits.totalBytes)
      ctx.addIssue({
        code: "custom",
        message: "A batch can hold at most 50 MiB.",
      });
    if (batch.records.some((r) => !ids.includes(r.fileId)))
      ctx.addIssue({
        code: "custom",
        message: "A record references a missing file.",
      });
  });
export type BatchDraft = z.infer<typeof batchSchema>;
export type DraftRecord = z.infer<typeof recordSchema>;
export type DraftFile = z.infer<typeof fileSchema>;
export type CurveTable = { columns: string[]; rows: string[][] };
export type FileInspection = {
  table?: CurveTable;
  structureChecks?: string[];
  error?: string;
};

export function newBatch(): BatchDraft {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    kind: "contribution-batch",
    status: "local-draft",
    id: crypto.randomUUID(),
    title: "Untitled contribution",
    createdAt: now,
    updatedAt: now,
    visibility: "private",
    contributor: { name: "", email: "" },
    permissionConfirmed: false,
    computationRequested: false,
    manifestText: "",
    files: [],
    records: [],
  };
}
export function defaultRecord(
  fileId: string,
  index: number,
  origin: Origin,
  dataType: DataType,
): DraftRecord {
  return {
    id: "record-" + index,
    fileId,
    origin,
    dataType,
    sampleId: "",
    formula: "",
    pressureGPa: "",
    temperatureK: "",
    phaseLabel: "",
    structureRecordId: "",
    method: "",
    source: "",
    processing: "raw",
    notes: "",
    xQuantity:
      dataType === "raman" ? "Raman shift" : dataType === "xrd" ? "2θ" : "",
    xUnit: dataType === "raman" ? "cm⁻¹" : dataType === "xrd" ? "degree" : "",
    yQuantity: dataType === "raman" || dataType === "xrd" ? "Intensity" : "",
    yUnit: dataType === "raman" || dataType === "xrd" ? "a.u." : "",
    xColumn: 0,
    yColumn: 1,
  };
}
export function safePath(path: string) {
  const normalized = path.replaceAll("\\", "/");
  if (
    !normalized ||
    normalized.length > 300 ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.split("/").some((p) => !p || p === "." || p === "..") ||
    /[\u0000-\u001f]/.test(normalized)
  )
    throw new Error(
      "Use safe relative file paths without parent-directory segments.",
    );
  return normalized;
}
export function bytesToBase64(bytes: Uint8Array) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
export function fileBytes(file: DraftFile) {
  const text = atob(file.contentBase64);
  const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
  if (bytes.byteLength !== file.size)
    throw new Error(
      "File size does not match its original bytes: " + file.path,
    );
  return bytes;
}
export async function hashBytes(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return [...new Uint8Array(digest)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function makeDraftFile(
  path: string,
  bytes: Uint8Array,
  mediaType = "",
): Promise<DraftFile> {
  if (!bytes.length || bytes.length > batchLimits.fileBytes)
    throw new Error("Each file must be nonempty and no larger than 10 MiB.");
  return {
    id: crypto.randomUUID(),
    path: safePath(path),
    size: bytes.length,
    mediaType,
    sha256: await hashBytes(bytes),
    contentBase64: bytesToBase64(bytes),
  };
}
export function decodeFile(file: DraftFile) {
  return new TextDecoder("utf-8", { fatal: true }).decode(fileBytes(file));
}

/** CSV quoting, including embedded newlines; tab/semicolon and XY whitespace are explicit delimiters. */
export function parseDelimited(text: string, delimiter = ","): string[][] {
  text = text.replace(/^\uFEFF/, "");
  if (delimiter === "whitespace")
    return text
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith("#"))
      .map((l) => l.trim().split(/\s+/));
  const rows: string[][] = [],
    row: string[] = [];
  let cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else cell += char;
    } else if (char === '"' && !cell && !closed) quoted = true;
    else if (char === delimiter || char === "\n" || char === "\r") {
      row.push(cell.trim());
      cell = "";
      closed = false;
      if (char !== delimiter) {
        if (row.some((v) => v !== "")) rows.push([...row]);
        row.length = 0;
        if (char === "\r" && text[i + 1] === "\n") i++;
      }
    } else {
      if (closed && char.trim())
        throw new Error("Unexpected text after a quoted CSV field.");
      cell += char;
    }
    if (rows.length > batchLimits.curveRows + 1 || row.length > 64)
      throw new Error("Table exceeds 10,000 rows or 64 columns.");
  }
  if (quoted) throw new Error("The CSV contains an unterminated quoted field.");
  row.push(cell.trim());
  if (row.some((v) => v !== "")) rows.push(row);
  if (
    rows.length > batchLimits.curveRows + 1 ||
    rows.some((r) => r.length > 64)
  )
    throw new Error("Table exceeds the preview limits.");
  return rows;
}
const numericCell = (value: string | undefined) =>
  value !== undefined &&
  /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eEdD][+-]?\d+)?$/.test(value.trim());
export function curveTable(text: string): CurveTable {
  const cleaned = text
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith("#"))
    .join("\n");
  const first = cleaned.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const delimiter = first.includes("\t")
    ? "\t"
    : first.includes(",")
      ? ","
      : first.includes(";")
        ? ";"
        : "whitespace";
  const rows = parseDelimited(cleaned, delimiter);
  if (!rows.length || rows[0].length < 2)
    throw new Error("A curve needs at least two columns.");
  const header = rows[0].every((v) => v !== "" && !numericCell(v));
  const columns = header
    ? rows.shift()!
    : rows[0].map((_, i) => "Column " + (i + 1));
  if (columns.length > 64)
    throw new Error("Preview supports at most 64 columns.");
  if (new Set(columns).size !== columns.length)
    throw new Error("Column names must be unique.");
  if (rows.length > batchLimits.curveRows)
    throw new Error("Preview supports at most 10,000 points per curve.");
  if (rows.some((r) => r.length !== columns.length))
    throw new Error("All table rows must have the same column count.");
  return { columns, rows };
}
export function curvePoints(
  table: CurveTable,
  xColumn: number,
  yColumn: number,
  minimumRows: 1 | 2 = 2,
): [number, number][] {
  if (xColumn === yColumn || !table.columns[xColumn] || !table.columns[yColumn])
    throw new Error("Choose two distinct, available columns.");
  if (table.rows.length < minimumRows)
    throw new Error(
      minimumRows === 2
        ? "A curve needs at least two data points."
        : "A property needs at least one recorded value.",
    );
  return table.rows.map((row, index) => {
    if (!numericCell(row[xColumn]) || !numericCell(row[yColumn]))
      throw new Error(
        "Missing or nonnumeric curve value at data row " + (index + 1) + ".",
      );
    const values: [number, number] = [
      Number(row[xColumn].replace(/[dD]/, "e")),
      Number(row[yColumn].replace(/[dD]/, "e")),
    ];
    if (!values.every(Number.isFinite))
      throw new Error("Curve values must be finite.");
    return values;
  });
}
export function inspectFile(file: DraftFile): FileInspection {
  try {
    const name = file.path.split("/").pop()!;
    if (/\.cif$|\.vasp$|\.poscar$|^POSCAR$/i.test(name))
      return {
        structureChecks: reviewStructureFile(
          name,
          decodeFile(file),
          batchLimits.fileBytes,
        ).checks,
      };
    if (/\.(csv|txt|xy|tsv)$/i.test(name))
      return { table: curveTable(decodeFile(file)) };
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "The file could not be parsed.",
    };
  }
}
export function recordIssues(
  record: DraftRecord,
  file: DraftFile,
  inspection: FileInspection,
  records: DraftRecord[],
): string[] {
  const issues: string[] = [];
  if (!record.sampleId.trim()) issues.push("Add a sample ID.");
  try {
    if (!record.formula.trim()) throw new Error();
    normalizeSearch(record.formula, "formula");
  } catch {
    issues.push("Add a valid chemical formula.");
  }
  if (!record.source.trim())
    issues.push("Add provenance or a source reference.");
  if (!record.method.trim())
    issues.push(
      record.origin === "experimental"
        ? "Describe the measurement method."
        : "Describe the original calculation method.",
    );
  if (
    record.pressureGPa.trim() === "" ||
    !Number.isFinite(Number(record.pressureGPa))
  )
    issues.push("Add the actual pressure in GPa.");
  if (
    record.temperatureK.trim() &&
    (!Number.isFinite(Number(record.temperatureK)) ||
      Number(record.temperatureK) < 0)
  )
    issues.push("Temperature must be a nonnegative value in K.");
  if (record.origin === "experimental" && !record.temperatureK.trim())
    issues.push("Add the measurement temperature in K.");
  if (record.dataType === "structure") {
    if (!inspection.structureChecks)
      issues.push(inspection.error ?? "Choose a CIF or POSCAR structure file.");
  } else if (record.dataType !== "attachment") {
    if (!inspection.table)
      issues.push(
        inspection.error ??
          "Choose a numeric CSV, TXT, TSV or XY table; other formats can be stored as attachments.",
      );
    else {
      try {
        curvePoints(
          inspection.table,
          record.xColumn,
          record.yColumn,
          record.dataType === "property" ? 1 : 2,
        );
      } catch (e) {
        issues.push((e as Error).message);
      }
    }
    if (
      ![record.xQuantity, record.xUnit, record.yQuantity, record.yUnit].every(
        (v) => v.trim(),
      )
    )
      issues.push("Describe both axes and their units.");
  }
  if (record.structureRecordId) {
    const linked = records.find((r) => r.id === record.structureRecordId);
    if (!linked || linked.dataType !== "structure" || linked.id === record.id)
      issues.push("The linked structure record is unavailable.");
    else if (linked.sampleId !== record.sampleId)
      issues.push("Linked records need the same declared sample ID.");
  }
  if (!file.size) issues.push("The original file is empty.");
  return issues;
}
export function batchReadiness(
  batch: BatchDraft,
  inspections: Record<string, FileInspection>,
) {
  const byFile = new Map(batch.files.map((f) => [f.id, f]));
  const issues = Object.fromEntries(
    batch.records.map((r) => [
      r.id,
      recordIssues(
        r,
        byFile.get(r.fileId)!,
        inspections[r.fileId] ?? {},
        batch.records,
      ),
    ]),
  );
  const batchIssues: string[] = [];
  if (!batch.contributor.name.trim())
    batchIssues.push("Add the contributor name.");
  if (!z.string().email().safeParse(batch.contributor.email).success)
    batchIssues.push("Add a valid contact email.");
  if (!batch.permissionConfirmed)
    batchIssues.push(
      "Confirm permission to provide the data under the chosen visibility.",
    );
  if (!batch.records.length)
    batchIssues.push("Add at least one scientific record.");
  return {
    issues,
    batchIssues,
    ready: batch.records.filter((r) => !issues[r.id].length).length,
  };
}
export const manifestColumns = [
  "record_id",
  "file",
  "origin",
  "data_type",
  "sample_id",
  "formula",
  "pressure_gpa",
  "temperature_k",
  "phase_label",
  "structure_record_id",
  "processing",
  "x_quantity",
  "x_unit",
  "y_quantity",
  "y_unit",
  "x_column",
  "y_column",
  "method",
  "source",
  "notes",
];
export function manifestTemplate() {
  return manifestColumns.join(",") + "\n";
}
/** A manifest is explicit association, not phase identification inferred from filenames. */
export function applyManifest(text: string, files: DraftFile[]): DraftRecord[] {
  const rows = parseDelimited(text);
  const headings = rows.shift()?.map((x) => x.toLowerCase()) ?? [];
  if (
    new Set(headings).size !== headings.length ||
    !["record_id", "file", "origin", "data_type"].every((h) =>
      headings.includes(h),
    )
  )
    throw new Error(
      "The manifest needs unique record_id, file, origin and data_type columns.",
    );
  if (headings.some((h) => !manifestColumns.includes(h)))
    throw new Error("Use the downloaded manifest's column names.");
  if (!rows.length || rows.length > batchLimits.records)
    throw new Error("A manifest needs 1–300 records.");
  const inspections = new Map<string, FileInspection>();
  const result = rows.map((row, index) => {
    if (row.length !== headings.length)
      throw new Error(
        "Manifest column count mismatch at row " + (index + 2) + ".",
      );
    const entry = Object.fromEntries(headings.map((h, i) => [h, row[i]]));
    const path = safePath(entry.file);
    const exact = files.filter((f) => f.path === path);
    const matches = exact.length
      ? exact
      : files.filter((f) => f.path.split("/").pop() === path);
    if (matches.length !== 1)
      throw new Error(
        "File missing or ambiguous for manifest record " +
          entry.record_id +
          ": " +
          path,
      );
    const file = matches[0];
    const record = defaultRecord(
      file.id,
      index + 1,
      entry.origin as Origin,
      entry.data_type as DataType,
    );
    if (!inspections.has(file.id)) inspections.set(file.id, inspectFile(file));
    const table = inspections.get(file.id)?.table;
    const column = (value: string | undefined, fallback: number) => {
      if (!value) return fallback;
      if (/^\d+$/.test(value)) return Number(value); // zero-based indices
      const found = table?.columns.indexOf(value) ?? -1;
      if (found < 0) throw new Error("Column not found: " + value);
      return found;
    };
    return recordSchema.parse({
      ...record,
      id: entry.record_id,
      sampleId: entry.sample_id ?? "",
      formula: entry.formula ?? "",
      pressureGPa: entry.pressure_gpa ?? "",
      temperatureK: entry.temperature_k ?? "",
      phaseLabel: entry.phase_label ?? "",
      structureRecordId: entry.structure_record_id ?? "",
      method: entry.method ?? "",
      source: entry.source ?? "",
      notes: entry.notes ?? "",
      processing: entry.processing || "raw",
      xQuantity: entry.x_quantity ?? record.xQuantity,
      xUnit: entry.x_unit ?? record.xUnit,
      yQuantity: entry.y_quantity ?? record.yQuantity,
      yUnit: entry.y_unit ?? record.yUnit,
      xColumn: column(entry.x_column, 0),
      yColumn: column(entry.y_column, 1),
    });
  });
  if (new Set(result.map((r) => r.id)).size !== result.length)
    throw new Error("Manifest record IDs must be unique.");
  const unused = files.filter((f) => !result.some((r) => r.fileId === f.id));
  if (unused.length)
    throw new Error(
      "Include all files in the manifest, using attachment for original files. Unmapped: " +
        unused.map((f) => f.path).join(", "),
    );
  return result;
}
export async function importBatchDraft(value: unknown): Promise<BatchDraft> {
  const old = value as {
    schemaVersion?: number;
    status?: string;
    metadata?: Record<string, unknown>;
    structure?: { fileName: string; content: string; sha256?: string };
  };
  let batch: BatchDraft;
  if (
    old.schemaVersion === 1 &&
    old.status === "local-draft" &&
    old.metadata &&
    old.structure
  ) {
    const m = old.metadata,
      file = await makeDraftFile(
        old.structure.fileName,
        new TextEncoder().encode(old.structure.content),
        "text/plain",
      );
    if (
      old.structure.sha256 !== undefined &&
      old.structure.sha256 !== file.sha256
    )
      throw new Error("Legacy structure text checksum mismatch.");
    batch = {
      ...newBatch(),
      title: "Imported structure draft",
      contributor: {
        name: String(m.contributorName ?? ""),
        email: String(m.email ?? ""),
      },
      permissionConfirmed: false,
      files: [file],
      records: [
        {
          ...defaultRecord(file.id, 1, "theoretical", "structure"),
          formula: String(m.formula ?? ""),
          pressureGPa: String(m.pressureGPa ?? ""),
          method: String(m.calculationMethod ?? ""),
          source: String(m.source ?? ""),
          notes: String(m.notes ?? ""),
        },
      ],
    };
  } else batch = batchSchema.parse(value);
  for (const file of batch.files) {
    safePath(file.path);
    if ((await hashBytes(fileBytes(file))) !== file.sha256)
      throw new Error("Original file checksum mismatch: " + file.path);
  }
  return batchSchema.parse({
    ...batch,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
