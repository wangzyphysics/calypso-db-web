"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/materials/foundations";
import { useAuth } from "./auth-context";
import { AccountIntroduction, LoginMethods, ProviderPending, methodLabel } from "./auth-layout";
import { ResearchProfileFields } from "./profile-fields";
import { emptyProfile, emailSchema, loginHref, safeReturnTo, registrationSchema, type LoginMethod } from "@/lib/accounts/model";
import { identityClient, IdentityError } from "@/lib/accounts/client";

export function SignupPage() {
  const auth = useAuth(), params = useSearchParams(), router = useRouter();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [username, setUsername] = useState(""), [email, setEmail] = useState("");
  const [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [profile, setProfile] = useState(emptyProfile(""));
  const [method, setMethod] = useState<LoginMethod>("password");
  const [passwordRegistration, setPasswordRegistration] = useState(false), [emailVerification, setEmailVerification] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [challenge, setChallenge] = useState<{ id: string; expiresAt: string; retryAt: string } | null>(null);
  const [code, setCode] = useState(""), [now, setNow] = useState(Date.now());
  const local = auth.mode === "local-test", enabled = local || auth.providers.includes(method);
  const emailInvalid = emailTouched && !emailSchema.safeParse(email).success;
  const retrySeconds = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.retryAt) - now) / 1000)) : 0;
  useEffect(() => { if (auth.user) router.replace(returnTo); }, [auth.user, returnTo, router]);
  useEffect(() => {
    if (auth.mode !== "service") return;
    let active = true;
    void identityClient.registrationOptions().then(options => {
      if (active) { setPasswordRegistration(options.passwordRegistration); setEmailVerification(options.emailVerification); }
    }).catch(() => {});
    return () => { active = false; };
  }, [auth.mode]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function sendCode() {
    if (!emailVerification || busy || retrySeconds) return;
    setEmailTouched(true); setError("");
    const address = emailSchema.safeParse(email);
    if (!address.success) return;
    setBusy(true);
    try { setChallenge(await identityClient.challenge("email", address.data, auth.csrf, "sign-up")); setCode(""); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setEmailTouched(true);
    if (busy || auth.loading || !enabled) return;
    setError("");
    try {
      const value = registrationSchema.parse({ username, email, password, profile: { ...profile, contactEmail: email } });
      if (password !== confirmation) throw new Error("Your passwords do not match.");
      setBusy(true);
      if (local) await auth.registerTest(value);
      else if (emailVerification && (method === "password" || method === "email")) {
        if (!challenge || Date.parse(challenge.expiresAt) <= Date.now() || !/^\d{6}$/.test(code))
          throw new Error("Request a valid email code and enter its six digits.");
        auth.acceptSession(await identityClient.register(challenge.id, code, value, auth.csrf));
      } else if (method === "password" && passwordRegistration) {
        auth.acceptSession(await identityClient.registerWithPassword(value, auth.csrf));
      } else if (["wechat", "qq", "google"].includes(method)) {
        const path = await identityClient.registerWithProvider(method as "wechat" | "qq" | "google", value, returnTo, auth.csrf);
        setPassword(""); setConfirmation(""); window.location.assign(path); return;
      } else throw new Error("This registration method is not connected yet.");
      setPassword(""); setConfirmation("");
    } catch (e) {
      const checked = registrationSchema.safeParse({ username, email, password, profile: { ...profile, contactEmail: email } });
      setError(!checked.success ? checked.error.issues[0].message : e instanceof IdentityError && e.status === 409
        ? "This account or email is already registered. Sign in instead." : e instanceof Error ? e.message : "Unable to create an account.");
    } finally { setBusy(false); }
  }
  return <main id="main-content" className="account-page login-page signup-page"><Container><div className="login-layout signup-layout">
    <AccountIntroduction signup />
    <section className="login-card" aria-labelledby="signup-title">
      <span className="eyebrow">CALYPSO ACCOUNT</span><h2 id="signup-title">Create your account.</h2>
      <p className="account-muted">Fields marked Required must be completed. Department and ORCID are optional. Your research details are saved in your profile.</p>
      {local && <p className="local-test-notice">Local test registration · Use fictitious details and a test-only password. No email is sent or identity verified.</p>}
      <form className="account-form registration-form" onSubmit={submit} noValidate>
        <fieldset disabled={busy || auth.loading}>
          <div className="registration-group"><h3><span>01</span>Account details</h3>
            <div className="account-field-grid">
              <label>Account / username <span className="field-required">Required</span>
                <input aria-label="Account / username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={32} placeholder="e.g. pressure.researcher" />
                <small>3–32 characters; start with a letter.</small>
              </label>
              <label>Email address <span className="field-required">Required</span>
                <input aria-label="Email address" type="email" autoComplete="email" value={email} required maxLength={254} disabled={!!challenge} aria-invalid={emailInvalid || undefined} aria-describedby={emailInvalid ? "signup-email-error" : "signup-email-note"} onBlur={() => setEmailTouched(true)} onChange={e => { setEmail(e.target.value); setProfile(p => ({ ...p, contactEmail: e.target.value })); setError(""); }} placeholder="Your email address" />
                {emailInvalid && <small id="signup-email-error" className="field-error" role="alert">Enter a valid email address, for example name@example.org.</small>}
                <small id="signup-email-note">This address is also saved in your research profile.</small>
              </label>
              <label>Password <span className="field-required">Required</span>
                <input aria-label="Password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={10} maxLength={128} />
                <small>10–128 characters; spaces are supported.</small>
              </label>
              <label>Confirm password <span className="field-required">Required</span>
                <input aria-label="Confirm password" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={10} maxLength={128} />
              </label>
            </div>
            <div className="registration-email-verification">
              <label>Email verification code <span>{emailVerification ? "Required" : "Not enabled yet"}</span>
                <input aria-label="Email verification code" value={code} onChange={e => setCode(e.target.value)} disabled={!emailVerification} required={emailVerification} autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder={emailVerification ? "Six-digit code" : "Email verification coming soon"} />
              </label>
              <button type="button" className="secondary-link" disabled={!emailVerification || busy || retrySeconds > 0 || !emailSchema.safeParse(email).success} onClick={() => void sendCode()}>{retrySeconds ? `Resend in ${retrySeconds}s` : challenge ? "Resend code" : "Send code"}</button>
              <p className="account-muted">{emailVerification ? "A code is required to verify ownership of your email. Codes expire and must be requested again when expired." : "Email verification is reserved for a later release. No code is sent or required now; your email remains unverified."}</p>
              {challenge && <button type="button" className="text-link" onClick={() => { setChallenge(null); setCode(""); }}>Change email address</button>}
            </div>
          </div>
          <div className="registration-group"><h3><span>02</span>Research profile</h3>
            <ResearchProfileFields includeEmail={false} profile={profile} onChange={patch => { setProfile(p => ({ ...p, ...patch })); setError(""); }} />
            <p className="account-muted">Country / region starts as China; change it if needed. These details stay private by default.</p>
          </div>
          <div className="registration-group verification-group"><h3><span>03</span>Sign-up method</h3>
            <LoginMethods value={method} busy={busy} onChange={id => { setMethod(id); setError(""); }} />
            {!local && !auth.loading && !enabled ? <ProviderPending method={method} /> : <p className="account-muted">{auth.loading ? "Checking registration options…" : method === "password" ? "Your account and research profile are stored together in the database." : `Continue with ${methodLabel(method)} after completing your details.`}</p>}
          </div>
          {error && <p className="account-error" role="alert">{error}</p>}
          <button className="primary-link registration-submit" disabled={busy || auth.loading || !enabled}>{busy ? "Creating account…" : local ? "Create test account" : "Create account"}<ArrowRight size={16} /></button>
        </fieldset>
      </form>
      {auth.error && <p className="account-error" role="alert">{auth.error}<button className="text-link" type="button" onClick={() => void auth.refresh()}>Retry connection</button></p>}
      <p className="auth-switch">Already have an account? <Link href={loginHref(returnTo)}>Sign in <ArrowRight size={14} /></Link></p>
      <Link className="text-link" href="/">Continue browsing the homepage</Link>
    </section>
  </div></Container></main>;
}
