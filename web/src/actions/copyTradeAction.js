import axios from 'axios';
import { Axios, axiosDecrypt, catchDecrypt } from '../config/axios';
import config from '../config/env';
import { allStrategies, myStrategies } from '../redux/copytradeAction';
import { decryptObject } from '../lib/Cryptojs';
import { isEmpty } from 'lodash';
import { formDataToBase64Json } from '../lib/fileToBase64';


// SECURITY FIX (VAPT: "Token Storage Security" / "Sensitive Data in Logs"
// -- Points 44/49/70, 61): removed the local getAuthToken() that read the
// raw JWT out of localStorage and logged it to the console, and the
// Authorization-header assignment that depended on it. Auth now flows via
// the backend's httpOnly cookie (sent automatically -- see
// config/axios.js's axios.defaults.withCredentials = true).




export const becomeAMasterTrader = async (data, key) => {
    try {
        // `data` is the same FormData built in ApplyMasterTraderModal.jsx —
        // only `profileImage` is ever a File; converted to a base64
        // envelope instead of raw multipart (Cloudflare's OWASP rule
        // 920270 blocks null bytes in multipart bodies).
        const jsonBody = await formDataToBase64Json(data);
        let reqData = {
            method: "post",
            url: `/copy/requestTrader`,
            data: jsonBody,
            headers: { 'Content-Type': 'application/json' },
        };
        var resp = await axios(reqData);
        let respData = axiosDecrypt(resp, key);

        return { data: respData }
    } catch (err) {
        console.log("registrationHooks__err", err);
        let respData = catchDecrypt(err, key)
        return { data: respData }
    }
}


export const getAllStrategy = async (data = {}) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/getAllStrategy`,
            data: data
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("registrationHooks__err", err);
        return { status: false }
    }
}

export const editStrategy = async (data, secretKey) => {
    try {
        // let reqData = {
        //     method: "post",
        //     url: `/copy/editStartegy`,
        //     data: data
        // }

        // Same base64-envelope conversion as becomeAMasterTrader above —
        // `data` is the FormData built in CopyProfileDashboard.jsx (its
        // File entry is currently appended under the key "file", not
        // "profileImage" — a pre-existing mismatch with what the backend
        // reads; preserved as-is here, not something this transport
        // migration should change).
        const jsonBody = await formDataToBase64Json(data);
        const response = await axios.post(`${config.API_URL}/copy/editStartegy`, jsonBody, { headers: { 'Content-Type': 'application/json' } });
        // var resp = await axios(reqData);
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)

        let respData = decryptObject(response.data, !isEmpty(secretKey) ? secretKey : config.SERCERT_KEY);
        return { data: respData }
    } catch (err) {
        console.log("errr", err)
        if (err?.response?.data?.statusCode == 401) {
            // userLogout() 
        } if (err?.response?.status == 429) {
            return { data: err?.response?.data }
        }
        let respData = decryptObject(err.response.data, !isEmpty(secretKey) ? secretKey : config.SERCERT_KEY)
        console.log(respData, 'respData_Axios');
        return { data: respData }
    }
}


export const updateStrategy = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/updateStrategy`,
            data: data
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("EditStrategy__err", err);
        return { status: false }
    }
}

export const requestCopier = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/requestCopier`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("EditStrategy__err", err);
        return { status: false }
    }
}

export const editCopier = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/editCopier`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("EditStrategy__err", err);
        return { status: false }
    }
}

export const updateCopier = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/updatecopiedStrategy`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("EditStrategy__err", err);
        return { status: false }
    }
}

export const getMyStrategy = async () => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/mystrategyDetails`,
            // data: data
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getMyStrategy__err", err);
        return { status: false }
    }
}

export const getCopierDetails = async () => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/mystrategyDetails`,
            // data: data
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getMyStrategy__err", err);
        return { status: false }
    }
}

export const getCopierTrades = async () => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/getCopierTrades`
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getMyStrategy__err", err);
        return { status: false }
    }
}

export const addAndRemoveFav = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/addAndremoveFav`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("addAndRemoveFav__err", err);
        return { status: false }
    }
}

export const getCopierDetail = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/getCopierDetails`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getCopierDetail__err", err);
        return { status: false }
    }
}

export const getStrategyDetail = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/strategyDetails/${data.strategyId}`
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getPerformanceDetail__err", err);
        return { status: false }
    }
}

export const getPerformanceDetail = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/getPerformanceDetails`,
            data: data,
            // secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getPerformanceDetail__err", err);
        return { status: false }
    }
}


export const getTradeHistories = async (data, payload, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/tradeHistory`,
            data: payload,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getPerformanceDetail__err", err);
        return { status: false }
    }
}

export const getOrderHistoriess = async (data, payload, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/orderHistory`,
            data: payload,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getPerformanceDetail__err", err);
        return { status: false }
    }
}

export const getCommissionHistories = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/CommissionHistory`,
            params: data,
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getPerformanceDetail__err", err);
        return { status: false }
    }
}

export const getFollowersDetail = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/getFollowersDetails`,
            params: data,
            // secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getPerformanceDetail__err", err);
        return { status: false }
    }
}

export const getOpenOrders = async (data, payload, secretKey) => {
    try {
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
        let reqData = {
            method: "post",
            url: `/copy/openOrder`,
            data: payload,
            secretKey: secretKey
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getOpenOrders__err", err);
        return { status: false }
    }
}

export const getStopOrders = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/stopOrders`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getOpenOrders__err", err);
        return { status: false }
    }
}

export const getCloseOrders = async (data, payload, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/closedOrders`,
            data: payload,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getOpenOrders__err", err);
        return { status: false }
    }
}


export const getReturnOfInvestmentCharts = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/getReturnOfInvestmentChart`,
            data: data,
            // secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getReturnOfInvestmentCharts__err", err);
        return { status: false }
    }
}

export const getProfitandLossCharts = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/getProfitandLossChart`,
            data: data,
            // secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getProfitandLossCharts__err", err);
        return { status: false }
    }
}

export const getVolumeBreakDowns = async (data) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/getVolumeBreakDown`,
            data: data,
            // secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getProfitandLossCharts__err", err);
        return { status: false }
    }
}

export const getCopierStats = async (data) => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/getCopierStats/${data}`
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("getCopierStats__err", err);
        return { status: false }
    }
}



export const UpdateCopiedStrategy = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/UpdateCopiedStrategy`,
            data: data,
            secretKey: key
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("UpdateCopiedStrategy__err", err);
        return { status: false }
    }
}

export const inactiveStardegy = async (data, secretKey) => {
    try {
        let reqData = {
            method: "post",
            url: `/copy/inactiveStardegy`,
            data: data,
            secretKey: secretKey
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("inactiveStardegy__err", err);
        return { status: false }
    }
}

export const getCopytradeAssets = async (data) => {
    try {
        let reqData = {
            method: "get",
            url: `/copy/getCopyTradeAssets`,
            params: data
        }
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("UpdateCopiedStrategy__err", err);
        return { status: false }
    }
}


export const getfuturePositionOrders = async (params, data, key) => {
    try {
        let respData = await Axios({
            'url': `/copy/positionOrders/${params.pairId}/${params.tradeMode}`,
            'method': 'get',
            'params': params,
            // secretKey: key
        });
        return {
            status: respData.data.success,
            record: respData.data.result.data,
            count: respData.data.result.count,
            currentPage: respData.data.result.currentPage,
            nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futurePositionOrders_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
            error: e?.response?.data?.error
        }
    }
}