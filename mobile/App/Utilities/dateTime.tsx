import moment from 'moment';

import { isEmpty } from './helerfunction';

const DATE_TOKEN_REGEXES: Record<string, RegExp> = {
    YYYY: /YYYY/g,
    MM: /MM/g,
    DD: /DD/g,
    HH: /HH/g,
    mm: /mm/g,
    ss: /ss/g,
};

export const getDateTimeFormat = (dateObject: any, type?: string, format?: string) => {
    const date = dateObject ?? new Date();
    if (!format) {
        switch (type) {
            case 'date':
                format = 'DD-MM-YYYY';
                break;
            case 'datetime':
                format = 'DD-MM-YYYY hh:mm a';
                break;
            case 'time':
                format = 'hh:mm a';
                break;
            default:
                break;
        }
    }
    const formattedDate = format ? moment(date).format(format) : '';
    return formattedDate;
};

export const momentFormat = (dateTime: any, format = 'DD-MM-YYYY HH:mm:ss') => {
    try {
        if (!isEmpty(dateTime)) {
            let newDateTime = new Date(dateTime);
            return moment(newDateTime).format(format)
        }
        return ''
    } catch (err) {
        console.log(err, 'momentFormat__err')
        return ''
    }
}

export const dateTimeFormat = (dateTime: any, format = 'YYYY-MM-DD HH:mm:ss') => {
    try {
        if (dateTime === null || dateTime === undefined || dateTime === '') return '';

        const newDateTime = new Date(dateTime);
        if (isNaN(newDateTime.getTime())) return '';

        const pad = (num: number) => (num < 10 ? `0${num}` : num);

        const replacements: any = {
            YYYY: newDateTime.getFullYear().toString(),
            MM: pad(newDateTime.getMonth() + 1),
            DD: pad(newDateTime.getDate()),
            HH: pad(newDateTime.getHours()),
            mm: pad(newDateTime.getMinutes()),
            ss: pad(newDateTime.getSeconds()),
        };

        // Replace all tokens globally
        let formatted: any = format;
        Object.entries(replacements).forEach(([key, value]) => {
            formatted = formatted.replace(DATE_TOKEN_REGEXES[key], value);
        });

        return formatted;
    } catch (err) {
        console.error('dateTimeFormat__err', err);
        return '';
    }
};

export const formatDate = (dateStr: string) => {
    if (!dateStr) return ""

    const [day, month, year] = dateStr.split("-");

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return `${Number(day)} ${monthNames[Number(month) - 1]} ${year}`;
};

export const canUnfollow = (followedAt: string) => {
    const followedDate = new Date(followedAt);
    const now = new Date();

    const diffInMs = now.getTime() - followedDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays >= 7;
};

// const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// export const canUnfollow = (followedAt: string): boolean => {
//     const followedDate = new Date(followedAt).getTime();
//     const now = Date.now();

//     const diffInMs = now - followedDate;
//     const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
//     const canUnfollow = diffInMs >= SEVEN_DAYS_MS;
//     console.log("========== canUnfollow ==========");
//     console.log("Followed At:", followedAt);
//     console.log("Followed Date (ms):", followedDate);
//     console.log("Current Time (ms):", now);
//     console.log("Difference (ms):", diffInMs);
//     console.log("Difference (days):", diffInDays.toFixed(2));
//     console.log("7 Days (ms):", SEVEN_DAYS_MS);
//     console.log("Can Unfollow:", canUnfollow);
//     console.log("=================================");

//     return (now - followedDate) >= SEVEN_DAYS_MS;
// };

const parseExpiryDate = (dateStr: any) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    // Backend expiryDateStr comes with no separators (e.g. "15Jul26"), but tolerate an
    // optional space too in case some source ever sends "15 Jul 26".
    const match = dateStr.match(/(\d{1,2})\s?([A-Za-z]{3})\s?(\d{2})/);
    if (!match) return null;

    const [, day, monthStr, yearStr] = match;

    const months: any = {
        jan: 0, feb: 1, mar: 2, apr: 3,
        may: 4, jun: 5, jul: 6, aug: 7,
        sep: 8, oct: 9, nov: 10, dec: 11,
    };

    const month = months[monthStr.toLowerCase()];
    const year = 2000 + Number(yearStr);

    if (month === undefined) return null;

    return new Date(year, month, Number(day));
};

const formatRemaining = (diff: number) => {
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days}d: ${hours}h: ${minutes}m`;
};

// Prefer this over getRemainingTime() whenever the real expiry timestamp is available
// (e.g. contract.expiryDate) — getRemainingTime() only has the "15Jul26" label to work
// with and has to assume midnight, which drifts from the backend's actual expiry time
// (mismatched web vs mobile countdowns for the same contract).
export const getRemainingTimeFromDate = (expiryDate: any) => {
    if (!expiryDate) return "Invalid date";
    const date = new Date(expiryDate);
    if (isNaN(date.getTime())) return "Invalid date";
    return formatRemaining(date.getTime() - Date.now());
};

// Backend sends expiryDateStr with no separators (e.g. "31Aug26") - this just adds the
// spaces for display ("31 Aug 26"), it doesn't touch the underlying value used for
// matching/selection anywhere else.
export const formatExpiryLabel = (expiryDateStr: any) => {
    if (!expiryDateStr || typeof expiryDateStr !== 'string') return expiryDateStr ?? '';
    const match = expiryDateStr.match(/^(\d{1,2})([A-Za-z]{3})(\d{2})$/);
    if (!match) return expiryDateStr;
    const [, day, monthStr, yearStr] = match;
    return `${day} ${monthStr} ${yearStr}`;
};

export const getRemainingTime = (expiryDateStr: any) => {
    const expiryDate = parseExpiryDate(expiryDateStr);
    if (!expiryDate) return "Invalid date";

    const diff = expiryDate.getTime() - Date.now();
    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}d: ${hours}h: ${minutes}m`;
};