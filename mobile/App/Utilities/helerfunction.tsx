import { Alert, Linking } from 'react-native';
import { image } from './images';
import { Colors } from './uiasset';
import RNFS from 'react-native-fs';
import * as Yup from 'yup';
import emojiRegex from 'emoji-regex';
import { PROFILEURL } from '../Actions/Constant/constant';

export const getProfileImageUrl = (profileImage: any) => {
    if (!profileImage) return "";
    const imagePath = String(profileImage).replace(/^\/+/, '');
    if (/^https?:\/\//.test(imagePath)) return imagePath;

    const profileBaseUrl = String(PROFILEURL || '').replace(/\/+$/, '');
    const normalizedImagePath = imagePath.replace(/^profile\/+/, '');
    const baseUrl = profileBaseUrl.endsWith('/profile') ? profileBaseUrl : `${profileBaseUrl}/profile`;

    return `${baseUrl}/${normalizedImagePath}`;
};

export const convertFileToBase64 = async (fileUri: string) => {
    try {
        const path = fileUri.replace('file://', '');
        const base64String = await RNFS.readFile(path, 'base64');
        return `data:image/png;base64,${base64String}`;
    } catch (err) {
        console.error('Error converting file to base64:', err);
        return '';
    }
};

export const getQueryParamString = (params: any) => {
    const keys = Object.keys(params);
    return keys.length > 0 ? '?' + keys.map((_) => _ + '=' + params[_]).join('&') : '';
};

export const obfuscateEmailShort = (email: any) => {
    if (!email || typeof email !== "string") return email;

    const [localPart, domain] = email.split("@");

    if (!localPart || !domain) return email;

    const start = localPart.slice(0, 2);
    const end = localPart.slice(-2);

    const maskedStars = "****";

    if (localPart.length <= 4) {
        return `${localPart[0]}****@${domain}`;
    }

    return `${start}${maskedStars}${end}@${domain}`;
};

export function shortenText(id: any) {
    if (id.length <= 10) return id;
    return `${id.slice(0, 5)}...${id.slice(-6)}`;
}

export const getMimeType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'heic':
            return 'image/heic';
        default:
            return 'application/octet-stream'; // fallback
    }
};

export const formatToReadableDate = (isoString: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toDateString(); // e.g. "Mon Jul 28 2025"
};

export const maskPhoneNumber = (phoneNumber: any) => {
    if (!phoneNumber) return '';
    const last2 = phoneNumber.slice(-3);
    const masked = 'x'.repeat(phoneNumber.length - 3) + last2;
    return masked;
};

// Same masking convention as web's My Profile (lib/Common.js maskEmail/
// maskMobile) - used for the read-only Email Address / Registered mobile
// number rows on the account edit screen, kept separate from
// obfuscateEmailShort/maskPhoneNumber above since those already have their
// own established format for OTP "code sent to..." messages elsewhere.
export const maskEmail = (email: any) => {
    if (!email || typeof email !== "string") return email ?? "";
    email = email.trim();
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const first3 = local.slice(0, 3);
    const last2 = local.slice(-2);
    if (local.length > 5) {
        return `${first3}****${last2}@${domain}`;
    }
    return `${first3}***@${domain}`;
};

export const maskMobile = (mobileNumber: any) => {
    if (!mobileNumber && mobileNumber !== 0) return mobileNumber;
    const digits = String(mobileNumber);
    if (digits.length <= 3) return digits;
    return `*******${digits.slice(-3)}`;
};

export const openLink = async (url?: string) => {
    if (!url) {
        Alert.alert("No link available");
        return;
    }

    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = `https://${fullUrl}`;
    }

    try {
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
            await Linking.openURL(fullUrl);
        } else {
            Alert.alert("Cannot open this link", fullUrl);
        }
    } catch (err) {
        Alert.alert("Failed to open link", fullUrl);
    }
};

export const getItemColor = (type: any) => {
    if (type === 'Total Users') {
        return "#4A6FCD";
    }
    if (type === 'Total Clicked users') {
        return "#335da3";
    }
    if (type === 'Active Users') {
        return "#8450E7";
    }
    if (type === 'Volume') {
        return "#BE6321";
    }
    if (type === 'Total Commission') {
        return "#6265FF";
    }
    if (type === 'KYC Completed Users') {
        return "#315386";
    }
    return "#224C82";
}

export function getTimeLeft(targetTime: any) {
    const now = Date.now();
    const difference = targetTime - now;

    if (difference <= 0) {
        return {
            days: '00',
            hours: '00',
            minutes: '00',
            seconds: '00',
        };
    }

    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
    };
}

export const formatDateTime = (dateString: any) => {
    if (!dateString) return "Unknown time";
    try {
        const date = new Date(dateString);
        return date.toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch (e) {
        return "Invalid date";
    }
};

export const getTokenImage = (type: any) => {
    // `type` can be a plain symbol ("ETH", "BNBUSDT") or a composite option contract
    // pairName/tickerRoot ("ETH-30JUL26-3000-P") — take the leading token before any
    // "-" so option contracts on non-BTC underlyings resolve to the right icon instead
    // of silently falling back to BTC.
    const symbol = String(type ?? '').split('-')[0].replace('USDT', '').toUpperCase();
    if (symbol === 'BNB') {
        return image.BNB;
    }
    if (symbol === 'ETH') {
        return image.ETHICon;
    }
    return image.Btcicon;
}

export function formatToTimeOnly(isoString: any) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString('en-US', { hour12: false });
}

export const truncateString = (str: string, startChars = 5, endChars = 6) => {
    if (str?.length <= startChars + endChars) return str;
    return `${str?.slice(0, startChars)}...${str?.slice(-endChars)}`;
}

export const getOrderTypeLabel = (type: any) => {
    switch (type) {
        case 'makerOnly':
            return 'Maker Only';
        case 'stop_limit':
            return 'Stop Limit';
        case 'stop_market':
            return 'Stop Market';
        case 'trailingStop':
            return 'Trailing Stop';
        case 'take_profit_limit':
            return 'Take Profit Limit';
        case 'take_profit':
            return 'Take Profit Market';
        case 'makeronly':
            return 'Maker Only';
        default:
            return 'Stop Limit';
    }
};

export const getIcon = (type: any) => {
    switch (type) {
        case 'makerOnly':
            return 'Maker Only';
        case 'stop_limit':
            return 'Stop Limit';
        case 'stop_market':
            return 'Stop Market';
        case 'trailingStop':
            return 'Trailing Stop';
        case 'take_profit_limit':
            return 'Take Profit Limit';
        case 'take_profit':
            return 'Take Profit Market';
        case 'makeronly':
            return 'Maker Only';
        default:
            return 'Stop Limit';
    }
};

export const toCutOff = (value: any = 0, decimal: any = 6) => {
    try {

        if (value !== null && value !== undefined && value !== "") {
            value = value.toString()
            if (value.split('.')[1]?.length <= decimal) {
                return value
            } else {
                value = parseFloat(value)
                decimal = parseFloat(decimal)
                const factor = Math.pow(10, decimal);
                const result = Math.floor(value * factor) / factor;
                if (result == 0) {
                    return Number(result).toPrecision(decimal + 1)
                }
                return result
            }
        }
        return 0
    } catch (err) {
        console.log(err, 'CutOf__err')
        return value
    }
}

export function cleanInput(value: any, removeEmoji = true): string {
    if (!value) return '';
    if (removeEmoji) {
        const emojis = emojiRegex();
        return value.toString().replace(emojis, '');
    }
    return value;
}

export const formatValue = (value: any, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    const threshold = 1 / Math.pow(10, decimals);

    if (num > 0 && num < threshold) {
        return `<${threshold.toFixed(decimals)}`;
    }

    return parseFloat(num.toFixed(decimals));
};

const validator = async (schema: any, data: any) => {
    try {
        await schema.validate(data, { abortEarly: false });
        return false;
    } catch (error: any) {
        return error.inner.reduce((acc: any, err: any) => {
            acc[err.path] = err.message;
            return acc;
        }, {});
    }
}

export const validateresendLoginCode = async (data: any) => {
    const schema = Yup.object().shape({

        email: Yup.string()
            .matches(
                /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/,
                'Invalid email address'
            ).required('Email is required'),
    });

    const error = await validator(schema, data);

    if (Object.values(error).length > 0) {
        return { status: true, errors: error }
    } else {
        return { status: false, errors: {} }
    }
};

export function capitalizeFirst(str: any) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const isValidUrl = (url: any) => {
    return /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(url)
}

// A raw search string handed to `new RegExp(...)` throws on unbalanced/special
// regex syntax (e.g. "(", "[", "*") - crashing any live-filter search bar that
// builds its pattern straight from user input. Escape it first so the string
// is always matched literally.
export const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const timeAgo = (createdDate: any) => {
    try {
        let diffTime = Math.abs(new Date(createdDate).getTime() - new Date().getTime());
        let days = diffTime / (24 * 60 * 60 * 1000);
        let hours = (days % 1) * 24;
        let minutes = (hours % 1) * 60;
        let secs = (minutes % 1) * 60;
        [days, hours, minutes, secs] = [Math.floor(days), Math.floor(hours), Math.floor(minutes), Math.floor(secs)]
        let age: any = 0
        if (days == 0 && hours == 0) {
            age = 'now'
        } else if (days == 0 && hours == 1) {
            age = `${hours} hour ago`
        } else if (days == 1) {
            age = `${days} day ${hours} hours ago`
        } else {
            age = days == 0 ? `${hours} hours ago` : `${days} days ${hours} hours ago`
        }
        return age
    } catch (e) {
        console.log('strategyAge_err', e)
    }
}

export const handleTrade = (value: any) => {
    if (value === "inactive") {
        return "Already Requested"
    }
    if (value === "active") {
        return "Your are Master Trader"
    }
    else {
        return "Become a Master Trade"
    }
}

export const source = [
    { label: "ROI", value: "roi" },
    { label: "Followers", value: "followers" },
    { label: "Latest", value: "last" },
    { label: "PNL", value: "pnl" },
    { label: "Last 30 Days", value: "last30Days" },
];

export const getPnlColor = (value: any) => {
    const num = Number(value);
    return num < 0 ? Colors.red : Colors.green;
};

export const isEmpty = (value: any) =>
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (typeof value === 'number' && value === 0 || value.length === 0);

export const occuptation = [
    { label: "Business", value: "business" },
    { label: "Professional", value: "professional" },
    { label: "Self-employed", value: "self-employed" },
]

export const income = [
    { label: "1-5 lakhs", value: "1-5-lakhs" },
    { label: "5-10 lakhs", value: "5-10 lakhs" },
    { label: "10-25 lakhs", value: "10-25 lakhs" },
]
