import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios, axiosDecrypt, catchDecrypt } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';
import { RemoveItemLocalStorageItem } from '../lib/storage';
import { fileToBase64Envelope, formDataToBase64Json } from '../lib/fileToBase64';
import jsPDF from 'jspdf';
import "jspdf-autotable";

// SECURITY FIX (VAPT: "Token Storage Security" / "Sensitive Data in Logs"
// — Points 44/49/70, 61): removed the local getAuthToken() that read the
// raw JWT out of localStorage and logged it to the console, and the
// Authorization-header assignment that depended on it. Auth now flows via
// the backend's httpOnly cookie (sent automatically — see
// config/axios.js's axios.defaults.withCredentials = true).




export const registrationHooks = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/registration`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("registrationHooks__err", err);
    }
}


export const accountVerificationHooks = async (userId) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/account_verification/${userId}`,
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("accountVerificationHooks__Err", err);
    }
}


export const loginHooks = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/login`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("loginnHooks__Err", err);
    }
}



export const loginVerificationHooks = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/login_verification`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("loginVerificationHooks__Err", err);
    }
}



export const logoutHooks = async () => {
    try {
        const response = await axios.get(`${config.API_URL}/user/logout`, {}, { headers: { 'Content-Type': 'multipart/form-data' } });
        let respData = axiosDecrypt(response);
        return { data: respData }
    } catch (e) {
        console.log("logoutHooks__Err", e)
        let respData = catchDecrypt(e)
        return { data: respData }
    }
}



export const mobileVerificationCodeHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/mobile_verification_code`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp.data;
    } catch (err) {
        console.log("mobileVerificationCodeHooks__Err", err);
    }
}

// data: { files: <File>, kycType, type } — same fields callers previously
// put on a FormData; `files` is now sent as a base64 envelope instead of
// raw multipart (Cloudflare's OWASP rule 920270 blocks null bytes in
// multipart bodies — same fix already applied to internal_fiat_deposit).
export const verificationPanCardHooks = async (data, key) => {
    try {
        const filesEnvelope = data?.files ? await fileToBase64Envelope(data.files) : null;
        const jsonBody = {
            kycType: data?.kycType,
            type: data?.type,
            ...(filesEnvelope ? { files: filesEnvelope } : {}),
        };
        const response = await axios.post(`${config.API_URL}/user/panCardNumber_create_request`, jsonBody, { headers: { 'Content-Type': 'application/json' } });
        let respData = axiosDecrypt(response, key);
        return { data: respData }
    } catch (error) {
        let respData = decryptObject(error?.response?.data, !isEmpty(key) ? key : config.SERCERT_KEY)
        console.log(respData, 'respData_Axios');
        // console.log("verificationPanCardHooks__Err", error);
        return { data: respData }
    }
}

export const panKycVerfifactionStatusChecking = async (key) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/panKycVerfifactionStatusChecking`,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (error) {
        console.log("panKycVerfifactionStatusChecking__Err", error);
    }
}
// data: { image: <File>, kycType, type } — same fields callers previously
// put on a FormData; `image` is now sent as a base64 envelope instead of
// raw multipart, same fix as verificationPanCardHooks above.
export const checkFaceLiveness = async (data, key) => {
    try {
        const imageEnvelope = data?.image ? await fileToBase64Envelope(data.image) : null;
        const jsonBody = {
            kycType: data?.kycType,
            type: data?.type,
            ...(imageEnvelope ? { image: imageEnvelope } : {}),
        };
        const response = await axios.post(`${config.API_URL}/user/checkFaceLiveness`, jsonBody, { headers: { 'Content-Type': 'application/json' } });
        let respData = axiosDecrypt(response, key);
        return { data: respData }
    } catch (error) {
        console.log("checkFaceLiveness", error);
        let respData = decryptObject(error?.response?.data, !isEmpty(key) ? key : config.SERCERT_KEY)
        console.log(respData, 'respData_Axios');
        // console.log("verificationPanCardHooks__Err", error);
        return { data: respData }
    }
}

export const getUserDetailsHooks = async (key) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/get_user_details`
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getUserDetailsHooks__Err", err);
    }
}

export const additionalVerification = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/additionalVerification`,
            data: data,
            secretKey: key

        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("additionalVerification__Err", err);
    }
}

export const verifyMobileVerificationHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/verify_mobile_verification`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp.data;
    } catch (err) {
        console.log("verifyMobileVerificationHooks__Err", err);
    }
}


export const resendLoginCodeHooks = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/resend_login_code`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("resendLoginCodeHooks__Err", err);
    }
}


export const resendCodeHooks = async (secretKey) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/resend_code`,
            secretKey: secretKey
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("resendLoginCodeHooks__Err", err);
    }
}


export const forgotPasswordHooks = async (data) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/forgot_password`,
            params: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("forgotPasswordHooks__Err", err);
    }
}


export const resetPasswordHooks = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/forgot_password`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("resetPasswordHooks__Err", err);
    }
}

export const verifyForgotOtpHooks = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/verify_forgot_otp`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("verifyForgotOtpHooks__Err", err);
    }
}

export const changePasswordOTPHooks = async (data) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/change_password`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("changePasswordOTPHooks__Err", err);
    }
}



export const changePasswordHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/change_password`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("changePasswordHooks__Err", err);
    }
}



export const requestEmailChangeHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/change_email`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("requestEmailChangeHooks__Err", err);
    }
}



export const sendEmailVerificationLinkHooks = async (data) => {
    try {
        let reqData = {
            method: "put",
            url: `/user/change_email`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("sendEmailVerificationLinkHooks__Err", err);
    }
}



export const confirmEmailChangeHooks = async (data) => {
    try {
        let reqData = {
            method: "patch",
            url: `/user/change_email`,
            data: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("confirmEmailChangeHooks__Err", err);
    }
}



export const sendOldMobileOtpHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/user/change_mobilenumber`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp.data;
    } catch (err) {
        console.log("sendOldMobileOtpHooks__Err", err);
    }
}

export const verifyOldMobileOtpCodeHooks = async (data, key) => {
    try {
        let reqData = {
            method: "put",
            url: `/user/change_mobilenumber`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp.data;
    } catch (err) {
        console.log("verifyOldMobileOtpCodeHooks__Err", err);
    }
}


// export const sendNewMobileOtpHooks = async (data, key) => {
//     try {
//         let reqData = {
//             method: "put",
//             url: `/user/change_mobilenumber`,
//             data: data,
//             secretKey: key
//         };
//         var resp = await Axios(reqData);
//         return resp.data;
//     } catch (err) {
//         console.log("sendNewMobileOtpHooks__Err", err);
//     }
// }


export const confirmMobileNumberUpdateHooks = async (data, key) => {
    try {
        let reqData = {
            method: "patch",
            url: `/user/change_mobilenumber`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp.data;
    } catch (err) {
        console.log("confirmMobileNumberUpdateHooks__Err", err);
    }
}


// data: the same FormData every caller (profile image, name, settings)
// already builds — converted here into a plain JSON body, with any File
// entry (only ever `attachment`, the profile image — see MyProfile.jsx)
// sent as a base64 envelope instead of raw multipart. Every non-file
// caller (settings/name updates) is unaffected: their FormData entries are
// all plain strings, which just pass straight through as JSON fields.
export const updateUserSettingsHooks = async (data, key) => {
    try {
        const jsonBody = await formDataToBase64Json(data);
        const response = await axios.post(`${config.API_URL}/user/update_user_settings`, jsonBody, { headers: { 'Content-Type': 'application/json' } });
        let respData = axiosDecrypt(response, key);
        return { data: respData }
    } catch (err) {
        let respData = catchDecrypt(err, key)
        return { data: respData }
    }
}



export const updateTwoFactorMethodHooks = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/update_2FA_type`,
            params: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("updateTwoFactorMethodHooks__Err", err);
    }
}




export const generate2faHooks = async (data) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/security/2fa-settings`,
            data: data,
            secretKey: data
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("updateTwoFactorMethodHooks__Err", err);
    }
}



export const enable2FAHooks = async (data, key) => {
    try {
        let reqData = {
            method: "put",
            url: `/user/security/2fa-settings`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("enable2FAooks__Err", err);
    }
}


export const disable2FAHooks = async (data, key) => {
    try {
        let reqData = {
            method: "patch",
            url: `/user/security/2fa-settings`,
            data: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("disable2FAHooks__Err", err);
    }
}


// data: { type, kycType, countryCode, mobileNumber, attachments: [<File>, <File>] }
// — same fields the caller previously put on a FormData (attachments
// appended twice, front+back); now sent as an array of base64 envelopes
// instead of raw multipart, same fix as the other KYC hooks above.
export const internalVerificationHooks = async (data, key) => {
    try {
        const attachmentEnvelopes = Array.isArray(data?.attachments)
            ? await Promise.all(data.attachments.map((file) => fileToBase64Envelope(file)))
            : null;
        const jsonBody = {
            type: data?.type,
            kycType: data?.kycType,
            countryCode: data?.countryCode,
            mobileNumber: data?.mobileNumber,
            ...(attachmentEnvelopes ? { attachments: attachmentEnvelopes } : {}),
        };
        const response = await axios.post(`${config.API_URL}/user/internal-verification`, jsonBody, { headers: { 'Content-Type': 'application/json' } });
        let respData = axiosDecrypt(response, key);
        return { data: respData }
    } catch (err) {
        let respData = catchDecrypt(err, key)
        return { data: respData }
    }
}


export const getPassbookHistoryHooks = async (query, key) => {
    try {
        const response = await axios.post(`${config.API_URL}/user/get_passbook_history`, query, { headers: { 'Content-Type': 'multipart/form-data' } });
        let respData = axiosDecrypt(response, key);
        return { data: respData }
    } catch (err) {
        let respData = catchDecrypt(err, key)
        return { data: respData }
    }
}


export const getTranscationHistoryHooks = async (query, key) => {
    try {
        const response = await axios.post(`${config.API_URL}/user/get_transaction_history`, query, { headers: { 'Content-Type': 'multipart/form-data' } });
        let respData = axiosDecrypt(response, key);
        return { data: respData }
    } catch (err) {
        console.log("getTranscationHistoryHooks__Err", err);
    }
}


/** Refferal Action  */

export const getRefferalDetailsHooks = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/get_user_refferal_details`,
            params: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getRefferalDetailsHooks__Err", err);
    }
}



export const getRefferalTranscationsHooks = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/user/get_refferal_transaction_history`,
            params: data,
            secretKey: key
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getRefferalTranscationsHooks__Err", err);
    }
}


export const getRecoveryUserOptions = async (data) => {
    try {
        let respData = await Axios({
            'url': `/user/recovery_user`,
            'method': 'post',
            data,
        });
        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
            result: respData?.data?.result,
            error: respData?.data?.errors
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const getRecoveryCode = async (data) => {
    try {
        let respData = await Axios({
            'url': `/user/recovery_user`,
            'method': 'put',
            data
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const createCashfreeRequest = async (key) => {
    try {
        let respData = await Axios({
            'url': `/user/cashfree_create_request`,
            'method': 'post',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("createCashfreeRequest_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const verificationStatus = async (key) => {
    try {
        let respData = await Axios({
            'url': `/user/cashfree_verification_status`,
            'method': 'get',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const getNotifications = async (data) => {
    try {
        let respData = await Axios({
            'url': `/notification/getAllNotifications`,
            'method': 'get',
            params: data
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData?.data?.result,
            count: respData?.data?.result?.count,
            error: respData?.data?.errors
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}

export const UpdateNotification = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/notification/updateNotification`,
            'method': 'post',
            data: data,
            secretKey: key
        });
        // console.log("getNotifications", respData)
        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}

export const UpdateTab = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/user/updateTab`,
            'method': 'post',
            data: data,
            secretKey: key
        });
        // console.log("getNotifications", respData)
        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}



export const signupWithGoogle = async (data) => {
    try {
        let respData = await Axios({
            'url': `/user/signup_with_google`,
            'method': 'post',
            data
        });
        return {
            success: respData.data.success,
            status: respData.data.status,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("signupWithGoogle_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const getCsvDownloader = async (data, type) => {
    try {
        const record = await axios.get(`${config.BASE_URL}/user/export_csv`, { params: data });
        const url1 = window.URL.createObjectURL(new Blob([record.data]));
        const link = document.createElement('a');
        link.href = url1;
        link.setAttribute('download', type);
        document.body.appendChild(link);
        link.click();
        return { status: true, message: `${type.split(".")[1].toUpperCase()} file downloaded successfully.` };
    } catch (e) {
        console.log("getCsvDownloader_err", e);
        return { status: false, error: e.response.data, data: {} }
    }
}

export const getExcelDownloader = async (data, type) => {
    try {
        const record = await axios.get(`${config.BASE_URL}/user/export_xls`,
            {
                params: data,
                responseType: "arraybuffer"
            }
        );
        const blob = new Blob([record.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        const url1 = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url1;
        link.setAttribute('download', type);
        document.body.appendChild(link);
        link.click();
        return { status: true, message: `${type.split(".")[1].toUpperCase()} file downloaded successfully.` };
    } catch (e) {
        console.log("getExcelDownloader_err", e);
        return { status: false, error: e.response.data, data: {} }
    }
}


export const getPdfDownloader = async (data, type) => {
    try {
        const record = await axios.get(`${config.BASE_URL}/user/export_pdf`, { params: data });
        const unit = "pt";
        const size = "A3"; // Use A1, A2, A3 or A4
        const orientation = "landscape"; // portrait or landscape
        const marginLeft = 40;
        const doc = new jsPDF(orientation, unit, size);
        doc.setFontSize(13);

        let content = {
            startY: 50,
            head: record.data.header,
            body: record.data.data,
        };


        doc.text(type, marginLeft, 40);
        doc.autoTable(content);
        doc.save(`${type}.pdf`);
        return { status: true }
    } catch (e) {
        console.log("getPdfDownloader_err", e);
        return { status: false, error: e?.response?.data, data: {} }
    }
}


export const generateQR = async () => {
    try {
        let respData = await Axios({
            'url': `/user/generate-qr`,
            'method': 'get',
        });
        return {
            success: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("generateQR_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const verifyQR = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/user/verify-qr`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            success: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("verifyQR_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const exchangeQR = async (data) => {
    try {
        let respData = await Axios({
            'url': `/user/exchange-qr`,
            'method': 'post',
            data
        });

        return {
            success: respData.data.success,
            status: respData.data.status,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }

    } catch (err) {
        console.log("verifyQR_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const signInWithApple = async (data) => {
    try {
        let respData = await Axios({
            'url': `/user/signup_with_apple`,
            'method': 'post',
            data
        });
        return {
            success: respData.data.success,
            message: respData.data.message,
            status: respData?.data?.status,
            result: respData.data.result,
            error: respData.data.errors
        }

    } catch (err) {
        console.log("verifyQR_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const getRecoveryOtpionHooks = async (data) => {
    try {
        let respData = await Axios({
            'url': `/user/recovery_user`,
            'method': 'get',
            params: data
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (err) {
        console.log("getRecoveryUserOptions_err", err);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}