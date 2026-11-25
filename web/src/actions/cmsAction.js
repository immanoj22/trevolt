import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios, AxiosCms, axiosDecrypt, catchDecrypt } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';
import { RemoveItemLocalStorageItem } from '../lib/storage';


// export const getTranscationHistoryHooks = async (query, key) => {
//     try {
//         const response = await axios.post(`${config.API_URL}/user/get_transaction_history`, query, { headers: { 'Content-Type': 'multipart/form-data' } });
//         let respData = axiosDecrypt(response, key);
//         console.log("getTranscationHistoryHooks_Resp", response, respData)
//         return { data: respData }
//     } catch (e) {
//         console.log("getTranscationHistoryHooks__Err", e);
//     }
// }


// get cms

export const getCms = async (data) => {
    // console.log('datadata', data)
    try {
        let respData = await AxiosCms({
            // 'url': `/cms/getPage/${data}`,
            'url': `/cms/getPage`,
            'method': 'get',
            // secretKey: null
            params: data
        });

        // console.log('respDatasssss', respData);

        return {
            status: respData?.data?.success,
            message: respData?.data?.message,
            data: respData?.data?.result,
            error: respData?.data?.errors
        }
    } catch (err) {
        // console.log("getCms_err", err);
        return {
            status: err?.response?.data?.success,
            message: err?.response?.data?.message,
            error: err?.response?.data?.error
        }
    }
}


