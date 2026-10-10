"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Container, EmptyState } from "./foundations";
import { ScrollRevealPage } from "./scroll-reveal-page";
import { SearchInput } from "./search-input";
import { PeriodicTable } from "./periodic-table";
import { MaterialsSection } from "./data-sections";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  isSearchMode,
  normalizeSearch,
  displaySearchQuery,
  normalizeFilters,
  emptyFilters,
  filtersFromParams,
  elementsFromQuery,
  parseElements,
  validateSelection,
  searchHref,
  crystalSystems,
  type SearchMode,
  type FilterDraft,
  type SearchFilters,
} from "@/lib/materials/search";

export function SearchWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const routeKey = params.toString();
  const applied = useMemo(() => {
    const route = new URLSearchParams(routeKey);
    const type = route.get("type");
    const mode: SearchMode = isSearchMode(type) ? type : "any";
    const rawQuery = route.get("query") ?? "";
    const draft = filtersFromParams(route);
    let query = "",
      filters: SearchFilters = {},
      error = "";
    try {
      if (type && !isSearchMode(type))
        throw new Error(
          "This search type is not supported. Choose a search type below.",
        );
      if (rawQuery) query = normalizeSearch(rawQuery, mode);
      filters = normalizeFilters(draft);
      validateSelection(query, mode, filters);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Check your search.";
    }
    return {
      mode,
      displayQuery: displaySearchQuery(rawQuery, mode),
      query,
      draft,
      filters,
      error,
    };
  }, [routeKey]);
  const [query, setQuery] = useState(applied.displayQuery);
  const [mode, setMode] = useState<SearchMode>(applied.mode);
  const [filters, setFilters] = useState<FilterDraft>(applied.draft);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    setQuery(applied.displayQuery);
    setMode(applied.mode);
    setFilters(applied.draft);
    setError("");
  }, [applied]);
  const selected = elementsFromQuery(query, mode);
  let excluded: string[] = [];
  try {
    excluded = parseElements(filters.excludeElements);
  } catch {
    /* Invalid input is reported on submit. */
  }
  const updateFilter = (key: keyof FilterDraft, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setError("");
  };
  const changeElements = (elements: string[]) => {
    setQuery(elements.join("-"));
    setMode(mode === "system" ? "system" : "elements");
    updateFilter(
      "excludeElements",
      excluded.filter((symbol) => !elements.includes(symbol)).join("-"),
    );
  };
  const changeExcluded = (elements: string[]) => {
    updateFilter("excludeElements", elements.join("-"));
    if (elements.some((symbol) => selected.includes(symbol))) {
      setQuery(
        selected.filter((symbol) => !elements.includes(symbol)).join("-"),
      );
      setMode(mode === "system" ? "system" : "elements");
    }
  };
  const currentFilterCount = Object.values(filters).filter(
    (value) => value !== "",
  ).length;
  const draftChanged =
    query !== applied.displayQuery ||
    mode !== applied.mode ||
    JSON.stringify(filters) !== JSON.stringify(applied.draft);
  return (
    <ScrollRevealPage className="workspace-page discovery-workspace">
      <Container>
        <form
          role="search"
          aria-label="Material search"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              router.push(searchHref(query, mode, normalizeFilters(filters)));
              setError("");
            } catch (reason) {
              setError(
                reason instanceof Error ? reason.message : "Check your search.",
              );
            }
          }}
        >
          <header className="workspace-heading" id="search" data-reveal>
            <span className="eyebrow">MATERIAL DISCOVERY</span>
            <h1>A new perspective on materials.</h1>
            <p>Start with chemistry. Refine by symmetry and pressure.</p>
            <SearchInput
              query={query}
              mode={mode}
              onQueryChange={(value) => {
                setQuery(value);
                setError("");
              }}
              onModeChange={(value) => {
                setMode(value);
                setError("");
              }}
              error={error}
            />
          </header>
          <div className="discovery-grid">
            <aside
              className={`filter-panel${filtersOpen ? " expanded" : ""}`}
              aria-labelledby="filters-heading"
              data-reveal
            >
              <div className="filter-heading">
                <h2 id="filters-heading">
                  <SlidersHorizontal size={17} /> Refine your search
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Reset filters"
                  disabled={!currentFilterCount}
                  onClick={() => {
                    setFilters({ ...emptyFilters });
                    setError("");
                  }}
                >
                  <RotateCcw size={15} />
                </Button>
              </div>
              <button
                type="button"
                className="filter-disclosure"
                aria-expanded={filtersOpen}
                aria-controls="filter-fields"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                {filtersOpen
                  ? "Hide filters"
                  : `Show filters${currentFilterCount ? ` (${currentFilterCount})` : ""}`}
                <ChevronDown size={14} />
              </button>
              <div className="filter-fields" id="filter-fields">
                <fieldset className="composition-filter">
                  <legend>Composition</legend>
                  <label htmlFor="exclude-elements">Exclude elements</label>
                  <Input
                    id="exclude-elements"
                    value={filters.excludeElements}
                    placeholder="e.g. H-He"
                    maxLength={400}
                    onChange={(event) =>
                      updateFilter("excludeElements", event.target.value)
                    }
                  />
                  <span className="field-label">Number of elements</span>
                  <div className="range-fields">
                    <Input
                      aria-label="Minimum number of elements"
                      inputMode="numeric"
                      value={filters.elementsMin}
                      placeholder="Min"
                      maxLength={3}
                      onChange={(event) =>
                        updateFilter("elementsMin", event.target.value)
                      }
                    />
                    <span>–</span>
                    <Input
                      aria-label="Maximum number of elements"
                      inputMode="numeric"
                      value={filters.elementsMax}
                      placeholder="Max"
                      maxLength={3}
                      onChange={(event) =>
                        updateFilter("elementsMax", event.target.value)
                      }
                    />
                  </div>
                </fieldset>
                <fieldset className="symmetry-filter">
                  <legend>Symmetry</legend>
                  <label htmlFor="crystal-system">Crystal system</label>
                  <select
                    id="crystal-system"
                    value={filters.crystalSystem}
                    onChange={(event) =>
                      updateFilter("crystalSystem", event.target.value)
                    }
                  >
                    <option value="">All crystal systems</option>
                    {crystalSystems.map((system) => (
                      <option key={system} value={system}>
                        {system[0].toUpperCase() + system.slice(1)}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="space-group">Space group</label>
                  <Input
                    id="space-group"
                    value={filters.spaceGroup}
                    placeholder="1–230 or Fm-3m"
                    maxLength={40}
                    onChange={(event) =>
                      updateFilter("spaceGroup", event.target.value)
                    }
                  />
                </fieldset>
                <fieldset className="pressure-filter">
                  <legend>
                    Recorded pressure <span>GPa</span>
                  </legend>
                  <div className="pressure-filter-row">
                    <div className="range-fields">
                      <Input
                        aria-label="Minimum pressure in GPa"
                        inputMode="decimal"
                        value={filters.pressureMin}
                        placeholder="Min"
                        maxLength={30}
                        onChange={(event) =>
                          updateFilter("pressureMin", event.target.value)
                        }
                      />
                      <span>–</span>
                      <Input
                        aria-label="Maximum pressure in GPa"
                        inputMode="decimal"
                        value={filters.pressureMax}
                        placeholder="Max"
                        maxLength={30}
                        onChange={(event) =>
                          updateFilter("pressureMax", event.target.value)
                        }
                      />
                    </div>
                    <p className="filter-hint">
                      Filters available records, without interpolation.
                    </p>
                  </div>
                </fieldset>
              </div>
            </aside>
            <div className="discovery-elements" data-reveal>
              <PeriodicTable
                selected={selected}
                excluded={excluded}
                onSelectionChange={changeElements}
                onExcludedChange={changeExcluded}
              />
            </div>
          </div>
          <div className="search-action-row" data-reveal>
            <div>
              <span className="search-draft-status">
                {draftChanged ? "Unapplied changes" : "Search workspace ready"}
              </span>
              <p>
                {currentFilterCount
                  ? `${currentFilterCount} filter conditions selected. `
                  : ""}
                Your selections are saved in the URL when you search.
              </p>
            </div>
            <Button type="submit">
              Explore materials <ArrowRight size={16} />
            </Button>
          </div>
        </form>
        {applied.error ? (
          <EmptyState
            title="Check the saved search"
            description={applied.error}
          />
        ) : (
          <MaterialsSection
            query={applied.query}
            mode={applied.mode}
            filters={applied.filters}
            search
          />
        )}
      </Container>
    </ScrollRevealPage>
  );
}
