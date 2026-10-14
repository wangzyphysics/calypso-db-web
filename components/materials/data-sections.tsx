"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  materialsClient,
  MaterialsApiError,
  type ResourceState,
  type DatabaseStatistics,
  type MaterialRecord,
} from "@/lib/materials/api";
import {
  ChemicalFormula,
  SectionHeader,
  StatCard,
} from "./foundations";

import { AnimatedNumber } from "./animated-number";

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
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
          : <AnimatedNumber value={data.materials.count} />,
      note: data?.materials.definition ?? "Distinct material identities",
    },
    {
      label: "Crystal Phases",
      value:
        data?.phases.count == null
          ? null
          : <AnimatedNumber value={data.phases.count} sequence={1} />,
      note: data?.phases.definition ?? "Distinct structural phases",
    },
    {
      label: "Structure Records",
      value:
        data?.structureRecords.count == null
          ? null
          : <AnimatedNumber value={data.structureRecords.count} sequence={2} />,
      note:
        data?.structureRecords.definition ?? "Records at available pressures",
    },
    {
      label: "Pressure Coverage",
      value:
        data?.pressureCoverage.minGPa == null ||
        data.pressureCoverage.maxGPa == null
          ? null
          : <><AnimatedNumber value={data.pressureCoverage.minGPa} sequence={3} />–<AnimatedNumber value={data.pressureCoverage.maxGPa} sequence={4} /> <span className="stat-unit">GPa</span></>,
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
export function MaterialPreview({ record, index = 0 }: { record: MaterialRecord; index?: number }) {
  return (
    <article className="material-card" tabIndex={0} style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}>
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
      <p className="record-id" title={record.materialId}>{record.externalIds?.join(" · ") || record.materialId}</p>
      {record.provenance === "contributed" && <p className="contributed-record-badge"><span aria-hidden="true">★</span> Reviewed contribution · {record.origin} · {record.dataType} · not standardized</p>}
      <dl className="record-metadata">
        <div>
          <dt>Phase</dt>
          <dd title={record.phaseId ?? undefined}>{record.phaseLabel ?? record.phaseId ?? "Not supplied"}</dd>
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
