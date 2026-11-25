import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { futureState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";
import { generateIdempotencyKey } from "../Utilities/idempotencyKey";

export const initialState: futureState = {
    isloading: false,
    futurePairData: [],
    futurePairDataLoaded: false,
    livePrices: {},
    futureTradePair: [],
    futureTicker: [],
    positionDetails: [],
    cancelOrdersList: [],
    cancelType: '',
    pairsList: [],
    openOrderDetails: [],
    underlyingStress: {},
    riskAndMarginDetails: {},
    makerFee: 0,
    takerFee: 0,
    liquiFee: 0
}

const future = createSlice({
    name: 'future',
    initialState,
    reducers: {
        setFuturePairData: (state, action: PayloadAction<any>) => {
            state.futurePairData = action.payload ?? [];
            // Unconditional (even on an empty/failed response) so this flips exactly
            // once the pair-list call has actually resolved - see futurePairDataLoaded.
            state.futurePairDataLoaded = true;
        },
        // Merge a batch of per-ticker price patches: { BTCUSDT: {marketPrice,...}, ... }.
        // Only the tickers present in the payload get a new reference, so a row that
        // does useSelector(s => s.future.livePrices[myTicker]) re-renders only when
        // its own pair moved - not the whole list.
        // `_dir` is the tick direction of marketPrice ('up' | 'down' | ''), so rows
        // can flash the price green/red on each move.
        setLivePrices: (state, action: PayloadAction<Record<string, any>>) => {
            const updates = action.payload || {};
            if (!state.livePrices) state.livePrices = {};
            for (const ticker in updates) {
                const prev = state.livePrices[ticker] || {};
                const patch = updates[ticker] || {};
                const nextPrice = Number(patch.marketPrice);
                const prevPrice = Number(prev.marketPrice);
                let dir = prev._dir || '';
                if (Number.isFinite(nextPrice) && Number.isFinite(prevPrice) && nextPrice !== prevPrice) {
                    dir = nextPrice > prevPrice ? 'up' : 'down';
                }
                state.livePrices[ticker] = { ...prev, ...patch, _dir: dir };
            }
        },
        setFutureTicker: (state, action: PayloadAction<any>) => {
            const next = action.payload;
            if (!next || Array.isArray(next)) {
                state.futureTicker = next ?? [];
                return;
            }
            const prev = state.futureTicker;
            const sameTicker = prev && !Array.isArray(prev) && next.tickerRoot && next.tickerRoot === prev.tickerRoot;
            // `_dir` = tick direction of the open pair's marketPrice, so the trade
            // screen can flash the price green/red. Reset it on a pair switch.
            let dir = '';
            if (sameTicker) {
                const np = Number(next.marketPrice);
                const pp = Number(prev.marketPrice);
                dir = Number.isFinite(np) && Number.isFinite(pp) && np !== pp
                    ? (np > pp ? 'up' : 'down')
                    : (prev._dir || '');
            }
            // Merge on same pair (a tick payload may omit fields the pair-load set);
            // full replace on a pair switch.
            state.futureTicker = sameTicker ? { ...prev, ...next, _dir: dir } : { ...next, _dir: dir };
        },
        setTradePairData: (state, action: PayloadAction<any>) => {
            state.futureTradePair = action.payload ?? [];
        },
        setPositionOrders: (state, action: PayloadAction<any>) => {
            state.positionDetails = action.payload ?? [];
        },
        setCancelOrders: (state, action: PayloadAction<any>) => {
            state.cancelOrdersList = action.payload.cancelOrdersList;
            state.cancelType = action.payload.cancelType;
        },
        setPairsList: (state, action: PayloadAction<any>) => {
            state.pairsList = action.payload.pairsList;
        },
        setOpenOrders: (state, action: PayloadAction<any>) => {
            state.openOrderDetails = action.payload ?? [];
        },
        UnderlyingStress: (state, action: PayloadAction<any>) => {
            state.underlyingStress = action.payload
        },
        UserRiskAndMarginDetails: (state, action: PayloadAction<any>) => {
            state.riskAndMarginDetails = action.payload
        },
        MakerFee: (state, action: PayloadAction<any>) => { // store the maker fee for the currenct selecting pair
            state.makerFee = action.payload?.makerFee
        },
        TakerFee: (state, action: PayloadAction<any>) => {// store the taker fee for the currenct selecting pair
            state.takerFee = action.payload?.takerFee
        },
        LiquiFee: (state, action: PayloadAction<any>) => {// store the Liquidation fee for the currenct selecting pair
            state.liquiFee = action.payload
        },

    },
});

export const { setFuturePairData, setLivePrices, setFutureTicker, setTradePairData, setPositionOrders, setCancelOrders, setPairsList, setOpenOrders, UnderlyingStress, UserRiskAndMarginDetails, MakerFee, TakerFee, LiquiFee } = future.actions;

export default future.reducer;

export const futureSelector = (state: { future: futureState }) => state.future;

export const futureApi = createApi({
    reducerPath: 'futureApi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({
        pairDetails: builder.query({
            query: () => ({
                url: `${ENDPOINTS.pairDetails}`,
                method: 'GET',
                meta: {
                    isget: true
                }
            }),
        }),

        availableMargin: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.availableMargin}`,
                method: 'POST',
                body: payload
            }),
        }),

        positionOrders: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.positionOrders}/${params.pairId}/${params.tradeMode}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        addFavouritePair: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.addFavouritePair}`,
                method: 'POST',
                body: payload
            }),
        }),

        futureOrderBook: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.orderBook}/${params.id}?buyPage=${params.buyPage}&sellPage=${params.sellPage}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        futureSingleOrderBook: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.singleOrderBook}/${params.id}/${params.type}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        futureRecentTrade: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.recentTrade}/${params}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        futurefilledHistory: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.filledHistory}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        futureOrderHistory: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.orderHistory}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        futureCloseOrder: builder.query({
            query(params) {
                console.log(`${ENDPOINTS.futureClosedOrders}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`, "close")
                return {
                    url: `${ENDPOINTS.futureClosedOrders}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        closeHistory: builder.query({
            query: (params) => ({
                url: `${ENDPOINTS.futureClosedOrders}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`,
                method: 'GET',
                meta: {
                    isgetsecondary: true
                }
            }),
        }),


        futureOpenOrders: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.futureOpenOrders}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        stopOrders: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.stopOrders}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        updateBracket: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.updateBracket}`,
                method: 'POST',
                body: payload
            }),
        }),

        deleteBracket: builder.mutation({
            query: (data) => ({
                url: `${ENDPOINTS.updateBracket}`,
                method: 'DELETE',
                body: data
            }),
        }),

        futureOrderPlacing: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.orderPlaceing,
                    body: payload,
                    method: 'POST',
                    // Backend requires a fresh, unique Idempotency-Key per submit on
                    // this route (replay-attack remediation - see backend
                    // Middleware/Security/idempotencyKey.js + futureRouter.js). Without
                    // it the request is rejected with a plain (unencrypted) 400 before
                    // the order controller runs, which encryptedBaseQuery can't decrypt
                    // and surfaces as a generic "Something went wrong. Please try
                    // again." toast. Mirrors web's futureActions.js futureOrderPlacing().
                    // query() re-runs on every trigger, so this is a new key per submit.
                    headers: { 'Idempotency-Key': generateIdempotencyKey() },
                }
            },
        }),


        futureLeverage: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.leverage,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        futureCloseOrders: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.futureClose,
                    body: payload,
                    method: 'POST'
                }
            }
        }),

        removeBracket: builder.query({
            query(orderId) {
                return {
                    url: `${ENDPOINTS.removeBracket}/${orderId}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        cancelBracket: builder.query({
            query(orderId) {
                return {
                    url: `${ENDPOINTS.cancelOrder}/${orderId}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        editOpenOrders: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.editOpenOrder}`,
                method: 'POST',
                body: payload
            }),
        }),

        cancelAllOrders: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.cancelAllOrders}`,
                method: 'POST',
                body: payload
            }),
        }),

        closeAllOrders: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.closeAllPosition}`,
                method: 'POST',
                body: payload
            }),
        }),

        updateOrders: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.updateOrders}`,
                method: 'POST',
                body: payload
            }),
        }),

        ogGenerateUpdat: builder.mutation({
            // Plain JSON body (backend's ogGenerateUpdate reads buffData etc.
            // straight off req.body, no decryptRequest/multipart on this route),
            // primary-key-encrypted response (controller's sendResponse call
            // passes no secretKey). Previously sent as multipart FormData with a
            // manually forced Content-Type: multipart/form-data and no boundary,
            // which the server's multipart parser couldn't read.
            query: (payload) => {
                return {
                    url: `${ENDPOINTS.ogGenerate}`,
                    method: 'POST',
                    body: payload,
                    meta: {
                        isjson: true,
                        jsonPrimary: true,
                    },
                }
            },
        }),

        filledHistory: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.filledHistory}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}&startDate=${params.startDate}&endDate=${params.endDate}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        orderHistory: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.orderHistory}/${params.pairId}/${params.tradeMode}?page=${params.page}&limit=${params.limit}&startDate=${params.startDate}&endDate=${params.endDate}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        futurePnlChart: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.pnlanalysischart,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        futurePnLSummary: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.pnlsummary,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        futurepnlOverview: builder.query({
            query() {
                return {
                    url: `${ENDPOINTS.pnlOverview}`,
                    method: 'GET',
                    meta: {
                        isgetsecondary: true
                    }
                }
            },
        }),

        stressPoints: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.stressPoints}/${params}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        updateTab: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.updateTab,
                    body: payload,
                    method: 'POST'
                }
            },
        }),
    })
})


export const {
    useLazyPairDetailsQuery,
    useAvailableMarginMutation,
    useLazyPositionOrdersQuery,
    useAddFavouritePairMutation,
    useLazyFutureOrderBookQuery,
    useLazyFutureSingleOrderBookQuery,
    useLazyFutureRecentTradeQuery,
    useLazyFuturefilledHistoryQuery,
    useLazyFutureOrderHistoryQuery,
    useUpdateBracketMutation,
    useDeleteBracketMutation,
    useFutureOrderPlacingMutation,
    useFutureLeverageMutation,
    useFutureCloseOrdersMutation,
    useLazyFutureCloseOrderQuery,
    useLazyFutureOpenOrdersQuery,
    useLazyRemoveBracketQuery,
    useLazyCancelBracketQuery,
    useEditOpenOrdersMutation,
    useLazyStopOrdersQuery,
    useCancelAllOrdersMutation,
    useCloseAllOrdersMutation,
    useUpdateOrdersMutation,
    useOgGenerateUpdatMutation,
    useLazyFilledHistoryQuery,
    useLazyOrderHistoryQuery,
    useFuturePnlChartMutation,
    useFuturePnLSummaryMutation,
    useLazyFuturepnlOverviewQuery,
    useLazyStressPointsQuery,
    // useCloseHistoryMutation,
    useLazyCloseHistoryQuery,
    useUpdateTabMutation
} = futureApi;