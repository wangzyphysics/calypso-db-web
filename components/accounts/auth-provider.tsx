"use client";
import { useEffect, useRef, useState } from "react";
import { identityClient, IdentityError } from "@/lib/accounts/client";
import {
  type AccountUser,
  type Profile,
  type LoginMethod,
  type Registration,
} from "@/lib/accounts/model";
import * as local from "@/lib/accounts/local-test";
import { AuthContext, type Mode } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Avoid restarting initialization while an anonymous service session is being
  // created: two responses can otherwise leave its cookie and CSRF token mismatched.
  const [mode, setMode] = useState<Mode>(identityClient.configured ? "service" : "unconfigured"),
    [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AccountUser | null>(null),
    [error, setError] = useState("");
  const [providers, setProviders] = useState<LoginMethod[]>([]),
    [csrf, setCsrf] = useState("");
  const expires = useRef(0),
    epoch = useRef(0);
  function acceptSession(session: {
    user: AccountUser | null;
    csrfToken: string;
    expiresAt: string;
  }) {
    if (Date.parse(session.expiresAt) <= Date.now()) {
      setUser(null);
      throw new IdentityError("Your session has expired.", 401);
    }
    expires.current = Date.parse(session.expiresAt);
    setUser(session.user);
    setCsrf(session.csrfToken);
    setError("");
  }
  async function refresh() {
    const current = ++epoch.current;
    setError("");
    try {
      if (identityClient.configured) {
        setMode("service");
        const [session, methods] = await Promise.all([
          identityClient.session(),
          identityClient.providers(),
        ]);
        if (current !== epoch.current) return;
        acceptSession(session);
        setProviders(methods.filter((p) => p.enabled).map((p) => p.id));
      } else if (local.localTestEnabled()) {
        setMode("local-test");
        setUser(local.currentTestUser());
      } else {
        setMode("unconfigured");
        setUser(null);
      }
    } catch (e) {
      if (current === epoch.current) {
        setUser(null);
        setError(
          e instanceof Error ? e.message : "Account service unavailable.",
        );
      }
    } finally {
      if (current === epoch.current) setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const update = () => void refresh();
    const expire = () => {
      if (
        mode === "service" &&
        expires.current &&
        expires.current <= Date.now()
      )
        setUser(null);
      if (mode === "local-test") {
        try {
          if (!local.currentTestUser()) setUser(null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", update);
    window.addEventListener("calypso-test-accounts", update);
    window.addEventListener("focus", update);
    const timer = window.setInterval(expire, 30000);
    return () => {
      ++epoch.current;
      window.removeEventListener("storage", update);
      window.removeEventListener("calypso-test-accounts", update);
      window.removeEventListener("focus", update);
      window.clearInterval(timer);
    };
    // Initialization and visibility/storage synchronization share a single session source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  async function signOut() {
    if (mode === "service") await identityClient.signOut(csrf);
    else if (mode === "local-test") local.signOutTest();
    ++epoch.current;
    setUser(null);
    setError("");
    setCsrf("");
    if (mode === "service") await refresh();
  }
  function signInTest(id: string) {
    if (mode !== "local-test")
      throw new Error("Local test sign-in is disabled.");
    setUser(local.signInTest(id));
    setError("");
  }
  async function saveProfile(profile: Profile, expectedVersion: string) {
    if (!user) throw new Error("Sign in to save your profile.");
    try {
      const updated =
        mode === "local-test"
          ? local.saveTestProfile(user.id, profile, expectedVersion)
          : await identityClient.saveProfile(profile, expectedVersion, csrf);
      setUser((previous) => (previous?.id === updated.id ? updated : previous));
      return updated;
    } catch (e) {
      if (e instanceof IdentityError && e.status === 401) setUser(null);
      throw e;
    }
  }
  async function registerTest(input: Registration) {
    if (mode !== "local-test")
      throw new Error("Local test registration is disabled.");
    setUser(await local.registerTest(input));
    setError("");
  }
  async function signInRegisteredTest(identity: string, password: string) {
    if (mode !== "local-test")
      throw new Error("Local test sign-in is disabled.");
    setUser(await local.signInRegisteredTest(identity, password));
    setError("");
  }
  return (
    <AuthContext.Provider
      value={{
        mode,
        loading,
        user,
        error,
        providers,
        csrf,
        ownerKey: user ? mode + ":" + user.id : "",
        refresh,
        signOut,
        signInTest,
        registerTest,
        signInRegisteredTest,
        saveProfile,
        acceptSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
