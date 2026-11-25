import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';
import { generateIdempotencyKey } from '../lib/idempotencyKey';

import { OptionContractDetail } from '../redux/optionAction';

export const getAllUnderlyingAssetDetails = async () => {// check and used
    try {
        const resp = await Axios({
            method: "get",
            url: `/option/get_underlying_asset`
        });
        return {
            status: true,
            message: resp.data.message,
            data: resp?.data?.result
        };
    } catch (e) {
        console.log("getAllUnderlying__Err", e);
        return {
            status: false,
            message: e?.response?.data?.message,
            error: e?.response?.data?.errors
        }
    }
}

export const getOptionDetails = async (data, dispatch) => {// check and used
    try {
        const resp = await Axios({
            method: "get",
            url: `/option/get_option_details`,
            params: data
        });
        if (!isEmpty(resp?.data?.result?.data)) {
            dispatch(OptionContractDetail({ optionContractData: resp?.data?.result?.data?.[0] }))
        }
        return {
            status: true,
            message: resp?.data?.message,
            data: resp?.data?.result?.data
        };
    } catch (e) {
        console.log("getAllUnderlying__Err", e);
        return {
            status: false,
            message: e?.response?.data?.message,
            error: e?.response?.data?.errors
        }
    }
}

export const optionOrderPlacing = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/option/order_placing`,
            'method': 'post',
            data,
            secretKey: key,
            // SECURITY FIX (VAPT: "API Replay Attack" #140 / "Duplicate
            // Transaction Submission" #189)
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureOrderPlacing_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const optionBasketOrderPlacing = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/option/basket_order_placing`,
            'method': 'post',
            data,
            secretKey: key,
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("optionBasketOrderPlacing_err", e);
        return {
            status: e.response?.data?.success,
            message: e.response?.data?.message,
            error: e.response?.data?.error
        }
    }
}

export const optionChangeLeverage = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/changeLeverage`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureChangeLeverage_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}