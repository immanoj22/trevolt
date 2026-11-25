/**
 * SECURITY (mobile CAPTCHA bypass — see MOBILE_REQUEST_SIGNING.pdf and the
 * backend's Middleware/Security/captcha.js).
 *
 * Login/registration require a CAPTCHA token unless the request carries
 * three headers proving it came from this compiled app: X-App-Timestamp,
 * X-App-Nonce and X-App-Signature (a hex HMAC-SHA256 over a canonical
 * string), computed here with MOBILE_SIGNING_SECRET as the key.
 *
 * Kept separate from encryption.tsx (AES payload encryption) because this is
 * a different concern — signing the request's identity, not its body — and
 * uses a different crypto primitive (HMAC-SHA256 via @noble/hashes, since
 * the installed react-native-crypto-js build only exposes MD5/AES, not
 * SHA256/HmacSHA256, despite its README).
 */
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

import { BASEURL, MOBILE_SIGNING_SECRET } from './constant';

export type MobileSignatureHeaders = {
    'X-App-Timestamp': string;
    'X-App-Nonce': string;
    'X-App-Signature': string;
};

// BASEURL is "<scheme>://<host>[:port]/api/v1" for every environment (dev/demo/
// stage/prod) — stripping the origin leaves exactly the path prefix Express sees
// on req.originalUrl before the endpoint's own url (e.g. "/user/login") is appended.
const API_PATH_PREFIX = BASEURL.replace(/^https?:\/\/[^/]+/, '');

// Nonce only needs to be unique per request (the backend's replay guard keys
// on it directly), not formatted as a UUID — 16 random bytes hex-encoded is
// enough entropy. react-native-get-random-values (imported in index.js)
// polyfills crypto.getRandomValues globally.
const generateNonce = (): string => {
    const bytes = new Uint8Array(16);
    // `crypto` isn't in TS's ambient globals here (no "dom" lib) — it's a runtime
    // global installed by react-native-get-random-values (imported in index.js).
    (global as any).crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Builds the three signing headers for one outgoing request. `url` is the
 * endpoint's own relative path (e.g. "/user/login"), matching what each
 * Slice's query() passes as `args.url` — NOT including the API_PATH_PREFIX,
 * which this function adds itself to reconstruct req.originalUrl.
 */
export const getMobileSignatureHeaders = (method: string, url: string): MobileSignatureHeaders => {
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const originalUrl = `${API_PATH_PREFIX}${url}`;
    const canonical = `${timestamp}.${nonce}.${method.toUpperCase()}.${originalUrl}`;
    const signature = bytesToHex(hmac(sha256, utf8ToBytes(MOBILE_SIGNING_SECRET), utf8ToBytes(canonical)));

    return {
        'X-App-Timestamp': timestamp,
        'X-App-Nonce': nonce,
        'X-App-Signature': signature,
    };
};
