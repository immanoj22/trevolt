/**
 * SECURITY FIX (VAPT: "Credential Stuffing Protection" — Point 16, flagged
 * "Needs Implementation": CAPTCHA protection for login and registration was
 * pending).
 *
 * Lightweight Google reCAPTCHA v3 integration that does not require adding
 * a new npm dependency: it loads Google's official script tag once and
 * calls `grecaptcha.execute()` to obtain a short-lived token, which is sent
 * to the backend as `captchaToken` (verified server-side in
 * Middleware/Security/captcha.js on the corresponding API).
 *
 * If VITE_RECAPTCHA_SITE_KEY is not configured, getCaptchaToken() resolves
 * to an empty string instead of throwing, so local/dev environments without
 * a real site key are not blocked — the backend independently skips
 * verification when its own RECAPTCHA_SECRET_KEY is unset, and fails the
 * request if only one side is configured, so mismatched setups fail loudly
 * server-side rather than silently client-side.
 */
import { useCallback, useEffect, useRef } from "react";
import config from "../config/env";

const RECAPTCHA_SCRIPT_ID = "recaptcha-v3-script";

const loadRecaptchaScript = (siteKey) => {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }
    const existing = document.getElementById(RECAPTCHA_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.grecaptcha));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * @returns {{ getCaptchaToken: (action: string) => Promise<string> }}
 */
export const useRecaptcha = () => {
  const readyRef = useRef(null);

  useEffect(() => {
    if (config.RECAPTCHA_SITE_KEY) {
      readyRef.current = loadRecaptchaScript(config.RECAPTCHA_SITE_KEY).catch((e) => {
        return null;
      });
    }
  }, []);

  const getCaptchaToken = useCallback(async (action = "submit") => {
    try {
      if (!config.RECAPTCHA_SITE_KEY) {
        // No site key configured (e.g. local dev) — backend will skip
        // verification too when its secret key is likewise unset.
        return "";
      }
      const grecaptcha = readyRef.current
        ? await readyRef.current
        : await loadRecaptchaScript(config.RECAPTCHA_SITE_KEY);
      if (!grecaptcha) return "";
      return await new Promise((resolve) => {
        grecaptcha.ready(() => {
          grecaptcha
            .execute(config.RECAPTCHA_SITE_KEY, { action })
            .then(resolve)
            .catch((e) => {
              resolve("");
            });
        });
      });
    } catch (e) {
      return "";
    }
  }, []);

  return { getCaptchaToken };
};