import { createSlice } from "@reduxjs/toolkit";

export const futureSlice = createSlice({

    name: 'future',

    initialState: {
        futurePairData: [],
        // Flips to true the first time the pair list API call resolves
        // (whether it returns pairs or not). Lets pages distinguish
        // "still loading" from "loaded, but there really are zero active
        // futures pairs yet" — both look like an empty futurePairData
        // array otherwise, which used to render the trading UI with
        // nothing in it (NaN prices, etc.) instead of a Coming Soon page.
        futurePairDataLoaded: false,
        futureTicker: {},
        futureTradePair: {},
        futurePairsList: [],
        futureCancelOrdersList: [],
        futureCancelType: '', // all || selectedOnly,
        underlyingStress: {},
        makerFee: 0,
        takerFee: 0,
        liquiFee: 0
    },

    reducers: {
        FuturePairData: (state, action) => {
            state.futurePairData = action.payload.pairData
            state.futurePairDataLoaded = true
        },
        FutureTicker: (state, action) => {
            state.futureTicker = action.payload.tikerData
        },
        FutureTradePair: (state, action) => {
            state.futureTradePair = action.payload.tradePair
        },
        FutureCancelOrders: (state, action) => {
            state.futureCancelOrdersList = action.payload.cancelOrdersList
            state.futureCancelType = action.payload.cancelType
        },
        FuturePairsList: (state, action) => {
            state.futurePairsList = action.payload.pairsList
            state.futureCloseType = action.payload.closeType
        },
        UnderlyingStress: (state, action) => {
            state.underlyingStress = action.payload.underlyingStress
        },
        MakerFee: (state, action) => { // store the maker fee for the currenct selecting pair
            state.makerFee = action.payload.makerFee
        },
        TakerFee: (state, action) => {// store the taker fee for the currenct selecting pair
            state.takerFee = action.payload.takerFee
        },
        LiquiFee: (state, action) => {// store the Liquidation fee for the currenct selecting pair
            state.liquiFee = action.payload.liquiFee
        },
    }
});


export const { FuturePairData, FutureTicker, FutureTradePair, FutureCancelOrders, FuturePairsList, UnderlyingStress, TakerFee, MakerFee, LiquiFee } = futureSlice.actions;

export default futureSlice.reducer;