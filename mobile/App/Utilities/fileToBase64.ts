import RNFS from 'react-native-fs';

import { getMimeType } from './helerfunction';

/**
 * Mobile equivalent of web's `src/lib/fileToBase64.js` (`fileToBase64Envelope`).
 *
 * Some backend upload routes were migrated off raw `multipart/form-data` onto the
 * app's normal AES-encrypted JSON body: the file rides along as a small base64
 * JSON envelope and `Middleware/Security/decodeBase64Files.js` reconstructs
 * `req.files.<field>` from it server-side. Reason: a file's raw bytes contain
 * 0x00 null characters, which trips Cloudflare's OWASP managed rule 920270 and
 * 403s legitimate uploads in production. Base64 (+ the AES/JSON layers) is pure
 * ASCII, so it can't.
 *
 * Pair this with a plain (non-`formData`) request body that puts the returned
 * envelope under the field name the route's `decodeBase64Files([...])` expects.
 */
export interface Base64FileEnvelope {
    __base64File: true;
    name: string;
    type: string;
    size: number;
    base64: string;
}

type PickedFile = {
    uri?: string;
    fileName?: string;
    name?: string;
    type?: string;
} | null | undefined;

export const fileToBase64Envelope = async (file: PickedFile): Promise<Base64FileEnvelope | null> => {
    if (!file?.uri) return null;

    // Matches the existing `convertFileToBase64` helper's path handling - RNFS
    // wants a filesystem path, not a file:// URL.
    const path = decodeURIComponent(file.uri.replace('file://', ''));
    const base64 = await RNFS.readFile(path, 'base64');

    const name = file.fileName || file.name || path.split('/').pop() || 'upload';

    return {
        __base64File: true,
        name,
        type: file.type || getMimeType(name),
        // Backend trusts the decoded buffer's real length over this (see
        // decodeBase64Files.js buildFileObject), so an approximation from the
        // base64 length is fine - it's only used for the client-side size hint.
        size: Math.floor((base64.length * 3) / 4),
        base64,
    };
};

const isFileRef = (v: any): v is PickedFile =>
    !!v && typeof v === 'object' && typeof v.uri === 'string';

/**
 * Mobile equivalent of web's `formDataToBase64Json` - build the request body as a
 * plain object (same field names the call site used to `.append()` onto a
 * FormData), passing any picked-file value (`{ uri, fileName }`) or array of them
 * through `fileToBase64Envelope`. Everything else passes through untouched. The
 * resulting object is sent as normal JSON (see the `isjson` branch in
 * Actions/Constant/encryption.tsx) to a route carrying `decodeBase64Files([...])`.
 */
export const toBase64UploadBody = async (
    fields: Record<string, any>,
): Promise<Record<string, any>> => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
        if (Array.isArray(value) && value.some(isFileRef)) {
            out[key] = await Promise.all(value.map((f) => (isFileRef(f) ? fileToBase64Envelope(f) : f)));
        } else if (isFileRef(value)) {
            out[key] = await fileToBase64Envelope(value);
        } else {
            out[key] = value;
        }
    }
    return out;
};
