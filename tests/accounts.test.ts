import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canChangeRole,
  contributionAttribution,
  emptyProfile,
  profileSchema,
  userSchema,
  safeReturnTo,
  loginHref,
  signupHref,
  registrationSchema,
  type AccountUser,
  type Registration,
} from "../lib/accounts/model.ts";
import { createIdentityClient } from "../lib/accounts/client.ts";
import { batchSchema, newBatch } from "../lib/materials/batch-contribution.ts";
const member: AccountUser = {
  id: "m",
  email: "member@example.org",
  emailVerified: true,
  role: "member",
  profile: emptyProfile("Member"),
  version: "v1",
};
const admin: AccountUser = { ...member, id: "a", role: "admin" };
const testPassword = "Test-only password 42";
function signup(
  email = "new@example.test",
  username = "new.scientist",
): Registration {
  return {
    username,
    email,
    password: testPassword,
    profile: {
      ...emptyProfile("New scientist"),
      institution: "QA Institute",
      researchGroup: "QA group",
      careerStage: "doctoral",
      publicProfile: false,
    },
  };
}
test("sign-in return paths preserve query/hash and reject external, encoded and recursive redirects", () => {
  assert.equal(
    safeReturnTo("/explore?type=elements&query=Fe%2CO#results"),
    "/explore?type=elements&query=Fe%2CO#results",
  );
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/%2Fexternal",
    "/\\evil.test",
    "/%5cevil.test",
    "/%0aevil.test",
    "/login?returnTo=/login",
    "/signup?returnTo=/signup",
    "/api/private",
    "/explore%ZZ",
    "",
    null,
  ])
    assert.equal(safeReturnTo(value), "/explore");
  const destination = "/explore?type=elements&query=Fe-O#results";
  for (const href of [loginHref(destination), signupHref(destination)]) {
    assert.equal(
      new URL(href, "https://calypso.invalid").searchParams.get("returnTo"),
      destination,
    );
  }
});
test("registration requires account/password and research details, normalizes identities and rejects privilege fields", () => {
  const value = registrationSchema.parse({
    ...signup(" Scientist@Example.TEST ", " SCIENTIST "),
    profile: { ...signup().profile, displayName: " Scientist " },
  });
  assert.equal(value.username, "scientist");
  assert.equal(value.email, "scientist@example.test");
  assert.equal(value.profile.displayName, "Scientist");
  for (const extra of [
    { role: "admin" },
    { emailVerified: true },
    { publicProfile: true },
  ]) {
    assert.equal(
      registrationSchema.safeParse({ ...signup(), ...extra }).success,
      false,
    );
  }
  for (const patch of [
    { institution: " " },
    { researchGroup: "" },
    { careerStage: "" },
    { publicProfile: true },
  ]) {
    assert.equal(
      registrationSchema.safeParse({
        ...signup(),
        profile: { ...signup().profile, ...patch },
      }).success,
      false,
    );
  }
  assert.equal(
    registrationSchema.safeParse({ ...signup(), password: "short" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...signup(), username: "invalid account" })
      .success,
    false,
  );
});
test("local password checks use independent salts, preserve spaces and reject wrong passwords", async () => {
  const { hashTestPassword, checkTestPassword } =
    await import("../lib/accounts/test-password.ts");
  const first = await hashTestPassword(testPassword),
    second = await hashTestPassword(testPassword);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(await checkTestPassword(testPassword, first), true);
  assert.equal(await checkTestPassword("wrong password", first), false);
  assert.equal(JSON.stringify(first).includes(testPassword), false);
  await assert.rejects(hashTestPassword("short"));
});
test("profiles remain optional for affiliation and reject invalid names/contact/ORCID", () => {
  assert.equal(
    profileSchema.parse(emptyProfile("Researcher")).publicProfile,
    false,
  );
  assert.throws(() => profileSchema.parse(emptyProfile(" ")), /display name/);
  assert.throws(
    () => profileSchema.parse({ ...member.profile, contactEmail: "invalid" }),
    /valid contact/,
  );
  assert.throws(
    () => profileSchema.parse({ ...member.profile, orcid: "anything" }),
    /ORCID/,
  );
  assert.equal(
    profileSchema.parse({
      ...member.profile,
      careerStage: "doctoral",
      researchGroup: "High pressure",
    }).careerStage,
    "doctoral",
  );
});
test("phone and platform identities do not require invented email addresses", () => {
  const user = userSchema.parse({
    ...member,
    email: null,
    emailVerified: false,
    loginLabel: "Phone account ••42",
  });
  assert.equal(user.email, null);
  assert.equal(user.loginLabel, "Phone account ••42");
});
test("attribution is an explicit snapshot and old v2 drafts migrate without losing metadata", () => {
  const profile = {
    ...member.profile,
    institution: "Test Institute",
    researchGroup: "Test Group",
  };
  const snapshot = contributionAttribution(profile);
  profile.institution = "Changed";
  assert.equal(snapshot.institution, "Test Institute");
  const old = {
    ...newBatch(),
    contributor: { name: "Legacy author", email: "legacy@example.org" },
  };
  assert.equal(batchSchema.parse(old).contributor.institution, "");
  assert.equal(batchSchema.parse(old).contributor.name, "Legacy author");
});
test("role changes reject members, self grants and removal of the only admin", () => {
  assert.throws(
    () => canChangeRole(member, member, "admin", [member, admin]),
    /Administrator/,
  );
  assert.throws(
    () => canChangeRole(admin, admin, "member", [member, admin]),
    /another administrator/,
  );
  assert.throws(
    () =>
      canChangeRole({ ...admin, id: "b" }, admin, "member", [member, admin]),
    /last administrator/,
  );
  assert.throws(
    () => canChangeRole(admin, member, "member", [member, admin]),
    /already/,
  );
  assert.doesNotThrow(() =>
    canChangeRole(admin, member, "admin", [member, admin]),
  );
});
test("identity client permits only same-origin BFF and requires CSRF for mutations", async () => {
  for (const url of [
    "https://example.org",
    "//example.org",
    "/api?token=x",
    "/api/../identity",
  ])
    assert.throws(() => createIdentityClient(url), /same-origin/);
  let calls = 0;
  const client = createIdentityClient("/api/identity", async (url, init) => {
    calls++;
    assert.equal(url, "/api/identity/me/profile");
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.cache, "no-store");
    assert.equal(
      (init?.headers as Record<string, string>)["X-CSRF-Token"],
      "csrf",
    );
    const body = JSON.parse(String(init?.body));
    assert.equal(body.expectedVersion, "v1");
    assert.equal(body.profile.institution, "");
    return new Response(JSON.stringify(member));
  });
  await assert.rejects(
    client.saveProfile(member.profile, "v1", ""),
    /refreshed/,
  );
  assert.equal(calls, 0);
  assert.equal(
    (await client.saveProfile(member.profile, "v1", "csrf")).id,
    "m",
  );
  const expired = createIdentityClient(
    "/api/identity",
    async () => new Response("", { status: 401 }),
  );
  await assert.rejects(expired.session(), /expired/);
});
test("local test accounts are disabled outside opted-in loopback development and role audits persist", async () => {
  const local = await import("../lib/accounts/local-test.ts");
  const testEnv = process.env as Record<string, string | undefined>;
  const oldEnv = process.env.NODE_ENV,
    oldFlag = process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS,
    oldDemoFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS;
  const descriptors = ["window", "localStorage", "sessionStorage"].map(
    (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
  );
  const memoryStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
      removeItem: (k: string) => values.delete(k),
    };
  };
  const events = new EventTarget();
  const location = { hostname: "127.0.0.1" };
  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location, dispatchEvent: events.dispatchEvent.bind(events) },
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: memoryStorage(),
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: memoryStorage(),
    });
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS = "false";
    testEnv.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS = "false";
    assert.equal(local.localTestEnabled(), false);
    await assert.rejects(local.registerTest(signup()), /disabled/);
    assert.throws(() => local.signInTest("test-admin"), /disabled/);
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS = "true";
    testEnv.NODE_ENV = "production";
    assert.equal(local.localTestEnabled(), false);
    testEnv.NODE_ENV = "development";
    location.hostname = "public.example.org";
    assert.equal(local.localTestEnabled(), false);
    location.hostname = "127.0.0.1";
    local.signInTest("test-researcher");
    assert.throws(() => local.listTestUsers(), /Administrator/);
    local.saveTestProfile("test-researcher", {
      ...emptyProfile("Test scientist"),
      institution: "QA Institute",
    });
    assert.throws(
      () =>
        local.saveTestProfile("test-researcher", emptyProfile("Stale"), "1"),
      /another tab/,
    );
    local.signOutTest();
    assert.equal(local.currentTestUser(), null);
    local.signInTest("test-admin");
    const target = local
      .listTestUsers()
      .users.find((u) => u.id === "test-researcher")!;
    assert.throws(() =>
      local.changeTestRole(target.id, "admin", "", target.version),
    );
    local.changeTestRole(
      target.id,
      "admin",
      "QA permission flow",
      target.version,
    );
    assert.equal(local.listTestUsers().audit[0].reason, "QA permission flow");
    assert.throws(
      () =>
        local.changeTestRole(
          target.id,
          "member",
          "QA rollback",
          target.version,
        ),
      /changed/,
    );
    const changed = local
      .listTestUsers()
      .users.find((u) => u.id === target.id)!;
    local.changeTestRole(target.id, "member", "QA rollback", changed.version);
    local.signInTest("test-researcher");
    assert.equal(local.currentTestUser()?.profile.institution, "QA Institute");
    assert.equal(local.currentTestUser()?.role, "member");
    local.signOutTest();
    const created = await local.registerTest(
      signup(" NEW@Example.TEST ", " NEW.Scientist "),
    );
    assert.equal(created.role, "member");
    assert.equal(created.emailVerified, false);
    assert.equal(created.profile.publicProfile, false);
    assert.equal(created.profile.contactEmail, "");
    assert.equal(created.profile.institution, "QA Institute");
    assert.equal(created.profile.researchGroup, "QA group");
    assert.equal(created.email, "new@example.test");
    assert.equal(created.username, "new.scientist");
    assert.equal(local.currentTestUser()?.id, created.id);
    assert.throws(() => local.listTestUsers(), /Administrator/);
    assert.throws(() => local.signInTest(created.id), /password/);
    const stored = localStorage.getItem("calypso-local-test-accounts-v1")!;
    assert.equal(stored.includes(testPassword), false);
    local.saveTestProfile(
      created.id,
      { ...created.profile, researchGroup: "Test group" },
      created.version,
    );
    local.signOutTest();
    await assert.rejects(
      local.registerTest(signup("New@EXAMPLE.test", "other.scientist")),
      /already/,
    );
    await assert.rejects(
      local.registerTest(signup("other@example.test", "NEW.SCIENTIST")),
      /already/,
    );
    assert.equal(local.currentTestUser(), null);
    await assert.rejects(
      local.signInRegisteredTest("new.scientist", "wrong password"),
      /incorrect/,
    );
    await assert.rejects(
      local.signInRegisteredTest("unknown@example.test", testPassword),
      /incorrect/,
    );
    assert.equal(
      (await local.signInRegisteredTest(" NEW@EXAMPLE.test ", testPassword)).id,
      created.id,
    );
    assert.equal(local.currentTestUser()?.profile.researchGroup, "Test group");
    local.signOutTest();
    assert.equal(
      (await local.signInRegisteredTest("NEW.SCIENTIST", testPassword)).id,
      created.id,
    );
    local.signOutTest();
    local.signInTest("test-admin");
    assert.equal(local.listTestUsers().users.length, 3);
    assert.equal("credentials" in local.listTestUsers(), false);
    assert.equal(
      local.listTestUsers().users.find((u) => u.id === "test-researcher")
        ?.profile.institution,
      "QA Institute",
    );
    assert.equal(local.listTestUsers().audit.length, 2);
    local.signOutTest();
    for (let i = 0; i < 7; i++) {
      await local.registerTest(signup(`test-${i}@example.test`, `test-${i}`));
      local.signOutTest();
    }
    await assert.rejects(
      local.registerTest(signup("overflow@example.test", "overflow")),
      /10-account/,
    );
    testEnv.NODE_ENV = "production";
    await assert.rejects(
      local.signInRegisteredTest("new.scientist", testPassword),
      /disabled/,
    );
    await assert.rejects(local.registerTest(signup()), /disabled/);
    location.hostname = "public.example.org";
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS = "false";
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS = "true";
    assert.equal(local.localTestEnabled(), true);
    local.signInTest("test-admin");
    assert.equal(local.currentTestUser()?.id, "test-admin");
    assert.ok(local.listTestUsers().users.length > 0);
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS = "false";
    assert.equal(local.localTestEnabled(), false);
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS = "true";
    Reflect.deleteProperty(globalThis, "window");
    assert.equal(local.localTestEnabled(), false);
  } finally {
    if (oldEnv === undefined) delete testEnv.NODE_ENV;
    else testEnv.NODE_ENV = oldEnv;
    if (oldFlag === undefined)
      delete process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS;
    else process.env.NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS = oldFlag;
    if (oldDemoFlag === undefined)
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS;
    else process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS = oldDemoFlag;
    for (const [key, value] of descriptors) {
      if (value) Object.defineProperty(globalThis, key, value);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
test("registration and password APIs require CSRF, preserve metadata and avoid credentials in redirect URLs", async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const session = {
    user: { ...member, role: "member" },
    csrfToken: "rotated",
    expiresAt: "2099-01-01T00:00:00Z",
  };
  const client = createIdentityClient("/api/identity", async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response(
      JSON.stringify(
        String(url).endsWith("/challenges")
          ? {
              id: "challenge",
              expiresAt: session.expiresAt,
              retryAt: session.expiresAt,
            }
          : String(url).endsWith("/registrations/oauth")
            ? { redirectPath: "/api/identity/oauth/google/start?ticket=opaque" }
            : session,
      ),
    );
  });
  await assert.rejects(
    client.register("challenge", "123456", signup(), ""),
    /refreshed/,
  );
  await assert.rejects(
    client.passwordSignIn("member", testPassword, ""),
    /refreshed/,
  );
  assert.equal(calls.length, 0);
  await client.challenge("email", "member@example.org", "csrf");
  await client.challenge("sms", "+12345678901", "csrf", "sign-up");
  assert.equal(calls[0].body.purpose, undefined);
  assert.equal(calls[1].body.purpose, "sign-up");
  assert.equal(
    (await client.register("challenge", "123456", signup(), "csrf")).user.role,
    "member",
  );
  assert.equal(calls[2].body.username, "new.scientist");
  assert.equal(
    (calls[2].body.profile as Record<string, unknown>).institution,
    "QA Institute",
  );
  assert.equal(calls[2].body.email, undefined); // Identity comes from the verified challenge.
  assert.equal(calls[2].body.role, undefined);
  await client.passwordSignIn(" new.scientist ", testPassword, "csrf");
  assert.equal(calls[3].url, "/api/identity/password/sign-in");
  assert.equal(calls[3].body.identity, "new.scientist");
  const path = await client.registerWithProvider(
    "google",
    signup(),
    "/explore?query=Fe-O#results",
    "csrf",
  );
  assert.equal(path, "/api/identity/oauth/google/start?ticket=opaque");
  assert.equal(path.includes(testPassword), false);
  assert.equal(path.includes("new.scientist"), false);
  assert.equal(calls[4].body.returnTo, "/explore?query=Fe-O#results");
  const invalid = createIdentityClient(
    "/api/identity",
    async () => new Response(JSON.stringify({ ...session, user: null })),
  );
  await assert.rejects(
    invalid.register("challenge", "123456", signup(), "csrf"),
  );
  const badRedirect = createIdentityClient(
    "/api/identity",
    async () =>
      new Response(JSON.stringify({ redirectPath: "https://evil.test" })),
  );
  await assert.rejects(
    badRedirect.registerWithProvider("google", signup(), "//evil.test", "csrf"),
    /invalid redirect/,
  );
});
