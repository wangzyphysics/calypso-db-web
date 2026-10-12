"use client";
import { useEffect, useState } from "react";
import { Check, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "./auth-context";
import { AccountNavigation, TestModeNotice } from "./account-navigation";
import { Container } from "@/components/materials/foundations";
import { ScrollRevealPage } from "@/components/materials/scroll-reveal-page";
import { identityClient, IdentityError } from "@/lib/accounts/client";
import { changeTestRole, listTestUsers } from "@/lib/accounts/local-test";
import { type AccountUser, type RoleAudit } from "@/lib/accounts/model";
export function AdminPage() {
  const auth = useAuth();
  const [users, setUsers] = useState<AccountUser[]>([]),
    [audit, setAudit] = useState<RoleAudit[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [pending, setPending] = useState<AccountUser | null>(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data =
        auth.mode === "local-test"
          ? listTestUsers()
          : await identityClient.users();
      setUsers("users" in data ? data.users : data.items);
      setAudit(data.audit);
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof IdentityError && e.status === 401) await auth.refresh();
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, [auth.mode, auth.user?.id]);
  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const role = pending.role === "admin" ? "member" : "admin";
      if (auth.mode === "local-test")
        changeTestRole(pending.id, role, reason.trim(), pending.version);
      else
        await identityClient.changeRole(
          pending.id,
          role,
          reason.trim(),
          pending.version,
          auth.csrf,
        );
      setPending(null);
      setReason("");
      await refresh();
      setMessage("Account role updated. The change has been recorded.");
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof IdentityError && e.status === 401) await auth.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollRevealPage className="account-page admin-page">
      <Container>
        <header className="knowledge-heading account-heading" data-reveal>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>People & permissions.</h1>
          <p>Grant access deliberately. Keep every role change accountable.</p>
        </header>
        <AccountNavigation active="admin" />
        <TestModeNotice />
        <div className="admin-introduction">
          <ShieldCheck size={23} />
          <p>
            Administrative access manages accounts. It does not imply
            unrestricted access to private scientific files. Review and
            calculation permissions will be enforced separately by the backend.
          </p>
        </div>
        <section className="account-panel">
          <div className="account-panel-heading">
            <h2>Accounts</h2>
            <button
              className="text-link"
              disabled={loading || busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
          {loading ? (
            <p role="status">Loading accounts…</p>
          ) : users.length ? (
            <div className="admin-user-list">
              {users.map((user) => (
                <div className="admin-user-row" key={user.id}>
                  <div>
                    <strong>{user.profile.displayName}</strong>
                    <span>{user.email || user.loginLabel || user.id}</span>
                    <small>
                      {user.profile.institution || "Affiliation not set"}
                    </small>
                  </div>
                  <span className="account-role">
                    {user.role === "admin" ? "Administrator" : "Member"}
                  </span>
                  <button
                    type="button"
                    className="secondary-link"
                    disabled={busy || user.id === auth.user?.id}
                    onClick={() => {
                      setPending(user);
                      setReason("");
                      setMessage("");
                    }}
                  >
                    {user.id === auth.user?.id
                      ? "Your account"
                      : user.role === "admin"
                        ? "Remove admin role"
                        : "Grant admin role"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No accounts returned by the service.</p>
          )}
          {pending && (
            <form className="role-change-form account-form" onSubmit={apply}>
              <h3>
                {pending.role === "admin"
                  ? "Remove administrator access"
                  : "Grant administrator access"}
              </h3>
              <p>{pending.email || pending.loginLabel || pending.id}</p>
              <label>
                Reason for this change
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <p className="account-muted">
                This permission applies to account administration. Your own role
                cannot be changed here.
              </p>
              <div className="account-actions">
                <button
                  className="primary-link"
                  disabled={busy || reason.trim().length < 3}
                >
                  Confirm role change
                </button>
                <button
                  type="button"
                  className="secondary-link"
                  disabled={busy}
                  onClick={() => setPending(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {message && (
            <p className="account-success" role="status">
              <Check size={16} />
              {message}
            </p>
          )}
          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="account-panel admin-audit">
          <h2>Role change history</h2>
          <p className="account-muted">
            {auth.mode === "local-test"
              ? "Local test history only. Browser data clearing removes this history."
              : "Recent audit events reported by the service."}
          </p>
          {audit.length ? (
            <ol>
              {audit.map((event) => (
                <li key={event.id}>
                  <span>{new Date(event.at).toLocaleString()}</span>
                  <strong>
                    {users.find((u) => u.id === event.targetId)?.email ||
                      event.targetId}{" "}
                    · {event.previousRole} → {event.role}
                  </strong>
                  <p>{event.reason}</p>
                  <small>
                    Changed by{" "}
                    {users.find((u) => u.id === event.actorId)?.email ||
                      event.actorId}
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <p>No role changes yet.</p>
          )}
        </section>
      </Container>
    </ScrollRevealPage>
  );
}
