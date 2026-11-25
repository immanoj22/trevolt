import isEmpty from 'is-empty';
import axios, { Axios } from '../config/axios';

/** redux */
import { InstitutionalDetails } from "../redux/action";


export const becomeAnInstitutional = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/institution/become_institutional`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            errors: respData.data.errors
        }
    } catch (e) {
        console.log("becomeAnInstitutional_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const updateInstitutional = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/institution/update_settings`,
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
        console.log("updateInstitutional_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const addSubUsers = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/institution/add_institutional_users`,
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
        console.log("addSubUsers_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const getSubAccdetails = async (data) => {
    try {
        let respData = await Axios({
            'url': `/institution/get_subuser_details/${data.institutionalid}`,
            'method': 'get',
            'params': data,
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("getSubAccdetails_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const deactivateSubuser = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/institution/deactivate_subuser`,
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
        console.log("deactivateSubuser_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}


export const institutionOverView = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/institution/institution_overView`,
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
        console.log("deactivateSubuser_err", e);
        return {
            status: err.response.data.success,
            message: err.response.data.message,
            error: err.response.data.error
        }
    }
}

export const getInstitutionDetails = async (dispatch) => {
    try {

        let respData = await Axios({
            'url': `/institution/get_institutional`,
            'method': 'get'
        });
        if (respData.data.success) {
            dispatch(InstitutionalDetails({ institutionalDetails: respData.data.result }));
        }
        return { status: true, message: respData.data.message, data: respData?.data?.result?.data || 0 }
    } catch (e) {
        console.log("getInstitutionDetails_err", e);
        return { status: false, error: e.response.data.errors }
    }
}