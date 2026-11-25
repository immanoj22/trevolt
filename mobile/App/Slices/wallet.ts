import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';


import { walletState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";
import { generateIdempotencyKey } from "../Utilities/idempotencyKey";

export const initialState: walletState = {
    isloading: false,
    getcurrencies: [],
    pricedetails: [],
    wallet: {
        walletBalance: 0,
        availableBalance: 0,
        freezeBalance: 0,
        totalMargin: 0,
        totalMaintainMargin: 0,
        unRealizedPnL: 0
    },
}

const wallet = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        update_getcurrencies: (state, action: PayloadAction<any>) => {
            state.getcurrencies = action.payload ?? [];
        },

        update_pricedetails: (state, action: PayloadAction<any>) => {
            // customhook.tsx calls pricedetails.find(...) in several places — keep this
            // an array even if the API response is missing/malformed, or those crash.
            state.pricedetails = Array.isArray(action.payload) ? action.payload : [];
        },
        setUserBalance: (state, action: PayloadAction<any>) => {
            state.wallet = action.payload ?? initialState.wallet;
        },
    },
});

export const {
    update_getcurrencies,
    update_pricedetails,
    setUserBalance,
} = wallet.actions;

export default wallet.reducer;
export const walletSelector = (state: { wallet: walletState }) => state.wallet;

export const walletApi = createApi({
    reducerPath: 'walletapi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({

        addbank: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.addbank}`,
                method: 'POST',
                body: payload,

            }),
        }),


        updatebank: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.updatebank}`,
                method: 'POST',
                body: payload,

            }),
        }),

        deletebank: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.deletebank}`,
                method: 'POST',
                body: payload,

            }),
        }),

        getcurrency: builder.query({
            query: () => ({
                url: `${ENDPOINTS.getcurrency}`,
                method: 'GET',
                meta: {
                    isgetsecondary: true
                }
            }),
        }),

        internalfiat: builder.mutation({
            // Migrated off multipart/form-data: this route now runs decryptRequest +
            // decodeBase64Files(['attachment']) server-side (backend commit "upload
            // file convert to base64 format for internal_fiat_deposit endpoint"), so
            // it expects the normal AES-encrypted JSON body with the receipt as a
            // base64 envelope under `attachment` - NOT a raw file part. Sending
            // multipart here now fails decryptRequest with 400 "Authentication
            // failed. Invalid token" before the controller runs. The caller
            // (DepositDetails.tsx) builds `attachment` via fileToBase64Envelope().
            // Default (else) branch of encryptedBaseQuery encrypts the body, matching
            // web's fiatDepositRequestHooks().
            query(payload) {
                return {
                    url: ENDPOINTS.internalfiat,
                    body: payload,
                    method: 'POST',
                    // Route also enforces requireIdempotencyKey (replay-attack
                    // remediation). query() re-runs per trigger, so this is a fresh
                    // key per submit.
                    headers: { 'Idempotency-Key': generateIdempotencyKey() },
                }
            },
        }),

        walletTansfer: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.walletTransfer}`,
                method: 'POST',
                body: payload,
                // See internalfiat above - wallet/wallet_transfer also enforces
                // requireIdempotencyKey server-side.
                headers: { 'Idempotency-Key': generateIdempotencyKey() },
            })
        }),

        withdrawcode: builder.query({
            query: (accountId) => ({
                url: `${ENDPOINTS.withdrawcode}/${accountId}`,
                method: 'GET',
                meta: {
                    isgetsecondary: true
                }
            }),
        }),

        withdrawfiat: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.fiatwithdraw}`,
                method: 'POST',
                body: payload,
                // See internalfiat above - wallet/internal_fiat_withdraw also enforces
                // requireIdempotencyKey server-side.
                headers: { 'Idempotency-Key': generateIdempotencyKey() },
            })
        }),

        priceconversion: builder.query({
            query: () => ({
                url: `${ENDPOINTS.priceconversion}`,
                method: 'GET',
                meta: {
                    isget: true
                }
            }),
        }),

        transactionhistory: builder.mutation({
            query(payload) {
                const formData = payload;
                return {
                    url: ENDPOINTS.transactionhistory,
                    body: formData,
                    formData: true,
                    method: 'POST',
                    meta: {
                        isform: true
                    },
                    redirect: "follow",

                }
            },
        }),

        getpassbook: builder.mutation({
            query(payload) {
                const formData = payload;
                return {
                    url: ENDPOINTS.getpassbook,
                    body: formData,
                    formData: true,
                    method: 'POST',
                    meta: {
                        isform: true
                    },
                    redirect: "follow",

                }
            },
        }),

        setdefaultbank: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.setdefaultbank}`,
                method: 'POST',
                body: payload,

            }),
        }),

    })
})


export const {
    useAddbankMutation,
    useDeletebankMutation,
    useUpdatebankMutation,
    useInternalfiatMutation,
    useWalletTansferMutation,
    useLazyGetcurrencyQuery,
    useLazyWithdrawcodeQuery,
    useLazyPriceconversionQuery,
    useWithdrawfiatMutation,
    useTransactionhistoryMutation,
    useGetpassbookMutation,
    useSetdefaultbankMutation
} = walletApi;