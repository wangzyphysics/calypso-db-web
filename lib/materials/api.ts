import { z } from "zod";
import {
  buildSearchParams,
  type SearchMode,
  type SearchFilters,
} from "./search.ts";

const countMetric = z.object({
  count: z.number().finite().int().nonnegative().nullable(),
  definition: z.string().min(1).max(500),
});
export const statisticsSchema = z.object({
  community: z
    .object({
      registeredUsers: countMetric,
      definition: z.string().min(1).max(500),
      regions: z
        .array(
          z.object({
            countryCode: z.string().regex(/^[A-Z]{3}$/),
            users: z.number().int().nonnegative(),
          }),
        )
        .refine(
          (regions) =>
            new Set(regions.map((region) => region.countryCode)).size ===
            regions.length,
          "Region codes must be unique.",
        ),
    })
    .refine(
      (community) =>
        community.registeredUsers.count == null ||
        community.regions.reduce((sum, region) => sum + region.users, 0) <=
          community.registeredUsers.count,
      "Regional counts cannot exceed the registered-user total.",
    )
    .optional(),
  materials: countMetric,
  phases: countMetric,
  structureRecords: countMetric,
  pressureCoverage: z
    .object({
      minGPa: z.number().finite().nullable(),
      maxGPa: z.number().finite().nullable(),
      definition: z.string().min(1).max(500),
    })
    .refine(
      (p) =>
        (p.minGPa === null && p.maxGPa === null) ||
        (p.minGPa !== null && p.maxGPa !== null && p.minGPa <= p.maxGPa),
      "Pressure endpoints must both exist and be ordered.",
    ),
});
export const materialSchema = z.object({
  recordId: z.string().min(1).max(200),
  materialId: z.string().min(1).max(200),
  formula: z.string().min(1).max(200),
  phaseId: z.string().max(200).nullable(),
  spaceGroup: z.string().max(100).nullable(),
  crystalSystem: z.string().max(100).nullable(),
  pressureGPa: z.number().finite().nullable(),
  createdAt: z.string().datetime({ offset: true }).nullable().optional(),
});
export const materialsSchema = z
  .object({
    items: z.array(materialSchema),
    total: z.number().int().nonnegative(),
    order: z.enum(["unspecified", "created_desc"]),
  })
  .refine(
    (result) => result.total >= result.items.length,
    "Total cannot be smaller than the returned record count.",
  );
export type DatabaseStatistics = z.infer<typeof statisticsSchema>;
export type MaterialRecord = z.infer<typeof materialSchema>;
export type MaterialsResponse = z.infer<typeof materialsSchema>;
export type ResourceState<T> =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "ready"; data: T }
  | {
      status: "error";
      kind: "unauthorized" | "network" | "invalid";
      message: string;
    };

export class MaterialsApiError extends Error {
  kind: "unauthorized" | "network" | "invalid";
  constructor(kind: "unauthorized" | "network" | "invalid", message: string) {
    super(message);
    this.kind = kind;
  }
}
export function createMaterialsClient(
  baseUrl?: string,
  fetcher: typeof fetch = fetch,
) {
  const base = baseUrl?.trim().replace(/\/+$/, "");
  if (base && !/^(https?:\/\/|\/(?!\/))/.test(base))
    throw new MaterialsApiError(
      "invalid",
      "The data service URL must be HTTP(S) or a same-origin path.",
    );
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (!base)
      throw new MaterialsApiError(
        "invalid",
        "A materials data service has not been configured.",
      );
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, {
        signal,
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new MaterialsApiError(
        "network",
        "The data service could not be reached. Try again shortly.",
      );
    }
    if (response.status === 401 || response.status === 403)
      throw new MaterialsApiError(
        "unauthorized",
        "The data service requires authorization. Contact the database administrator.",
      );
    if (!response.ok)
      throw new MaterialsApiError(
        "network",
        "The data service is temporarily unavailable. Try again shortly.",
      );
    try {
      return schema.parse(await response.json());
    } catch {
      throw new MaterialsApiError(
        "invalid",
        "The data service returned an unsupported response. No records or counts are displayed.",
      );
    }
  }
  return {
    configured: Boolean(base),
    statistics: (signal?: AbortSignal) =>
      request("/statistics", statisticsSchema, signal),
    materials: ({
      query,
      mode = "any",
      limit = 6,
      filters = {},
      signal,
    }: {
      query?: string;
      mode?: SearchMode;
      limit?: number;
      filters?: SearchFilters;
      signal?: AbortSignal;
    } = {}) => {
      const params = buildSearchParams(query ?? "", mode, filters);
      params.set("limit", String(limit));
      return request(`/materials?${params}`, materialsSchema, signal);
    },
  };
}
// No default host, legacy endpoint, sample payload, or fabricated fallback.
export const materialsClient = createMaterialsClient(
  process.env.NEXT_PUBLIC_MATERIALS_API_BASE,
);
export function hasVerifiedChronology(data: MaterialsResponse) {
  if (data.order !== "created_desc" || !data.items.length) return false;
  const times = data.items.map((record) =>
    record.createdAt ? Date.parse(record.createdAt) : NaN,
  );
  return times.every(
    (time, i) => Number.isFinite(time) && (i === 0 || times[i - 1] >= time),
  );
}
