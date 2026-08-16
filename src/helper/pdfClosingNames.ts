import { UserData } from "@/src/types/auth.types";

export const PDF_ROLE_NAME_DEFAULTS = {
  operationsSupervisor: "Bhuwan Budhathoki",
  operationsManager: "Nitin Prasad",
  generalManager: "Taurean Moses",
  director: "Nish Singh",
} as const;

/** Include only non-empty names so the backend can leave a blank signature line. */
export function compactNameParams(
  names: Record<string, string | undefined | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(names)) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}

export function staffDisplayName(user: UserData | null | undefined): string {
  const full = user?.fullName?.trim();
  if (full) return full;
  return [user?.firstName, user?.middleName, user?.lastName]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(" ");
}
