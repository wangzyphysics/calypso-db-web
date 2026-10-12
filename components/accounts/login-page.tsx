"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { useAuth } from "./auth-context";
import { Container } from "@/components/materials/foundations";
import { identityClient, IdentityError } from "@/lib/accounts/client";
import {
  safeReturnTo,
  signupHref,
  type LoginMethod,
} from "@/lib/accounts/model";
import { testAccounts } from "@/lib/accounts/local-test";
import {
  AccountIntroduction,
  LoginMethods,
  ProviderPending,
  methodLabel,
} from "./auth-layout";

export function LoginPage() {
  const auth = useAuth(),
    params = useSearchParams(),
    router = useRouter();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [method, setMethod] = useState<LoginMethod>("password"),
    [destination, setDestination] = useState(""),
    [password, setPassword] = useState("");
  const [code, setCode] = useState(""),
    [challenge, setChallenge] = useState<{
      id: string;
      expiresAt: string;
      retryAt: string;
    } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (auth.user) router.replace(returnTo);
  }, [auth.user, returnTo, router]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const enabled = auth.providers.includes(method),
    retrySeconds = challenge
      ? Math.max(0, Math.ceil((Date.parse(challenge.retryAt) - now) / 1000))
      : 0;
  async function sendCode() {
    if (!enabled || busy || retrySeconds) return;
    setBusy(true);
    setError("");
    try {
      setChallenge(
        await identityClient.challenge(
          method as "email" | "sms",
          destination.trim(),
          auth.csrf,
        ),
      );
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send a code.");
    } finally {
      setBusy(false);
    }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!challenge || busy) return;
    if (Date.parse(challenge.expiresAt) <= Date.now()) {
      setError("This code expired. Request a new one.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      auth.acceptSession(
        await identityClient.verify(challenge.id, code.trim(), auth.csrf),
      );
    } catch (e) {
      setError(
        e instanceof IdentityError && e.status === 400
          ? "The code could not be verified."
          : e instanceof Error
            ? e.message
            : "Sign-in failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function passwordLogin(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (auth.mode === "local-test")
        await auth.signInRegisteredTest(destination, password);
      else
        auth.acceptSession(
          await identityClient.passwordSignIn(destination, password, auth.csrf),
        );
      setPassword("");
    } catch (e) {
      setError(
        e instanceof IdentityError && [400, 401].includes(e.status)
          ? "The account or password is incorrect."
          : e instanceof Error
            ? e.message
            : "Sign-in failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="account-page login-page">
      <Container>
        <div className="login-layout">
          <AccountIntroduction />
          <section className="login-card" aria-labelledby="login-title">
            <span className="eyebrow">CALYPSO ACCOUNT</span>
            <h2 id="login-title">Welcome to CALYPSO.</h2>
            <p className="account-muted">
              Sign in to continue to{" "}
              {returnTo.startsWith("/explore")
                ? "materials exploration"
                : "your workspace"}
              .
            </p>
            <LoginMethods
              value={method}
              busy={busy}
              onChange={(id) => {
                setMethod(id);
                setChallenge(null);
                setCode("");
                setDestination("");
                setPassword("");
                setError("");
              }}
            />
            {auth.loading ? (
              <p role="status">Checking sign-in options…</p>
            ) : method === "password" &&
              (enabled || auth.mode === "local-test") ? (
              <form className="account-form" onSubmit={passwordLogin}>
                {auth.mode === "local-test" && (
                  <p className="local-test-notice">
                    Local test sign-in · Use the account and password you
                    created on this device. Do not use a real password.
                  </p>
                )}
                <label>
                  Account or email
                  <input
                    autoComplete="username"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    maxLength={254}
                    disabled={busy}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={128}
                    disabled={busy}
                  />
                </label>
                <button className="primary-link" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"} <ArrowRight size={16} />
                </button>
              </form>
            ) : enabled ? (
              method === "email" || method === "sms" ? (
                <form onSubmit={verify} className="account-form">
                  <label>
                    {method === "email"
                      ? "Email address"
                      : "Phone number (with country code)"}
                    <input
                      type={method === "email" ? "email" : "tel"}
                      autoComplete={method === "email" ? "email" : "tel"}
                      value={destination}
                      disabled={busy || !!challenge}
                      required
                      maxLength={254}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </label>
                  {challenge && (
                    <>
                      <label>
                        Verification code
                        <input
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          minLength={6}
                          maxLength={6}
                          value={code}
                          required
                          onChange={(e) => setCode(e.target.value)}
                          disabled={busy}
                        />
                      </label>
                      <p className="account-muted" role="status">
                        A code was requested for {destination}. Check your
                        messages.
                      </p>
                      <button
                        type="button"
                        className="text-link"
                        disabled={busy}
                        onClick={() => {
                          setChallenge(null);
                          setCode("");
                        }}
                      >
                        Use a different address or number
                      </button>
                    </>
                  )}
                  <div className="account-actions">
                    <button
                      type="button"
                      className="secondary-link"
                      disabled={
                        busy ||
                        retrySeconds > 0 ||
                        !destination.trim() ||
                        (method === "email"
                          ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)
                          : !/^\+[1-9]\d{6,14}$/.test(destination))
                      }
                      onClick={() => void sendCode()}
                    >
                      {retrySeconds
                        ? `Resend in ${retrySeconds}s`
                        : challenge
                          ? "Resend code"
                          : "Send code"}
                    </button>
                    {challenge && (
                      <button
                        className="primary-link"
                        disabled={busy || !/^\d{6}$/.test(code)}
                      >
                        Sign in <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                method !== "password" && (
                  <a
                    className="primary-link login-provider-link"
                    href={identityClient.oauthHref(method, returnTo)}
                  >
                    Continue with {methodLabel(method)} <ArrowRight size={16} />
                  </a>
                )
              )
            ) : (
              <ProviderPending method={method} />
            )}
            {(error || auth.error) && (
              <p className="account-error" role="alert">
                {error || auth.error}
                {auth.error && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => void auth.refresh()}
                  >
                    Retry connection
                  </button>
                )}
              </p>
            )}
            {auth.mode === "local-test" && (
              <div className="test-login">
                <div>
                  <FlaskConical size={18} />
                  <strong>Preset test accounts</strong>
                  <span>DEMO ONLY</span>
                </div>
                <p>
                  These two demo shortcuts need no password. Newly
                  registered test accounts use the account/password form above.
                  No real identity is verified. Account data stays in this browser
                  and is not shared with other visitors.
                </p>
                {testAccounts.map((account) => (
                  <button
                    className="test-account-button"
                    disabled={busy}
                    key={account.id}
                    onClick={() => {
                      try {
                        auth.signInTest(account.id);
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <span>
                      <strong>{account.label}</strong>
                      <small>{account.email}</small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
            )}
            <p className="login-footnote">
              Your research profile is private by default. You choose whether to
              copy it into a contribution.
            </p>
            <p className="auth-switch">
              New to CALYPSO?{" "}
              <Link href={signupHref(returnTo)}>
                Sign up <ArrowRight size={14} />
              </Link>
            </p>
            <Link className="text-link" href="/">
              Continue browsing the homepage
            </Link>
          </section>
        </div>
      </Container>
    </main>
  );
}
