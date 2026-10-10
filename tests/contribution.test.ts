import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contributionSchema,
  createContributionDraft,
  maximumStructureBytes,
  reviewStructureFile,
} from "../lib/materials/contribution.ts";
import { elementIdentities } from "../lib/materials/elements.ts";
import {
  elementCategories,
  elementReferences,
} from "../lib/materials/element-reference.ts";

// Synthetic format fixtures used only for validation; these are not database records.
const cif = `data_test
_cell_length_a '5.0(2)'
_cell_length_b 5.0
_cell_length_c 5.0
_cell_angle_alpha 90
_cell_angle_beta 90
_cell_angle_gamma 90
loop_
_atom_site_label
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
H1 0 0 0
`;
const poscar = `QA fixture
1.0
5 0 0
0 5 0
0 0 5
H
1
Direct
0 0 0
`;
const input = {
  contributorName: "QA contributor",
  email: "qa@example.test",
  formula: "H₂",
  pressureGPa: 0,
  calculationMethod: "Synthetic fixture, not a calculation",
  source: "Test fixture only",
  notes: "",
  permissionConfirmed: true as const,
};

test("CIF preflight accepts uncertainty notation and Cartesian field names", () => {
  assert.equal(reviewStructureFile("test.cif", cif).format, "cif");
  assert.equal(
    reviewStructureFile("test.CIF", cif.replaceAll("fract_", "Cartn_")).format,
    "cif",
  );
  assert.match(
    reviewStructureFile("test.cif", cif).warnings[0],
    /scientific validity/,
  );
});
test("CIF preflight rejects missing fields, invalid cell values and multiple records", () => {
  assert.throws(
    () => reviewStructureFile("test.cif", cif.replace("data_test", "data_")),
    /data_ block/,
  );
  assert.throws(
    () =>
      reviewStructureFile(
        "test.cif",
        cif.replace("_cell_angle_gamma 90", "_cell_angle_gamma 180"),
      ),
    /angle_gamma/,
  );
  assert.throws(
    () =>
      reviewStructureFile(
        "test.cif",
        cif.replace("_atom_site_fract_z", "_atom_site_other"),
      ),
    /coordinate fields/,
  );
  assert.throws(
    () => reviewStructureFile("test.cif", cif + "\ndata_second\n"),
    /one structure/,
  );
});
test("POSCAR preflight supports species-free, selective and scaling variants", () => {
  assert.equal(reviewStructureFile("POSCAR", poscar).format, "poscar");
  assert.equal(
    reviewStructureFile("test.vasp", poscar.replace("H\n", "")).format,
    "poscar",
  );
  assert.equal(
    reviewStructureFile(
      "test.poscar",
      poscar
        .replace("Direct", "Selective dynamics\nCartesian")
        .replace("0 0 0\n", "0 0 0 T F T\n"),
    ).format,
    "poscar",
  );
  assert.equal(
    reviewStructureFile("POSCAR", poscar.replace("1.0", "-125")).format,
    "poscar",
  );
  assert.equal(
    reviewStructureFile("POSCAR", poscar.replace("1.0", "1 2 3")).format,
    "poscar",
  );
  assert.equal(
    reviewStructureFile("POSCAR", poscar.replace("QA fixture", "")).format,
    "poscar",
  );
});
test("POSCAR preflight rejects singular cells, bad scaling and incomplete coordinates", () => {
  assert.throws(
    () => reviewStructureFile("POSCAR", poscar.replace("0 0 5", "0 5 0")),
    /nonzero cell volume/,
  );
  assert.throws(
    () => reviewStructureFile("POSCAR", poscar.replace("1.0", "0")),
    /scale/,
  );
  assert.throws(
    () => reviewStructureFile("POSCAR", poscar.replace("1.0", "1 -2 3")),
    /scale/,
  );
  assert.throws(
    () => reviewStructureFile("POSCAR", poscar.replace("H\n1", "H\n2")),
    /atom count/,
  );
  assert.throws(
    () => reviewStructureFile("POSCAR", poscar.replace("0 0 0", "0 0 NaN")),
    /positions/,
  );
});
test("preflight rejects empty, binary, unsupported and oversized files", () => {
  assert.throws(() => reviewStructureFile("test.cif", ""), /empty/);
  assert.throws(() => reviewStructureFile("test.cif", "\0"), /plain-text/);
  assert.throws(
    () => reviewStructureFile("test.xyz", "not supported"),
    /Supported/,
  );
  assert.throws(
    () =>
      reviewStructureFile("test.cif", "x".repeat(maximumStructureBytes + 1)),
    /5 MiB/,
  );
});
test("contributions require provenance, share permission and a finite exact pressure", () => {
  assert.ok(contributionSchema.safeParse(input).success);
  assert.ok(
    !contributionSchema.safeParse({ ...input, pressureGPa: Infinity }).success,
  );
  assert.ok(!contributionSchema.safeParse({ ...input, source: " " }).success);
  assert.ok(
    !contributionSchema.safeParse({ ...input, calculationMethod: "" }).success,
  );
  assert.ok(
    !contributionSchema.safeParse({ ...input, permissionConfirmed: false })
      .success,
  );
  assert.ok(!contributionSchema.safeParse({ ...input, formula: "Xx" }).success);
});
test("exported drafts retain structure text and zero pressure without asserting publication", () => {
  const draft = createContributionDraft(input, {
    name: "test.cif",
    text: cif,
    sha256: "a".repeat(64),
  });
  assert.equal(draft.status, "local-draft");
  assert.equal(draft.metadata.formula, "H2");
  assert.equal(draft.metadata.pressureGPa, 0);
  assert.equal(draft.structure.content, cif);
  assert.equal(draft.structure.sha256, "a".repeat(64));
  assert.equal(draft.structure.format, "cif");
  assert.ok(!("stable" in draft.metadata));
});
test("reference metadata covers every table identity and ten valid chemical categories", () => {
  assert.equal(Object.keys(elementReferences).length, 118);
  assert.equal(Object.keys(elementCategories).length, 10);
  for (const element of elementIdentities) {
    const reference = elementReferences[element.symbol];
    assert.equal(reference.atomicNumber, element.number);
    assert.ok(reference.name);
    assert.ok(reference.category in elementCategories);
  }
});
test("reference data preserves unknown values and predicted qualifications", () => {
  assert.equal(elementReferences.He.electronegativity, null);
  assert.match(elementReferences.Og.electronConfiguration ?? "", /predicted/);
  assert.equal(elementReferences.Fe.category, "transition-metal");
  assert.equal(elementReferences.Cl.category, "halogen");
  assert.equal(elementReferences.La.category, "lanthanide");
});
