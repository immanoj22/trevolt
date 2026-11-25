import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { apiKeyActionState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";

export const initialState: apiKeyActionState = {
    isloading: false,
    apiList: []
}

const apiKeyAction = createSlice({
    name: 'apiKeyAction',
    initialState,
    reducers: {
        setApiList: (state, action: PayloadAction<any>) => {
            state.apiList = action.payload;
        },
    },
});

export const { setApiList } = apiKeyAction.actions;

export default apiKeyAction.reducer;
export const subAccountSelector = (state: { subAccount: apiKeyActionState }) => state.subAccount;

export const apiKeyActionapi = createApi({
    reducerPath: 'apiKeyActionapi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({

        createApiKey: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.createApi}`,
                method: 'POST',
                body: payload
            }),
        }),

        edithApiKey: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.editApi}`,
                method: 'POST',
                body: payload
            }),
        }),

        getApiKey: builder.query({
            query() {
                return {
                    url: `${ENDPOINTS.getApi}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        deleteApiKey: builder.mutation({
            query: (params) => ({
                url: `${ENDPOINTS.deleteApi}/${params}`,
                method: 'delete'
            }),
        }),

        createWebhook: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.createWebhook}`,
                method: 'POST',
                body: payload
            }),
        }),



    })
})

export const {
    useCreateApiKeyMutation,
    useEdithApiKeyMutation,
    useLazyGetApiKeyQuery,
    useDeleteApiKeyMutation,
    useCreateWebhookMutation,
} = apiKeyActionapi;