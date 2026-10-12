import { z } from "zod";
import {
  auditSchema,
  profileSchema,
  registrationSchema,
  providersSchema,
  safeReturnTo,
  sessionSchema,
  userSchema,
  type Profile,
  type Role,
  type Registration,
} from "./model.ts";

export class IdentityError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}
/** Same-origin BFF only. Credentials and provider secrets never enter browser storage. */
export function createIdentityClient(
  base?: string,
  fetcher: typeof fetch = fetch,
) {
  const prefix = base?.trim().replace(/\/+$/, "");
  if (prefix && !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(prefix))
    throw new Error("Use a same-origin authentication API path.");
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    method = "GET",
    body?: unknown,
    csrfToken?: string,
  ) {
    if (!prefix)
      throw new IdentityError("The sign-in service is not connected.");
    if (method !== "GET" && !csrfToken)
      throw new IdentityError(
        "Your session needs to be refreshed before continuing.",
      );
    const response = await fetcher(prefix + path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new IdentityError(
        response.status === 401
          ? "Your session has expired. Sign in again."
          : response.status === 403
            ? "This action is not permitted."
            : response.status === 409
              ? "This account changed. Refresh before trying again."
              : response.status === 429
                ? "Too many attempts. Please try again later."
                : "The account service could not complete the request.",
        response.status,
      );
    return schema.parse(await response.json());
  }
  return {
    configured: Boolean(prefix),
    session: () => request("/session", sessionSchema),
    providers: () => request("/providers", providersSchema),
    signOut: (csrf: string) =>
      request("/logout", z.object({ ok: z.literal(true) }), "POST", {}, csrf),
    saveProfile: (profile: Profile, version: string, csrf: string) =>
      request(
        "/me/profile",
        userSchema,
        "PATCH",
        { profile: profileSchema.parse(profile), expectedVersion: version },
        csrf,
      ),
    challenge: (
      channel: "email" | "sms",
      destination: string,
      csrf: string,
      purpose: "sign-in" | "sign-up" = "sign-in",
    ) =>
      request(
        "/challenges",
        z.object({
          id: z.string().min(1),
          expiresAt: z.string().datetime(),
          retryAt: z.string().datetime(),
        }),
        "POST",
        { channel, destination, ...(purpose === "sign-up" ? { purpose } : {}) },
        csrf,
      ),
    verify: (challengeId: string, code: string, csrf: string) =>
      request(
        "/challenges/verify",
        sessionSchema,
        "POST",
        { challengeId, code },
        csrf,
      ),
    passwordSignIn: (identity: string, password: string, csrf: string) =>
      request(
        "/password/sign-in",
        sessionSchema.extend({ user: userSchema }),
        "POST",
        { identity: identity.trim(), password },
        csrf,
      ),
    register: (
      challengeId: string,
      code: string,
      input: Registration,
      csrf: string,
    ) => {
      const { username, password, profile } = registrationSchema.parse(input);
      return request(
        "/registrations",
        sessionSchema.extend({ user: userSchema }),
        "POST",
        {
          challengeId,
          code,
          username,
          password,
          profile,
        },
        csrf,
      );
    },
    registerWithProvider: async (
      provider: "wechat" | "qq" | "google",
      input: Registration,
      returnTo: string,
      csrf: string,
    ) => {
      const response = await request(
        "/registrations/oauth",
        z.object({ redirectPath: z.string() }),
        "POST",
        {
          provider,
          registration: registrationSchema.parse(input),
          returnTo: safeReturnTo(returnTo),
        },
        csrf,
      );
      // Only a same-origin BFF start path may receive the protected pending-registration ticket.
      if (
        !response.redirectPath.startsWith(
          prefix + "/oauth/" + provider + "/start?",
        ) ||
        /[\\\u0000-\u001f]/.test(response.redirectPath)
      )
        throw new IdentityError(
          "The registration service returned an invalid redirect.",
        );
      return response.redirectPath;
    },
    oauthHref: (
      provider: "wechat" | "qq" | "google",
      returnTo: string,
      purpose: "sign-in" | "sign-up" = "sign-in",
    ) =>
      prefix +
      "/oauth/" +
      provider +
      "/start?returnTo=" +
      encodeURIComponent(safeReturnTo(returnTo)) +
      (purpose === "sign-up" ? "&intent=sign-up" : ""),
    users: () =>
      request(
        "/admin/users",
        z.object({ items: z.array(userSchema), audit: z.array(auditSchema) }),
      ),
    changeRole: (
      id: string,
      role: Role,
      reason: string,
      version: string,
      csrf: string,
    ) =>
      request(
        "/admin/users/" + encodeURIComponent(id) + "/role",
        userSchema,
        "PATCH",
        { role, reason, expectedVersion: version },
        csrf,
      ),
  };
}
export const identityClient = createIdentityClient(
  process.env.NEXT_PUBLIC_AUTH_API_BASE,
);
