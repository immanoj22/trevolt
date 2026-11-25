import { createSlice } from "@reduxjs/toolkit";

export const optionSlice = createSlice({

    name: 'option',

    initialState: {
        underlyingDetails: [],
        underlyingData: {},
        optionTradePair: {},
        optionTicker: {},
        optionsData: [],
        optionContractData: [],
        makerFee: 0,
        takerFee: 0,
        premiumCap: 0
    },

    reducers: {
        // check and used  
        // (used to store the all underlying Asset details with options contract name)
        UnderlyingDetails: (state, action) => {
            state.underlyingDetails = action.payload.underlyingDetails
        },
        // check and used  
        // store the selected underlying data in the redux
        UnderlyingData: (state, action) => {
            state.underlyingData = action.payload.underlyingData
        },
        // check and used  
        // (used to store the options contract name for selected underlying Asset)
        Options: (state, action) => {
            state.optionsData = action.payload.optionsData
        },
        // check and used  
        // (used to store the selected expryStr option contract details)
        OptionContractDetail: (state, action) => {
            state.optionContractData = action.payload.optionContractData
        },
        OptionTicker: (state, action) => {
            state.optionTicker = action.payload.tikerData
        },
        OptionTradePair: (state, action) => {
            state.optionTradePair = action.payload.tradePair
        },
        MakerFee: (state, action) => {
            state.makerFee = action.payload.makerFee
        },
        TakerFee: (state, action) => {
            state.takerFee = action.payload.takerFee
        },
        PremiumCap: (state, action) => {
            state.premiumCap = action.payload.takerFee
        },
    }
});


export const {
    OptionTicker,
    OptionTradePair,
    UnderlyingDetails,
    Options,
    OptionContractDetail,
    UnderlyingData,
    MakerFee,
    TakerFee,
    PremiumCap
} = optionSlice.actions;

export default optionSlice.reducer;