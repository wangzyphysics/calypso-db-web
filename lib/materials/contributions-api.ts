import { z } from "zod";
import { identityClient, IdentityError } from "../accounts/client.ts";
import { batchSchema, recordSchema, type BatchDraft } from "./batch-contribution.ts";

export const batchStateSchema = z.object({
  id: z.string(), title: z.string(), ownerId: z.string(),
  review: z.enum(["not-submitted", "pending", "needs-information", "approved", "rejected"]),
  reviewNotes: z.string(), submittedAt: z.string().datetime().nullable(), updatedAt: z.string().datetime(), archivedAt: z.string().datetime().nullable(),
  records: z.array(z.object({
    id: z.string(), review: z.string(), publication: z.string(), computation: z.string(),
    ingestion: z.string(), quality: z.string(), percent: z.number().min(0).max(100).nullable(), currentStep: z.string().nullable(), reason: z.string().nullable(),
  })),
});
export type BatchState = z.infer<typeof batchStateSchema>;
const envelope = z.object({ draft: batchSchema, state: batchStateSchema });
const base = process.env.NEXT_PUBLIC_CONTRIBUTIONS_API_BASE?.trim().replace(/\/+$/, "");
if (base && !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(base)) throw new Error("Use a same-origin contribution API.");
export const contributionsConfigured = Boolean(base);
export function serverOwner(ownerKey: string) { return ownerKey.startsWith("service:") && contributionsConfigured; }

async function request<S extends z.ZodTypeAny>(path: string, schema: S, method = "GET", body?: unknown): Promise<z.output<S>> {
  if (!base) throw new Error("Contribution service is not connected.");
  let csrf = "";
  if (method !== "GET") {
    const session = await identityClient.session();
    if (!session.user) throw new IdentityError("Sign in before saving or submitting a batch.", 401);
    csrf = session.csrfToken;
  }
  const response = await fetch(base + path, { method, credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(csrf ? { "X-CSRF-Token": csrf } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) {
    let message = "Contribution request failed.";
    try { const value = z.object({ error: z.string().max(3999) }).safeParse(await response.json()); if (value.success) message = value.data.error; } catch {}
    throw new IdentityError(message, response.status);
  }
  return schema.parse(await response.json());
}
const batchPath = (id: string) => "/batches/" + encodeURIComponent(id);
export const contributionApi = {
  list: (archived = false) => request("/batches" + (archived ? "?archived=true" : ""), z.object({ items: z.array(envelope) })),
  read: (id: string) => request(batchPath(id), envelope),
  save: (draft: BatchDraft) => request(batchPath(draft.id), envelope, "PUT", { draft: batchSchema.parse(draft), expectedUpdatedAt: draft.updatedAt }),
  submit: (id: string) => request(batchPath(id) + "/submit", batchStateSchema, "POST", {}),
  archive: (id: string) => request(batchPath(id), z.object({ ok: z.literal(true) }), "DELETE"),
  restore: (id: string) => request(batchPath(id) + "/restore", z.object({ ok: z.literal(true) }), "POST", {}),
  events: (id: string) => request(batchPath(id) + "/events", z.object({ state: batchStateSchema, events: z.array(z.object({ sequence: z.string(), type: z.string(), detail: z.record(z.unknown()), occurredAt: z.string().datetime() })) })),
  reviewQueue: () => request("/admin/review", z.object({ items: z.array(z.object({ state: batchStateSchema, title: z.string(), contributor: z.object({ name: z.string(), email: z.string() }).passthrough(), visibility: z.string(), records: z.array(recordSchema), files: z.array(z.object({ id: z.string(), path: z.string(), size: z.number(), sha256: z.string() })) })) })),
  review: (state: BatchState, status: "approved" | "rejected" | "needs-information", notes: string) => request("/admin/review/" + encodeURIComponent(state.id), batchStateSchema, "PATCH", { status, notes, expectedUpdatedAt: state.updatedAt }),
  fileHref: (id: string, fileId: string) => base + batchPath(id) + "/files/" + encodeURIComponent(fileId),
};
