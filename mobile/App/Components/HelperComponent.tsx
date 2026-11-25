import React, { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AppState, AppStateStatus, InteractionManager, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';


import { authSelector, setAffiliateData, setIsAuth, setUserData, setUserLeverage } from "../Slices/auth";

import { store } from "../Slices";

import useCustomHooks, { useApihooks } from "../Actions/Hooks/customhook";
import { socketService } from "../Actions/Socket/socketManager";
import { SOCKETURL } from "../Actions/Constant/constant";
import { isEmpty } from "../Utilities/helerfunction";
import { setUserBalance, update_pricedetails } from "../Slices/wallet";
import { setSubaccounts } from "../Slices/subAccount";
import { setUnreadCount } from "../Slices/helper";
import { setLivePrices, setFutureTicker, setPositionOrders } from "../Slices/future";
import { setCallslist, setPutslist } from "../Slices/option";
import { getItem } from "../Actions/Storage/localstorage";
import { openOrdersAsposition } from "../Utilities/calculation";
import usePortfolioHook from "../Actions/Hooks/usePortfolioHook";
import { getPorfitCalculation } from "../Actions/Hooks/usePriceConversion";

// Two cadences, both scheduled by the socket handlers themselves (one-shot
// setTimeout, NOT a standalone setInterval - a background interval gets
// starved/coalesced while the JS thread is saturated at startup, exactly when
// the user sees "prices slow, then sync"):
//
//  - LIVE (fast): dispatch the per-ticker `livePrices` map. Cheap and targeted -
//    only the market-list rows whose pair moved re-render. This is what makes the
//    list feel live.
//  - HEAVY (slow): the whole-array `futurePairData` merge (many portfolio/copy
//    screens read prices from it), position PnL recompute, wallet, conversions.
const LIVE_PRICE_FLUSH_MS = 150;
const HEAVY_PRICE_FLUSH_MS = 600;

// The pair the user is actively viewing dispatches straight to `futureTicker` at
// this rate (~12/sec) - visually continuous for a changing price, while keeping
// the (large) trade-screen re-render rate bounded. Going truly per-frame needs
// the trade-screen price display split into its own memoized leaf first.
const OPEN_PAIR_TICKER_THROTTLE_MS = 80;

const HelperScreen: React.FC = () => {
    const userData = useSelector((state: any) => state.auth.userData);
    const isAuth = useSelector((state: any) => state.auth.isAuth);
    const currentLeverage = useSelector((state: any) => state.auth.leverage);
    // Narrowed to the exact fields this component reads - futureSelector/walletSelector/
    // optionTradeSelector return their whole slice, unmemoized, and these slices get
    // live socket updates (price ticks, etc.) many times per second. Subscribing broadly
    // here forced a re-render of this permanently-mounted component on every single tick,
    // including ones for fields it doesn't even use (e.g. futureTicker), which was
    // constant JS-thread pressure fighting with toast animations / screen renders.
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const positionDetails = useSelector((state: any) => state.future.positionDetails);
    const openOrderDetails = useSelector((state: any) => state.future.openOrderDetails);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const wallet = useSelector((state: any) => state.wallet.wallet);
    const pricedetails = useSelector((state: any) => state.wallet.pricedetails);
    const callslist = useSelector((state: any) => state.optionTrade.callslist);
    const putslist = useSelector((state: any) => state.optionTrade.putslist);
    const { navigation, cleardata, failuretoast, dispatch } = useCustomHooks();

    const appState = useRef(AppState.currentState);
    const isConnected = useRef(true);
    const isMountedRef = useRef(true);
    const userdetails = useRef(userData);
    const futurePairDataRef = useRef<any>(futurePairData);
    // Deliberately NOT a useSelector - see the comment above the selectors block on
    // why this component avoids subscribing to futureTicker. Only tracks the last
    // ticker payload THIS handler itself dispatched, purely to guard against
    // redispatching identical data on every tick.
    const futureTickerRef = useRef<any>({});
    const dispatchRef = useRef<any>(dispatch);
    const PositionDetails = useRef<any>(positionDetails || []);
    const userWalletDetails = useRef<any>(wallet)
    const ConversionList = useRef<any>(pricedetails)
    const callslistRef = useRef<any>(callslist || [])
    const putslistRef = useRef<any>(putslist || [])
    // FututresPrice / PRICE_CONVERSION_LIST are global broadcasts that fire once
    // per pair, for every pair, constantly. Instead of one (or more) Redux
    // dispatch per pair per tick - which flooded the store and re-rendered half
    // the app (every useCustomHooks() consumer subscribes to the whole wallet
    // slice) - incoming ticks are merged into these maps (keyed by pair) and
    // flushed as ONE batched set of dispatches, scheduled by the handlers below.
    // `pendingLive` drains fast into livePrices; each drained pair is folded into
    // `pendingHeavy` for the slow futurePairData / positions / conversions pass.
    const pendingFuturesPricesRef = useRef<Map<string, any>>(new Map())
    const pendingHeavyFuturesRef = useRef<Map<string, any>>(new Map())
    const pendingPriceConversionsRef = useRef<Map<string, any>>(new Map())
    // One-shot timers for the two flush cadences (see LIVE_/HEAVY_PRICE_FLUSH_MS).
    const liveFlushTimerRef = useRef<any>(null)
    const heavyFlushTimerRef = useRef<any>(null)
    // tickerRoot of the pair currently open on the trade screen (kept in sync via
    // an effect, so the hot FututresPrice handler never has to read storage) +
    // the last time its fast-lane futureTicker dispatch fired.
    const openPairRef = useRef<string>('')
    const lastTickerFlushAt = useRef(0)

    const {
        Fetchcurrencies,
        triggeraffiliate,
        triggeruserdetails,
        Fetchsubaccounts,
        triggerPairDetails,
        triggerpositionOrders,
        triggerAvailableMargin,
        triggerfetchApiKeyLists,
        mystrategyDetails,
        triggerOpendOrders,
        triggergetNotification,
        triggerOptionLists,
        triggerFeeSettingList
    } = useApihooks();
    const { computePortfolioMargins } = usePortfolioHook()




    useEffect(() => {
        if (isAuth && getItem("token")) {
            fetchUserData();
        }
    }, [isAuth]);

    useEffect(() => {
        socketService.connect(SOCKETURL, {})
        initialcalls();
        console.log("initial")
        return () => {
            socketService.disconnect();
        };
    }, [])

    // Update refs when dependencies change
    useEffect(() => {
        futurePairDataRef.current = futurePairData;
    }, [futurePairData]);

    useEffect(() => {
        openPairRef.current = futureTradePair?.tickerRoot || getItem("futurespair") || '';
        // Reset the ticker dedup baseline so the newly-selected pair's first price
        // tick always goes through (and no stale fields from the previous pair
        // linger in the change check).
        futureTickerRef.current = {};
    }, [futureTradePair]);

    useEffect(() => {
        dispatchRef.current = dispatch;
    }, [dispatch]);


    useEffect(() => {
        PositionDetails.current = positionDetails || [];
    }, [positionDetails]);

    useEffect(() => {
        userWalletDetails.current = wallet
    }, [wallet])

    useEffect(() => {
        ConversionList.current = pricedetails
    }, [pricedetails])

    useEffect(() => {
        callslistRef.current = callslist || [];
    }, [callslist])

    useEffect(() => {
        putslistRef.current = putslist || [];
    }, [putslist])



    useEffect(() => {
        userdetails.current = userData
    }, [userData])

    // Tracks the latest currentLeverage without being a dependency of the sync
    // effect below - see comment there for why.
    const currentLeverageRef = useRef(currentLeverage);
    useEffect(() => {
        currentLeverageRef.current = currentLeverage;
    }, [currentLeverage]);

    useEffect(() => {
        if (!isEmpty(userdetails.current) && !isEmpty(futureTradePair)) {
            let leverage = userdetails?.current?.pairSettings?.find(
                (val: any) => val?.pairId?.toString() == futureTradePair?._id?.toString()
            )?.leverage;
            leverage = isNaN(leverage) ? 1 : leverage;
            // Compare against the ref, not the `currentLeverage` selector value, and
            // deliberately don't depend on `currentLeverage` below. buysell/buysellNew/
            // OptionBuySell's changeLeverage() dispatches setUserLeverage(newValue)
            // immediately on a successful API response - but userData (and thus
            // userdetails.current.pairSettings) only gets refreshed on the next full
            // triggeruserdetails()/fetchUserData() call, which doesn't happen right
            // away. With `currentLeverage` in the deps array, that very dispatch
            // re-ran this effect, found the still-stale cached pairSettings leverage
            // different from the value that had just been set, and immediately
            // dispatched setUserLeverage() again with the OLD leverage - silently
            // reverting the user's change back and leaving the "Leverage Nx" badge
            // stuck on the old value until an app restart refreshed userData. Reading
            // the current value from a ref instead lets this effect still correctly
            // resync leverage when the pair changes or userData actually refreshes,
            // without treating its own downstream effect (a leverage change dispatched
            // elsewhere) as a reason to override it back.
            if (leverage !== currentLeverageRef.current) {
                dispatch(setUserLeverage(leverage));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [futureTradePair, userData]);


    const useDebounce = (callback: Function, delay: number) => {
        const timeoutRef = useRef<NodeJS.Timeout>(null);

        return useCallback((...args: any[]) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }, [callback, delay]);
    };

    // Same as useDebounce, but keeps one timer per `key` instead of a single
    // shared timer, so a tick for one coin can't cancel a pending tick for
    // another coin (which was making low-frequency coins appear "stuck"
    // whenever a high-frequency coin like BNB/SOL kept resetting the timer).
    const useKeyedDebounce = (callback: Function, delay: number, getKey: (...args: any[]) => string) => {
        const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

        return useCallback((...args: any[]) => {
            const key = getKey(...args);
            const existing = timeoutsRef.current.get(key);
            if (existing) {
                clearTimeout(existing);
            }

            timeoutsRef.current.set(key, setTimeout(() => {
                timeoutsRef.current.delete(key);
                callback(...args);
            }, delay));
        }, [callback, delay, getKey]);
    };


    const handleForceLogout = useCallback((data: any) => {
        console.log("FORCE_LOGOUT", data);

        if (!isMountedRef.current) return;

        const isPlatformScoped = data && typeof data === 'object';
        const eventToken = isPlatformScoped ? data.token : data;
        const eventPlatform = isPlatformScoped ? data.platform : null;

        // ignore events meant for a different platform (e.g. web login shouldn't log out mobile)
        if (isPlatformScoped && eventPlatform !== Platform.OS && eventToken != 'token') {
            return;
        }
        // ignore the event caused by this very session logging in
        if (eventToken && eventToken === getItem("token")) return;
        cleardata();
        failuretoast("Expired!", "Your session has expired!");
    }, []);

    const handleUserDetails = useCallback((data: any) => {
        console.log("USER_DETAILS", data);

        if (!isEmpty(data)) {
            // dispatch(setUserData(data));
            dispatch(setUserData({
                ...data,
                favStradegies: userdetails?.current?.favStradegies ?? data.favStradegies,
            }));
        }
    }, [dispatch]);

    const handleUserBalance = useCallback((data: any) => {
        console.log("USER_BALANCE", data, userdetails?.current?.accountId);

        if (!isEmpty(data) && userdetails?.current?.accountId == data?.accountId) {
            dispatch(setUserBalance(data));
        }
    }, [dispatch]);

    const handleUserNotificationUpdate = useCallback((data: any) => {
        if (!isMountedRef.current) return;

        if (data?.accountId == userdetails?.current?.accountId) {
            dispatch(setUnreadCount(data?.unreadcount ?? 0));
        }
    }, [dispatch]);

    const handleUserAccountDetails = useCallback((data: any) => {
        if (!isEmpty(data)) {
            dispatch(setSubaccounts(data));
        }
    }, [dispatch]);

    const handleAffiliateDetails = useCallback((data: any) => {
        dispatch(setAffiliateData(data ?? {}));
    }, [dispatch]);

    // Cheap replacement for the old double-JSON.stringify() diff: true if any
    // field present in `update` differs from `base`.
    const hasChangedFields = (base: any, update: any) => {
        if (!base) return true;
        for (const key in update) {
            if (base[key] !== update[key]) return true;
        }
        return false;
    };

    // One-shot timer schedulers (see LIVE_/HEAVY_PRICE_FLUSH_MS). A setTimeout
    // armed by the socket handler itself survives startup thread-saturation far
    // better than a standalone setInterval, which RN silently coalesces while the
    // thread is blocked (the "prices slow at startup, then sync" symptom).
    const scheduleLiveFlush = () => {
        if (liveFlushTimerRef.current) return;
        liveFlushTimerRef.current = setTimeout(() => {
            liveFlushTimerRef.current = null;
            flushLivePrices();
        }, LIVE_PRICE_FLUSH_MS);
    };
    const scheduleHeavyFlush = () => {
        if (heavyFlushTimerRef.current) return;
        heavyFlushTimerRef.current = setTimeout(() => {
            heavyFlushTimerRef.current = null;
            flushHeavyFutures();
            flushPriceConversions();
        }, HEAVY_PRICE_FLUSH_MS);
    };

    // FututresPrice fires once per pair, for EVERY pair.
    //  - pooled -> livePrices (fast, per-ticker, only that row re-renders)
    //  - pooled -> the slow futurePairData / positions / wallet pass
    //  - the ONE pair the user is viewing also gets a lightly-throttled lane
    //    straight to `futureTicker` so the trade screen stays live.
    const handleFuturesPrice = useCallback((data: any) => {
        if (!isMountedRef.current || !data?.tickerRoot) return;
        const prev = pendingFuturesPricesRef.current.get(data.tickerRoot);
        pendingFuturesPricesRef.current.set(
            data.tickerRoot,
            prev ? { ...prev, ...data } : data,
        );
        scheduleLiveFlush();
        scheduleHeavyFlush();

        if (data.tickerRoot === openPairRef.current) {
            const now = Date.now();
            if (
                now - lastTickerFlushAt.current >= OPEN_PAIR_TICKER_THROTTLE_MS &&
                hasChangedFields(futureTickerRef.current, data)
            ) {
                lastTickerFlushAt.current = now;
                futureTickerRef.current = { ...futureTickerRef.current, ...data };
                dispatch(setFutureTicker(data));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    // Recompute pnl for every open position whose pair just moved, in ONE pass and
    // ONE dispatch - the old per-pair ArrangePositionOrder() dispatched a fresh
    // positions array + recalculated the wallet balance separately for each pair.
    const arrangePositionOrdersBatch = (updates: any[]) => {
        try {
            const positions = PositionDetails.current;
            if (!positions || positions.length === 0) return;
            let next = positions;
            let changed = false;
            for (const upd of updates) {
                if (upd?.marketPrice == null) continue;
                const index = next.findIndex((el: any) => el.pairName == upd.tickerRoot);
                if (index === -1) continue;
                const current = next[index];
                const { profit, percentage } = getPorfitCalculation(
                    current?.entryPrice,
                    upd.marketPrice,
                    current.positionFilled,
                    current.positionSide,
                );
                if (current.pnl === profit && current.pnl_percen === percentage) continue;
                if (!changed) { next = [...positions]; changed = true; }
                next[index] = { ...current, close_price: upd.marketPrice, pnl: profit, pnl_percen: percentage };
            }
            if (changed) {
                dispatch(setPositionOrders(next));
                CalculateunRealizedPnL(next);
            }
        } catch (err) {
            console.log(err, 'arrangePositionOrdersBatch__err');
        }
    };

    // FAST pass: per-ticker livePrices map (market-list rows) + open-pair ticker
    // catch-up. Everything drained here is also folded into the heavy queue.
    const flushLivePrices = () => {
        if (!isMountedRef.current) return;
        const pending = pendingFuturesPricesRef.current;
        if (pending.size === 0) return;
        const updates = Array.from(pending.values());
        pending.clear();

        const liveUpdates: Record<string, any> = {};
        const heavy = pendingHeavyFuturesRef.current;
        for (const u of updates) {
            if (!u?.tickerRoot) continue;
            liveUpdates[u.tickerRoot] = u;
            const prevHeavy = heavy.get(u.tickerRoot);
            heavy.set(u.tickerRoot, prevHeavy ? { ...prevHeavy, ...u } : u);
        }
        dispatch(setLivePrices(liveUpdates));

        // The 80ms fast lane in handleFuturesPrice covers most ticks; this closes
        // the gap when its change-guard skipped the previous one.
        const openUpd = liveUpdates[openPairRef.current];
        if (openUpd && hasChangedFields(futureTickerRef.current, openUpd)) {
            lastTickerFlushAt.current = Date.now();
            futureTickerRef.current = { ...futureTickerRef.current, ...openUpd };
            dispatch(setFutureTicker(openUpd));
        }
    };

    // SLOW pass: open-position PnL recompute.
    // NOTE: this deliberately no longer merges prices into `futurePairData`. Every
    // screen that DISPLAYS a live pair price now reads it from `livePrices` (the
    // Market list, Home's Trade cards, Home's StaticMarketTable). The remaining
    // `futurePairData` readers (order history / fills / copy setup ...) only look
    // up static metadata (baseCurrency / decimals) via `.find(_id)`, so leaving
    // its prices at their load-time value is fine - and it means those ~10 screens
    // stop re-rendering on every price tick.
    const flushHeavyFutures = () => {
        if (!isMountedRef.current) return;
        const pending = pendingHeavyFuturesRef.current;
        if (pending.size === 0) return;
        const updates = Array.from(pending.values());
        pending.clear();

        arrangePositionOrdersBatch(updates);
    };


    const handlePositionOrder = useCallback((data: any) => {
        if (data.accountId == userdetails.current.accountId) {
            // Only dispatch when the position actually changed - unconditionally dispatching
            // every tick (same pattern handleFuturesPrice already guards against) was forcing
            // a re-render of every screen subscribed to positionDetails/openOrderDetails even
            // when nothing about the position moved.
            if (JSON.stringify(PositionDetails.current) !== JSON.stringify(data.data)) {
                PositionDetails.current = data.data
                dispatch(setPositionOrders(data.data))
            }
        }
    }, [dispatch]);

    const handleOptionPriceUpdate = useKeyedDebounce((data: any) => {
        if (!isMountedRef.current || !data?._id) return;
        // Debounced per contract id (same reasoning as handleFuturesPrice: a shared timer
        // would let a high-frequency contract keep resetting the timer for every other
        // contract). Also only dispatches the list that actually contains this contract,
        // and only when the merge actually changes something - previously this dispatched
        // BOTH setCallslist and setPutslist on every single tick, even though a given
        // update only ever belongs to one of the two lists, re-rendering both screens
        // unconditionally on every price tick.
        const callIndex = callslistRef.current.findIndex((item: any) => item?._id === data._id);
        if (callIndex !== -1) {
            const merged = { ...callslistRef.current[callIndex], ...data };
            if (JSON.stringify(callslistRef.current[callIndex]) !== JSON.stringify(merged)) {
                const updatedCalls = [...callslistRef.current];
                updatedCalls[callIndex] = merged;
                dispatch(setCallslist(updatedCalls));
            }
        }
        const putIndex = putslistRef.current.findIndex((item: any) => item?._id === data._id);
        if (putIndex !== -1) {
            const merged = { ...putslistRef.current[putIndex], ...data };
            if (JSON.stringify(putslistRef.current[putIndex]) !== JSON.stringify(merged)) {
                const updatedPuts = [...putslistRef.current];
                updatedPuts[putIndex] = merged;
                dispatch(setPutslist(updatedPuts));
            }
        }
        ArrangePositionOrder(data);
    }, 500, (data: any) => data?._id);

    // PRICE_CONVERSION_LIST ticks constantly, once per conversion pair. Every tick
    // used to dispatch a brand-new pricedetails array, which re-renders everything
    // in the app that shows a converted price (a lot of the UI, via useCustomHooks'
    // convert()/convertSec()). Pool it and flush on the slow (heavy) cadence.
    const handlePriceList = useCallback((data: any) => {
        if (!isMountedRef.current) return;
        const key = data?.pair?.toString();
        if (!key) return;
        const prev = pendingPriceConversionsRef.current.get(key);
        pendingPriceConversionsRef.current.set(key, prev ? { ...prev, ...data } : data);
        scheduleHeavyFlush();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flushPriceConversions = () => {
        if (!isMountedRef.current) return;
        const pending = pendingPriceConversionsRef.current;
        if (pending.size === 0) return;
        const updates = Array.from(pending.values());
        pending.clear();

        const list = Array.isArray(ConversionList.current) ? [...ConversionList.current] : [];
        let changed = false;
        for (const upd of updates) {
            const key = upd?.pair?.toString();
            const idx = list.findIndex((el: any) => el?.pair?.toString() === key);
            if (idx === -1) {
                list.push(upd);
                changed = true;
            } else if (hasChangedFields(list[idx], upd)) {
                list[idx] = { ...list[idx], ...upd };
                changed = true;
            }
        }
        if (changed) dispatch(update_pricedetails(list));
    };

    useEffect(() => {
        if (!socketService) return;

        socketService.on("FORCE_LOGOUT", handleForceLogout);
        socketService.on("USER_DETAILS", handleUserDetails);
        socketService.on("USER_BALANCE", handleUserBalance);
        socketService.on("USER_NOTIFICATIONUPDATE", handleUserNotificationUpdate);
        socketService.on("USER_ACCOUNT_DETAILS", handleUserAccountDetails);
        socketService.on("FututresPrice", handleFuturesPrice);
        socketService.on("FuturesPositionOrder", handlePositionOrder);
        socketService.on('PRICE_CONVERSION_LIST', handlePriceList)
        socketService.on("OptionPriceUpdate", handleOptionPriceUpdate);
        socketService.on("AFFILIATE_DETAILS", handleAffiliateDetails);

        return () => {
            socketService.off("FORCE_LOGOUT", handleForceLogout);
            socketService.off("USER_DETAILS", handleUserDetails);
            socketService.off("USER_BALANCE", handleUserBalance);
            socketService.off("USER_NOTIFICATIONUPDATE", handleUserNotificationUpdate);
            socketService.off("USER_ACCOUNT_DETAILS", handleUserAccountDetails);
            socketService.off("FututresPrice", handleFuturesPrice);
            socketService.off("FuturesPositionOrder", handlePositionOrder);
            socketService.off("OptionPriceUpdate", handleOptionPriceUpdate);
            socketService.off('PRICE_CONVERSION_LIST', handlePriceList);
            socketService.off("AFFILIATE_DETAILS", handleAffiliateDetails);
        };
        // socketService re-attaches these internally on every reconnect (see
        // its "connect" handler), so this only needs to run once per mount —
        // depending on getConnectionStatus() here caused every unrelated
        // re-render during the post-login data-fetch burst to tear down and
        // re-register all listeners, dropping events in the gap.
    }, [])

    // `futurePairData` is now static after load (triggerPairDetails only). When its
    // pair SET changes (first load, or a pair added/removed - the length is a cheap
    // proxy), seed livePrices from it so every list row has a price immediately,
    // before the first socket tick for that pair.
    const seededPairCountRef = useRef(0);
    useEffect(() => {
        const len = futurePairData?.length || 0;
        if (!len || len === seededPairCountRef.current) return;
        seededPairCountRef.current = len;
        const seed: Record<string, any> = {};
        for (const pair of futurePairData) {
            if (pair?.tickerRoot) seed[pair.tickerRoot] = pair;
        }
        dispatch(setLivePrices(seed));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [futurePairData])

    // Drop both flush timers on unmount.
    useEffect(() => {
        return () => {
            if (liveFlushTimerRef.current) {
                clearTimeout(liveFlushTimerRef.current);
                liveFlushTimerRef.current = null;
            }
            if (heavyFlushTimerRef.current) {
                clearTimeout(heavyFlushTimerRef.current);
                heavyFlushTimerRef.current = null;
            }
        };
    }, [])

    useEffect(() => {
        // console.log(userdetails, socketService.getConnectionStatus(), "userdetails")
        if (isAuth && !isEmpty(userdetails.current)) {
            console.log(userdetails.current, "userdetails")
            socketService.emit("CREATE_ROOM", userdetails.current.userId)
        }
    }, [isAuth, userdetails.current, socketService.getConnectionStatus()])

    // Cleanup
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /**missing call is fetchInstitutionDetails */
    const fetchUserData = async () => {
        try {
            await triggeruserdetails();// fetch user detalis
            // defer the rest until the current navigation/animation (e.g. the
            // post-login stack swap + success toast) finishes, instead of firing
            // 8 dispatches back-to-back in the same tick and competing with it
            InteractionManager.runAfterInteractions(() => {
                triggerAvailableMargin();// fetch selected subaccount balancedetails
                Fetchsubaccounts(); // fetch subaccount list
                triggerpositionOrders(); // fetch user position details
                triggerOpendOrders();// fetch user open order details
                triggergetNotification();// fetch user notification details
                triggeraffiliate();// fetch user affilate details
                triggerfetchApiKeyLists();//fetch user apikey list
                mystrategyDetails();//fetch user startegy details
            });
        } catch (err) {
            console.log(err, "fetchUserData__err")
        }
    }


    /**missing call is getAllStrategys */
    const initialcalls = async () => {
        // deferred for the same reason as fetchUserData above
        InteractionManager.runAfterInteractions(() => {
            triggerPairDetails();// fetch pair details
            triggerOptionLists();// fetch Option details
            Fetchcurrencies(); // fetch currency list and price conversion list
            triggerFeeSettingList();
        });
    }

    // ─── AppState listener (app open / background / close) ────────────
    useEffect(() => {
        const sub = AppState.addEventListener('change', handleAppStateChange);
        return () => sub.remove();
    }, []);

    // ─── Network listener ─────────────────────────────────────────────
    useEffect(() => {
        const unsub = NetInfo.addEventListener(handleNetworkChange);
        return () => unsub();
    }, []);

    const handleAppStateChange = (nextState: AppStateStatus) => {
        const prev = appState.current;
        appState.current = nextState;

        if (prev.match(/inactive|background/) && nextState === 'active') {
            // App came to foreground. On iOS the JS thread (and any timers
            // socket.io scheduled for pings/reconnect backoff) is frozen while
            // backgrounded, so a connection that actually died while suspended
            // often comes back to foreground still flagged `connected` (no
            // 'disconnect' event ever got to fire) or stuck waiting out a
            // reconnect backoff timer that was due minutes ago. Android isn't
            // affected the same way, which is why this only shows up as
            // "socket stuck" on iOS after backgrounding/reopening the app.
            // A cheap, idempotent kick here (no-op if already connected)
            // clears that zombie state instead of waiting up to ~45s for the
            // server's own ping timeout to notice.
            const sock = socketService.getSocket();
            if (sock && !sock.connected) {
                sock.connect();
            }
            // App came to foreground — refresh data and reconnect socket
            if (isAuth) {
                fetchUserData()
            }
            initialcalls();
        }
    }

    const handleNetworkChange = (state: NetInfoState) => {
        const wasOffline = !isConnected.current;
        isConnected.current = !!state.isConnected;

        if (wasOffline && state.isConnected) {
            // Came back online — re-fetch and reconnect. Same zombie-socket
            // reasoning as handleAppStateChange above: a network drop/switch
            // (e.g. WiFi -> cellular) can leave the socket flagged connected
            // when it isn't, so kick it explicitly instead of waiting on the
            // server ping timeout.
            const sock = socketService.getSocket();
            if (sock && !sock.connected) {
                sock.connect();
            }
            if (isAuth) {
                fetchUserData()
            }
            initialcalls();
        }
    }

    const ArrangePositionOrder = (result: any) => {
        try {
            // console.log(PositionDetails.current, "ArrangePositionOrder")
            if (PositionDetails.current.length > 0) {
                let PositionData = [...PositionDetails.current]
                let index = PositionData.findIndex((el => el.pairName == result.tickerRoot))
                // console.log(index, "ArrangePositionOrder_index")
                if (index != -1) {
                    let positionOrder = { ...PositionData[index] }
                    positionOrder['close_price'] = result.marketPrice
                    const { profit, percentage } = getPorfitCalculation(positionOrder?.entryPrice, positionOrder.close_price, positionOrder.positionFilled, positionOrder.positionSide)
                    // Only dispatch when the recomputed pnl actually changed - same guard
                    // handleFuturesPrice/handlePositionOrder/handleOptionPriceUpdate already
                    // use, missing here previously. Without it, every single price tick for
                    // a pair/contract with an open position dispatched a brand-new
                    // positionDetails array (and recalculated the wallet balance) even when
                    // the pnl hadn't moved, re-rendering every screen watching either of
                    // those on every tick.
                    if (positionOrder.pnl === profit && positionOrder.pnl_percen === percentage) return;
                    positionOrder['pnl'] = profit
                    positionOrder['pnl_percen'] = percentage
                    PositionData[index] = positionOrder
                    dispatch(setPositionOrders(PositionData))
                    CalculateunRealizedPnL(PositionData)
                }
            }
        } catch (err) {
            console.log(err, 'ArrangePositionOrder__err')
        }
    }

    const CalculateunRealizedPnL = async (PositionDetails: any) => {
        try {
            let unRealizedPnL = PositionDetails.reduce((UPNL: any = 0, val: any) => {
                UPNL = parseFloat(UPNL) + parseFloat(val.pnl)
                return UPNL
            }, 0)
            let wallet = { ...userWalletDetails.current }
            // console.log(wallet, "CalculateunRealizedPnL")
            wallet.unRealizedPnL = parseFloat(unRealizedPnL)
            wallet.tradingBalance = parseFloat(wallet.walletBalance) + parseFloat(unRealizedPnL)
            if (userdetails.current.marginMode == 'cross') {
                wallet.availableBalance = (wallet.walletBalance + wallet.unRealizedPnL) - (wallet.freezeBalance);
            } else if (userdetails.current.marginMode == 'portfolio') {
                let openToPosition = openOrdersAsposition(openOrderDetails);
                let originalPositions = [...PositionDetails, ...openToPosition]
                const { riskMargin, marginFloor, initialMargin, maintenanceMargin } = await computePortfolioMargins(originalPositions, userdetails.current.marginMode, wallet.unRealizedPnL)
                console.log(initialMargin, "computePortfolioMargins", unRealizedPnL)
                wallet.totalMargin = initialMargin
                wallet.freezeBalance = initialMargin
                wallet.availableBalance = (wallet.walletBalance + wallet.unRealizedPnL) - (wallet.freezeBalance);
                wallet.totalMaintainMargin = maintenanceMargin
            }
            dispatch(setUserBalance(wallet))
        } catch (err) {
            console.log(err, "CalculateunRealizedPnL___err")
        }
    }

    return null

}

export default HelperScreen;

export const useInitialCall = () => {
    const { isAuth } = useSelector(authSelector);
    const {
        triggeraffiliate,
        triggeruserdetails,
        Fetchsubaccounts,
        triggerpositionOrders,
        triggerAvailableMargin,
        triggerfetchApiKeyLists,
        mystrategyDetails,
        triggerOpendOrders,
        triggergetNotification,
    } = useApihooks();

    /**missing call is fetchInstitutionDetails */
    const fetchUserData = async () => {
        try {
            await triggeruserdetails();// fetch user detalis
            triggerAvailableMargin();// fetch selected subaccount balancedetails
            Fetchsubaccounts(); // fetch subaccount list
            triggerpositionOrders(); // fetch user position details
            triggerOpendOrders();// fetch user open order details
            triggergetNotification();// fetch user notification details
            triggeraffiliate();// fetch user affilate details
            triggerfetchApiKeyLists();//fetch user apikey list
            mystrategyDetails();//fetch user startegy details
        } catch (err) {
            console.log(err, "fetchUserData__err")
        }
    }

    const ReCallInitial = () => {
        try {
            if (isAuth) {
                fetchUserData()
            }
        } catch (err) {
            console.log(err, "ReCallInitial__err")
        }
    }

    return {
        ReCallInitial
    }
}