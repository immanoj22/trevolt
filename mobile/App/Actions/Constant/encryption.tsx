import CryptoJS from 'react-native-crypto-js';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { BASEURL, ENDPOINTS, SECRETKEY } from './constant';
import { getItem, setItem } from '../Storage/localstorage';
import { update_sessonstatus } from '../../Slices/helper';
import { Cleardata, failuretoast } from '../Hooks/customhook';
import { getMobileSignatureHeaders } from './requestSigning';

export const encrypt_primary = (payload: any): string => {

    let encData = CryptoJS.AES.encrypt(JSON.stringify(payload), SECRETKEY).toString();
    return encData
};

export const encrypt_secondary = (payload: any): string => {
    const secretKey: any = getItem("secretkey");
    let encData = CryptoJS.AES.encrypt(JSON.stringify(payload), secretKey).toString();
    return encData
};
export const decrpt_primary = (data: string): any => {
    if (!data) return null;
    try {
        let bytes = CryptoJS.AES.decrypt(data, SECRETKEY);
        let decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;
        return JSON.parse(decrypted);
    } catch (e) {
        return null;
    }
};

export const decrpt_secondary = (data: string): any => {
    if (!data) return null;
    try {
        const secretKey: any = getItem("secretkey");
        let bytes = CryptoJS.AES.decrypt(data, secretKey);
        let decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;
        return JSON.parse(decrypted);
    } catch (e) {
        return null;
    }
};

const rawBaseQuery = fetchBaseQuery({
    baseUrl: BASEURL,
    prepareHeaders: (headers) => {
        const token = getItem("token");
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    },
});

const rawFormQuery = fetchBaseQuery({
    baseUrl: BASEURL,
    prepareHeaders: (headers) => {
        const token = getItem("token");
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'multipart/form-data');
        return headers;
    },
});

export const delay = (ms?: number) => new Promise((resolve: any) => setTimeout(resolve, ms));

// If a "secondary" encrypted response fails to decrypt (stale/out-of-sync secretkey in
// storage), refresh it from /user/get_user_details — that endpoint is decrypted with the
// constant primary key, not the secretkey, so it works even when secretkey itself is bad.
// Every branch below (isform/isformPrimary/isprimary/isgetsecondary/isget/else) hits
// a 401 independently, and a screen commonly has several of these in flight at once
// (the post-login data-fetch burst is one example). Without this guard, a genuinely
// expired session fired the "Expired!" toast + Cleardata() once per in-flight request
// that happened to 401 around the same moment - visually the toast content getting
// replaced/re-shown several times in a row for what is really one event. Keyed by the
// token that expired (not just a boolean) so a *future* genuine expiry, under a token
// from a subsequent login, isn't silently swallowed too.
let expiredTokenHandled: string | null = null;
const handleSessionExpiry = (requestToken: string | null) => {
    if (expiredTokenHandled === requestToken) return;
    expiredTokenHandled = requestToken;
    failuretoast("Expired!", "Your session has expired!");
    Cleardata();
};

let refreshingSecretKey: Promise<boolean> | null = null;
const refreshSecretKey = (api: any, extraOptions: any): Promise<boolean> => {
    if (refreshingSecretKey) return refreshingSecretKey;

    refreshingSecretKey = (async () => {
        try {
            const detailsResult = await rawBaseQuery(
                { url: ENDPOINTS.userDetails, method: 'get' },
                api,
                extraOptions,
            );
            const decryptedDetails = decrpt_primary(detailsResult?.data as string);
            const freshSecretKey = decryptedDetails?.result?.data?.secretKey;
            if (freshSecretKey) {
                setItem("secretkey", freshSecretKey);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        } finally {
            refreshingSecretKey = null;
        }
    })();

    return refreshingSecretKey;
};

export const encryptedBaseQuery: BaseQueryFn<any, unknown, unknown> = async (args, api, extraOptions) => {
    let { body, meta, ...rest } = args;

    const isform = meta?.isform ?? undefined
    const isprimary = meta?.isprimary ?? undefined
    const isget = meta?.isget ?? undefined
    const isgetsecondary = meta?.isgetsecondary ?? undefined
    const isformPrimary = meta?.isformPrimary ?? undefined
    // Plain (un-encrypted) JSON request body, secretkey-encrypted response - for
    // the file-upload routes migrated off multipart onto a base64 JSON envelope
    // (decodeBase64Files middleware) that have NO decryptRequest server-side:
    // user/panCardNumber_create_request, user/checkFaceLiveness,
    // user/internal-verification, user/update_user_settings. Mirrors web's
    // `axios.post(url, jsonBody, { headers: { 'Content-Type': 'application/json' } })`
    // + axiosDecrypt(). (internal_fiat_deposit is NOT this - it kept decryptRequest,
    // so its envelope rides inside the normal encrypted body via the default branch.)
    const isjson = meta?.isjson ?? undefined

    // SECURITY (mobile CAPTCHA bypass — see MOBILE_REQUEST_SIGNING.pdf and
    // requestSigning.ts). Opt-in per endpoint via meta.isSigned (currently
    // only login/register, the only two routes the backend actually checks
    // this on). Injected once here, upstream of every branch below, since
    // rest.headers flows through to whichever rawBaseQuery/rawFormQuery call
    // that branch makes.
    //
    // Wrapped in try/catch deliberately: signing is a bonus that lets the
    // backend skip CAPTCHA (Middleware/Security/captcha.js falls through to
    // normal CAPTCHA on any failure — missing/bad headers, stale timestamp,
    // replayed nonce). It must fail the same way here — a bug or misconfig
    // in signing (e.g. MOBILE_APP_SIGNING_SECRET not yet in the bundle,
    // requiring a Metro --reset-cache after being added to @env) should
    // degrade to "no signing headers, normal CAPTCHA required server-side"
    // instead of throwing and taking the whole login/register request down
    // with it.
    if (meta?.isSigned) {
        try {
            rest.headers = { ...rest.headers, ...getMobileSignatureHeaders(rest.method, rest.url) };
        } catch (signingErr) {
            console.log("mobile request signing failed, continuing unsigned", signingErr);
        }
    }

    // Captured before the request goes out - if a logout+login happens while this
    // request is still in flight (e.g. a screen's stale refetch), the response comes
    // back for a session that no longer exists. Comparing against the token at
    // request-time vs response-time lets us drop that stale response instead of
    // acting on it, which previously force-logged-out a freshly established new
    // session ("login success" immediately followed by "session expired").
    const requestToken = getItem("token");
    const isStaleResponse = () => getItem("token") !== requestToken;

    let result: any

    if (isform) {
        result = await rawFormQuery({ ...rest, body: body }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            console.log("result.error", error);

            if (error?.statusCode == "401") {
                console.log("result.error", error);
                // api.dispatch(update_sessonstatus(true))
                // failuretoast("Expired!", "Your session has expired!")
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            else {
                const decryptedError = decrpt_secondary(error)
                console.log(decryptedError, "error");

                return {
                    error: {
                        ...result.error,
                        data: decryptedError ?? { message: "Something went wrong. Please try again." },
                    },
                };
            }
        }
        if (result.data) {
            const res: any = result.data ?? ""
            const decryptedData = decrpt_secondary(res)
            return { data: decryptedData };
        }
        return result
    }

    if (isformPrimary) {
        result = await rawFormQuery({ ...rest, body: body }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            if (error?.statusCode == "401") {
                console.log("result.error", error);
                // api.dispatch(update_sessonstatus(true))
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            else {
                const decryptedError = decrpt_primary(error)
                console.log(decryptedError, "error");

                return {
                    error: {
                        ...result.error,
                        data: decryptedError ?? { message: "Something went wrong. Please try again." },
                    },
                };
            }
        }
        if (result.data) {
            const res: any = result.data ?? ""
            const decryptedData = decrpt_primary(res)
            return { data: decryptedData };
        }
        return result
    }
    else if (isprimary) {
        result = await rawBaseQuery({
            ...rest, body: {
                token: encrypt_primary(body)
            }
        }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            if (error?.statusCode == "401") {
                console.log("result.error", error);
                // api.dispatch(update_sessonstatus(true))
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            else {
                const decryptedError = decrpt_primary(error)
                console.log(decryptedError, "error");

                return {
                    error: {
                        ...result.error,
                        data: decryptedError ?? { message: "Something went wrong. Please try again." },
                    },
                };
            }
        }
        if (result.data) {
            const res: any = result.data ?? ""
            const decryptedData = decrpt_primary(res)
            return { data: decryptedData };
        }
        return result
    }

    else if (isgetsecondary) {
        result = await rawBaseQuery({ ...rest }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            console.log("result.error", error);
            if (error?.statusCode == "401") {
                console.log("result.error", error);
                // api.dispatch(update_sessonstatus(true))
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            else {
                const decryptedError = decrpt_secondary(error)
                return {
                    error: {
                        ...result.error,
                        data: decryptedError ?? { message: "Something went wrong. Please try again." },
                    },
                };
            }
        }
        if (result.data) {
            const res: any = result.data ?? ""
            let decryptedData = decrpt_secondary(res)
            if (decryptedData === null) {
                // stored secretkey may be stale/out of sync — refresh it and retry once
                const refreshed = await refreshSecretKey(api, extraOptions);
                if (refreshed) {
                    const retryResult = await rawBaseQuery({ ...rest }, api, extraOptions)
                    if (retryResult.data) {
                        decryptedData = decrpt_secondary(retryResult.data as string)
                    }
                }
            }
            if (decryptedData === null) {
                return { error: { status: "CUSTOM_ERROR", data: "Unable to decrypt response" } };
            }
            return { data: decryptedData };
        }
        return result
    }
    else if (isget) {
        result = await rawBaseQuery({ ...rest }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            if (error?.statusCode == "401") {
                console.log("result.error", error);
                // api.dispatch(update_sessonstatus(true))
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            else {
                const decryptedError = decrpt_primary(error)
                console.log(decryptedError, "error");

                return {
                    error: {
                        ...result.error,
                        data: decryptedError ?? { message: "Something went wrong. Please try again." },
                    },
                };
            }
        }
        if (result.data) {
            const res: any = result.data ?? ""
            const decryptedData = decrpt_primary(res)
            if (decryptedData === null) {
                return { error: { status: "CUSTOM_ERROR", data: "Unable to decrypt response" } };
            }
            return { data: decryptedData };
        }
        return result
    }
    else if (isjson) {
        // Body goes out as plain JSON (rawBaseQuery's prepareHeaders already sets
        // Content-Type: application/json). Response is still encrypted - with the
        // user's secretkey by default (decrpt_secondary), or with the constant
        // primary key when meta.jsonPrimary is set (routes whose controller calls
        // sendResponse() with no key, e.g. copy/requestTrader).
        const jsonPrimary = meta?.jsonPrimary ?? undefined
        const decryptResp = jsonPrimary ? decrpt_primary : decrpt_secondary
        result = await rawBaseQuery({ ...rest, body }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            console.log("result.error", error);
            if (error?.statusCode == "401") {
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            const decryptedError = decryptResp(error)
            return {
                error: {
                    ...result.error,
                    data: decryptedError ?? { message: "Something went wrong. Please try again." },
                },
            };
        }
        if (result.data) {
            const res: any = result.data ?? ""
            let decryptedData = decryptResp(res)
            if (decryptedData === null && !jsonPrimary) {
                // stale/out-of-sync secretkey — refresh once and retry (secondary only).
                const refreshed = await refreshSecretKey(api, extraOptions);
                if (refreshed) {
                    const retryResult = await rawBaseQuery({ ...rest, body }, api, extraOptions)
                    if (retryResult.data) {
                        decryptedData = decrpt_secondary(retryResult.data as string)
                    }
                }
            }
            if (decryptedData === null) {
                return { error: { status: "CUSTOM_ERROR", data: "Unable to decrypt response" } };
            }
            return { data: decryptedData };
        }
        return result
    }
    else {
        result = await rawBaseQuery({
            ...rest, body: {
                token: encrypt_secondary(body)
            }
        }, api, extraOptions)
        if (isStaleResponse()) return { data: undefined };
        if (result.error) {
            const error: any = result.error?.data ? result.error?.data : result.error
            console.log("result.error", error);

            if (error?.statusCode == "401") {
                console.log("result.error", error);
                // api.dispatch(update_sessonstatus(true))
                handleSessionExpiry(requestToken)
                return { error: result.error };
            }
            else {
                const decryptedError = decrpt_secondary(error)
                console.log(decryptedError, "error");

                return {
                    error: {
                        ...result.error,
                        data: decryptedError ?? { message: "Something went wrong. Please try again." },
                    },
                };
            }
        }

        if (result.data) {
            const res: any = result.data ?? ""
            let decryptedData = decrpt_secondary(res)
            if (decryptedData === null) {
                // stored secretkey may be stale/out of sync — refresh it and retry once,
                // re-encrypting the request body with the fresh key
                const refreshed = await refreshSecretKey(api, extraOptions);
                if (refreshed) {
                    const retryResult = await rawBaseQuery({
                        ...rest, body: {
                            token: encrypt_secondary(body)
                        }
                    }, api, extraOptions)
                    if (retryResult.data) {
                        decryptedData = decrpt_secondary(retryResult.data as string)
                    }
                }
            }
            if (decryptedData === null) {
                return { error: { status: "CUSTOM_ERROR", data: "Unable to decrypt response" } };
            }
            return { data: decryptedData };
        }
        return result
    }
};
