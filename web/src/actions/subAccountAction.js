/** packages */

import isEmpty from 'is-empty';
import axios from 'axios';

/** config */
import { Axios, axiosDecrypt, catchDecrypt } from '../config/axios';



export const getSubAccount = async (key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/sub_account`,
            'method': 'get',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("getSubAccount_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const createSubAccount = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/sub_account`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("createSubAccount_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const updateSubAccount = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/sub_account`,
            'method': 'put',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("updateSubAccount_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const updatePreferences = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/update_preferences`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("updatePreferences_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const switchAccount = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/switch_account`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("switchAccount_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const ChangeMarginMode = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/change_margin_mode`,
            'method': 'put',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("updateSubAccount_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const ReloadWallet = async (key) => {
    try {
        let respData = await Axios({
            'url': `/subaccount/reloadwallet`,
            'method': 'get',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message
        }
    } catch (err) {
        console.log(err, "ReloadWallet__err")
        return {
            status: err.response.data.success,
            message: err.response.data.message,
        }
    }
}

export const saveChartSettings = async (data, key) => {
    try {
        const respData = await Axios({
            url: `/subaccount/chart_settings`,
            method: 'post',
            data,
            secretKey: key
        });
        return { status: respData.data.success, message: respData.data.message };
    } catch (e) {
        console.log("saveChartSettings_err", e);
        return { status: false };
    }
};

export const getChartSettings = async (accountId, key) => {
    try {
        const respData = await Axios({
            url: `/subaccount/chart_settings?accountId=${accountId}`,
            method: 'get',
            secretKey: key
        });
        return { status: respData.data.success, result: respData.data.result };
    } catch (e) {
        console.log("getChartSettings_err", e);
        return { status: false, result: {} };
    }
};