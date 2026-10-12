"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/materials/foundations";
import { useAuth } from "./auth-context";
import {
  AccountIntroduction,
  LoginMethods,
  ProviderPending,
  methodLabel,
} from "./auth-layout";
import {
  careerStages,
  emptyProfile,
  loginHref,
  safeReturnTo,
  registrationSchema,
  type LoginMethod,
} from "@/lib/accounts/model";
import { identityClient, IdentityError } from "@/lib/accounts/client";

export function SignupPage() {
  const auth = useAuth(),
    params = useSearchParams(),
    router = useRouter();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [username, setUsername] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const [profile, setProfile] = useState(emptyProfile("")),
    [method, setMethod] = useState<LoginMethod>("email"),
    [phone, setPhone] = useState(""),
    [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{
    id: string;
    expiresAt: string;
    retryAt: string;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());
  const errorRef = useRef<HTMLParagraphElement>(null);
  const local = auth.mode === "local-test",
    enabled = auth.providers.includes(method);
  const retrySeconds = challenge
    ? Math.max(0, Math.ceil((Date.parse(challenge.retryAt) - now) / 1000))
    : 0;
  useEffect(() => {
    if (auth.user) router.replace(returnTo);
  }, [auth.user, returnTo, router]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function registration() {
    const value = registrationSchema.safeParse({
      username,
      email,
      password,
      profile,
    });
    if (!value.success) throw new Error(value.error.issues[0].message);
    if (password !== confirmation)
      throw new Error("Your passwords do not match.");
    return value.data;
  }
  async function sendCode() {
    if (busy || !enabled || retrySeconds || !["email", "sms"].includes(method))
      return;
    setError("");
    try {
      registration(); // Required research details are collected before creating a challenge.
      if (method === "sms" && !/^\+[1-9]\d{6,14}$/.test(phone))
        throw new Error("Enter a phone number with its country code.");
      setBusy(true);
      setChallenge(
        await identityClient.challenge(
          method as "email" | "sms",
          method === "email" ? email.trim() : phone.trim(),
          auth.csrf,
          "sign-up",
        ),
      );
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send a code.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || auth.loading || (!local && !enabled)) return;
    setError("");
    try {
      const value = registration();
      setBusy(true);
      if (local) await auth.registerTest(value);
      else if (method === "email" || method === "sms") {
        if (!challenge || Date.parse(challenge.expiresAt) <= Date.now())
          throw new Error(
            "Request a valid registration code before continuing.",
          );
        if (!/^\d{6}$/.test(code))
          throw new Error("Enter the six-digit verification code.");
        auth.acceptSession(
          await identityClient.register(challenge.id, code, value, auth.csrf),
        );
      } else if (method !== "password") {
        const path = await identityClient.registerWithProvider(
          method,
          value,
          returnTo,
          auth.csrf,
        );
        setPassword("");
        setConfirmation("");
        window.location.assign(path);
        return;
      }
      setPassword("");
      setConfirmation("");
    } catch (e) {
      setError(
        e instanceof IdentityError && e.status === 409
          ? "This account or verified identity is already registered. Sign in instead."
          : e instanceof IdentityError && e.status === 400
            ? "Registration could not be verified. Check your details and code."
            : e instanceof Error
              ? e.message
              : "Unable to create an account.",
      );
    } finally {
      setBusy(false);
    }
  }
  function change(patch: Partial<typeof profile>) {
    setProfile((p) => ({ ...p, ...patch }));
    setError("");
  }
  return (
    <main id="main-content" className="account-page login-page signup-page">
      <Container>
        <div className="login-layout signup-layout">
          <AccountIntroduction signup />
          <section className="login-card" aria-labelledby="signup-title">
            <span className="eyebrow">CALYPSO ACCOUNT</span>
            <h2 id="signup-title">Create your account.</h2>
            <p className="account-muted">
              Set up your account and research profile together. All fields
              below are required.
            </p>
            {local && (
              <p className="local-test-notice">
                Local test registration · Use fictitious information and a
                test-only password. Saved on this device; no email is sent or
                identity verified.
              </p>
            )}
            <form className="account-form registration-form" onSubmit={submit}>
              <fieldset disabled={busy || auth.loading}>
                <div className="registration-group">
                  <h3>
                    <span>01</span>Account details
                  </h3>
                  <div className="account-field-grid">
                    <label>
                      Account / username
                      <input
                        autoComplete="username"
                        aria-label="Account / username"
                        aria-describedby="signup-username-hint"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        maxLength={32}
                        pattern="[a-zA-Z][a-zA-Z0-9_.-]{2,31}"
                        placeholder="e.g. pressure.researcher"
                      />
                      <small id="signup-username-hint" aria-hidden="true">
                        3–32 characters; start with a letter.
                      </small>
                    </label>
                    <label>
                      Email address
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={254}
                        disabled={method === "email" && !!challenge}
                        placeholder={
                          local
                            ? "researcher@example.test"
                            : "Your email address"
                        }
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        autoComplete="new-password"
                        aria-label="Password"
                        aria-describedby="signup-password-hint"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={10}
                        maxLength={128}
                      />
                      <small id="signup-password-hint" aria-hidden="true">
                        10–128 characters; spaces are supported.
                      </small>
                    </label>
                    <label>
                      Confirm password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        required
                        minLength={10}
                        maxLength={128}
                      />
                    </label>
                  </div>
                </div>
                <div className="registration-group">
                  <h3>
                    <span>02</span>Research profile
                  </h3>
                  <div className="account-field-grid">
                    <label>
                      Full name
                      <input
                        autoComplete="name"
                        value={profile.displayName}
                        onChange={(e) =>
                          change({ displayName: e.target.value })
                        }
                        required
                        maxLength={100}
                      />
                    </label>
                    <label>
                      Career stage
                      <select
                        value={profile.careerStage}
                        onChange={(e) =>
                          change({
                            careerStage: e.target
                              .value as typeof profile.careerStage,
                          })
                        }
                        required
                      >
                        <option value="" disabled>
                          Select your career stage
                        </option>
                        {Object.entries(careerStages)
                          .filter(([id]) => id)
                          .map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Institution
                      <input
                        autoComplete="organization"
                        value={profile.institution}
                        onChange={(e) =>
                          change({ institution: e.target.value })
                        }
                        required
                        maxLength={200}
                        placeholder="University, institute or organization"
                      />
                    </label>
                    <label>
                      Research group
                      <input
                        value={profile.researchGroup}
                        onChange={(e) =>
                          change({ researchGroup: e.target.value })
                        }
                        required
                        maxLength={200}
                        placeholder="Group or laboratory name"
                      />
                    </label>
                  </div>
                  <p className="account-muted">
                    These details stay private by default. You choose whether to
                    use them as attribution when contributing data.
                  </p>
                </div>
                <div className="registration-group verification-group">
                  <h3>
                    <span>03</span>Identity verification
                  </h3>
                  <LoginMethods
                    signup
                    value={method}
                    busy={busy}
                    onChange={(id) => {
                      setMethod(id);
                      setChallenge(null);
                      setCode("");
                      setError("");
                    }}
                  />
                  {local ? (
                    <p className="account-muted">
                      Email, phone and third-party verification await the
                      authentication service. This local test does not authorize
                      these providers.
                    </p>
                  ) : auth.loading ? (
                    <p role="status">Checking registration options…</p>
                  ) : !enabled ? (
                    <ProviderPending method={method} />
                  ) : method === "email" || method === "sms" ? (
                    <>
                      {method === "sms" && (
                        <label>
                          Phone number (with country code)
                          <input
                            type="tel"
                            autoComplete="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={!!challenge}
                          />
                        </label>
                      )}
                      {challenge && (
                        <>
                          <label>
                            Verification code
                            <input
                              autoComplete="one-time-code"
                              inputMode="numeric"
                              pattern="[0-9]{6}"
                              required
                              minLength={6}
                              maxLength={6}
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                            />
                          </label>
                          <p role="status" className="account-muted">
                            A registration code was requested. Check your{" "}
                            {method === "email" ? "email" : "messages"}.
                          </p>
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => {
                              setChallenge(null);
                              setCode("");
                            }}
                          >
                            Use a different address or number
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="secondary-link"
                        disabled={retrySeconds > 0}
                        onClick={() => void sendCode()}
                      >
                        {retrySeconds
                          ? `Resend in ${retrySeconds}s`
                          : challenge
                            ? "Resend code"
                            : "Send registration code"}
                      </button>
                    </>
                  ) : (
                    <p className="account-muted">
                      Continue to {methodLabel(method)} after completing your
                      account and research details.
                    </p>
                  )}
                </div>
                {error && (
                  <p
                    className="account-error"
                    role="alert"
                    tabIndex={-1}
                    ref={errorRef}
                  >
                    {error}
                  </p>
                )}
                <button
                  className="primary-link registration-submit"
                  disabled={
                    busy ||
                    auth.loading ||
                    (!local &&
                      (!enabled ||
                        (["email", "sms"].includes(method) && !challenge)))
                  }
                >
                  {busy
                    ? "Creating account…"
                    : local
                      ? "Create test account"
                      : method === "email" || method === "sms"
                        ? "Create account"
                        : `Continue with ${methodLabel(method)}`}
                  <ArrowRight size={16} />
                </button>
              </fieldset>
            </form>
            {auth.error && (
              <p className="account-error" role="alert">
                {auth.error}
                <button
                  className="text-link"
                  type="button"
                  onClick={() => void auth.refresh()}
                >
                  Retry connection
                </button>
              </p>
            )}
            <p className="auth-switch">
              Already have an account?{" "}
              <Link href={loginHref(returnTo)}>
                Sign in <ArrowRight size={14} />
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
