import isEmpty from 'is-empty';
import axios, { Axios } from '../config/axios';

export const getWebhookOTP = async (key) => {
    try {

        let respData = await Axios({
            'url': `/algo/create_webhook`,
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
        console.log("editApiKey_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}



export const createWebHook = async (data, key) => {
    try {

        let respData = await Axios({
            'url': `/algo/create_webhook`,
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
        console.log("create_webhook_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}