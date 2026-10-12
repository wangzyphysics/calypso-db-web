import { z } from "zod";

export const careerStages = {
  "": "Prefer not to say",
  undergraduate: "Undergraduate student",
  masters: "Master’s student",
  doctoral: "Doctoral student",
  postdoc: "Postdoctoral researcher",
  faculty: "Faculty / principal investigator",
  researcher: "Researcher / research staff",
  industry: "Industry professional",
  other: "Other",
} as const;
const text = z.string().trim().max(200);
export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name.").max(100),
  contactEmail: z
    .string()
    .trim()
    .max(254)
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Enter a valid contact email.",
    ),
  institution: text,
  department: text,
  researchGroup: text,
  careerStage: z.enum([
    "",
    "undergraduate",
    "masters",
    "doctoral",
    "postdoc",
    "faculty",
    "researcher",
    "industry",
    "other",
  ]),
  orcid: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(v),
      "Use the ORCID format 0000-0000-0000-000X.",
    ),
  countryRegion: z.string().trim().max(100),
  publicProfile: z.boolean(),
});
export type Profile = z.infer<typeof profileSchema>;
export const roleSchema = z.enum(["member", "admin"]);
export type Role = z.infer<typeof roleSchema>;
export const userSchema = z.object({
  id: z.string().min(1).max(200),
  email: z.string().email().nullable(),
  loginLabel: z.string().min(1).max(200).optional(),
  username: z.string().min(3).max(32).optional(),
  emailVerified: z.boolean(),
  role: roleSchema,
  profile: profileSchema,
  version: z.string().min(1),
});
export type AccountUser = z.infer<typeof userSchema>;
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(
    /^[a-z][a-z0-9_.-]{2,31}$/,
    "Use 3–32 letters, numbers, dots, underscores or hyphens, starting with a letter.",
  );
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters for your password.")
  .max(128, "Use no more than 128 characters for your password.");
export const registrationProfileSchema = profileSchema.extend({
  institution: z.string().trim().min(1, "Enter your institution.").max(200),
  researchGroup: z
    .string()
    .trim()
    .min(1, "Enter your research group.")
    .max(200),
  careerStage: z.enum(
    [
      "undergraduate",
      "masters",
      "doctoral",
      "postdoc",
      "faculty",
      "researcher",
      "industry",
      "other",
    ],
    { errorMap: () => ({ message: "Choose your career stage." }) },
  ),
  publicProfile: z.literal(false),
});
export const registrationSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .email("Enter a valid email address."),
    profile: registrationProfileSchema,
  })
  .strict();
export type Registration = z.infer<typeof registrationSchema>;
export const loginMethods = [
  "password",
  "wechat",
  "qq",
  "sms",
  "email",
  "google",
] as const;
export type LoginMethod = (typeof loginMethods)[number];
export const providersSchema = z
  .array(
    z.object({
      id: z.enum(loginMethods),
      enabled: z.boolean(),
    }),
  )
  .refine((items) => new Set(items.map((i) => i.id)).size === items.length);
export const sessionSchema = z.object({
  user: userSchema.nullable(),
  csrfToken: z.string().min(1),
  expiresAt: z.string().datetime(),
});
export const auditSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  targetId: z.string(),
  previousRole: roleSchema,
  role: roleSchema,
  reason: z.string().trim().min(3).max(500),
  at: z.string().datetime(),
});
export type RoleAudit = z.infer<typeof auditSchema>;

export function emptyProfile(displayName: string, contactEmail = ""): Profile {
  return {
    displayName,
    contactEmail,
    institution: "",
    department: "",
    researchGroup: "",
    careerStage: "",
    orcid: "",
    countryRegion: "",
    publicProfile: false,
  };
}
/** Return only internal product routes, never provider URLs or an API endpoint. */
export function safeReturnTo(value: string | null | undefined) {
  if (
    !value ||
    value.length > 2000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return "/explore";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f]/.test(decoded))
      return "/explore";
    const url = new URL(value, "https://calypso.invalid");
    if (
      url.origin !== "https://calypso.invalid" ||
      ![
        "/",
        "/explore",
        "/contribute",
        "/workspace",
        "/account",
        "/admin",
        "/docs",
        "/about",
      ].includes(url.pathname)
    )
      return "/explore";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/explore";
  }
}
export function loginHref(returnTo: string) {
  return "/login?returnTo=" + encodeURIComponent(safeReturnTo(returnTo));
}
export function signupHref(returnTo: string) {
  return "/signup?returnTo=" + encodeURIComponent(safeReturnTo(returnTo));
}
export function canChangeRole(
  actor: AccountUser,
  target: AccountUser,
  next: Role,
  users: AccountUser[],
) {
  if (actor.role !== "admin")
    throw new Error("Administrator access is required.");
  if (target.role === next)
    throw new Error("This account already has that role.");
  if (actor.id === target.id)
    throw new Error("Ask another administrator to change your role.");
  if (
    target.role === "admin" &&
    next === "member" &&
    users.filter((u) => u.role === "admin").length <= 1
  )
    throw new Error("The last administrator cannot be removed.");
}
export function contributionAttribution(profile: Profile) {
  return {
    name: profile.displayName,
    email: profile.contactEmail,
    institution: profile.institution,
    department: profile.department,
    researchGroup: profile.researchGroup,
    careerStage: profile.careerStage ? careerStages[profile.careerStage] : "",
    orcid: profile.orcid,
  };
}
