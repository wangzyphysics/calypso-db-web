import test from "node:test";
import assert from "node:assert/strict";
import { resolveBackendTarget } from "../lib/backend-target.ts";

test("local remains the default and does not fall back to remote", () => {
  assert.equal(resolveBackendTarget({ CALYPSO_LOCAL_BACKEND_URL: "http://127.0.0.1:8877" }).origin, "http://127.0.0.1:8877");
  assert.throws(() => resolveBackendTarget({ CALYPSO_REMOTE_BACKEND_URL: "https://api.example.com" }), /Local database API is not configured/);
});
test("remote mode selects only the explicit HTTPS origin", () => {
  assert.equal(resolveBackendTarget({ CALYPSO_BACKEND_MODE: "remote", CALYPSO_LOCAL_BACKEND_URL: "http://localhost:8877", CALYPSO_REMOTE_BACKEND_URL: "https://api.example.com" }).origin, "https://api.example.com");
  assert.throws(() => resolveBackendTarget({ CALYPSO_BACKEND_MODE: "remote", CALYPSO_LOCAL_BACKEND_URL: "http://localhost:8877" }), /Remote database API is not configured/);
});
test("invalid modes, remote HTTP and embedded credentials are rejected", () => {
  assert.throws(() => resolveBackendTarget({ CALYPSO_BACKEND_MODE: "auto" }), /mode/);
  for (const target of ["http://api.example.com", "https://localhost:8877", "https://user:secret@api.example.com", "https://api.example.com/path", "https://api.example.com?db=local"])
    assert.throws(() => resolveBackendTarget({ CALYPSO_BACKEND_MODE: "remote", CALYPSO_REMOTE_BACKEND_URL: target }));
  assert.throws(() => resolveBackendTarget({ CALYPSO_LOCAL_BACKEND_URL: "http://api.example.com" }), /loopback/);
});
