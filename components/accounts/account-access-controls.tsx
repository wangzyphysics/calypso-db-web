"use client";
import { useState } from "react";
import type { AccountUser } from "@/lib/accounts/model";
import { identityClient } from "@/lib/accounts/client";
import { useAuth } from "./auth-context";

type Action = "suspend" | "reactivate" | "delete" | "restore" | "sessions";
const labels: Record<Action, string> = { suspend: "Suspend account", reactivate: "Reactivate account", delete: "Delete account", restore: "Restore account", sessions: "Revoke sessions" };
export function AccountAccessControls({ user, onChanged }: { user: AccountUser; onChanged: (user: AccountUser) => void }) {
  const auth = useAuth(), [action, setAction] = useState<Action | null>(null), [reason, setReason] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const status = user.status ?? "active";
  const actions: Action[] = status === "deleted" ? ["restore"] : status === "suspended" ? ["reactivate", "delete"] : ["suspend", "sessions", "delete"];
  async function apply(event: React.FormEvent) {
    event.preventDefault(); if (!action || busy) return; setBusy(true); setError("");
    try { const updated = action === "sessions" ? await identityClient.adminRevokeSessions(user.id, reason.trim(), user.version, auth.csrf) : await identityClient.adminAccountStatus(user.id, action === "delete" ? "deleted" : action === "suspend" ? "suspended" : "active", reason.trim(), user.version, auth.csrf); onChanged(updated); setAction(null); setReason(""); setMessage("Access updated and recorded in the audit log."); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <div className="account-access-controls"><div className="access-status-summary"><span className={`user-status status-${status}`}>{status}</span><p>{user.statusReason || "No administrative access restriction."}</p></div>
    <div className="account-access-actions">{actions.map(value => <button key={value} type="button" className={value === "delete" ? "danger-link" : "secondary-link"} disabled={busy} onClick={() => { setAction(value); setReason(""); setError(""); setMessage(""); }}>{labels[value]}</button>)}</div>
    {action && <form className="access-confirmation account-form" onSubmit={apply}><h4>{labels[action]} · {user.username}</h4><p>{action === "delete" ? "This removes access and revokes all sessions. The account remains recoverable; contributions, attribution and audit history are retained. No permanent purge occurs." : action === "suspend" ? "The user cannot sign in or make protected requests. All current sessions are revoked immediately." : action === "sessions" ? "All signed-in sessions are revoked. The user can sign in again using their existing credentials." : "Access is restored without recreating prior sessions. The user must sign in again."}</p><label>Reason for account action<textarea aria-label="Reason for account action" required minLength={3} maxLength={500} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label><div className="account-actions"><button className={action === "delete" ? "danger-link" : "primary-link"} disabled={busy || reason.trim().length < 3}>Confirm {labels[action].toLowerCase()}</button><button type="button" className="text-link" disabled={busy} onClick={() => setAction(null)}>Cancel account action</button></div></form>}
    {error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success" role="status">{message}</p>}
  </div>;
}
