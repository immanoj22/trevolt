import { createSlice } from "@reduxjs/toolkit";

export const currencySlice = createSlice({

    name: 'currency',

    initialState: {
        priceConversionList: [],
    },

    reducers: {
        PriceConversionList: (state, action) => {
            state.priceConversionList = action.payload.priceConversionList
        }
    }
});


export const { PriceConversionList } = currencySlice.actions;

export default currencySlice.reducer;