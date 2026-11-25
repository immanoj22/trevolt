import { createSlice } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { ENDPOINTS } from "../Actions/Constant/constant";
import { cmsActionsState } from "./type";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";

export const initialState: cmsActionsState = {
    isloading: false,
}

const cmsActions = createSlice({
    name: 'cmsActions',
    initialState,
    reducers: {
    },
});

export const { } = cmsActions.actions;

export default cmsActions.reducer;
export const subAccountSelector = (state: { cmsActions: cmsActionsState }) => state.cmsActions;

export const cmsActionsApi = createApi({
    reducerPath: 'cmsActionsApi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({

        cmsAction: builder.query({
            query: (params) => {
                return {
                    url: `${ENDPOINTS.cmsPage}?pageName=${params}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),
    })
})

export const {
    useLazyCmsActionQuery,
} = cmsActionsApi;