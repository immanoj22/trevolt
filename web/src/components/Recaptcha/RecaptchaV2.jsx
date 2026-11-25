/**
 * SECURITY FIX (VAPT: "Credential Stuffing Protection", Point 16) — reCAPTCHA
 * v2 ("I'm not a robot" checkbox) widget, replacing the earlier invisible
 * v3 integration (hooks/useRecaptcha.js, no longer used by Login/Register).
 *
 * Switched from v3 to v2 on request: v3 is invisible (no UI at all beyond a
 * floating badge) and score-based, which some reviewers/users prefer to
 * avoid in favor of an explicit, visible checkbox the user interacts with.
 *
 * IMPORTANT — mobile is unaffected: the backend API (Middleware/Security/
 * captcha.js) is shared by this web app, the admin panel, and native
 * Android/iOS apps. This widget is web-only UI; the backend only *requires*
 * a captchaToken when `platform === "web"` (see the comment in
 * captcha.js), so native app requests (platform: "android" | "ios") never
 * need to render this widget or supply a token at all.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import config from "../../config/env";

const SCRIPT_ID = "recaptcha-v2-script";
let scriptLoadPromise = null;

const loadRecaptchaV2Script = () => {
    if (window.grecaptcha && window.grecaptcha.render) {
        return Promise.resolve(window.grecaptcha);
    }
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            existing.addEventListener("load", () => resolve(window.grecaptcha));
            existing.addEventListener("error", reject);
            return;
        }
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        // No `?render=<sitekey>` here — that query param is what forces v3's
        // invisible auto-execute mode. Loading the bare api.js and calling
        // grecaptcha.render() ourselves is what gives the visible v2 checkbox.
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.grecaptcha);
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return scriptLoadPromise;
};

// Google's v2 checkbox widget only ever renders at a fixed intrinsic size
// (304x78px for size="normal") — there's no official "full width" option in
// the render API. `fullWidth` fakes it with a responsive CSS scale: measure
// the available container width via ResizeObserver, then scale the fixed-size
// widget up (or down) to fill it, compensating the wrapper's height so the
// scaled box doesn't leave a mismatched gap/overlap in the surrounding layout.
const RECAPTCHA_NORMAL_WIDTH = 310;
const RECAPTCHA_NORMAL_HEIGHT = 85;

/**
 * @param {{ onChange: (token: string|null) => void, className?: string, theme?: 'light'|'dark', size?: 'normal'|'compact', fullWidth?: boolean, maxScale?: number, scale?: number }} props
 * Exposes a `reset()` method via ref — call this after a failed
 * login/registration attempt, since a v2 token is single-use and Google
 * requires the user to re-verify before the next submit.
 *
 * `maxScale` caps how far `fullWidth` will stretch the widget — without it,
 * a wide form column (e.g. Register's two-column layout) scales the widget
 * up proportionally to fill the whole width, which also blows up its height
 * (height scales with width) into an oversized box. Defaults to no cap.
 *
 * `scale` is a fixed multiplier (default 1) applied on top of whatever size
 * the widget would otherwise render at - combined with `fullWidth`'s
 * responsive scale when both are used together, or applied on its own
 * (fullWidth not set) to shrink/grow the widget's fixed 304x78 natural size,
 * e.g. `scale={0.5}` to render it at half size.
 */
const RecaptchaV2 = forwardRef(({ onChange, className = "", theme = "light", size = "normal", fullWidth = false, maxScale, scale: fixedScale = 1 }, ref) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const outerRef = useRef(null);
    const [loadError, setLoadError] = useState(false);
    const [scale, setScale] = useState(fixedScale);

    useEffect(() => {
        if (!fullWidth || !outerRef.current) {
            setScale(fixedScale);
            return;
        }

        const updateScale = () => {
            const width = outerRef.current?.clientWidth;
            if (!width) return;
            const nextScale = width / RECAPTCHA_NORMAL_WIDTH;
            setScale((maxScale ? Math.min(nextScale, maxScale) : nextScale) * fixedScale);
        };

        updateScale();
        const observer = new ResizeObserver(updateScale);
        observer.observe(outerRef.current);
        return () => observer.disconnect();
    }, [fullWidth, maxScale, fixedScale]);

    useImperativeHandle(ref, () => ({
        reset: () => {
            try {
                if (window.grecaptcha && widgetIdRef.current !== null) {
                    window.grecaptcha.reset(widgetIdRef.current);
                }
            } catch (e) {
                console.log("RecaptchaV2_reset_err", e);
            }
            onChange(null);
        },
    }));

    useEffect(() => {
        let cancelled = false;

        if (!config.RECAPTCHA_SITE_KEY) {
            // No site key configured (e.g. local dev) — render nothing and
            // let the backend's own "secret key not set" skip handle it,
            // exactly like the previous v3 hook's fallback behavior.
            return;
        }

        loadRecaptchaV2Script()
            .then((grecaptcha) => {
                if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;

                // BUG FIX: `grecaptcha.render` doesn't actually exist yet
                // the instant the <script> tag's onload fires — Google's
                // client finishes its own async internal init slightly
                // after that (this is exactly what `recaptcha__en.js`
                // loading afterward is — the language pack). Calling
                // render() immediately threw `grecaptcha.render is not a
                // function`. Google's documented fix is to wait for
                // `grecaptcha.ready(callback)`, which fires once the
                // client is actually fully initialized — the same pattern
                // the old v3 hook already used correctly for `execute()`,
                // which render() needs too and was missing here.
                grecaptcha.ready(() => {
                    if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
                    try {
                        widgetIdRef.current = grecaptcha.render(containerRef.current, {
                            sitekey: config.RECAPTCHA_SITE_KEY,
                            theme,
                            size,
                            callback: (token) => onChange(token),
                            "expired-callback": () => onChange(null),
                            "error-callback": () => onChange(null),
                        });
                    } catch (renderErr) {
                        if (!cancelled) setLoadError(true);
                    }
                });
            })
            .catch((e) => {
                if (!cancelled) setLoadError(true);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!config.RECAPTCHA_SITE_KEY) return null;

    if (!fullWidth) {
        if (fixedScale === 1) {
            return (
                <div className={className}>
                    <div ref={containerRef} />
                    {loadError && (
                        <p className="text-danger mt-2">
                            Couldn't load the verification widget. Please check your connection and refresh.
                        </p>
                    )}
                </div>
            );
        }

        return (
            <div className={className}>
                <div style={{ width: RECAPTCHA_NORMAL_WIDTH * fixedScale, height: RECAPTCHA_NORMAL_HEIGHT * fixedScale, overflow: "hidden" }}>
                    <div style={{ transform: `scale(${fixedScale})`, transformOrigin: "0 0", width: RECAPTCHA_NORMAL_WIDTH }}>
                        <div ref={containerRef} />
                    </div>
                </div>
                {loadError && (
                    <p className="text-danger mt-2">
                        Couldn't load the verification widget. Please check your connection and refresh.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            <div
                ref={outerRef}
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
                <div style={{ width: RECAPTCHA_NORMAL_WIDTH * scale, height: RECAPTCHA_NORMAL_HEIGHT * scale, overflow: "hidden", borderRadius: 8 }}>
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "0 0",
                            width: RECAPTCHA_NORMAL_WIDTH,
                        }}
                    >
                        <div ref={containerRef} />
                    </div>
                </div>
            </div>
            {loadError && (
                <p className="text-danger mt-2">
                    Couldn't load the verification widget. Please check your connection and refresh.
                </p>
            )}
        </div>
    );
});

RecaptchaV2.displayName = "RecaptchaV2";

export default RecaptchaV2;