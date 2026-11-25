/** Domains rejected as disposable/temporary email providers (kept in sync with backend/Library/validationLib.js) */
export const DISPOSABLE_EMAIL_DOMAINS = [
    "yopmail.com",
    "tempmail.com",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
    "temp-mail.org",
    "throwawaymail.com",
    "getnada.com",
    "trashmail.com",
    "fakeinbox.com",
    "dispostable.com",
    "mailnesia.com",
    "mintemail.com",
    "sharklasers.com",
    "maildrop.cc",
];

export const isDisposableEmailDomain = (email) => {
    if (!email || typeof email !== "string") return false;
    const domain = email.trim().toLowerCase().split("@")[1];
    return !!domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}
