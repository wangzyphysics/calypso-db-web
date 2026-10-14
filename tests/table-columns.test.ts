import test from "node:test";
import assert from "node:assert/strict";
import { columnLimits, defaultColumns, fitColumnWidths, resizeColumn, type ColumnWidths, type RecordColumn } from "../lib/materials/table-columns.ts";

function checkBounds(widths: ColumnWidths, columns: RecordColumn[]) {
  for (const column of columns) {
    assert.ok(widths[column] >= columnLimits[column].min - 0.001);
    assert.ok(widths[column] <= columnLimits[column].max + 0.001);
  }
}
test("table sizing fills a normal viewport and retains bounded scrollable columns at extremes", () => {
  for (const available of [300, 900, 1200, 3000]) {
    const widths = fitColumnWidths(defaultColumns, available);
    checkBounds(widths, defaultColumns);
    const min = defaultColumns.reduce((sum, key) => sum + columnLimits[key].min, 0);
    const max = defaultColumns.reduce((sum, key) => sum + columnLimits[key].max, 0);
    assert.ok(Math.abs(defaultColumns.reduce((sum, key) => sum + widths[key], 0) - Math.max(min, Math.min(max, available))) < 0.1);
  }
});
test("dragged columns clamp independently without changing neighboring widths", () => {
  const initial = fitColumnWidths(defaultColumns, 1200);
  for (const requested of [-10000, 205, 10000]) {
    const resized = resizeColumn(initial, "formula", requested);
    checkBounds(resized, defaultColumns);
    assert.equal(resized.formula, Math.max(columnLimits.formula.min, Math.min(columnLimits.formula.max, requested)));
    for (const column of defaultColumns.filter(key => key !== "formula")) assert.equal(resized[column], initial[column]);
  }
  assert.equal(resizeColumn(initial, "formula", NaN), initial);
});
test("fitting preserves custom widths across result remounts and handles hidden columns", () => {
  const initial = fitColumnWidths(defaultColumns, 1200);
  const resized = { ...initial, formula: initial.formula + 20, pressure: initial.pressure - 20 };
  assert.deepEqual(fitColumnWidths(defaultColumns, 1200, resized), resized);
  const visible: RecordColumn[] = ["formula", "pressure", "record"];
  checkBounds(fitColumnWidths(visible, 700, resized), visible);
});
