import isEmpty from 'is-empty';
import axios from 'axios';
import { Axios } from '../config/axios';
import config from '../config/env';
import { decryptObject } from '../lib/Cryptojs';
import { generateIdempotencyKey } from '../lib/idempotencyKey';
import { fileToBase64Envelope } from '../lib/fileToBase64';

export const addBankAccountHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/wallet/add_bank_account`,
            data: data,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("addBankAccountHooks__Err", e);
    }
}

export const updateBankAccountHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/wallet/update_bank_account`,
            data: data,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("updateBankAccountHooks__Err", e);
    }
}

export const deleteBankAccountHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/wallet/delete_bank_account`,
            data: data,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("deleteBankAccountHooks__Err", e);
    }
}

export const getUserWalletHooks = async (data, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/wallet/get_user_wallet`,
            params: data,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("getUserWalletHooks__Err", e);
    }
}

export const walletTransferHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/wallet/wallet_transfer`,
            data: data,
            secretKey: key,
            // SECURITY FIX (VAPT: "API Replay Attack" #140 / "Duplicate
            // Transaction Submission" #189) — one fresh key per submit, so a
            // double-click or network-retry can't move funds twice.
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
        };
        let resp = await Axios(reqData);
        return {
            status: resp.data.success,
            message: resp.data.message,
            result: resp.data.result,
            error: resp.data.errors
        }
    } catch (e) {
        console.log("walletTransferHooks__Err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const fiatDepositRequestHooks = async (data, secretKey) => {
    try {
        
        const attachmentEnvelope = data?.attachment
            ? await fileToBase64Envelope(data.attachment)
            : null;

        const reqData = {
            method: "post",
            url: `/wallet/internal_fiat_deposit`,
            data: {
                accountId: data.accountId,
                amount: data.amount,
                currencyId: data.currencyId,
                transactionNumber: data.transactionNumber,
                pay_mode: data.pay_mode,
                upi_channel: data.upi_channel,
                ...(attachmentEnvelope ? { attachment: attachmentEnvelope } : {}),
            },
            secretKey,
            // FIX: this route requires Idempotency-Key server-side (see
            // Middleware/Security/idempotencyKey.js on /wallet/internal_fiat_deposit).
            // walletTransferHooks and fiatWithdrawRequestHooks in this same file
            // already send it — this call was missed when the header was added.
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (err) {
        console.log("fiatDepositRequestHooks__Err", err);
        let respData = decryptObject(err?.response?.data, !isEmpty(secretKey) ? secretKey : config.SERCERT_KEY)
        return { data: respData }
    }
}

export const fiatWithdrawRequestHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/wallet/internal_fiat_withdraw`,
            data: data,
            secretKey: key,
            // SECURITY FIX (VAPT: "API Replay Attack" #140 / "Duplicate
            // Transaction Submission" #189) — prevents a double-click or a
            // client-side retry-on-timeout from submitting the same
            // withdrawal request twice.
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("fiatWithdrawRequestHooks__Err", e);
    }
}

export const getWithdrawCodeHooks = async (accountId, key) => {
    try {
        let reqData = {
            method: "get",
            url: `/wallet/get_withdraw_code/${accountId}`,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("getWithdrawCodeHooks__Err", e);
    }
}

export const setDefaultBankAccountHooks = async (data, key) => {
    try {
        let reqData = {
            method: "post",
            url: `/wallet/set_default_bank_account`,
            data: data,
            secretKey: key
        };
        let resp = await Axios(reqData);
        return resp;
    } catch (e) {
        console.log("setDefaultBankAccountHooks__Err", e);
    }
}