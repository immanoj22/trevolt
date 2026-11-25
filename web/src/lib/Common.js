/** First Letter capitalize */
export const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}


export const timeAgo = (createdAt) => {
    const now = new Date();
    const seconds = Math.floor((now - new Date(createdAt)) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
}

export const formatValue = (value, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    const threshold = 1 / Math.pow(10, decimals);

    if (num > 0 && num < threshold) {
        return `<${threshold.toFixed(decimals)}`;
    }
    // console.log("formatValue_checking", value, decimals, num);
    return parseFloat(num.toFixed(decimals));
};


export function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}


export function maskEmail(email) {
    if (!email || typeof email !== "string") return email ?? "";
    email = email.trim();
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const first3 = local.slice(0, 3);
    const last2 = local.slice(-2);
    if (local.length > 5) {
        return `${first3}****${last2}@${domain}`; // Always 4 stars
    }
    return `${first3}***@${domain}`; // Minimum 3 stars for short emails
}

/**
 * Masks a mobile number, keeping only the last 3 digits visible — same
 * fixed-width `*******` + last-3 convention already used for the mobile
 * option in pages/Auth/modal/RestoreModel.jsx, pulled out here so any other
 * screen that needs to display a mobile number without fully exposing it
 * (e.g. My Profile's "Registered mobile number") can reuse the exact same,
 * already-established masking format instead of re-inventing one.
 * Any country code should be passed/rendered separately by the caller, the
 * same way RestoreModel.jsx and MyProfile.jsx already do.
 */
export function maskMobile(mobileNumber) {
    if (!mobileNumber && mobileNumber !== 0) return mobileNumber;
    const digits = String(mobileNumber);
    if (digits.length <= 3) return digits; // nothing meaningful to hide
    return `*******${digits.slice(-3)}`;
}

export function truncateString(str, maxLength) {
    if (str?.length > maxLength) {
      return str?.substring(0, maxLength) + "...";
    }
    return str;
  }