import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: 'wallet',

    initialState: {
        assetdetail: [],
        showCurrency: "USD",
        secondaryCurrency: "USD"
    },

    reducers: {
        AssetDetail: (state, action) => {
            state.assetdetail = action.payload.assetData
        },
        ConversionDetail: (state, action) => {
            state.showCurrency = action.payload.showCurrency
            state.secondaryCurrency = action.payload.secondaryCurrency
        }
    }
});


export const { AssetDetail, ConversionDetail } = userSlice.actions;

export default userSlice.reducer;