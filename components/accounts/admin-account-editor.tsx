"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { AccountAccessControls } from "./account-access-controls";
import { ResearchProfileFields } from "./profile-fields";
import { useAuth } from "./auth-context";
import { identityClient } from "@/lib/accounts/client";
import { profileSchema, type AccountUser } from "@/lib/accounts/model";

export function AdminAccountEditor({ target, onChanged, onClose }: {
  target: AccountUser; onChanged: (user: AccountUser) => void; onClose: () => void;
}) {
  const auth = useAuth();
  const returnFocus = useRef<HTMLElement | null>(null);
  const [panel, setPanel] = useState<"profile" | "security" | "access">("profile");
  const [profile, setProfile] = useState(target.profile);
  const [reason, setReason] = useState(""), [resetReason, setResetReason] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  useEffect(() => {
    setProfile(target.profile);
    setReason(""); setResetReason(""); setTemporaryPassword(""); setMessage(""); setError("");
  }, [target.id]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); setMessage("");
    try {
      const checked = profileSchema.parse(profile);
      onChanged(await identityClient.adminSaveProfile(target.id, checked, reason.trim(), target.version, auth.csrf));
      setMessage("Research profile updated. The reason and changed fields have been recorded."); setReason("");
    } catch (e) { const checked = profileSchema.safeParse(profile); setError(!checked.success ? checked.error.issues[0].message : (e as Error).message); }
    finally { setBusy(false); }
  }
  async function reset(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); setMessage(""); setTemporaryPassword("");
    try {
      const result = await identityClient.adminResetPassword(target.id, resetReason.trim(), target.version, auth.csrf);
      onChanged(result.user); setTemporaryPassword(result.temporaryPassword); setResetReason("");
      setMessage("Password reset recorded. All previous sessions are revoked; the user must change this temporary password before continuing.");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="admin-manage-overlay" />
    <Dialog.Content className="admin-manage-dialog" aria-label="Manage selected account" onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement; }} onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}>
    <header className="admin-manage-heading"><div><span className="eyebrow">ACCOUNT MANAGEMENT</span><Dialog.Title>Manage {target.username || target.email}</Dialog.Title><Dialog.Description>{target.email} · {target.emailVerified ? "Verified sign-in email" : "Unverified sign-in email"}</Dialog.Description></div><Dialog.Close asChild><button type="button" className="admin-manage-close" aria-label="Close account editor" disabled={busy}><X size={19} /></button></Dialog.Close></header>
    <div className="admin-account-editor">
    {target.demoAccount && <p className="demo-data-label">SYNTHETIC DEMO IDENTITY · No password or sign-in capability.</p>}
    <div className="account-editor-tabs" role="tablist" aria-label="Selected account settings">{([['profile','Research profile'],['security','Password & security'],['access','Access & status']] as const).map(([value,label]) => <button type="button" key={value} role="tab" aria-selected={panel === value} disabled={value === 'security' && (target.demoAccount || target.status !== 'active')} onClick={() => setPanel(value)}>{label}</button>)}</div>
    {panel === "profile" && <form className="account-form" onSubmit={save}>
      <fieldset disabled={busy}><ResearchProfileFields profile={profile} onChange={patch => { setProfile(p => ({ ...p, ...patch })); setError(""); }} />
        <label>Reason for profile update <span className="field-required">Required</span><textarea aria-label="Reason for profile update" required minLength={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <p className="account-muted">This edits research information. It does not change the sign-in email, grant roles or mark an email as verified. Past contribution attribution stays unchanged.</p>
        <button className="primary-link" disabled={busy || reason.trim().length < 3}>Save user profile</button>
      </fieldset>
    </form>}
    {panel === "security" && <form className="account-form admin-password-reset" onSubmit={reset}>
      <h3>Reset user password</h3><p className="account-muted">Generate a temporary password and revoke this user’s sessions. Share it with the account owner through an appropriate private channel; no email is sent automatically.</p>
      <fieldset disabled={busy}>
        <label>Reason for password reset <span className="field-required">Required</span><textarea aria-label="Reason for password reset" required minLength={3} maxLength={500} value={resetReason} onChange={e => setResetReason(e.target.value)} /></label>
        <button className="secondary-link" disabled={busy || resetReason.trim().length < 3}>Generate temporary password</button>
      </fieldset>
    </form>}
    {panel === "access" && <AccountAccessControls user={target} onChanged={onChanged} />}
    {temporaryPassword && <div className="temporary-password-notice" role="status"><strong>Temporary password · shown once</strong><output>{temporaryPassword}</output><p>Copy it now. It is not stored in browser storage or the audit log. Closing this editor hides it.</p><button className="text-link" onClick={() => setTemporaryPassword("")}>Hide temporary password</button></div>}
    {message && <p className="account-success" role="status">{message}</p>}{error && <p className="account-error" role="alert">{error}</p>}
    </div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
