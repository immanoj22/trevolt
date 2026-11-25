
export const fileToBase64Envelope = (file) => new Promise((resolve, reject) => {
    if (!file) {
        resolve(null);
        return;
    }
    try {
        const reader = new FileReader();
        reader.onload = () => {
            // reader.result is a data URL: "data:<mime>;base64,<data>" —
            // strip the prefix, only the raw base64 payload is needed.
            const base64 = String(reader.result).split(',')[1] || '';
            resolve({
                __base64File: true,
                name: file.name,
                type: file.type,
                size: file.size,
                base64,
            });
        };
        reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
        reader.readAsDataURL(file);
    } catch (e) {
        reject(e);
    }
});

// Converts an existing FormData object (built exactly as it already was,
// field-for-field) into a plain JSON-safe object: any File/Blob entry
// becomes a base64 envelope via fileToBase64Envelope, every other entry
// passes through unchanged as a string. Lets call sites that already build
// a FormData (profile updates, copy-trade profile image, etc.) switch to
// the base64 transport with no change to how the FormData itself is
// constructed — only the final POST needs to send this object as JSON
// instead of the FormData as multipart.
export const formDataToBase64Json = async (formData) => {
    const jsonBody = {};
    for (const [fieldName, value] of formData.entries()) {
        if (value instanceof File || value instanceof Blob) {
            jsonBody[fieldName] = await fileToBase64Envelope(value);
        } else {
            jsonBody[fieldName] = value;
        }
    }
    return jsonBody;
};