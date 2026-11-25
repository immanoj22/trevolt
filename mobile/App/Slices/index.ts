import { combineReducers } from 'redux';
import { configureStore } from '@reduxjs/toolkit';

import helperReducer from './helper'
import authReducer, { authApi } from './auth';
import futureReducer, { futureApi } from './future';
import copyReducer, { copyTradeApi } from './copy';
import walletReducer, { walletApi } from './wallet';
import optionReducer, { optionTradeApi } from './option';
import cmsReducer, { cmsActionsApi } from './cmsActions';
import apikeyReducer, { apiKeyActionapi } from './apikey';
import affiliateReducer, { affiliateApi } from './affiliate';
import subAccountReducer, { subAccountApi } from './subAccount';
import feeReducer, { feeApi } from './feeSettings';

const appReducer = combineReducers({
  helper: helperReducer,
  auth: authReducer,
  wallet: walletReducer,
  subAccount: subAccountReducer,
  affiliate: affiliateReducer,
  future: futureReducer,
  apiAction: apikeyReducer,
  cmsAction: cmsReducer,
  copyTrade: copyReducer,
  optionTrade: optionReducer,
  fee: feeReducer,

  [authApi.reducerPath]: authApi.reducer,
  [walletApi.reducerPath]: walletApi.reducer,
  [subAccountApi.reducerPath]: subAccountApi.reducer,
  [affiliateApi.reducerPath]: affiliateApi.reducer,
  [futureApi.reducerPath]: futureApi.reducer,
  [apiKeyActionapi.reducerPath]: apiKeyActionapi.reducer,
  [cmsActionsApi.reducerPath]: cmsActionsApi.reducer,
  [copyTradeApi.reducerPath]: copyTradeApi.reducer,
  [optionTradeApi.reducerPath]: optionTradeApi.reducer,
  [feeApi.reducerPath]: feeApi.reducer

});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: any) => {
  if (action.type === 'RESET_STATE') {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, walletApi.middleware, subAccountApi.middleware, affiliateApi.middleware, futureApi.middleware, apiKeyActionapi.middleware, cmsActionsApi.middleware, copyTradeApi.middleware, optionTradeApi.middleware, feeApi.middleware),
});

export const logoutAction = () => ({ type: 'RESET_STATE' });