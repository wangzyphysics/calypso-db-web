"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "./auth-context";
import { identityClient, IdentityError } from "@/lib/accounts/client";
import { safeReturnTo, passwordSchema } from "@/lib/accounts/model";

export function PasswordSettings() {
  const auth = useAuth(), router = useRouter(), params = useSearchParams();
  const [current, setCurrent] = useState(""), [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setError(""); setMessage("");
    const valid = passwordSchema.safeParse(password);
    if (!valid.success) { setError(valid.error.issues[0].message); return; }
    if (password !== confirmation) { setError("Your passwords do not match."); return; }
    setBusy(true);
    try {
      auth.acceptSession(await identityClient.changePassword(current, password, auth.csrf));
      setCurrent(""); setPassword(""); setConfirmation(""); setMessage("Password changed. Other sessions have been signed out.");
      if (params.get("returnTo")) router.replace(safeReturnTo(params.get("returnTo")));
    } catch (e) { setError(e instanceof IdentityError && e.status === 401 ? "The current password is incorrect." : (e as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="account-panel password-settings">
    <LockKeyhole size={24} /><h2>Change password</h2>
    {auth.user?.passwordChangeRequired && <p className="account-test-notice" role="alert">An administrator reset your password. Replace the temporary password before accessing materials, contributions or administration.</p>}
    {auth.mode !== "service" ? <p className="account-muted">Password management requires the connected account service.</p> : <form className="account-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>Current password <span className="field-required">Required</span><input aria-label="Current password" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required maxLength={128} /></label>
        <label>New password <span className="field-required">Required</span><input aria-label="New password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={10} maxLength={128} /><small>10–128 characters.</small></label>
        <label>Confirm new password <span className="field-required">Required</span><input aria-label="Confirm new password" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={10} maxLength={128} /></label>
        <button className="primary-link" disabled={busy}>{busy ? "Changing…" : "Change password"}</button>
      </fieldset>
      {error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success" role="status">{message}</p>}
    </form>}
  </section>;
}
