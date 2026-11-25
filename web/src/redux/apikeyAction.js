/** Packages */
import { createSlice } from "@reduxjs/toolkit";

export const apikeySlice = createSlice({

    name: 'apikey',

    initialState: {
        apiKeyList: [],
        hideSecret: true,
    },

    reducers: {
        ApiKeyList: (state, action) => {
            state.apiKeyList = action.payload.apikeys
        },
        HideSecret: (state, action) => {
            state.hideSecret = !state.hideSecret
        },
    }
});


export const { ApiKeyList,HideSecret } = apikeySlice.actions;

export default apikeySlice.reducer;