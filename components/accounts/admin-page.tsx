"use client";
import { useEffect, useState } from "react";
import { Check, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "./auth-context";
import { AccountNavigation, TestModeNotice } from "./account-navigation";
import { Container } from "@/components/materials/foundations";
import { ScrollRevealPage } from "@/components/materials/scroll-reveal-page";
import { identityClient, IdentityError } from "@/lib/accounts/client";
import { changeTestRole, listTestUsers } from "@/lib/accounts/local-test";
import { type AccountUser, type RoleAudit, type AccountAudit } from "@/lib/accounts/model";
import { AdminStatistics } from "./admin-statistics";
import { AdminAccountEditor } from "./admin-account-editor";
import { ContributionReview } from "./contribution-review";
import { contributionsConfigured } from "@/lib/materials/contributions-api";
export function AdminPage() {
  const auth = useAuth();
  const [section, setSection] = useState<"overview" | "accounts" | "review" | "audit">("overview");
  const [statusFilter, setStatusFilter] = useState("all"), [showDemo, setShowDemo] = useState(false), [userPage, setUserPage] = useState(1);
  const [users, setUsers] = useState<AccountUser[]>([]),
    [audit, setAudit] = useState<RoleAudit[]>([]);
  const [accountAudit, setAccountAudit] = useState<AccountAudit[]>([]);
  const [managed, setManaged] = useState<AccountUser | null>(null), [query, setQuery] = useState("");
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
      setAccountAudit("accountAudit" in data ? data.accountAudit ?? [] : []);
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
  const filteredUsers = users.filter(user => Boolean(user.demoAccount) === showDemo && (statusFilter === "all" || (user.status ?? "active") === statusFilter) && [user.username, user.email, user.profile.displayName, user.profile.institution].some(value => value?.toLowerCase().includes(query.trim().toLowerCase())));
  const shownUsers = filteredUsers.slice((userPage - 1) * 15, userPage * 15);
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
          <h1>Database administration.</h1>
          <p>Monitor the database. Manage accounts. Review research contributions.</p>
        </header>
        <AccountNavigation active="admin" />
        <TestModeNotice />
        <div className="admin-section-navigation" role="tablist" aria-label="Administration sections">{([['overview','Overview'],['accounts','Accounts'],['review','Contribution review'],['audit','Audit log']] as const).map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={section === value} aria-controls={`admin-${value}-panel`} onClick={() => { setSection(value); setPending(null); setManaged(null); }}>{label}{value === 'accounts' && <span>{users.filter(user => !user.demoAccount).length}</span>}</button>)}</div>
        {section === "overview" && <div role="tabpanel" id="admin-overview-panel" aria-label="Overview">{auth.mode === "service" && <AdminStatistics />}</div>}
        {section === "accounts" && <div role="tabpanel" id="admin-accounts-panel" aria-label="Accounts">
        <section className="account-panel" id="accounts">
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
          <div className="admin-account-toolbar"><label className="admin-user-search">Find an account<input aria-label="Find an account" type="search" placeholder="Account, email, name or institution" value={query} onChange={e => { setQuery(e.target.value); setUserPage(1); }} /></label><label>Account status<select aria-label="Account status filter" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setUserPage(1); }}>{[['all','All statuses'],['active','Active'],['suspended','Suspended'],['deleted','Deleted / recoverable']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="demo-user-toggle"><input type="checkbox" checked={showDemo} onChange={e => { setShowDemo(e.target.checked); setUserPage(1); }} />Show demo identities</label></div>
          <p className="admin-user-summary">{filteredUsers.length} {showDemo ? "synthetic demo identities" : "database accounts"} · Showing {filteredUsers.length ? (userPage - 1) * 15 + 1 : 0}–{Math.min(userPage * 15, filteredUsers.length)}</p>
          {loading ? (
            <p role="status">Loading accounts…</p>
          ) : users.length ? (
            <><div className="admin-account-table-scroll"><table className="admin-account-table"><thead><tr><th>Account</th><th>Affiliation</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{shownUsers.map(user => <tr key={user.id}><td><strong>{user.profile.displayName}</strong><small>{user.username} · {user.email}</small>{user.demoAccount && <span className="demo-account-badge">DEMO · no sign-in</span>}</td><td>{user.profile.institution || "Not supplied"}<small>{user.profile.researchGroup}</small></td><td>{user.role === "admin" ? "Administrator" : "Member"}</td><td><span className={`user-status status-${user.status ?? "active"}`}>{user.status ?? "active"}</span></td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td><td>{auth.mode === "service" && user.id !== auth.user?.id ? <button className="text-link" disabled={busy} onClick={() => { setManaged(user); setPending(null); }}>Manage</button> : <span>Your account</span>}{!user.demoAccount && (user.status ?? 'active') === 'active' && user.id !== auth.user?.id && <button className="text-link role-action" disabled={busy} onClick={() => { setPending(user); setReason(''); setManaged(null); }}>{user.role === 'admin' ? 'Remove admin' : 'Grant admin'}</button>}</td></tr>)}</tbody></table></div>{filteredUsers.length === 0 && <p>No matching accounts.</p>}<div className="admin-user-pagination"><button className="secondary-link" disabled={userPage <= 1} onClick={() => setUserPage(userPage - 1)}>Previous accounts</button><span>Page {userPage} of {Math.max(1, Math.ceil(filteredUsers.length / 15))}</span><button className="secondary-link" disabled={userPage * 15 >= filteredUsers.length} onClick={() => setUserPage(userPage + 1)}>Next accounts</button></div></>
          ) : (
            <p>No accounts returned by the service.</p>
          )}
          {managed && <AdminAccountEditor key={managed.id} target={managed} onClose={() => setManaged(null)} onChanged={user => { setManaged(current => current?.id === user.id ? user : current); void refresh(); }} />}
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
        </div>}
        {section === "audit" && <section role="tabpanel" id="admin-audit-panel" className="account-panel admin-audit">
          <h2>Account change history</h2>
          <p className="account-muted">
            {auth.mode === "local-test"
              ? "Local test history only. Browser data clearing removes this history."
              : "Recent audit events reported by the service."}
          </p>
          {accountAudit.length > 0 && <ol>{accountAudit.map(event => <li key={event.id}><span>{new Date(event.at).toLocaleString()}</span><strong>{users.find(user => user.id === event.targetId)?.username || event.targetId} · {event.action.replaceAll("-", " ")}</strong><p>{event.reason}</p><small>Changed by {users.find(user => user.id === event.actorId)?.username || event.actorId}</small></li>)}</ol>}
          <h3>Role changes</h3>
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
        </section>}
        {section === "review" && <div role="tabpanel" id="admin-review-panel">{auth.mode === "service" && contributionsConfigured && <ContributionReview />}</div>}
      </Container>
    </ScrollRevealPage>
  );
}
