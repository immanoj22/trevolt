import config from "./env";
import axios from "axios";
import isEmpty from "is-empty";
import { decryptObject, encryptObject } from "../lib/Cryptojs";
import { logoutHooks } from "../actions/userAction";
import { RemoveItemLocalStorageItem } from "../lib/storage";
import { ExportHooks } from "../HelperRoute/HelperRoutes";

// console.log("config.API_URL", config.API_URL, config)
axios.defaults.baseURL = config.API_URL;
// SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70): no
// longer setting a default Authorization header from a localStorage-read
// token at import time — the token is never stored client-side anymore.
// SECURITY FIX (VAPT: "Token Storage Security", Points 44/49/70) — allow
// the browser to send/receive the new httpOnly auth cookie set by the
// backend on login. Required for cookie-based auth to work cross-origin
// (frontend and API are on separate domains); backend CORS already sets
// credentials: true with an explicit origin allow-list (never "*"), which
// is a precondition for this to work at all.
axios.defaults.withCredentials = true;

axios.defaults.headers.common['Content-Security-Policy'] =
    "default-src 'self'; " +
    `script-src 'self' ${config.FRONT_URL} 'unsafe-inline' 'unsafe-eval'; ` +
    `style-src 'self'  ${config.FRONT_URL} 'unsafe-inline'; ` +
    `img-src 'self' data:  ${config.FRONT_URL}; ` +
    `font-src 'self'  ${config.FRONT_URL}; ` +
    `connect-src 'self'  ${config.FRONT_URL}; ` +
    `media-src 'self'  ${config.FRONT_URL}; ` +
    `frame-src 'self'  ${config.FRONT_URL}; ` +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'self'; " +
    "upgrade-insecure-requests; " +
    "block-all-mixed-content;";


export const Axios = async (reqData) => {
    try {
        if (!isEmpty(reqData.data)) {
            let token = encryptObject(reqData.data, !isEmpty(reqData.secretKey) ? reqData.secretKey : config.SERCERT_KEY)
            delete reqData.data
            // SECURITY FIX: removed console.log(token) — this printed the
            // encrypted request payload (and, via reqData.secretKey nearby,
            // effectively kept the key/ciphertext pair together in the
            // browser console) on every single outgoing API call.
            reqData['data'] = { token: token }
        }
        const response = await axios(reqData);

        if (!isEmpty(response)) {
            let respData = decryptObject(response.data, !isEmpty(reqData.secretKey) ? reqData.secretKey : config.SERCERT_KEY)
            // SECURITY FIX: removed console.log of the fully decrypted
            // response body on every successful API call — this could
            // contain OTPs, the user's response-signing secretKey, freshly
            // created API secrets, and other sensitive result data.
            return { data: respData }
        }
    } catch (err) {
        // SECURITY FIX: removed console.log that printed reqData.secretKey
        // directly on every failed request (VAPT: "Sensitive Data in Logs").
        // Error details alone (without the key) are still useful for debugging.
        if (err?.response?.data?.statusCode == 401) {
            if (['Unauthorized: Invalid or missing token', 'Authorization token missing or malformed', 'Invalid token: user not found', 'Invalid or inactive token', 'Invalid token'].includes(err?.response?.data?.message)) {
                localStorage.clear();
                window.location.href = `${window.location.origin}/login`;
                // ExportHooks.navigate("/login");

            }
            return { data: err?.response?.data }
        }
        // if (err?.response?.status == 429) {
        //     return { data: err?.response?.data }
        // }
        let respData = decryptObject(err?.response?.data, !isEmpty(reqData?.secretKey) ? reqData?.secretKey : config?.SERCERT_KEY)
        // SECURITY FIX: removed console.log of the decrypted error response body.
        return { data: respData }
    }
}

export const AxiosCms = async (reqData, funcname, ssss) => {
    const response = await axios(reqData);
    const respData = axiosDecrypt(response);
    return { data: respData };
}

export const axiosDecrypt = (response, key) => {
    try {
        let respData = decryptObject(response.data, !isEmpty(key) ? key : config.SERCERT_KEY);
        return respData;
    } catch (e) {
        console.log("axiosDecrypt__Err", e?.message || "decrypt failed");
    }
}


export const catchDecrypt = (err, key) => {
    try {
        let response = err?.response;
        if (response?.data?.statusCode == 401) {
            if (response?.data?.message == "Invalid or inactive token") {
                localStorage.clear();
                window.location.href = `${window.location.origin}/login`;
                // ExportHooks.navigate("/login");
            }
        } if (response?.status == 429) {
            return response?.data;
        }
        // SECURITY FIX: removed console.log of the raw and decrypted error
        // response bodies on every failed request.
        let respData = decryptObject(response.data, !isEmpty(key) ? key : config.SERCERT_KEY)
        return respData;
    } catch (e) {
        console.log("catchDecrypt__Err", e?.message || "decrypt failed");
    }
}



export const setAuthToken = token => {
    // SECURITY FIX: removed console.log of the auth token on every call.
    if (token) {
        axios.defaults.headers.common["Authorization"] = token;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
};


export default axios