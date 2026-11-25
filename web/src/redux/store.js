import { configureStore } from '@reduxjs/toolkit';

/** Reducer */
import userReducer from "./action";
import walletReducer from "./walletaction"
import futureReducer from "./futureAction";
import optionReducer from "./optionAction";
import currencyReducer from './currencyAction';
import apiKeyReducer from './apikeyAction';
import copyTradeReducer from "./copytradeAction"
import feeReducer from "./feeReduxAction"

export const store = configureStore({
    reducer: {
        user: userReducer,
        wallet: walletReducer,
        future: futureReducer,
        option: optionReducer,
        currency: currencyReducer,
        apikey: apiKeyReducer,
        copytrade: copyTradeReducer,
        fee: feeReducer
    }
});


export default store;