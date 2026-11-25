import { isEmpty } from "../Utilities/helerfunction";

export const validateLeverage = (
    leverage: any,
    failuretoast: (title: string, message: string) => void
) => {
    if (isEmpty(leverage)) {
        failuretoast("Error!", "Leverage is required.");
        return false;
    }

    if (!/^\d+$/.test(String(leverage).trim())) {
        failuretoast("Error!", "Leverage must be a number.");
        return false;
    }

    const leverageNum = Number(leverage);

    if (leverageNum < 1 || leverageNum > 100) {
        failuretoast("Error!", "Leverage must be between 1 and 100.");
        return false;
    }

    return true;
};

export const validateCopyTrade = (
    pairData: any,
    formData: any,
    agree1: any,
    agree2: any,
    agree3: any,
    failuretoast: (title: string, message: string) => void
) => {

    if (!pairData.length) {
        failuretoast("Error!", "Please select at least one trading pair.");
        return false;
    }

    if (!formData.maxAllowAmount) {
        failuretoast("Error!", "Maximum follow amount is required.");
        return false;
    }

    if (!formData.takeProfit) {
        failuretoast("Error!", "Take profit is required.");
        return false;
    }

    if (!formData.stopLoss) {
        failuretoast("Error!", "Stop loss is required.");
        return false;
    }

    if (!validateLeverage(formData.leverage, failuretoast)) return false;

    if (!agree1 || !agree2 || !agree3) {
        failuretoast("Error!", "You must agree to all terms.");
        return false;
    }

    return true;
};

export const validateBecomeTrade = (
    formData: any,
    failuretoast: (title: string, message: string) => void
) => {


    if (!formData.name) {
        failuretoast("Error!", "Name is required.");
        return false;
    }

    if (!formData.description) {
        failuretoast("Error!", "Description is required.");
        return false;
    }

    if (!formData.minFixedInvesPercen) {
        failuretoast("Error!", "Min FixedInvesPercen required.");
        return false;
    }
    if (!formData.linkedInUrl) {
        failuretoast("Error!", "LinkedIn Url is required.");
        return false;
    }

    if (!formData.twitterUrl) {
        failuretoast("Error!", "Twitter Url is required.");
        return false;
    }

    if (!formData.telegramUrl) {
        failuretoast("Error!", "Telegram Url is required.");
        return false;
    }

    if (!formData.copyTradeFee) {
        failuretoast("Error!", "CopyTrade Fee is required.");
        return false;
    }

    if (!formData.binanceUrl) {
        failuretoast("Error!", "Binance Url required.");
        return false;
    }

    if (!formData.bybitUrl) {
        failuretoast("Error!", "Bybit Url is required.");
        return false;
    }

    if (!formData.coinbaseUrl) {
        failuretoast("Error!", "Coinbase Url is required.");
        return false;
    }

    if (!formData.maxFollower) {
        failuretoast("Error!", "Max Follower required.");
        return false;
    }

    return true;
};


export const ObjectIsempty = (Obj: object) => {
    try {
        let objectArr = Object.values(Obj);
        for (let i = 0; i < objectArr.length; i++) {
            let emptyKey = [];
            if (!isEmpty(objectArr[i])) {
                return false;
            } else {
                emptyKey.push(i);
                if (emptyKey.length - 1 === objectArr.length - 1) {
                    return true;
                }
            }
        }
        return true;
    } catch (err) {
        console.log(err, 'ObjectIsempty_err');
    }
};

export const validator = (data: any) => {
    try {
        const fields = Object.keys(data) ?? [];
        let invalidCount = 0;
        if (fields.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const validationResult = fields.map((field) => {
                let validatedField = getValidate(data[field], data);
                data[field] = validatedField;
                !validatedField.isValid && invalidCount++;
                return data[field];
            });
            return { data: data, isValid: invalidCount === 0 };
        } else {
            return { data: {}, isValid: true };
        }
    } catch (error: any) {
        console.log('VALIDATOR-ERROR', error);
    }
};


export const getValidate = (data: any, bigData?: any) => {
    try {
        let rules = Object.keys(data?.rules ?? {});
        if (rules.length > 0) {
            let isValid = true;
            let index = 0;
            do {
                switch (rules[index]) {
                    case 'required':
                        data.isValid = !isEmpty(data.value);
                        break;
                    case 'email':
                        data.isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.value) || isEmpty(data.value);
                        break;
                    case 'password':
                        data.isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(data.value) || isEmpty(data.value);
                        break;
                    case 'number':
                        data.isValid =
                            typeof data.value === 'number' || (!isNaN(Number(data.value)) && /^\d+$/.test(data.value)) || isEmpty(data.value);
                        break;
                    case 'alpha':
                        data.isValid =
                            (typeof data.value === 'string' && /^[A-Za-z\s]*$/.test(data.value)) || isEmpty(data.value);
                        break;
                    case 'upi':
                        data.isValid = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(data.value?.trim()) || isEmpty(data.value);
                        break;
                    case 'url':
                        data.isValid = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(data.value) || isEmpty(data.value);
                        break;
                    case 'time':
                    case 'date':
                        data.isValid = (data.value instanceof Date && !isNaN(data.value)) || isEmpty(data.value);
                        break;
                    case 'equalTo':
                        data.isValid =
                            bigData[data.rules[rules[index]]] &&
                            bigData[data.rules[rules[index]]].value === data.value;
                        break;
                    case 'minLength':
                        data.isValid = data.value.length >= data.rules[rules[index]];
                        break;
                    case 'maxLength':
                        data.isValid = data.value.length <= data.rules[rules[index]];
                        break;
                    case 'fileSize':
                        data.isValid = Number(data.value.size) <= data.rules[rules[index]];
                        break;
                    case 'fileType':
                        data.isValid = (data?.rules[rules[index]] ?? []).length > 0 ? data?.rules[rules[index]].includes((data?.value?.type ?? data?.value?.mime ?? '').split('/')[1]) : true;
                        break;
                    default:
                        break;
                }
                isValid = data.isValid;
                data.errorMessage = isValid ? '' : data.messages[rules[index]];
                index++;
            } while (isValid && rules.length > index);
            return data;
        } else {
            return { ...data, isValid: true };
        }
    } catch (error: any) {
        console.log('GET-VALIDATOR-ERROR', error);
    }
};

export const isValidMobile = (mobile: string) => {
    if (!mobile) return "Mobile number is required";
    if (!/^[6-9]\d{9}$/.test(mobile)) return "Invalid mobile";
    return "";
};

export const isValidOtp = (otp: string) => {
    if (!otp) return "OTP required";
    if (!/^\d{6}$/.test(otp)) return "Invalid OTP";
    return "";
};