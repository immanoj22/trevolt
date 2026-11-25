const config = {};

config.API_URL = import.meta.env.VITE_API_URL;
config.ENV = import.meta.env.VITE_ENV_NAME;
config.FRONT_URL = import.meta.env.VITE_FRONT_URL;
config.SERCERT_KEY = import.meta.env.VITE_SECRET_KEY;
config.SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
config.BASE_URL = import.meta.env.VITE_BASE_URL;
config.CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID;
config.FRESHDESK = import.meta.env.VITE_FRESHDESK;
config.IMG_URL = import.meta.env.VITE_IMG_URL;
config.DEMO_URL = import.meta.env.VITE_DEMO_URL;
config.FIREBASECONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_authDomain,
  projectId: import.meta.env.VITE_FIREBASE_projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_appId,
  measurementId: import.meta.env.VITE_FIREBASE_measurementId,
};
config.APPLECONFIG = {
  APPLE_CLIENT_ID: import.meta.env.VITE_APPLE_CLIENT_ID,
  APPLE_REDIRECT_URI: import.meta.env.VITE_APPLE_REDIRECT_URI
};

// ─── Matching Engine Mode ─────────────────────────────────────────────────────
// Controls how Futures and Options orders are matched (mirrors backend MATCHING_MODE).
// "user_to_user"     → Orders are matched against other users in the order book (default)
// "user_to_platform" → Every order is immediately filled by the platform as counterparty
// Falls back to "user_to_user" if the env var is missing/misconfigured, so behavior
// never silently changes without an explicit opt-in.
config.MATCHING_MODE =
  import.meta.env.VITE_MATCHING_MODE === "user_to_platform"
    ? "user_to_platform"
    : "user_to_user";

// SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16) — public
// reCAPTCHA v3 site key used by src/hooks/useRecaptcha.js on the login and
// registration forms. Safe to expose client-side (it's the public key; the
// matching secret key lives only in the backend .env / Secrets Manager).
config.RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default config;