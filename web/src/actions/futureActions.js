import isEmpty from 'is-empty';
import axios, { Axios, axiosDecrypt } from '../config/axios';

import config from '../config/env';
import { generateIdempotencyKey } from '../lib/idempotencyKey';

/** Redux */
import { FuturePairData } from '../redux/futureAction';
import { UserRiskAndMarginDetails } from '../redux/action';

export const getFuturePairList = async (dispatch) => {
    try {
        let respData = await Axios({
            'url': `/future/get_pair_details`,
            'method': 'get'
        });
        // ── Temporary diagnostic log ────────────────────────────────────
        // Prints exactly what came back from /future/get_pair_details for
        // whichever backend this build's VITE_API_URL points at, plus the
        // pair count before/after the active-only filter below — so it's
        // visible at a glance in the browser console whether the Coming
        // Soon page is showing because the API returned zero pairs, zero
        // *active* pairs, or didn't return successfully at all. Safe to
        // remove once this environment's data is confirmed sorted out.
        // Dispatch unconditionally (even with an empty list) so
        // `futurePairDataLoaded` flips to true once this call resolves.
        // Previously this only fired when pairs existed, so a fresh
        // instance with zero active futures pairs left futurePairData
        // stuck at its initial `[]` forever — indistinguishable from
        // "still loading" — and the Futures page had no way to tell it
        // should show Coming Soon instead of the trading UI.
        let ActivePairlist = !isEmpty(respData?.data?.result?.data)
            ? respData.data.result.data.filter((val) => { return val.status == 'active' })
            : []
        dispatch(FuturePairData({ pairData: ActivePairlist }))
        if (!isEmpty(ActivePairlist)) {
            let riskAndMarginDetails = ActivePairlist.reduce((acc, pos) => {
                if (isEmpty(acc[`${pos.baseCurrency}`])) {
                    acc[`${pos.baseCurrency}`] = {
                        maintenanceMargin: 0,
                        initialMargin: 0
                    }
                }
                return acc;
            }, {});
            dispatch(UserRiskAndMarginDetails({ riskAndMarginDetails: riskAndMarginDetails }))
        }
        return { status: true, data: respData.data.data }
    } catch (e) {
        // ── Temporary diagnostic log ────────────────────────────────────
        // Spells out API_URL/SOCKET_URL and the actual error whenever this
        // call fails outright (network refused, CORS block, timeout,
        // etc.) — that failure path dispatches an empty pair list too, so
        // from the Futures page alone it's indistinguishable from "backend
        // reached, zero active pairs". This makes the real cause visible
        // in the console immediately. Safe to remove once resolved.
        console.log("[DEBUG] getFuturePairList FAILED — API_URL:", config.API_URL);
        console.log("[DEBUG] getFuturePairList FAILED — reason:", e?.message || e);
        console.log("getFuturePairList_err", e);
        // Still mark the list as "loaded" (empty) on failure — otherwise a
        // network/API error leaves futurePairDataLoaded stuck at false and
        // the Futures page's loading state spins forever instead of
        // falling back to Coming Soon.
        dispatch(FuturePairData({ pairData: [] }))
        return { status: false, error: e?.response?.data?.errors }
    }
}

export const futureAvailableMargin = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/availableMargin`,
            'method': 'post',
            data,
            secretKey: key
        });
        return { status: true, message: respData.data.message, data: respData?.data?.result }
    } catch (e) {
        console.log("futureAvailableMargin_data", e);
        return { status: false, error: e.response.data.errors }
    }
}

export const futureOrderPlacing = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/order_placing`,
            'method': 'post',
            data,
            secretKey: key,
            // SECURITY FIX (VAPT: "API Replay Attack" #140 / "Duplicate
            // Transaction Submission" #189) — fresh key per submit so a
            // double-click/timeout-retry can't place the same order twice.
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureOrderPlacing_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

/**
 * Backs the chart's "+" quick-order context menu → "Add Alert (Push
 * Notification) at <price>" custom action (see BrokerAdapter.js
 * chartContextMenuActions). Creates a server-side price alert that fires a
 * push/inbox notification the moment the market crosses `targetPrice`,
 * checked on every real-time price tick (Modules/Binance/Hook/BinanceWs.js
 * → futureController.triggerPriceAlerts).
 */
export const futureCreatePriceAlert = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/price_alert`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
        }
    } catch (e) {
        console.log("futureCreatePriceAlert_err", e);
        return {
            status: false,
            message: e?.response?.data?.message || 'Failed to create alert',
            error: e?.response?.data?.error,
        }
    }
}

export const futureCancelOrder = async (orderId, key) => {
    try {
        let respData = await Axios({
            'url': `/future/cancelOrder/${orderId}`,
            'method': 'get',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result
        }
    } catch (e) {
        console.log("futureOrderPlacing_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureOpenOrders = async (pairId, data, key, tradeMode) => {
    try {
        let respData = await Axios({
            'url': `/future/openOrder/${pairId}/${tradeMode}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            record: respData.data.result.data,
            count: respData.data.result.count,
            currentPage: respData.data.result.currentPage,
            nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futureOpenOrders_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futurePositionOrders = async (params, data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/positionOrders/${params.pairId}/${params.tradeMode}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            record: respData.data.result.data,
            count: respData.data.result.count,
            currentPage: respData.data.result.currentPage,
            nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futurePositionOrders_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
            error: e?.response?.data?.error
        }
    }
}

export const futureOrderBook = async (pairId, data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/orderBook/${pairId}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            result: respData.data.result
        }
    } catch (e) {
        console.log("futureOrderBook_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureSingleOrderBook = async (pairId, type, data, key = '') => {
    try {
        let respData = await Axios({
            'url': `/future/single_order_book/${pairId}/${type}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            result: respData.data.result
        }
    } catch (e) {
        console.log("futureOrderBook_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureRecentTrade = async (pairId) => {
    try {
        let respData = await Axios({
            'url': `/future/recentTrade/${pairId}`,
            'method': 'get',
        });
        return {
            status: respData.data.success,
            result: respData.data.result,
            // count: respData.data.result.count,
            // currentPage: respData.data.result.currentPage,
            // nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futureRecentTrade_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureStopOrders = async (pairId, data, key, tradeMode) => {
    try {
        let respData = await Axios({
            'url': `/future/stopOrders/${pairId}/${tradeMode}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            record: respData.data.result.data,
            count: respData.data.result.count,
            currentPage: respData.data.result.currentPage,
            nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futurestopOrders_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}


export const futureOrderHistory = async (pairId, data, key, tradeMode) => {
    try {
        let respData = await Axios({
            'url': `/future/orderHistory/${pairId}/${tradeMode}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            record: respData.data.result.data,
            count: respData.data.result.count,
            currentPage: respData.data.result.currentPage,
            nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futureOrderHistory_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}


export const futureFilledHistory = async (pairId, data, key, tradeMode) => {
    try {
        let respData = await Axios({
            'url': `/future/filledHistory/${pairId}/${tradeMode}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            record: respData.data.result.data,
            count: respData.data.result.count,
            currentPage: respData.data.result.currentPage,
            nextPage: respData.data.result.nextPage
        }
    } catch (e) {
        console.log("futureFilledHistory_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureClosedOrderHistory = async (pairId, data, key, tradeMode) => {
    try {
        let respData = await Axios({
            'url': `/future/closedOrders/${pairId}/${tradeMode}`,
            'method': 'get',
            'params': data,
            secretKey: key
        });
        return {
            status: respData?.data?.success,
            record: respData?.data?.result.data,
            count: respData?.data?.result?.count,
            currentPage: respData?.data?.result?.currentPage,
            nextPage: respData?.data?.result?.nextPage
        }
    } catch (e) {
        console.log("futureClosedOrderHistory_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureClosePosition = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/closePosition`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result
        }
    } catch (e) {
        console.log("futureOrderPlacing_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}


export const futureChangeTrademode = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/changeTradeMode`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
        }
    } catch (e) {
        console.log("futureChangeTrademode_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}


export const futureCancelAllOrder = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/cancelAllOrder`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
        }
    } catch (e) {
        console.log("futureChangeTrademode_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}


export const futureCloseAllOrder = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/closeAllPosition`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
        }
    } catch (e) {
        console.log("futureChangeTrademode_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureUpdateBracketOrders = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/updateBracketOrders`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureUpdateBracketOrders_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureupdateOrders = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/updateOrders`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureupdateOrders_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureAddFavouritePair = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/addFavouritePair`,
            'method': 'post',
            'data': data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message
        }
    } catch (e) {
        console.log("futureClosedOrderHistory_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureUpdateOrders = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/updateOrders`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message
        }
    } catch (e) {
        console.log("futureUpdateOrders_err", e);
        return {
            status: e?.response?.data?.success ?? false,
            message: e?.response?.data?.message ?? "Something went wrong",
            error: e?.response?.data?.error
        }
    }
}

export const futureOpenOrdersBracket = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/addEditOpenOrdersBracketOrder`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureOpenOrdersBracket_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureChangeLeverage = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/changeLeverage`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureChangeLeverage_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futurePandLChart = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/pandl_analysis_chart`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futurePandLChart_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futurePandLSummary = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/pandl_analysis_summary`,
            'method': 'post',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futurePandLSummary_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}


export const RemoveBracketOrders = async (orderId, key) => {
    try {
        let respData = await Axios({
            'url': `/future/remove_bracket_orders/${orderId}`,
            'method': 'get',
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            result: respData.data.result
        }
    } catch (e) {
        console.log("fRemoveBracketOrders_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureCancelBracketOrders = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/updateBracketOrders`,
            'method': 'delete',
            data,
            secretKey: key
        });
        return {
            status: respData.data.success,
            message: respData.data.message,
            error: respData.data.errors
        }
    } catch (e) {
        console.log("futureUpdateBracketOrders_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const futureOgGenerateUpdate = async (data) => {
    try {
        let response = await axios.post(`${config.API_URL}/future/og_generate_update`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        let respData = axiosDecrypt(response);
        return {
            status: respData?.success,
            result: respData?.result?.data,
            message: respData?.message
        }
    } catch (e) {
        console.log("futureOgGenerateUpdate_err", e);
        return {
            status: e.response.data.success,
            message: e.response.data.message,
            error: e.response.data.error
        }
    }
}

export const fetchStressPoints = async (underlying) => {
    try {
        let response = await Axios({
            'url': `/future/stress_pcts/${underlying}`,
            'method': 'get'
        });
        return {
            status: response?.data?.success,
            result: response?.data?.result,
            message: response?.data?.message
        }
    } catch (e) {
        console.log("fetchStressPoints_respData_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
        }
    }
}

export const getPNLChartOverview = async (data, key) => {
    try {
        let response = await Axios({
            'url': `/future/pandl_chart_overview`,
            'method': 'get',
            params: data,
            secretKey: key
        });
        return {
            status: response?.data?.success,
            result: response?.data?.result,
            message: response?.data?.message
        }
    } catch (e) {
        console.log("getPNLChartOverview_respData_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
        }
    }
}

export const getPNLOverview = async (key) => {
    try {
        let response = await Axios({
            'url': `/future/pandl_overview`,
            'method': 'get',
            secretKey: key
        });
        return {
            status: response?.data?.success,
            result: response?.data?.result,
            message: response?.data?.message
        }
    } catch (e) {
        console.log("getPNLOverview_respData_err", e);
        return {
            status: e?.response?.data?.success,
            message: e?.response?.data?.message,
        }
    }
}

export const futureAccountAvailableMargin = async (data, key) => {
    try {
        let respData = await Axios({
            'url': `/future/accountAvailableMargin`,
            'method': 'post',
            data,
            secretKey: key
        });
        return { status: true, message: respData.data.message, data: respData?.data?.result }
    } catch (e) {
        console.log("futureAccountAvailableMargin__err", e);
        return { status: false, error: e.response.data.errors }
    }
}