export type BackendBindings = {
  CALYPSO_BACKEND_MODE?: string;
  CALYPSO_LOCAL_BACKEND_URL?: string;
  CALYPSO_REMOTE_BACKEND_URL?: string;
};

/** Server configuration only: request parameters cannot select a database. */
export function resolveBackendTarget(bindings: BackendBindings): URL {
  const mode = bindings.CALYPSO_BACKEND_MODE ?? "local";
  if (mode !== "local" && mode !== "remote") throw new Error("Backend mode must be local or remote.");
  const target = mode === "local" ? bindings.CALYPSO_LOCAL_BACKEND_URL : bindings.CALYPSO_REMOTE_BACKEND_URL;
  if (!target) throw new Error(`${mode === "local" ? "Local" : "Remote"} database API is not configured.`);
  let base: URL;
  try { base = new URL(target); } catch { throw new Error("Invalid backend API configuration."); }
  if (base.username || base.password || base.pathname !== "/" || base.search || base.hash)
    throw new Error("Use an API origin without credentials, paths or query parameters.");
  if (mode === "local" && (base.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(base.hostname)))
    throw new Error("Use a loopback local API address.");
  if (mode === "remote" && (base.protocol !== "https:" || ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)))
    throw new Error("Use an HTTPS remote API address.");
  return base;
}
