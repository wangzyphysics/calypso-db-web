import { batchSchema, importBatchDraft, newBatch, type BatchDraft } from "./batch-contribution.ts";

/** A teaching catalog. These are not materials records and never populate API statistics. */
export const contributionExamples = [
  { id: "structure", title: "Crystal structure · 结构", family: "Structure & spectra", description: "CIF/POSCAR context and a theoretical target-pressure example.", format: "POSCAR · theoretical", limitation: "Basic syntax only; the geometry is synthetic.", records: ["tutorial-structure"] },
  { id: "xrd", title: "XRD · X 射线衍射", family: "Structure & spectra", description: "2θ and intensity with explicit coordinate units.", format: "XRD pattern · numerical curve", limitation: "Record wavelength, calibration and geometry in the method.", records: ["tutorial-xrd"] },
  { id: "raman", title: "Raman · 拉曼", family: "Structure & spectra", description: "Two acquisitions sharing one original file, with different Y columns.", format: "Raman spectrum · repeated acquisitions", limitation: "Each acquisition retains its own method and context.", records: ["tutorial-raman-1", "tutorial-raman-2"] },
  { id: "infrared", title: "Infrared · 红外", family: "Structure & spectra", description: "Wavenumber and absorbance, with a dimensionless Y unit.", format: "Physical property · curve", limitation: "Generic property workaround; a dedicated IR category is pending.", records: ["tutorial-ir-workaround"] },
  { id: "luminescence", title: "Luminescence · 发光", family: "Physical properties", description: "A wavelength–intensity curve with a named optical property.", format: "Physical property · curve", limitation: "Add excitation, power and collection details to the method.", records: ["tutorial-pl"] },
  { id: "photoelectric", title: "Photoelectric · 光电", family: "Physical properties", description: "Photocurrent versus applied voltage, including a recorded zero.", format: "Physical property · curve", limitation: "Document illumination, wavelength, power and device geometry.", records: ["tutorial-photoelectric"] },
  { id: "polarization", title: "Polarization · 极化", family: "Physical properties", description: "A P–E scan that preserves repeated X values and acquisition order.", format: "Physical property · curve", limitation: "Specify direction, reference frame and frequency; no vector reconstruction.", records: ["tutorial-polarization"] },
  { id: "dielectric", title: "Dielectric · 介电", family: "Physical properties", description: "Real and imaginary curves share a file; a separate one-row value is included.", format: "Physical property · curves + scalar", limitation: "Frequency and component metadata are still free text; no full tensor model.", records: ["tutorial-dielectric-real", "tutorial-dielectric-imag", "tutorial-dielectric-scalar"] },
  { id: "nonlinear", title: "Nonlinear optics · 非线性光学", family: "Physical properties", description: "A declared χ⁽²⁾zzz component, with its coordinate and unit.", format: "Physical property · one component", limitation: "One component is not a full tensor. Specify convention, frame and frequencies.", records: ["tutorial-nlo-component"] },
  { id: "carrier", title: "Carrier concentration · 载流子浓度", family: "Physical properties", description: "One-row values for two independent teaching phases.", format: "Physical property · scalar CSV", limitation: "Direct scalar entry is pending. Do not invent a coordinate to fill the CSV.", records: ["tutorial-carrier-scalar", "tutorial-metal-carrier"] },
  { id: "superconductivity", title: "Superconductivity · 超导相关", family: "Physical properties", description: "An R(T) scan and a declared Tc value, without assigning Tc as the sample temperature.", format: "Physical property · curve + scalar", limitation: "The scan/criterion model is pending; these synthetic data do not establish superconductivity.", records: ["tutorial-resistance-temperature", "tutorial-tc-scalar"] },
  { id: "batch", title: "Mixed batch · 混合批量上传", family: "Batch import", description: "Two phases, four conditions, 17 records and 15 files, including an original attachment.", format: "CSV manifest + ZIP", limitation: "Explicit phase_key and condition_key establish grouping; names and values do not.", records: [] },
] as const;
export type ContributionExampleId = typeof contributionExamples[number]["id"];
export function contributionExample(id: string | null) {
  return contributionExamples.find(example => example.id === id);
}
export const exampleDataPath = "/upload-examples/examples-v1.json";

/** Validate and clone a curated example. No owner data or scientific values are sent to the example asset. */
export async function prepareContributionExample(raw: unknown, id: string): Promise<BatchDraft> {
  const example = contributionExample(id);
  if (!example) throw new Error("Unknown teaching example.");
  const source = batchSchema.parse(raw);
  if (!source.exampleOnly) throw new Error("This asset is not marked as a teaching example.");
  const ids: readonly string[] = example.records;
  const records = ids.length ? source.records.filter(record => ids.includes(record.id)) : source.records;
  if (!records.length || (ids.length && records.length !== ids.length)) throw new Error("The teaching example is incomplete.");
  const phaseIds = new Set(records.map(record => record.phaseId));
  const conditionIds = new Set(records.map(record => record.conditionId));
  const fileIds = new Set(records.map(record => record.fileId));
  return importBatchDraft({
    ...source, title: "Teaching example · " + example.title, exampleOnly: true,
    records, phases: source.phases.filter(phase => phaseIds.has(phase.id)),
    conditions: source.conditions.filter(condition => conditionIds.has(condition.id)),
    files: source.files.filter(file => fileIds.has(file.id)),
    contributor: newBatch().contributor, permissionConfirmed: false,
    computationRequested: false, visibility: "private", manifestText: "",
  });
}
