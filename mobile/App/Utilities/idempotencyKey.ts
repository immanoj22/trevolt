/**
 * SECURITY FIX (VAPT: "API Replay Attack" #140 / "Duplicate Transaction
 * Submission" #189).
 *
 * The backend now requires a unique `Idempotency-Key` header on every
 * fund-moving submission (future/option order placing, wallet transfer,
 * fiat deposit/withdraw - see Middleware/Security/idempotencyKey.js). A
 * request without the header is rejected with a plain 400 BEFORE the
 * controller runs; because that error body isn't encrypted with the
 * user's secretKey, the encrypted base query can't decrypt it and falls
 * back to a generic "Something went wrong. Please try again." toast.
 *
 * Web already does this (src/lib/idempotencyKey.js) - this is the mobile
 * equivalent. Call it ONCE per user-initiated submit (inside the RTK
 * Query `query()` builder, which re-runs on every trigger), NOT once per
 * render, and never reuse a key across a legitimate retry with changed
 * input.
 *
 * No uuid dependency in the mobile bundle, so this uses the same
 * timestamp + double-random fallback shape web uses when crypto.randomUUID
 * is unavailable. The backend only needs the value to be unique per
 * (user, key); it does not validate the format.
 */
export const generateIdempotencyKey = (): string =>
    `idem-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
