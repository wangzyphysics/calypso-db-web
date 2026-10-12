import { z } from "zod";
import { passwordSchema } from "./model.ts";

/** Development-only credential checks. Real passwords must be hashed by the identity server. */
export const passwordRecordSchema = z.object({
  salt: z.string().regex(/^[a-f0-9]{32}$/),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  iterations: z.literal(600000),
});
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt as BufferSource,
          iterations,
          hash: "SHA-256",
        },
        key,
        256,
      ),
    ),
  );
}
export async function hashTestPassword(password: string) {
  passwordSchema.parse(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return passwordRecordSchema.parse({
    salt: hex(salt),
    hash: await derive(password, salt, 600000),
    iterations: 600000,
  });
}
export async function checkTestPassword(
  password: string,
  input: z.infer<typeof passwordRecordSchema>,
) {
  if (password.length > 128) return false;
  const record = passwordRecordSchema.parse(input);
  const salt = new Uint8Array(
    record.salt.match(/../g)!.map((v) => parseInt(v, 16)),
  );
  const hash = await derive(password, salt, record.iterations);
  let difference = 0;
  for (let i = 0; i < hash.length; i++)
    difference |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return difference === 0;
}
