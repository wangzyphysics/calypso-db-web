"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  Files,
  LockKeyhole,
  LogOut,
  Save,
  UserRound,
} from "lucide-react";
import { Container } from "@/components/materials/foundations";
import { ScrollRevealPage } from "@/components/materials/scroll-reveal-page";
import { useAuth } from "./auth-context";
import { AccountNavigation, TestModeNotice } from "./account-navigation";
import {
  careerStages,
  profileSchema,
  type Profile,
} from "@/lib/accounts/model";
export function AccountPage() {
  const auth = useAuth(),
    user = auth.user!,
    router = useRouter(),
    params = useSearchParams();
  const settings = params.get("tab") === "settings";
  const [profile, setProfile] = useState<Profile>(user.profile),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const dirty = JSON.stringify(profile) !== JSON.stringify(user.profile);
  const profileAccount = useRef(user.id),
    profileVersion = useRef(user.version);
  useEffect(() => {
    if (profileAccount.current !== user.id || !dirty) {
      setProfile(user.profile);
      profileVersion.current = user.version;
    }
    profileAccount.current = user.id;
    // A session refresh must not erase unsaved edits. Profile changes use versioned saves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.version]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(patch: Partial<Profile>) {
    if (!dirty) profileVersion.current = user.version;
    setProfile((p) => ({ ...p, ...patch }));
    setMessage("");
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = profileSchema.parse(profile);
      const updated = await auth.saveProfile(value, profileVersion.current);
      profileVersion.current = updated.version;
      setProfile(updated.profile);
      setMessage(
        auth.mode === "local-test"
          ? "Profile saved on this device."
          : "Profile saved.",
      );
    } catch (e) {
      const checked = profileSchema.safeParse(profile);
      setError(
        !checked.success
          ? checked.error.issues[0].message
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await auth.signOut();
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollRevealPage className="account-page">
      <Container>
        <header className="knowledge-heading account-heading" data-reveal>
          <span className="eyebrow">YOUR SCIENTIFIC WORKSPACE</span>
          <h1>My account.</h1>
          <p>A research identity that travels with your contributions.</p>
        </header>
        <AccountNavigation active={settings ? "settings" : "profile"} />
        <TestModeNotice />
        {settings ? (
          <div className="account-settings-grid">
            <section className="account-panel">
              <LockKeyhole size={24} />
              <h2>Sign-in & security</h2>
              <dl className="account-facts">
                <div>
                  <dt>Account identifier</dt>
                  <dd>
                    {user.email ||
                      user.loginLabel ||
                      "External or phone identity"}
                  </dd>
                </div>
                <div>
                  <dt>Verification</dt>
                  <dd>
                    {auth.mode === "local-test"
                      ? "Test identity · not verified"
                      : user.emailVerified
                        ? "Email verified by the sign-in service"
                        : "Email not verified"}
                  </dd>
                </div>
                <div>
                  <dt>Access</dt>
                  <dd>
                    {user.role === "admin"
                      ? "Administrator"
                      : "Research member"}
                  </dd>
                </div>
              </dl>
              <p className="account-muted">
                Contact email in your profile does not change your sign-in
                identity. Account linking, recovery and session management
                require the authentication service.
              </p>
              <button
                type="button"
                className="secondary-link"
                disabled={busy || dirty}
                onClick={() => void logout()}
              >
                <LogOut size={16} />
                Sign out
              </button>
              {dirty && (
                <p className="account-muted">
                  Save or discard your profile edits before signing out.
                </p>
              )}
            </section>
            <section className="account-panel">
              <Building2 size={24} />
              <h2>Privacy & attribution</h2>
              <p>
                Your affiliation and career stage are optional. A batch uses a
                snapshot of the information you explicitly apply; later profile
                edits do not change past attribution.
              </p>
              <p>
                Batch visibility and permission for standardized computation are
                independent choices in the contribution workspace.
              </p>
              <Link href="/contribute" className="text-link">
                Contribution workspace <ArrowUpRight size={16} />
              </Link>
              <p className="account-muted">
                For account help, data requests or deletion requests:{" "}
                <a href="mailto:database@calypso.cn?subject=CALYPSO%20account%20support">
                  database@calypso.cn
                </a>
              </p>
            </section>
          </div>
        ) : (
          <div className="profile-layout">
            <aside className="profile-summary">
              <div className="account-avatar">
                <UserRound size={27} />
              </div>
              <h2>{user.profile.displayName}</h2>
              <p>{user.profile.institution || "Affiliation not set"}</p>
              <span className="account-role">
                {user.role === "admin" ? "Administrator" : "Research member"}
              </span>
              <div className="profile-summary-links">
                <Link href="/workspace">
                  <Files size={17} />
                  My contributions <ArrowUpRight size={14} />
                </Link>
                <Link href="/explore">
                  <Building2 size={17} />
                  Explore materials <ArrowUpRight size={14} />
                </Link>
              </div>
              <p className="account-muted">
                Profile information is self-reported. Adding an affiliation does
                not verify institutional membership.
              </p>
            </aside>
            <form
              className="account-panel account-form"
              data-unsaved={dirty ? "true" : "false"}
              onSubmit={save}
            >
              <div className="account-panel-heading">
                <h2>Research profile</h2>
                <span>{dirty ? "Unsaved changes" : "Up to date"}</span>
              </div>
              <fieldset disabled={busy}>
                <div className="account-field-grid">
                  <label>
                    Display name
                    <input
                      value={profile.displayName}
                      onChange={(e) => change({ displayName: e.target.value })}
                      required
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Contact email <span>Optional</span>
                    <input
                      value={profile.contactEmail}
                      onChange={(e) => change({ contactEmail: e.target.value })}
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Institution <span>Optional</span>
                    <input
                      value={profile.institution}
                      onChange={(e) => change({ institution: e.target.value })}
                      maxLength={200}
                      autoComplete="organization"
                      placeholder="University, institute or organization"
                    />
                  </label>
                  <label>
                    Department <span>Optional</span>
                    <input
                      value={profile.department}
                      onChange={(e) => change({ department: e.target.value })}
                      maxLength={200}
                    />
                  </label>
                  <label>
                    Research group <span>Optional</span>
                    <input
                      value={profile.researchGroup}
                      onChange={(e) =>
                        change({ researchGroup: e.target.value })
                      }
                      maxLength={200}
                      placeholder="Group or laboratory name"
                    />
                  </label>
                  <label>
                    Career stage <span>Optional</span>
                    <select
                      value={profile.careerStage}
                      onChange={(e) =>
                        change({
                          careerStage: e.target.value as Profile["careerStage"],
                        })
                      }
                    >
                      {Object.entries(careerStages).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    ORCID iD <span>Optional</span>
                    <input
                      value={profile.orcid}
                      onChange={(e) => change({ orcid: e.target.value })}
                      maxLength={19}
                      placeholder="0000-0000-0000-000X"
                    />
                  </label>
                  <label>
                    Country / region <span>Optional</span>
                    <input
                      value={profile.countryRegion}
                      onChange={(e) =>
                        change({ countryRegion: e.target.value })
                      }
                      maxLength={100}
                    />
                  </label>
                </div>
                <label className="account-checkbox">
                  <input
                    type="checkbox"
                    checked={profile.publicProfile}
                    disabled={auth.mode === "local-test"}
                    onChange={(e) =>
                      change({ publicProfile: e.target.checked })
                    }
                  />
                  <span>
                    Allow a public research profile
                    <small>
                      {auth.mode === "local-test"
                        ? "Unavailable in local test mode. Profiles remain on this device."
                        : "Profile publication requires platform support. Private contact details must remain protected."}
                    </small>
                  </span>
                </label>
                <p className="account-muted">
                  Contribution pages will ask before copying your name, contact
                  details or affiliation.
                </p>
                <div className="account-actions">
                  <button className="primary-link" disabled={busy || !dirty}>
                    <Save size={16} />
                    {busy ? "Saving…" : "Save profile"}
                  </button>
                  <button
                    type="button"
                    className="secondary-link"
                    disabled={busy || !dirty}
                    onClick={() => {
                      setProfile(user.profile);
                      profileVersion.current = user.version;
                      setMessage("");
                      setError("");
                    }}
                  >
                    Discard changes
                  </button>
                </div>
              </fieldset>
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
            </form>
          </div>
        )}
        {settings && error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
      </Container>
    </ScrollRevealPage>
  );
}
