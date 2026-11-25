/**
 * SECURITY FIX (VAPT: "Token Storage Security" / "Sensitive Data in Logs"
 * — Points 44/49/70, 61).
 * This used to read the raw JWT out of localStorage and log it to the
 * console (``) on every call — both the
 * localStorage read and the console leak are now removed. The backend
 * issues the auth token as an httpOnly cookie instead (see
 * Library/authCookie.js on the backend), which the browser sends
 * automatically because axios is configured with `withCredentials: true`
 * (config/axios.js) — no client-side Authorization header is needed, so
 * this helper is intentionally a no-op kept only so any remaining import
 * of it doesn't crash the build.
 */
export const getAuthToken = () => {
    return undefined;
}