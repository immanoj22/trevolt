import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios, axiosDecrypt, catchDecrypt } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';
import { RemoveItemLocalStorageItem } from '../lib/storage';
import jsPDF from 'jspdf';

// SECURITY FIX (VAPT: "Token Storage Security" / "Sensitive Data in Logs"
// -- Points 44/49/70, 61): removed the local getAuthToken() that read the
// raw JWT out of localStorage and logged it to the console, and the
// Authorization-header assignment that depended on it. Auth now flows via
// the backend's httpOnly cookie (sent automatically -- see
// config/axios.js's axios.defaults.withCredentials = true).




export const createUPIOrderHooks = async (userId) => {
    try {
        let reqData = {
            method: "post",
            url: `/mmadpay/create-upi-order`,
        };
        var resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("createUPIOrderHooks__Err", err);
    }
}