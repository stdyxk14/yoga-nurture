import { timingSafeEqual } from "node:crypto";

export function isAuthorizedInternalAiCronRequest(authorization: string | null, secret: string | undefined) {
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
