export const pageSizes = [10, 20, 50, 100] as const;
export type ResultPreferences = { page: number; pageSize: number; view: "table" | "cards"; grouping: "records" | "phase" };
export function resultPreferences(params: Pick<URLSearchParams, "get">): ResultPreferences {
  const size = Number(params.get("pageSize") ?? 20), page = Number(params.get("page") ?? 1);
  return { page: Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1, pageSize: pageSizes.some(value => value === size) ? size : 20, view: params.get("view") === "cards" ? "cards" : "table", grouping: params.get("grouping") === "phase" ? "phase" : "records" };
}
export function resultRange(total: number, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  return { start: total === 0 || offset >= total ? 0 : offset + 1, end: offset >= total ? 0 : Math.min(offset + pageSize, total), pages: Math.max(1, Math.ceil(total / pageSize)) };
}
export function preferenceParams(preferences: ResultPreferences) {
  return new URLSearchParams({ page: String(preferences.page), pageSize: String(preferences.pageSize), view: preferences.view, grouping: preferences.grouping });
}
