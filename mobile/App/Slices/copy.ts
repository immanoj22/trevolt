import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from '@reduxjs/toolkit/query/react';

import { copyActionState } from "./type";
import { ENDPOINTS } from "../Actions/Constant/constant";
import { encryptedBaseQuery } from "../Actions/Constant/encryption";

export const initialState: copyActionState = {
    isloading: false,
    myStrategy: {},
    allStrategy: {}
}

const copyTrade = createSlice({
    name: 'copyTrade',
    initialState,
    reducers: {
        setMyStrategy: (state, action: PayloadAction<any>) => {
            state.myStrategy = action.payload;
        },
        setAllStrategy: (state, action: PayloadAction<any>) => {
            state.allStrategy = action.payload;
        },
    },
});

export const { setMyStrategy, setAllStrategy } = copyTrade.actions;

export default copyTrade.reducer;
export const copyTradeSelector = (state: { copyTrade: copyActionState }) => state.copyTrade;

export const copyTradeApi = createApi({
    reducerPath: 'copyTradeapi',
    baseQuery: encryptedBaseQuery,
    endpoints: (builder) => ({

        requestTrader: builder.mutation({
            // Migrated off multipart: profileImage now goes as a base64 envelope in a
            // plain JSON body (backend copy/requestTrader has decodeBase64Files(['profileImage'])
            // and NO decryptRequest). Response is encrypted with the constant primary
            // key (RequestTrader controller calls sendResponse() with no key), hence
            // jsonPrimary. Caller builds via toBase64UploadBody().
            query: (payload) => {
                return {
                    url: `${ENDPOINTS.copyRequest}`,
                    method: 'POST',
                    body: payload,
                    meta: {
                        isjson: true,
                        jsonPrimary: true,
                    },
                }
            },
        }),

        mystrategyDetails: builder.query({
            query() {
                return {
                    url: `${ENDPOINTS.mystrategyDetails}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        getAllStrategy: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.getAllStrategy}`,
                method: 'POST',
                body: payload,
                meta: {
                    isprimary: true
                }
            }),
        }),

        editStartegy: builder.mutation({
            // Migrated off multipart: profileImage now goes as a base64 envelope in a
            // plain JSON body (backend copy/editStartegy has decodeBase64Files(['profileImage'])
            // and NO decryptRequest). Response is secretkey-encrypted (EditStartegy
            // controller passes req.user.secretKey to sendResponse). Caller builds via
            // toBase64UploadBody() and only includes profileImage when a new one was picked.
            query: (payload) => {
                return {
                    url: `${ENDPOINTS.editStartegy}`,
                    method: 'POST',
                    body: payload,
                    meta: {
                        isjson: true
                    },
                }
            },
        }),

        strategyDetails: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.strategyDetails}/${params}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        requestCopier: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.requestCopier}`,
                method: 'POST',
                body: payload,
            }),
        }),

        getCopier: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.getCopier}?page=${params.page}&limit=${params.limit}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        getCopierDetails: builder.mutation({
            query: (payload) => ({
                url: `${ENDPOINTS.getCopierDetails}`,
                method: 'POST',
                body: payload,

            }),
        }),

        setViewers: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.setViewers}/${params}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        editCopier: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.editCopier,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        addFav: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.addFav,
                    body: payload,
                    method: 'POST',
                }
            },
        }),

        inactiveStardegy: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.inactiveStardegy,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        copyOpenOrder: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.copyOpenOrder,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        copyOrderHistory: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.copyOrderHistory,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        copyCloseOrders: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.copyCloseOrders,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        copyFillHistory: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.copyFills,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        getCopyTradeAssets: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.getCopyTradeAssets}?stradegyId=${params.id}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        commissionHistory: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.commissionHistory}?startDate=${params.startDate}&endDate=${params.endDate}&search=${params.search}&coin=${params.coin}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        getFollowersDetails: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.getFollowersDetails}?strategyId=${params.id}&search=${params.search}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),


        updateStrategy: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.updateStrategy,
                    body: payload,
                    method: 'POST'
                }
            },
        }),

        investmentChart: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.investmentChart,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isprimary: true
                    }
                }
            },
        }),

        profitandLossChart: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.profitandLossChart,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isprimary: true
                    }
                }
            },
        }),

        volumeBreakDown: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.volumeBreakDown,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isprimary: true
                    }
                }
            },
        }),

        performanceDetails: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.performanceDetails,
                    body: payload,
                    method: 'POST',
                    meta: {
                        isprimary: true
                    }
                }
            },
        }),

        copyStopOrders: builder.mutation({
            query(payload) {
                return {
                    url: ENDPOINTS.copyStopOrders,
                    body: payload,
                    method: 'POST'
                }
            },
        }),


        getCopierStats: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.getCopierStats}/${params}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

        getfuturePositionOrders: builder.query({
            query(params) {
                return {
                    url: `${ENDPOINTS.positionOrdersCopy}/${params.pairId}/${params.tradeMode}?traderId=${params.traderId ?? ""}&traderAccountId=${params.traderAccountId ?? ""}`,
                    method: 'GET',
                    meta: {
                        isget: true
                    }
                }
            },
        }),

    })
})

export const {
    useRequestTraderMutation,
    useLazyMystrategyDetailsQuery,
    useGetAllStrategyMutation,
    useEditStartegyMutation,
    useLazyStrategyDetailsQuery,
    useRequestCopierMutation,
    useLazyGetCopierQuery,
    useGetCopierDetailsMutation,
    useLazySetViewersQuery,
    useEditCopierMutation,
    useAddFavMutation,
    useInactiveStardegyMutation,
    useCopyOpenOrderMutation,
    useCopyCloseOrdersMutation,
    useCopyOrderHistoryMutation,
    useLazyGetCopyTradeAssetsQuery,
    useLazyCommissionHistoryQuery,
    useLazyGetFollowersDetailsQuery,
    useUpdateStrategyMutation,
    useInvestmentChartMutation,
    useProfitandLossChartMutation,
    useVolumeBreakDownMutation,
    useLazyGetCopierStatsQuery,
    usePerformanceDetailsMutation,
    useLazyGetfuturePositionOrdersQuery,
    useCopyStopOrdersMutation,
    useCopyFillHistoryMutation
} = copyTradeApi;