"use client";
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { recordColumns, defaultColumns, columnLimits, fitColumnWidths, resizeColumn, type RecordColumn, type ColumnWidths } from "@/lib/materials/table-columns";
export { recordColumns, defaultColumns, type RecordColumn } from "@/lib/materials/table-columns";
import type { MaterialRecord } from "@/lib/materials/api";
import { ChemicalFormula } from "./foundations";

export function RecordTable({ records, columns = defaultColumns, sort, onSort, widths: savedWidths, onWidthsChange }: { records: MaterialRecord[]; columns?: RecordColumn[]; sort?: string; onSort?: (sort: string) => void; widths?: ColumnWidths; onWidthsChange?: (widths: ColumnWidths) => void }) {
  const scroll = useRef<HTMLDivElement>(null);
  const [localWidths, setLocalWidths] = useState(() => fitColumnWidths(columns, 0));
  const widths = savedWidths ?? localWidths;
  const latestWidths = useRef(widths); latestWidths.current = widths;
  const drag = useRef<{ x: number; widths: ColumnWidths; left: RecordColumn; handle: HTMLDivElement } | null>(null);
  function updateWidths(next: ColumnWidths) { latestWidths.current = next; setLocalWidths(next); onWidthsChange?.(next); }
  function finishDrag() { drag.current?.handle.classList.remove("dragging"); drag.current = null; }
  useEffect(() => {
    const container = scroll.current; if (!container) return;
    let available: number | null = null;
    const observer = new ResizeObserver(() => {
      if (available === container.clientWidth) return;
      const keepSaved = available === null && savedWidths;
      available = container.clientWidth;
      const next = keepSaved ? latestWidths.current : fitColumnWidths(columns, available, latestWidths.current);
      latestWidths.current = next; setLocalWidths(next); onWidthsChange?.(next);
    });
    observer.observe(container);
    return () => { observer.disconnect(); finishDrag(); };
  }, [columns, onWidthsChange]);
  function startResize(event: PointerEvent<HTMLDivElement>, left: RecordColumn) {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, widths: latestWidths.current, left, handle: event.currentTarget };
    event.currentTarget.classList.add("dragging");
  }
  function moveResize(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current; if (!active) return;
    updateWidths(resizeColumn(active.widths, active.left, active.widths[active.left] + event.clientX - active.x));
  }
  function keyboardResize(event: KeyboardEvent<HTMLDivElement>, left: RecordColumn) {
    if (event.key === "Escape" && drag.current) { event.preventDefault(); updateWidths(drag.current.widths); finishDrag(); return; }
    const range = columnLimits[left], step = event.shiftKey ? 24 : 8;
    const requested = event.key === "Home" ? range.min : event.key === "End" ? range.max : event.key === "ArrowLeft" ? widths[left] - step : event.key === "ArrowRight" ? widths[left] + step : null;
    if (requested != null) { event.preventDefault(); updateWidths(resizeColumn(widths, left, requested)); }
  }
  const sortable = { formula: "formula_asc", pressure: sort === "pressure_asc" ? "pressure_desc" : "pressure_asc", symmetry: "space_group_asc" };
  function cell(record: MaterialRecord, column: RecordColumn) {
    if (column === "formula") return <><strong className="table-formula"><ChemicalFormula formula={record.formula} /></strong><small className="table-material-id" title={record.materialId}>{record.externalIds?.[0] ?? record.materialId}</small></>;
    if (column === "pressure") return record.pressureGPa == null ? <span className="table-unknown">Not reported</span> : <span className="table-pressure">{record.pressureGPa}</span>;
    if (column === "phase") return <span title={record.phaseId ?? undefined}>{record.phaseLabel ?? "Unassigned"}</span>;
    if (column === "symmetry") return record.spaceGroup ?? "—";
    if (column === "crystal") return record.crystalSystem ?? "—";
    if (column === "record") return <span className="table-record-id" title={record.recordId}>{record.recordId}</span>;
    return record.provenance === "contributed" ? <span className="table-contribution"><b aria-hidden="true">★</b> Contribution<small>{record.dataType} · original data</small></span> : <span className="table-imported">Imported</span>;
  }
  const totalWidth = columns.reduce((sum, column) => sum + widths[column], 0);
  return <div className="record-table-region">
    <div className="record-table-tools"><span>Drag column edges to resize</span><button type="button" aria-label="Reset column widths" onClick={() => updateWidths(fitColumnWidths(columns, scroll.current?.clientWidth ?? 0))}><RotateCcw size={13} /> Reset widths</button></div>
    <div ref={scroll} className="record-table-scroll" tabIndex={0} aria-label="Structure results, scroll horizontally on small screens"><table className="record-table" style={{ width: totalWidth }}>
    <colgroup>{columns.map(column => <col key={column} style={{ width: widths[column] }} />)}</colgroup>
    <thead><tr>{columns.map((column, index) => {
      const range = columnLimits[column];
      const activeSort = column === "pressure" && sort?.startsWith("pressure_") || column === "formula" && sort === "formula_asc" || column === "symmetry" && sort === "space_group_asc";
      return <th key={column} scope="col" aria-sort={activeSort ? sort === "pressure_desc" ? "descending" : "ascending" : undefined}>
      {onSort && column in sortable ? <button className="record-column-sort" type="button" onClick={() => onSort(sortable[column as keyof typeof sortable])}><span>{recordColumns[column]}</span>{activeSort ? sort === "pressure_desc" ? <ArrowDown size={13} /> : <ArrowUp size={13} /> : <ChevronsUpDown size={13} />}</button> : recordColumns[column]}
      <div className={`record-column-resizer${index === columns.length - 1 ? " last" : ""}`} role="separator" tabIndex={0} aria-orientation="vertical" aria-label={`Resize ${recordColumns[column]} column`} aria-valuemin={Math.round(range.min)} aria-valuemax={Math.round(range.max)} aria-valuenow={Math.round(widths[column])} onPointerDown={event => startResize(event, column)} onPointerMove={moveResize} onPointerUp={finishDrag} onLostPointerCapture={finishDrag} onPointerCancel={() => { if (drag.current) updateWidths(drag.current.widths); finishDrag(); }} onKeyDown={event => keyboardResize(event, column)} />
    </th>; })}</tr></thead>
    <tbody>{records.map(record => <tr key={record.recordId}>{columns.map(column => <td key={column}><div className="record-table-cell">{cell(record, column)}</div></td>)}</tr>)}</tbody>
  </table></div></div>;
}
