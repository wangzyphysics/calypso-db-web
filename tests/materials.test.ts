import { test } from "node:test";
import assert from "node:assert/strict";
import { elementIdentities, periodicCells } from "../lib/materials/elements.ts";
import {
  normalizeSearch,
  displaySearchQuery,
  searchHref,
  elementsFromQuery,
  normalizeFilters,
  filtersFromParams,
  emptyFilters,
} from "../lib/materials/search.ts";
import {
  createMaterialsClient,
  hasVerifiedChronology,
  statisticsSchema,
  materialsSchema,
} from "../lib/materials/api.ts";

test("periodic table contains all 118 identities exactly once, in valid cells", () => {
  const atoms = periodicCells.filter((cell) => cell.number !== null);
  assert.equal(atoms.length, 118);
  assert.equal(new Set(atoms.map((cell) => cell.symbol)).size, 118);
  assert.equal(
    new Set(atoms.map((cell) => `${cell.row}:${cell.column}`)).size,
    118,
  );
  assert.deepEqual(
    atoms.map((cell) => cell.number).sort((a, b) => a! - b!),
    elementIdentities.map((e) => e.number),
  );
  assert.ok(atoms.every((cell) => cell.column >= 1 && cell.column <= 18));
  assert.equal(atoms.find((cell) => cell.symbol === "He")?.family, "s-block");
});
test("search normalizes chemical subscripts and element selections", () => {
  assert.equal(normalizeSearch(" H₂O ", "formula"), "H2O");
  assert.equal(normalizeSearch("Fe, H Fe", "elements"), "Fe,H");
  assert.equal(normalizeSearch("(NH4)2SO4", "formula"), "(NH4)2SO4");
  assert.throws(() => normalizeSearch("H2O)", "formula"));
  assert.throws(() => normalizeSearch("Xx", "elements"));
  assert.throws(() => normalizeSearch(" ", "any"));
  assert.throws(() => normalizeSearch("Fe()", "formula"));
  assert.throws(() => normalizeSearch("H0", "formula"));
});

test("element input keeps hyphens after URL serialization while API values remain compatible", () => {
  for (const mode of ["elements", "system"] as const) {
    const url = new URL(
      searchHref("Fe-O", mode, { excludeElements: "H,He" }),
      "https://example.test",
    );
    const serialized = url.searchParams.get("query")!;
    assert.equal(serialized, "Fe,O");
    const displayed = displaySearchQuery(serialized, mode);
    assert.equal(displayed, "Fe-O");
    assert.deepEqual(elementsFromQuery(displayed, mode), ["Fe", "O"]);
    assert.equal(filtersFromParams(url.searchParams).excludeElements, "H-He");
    assert.equal(
      normalizeFilters(filtersFromParams(url.searchParams)).excludeElements,
      "H,He",
    );
  }
  assert.equal(displaySearchQuery("Fe₂O₃", "formula"), "Fe₂O₃");
  assert.equal(displaySearchQuery("record,123", "record"), "record,123");
  assert.equal(displaySearchQuery("Fe-Xx", "elements"), "Fe-Xx");
});

test("typed compositions derive the same selection as the periodic table", () => {
  assert.deepEqual(elementsFromQuery("Fe₂O₃", "formula"), ["Fe", "O"]);
  assert.deepEqual(elementsFromQuery("(NH4)2SO4", "any"), ["N", "H", "S", "O"]);
  assert.deepEqual(elementsFromQuery("Li-Fe-O", "system"), ["Li", "Fe", "O"]);
  assert.deepEqual(elementsFromQuery("Fe, Fe O", "elements"), ["Fe", "O"]);
  assert.deepEqual(elementsFromQuery("Fe", "id"), []);
  assert.deepEqual(elementsFromQuery("Fe2Xx", "any"), []);
});
test("advanced filters round-trip through URLs without dropping zero pressure", () => {
  const filters = normalizeFilters({
    ...emptyFilters,
    pressureMin: "0",
    pressureMax: "100.5",
    excludeElements: "He-H",
    crystalSystem: "cubic",
    spaceGroup: "225",
    elementsMin: "2",
    elementsMax: "3",
  });
  const url = new URL(
    searchHref("Fe-O", "system", filters),
    "https://example.test",
  );
  assert.equal(url.searchParams.get("pressureMin"), "0");
  assert.equal(url.searchParams.get("excludeElements"), "He,H");
  assert.equal(url.searchParams.get("type"), "system");
  assert.equal(
    normalizeFilters({ ...emptyFilters, spaceGroup: "P2₁/c" }).spaceGroup,
    "P21/c",
  );
  assert.deepEqual(
    normalizeFilters(filtersFromParams(url.searchParams)),
    filters,
  );
  assert.throws(() =>
    normalizeFilters({ ...emptyFilters, pressureMin: "20", pressureMax: "10" }),
  );
  assert.throws(() =>
    normalizeFilters({ ...emptyFilters, elementsMin: "1.5" }),
  );
  assert.throws(() =>
    normalizeFilters({ ...emptyFilters, pressureMin: "Infinity" }),
  );
  assert.throws(() => normalizeFilters({ ...emptyFilters, spaceGroup: "231" }));
  assert.throws(() => searchHref("Fe2O3", "formula", { excludeElements: "O" }));
  assert.equal(
    new URL(
      searchHref("", "any", { pressureMin: 0 }),
      "https://example.test",
    ).searchParams.get("pressureMin"),
    "0",
  );
});
test("API preserves combined filters and exact identifier modes", async () => {
  let requested = "";
  const client = createMaterialsClient("/api", async (input) => {
    requested = String(input);
    return Response.json({ items: [], total: 0, order: "unspecified" });
  });
  await client.materials({
    query: "exact&record=1",
    mode: "record",
    filters: { pressureMin: 0, spaceGroup: "Fm-3m", excludeElements: "He" },
  });
  const url = new URL(requested, "https://example.test");
  assert.equal(url.searchParams.get("type"), "record");
  assert.equal(url.searchParams.get("query"), "exact&record=1");
  assert.equal(url.searchParams.get("pressureMin"), "0");
  assert.equal(url.searchParams.get("spaceGroup"), "Fm-3m");
  assert.equal(url.searchParams.get("excludeElements"), "He");
});
test("search navigation encodes IDs and retains the selected type", () => {
  const url = new URL(
    searchHref("record&phase=2", "id"),
    "https://example.test",
  );
  assert.equal(url.pathname, "/explore");
  assert.equal(url.searchParams.get("query"), "record&phase=2");
  assert.equal(url.searchParams.get("type"), "id");
  assert.equal(url.searchParams.size, 2);
});
test("unconfigured client never calls a data source or supplies sample records", async () => {
  let calls = 0;
  const client = createMaterialsClient(undefined, async () => {
    calls++;
    return new Response();
  });
  assert.equal(client.configured, false);
  await assert.rejects(client.materials(), /not been configured/);
  assert.equal(calls, 0);
});
test("configured client sends search filters to its own data source", async () => {
  let requested = "";
  const client = createMaterialsClient(
    "https://example.test/api/",
    async (input) => {
      requested = String(input);
      return Response.json({ items: [], total: 0, order: "unspecified" });
    },
  );
  const result = await client.materials({ query: "Fe,H", mode: "elements" });
  const url = new URL(requested);
  assert.equal(url.pathname, "/api/materials");
  assert.equal(url.searchParams.get("query"), "Fe,H");
  assert.equal(url.searchParams.get("type"), "elements");
  assert.deepEqual(result.items, []);
});
test("statistics preserve zero and require explicit counting definitions", () => {
  const metric = { count: 0, definition: "Dataset-defined count" };
  const payload = {
    materials: metric,
    phases: metric,
    structureRecords: metric,
    pressureCoverage: {
      minGPa: 0,
      maxGPa: 0,
      definition: "Recorded pressure endpoints",
    },
  };
  assert.equal(statisticsSchema.parse(payload).pressureCoverage.minGPa, 0);
  assert.throws(() =>
    statisticsSchema.parse({
      ...payload,
      phases: { count: -1, definition: "Invalid" },
    }),
  );
  assert.throws(() =>
    statisticsSchema.parse({ ...payload, materials: { count: 3 } }),
  );
  assert.throws(() =>
    statisticsSchema.parse({
      ...payload,
      pressureCoverage: { minGPa: 10, maxGPa: 0, definition: "Invalid" },
    }),
  );
  const community = {
    registeredUsers: metric,
    definition: "Registered users by voluntarily supplied region",
    regions: [],
  };
  assert.equal(
    statisticsSchema.parse({ ...payload, community }).community?.registeredUsers
      .count,
    0,
  );
  assert.throws(() =>
    statisticsSchema.parse({
      ...payload,
      community: { ...community, regions: [{ countryCode: "CHN", users: 1 }] },
    }),
  );
  assert.throws(() =>
    statisticsSchema.parse({
      ...payload,
      community: {
        ...community,
        registeredUsers: { ...metric, count: 4 },
        regions: [
          { countryCode: "CHN", users: 1 },
          { countryCode: "CHN", users: 1 },
        ],
      },
    }),
  );
});
test("authorization, network, and malformed responses are distinct failures", async () => {
  for (const [response, kind] of [
    [new Response(null, { status: 401 }), "unauthorized"],
    [new Response(null, { status: 503 }), "network"],
    [Response.json({ data: "unsupported" }), "invalid"],
  ] as const) {
    const client = createMaterialsClient("/api", async () => response);
    await assert.rejects(
      client.statistics(),
      (error) =>
        error instanceof Error && "kind" in error && error.kind === kind,
    );
  }
});
test("recently added label requires declared order and actual ordered timestamps", () => {
  // Synthetic contract fixtures used only by tests; never included in the application.
  const record = {
    recordId: "test-record",
    materialId: "test-material",
    formula: "H",
    phaseId: null,
    pressureGPa: 0,
    spaceGroup: null,
    crystalSystem: null,
  };
  const result = materialsSchema.parse({
    items: [record],
    total: 1,
    order: "unspecified",
  });
  assert.equal(result.items[0].pressureGPa, 0);
  assert.equal(hasVerifiedChronology(result), false);
  assert.equal(
    hasVerifiedChronology({ ...result, order: "created_desc" }),
    false,
  );
  assert.equal(
    hasVerifiedChronology({
      ...result,
      order: "created_desc",
      items: [{ ...record, createdAt: "2026-01-01T00:00:00Z" }],
    }),
    true,
  );
  assert.throws(() => materialsSchema.parse({ ...result, total: 0 }));
});
