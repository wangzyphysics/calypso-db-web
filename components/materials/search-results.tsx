"use client";
import { useCallback, useState } from "react";
import { LayoutGrid, Table2, Layers, ChevronDown, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { materialsClient, type MaterialsResponse, type PhaseGroupsResponse, type PhaseGroup } from "@/lib/materials/api";
import { displaySearchQuery, resultFilterOptions, type SearchMode, type SearchFilters } from "@/lib/materials/search";
import { pageSizes, resultRange, type ResultPreferences } from "@/lib/materials/result-layout";
import { EmptyState, ChemicalFormula, LoadingSkeleton } from "./foundations";
import { MaterialPreview, useResource } from "./data-sections";
import { RecordTable, recordColumns, defaultColumns, type RecordColumn } from "./record-table";
import type { ColumnWidths } from "@/lib/materials/table-columns";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

function PhaseResult({ group, query, mode, filters }: { group: PhaseGroup; query?: string; mode: SearchMode; filters: SearchFilters }) {
  const [open, setOpen] = useState(false), [page, setPage] = useState(0);
  const loader = useCallback((signal: AbortSignal) => open ? materialsClient.materials({ query, mode, filters: { ...filters, sort: "pressure_asc" }, groupKey: group.key, limit: 20, offset: page * 20, signal }) : Promise.resolve({ items: [], total: 0, order: "unspecified" as const }), [open, page, query, mode, filters, group.key]);
  const { state, retry } = useResource<MaterialsResponse>(loader);
  const pressures = group.minGPa == null ? "Pressure not reported" : group.minGPa === group.maxGPa ? `${group.minGPa} GPa` : `${group.minGPa}–${group.maxGPa} GPa`;
  return <article className={`phase-result${open ? " expanded" : ""}`}>
    <button type="button" className="phase-result-summary" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="phase-composition"><ChemicalFormula formula={group.formula} /><small>{group.phaseId ? "Source-assigned phase" : "Unassigned record"}</small></span>
      <span className="phase-label">{group.phaseLabel ?? "Phase not assigned"}<small>{group.spaceGroups.join(" / ") || "Symmetry not supplied"}</small></span>
      <span className="phase-pressure-span"><strong>{pressures}</strong><small>{group.reportedPressureCount} of {group.count} records report pressure</small></span>
      <span className="phase-record-count">{group.count}<small>records</small></span><ChevronDown size={18} />
    </button>
    {open && <div className="phase-result-records"><p>Actual recorded pressures, ordered low to high. Gaps remain gaps; this grouping does not establish phase stability.</p>
      {state.status === "loading" ? <LoadingSkeleton /> : state.status === "ready" ? <><RecordTable records={state.data.items} columns={["formula", "pressure", "symmetry", "crystal", "record"]} />{state.data.total > 20 && <div className="phase-child-pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous records</button><span>{page * 20 + 1}–{Math.min((page + 1) * 20, state.data.total)} of {state.data.total}</span><button disabled={(page + 1) * 20 >= state.data.total} onClick={() => setPage(page + 1)}>Next records</button></div>}</> : <EmptyState title="Phase records unavailable" description={state.status === "error" ? state.message : "Data connection pending."}><button className="text-link" onClick={retry}>Retry</button></EmptyState>}
    </div>}
  </article>;
}

export function SearchResults({ query, mode, filters = {}, preferences, onPreferencesChange, onFiltersChange }: {
  query?: string; mode: SearchMode; filters?: SearchFilters; preferences: ResultPreferences; onPreferencesChange: (next: ResultPreferences) => void; onFiltersChange: (next: SearchFilters) => void;
}) {
  const [columns, setColumns] = useState<RecordColumn[]>(defaultColumns);
  const [tableWidths, setTableWidths] = useState<ColumnWidths>();
  const { page, pageSize, view, grouping } = preferences;
  const loader = useCallback((signal: AbortSignal) => grouping === "phase" ? materialsClient.phaseGroups({ query, mode, filters, limit: pageSize, offset: (page - 1) * pageSize, signal }) : materialsClient.materials({ query, mode, filters, limit: pageSize, offset: (page - 1) * pageSize, signal }), [query, mode, filters, page, pageSize, grouping]);
  const { state, retry } = useResource<MaterialsResponse | PhaseGroupsResponse>(loader);
  const data = state.status === "ready" ? state.data : null;
  const isGrouped = data && "groups" in data;
  const units = data ? isGrouped ? data.groupsTotal : data.total : 0;
  const range = resultRange(units, page, pageSize);
  const change = (patch: Partial<ResultPreferences>) => onPreferencesChange({ ...preferences, ...patch });
  const activeFilters = Object.entries(filters).filter(([field]) => field !== "sort");
  return <section className="result-browser" id="results" aria-busy={state.status === "loading"}>
    <header className="result-summary"><div><span className="eyebrow">SEARCH RESULTS</span><h2>{data ? <><strong>{data.total.toLocaleString()}</strong> matching records</> : "Finding matching records"}</h2><p>{query ? `For ${displaySearchQuery(query, mode)} · ` : "All available compositions · "}{data && isGrouped ? `${data.groupsTotal} phase / unassigned groups` : "Exact database records"}</p></div><div className="result-range">{data ? `Showing ${range.start}–${range.end} of ${units} ${grouping === "phase" ? "groups" : "records"}` : "Loading results…"}<small>{grouping === "phase" ? "Each phase keeps its pressure records together" : `${pageSize} records per page`}</small></div></header>
    {activeFilters.length > 0 && <div className="result-criteria"><span>Applied criteria</span>{activeFilters.map(([field, value]) => <span key={field}>{field in resultFilterOptions ? Object.entries(resultFilterOptions[field as keyof typeof resultFilterOptions]).find(([key]) => key === String(value))?.[1] ?? value : `${field.replace(/([A-Z])/g, " $1")}: ${value}`}</span>)}<a href="#search">Edit search</a></div>}
    <div className="result-toolbar-v2">
      <div className="result-display-modes" role="group" aria-label="Result presentation"><button type="button" aria-pressed={grouping === "records" && view === "table"} onClick={() => change({ grouping: "records", view: "table", page: 1 })}><Table2 size={17} /> Table</button><button type="button" aria-pressed={grouping === "records" && view === "cards"} onClick={() => change({ grouping: "records", view: "cards", page: 1 })}><LayoutGrid size={17} /> Cards</button><button type="button" aria-pressed={grouping === "phase"} onClick={() => change({ grouping: "phase", page: 1 })}><Layers size={17} /> By phase</button></div>
      <div className="result-order-controls"><span className="result-order-label">Sort by</span>
        <DropdownMenu modal={false}><DropdownMenuTrigger asChild><button type="button" className="result-tool-trigger result-sort-trigger" aria-label="Result order"><span>{resultFilterOptions.sort[(filters.sort ?? "created_desc") as keyof typeof resultFilterOptions.sort]}</span><ChevronDown size={14} aria-hidden="true" /></button></DropdownMenuTrigger>
          <DropdownMenuContent className="result-tools-menu result-sort-menu" align="end" sideOffset={6} collisionPadding={12}>
            <DropdownMenuRadioGroup value={filters.sort ?? "created_desc"} onValueChange={sort => onFiltersChange({ ...filters, sort })}>{Object.entries(resultFilterOptions.sort).map(([value, label]) => <DropdownMenuRadioItem value={value} key={value}>{label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {grouping === "records" && view === "table" && <DropdownMenu modal={false}><DropdownMenuTrigger asChild><button type="button" className="result-tool-trigger result-columns-trigger" aria-label="Columns"><Columns3 size={16} aria-hidden="true" /><span>Columns</span><ChevronDown size={14} aria-hidden="true" /></button></DropdownMenuTrigger>
          <DropdownMenuContent className="result-tools-menu result-columns-menu" align="end" sideOffset={6} collisionPadding={12} aria-label="Visible result columns">
            {Object.entries(recordColumns).map(([field, label]) => <DropdownMenuCheckboxItem key={field} checked={columns.includes(field as RecordColumn)} disabled={field === "formula"} onSelect={event => event.preventDefault()} onCheckedChange={checked => setColumns(current => Object.keys(recordColumns).filter(column => column === field ? checked === true : current.includes(column as RecordColumn)) as RecordColumn[])}>{label}</DropdownMenuCheckboxItem>)}
          </DropdownMenuContent>
        </DropdownMenu>}
      </div>
    </div>
    {grouping === "phase" && <p className="phase-group-definition">Grouped by an existing Phase ID within its composition. Unassigned records remain separate. Common symmetry alone does not define a phase.</p>}
    <div className="result-content" aria-live="polite">
      {state.status === "loading" && <LoadingSkeleton />}
      {state.status === "error" && <EmptyState title="Results could not be loaded" description={state.message}><button className="secondary-link" onClick={retry}>Retry</button></EmptyState>}
      {state.status === "unconfigured" && <EmptyState title="Search service unavailable" description="Your criteria are preserved. Connect a data source to load results." />}
      {data && units === 0 && <EmptyState title="No matching records" description="Adjust chemistry, symmetry or pressure in Refine your search."><a className="text-link" href="#search">Edit search criteria</a></EmptyState>}
      {data && units > 0 && (isGrouped ? <div className="phase-result-list">{data.groups.map(group => <PhaseResult key={`${group.key}:${query}:${JSON.stringify(filters)}`} group={group} query={query} mode={mode} filters={filters} />)}</div> : view === "table" ? <RecordTable records={data.items} columns={columns} widths={tableWidths} onWidthsChange={setTableWidths} sort={filters.sort} onSort={sort => onFiltersChange({ ...filters, sort })} /> : <div className="material-grid result-card-grid">{data.items.map((record, index) => <MaterialPreview key={record.recordId} record={record} index={index} />)}</div>)}
      {data && units > 0 && range.start === 0 && <p>No results on this page. <button className="text-link" onClick={() => change({ page: 1 })}>Return to page 1</button></p>}
    </div>
    <footer className="result-pagination-v2"><nav aria-label="Result pages"><button aria-label="Previous result page" disabled={!data || page <= 1} onClick={() => change({ page: page - 1 })}><ChevronLeft size={17} /></button>{Array.from(new Set([1, ...Array.from({ length: 5 }, (_, i) => page + i - 2).filter(value => value > 1 && value < range.pages), range.pages])).sort((a, b) => a - b).map((value, index, pages) => <span key={value}>{index > 0 && value - pages[index - 1] > 1 && <span className="pagination-gap">…</span>}<button disabled={!data} aria-label={`Result page ${value}`} aria-current={page === value ? "page" : undefined} onClick={() => change({ page: value })}>{value}</button></span>)}<button aria-label="Next result page" disabled={!data || page >= range.pages} onClick={() => change({ page: page + 1 })}><ChevronRight size={17} /></button></nav>
      <label>{grouping === "phase" ? "Groups per page" : "Records per page"}<select aria-label="Results per page" value={pageSize} onChange={event => change({ pageSize: Number(event.target.value), page: 1 })}>{pageSizes.map(size => <option key={size} value={size}>{size}</option>)}</select><span>{data ? `${units} total ${grouping === "phase" ? "groups" : "records"}` : "—"}</span></label>
    </footer>
  </section>;
}
