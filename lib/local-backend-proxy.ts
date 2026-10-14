import { env } from "cloudflare:workers";
import { resolveBackendTarget, type BackendBindings } from "./backend-target.ts";

/** Same-origin BFF; server bindings select the local or remote API. */
export async function proxyLocalBackend(request: Request) {
  let base: URL;
  try { base = resolveBackendTarget(env as unknown as BackendBindings); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid backend API configuration." }, { status: 503 }); }
  const incoming = new URL(request.url);
  const headers = new Headers();
  for (const name of ["accept", "content-type", "cookie", "origin", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(new URL(incoming.pathname + incoming.search, base), {
      method: request.method, headers,
      ...(request.method !== "GET" && request.method !== "HEAD" ? { body: await request.arrayBuffer() } : {}),
      redirect: "manual", signal: AbortSignal.timeout(30000),
    });
    const outgoing = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    for (const name of ["content-type", "content-disposition", "set-cookie"]) {
      const value = response.headers.get(name); if (value) outgoing.set(name, value);
    }
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch { return Response.json({ error: "The configured database API could not be reached." }, { status: 503 }); }
}
