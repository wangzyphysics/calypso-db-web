"use client";
import { z } from "zod";
import {
  auditSchema,
  canChangeRole,
  emptyProfile,
  profileSchema,
  registrationSchema,
  userSchema,
  type AccountUser,
  type Profile,
  type Role,
  type Registration,
} from "./model.ts";
import {
  hashTestPassword,
  checkTestPassword,
  passwordRecordSchema,
} from "./test-password.ts";

const accountKey = "calypso-local-test-accounts-v1",
  sessionKey = "calypso-local-test-session-v1";
const storageSchema = z.object({
  users: z.array(userSchema).max(10),
  audit: z.array(auditSchema).max(500),
  credentials: z.record(passwordRecordSchema).default({}),
});
export const testAccounts = [
  {
    id: "test-researcher",
    email: "researcher@calypso.test",
    label: "Test researcher",
    role: "member" as const,
  },
  {
    id: "test-admin",
    email: "admin@calypso.test",
    label: "Test administrator",
    role: "admin" as const,
  },
];
/** Browser-only demo state, never a security boundary or a real identity service. */
export function localTestEnabled() {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === "true") return true;
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS === "true" &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
  );
}
function requireLocal() {
  if (!localTestEnabled()) throw new Error("Local test accounts are disabled.");
}
function readStore() {
  requireLocal();
  const stored = localStorage.getItem(accountKey);
  if (stored) return storageSchema.parse(JSON.parse(stored));
  const initial = {
    users: testAccounts.map((a) => ({
      id: a.id,
      email: a.email,
      emailVerified: false,
      role: a.role,
      profile: emptyProfile(a.label),
      version: "1",
    })),
    audit: [],
  };
  localStorage.setItem(accountKey, JSON.stringify(initial));
  return storageSchema.parse(initial);
}
function writeStore(value: z.infer<typeof storageSchema>) {
  localStorage.setItem(accountKey, JSON.stringify(storageSchema.parse(value)));
  window.dispatchEvent(new Event("calypso-test-accounts"));
}
export function currentTestUser(): AccountUser | null {
  const store = readStore(),
    session = sessionStorage.getItem(sessionKey);
  if (!session) return null;
  const value = z
    .object({ id: z.string(), expiresAt: z.number() })
    .parse(JSON.parse(session));
  if (value.expiresAt <= Date.now()) {
    sessionStorage.removeItem(sessionKey);
    return null;
  }
  return store.users.find((u) => u.id === value.id) ?? null;
}
export function signInTest(id: string) {
  if (!testAccounts.some((a) => a.id === id))
    throw new Error("Use your account and password to sign in.");
  return startTestSession(id);
}
function startTestSession(id: string) {
  const user = readStore().users.find((u) => u.id === id);
  if (!user) throw new Error("Unknown test account.");
  sessionStorage.setItem(
    sessionKey,
    JSON.stringify({ id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }),
  );
  return user;
}
/** Local identities are unverified, private members; never accept caller-supplied roles. */
export async function registerTest(input: Registration) {
  readStore(); // Check mode before handling a password.
  if (currentTestUser())
    throw new Error("Sign out before creating another test account.");
  const value = registrationSchema.parse(input);
  const credential = await hashTestPassword(value.password);
  // Read again after asynchronous hashing so concurrent creations cannot overwrite one another.
  const store = readStore();
  if (currentTestUser())
    throw new Error("Sign out before creating another test account.");
  if (
    store.users.some(
      (u) =>
        u.email?.toLowerCase() === value.email ||
        u.username?.toLowerCase() === value.username,
    )
  )
    throw new Error(
      "This account or email already has a local test account. Sign in instead.",
    );
  if (store.users.length >= 10)
    throw new Error(
      "This device has reached the 10-account local test limit. Use an existing test account.",
    );
  const user = userSchema.parse({
    id: "test-" + crypto.randomUUID(),
    email: value.email,
    username: value.username,
    emailVerified: false,
    role: "member",
    profile: value.profile,
    version: crypto.randomUUID(),
  });
  store.users.push(user);
  store.credentials[user.id] = credential;
  writeStore(store);
  return startTestSession(user.id);
}
export async function signInRegisteredTest(identity: string, password: string) {
  const store = readStore();
  const identifier = identity.trim().toLowerCase();
  const user = store.users.find(
    (u) =>
      u.email?.toLowerCase() === identifier ||
      u.username?.toLowerCase() === identifier,
  );
  if (
    !user ||
    !store.credentials[user.id] ||
    !(await checkTestPassword(password, store.credentials[user.id]))
  )
    throw new Error(
      "The account or password is incorrect. New local accounts require Sign up.",
    );
  return startTestSession(user.id);
}
export function signOutTest() {
  requireLocal();
  sessionStorage.removeItem(sessionKey);
}
export function saveTestProfile(
  id: string,
  profile: Profile,
  expectedVersion?: string,
) {
  const store = readStore(),
    user = store.users.find((u) => u.id === id);
  if (currentTestUser()?.id !== id || !user)
    throw new Error("Sign in to edit your own profile.");
  if (expectedVersion && user.version !== expectedVersion)
    throw new Error(
      "Your profile changed in another tab. Refresh before saving.",
    );
  user.profile = profileSchema.parse(profile);
  user.version = crypto.randomUUID();
  writeStore(store);
  return user;
}
export function listTestUsers() {
  if (currentTestUser()?.role !== "admin")
    throw new Error("Administrator access is required.");
  const { users, audit } = readStore();
  return { users, audit };
}
export function changeTestRole(
  targetId: string,
  next: Role,
  reason: string,
  version: string,
) {
  const store = readStore(),
    actor = currentTestUser(),
    target = store.users.find((u) => u.id === targetId);
  if (!actor || !target) throw new Error("Account not found.");
  if (target.version !== version)
    throw new Error("This account changed. Refresh before trying again.");
  canChangeRole(actor, target, next, store.users);
  const audit = auditSchema.parse({
    id: crypto.randomUUID(),
    actorId: actor.id,
    targetId,
    previousRole: target.role,
    role: next,
    reason,
    at: new Date().toISOString(),
  });
  target.role = next;
  target.version = crypto.randomUUID();
  store.audit = [audit, ...store.audit].slice(0, 500);
  writeStore(store);
  return target;
}
