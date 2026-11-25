import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { optionActionState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";
import { generateIdempotencyKey } from "../Utilities/idempotencyKey";

export const initialState: optionActionState = {
    isloading: false,
    // No hardcoded default — this gets set once the underlying-asset list API response
    // comes back (see Option/index.tsx's auto-select-first-underlying effect), so it
    // always reflects whatever the backend actually has, not a baked-in symbol.
    options: "",
    pairlist: [],
    callslist: [],
    putslist: [],
    contracts: [],
    underlyingPrice: {},
    makerFee: 0,
    takerFee: 0,
    premiumPercentage: 0,
    strategyContracts: [],
    strategyMultiplier: 1,
}

let strategyLegIdCounter = 1;

const optionTrade = createSlice({
    name: 'optionTrade',
    initialState,
    reducers: {
        setOption: (state, action: PayloadAction<any>) => {
            state.options = action.payload;
        },
        setPairlist: (state, action: PayloadAction<any>) => {
            state.pairlist = action.payload ?? [];
        },
        setCallslist: (state, action: PayloadAction<any>) => {
            state.callslist = action.payload ?? [];
        },
        setPutslist: (state, action: PayloadAction<any>) => {
            state.putslist = action.payload ?? [];
        },
        setContract: (state, action: PayloadAction<any>) => {
            state.contracts = action.payload;
        },
        setUnderlyingPrice: (state: any, action: PayloadAction<any>) => {
            const { underlyingPrice, price } = action.payload;
            state[underlyingPrice] = price;
        },
        setOptionMakerFee: (state, action: PayloadAction<any>) => {
            state.makerFee = action.payload;
        },
        setOptionTakerFee: (state, action: PayloadAction<any>) => {
            state.takerFee = action.payload;
        },
        setOptionPremiumPercentage: (state, action: PayloadAction<any>) => {
            state.premiumPercentage = action.payload;
        },
        // Strategy Builder basket - a leg is one option (or, later, futures) contract with
        // buy/sell, quantity, entry price snapshot, greeks snapshot, etc. `qty` here is always
        // the canonical base quantity (multiplier=1); strategyMultiplier is applied on top at
        // display/calc/place-order time, same convention as web-frontend's StrategyBuilderContext.
        addStrategyContract: (state, action: PayloadAction<any>) => {
            state.strategyContracts.push({
                id: strategyLegIdCounter++,
                checked: true,
                marketOrLimit: true,
                limitPrice: "",
                qty: "0.001",
                qtyUnit: "BTC",
                ...action.payload,
            });
        },
        removeStrategyContract: (state, action: PayloadAction<number>) => {
            state.strategyContracts = state.strategyContracts.filter((c: any) => c.id !== action.payload);
        },
        toggleStrategyContractField: (state, action: PayloadAction<{ id: number; key: string }>) => {
            const { id, key } = action.payload;
            const leg = state.strategyContracts.find((c: any) => c.id === id);
            if (leg) leg[key] = !leg[key];
        },
        updateStrategyContractField: (state, action: PayloadAction<{ id: number; key: string; value: any }>) => {
            const { id, key, value } = action.payload;
            const leg = state.strategyContracts.find((c: any) => c.id === id);
            if (leg) leg[key] = value;
        },
        updateStrategyLeg: (state, action: PayloadAction<{ id: number; patch: any }>) => {
            const { id, patch } = action.payload;
            const index = state.strategyContracts.findIndex((c: any) => c.id === id);
            if (index !== -1) {
                state.strategyContracts[index] = { ...state.strategyContracts[index], ...patch };
            }
        },
        clearStrategyContracts: (state) => {
            state.strategyContracts = [];
        },
        setStrategyMultiplier: (state, action: PayloadAction<number>) => {
            state.strategyMultiplier = action.payload;
        },
    },
});

export const {
    setPairlist, setCallslist, setPutslist, setOption, setContract, setUnderlyingPrice,
    setOptionMakerFee, setOptionTakerFee, setOptionPremiumPercentage,
    addStrategyContract, removeStrategyContract, toggleStrategyContractField,
    updateStrategyContractField, updateStrategyLeg, clearStrategyContracts, setStrategyMultiplier,
} = optionTrade.actions;

export default optionTrade.reducer;
export const optionTradeSelector = (state: { optionTrade: optionActionState }) => state.optionTrade;

export const optionTradeApi = createApi({
    reducerPath: 'optionTradeapi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({

        getAllContract: builder.query({
            query() {
                return {
                    url: `${ENDPOINTS.getAllContracts}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),
        getContracts: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.getContracts}?underlyingAsset=${params.token}&expiryDateStr=${params.expiry}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        optionPlace: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.optionPlacing}`,
                method: 'POST',
                body: payload,
                // Backend requires a fresh, unique Idempotency-Key per submit on this
                // route (replay-attack remediation - backend Middleware/Security/
                // idempotencyKey.js + optionRouter.js). Without it the request is
                // rejected with a plain (unencrypted) 400 before the controller runs,
                // which encryptedBaseQuery can't decrypt and surfaces as a generic
                // "Something went wrong. Please try again." toast. query() re-runs on
                // every trigger, so this is a new key per submit.
                headers: { 'Idempotency-Key': generateIdempotencyKey() },
            }),
        }),

        strategyBasketPlace: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.basketOrderPlacing}`,
                method: 'POST',
                body: payload,
                // See optionPlace above - option/basket_order_placing also enforces
                // requireIdempotencyKey server-side.
                headers: { 'Idempotency-Key': generateIdempotencyKey() },
            }),
        }),

    })
})

export const {
    useLazyGetAllContractQuery,
    useLazyGetContractsQuery,
    useOptionPlaceMutation,
    useStrategyBasketPlaceMutation,
} = optionTradeApi;