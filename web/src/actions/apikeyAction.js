import isEmpty from 'is-empty';
import axios, { Axios } from '../config/axios';


export const createApikey = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/key/create_apikey`,
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
        console.log("createApikey_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
            error: e?.response?.data?.errors
        }
    }
}



export const getApikeys = async (key) => {
    try {

        let respData = await Axios({
            'url': `/key/get_keys`,
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
        console.log("getApikeys_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
            error: e?.response?.data?.errors
        }
    }
}


export const editApiKey = async (data, key) => {
    try {

        let respData = await Axios({
            'url': `/key/edit_apikey`,
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
        console.log("editApiKey_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
            error: e?.response?.data?.errors
        }
    }
}

export const deleteApiKey = async (data, key) => {
    try {

        let respData = await Axios({
            'url': `/key/delete_key/${data}`,
            'method': 'delete',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("deleteApiKey_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
            error: e?.response?.data?.errors
        }
    }
}