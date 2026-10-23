import test from "node:test";
import assert from "node:assert/strict";
import {
  cellSchema,
  detailSchema,
  fractionalToCartesian,
  latticeMetrics,
  rotatePoint,
  orientForView,
  magnitude,
  detailHref,
  downloadHref,
} from "../lib/materials/detail.ts";
import { safeReturnTo } from "../lib/accounts/model.ts";
import { formatDetailNumber } from "../lib/materials/detail-format.ts";
import {
  createMaterialsClient,
  MaterialsApiError,
} from "../lib/materials/api.ts";

test("scientific display keeps small nonzero values and large carrier concentrations readable", () => {
  assert.equal(formatDetailNumber(0), "0");
  assert.equal(Number(formatDetailNumber(1e-9)), 1e-9);
  assert.equal(Number(formatDetailNumber(2.5e20)), 2.5e20);
});

test("non-orthogonal cell metrics and coordinate projection preserve the selected cell", () => {
  const lattice: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] = [
    [2, 0, 0],
    [1, 3, 0],
    [0, 0, 4],
  ];
  assert.deepEqual(
    fractionalToCartesian([0.5, 0.25, 0.75], lattice),
    [1.25, 0.75, 3],
  );
  const m = latticeMetrics(lattice);
  assert.equal(m.a, 2);
  assert.equal(m.b, Math.sqrt(10));
  assert.equal(m.c, 4);
  assert.equal(m.alpha, 90);
  assert.ok(Math.abs(m.gamma - 71.565051177) < 1e-8);
  const oriented = orientForView(
    [1, 2, 3],
    [
      [0, 2, 0],
      [3, 0, 0],
      [1, 1, 4],
    ],
  );
  assert.ok(Math.abs(magnitude(oriented) - Math.sqrt(14)) < 1e-12);
  const rotated = rotatePoint([1, 2, 3], 1.2, -0.7);
  assert.ok(Math.abs(magnitude(rotated) - Math.sqrt(14)) < 1e-12);
});
test("detail contract rejects missing default cells, mismatched atom counts and nonfinite positions", () => {
  const cell = {
    id: "cell",
    role: "display_unit_cell",
    lattice: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    sites: [
      { species: [{ element: "Fe", occupancy: 1 }], frac_coords: [0, 0, 0] },
    ],
    volumeA3: 1,
    siteCount: 1,
    composition: { Fe: 1 },
  };
  assert.equal(cellSchema.parse(cell).siteCount, 1);
  assert.equal(cellSchema.safeParse({ ...cell, siteCount: 2 }).success, false);
  assert.equal(cellSchema.safeParse({ ...cell, volumeA3: -1 }).success, false);
  assert.equal(
    cellSchema.safeParse({
      ...cell,
      sites: [{ ...cell.sites[0], frac_coords: [Infinity, 0, 0] }],
    }).success,
    false,
  );
  const d = {
    recordId: "record",
    materialId: "material",
    formula: "Fe",
    phaseId: null,
    phaseLabel: null,
    spaceGroup: null,
    spaceGroupNumber: null,
    crystalSystem: null,
    pressureGPa: null,
    pressureStatus: "unreported",
    temperatureK: null,
    temperatureStatus: "unreported",
    provenance: "imported",
    dataType: "structure",
    origin: null,
    createdAt: null,
    updatedAt: null,
    externalIds: [],
    cells: [cell],
    defaultCellId: "cell",
    symmetry: null,
    calculations: [],
    sources: [],
    relatedRecords: [],
    relatedHasMore: false,
    phaseDefinition: "Source-provided phase",
    contribution: null,
  };
  assert.equal(detailSchema.safeParse(d).success, true);
  assert.equal(
    detailSchema.safeParse({ ...d, defaultCellId: "foreign-cell" }).success,
    false,
  );
});
test("exact detail URLs are encoded; missing/private records produce a distinct error", async () => {
  assert.equal(detailHref("str_123"), "/materials/str_123");
  assert.equal(detailHref("a/b?x"), "/materials/a%2Fb%3Fx");
  assert.equal(
    downloadHref("/api/materials/", "record", "cif", "cell"),
    "/api/materials/records/record/download?format=cif&cell=cell",
  );
  let called = "";
  const client = createMaterialsClient(
    "/api/materials",
    async (input, init) => {
      called = String(input);
      assert.equal(init?.credentials, "same-origin");
      return Response.json({ error: "Record not found" }, { status: 404 });
    },
  );
  await assert.rejects(
    client.detail("a/b"),
    (e) => e instanceof MaterialsApiError && e.kind === "not-found",
  );
  assert.equal(called, "/api/materials/records/a%2Fb");
  const invalid = createMaterialsClient("/api/materials", async () =>
    Response.json({ recordId: "empty" }),
  );
  await assert.rejects(
    invalid.detail("empty"),
    (e) => e instanceof MaterialsApiError && e.kind === "invalid",
  );
});

test("sign-in preserves exact record and selected-cell deep links without admitting nested paths", () => {
  const url = "/materials/str_123?cell=str_456#coordinates";
  assert.equal(safeReturnTo(url), url);
  assert.equal(safeReturnTo("/materials//external"), "/explore");
  assert.equal(safeReturnTo("/materials/id/api/private"), "/explore");
});
