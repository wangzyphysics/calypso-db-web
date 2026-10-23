import { z } from "zod";

export const vectorSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);
export const cellSchema = z
  .object({
    id: z.string(),
    role: z.string(),
    lattice: z.tuple([vectorSchema, vectorSchema, vectorSchema]),
    sites: z
      .array(
        z.object({
          frac_coords: vectorSchema,
          species: z
            .array(
              z.object({
                element: z.string().regex(/^[A-Z][a-z]?$/),
                occupancy: z.number().positive().max(1),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
    volumeA3: z.number().positive(),
    siteCount: z.number().int().positive(),
    composition: z.record(z.number()),
  })
  .refine(
    (c) => c.sites.length === c.siteCount,
    "Cell site count does not match its coordinates.",
  )
  .refine(
    (c) =>
      c.sites.every(
        (s) => s.species.reduce((n, sp) => n + sp.occupancy, 0) <= 1 + 1e-8,
      ),
    "Site occupancy exceeds one.",
  )
  .refine((c) => {
    const [a, b, d] = c.lattice;
    const volume = Math.abs(
      a[0] * (b[1] * d[2] - b[2] * d[1]) -
        a[1] * (b[0] * d[2] - b[2] * d[0]) +
        a[2] * (b[0] * d[1] - b[1] * d[0]),
    );
    return (
      volume > 1e-9 &&
      Math.abs(volume - c.volumeA3) <= Math.max(1e-6, c.volumeA3 * 1e-5)
    );
  }, "Lattice and volume are inconsistent.");
const relatedSchema = z.object({
  recordId: z.string(),
  materialId: z.string(),
  formula: z.string(),
  phaseLabel: z.string().nullable(),
  pressureGPa: z.number().finite().nullable(),
});
export const detailSchema = z
  .object({
    recordId: z.string(),
    materialId: z.string(),
    formula: z.string(),
    phaseId: z.string().nullable(),
    phaseLabel: z.string().nullable(),
    spaceGroup: z.string().nullable(),
    spaceGroupNumber: z.number().nullable(),
    crystalSystem: z.string().nullable(),
    pressureGPa: z.number().finite().nullable(),
    pressureStatus: z.string(),
    temperatureK: z.number().finite().nullable(),
    temperatureStatus: z.string(),
    provenance: z.enum(["imported", "contributed"]),
    dataType: z.string(),
    origin: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    externalIds: z.array(z.string()),
    cells: z.array(cellSchema),
    defaultCellId: z.string().nullable(),
    symmetry: z
      .object({
        scope: z.string(),
        pointGroup: z.string().nullable(),
        tolerance: z.number().nullable(),
        codeVersion: z.string().nullable(),
      })
      .nullable(),
    calculations: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        runState: z.string(),
        validationState: z.string(),
        selected: z.boolean(),
        structureId: z.string().nullable(),
        externalIds: z.array(z.string()),
        settings: z.record(z.unknown()),
        energy: z
          .object({
            rawEvCell: z.number().finite(),
            definition: z.string(),
            structureId: z.string(),
            nAtomsCell: z.number().positive(),
            volumeA3: z.number().positive(),
          })
          .nullable(),
        results: z.record(z.unknown()),
        qualityFlags: z.array(z.string()),
      }),
    ),
    sources: z.array(
      z.object({
        id: z.string(),
        externalId: z.string(),
        label: z.string(),
        license: z.string().nullable(),
        reference: z.record(z.union([z.string(), z.number()])).nullable(),
        metadata: z.record(z.unknown()),
      }),
    ),
    relatedRecords: z.array(relatedSchema),
    relatedHasMore: z.boolean(),
    phaseDefinition: z.string(),
    contribution: z
      .object({
        batchId: z.string(),
        batchTitle: z.string(),
        access: z.string(),
        reviewStatus: z.string(),
        visibility: z.string(),
        identification: z.string(),
        evidence: z.string(),
        record: z.record(z.union([z.string(), z.number(), z.boolean()])),
        attribution: z.record(z.string()),
        file: z
          .object({ name: z.string(), size: z.number(), sha256: z.string() })
          .nullable(),
        curve: z
          .object({
            points: z.array(
              z.tuple([z.number().finite(), z.number().finite()]),
            ),
            xQuantity: z.string(),
            xUnit: z.string(),
            yQuantity: z.string(),
            yUnit: z.string(),
          })
          .nullable(),
        curveError: z.string().nullable(),
      })
      .nullable(),
  })
  .refine(
    (d) =>
      d.defaultCellId === null || d.cells.some((c) => c.id === d.defaultCellId),
    "Default cell is missing.",
  );
export type MaterialDetail = z.infer<typeof detailSchema>;
export type StructureCell = z.infer<typeof cellSchema>;
export type Vector3 = z.infer<typeof vectorSchema>;
export const cellLabels: Record<string, string> = {
  display_unit_cell: "Display cell",
  relax_output: "Relaxed calculation cell",
  static_output: "Static calculation cell",
};
export function detailHref(recordId: string) {
  return "/materials/" + encodeURIComponent(recordId);
}
export function downloadHref(
  base: string,
  recordId: string,
  format: string,
  cell?: string,
) {
  const params = new URLSearchParams({ format });
  if (cell) params.set("cell", cell);
  return (
    base.replace(/\/+$/, "") +
    "/records/" +
    encodeURIComponent(recordId) +
    "/download?" +
    params
  );
}
export function dot(a: Vector3, b: Vector3) {
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}
export function magnitude(a: Vector3) {
  return Math.sqrt(dot(a, a));
}
export function fractionalToCartesian(
  frac: Vector3,
  lattice: StructureCell["lattice"],
): Vector3 {
  return [0, 1, 2].map((i) =>
    frac.reduce((sum, value, j) => sum + value * lattice[j][i], 0),
  ) as Vector3;
}
/** Orthonormal camera basis: a points right, b lies in the xy plane. Distances are unchanged. */
export function orientForView(
  vector: Vector3,
  lattice: StructureCell["lattice"],
): Vector3 {
  const [a, b] = lattice,
    x = a.map((v) => v / magnitude(a)) as Vector3;
  const projected = dot(b, x),
    perpendicular = b.map((v, i) => v - projected * x[i]) as Vector3;
  const y = perpendicular.map((v) => v / magnitude(perpendicular)) as Vector3;
  const z: Vector3 = [
    x[1] * y[2] - x[2] * y[1],
    x[2] * y[0] - x[0] * y[2],
    x[0] * y[1] - x[1] * y[0],
  ];
  return [dot(vector, x), dot(vector, y), dot(vector, z)];
}
export function latticeMetrics(lattice: StructureCell["lattice"]) {
  const [a, b, c] = lattice;
  const angle = (u: Vector3, v: Vector3) =>
    (Math.acos(
      Math.max(-1, Math.min(1, dot(u, v) / magnitude(u) / magnitude(v))),
    ) *
      180) /
    Math.PI;
  return {
    a: magnitude(a),
    b: magnitude(b),
    c: magnitude(c),
    alpha: angle(b, c),
    beta: angle(a, c),
    gamma: angle(a, b),
  };
}
/** Orthographic camera. Rotation changes the view only; never the stored geometry. */
export function rotatePoint(
  [x, y, z]: Vector3,
  yaw: number,
  pitch: number,
): Vector3 {
  const u = Math.cos(yaw) * x + Math.sin(yaw) * z,
    w = -Math.sin(yaw) * x + Math.cos(yaw) * z;
  return [
    u,
    Math.cos(pitch) * y - Math.sin(pitch) * w,
    Math.sin(pitch) * y + Math.cos(pitch) * w,
  ];
}
export function elementColor(element: string) {
  const known: Record<string, string> = {
    H: "#99b9cf",
    C: "#475569",
    N: "#5385dd",
    O: "#dd716c",
    Fe: "#be7959",
    Nb: "#4c89ac",
    Ta: "#7767a1",
    Si: "#bd9b68",
    S: "#c9ac47",
    La: "#72a394",
    Ca: "#7c9a67",
  };
  if (known[element]) return known[element];
  const hash = [...element].reduce((n, c) => n * 31 + c.charCodeAt(0), 0);
  return `hsl(${hash % 360} 34% 56%)`;
}
