import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { feeState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";

export const initialState: feeState = {
    isloading: false,
    feeSettingsList: []
}

const fee = createSlice({
    name: 'fee',
    initialState,
    reducers: {
        FeeSettingsList: (state, action: PayloadAction<any>) => {
            console.log(action.payload, "feeSettingSlice__feeSettings")
            state.feeSettingsList = action.payload
        }

    },
});

export const { FeeSettingsList } = fee.actions;

export default fee.reducer;

export const feeSelector = (state: { fee: feeState }) => state.fee;

export const feeApi = createApi({
    reducerPath: 'feeApi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({
        feeSettingList: builder.query({
            query: () => ({
                url: `${ENDPOINTS.feeSettings}`,
                method: 'GET',
                meta: {
                    isget: true
                }
            }),
        })
    })
})


export const {
    useLazyFeeSettingListQuery
} = feeApi;