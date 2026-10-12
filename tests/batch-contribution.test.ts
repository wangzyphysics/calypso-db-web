import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyManifest,
  batchSchema,
  bytesToBase64,
  curvePoints,
  curveTable,
  defaultRecord,
  fileBytes,
  importBatchDraft,
  inspectFile,
  makeDraftFile,
  newBatch,
  parseDelimited,
  recordIssues,
  safePath,
} from "../lib/materials/batch-contribution.ts";
import { unpackZip } from "../lib/materials/zip-import.ts";
import {
  canPublishRecord,
  workflowCompletion,
  type WorkflowStep,
} from "../lib/materials/contribution-contract.ts";

const originalCurve = "shift,intensity,second\n100,0,3\n200,5,6\n300,1,9\n";
test("curve parsing retains zeros and original point order across CSV, XY and scientific notation", () => {
  assert.deepEqual(curvePoints(curveTable("x;y\n2;0\n1;3D-2\n"), 0, 1), [
    [2, 0],
    [1, 0.03],
  ]);
  assert.deepEqual(
    curvePoints(curveTable("# measurement\n100 2\n200 5\n"), 0, 1),
    [
      [100, 2],
      [200, 5],
    ],
  );
  assert.throws(
    () => curvePoints(curveTable("x,y\n100,\n200,5\n"), 0, 1),
    /Missing/,
  );
  assert.throws(
    () => curvePoints(curveTable("x,y\n100,NaN\n200,5\n"), 0, 1),
    /nonnumeric/,
  );
  assert.throws(() => curveTable("x,y\n100,2,3\n200,5\n"), /column count/);
  assert.throws(() => curvePoints(curveTable(originalCurve), 1, 1), /distinct/);
  const single = curveTable("pressure,conductivity\n0,2.3\n");
  assert.throws(() => curvePoints(single, 0, 1), /two data points/);
  assert.deepEqual(curvePoints(single, 0, 1, 1), [[0, 2.3]]);
});
test("manifest CSV supports quoted provenance and explicit multiple curves per original file", async () => {
  const file = await makeDraftFile(
    "spectra/raman.csv",
    new TextEncoder().encode(originalCurve),
  );
  assert.deepEqual(
    parseDelimited('a,b\n"line one\nline two","quoted ""source"""\n'),
    [
      ["a", "b"],
      ["line one\nline two", 'quoted "source"'],
    ],
  );
  const text =
    'record_id,file,data_type,origin,sample_id,formula,pressure_gpa,temperature_k,x_column,y_column,method,source\nr1,spectra/raman.csv,raman,experimental,S1,H2O,0,300,shift,intensity,Measurement,"Original, unpublished"\nr2,spectra/raman.csv,raman,experimental,S1,H2O,10,300,shift,second,Measurement,Original\n';
  const records = applyManifest(text, [file]);
  assert.equal(records.length, 2);
  assert.equal(records[0].fileId, records[1].fileId);
  assert.equal(records[0].pressureGPa, "0");
  assert.equal(records[1].yColumn, 2);
  assert.equal(records[0].source, "Original, unpublished");
  assert.throws(
    () => applyManifest(text.replace("raman,experimental", "raman,"), [file]),
    /Invalid enum/,
  );
  assert.deepEqual(
    recordIssues(records[0], file, inspectFile(file), records),
    [],
  );
  assert.throws(
    () => applyManifest(text.replace("r2,", "r1,"), [file]),
    /unique/,
  );
  assert.throws(
    () =>
      applyManifest(text.replace("spectra/raman.csv", "missing.csv"), [file]),
    /missing/i,
  );
});
test("ambiguous filenames, unsupported types and missing structure associations are explicit errors", async () => {
  const a = await makeDraftFile(
    "a/curve.csv",
    new TextEncoder().encode(originalCurve),
  );
  const b = await makeDraftFile(
    "b/curve.csv",
    new TextEncoder().encode(originalCurve),
  );
  assert.throws(
    () =>
      applyManifest(
        "record_id,file,origin,data_type\nr1,curve.csv,experimental,raman\n",
        [a, b],
      ),
    /ambiguous/,
  );
  assert.throws(
    () =>
      applyManifest(
        "record_id,file,origin,data_type\nr1,a/curve.csv,experimental,unknown\n",
        [a],
      ),
    /Invalid enum/,
  );
  const record = {
    ...defaultRecord(a.id, 1, "experimental", "raman"),
    structureRecordId: "missing",
  };
  const issues = recordIssues(record, a, inspectFile(a), [record]);
  assert.ok(issues.includes("The linked structure record is unavailable."));
  assert.ok(issues.includes("Add a valid chemical formula."));
  assert.ok(issues.includes("Add the measurement temperature in K."));
  const attachment = {
    ...record,
    dataType: "attachment" as const,
    structureRecordId: "",
  };
  assert.ok(
    !recordIssues(attachment, a, inspectFile(a), [attachment]).some(
      (x) => x.includes("curve") || x.includes("axes"),
    ),
  );
});
test("draft imports preserve raw binary bytes, privacy and consent without claiming submission", async () => {
  const binary = new Uint8Array([0, 255, 1, 128, 3]);
  const file = await makeDraftFile("raw/data.bin", binary);
  const draft = {
    ...newBatch(),
    files: [file],
    records: [defaultRecord(file.id, 1, "experimental", "attachment")],
  };
  assert.equal(draft.visibility, "private");
  assert.equal(draft.computationRequested, false);
  const imported = await importBatchDraft(JSON.parse(JSON.stringify(draft)));
  assert.notEqual(imported.id, draft.id);
  assert.equal(imported.status, "local-draft");
  assert.deepEqual(fileBytes(imported.files[0]), binary);
  await assert.rejects(
    () =>
      importBatchDraft({
        ...draft,
        files: [
          {
            ...file,
            contentBase64: bytesToBase64(new Uint8Array([1, 255, 1, 128, 3])),
          },
        ],
      }),
    /checksum/,
  );
  assert.throws(
    () =>
      batchSchema.parse({
        ...draft,
        records: [draft.records[0], draft.records[0]],
      }),
    /unique/,
  );
  assert.throws(() => safePath("../secret"), /relative/);
  assert.throws(() => safePath("/absolute"), /relative/);
});
test("v1 single-structure JSON drafts migrate with conservative visibility and independent permission", async () => {
  const old = {
    schemaVersion: 1,
    status: "local-draft",
    metadata: {
      contributorName: "Test",
      email: "test@example.com",
      formula: "H",
      pressureGPa: 0,
      calculationMethod: "Synthetic test",
      source: "Test only",
      permissionConfirmed: true,
    },
    structure: {
      fileName: "POSCAR",
      content: "Synthetic test\n1\n3 0 0\n0 3 0\n0 0 3\nH\n1\nDirect\n0 0 0\n",
    },
  };
  const imported = await importBatchDraft(old);
  assert.equal(imported.visibility, "private");
  assert.equal(imported.permissionConfirmed, false);
  assert.equal(imported.records[0].pressureGPa, "0");
  assert.equal(imported.records[0].sampleId, "");
  assert.ok(inspectFile(imported.files[0]).structureChecks);
  await assert.rejects(
    () =>
      importBatchDraft({
        ...old,
        structure: { ...old.structure, sha256: "0".repeat(64) },
      }),
    /checksum/,
  );
});
test("ZIP import verifies original bytes and rejects unsafe paths and malformed directories", async () => {
  const bytes = new Uint8Array(
    await readFile(new URL("./fixtures/curves.zip", import.meta.url)),
  );
  const entries = await unpackZip(bytes);
  assert.equal(entries.length, 2);
  assert.equal(
    new TextDecoder().decode(entries[0].bytes),
    "shift,intensity\n100,2\n200,5\n300,1\n",
  );
  assert.deepEqual([...entries[1].bytes], [0, 1, 2, 255]);
  const unsafe = new Uint8Array(
    await readFile(new URL("./fixtures/unsafe.zip", import.meta.url)),
  );
  await assert.rejects(() => unpackZip(unsafe), /relative/);
  await assert.rejects(() => unpackZip(bytes.slice(0, 20)), /ZIP/);
  const broken = bytes.slice();
  broken[50] ^= 255;
  await assert.rejects(() => unpackZip(broken));
});
test("publication is explicit opt-in after approval and progress never invents a timing estimate", () => {
  assert.equal(canPublishRecord("private", "approved"), false);
  assert.equal(canPublishRecord("public-after-review", "pending"), false);
  assert.equal(canPublishRecord("public-after-review", "approved"), true);
  const step = (id: string, status: WorkflowStep["status"]): WorkflowStep => ({
    id,
    label: id,
    status,
    dependsOn: [],
    required: true,
    attempt: 1,
    startedAt: null,
    finishedAt: null,
    detail: null,
    schedulerJobId: null,
    progress: null,
  });
  assert.equal(
    workflowCompletion({
      planFinalized: false,
      status: "running",
      steps: [step("a", "succeeded"), step("b", "running")],
    }),
    null,
  );
  assert.equal(
    workflowCompletion({
      planFinalized: true,
      status: "running",
      steps: [step("a", "succeeded"), step("b", "running")],
    }),
    50,
  );
  assert.equal(
    workflowCompletion({
      planFinalized: true,
      status: "completed",
      steps: [step("a", "succeeded"), step("b", "failed")],
    }),
    null,
  );
  assert.equal(
    workflowCompletion({
      planFinalized: true,
      status: "completed",
      steps: [step("a", "succeeded"), step("b", "succeeded")],
    }),
    100,
  );
});

test("batch structure checks use the declared file limit while legacy drafts retain theirs", async () => {
  const text =
    "S".repeat(6 * 1024 * 1024) +
    "\n1\n3 0 0\n0 3 0\n0 0 3\nH\n1\nDirect\n0 0 0\n";
  const file = await makeDraftFile("POSCAR", new TextEncoder().encode(text));
  assert.ok(inspectFile(file).structureChecks);
  await assert.rejects(
    () => makeDraftFile("large.bin", new Uint8Array(10 * 1024 * 1024 + 1)),
    /10 MiB/,
  );
});
