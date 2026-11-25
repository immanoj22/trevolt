import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name: 'user',

    initialState: {
        isAuthStatus: false,
        accessToken: "",
        userdetails: {},
        beforelogin: 'light',
        institutionalDetails: {},
        affiliateDetails: {},
        leverage: 1,
        wallet: {
            walletBalance: 0,
            availableBalance: 0,
            freezeBalance: 0,
            totalMargin: 0,
            totalMaintainMargin: 0,
            unRealizedPnL: 0
        },
        subAccountList: [],
        positionDetails: [],
        openOrderDetails: [],
        riskAndMarginDetails: {}
    },

    reducers: {
        IsAuth: (state, action) => {
            state.isAuthStatus = action.payload.isAuth
        },
        AccessToken: (state, action) => {
            state.accessToken = action.payload.accessToken
        },
        UserDetails: (state, action) => {
            // console.log("useselec after login userTheme_det_2",action.payload.userdetails)
            state.userdetails = action.payload.userdetails
        },
        BeforeLogin: (state, action) => {
            // console.log("useselec after login userTheme_det_2",action.payload.userdetails)
            state.beforelogin = action.payload.beforelogin
        },
        InstitutionalDetails: (state, action) => {
            state.institutionalDetails = action.payload.institutionalDetails
        },
        AffliateDetails: (state, action) => {
            state.affiliateDetails = action.payload.affiliateDetails
        },
        UserLeverage: (state, action) => {
            state.leverage = action.payload.leverage
        },
        UserBalance: (state, action) => {
            state.wallet = action.payload.wallet
        },
        UserSubAccountList: (state, action) => {
            state.subAccountList = action.payload.subAccountList
        },
        UserPositionDetails: (state, action) => {
            state.positionDetails = action.payload.positionDetails
        },
        UserOpenOrderDetails: (state, action) => {
            state.openOrderDetails = action.payload.openOrderDetails
        },
        UserRiskAndMarginDetails: (state, action) => {
            state.riskAndMarginDetails = action.payload.riskAndMarginDetails
        },
    }
});


export const { IsAuth, AccessToken, UserDetails, InstitutionalDetails, AffliateDetails, BeforeLogin, UserLeverage, UserBalance, UserSubAccountList, UserPositionDetails, UserOpenOrderDetails, UserRiskAndMarginDetails } = userSlice.actions;

export default userSlice.reducer;