"use client";
import { useEffect, useState, useCallback } from "react";
import { Database, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  materialsClient,
  MaterialsApiError,
  hasVerifiedChronology,
  type ResourceState,
  type DatabaseStatistics,
  type MaterialRecord,
  type MaterialsResponse,
} from "@/lib/materials/api";
import {
  displaySearchQuery,
  type SearchMode,
  type SearchFilters,
} from "@/lib/materials/search";
import {
  ChemicalFormula,
  EmptyState,
  LoadingSkeleton,
  SectionHeader,
  StatCard,
} from "./foundations";

function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [retry, setRetry] = useState(0);
  const [snapshot, setSnapshot] = useState(() => ({
    load,
    retry: 0,
    state: {
      status: materialsClient.configured ? "loading" : "unconfigured",
    } as ResourceState<T>,
  }));
  // A new query/retry is loading immediately; never display a previous query's
  // records while its replacement request is pending.
  const state: ResourceState<T> = !materialsClient.configured
    ? { status: "unconfigured" }
    : snapshot.load === load && snapshot.retry === retry
      ? snapshot.state
      : { status: "loading" };
  useEffect(() => {
    if (!materialsClient.configured) return;
    const setState = (state: ResourceState<T>) =>
      setSnapshot({ load, retry, state });
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setState({
        status: "error",
        kind: "network",
        message:
          "The data service took too long to respond. Try again shortly.",
      });
      controller.abort();
    }, 15000);
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "ready", data });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            kind: error instanceof MaterialsApiError ? error.kind : "network",
            message:
              error instanceof Error
                ? error.message
                : "The data service could not be reached.",
          });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [load, retry]);
  return { state, retry: () => setRetry((current) => current + 1) };
}
const statsLoader = (signal: AbortSignal) => materialsClient.statistics(signal);
export function useDatabaseStatistics() {
  return useResource<DatabaseStatistics>(statsLoader);
}
const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});
export function DatabaseOverview({
  resource,
}: {
  resource: ReturnType<typeof useDatabaseStatistics>;
}) {
  const { state, retry } = resource;
  const data = state.status === "ready" ? state.data : null;
  const metrics = [
    {
      label: "Materials",
      value:
        data?.materials.count == null
          ? null
          : numberFormat.format(data.materials.count),
      note: data?.materials.definition ?? "Distinct material identities",
    },
    {
      label: "Crystal Phases",
      value:
        data?.phases.count == null
          ? null
          : numberFormat.format(data.phases.count),
      note: data?.phases.definition ?? "Distinct structural phases",
    },
    {
      label: "Structure Records",
      value:
        data?.structureRecords.count == null
          ? null
          : numberFormat.format(data.structureRecords.count),
      note:
        data?.structureRecords.definition ?? "Records at available pressures",
    },
    {
      label: "Pressure Coverage",
      value:
        data?.pressureCoverage.minGPa == null ||
        data.pressureCoverage.maxGPa == null
          ? null
          : `${String(data.pressureCoverage.minGPa)}–${String(data.pressureCoverage.maxGPa)} GPa`,
      note:
        data?.pressureCoverage.definition ?? "Verified database pressure range",
    },
  ];
  return (
    <section
      className="overview-section"
      data-reveal
      aria-busy={state.status === "loading"}
    >
      <SectionHeader
        number="01"
        title="Database at a Glance"
        action={
          <span className="data-status">
            {state.status === "unconfigured"
              ? "Data connection pending"
              : state.status === "ready"
                ? "From the connected database"
                : state.status === "loading"
                  ? "Loading database overview"
                  : "Data service unavailable"}
          </span>
        }
      />
      <div className="stats-grid">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            {...metric}
            pending={state.status === "loading"}
          />
        ))}
      </div>
      {state.status === "unconfigured" && (
        <p className="section-footnote">
          Statistics will appear once a verified data source is connected.
        </p>
      )}
      {state.status === "error" && (
        <div className="inline-error" role="status">
          <p>{state.message}</p>
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
    </section>
  );
}
export function MaterialPreview({ record }: { record: MaterialRecord }) {
  return (
    <article className="material-card">
      <div className="material-card-top">
        <h3>
          <ChemicalFormula formula={record.formula} />
        </h3>
        <span className="record-pressure">
          {record.pressureGPa == null
            ? "Pressure unavailable"
            : `${String(record.pressureGPa)} GPa`}
        </span>
      </div>
      <p className="record-id">{record.materialId}</p>
      <dl className="record-metadata">
        <div>
          <dt>Phase</dt>
          <dd>{record.phaseId ?? "Not supplied"}</dd>
        </div>
        <div>
          <dt>Space group</dt>
          <dd>{record.spaceGroup ?? "Not supplied"}</dd>
        </div>
        <div>
          <dt>Crystal system</dt>
          <dd>{record.crystalSystem ?? "Not supplied"}</dd>
        </div>
      </dl>
      <div className="material-card-bottom">
        <span title={record.recordId}>Record {record.recordId}</span>
        <span>Detail workspace · Upcoming</span>
      </div>
    </article>
  );
}
export function MaterialsSection({
  query,
  mode = "any",
  search = false,
  filters,
}: {
  query?: string;
  mode?: SearchMode;
  search?: boolean;
  filters?: SearchFilters;
}) {
  const loader = useCallback(
    (signal: AbortSignal) =>
      materialsClient.materials({ query, mode, filters, signal }),
    [query, mode, filters],
  );
  const { state, retry } = useResource<MaterialsResponse>(loader);
  const hasCriteria =
    Boolean(query) || Boolean(filters && Object.keys(filters).length);
  const title = search
    ? query
      ? `Search results for “${displaySearchQuery(query, mode)}”`
      : hasCriteria
        ? "Filtered Materials"
        : "Explore Materials"
    : state.status === "ready" && hasVerifiedChronology(state.data)
      ? "Recently Added Materials"
      : "Explore Materials";
  return (
    <section
      className={search ? "results-section" : "content-section"}
      id={search ? "results" : "materials"}
      data-reveal
      aria-busy={state.status === "loading"}
    >
      <SectionHeader
        number={search ? undefined : "04"}
        title={title}
        description={
          search
            ? "Exact structure records at their reported pressure. Record availability does not establish phase stability."
            : "Discover crystal structures at their recorded pressures."
        }
        action={
          state.status === "ready" ? (
            <span className="data-status">
              {numberFormat.format(state.data.total)} structure records
            </span>
          ) : undefined
        }
      />
      <div aria-live="polite">
        {state.status === "loading" && <LoadingSkeleton />}
        {state.status === "unconfigured" && (
          <EmptyState
            icon={Database}
            title={
              hasCriteria
                ? "Your search is ready. The database is not connected yet."
                : "A space for your next discovery"
            }
            description={
              hasCriteria
                ? "Your search is preserved in the URL. Matching materials will appear here once a verified data source is connected."
                : "Material previews will appear when a verified data source is connected. No sample records are shown."
            }
          />
        )}
        {state.status === "error" && (
          <EmptyState
            title="Material data could not be loaded"
            description={state.message}
          >
            <Button variant="outline" onClick={retry}>
              Retry
            </Button>
          </EmptyState>
        )}
        {state.status === "ready" &&
          (state.data.items.length ? (
            <div className="material-grid">
              {state.data.items.map((record) => (
                <MaterialPreview key={record.recordId} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title={
                query
                  ? "No matching structure records"
                  : "No structure records available"
              }
              description={
                query
                  ? "Try a different formula, element combination, or material ID."
                  : "The connected data source has not supplied any material records."
              }
            />
          ))}
      </div>
    </section>
  );
}
