/**
 * Client-side pre-validation helpers — they run BEFORE the server action
 * to give friendly error messages with suggestions, since Next.js redacts
 * server action errors in production.
 */

export type ValidationResult =
  | { available: true }
  | { available: false; conflict?: string; suggestion?: number; error?: string };

/** Check if a featured_order value is available. Returns null if value is empty/not set. */
export async function validateFeaturedOrder(
  value: string | number | null | undefined,
  excludeId?: string
): Promise<ValidationResult | null> {
  // Empty value = not featured = always allowed, skip the check
  if (value === null || value === undefined || value === "") return null;

  try {
    const res = await fetch("/api/admin/validate-featured-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, excludeId }),
    });
    if (!res.ok) return null; // fail open — server-side will catch
    return (await res.json()) as ValidationResult;
  } catch {
    return null;
  }
}

/** Check if a shirt-style display_order value is available. */
export async function validateStyleOrder(
  value: string | number | null | undefined,
  excludeId?: string
): Promise<ValidationResult | null> {
  if (value === null || value === undefined || value === "") return null;

  try {
    const res = await fetch("/api/admin/validate-style-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, excludeId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ValidationResult;
  } catch {
    return null;
  }
}

/** Format a friendly conflict message from a validation result */
export function formatConflictMessage(
  fieldLabel: string,
  value: string | number,
  result: { conflict?: string; suggestion?: number; error?: string }
): string {
  if (result.error) return result.error;
  const conflictPart = result.conflict
    ? `is already used by "${result.conflict}"`
    : "is already taken";
  const suggestionPart =
    result.suggestion !== undefined
      ? `. Try ${result.suggestion} instead.`
      : ".";
  return `${fieldLabel} #${value} ${conflictPart}${suggestionPart}`;
}
