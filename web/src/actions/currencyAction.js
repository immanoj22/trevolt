import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';


// SECURITY FIX (VAPT: "Token Storage Security" / "Sensitive Data in Logs"
// -- Points 44/49/70, 61): removed the local getAuthToken() that read the
// raw JWT out of localStorage and logged it to the console, and the
// Authorization-header assignment that depended on it. Auth now flows via
// the backend's httpOnly cookie (sent automatically -- see
// config/axios.js's axios.defaults.withCredentials = true).



export const getCurrencyDetailsHooks = async (data) => {
    try {
        let reqData = {
            method: "get",
            url: `/currency/get_currency_details`,
            secretKey: data
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("getCurrencyDetailsHooks__Err", e);
    }
}


export const getPriceConversionList = async () => {
    try {
        let reqData = {
            method: "get",
            url: `/currency/price_conversion_list`
        };
        let resp = await Axios(reqData);
        return resp.data;
    } catch (e) {
        console.log("getCurrencyDetailsHooks__Err", e);
    }
}

export const trendingTradePairs = async(key)=>{
     try {
        let reqData = {
            method: "get",
            url: `/trending/trendingTradePairs`,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp.data;
    } catch (e) {
        console.log("trendingTradePairs__Err", e);
    }
}

export const twentyFourHoursTradePairs = async(key)=>{
     try {
        let reqData = {
            method: "get",
            url: `/trending/twentyFourHoursTradePairs`,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp.data;
    } catch (e) {
        console.log("twentyFourHoursTradePairs__Err", e);
    }
}

export const popularTradePairs = async(key)=>{
     try {
        let reqData = {
            method: "get",
            url: `/trending/popularTradePairs`,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp.data;
    } catch (e) {
        console.log("popularTradePairs__Err", e);
    }
}