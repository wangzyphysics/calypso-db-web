export const recordColumns = {
  formula: "Composition / ID", pressure: "Pressure · GPa", phase: "Source phase",
  symmetry: "Space group", crystal: "Crystal system", source: "Record source", record: "Record ID",
} as const;
export type RecordColumn = keyof typeof recordColumns;
export type ColumnWidths = Record<RecordColumn, number>;
export const defaultColumns: RecordColumn[] = ["formula", "pressure", "phase", "symmetry", "crystal", "source"];
export const columnLimits = {
  formula: { min: 180, initial: 220, max: 400 },
  pressure: { min: 150, initial: 170, max: 260 },
  phase: { min: 145, initial: 180, max: 340 },
  symmetry: { min: 145, initial: 170, max: 300 },
  crystal: { min: 145, initial: 180, max: 320 },
  source: { min: 130, initial: 160, max: 260 },
  record: { min: 190, initial: 260, max: 480 },
} as const;

// Fit the visible columns to the viewport without stretching past their limits.
// A narrow viewport keeps the minimum widths and scrolls inside the table.
export function fitColumnWidths(columns: RecordColumn[], available: number, previous?: ColumnWidths): ColumnWidths {
  const widths = Object.fromEntries(Object.entries(columnLimits).map(([key, limit]) => [key, previous?.[key as RecordColumn] ?? limit.initial])) as ColumnWidths;
  for (const column of columns) widths[column] = Math.max(columnLimits[column].min, Math.min(columnLimits[column].max, widths[column]));
  let remaining = (Number.isFinite(available) ? available : 0) - columns.reduce((sum, column) => sum + widths[column], 0);
  for (let pass = 0; pass < columns.length && Math.abs(remaining) > 0.1; pass++) {
    const eligible = columns.filter(column => remaining > 0 ? widths[column] < columnLimits[column].max : widths[column] > columnLimits[column].min);
    if (!eligible.length) break;
    const share = remaining / eligible.length;
    for (const column of eligible) {
      const next = Math.max(columnLimits[column].min, Math.min(columnLimits[column].max, widths[column] + share));
      remaining -= next - widths[column]; widths[column] = next;
    }
  }
  return widths;
}

// Resize one column without silently changing its neighbors. Extra width scrolls
// inside the table, while each column always retains its own readable bounds.
export function resizeColumn(widths: ColumnWidths, column: RecordColumn, requested: number): ColumnWidths {
  if (!Number.isFinite(requested)) return widths;
  const limit = columnLimits[column];
  return { ...widths, [column]: Math.max(limit.min, Math.min(limit.max, requested)) };
}
