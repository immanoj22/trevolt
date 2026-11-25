/**
 * SECURITY FIX (VAPT: "API Replay Attack" #140 / "Duplicate Transaction
 * Submission" #189, flagged "Needs Implementation").
 *
 * Generates a fresh, unique key per user action (order placement,
 * withdrawal, wallet transfer, deposit) to send as the `Idempotency-Key`
 * header, matched server-side by Middleware/Security/requireIdempotencyKey.
 * Call this ONCE per user-initiated submit (e.g. inside the click handler,
 * right before the API call) — NOT once per component render, and do not
 * reuse a key across a legitimate retry with different input.
 *
 * Uses crypto.randomUUID() where available (all modern browsers over
 * HTTPS); falls back to a timestamp+random string otherwise so this never
 * throws on an older/non-secure-context environment.
 */
export const generateIdempotencyKey = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (e) {
    // fall through to the fallback below
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};