import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import useApiError from "../../Actions/Hooks/errorhook";

import Text from "../../Components/text";
import Flexcomponent from "../../Components/flexcomponent";
import { Button, Dropdown, Input } from "../../Components/Field";
import VectorIcons from "../../Utilities/vectoricons";
import { isEmpty } from "../../Utilities/helerfunction";
import { Colors, Fontsize } from "../../Utilities/uiasset";
import {
    borderradius,
    RFvalue,
    windowwidth,
} from "../../Utilities/dimensions";

import { useFutureLeverageMutation, useFutureOrderPlacingMutation } from "../../Slices/future";
import { setUserLeverage } from "../../Slices/auth";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { LotToquantity, QuantityToVolume, VolumeToquantity, quantityToLot } from "../../Actions/Hooks/usePriceConversion";
import { formatDisplayPair } from "../../Utilities/formatPair";

import { styles } from "./styles";
import Leverage from "./Popup/Leverage";
import PlaceOrder from "./Popup/PlaceOrder";
import UpdateMargin from "../Profile/SubAccount/Manage/UpdateMargin";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import ProfitOption from "./Popup/ProfitOption";
import BracketOrders from "./Popup/BracketOrders";

// Matches the labels ProfitOption.tsx's sheet itself uses - the "Stop" tab must show
// whichever of these was actually picked, not a static "Stop Limit" regardless of choice.
const ADVANCED_ORDER_TYPE_LABELS: Record<string, string> = {
    stop_limit: "Stop Limit",
    makeronly: "Maker Only",
    trailingStop: "Trailing Stop",
    stop_market: "Stop Market",
    take_profit: "Take Profit Market",
    take_profit_limit: "Take Profit Limit",
};

// Bracket order (Take Profit / Stop Loss pair attached to the entry order) - ported
// from the older buysell.tsx screen's implementation, same payload shape the backend
// already validates (Modules/Future/Controller/futureController.js). Only available
// for limit/market/maker-only entries, matching the old UI's restriction.
// isTake/isStop live in here alongside the two legs so they mirror web's
// initialState (TradeActionPanel.jsx) exactly: web carries them in the same
// formData object as takeProfit/stopLoss and flips them as a pair. They are the
// ONLY on/off signal the backend reads (futureController.js gates every bracket
// branch on `reqData.isTake` / `reqData.isStop`), so they must never be derived
// from the prices - see handleBracketChange below.
const DEFAULT_BRACKET_ORDER = {
    takeProfit: { stopPrice: "", price: "", orderType: "bracket_tp_market" },
    stopLoss: { stopPrice: "", price: "", orderType: "bracket_sl_market" },
    isTake: false,
    isStop: false,
};

const BuysellNew = () => {
    const { theme, navigation, bottomsheetref, closebottomsheet, openbottomsheet, successtoast, failuretoast, dispatch } = useCustomHooks();

    const style = styles(theme);

    // useCustomHooks() rebuilds successtoast/failuretoast/closebottomsheet fresh on
    // every call, so they can't be listed as useCallback deps below without defeating
    // the memoization - mirror the ticking-data-in-a-ref pattern already used elsewhere
    // in this codebase (see the Home screen market table) to read the latest ones
    // without depending on their (unstable) reference.
    const hookFnsRef = useRef({ successtoast, failuretoast, closebottomsheet });
    hookFnsRef.current = { successtoast, failuretoast, closebottomsheet };

    // -----------------------------
    // LIVE DATA
    // -----------------------------

    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const takerFee = useSelector((state: any) => state.future.takerFee);
    // The user's actual saved leverage for the current pair - HelperComponent.tsx already
    // resolves this from userData.pairSettings and keeps it in sync here on every pair load.
    const currentLeverage = useSelector((state: any) => state.auth.leverage);
    // The margin mode of the currently selected sub-account (e.g. "cross"/"isolated"/
    // "portfolio") - matches the pattern already used correctly by Positions.tsx,
    // OpenOrders.tsx, and the older buysell.tsx trade screen.
    const accountMarginMode = useSelector((state: any) => state.auth.userData?.marginMode);
    // UpdateMargin's submit payload requires accountId - it was never passed down to
    // this screen's <UpdateMargin> at all, so every margin-mode switch attempted from
    // here sent accountId: undefined and the backend rejected it with a generic error.
    const activeAccountId = useSelector((state: any) => state.auth.userData?.accountId);
    const { wallet } = useSelector((state: any) => state.wallet);

    const tradePair: any = {
        _id: futureTradePair?._id,
        baseCurrency: futureTradePair?.baseCurrency ?? futureTicker?.baseCurrency ?? "",
        quoteCurrency: futureTradePair?.quoteCurrency ?? futureTicker?.quoteCurrency ?? "",
        minAmount: futureTradePair?.minAmount ?? 0,
        marketPrice: futureTicker?.marketPrice ?? futureTradePair?.marketPrice ?? 0,
        maxLeverage: futureTradePair?.max_leverage ?? futureTradePair?.maxLeverage ?? 100,
        max_leverage: futureTradePair?.max_leverage ?? futureTradePair?.maxLeverage ?? 100,
        quoteDecimal: futureTradePair?.quoteDecimal ?? 2,
        baseDecimal: futureTradePair?.baseDecimal ?? 4,
    };

    const availableBalance = wallet?.availableBalance ?? 0;

    // Dropdown's underlying react-native-element-dropdown re-runs a useEffect keyed on
    // this array's reference and calls setListData whenever it changes - an inline
    // `list={[...]}` literal is a new array every render, and this screen re-renders on
    // every live futureTicker socket tick, which was retriggering that effect fast
    // enough to trip React's "Maximum update depth exceeded" guard. Memoizing keyed on
    // the only values it actually depends on keeps the reference stable across ticks.
    const quantityUnitList = useMemo(() => ([
        {
            label: tradePair.baseCurrency,
            value: tradePair.baseCurrency || "__base",
        },
        {
            label: "Lot",
            value: "lot",
        },
        {
            label: formatDisplayPair(tradePair.quoteCurrency),
            value: tradePair.quoteCurrency || "__quote",
        },
    ]), [tradePair.baseCurrency, tradePair.quoteCurrency]);

    // -----------------------------
    // STATES
    // -----------------------------

    const [actions, setAction] = useState<"buy" | "sell">("buy");

    const [orderType, setOrderType] = useState<string>("limit");
    // Must stay a stable reference, not an inline `formData={{ orderType }}` literal -
    // passed into the now-memoized <ProfitOption>, which stays mounted (just hidden)
    // the same way <Leverage> does, so a fresh object every render (from any
    // futureTicker tick) would re-render it regardless of the memoization.
    const profitOptionFormData = useMemo(() => ({ orderType }), [orderType]);

    const [quantityIn, setQuantityIn] = useState("lot");

    const [price, setPrice] = useState((futureTicker?.marketPrice ?? 0).toString());

    // This useState only ever ran ONCE, at mount, off futureTicker - which is
    // populated by a socket tick, so whenever this form mounted before that first
    // tick landed (the normal case on a cold open) `price` stayed the literal
    // string "0" for the whole session unless the user typed into it or switched
    // to Market. It also never re-synced on a pair change, so it kept showing the
    // previous pair's price.
    //
    // That is not just a wrong-looking Price field - it silently breaks the
    // bracket sheet. BracketOrders' Stop Loss anchor for a buy is
    // min(formData.price, marketPrice) (and max(...) for a sell), so a price of
    // "0" pins the SL anchor to 0, the 0.25% default seeds SL to "0.00",
    // parseFloat makes it 0, and isEmpty(0) === true - so onConfirm reports
    // "Stop price is required" and the Confirm button stays disabled. The
    // bracket can't be attached at all.
    //
    // Mirrors web's setInitalData() (TradeActionCard.jsx), including its source
    // preference: futureTradePair.marketPrice first, because futureTradePair is
    // always internally consistent the instant it changes, while futureTicker
    // lives in a separate slice and can still hold the PREVIOUS pair's price for
    // a moment after a switch. Keyed on the pair, deliberately NOT on the ticker
    // - web had a [futureTicker] effect here once and removed it precisely
    // because it rewrote the number under the user's cursor on every tick.
    useEffect(() => {
        if (!futureTradePair?._id) return;
        const pairPrice = futureTradePair?.marketPrice ?? futureTicker?.marketPrice;
        if (isEmpty(pairPrice)) return;
        setPrice(pairPrice.toString());
        // marketPrice is in the deps so a pair object that lands before its price
        // is filled in still gets picked up. Safe to depend on: setTradePairData is
        // only ever dispatched on an explicit pair selection (Home/Market/See-all
        // taps, customhook's pair-detail fetch) — never from a socket tick — so
        // this cannot re-fire mid-typing. futureTicker is what ticks, and it is
        // deliberately absent here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [futureTradePair?._id, futureTradePair?.marketPrice]);

    const [quantity, setQuantity] = useState("");

    const [stopPrice, setStopPrice] = useState("");

    const [leverage, setLeverage] = useState(currentLeverage || tradePair.max_leverage || 100);

    // Was hardcoded to 100 and never synced with the user's actually saved per-pair
    // leverage - navigating away and back (this component unmounting/remounting) always
    // reset the displayed leverage to 100x regardless of what was last set, even though
    // HelperComponent.tsx already correctly resolves and keeps currentLeverage in sync.
    useEffect(() => {
        if (currentLeverage) setLeverage(currentLeverage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLeverage]);

    // Without a saved leverage, the field must default within the pair's actual max
    // (e.g. 50x), not the hardcoded 100x fallback above - that showed a leverage the
    // pair doesn't even support. Also re-clamps if the pair itself changes to one with
    // a lower max while a higher leverage was already selected.
    useEffect(() => {
        if (tradePair.max_leverage && leverage > tradePair.max_leverage) {
            setLeverage(tradePair.max_leverage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tradePair.max_leverage]);

    const [marginMode, setMarginMode] = useState(accountMarginMode || "isolated");

    // Was hardcoded to "Isolated" and never synced with the selected sub-account's
    // actual saved margin mode - a user on a "cross"/"portfolio" account still saw
    // "Isolated" here regardless. Kept in sync whenever the active account (and thus
    // its margin mode) changes.
    useEffect(() => {
        if (accountMarginMode) setMarginMode(accountMarginMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountMarginMode]);

    const [reduceOnly, setReduceOnly] = useState(false);

    const [makerOnly, setMakerOnly] = useState(false);

    const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
        null
    );

    // Populated right before opening the PlaceOrder confirmation sheet - see
    // reviewOrder() below.
    const [confirmData, setConfirmData] = useState<any>({});

    // Take Profit / Stop Loss pair attached to the entry order - see
    // DEFAULT_BRACKET_ORDER above. Only mutated via the BracketOrders sheet's
    // confirm (handleBracketChange) and removeBracketOrders below.
    const [bracketOrder, setBracketOrder] = useState<any>(DEFAULT_BRACKET_ORDER);

    const [leverageVisible, setLeverageVisible] = useState(false);
    // setLeverageVisible itself is already stable (useState setter) - wrapping the
    // closure around it keeps the prop passed to the now-memoized <Leverage> stable too.
    const closeLeverage = useCallback(() => setLeverageVisible(false), []);
    const [futureChangeLeverage, { isLoading: levgLod, error: levgErr }] = useFutureLeverageMutation();
    const [futureOrderPlacing, { isLoading: orderLoading, error: orderErr }] = useFutureOrderPlacingMutation();

    useApiError(levgErr ?? orderErr);
    const updateMarginsheetref = useRef<BottomSheetModal>(null);
    // onClose/confirm/onContinue below were each a fresh inline arrow function doing
    // the exact same thing - passed into the now-memoized <UpdateMargin>, which stays
    // mounted (just hidden) the same way <Leverage> does, so any of those three being a
    // new reference every render (from any futureTicker tick) would re-render it
    // regardless of the memoization. One stable callback, reused for all three props.
    const closeUpdateMargin = useCallback(() => {
        hookFnsRef.current.closebottomsheet(updateMarginsheetref);
    }, []);
    const placeOrderref = useRef<BottomSheetModal>(null);
    const profitOptionref = useRef<BottomSheetModal>(null);
    const addBracketref = useRef<BottomSheetModal>(null);

    // -----------------------------
    // STATIC CALCULATED VALUES
    // -----------------------------

    const numericPrice = Number(price) || Number(tradePair.marketPrice) || 0;

    // `quantity` is whatever unit is selected in the Lot/base/quote dropdown (`quantityIn`) -
    // convert it to the actual base-currency quantity the backend expects before using it
    // for any calculation or order payload.
    const numericQuantity = quantityIn === "lot"
        ? Number(LotToquantity(quantity, tradePair.minAmount, tradePair.baseDecimal)) || 0
        : quantityIn === tradePair.quoteCurrency
            ? Number(VolumeToquantity(quantity, numericPrice, tradePair.baseDecimal)) || 0
            : Number(quantity) || 0;

    const orderValue = numericQuantity * numericPrice;

    const safeTakerFee = Number(takerFee);
    const fees = orderValue * ((Number.isFinite(safeTakerFee) ? safeTakerFee : 0) / 100) * 2 * 1.18;

    const orderCost = orderValue / leverage;

    const marginRequired = orderCost + fees;

    // Whether a bracket is actually attached - drives the Add vs Edit/Remove UI below.
    // Reads the same isTake/isStop flags the payload sends (and that web drives its
    // own bracket UI from), rather than re-deriving from a price: isEmpty() treats
    // the number 0 as empty, so a confirmed bracket whose leg computed to 0 used to
    // leave this stuck on "Add" while a bracket was in fact attached.
    const bracketAttached = bracketOrder.isTake || bracketOrder.isStop;

    // Bridge into BracketOrders.tsx's expected `formData` shape (price/buyorsell/
    // orderType/quantity/takeProfit/stopLoss) - this screen keeps those as separate
    // useState hooks instead of one combined object like the older buysell.tsx screen
    // did, so this assembles the same shape without changing this file's state
    // architecture. Must stay a stable reference for the same reason profitOptionFormData
    // does - passed into the now-memoized <BracketOrders>, which stays mounted (just
    // hidden) the same way <Leverage>/<ProfitOption> do.
    const bracketFormData = useMemo(() => ({
        price,
        buyorsell: actions,
        orderType,
        quantity: numericQuantity,
        takeProfit: bracketOrder.takeProfit,
        stopLoss: bracketOrder.stopLoss,
    }), [price, actions, orderType, numericQuantity, bracketOrder]);

    // Switching the unit dropdown (Lot / base currency / quote currency) only
    // ever called setQuantityIn - the displayed `quantity` text itself was never
    // reconverted, so e.g. "1" typed as Lot just kept showing as "1" after
    // switching to XRP/USDT instead of converting like web does. Track the unit
    // the currently-displayed value is actually in, and on a switch, convert
    // through the canonical base-currency amount into the newly selected unit's
    // display format - same pattern already used by buysell.tsx (Options) and
    // web's TradeActionCard.jsx.
    const prevQuantityIn = useRef(quantityIn);
    useEffect(() => {
        if (prevQuantityIn.current === quantityIn) return;
        if (quantity !== "" && quantity !== null && quantity !== undefined) {
            const baseQty = prevQuantityIn.current === "lot"
                ? LotToquantity(quantity, tradePair.minAmount, tradePair.baseDecimal)
                : prevQuantityIn.current === tradePair.quoteCurrency
                    ? VolumeToquantity(quantity, numericPrice, tradePair.baseDecimal)
                    : quantity;
            const displayQty = quantityIn === "lot"
                ? quantityToLot(baseQty, tradePair.minAmount, tradePair.baseDecimal)
                : quantityIn === tradePair.quoteCurrency
                    ? QuantityToVolume(baseQty, numericPrice, tradePair.quoteDecimal)
                    : baseQty;
            setQuantity(displayQty);
        }
        prevQuantityIn.current = quantityIn;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quantityIn]);

    // -----------------------------
    // PERCENTAGE
    // -----------------------------

    const quantityPercentage = [25, 50, 75, 100];

    const handlePercentage = (percentage: number) => {
        setSelectedPercentage(percentage);

        const investBalance = availableBalance * (percentage / 100);
        const orderValueAtBalance = investBalance * leverage;
        const baseQty = tradePair.marketPrice > 0
            ? (orderValueAtBalance / tradePair.marketPrice).toFixed(tradePair.baseDecimal)
            : "";

        const displayQty = baseQty === ""
            ? ""
            : quantityIn === "lot"
                ? quantityToLot(baseQty, tradePair.minAmount, tradePair.baseDecimal)
                : quantityIn === tradePair.quoteCurrency
                    ? QuantityToVolume(baseQty, tradePair.marketPrice, tradePair.quoteDecimal)
                    : baseQty;

        setQuantity(displayQty);
    };

    // -----------------------------
    // ORDER TYPE
    // -----------------------------

    const changeOrderType = (
        type: string
    ) => {
        setOrderType(type);

        if (type === "market") {
            setPrice(tradePair.marketPrice.toString());
        }
    };

    // Memoized (with toast functions read from hookFnsRef rather than taken as deps) so
    // this keeps a stable reference across ticks - it's passed straight into the now-
    // memoized <Leverage> popup, and a fresh function reference every render would
    // have defeated that memoization just as badly as the array-literal Dropdown bug.
    const changeLeverage = useCallback(async (value: any) => {
        const { successtoast, failuretoast } = hookFnsRef.current;
        if (value < 1) return false;
        if (!tradePair._id) {
            failuretoast("Error", "Please wait, pair is loading");
            return;
        }
        const payload = { leverage: value, pairId: tradePair._id };
        try {
            const response = await futureChangeLeverage(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                // Push the newly saved leverage into redux immediately - otherwise
                // state.auth.leverage stays at whatever it was before this change until
                // the next full userData refetch, so navigating away and back would sync
                // the local leverage state back to a stale value instead of what was just
                // set. Also set it directly rather than relying solely on the
                // userLeverage-watching effect to catch up - that round trip was what
                // left the "Leverage Nx" badge showing the old value.
                dispatch(setUserLeverage(value));
                setLeverage(value);
                setTimeout(() => {
                    setLeverageVisible(false);
                }, 200);
            } else {
                failuretoast("Error", response.message || "Something went wrong!");
            }
        } catch (e: any) {
            // Previously a silent console.log - a rejected/errored request looked
            // like tapping "Set" did nothing at all.
            failuretoast("Error", e?.data?.message || "Unable to update leverage. Please try again.");
        }
    }, [tradePair._id, futureChangeLeverage, dispatch])

    // Stable reference - passed into the now-memoized <ProfitOption>, which stays
    // mounted (just hidden) the same way <Leverage> does, re-rendering on every
    // futureTicker tick otherwise. closebottomsheet read from hookFnsRef since
    // useCustomHooks() rebuilds it fresh every render.
    const handleOrderListSelect = useCallback((value: any) => {
        setOrderType(value);
        setMakerOnly(value === "makeronly");
        hookFnsRef.current.closebottomsheet(profitOptionref);
    }, []);

    // Stable reference for the same reason as handleOrderListSelect above - passed
    // into the now-memoized <BracketOrders>.
    const handleBracketChange = useCallback((value: any) => {
        // isTake/isStop are set true here unconditionally, exactly as web does in
        // TradeActionPanel.jsx's <BracketOrder handleChange> ({...formData,
        // takeProfit, stopLoss, isStop: true, isTake: true}). They were previously
        // derived at submit time from `!isEmpty(stopPrice)`, and isEmpty() returns
        // TRUE for the number 0 - so a bracket leg that came out as numeric 0
        // silently sent isTake/isStop: false, the backend skipped bracket creation
        // entirely, and the entry order still succeeded. Result: a success toast,
        // no error, and no TP/SL anywhere - not on the chart, not in the position,
        // not even after a reload, because nothing was ever persisted. Reaching
        // this callback at all means the user confirmed the bracket sheet, which
        // is precisely what web treats as "bracket attached".
        setBracketOrder({
            takeProfit: value.takeProfit,
            stopLoss: value.stopLoss,
            isTake: true,
            isStop: true,
        });
        hookFnsRef.current.closebottomsheet(addBracketref);
    }, []);

    const removeBracketOrders = useCallback(() => {
        setBracketOrder(DEFAULT_BRACKET_ORDER);
    }, []);

    // The bracket block is only RENDERED for limit/market/maker-only entries (see
    // the same list guarding the UI further down), so attaching a bracket and then
    // switching to Stop Limit / Stop Market / Trailing Stop used to just hide it
    // while the state stayed behind. That was harmless only because the payload was
    // gated on the same list; now that the legs and flags always go out (web
    // parity), a stale bracket would ride along on an order type that can't take
    // one - and the backend's StopMarketOrderValidate rejects `isTake` truthy with
    // a 400 "Take profit price is required" (futureValidation.js:452-467, checking
    // a flat takeProfitPrice field neither client sends). Clearing it on the switch
    // keeps those order types placing exactly as they did before, and matches what
    // the hidden UI already implies. Web carries this latent bug; we don't.
    useEffect(() => {
        if (!["limit", "market", "makeronly"].includes(orderType)) {
            setBracketOrder((prev: any) => (prev.isTake || prev.isStop ? DEFAULT_BRACKET_ORDER : prev));
        }
    }, [orderType]);

    // "makeronly" and "trailingStop" are UI-only concepts - the backend's orderType
    // enum only accepts [limit, market, stop_market, stop_limit, take_profit,
    // take_profit_limit] (see futureValidation.js's OrderTypes list). Web remaps these
    // two right before submitting (TradeActionCard.jsx orderPlacing()) and sends the
    // real distinction via separate makeronly/isTrailingOrder flags instead - mobile
    // was sending "makeronly"/"trailingStop" straight through as orderType, which the
    // backend always rejected with "order type is invalid".
    const backendOrderType = orderType === "makeronly" ? "limit" : orderType === "trailingStop" ? "stop_market" : orderType;
    const isTrailingOrder = orderType === "trailingStop";

    // Validates and builds what the PlaceOrder confirmation sheet needs to display
    // (quantity/price/margin/fees etc.), then opens it - this is what the Buy/Sell
    // button now calls. The actual API submission only happens once the user
    // reviews that sheet and taps "Place Order" inside it (placeOrder() below),
    // same two-step flow the older buysell.tsx screen already uses. Previously this
    // screen's button called placeOrder() directly with no review step at all.
    const reviewOrder = () => {
        if (!tradePair._id) {
            failuretoast("Error", "Please wait, pair is loading");
            return;
        }
        if (!numericQuantity || numericQuantity <= 0) {
            failuretoast("Error", "Enter a valid quantity");
            return;
        }
        setConfirmData({
            orderType: backendOrderType,
            price: orderType === "market" ? tradePair.marketPrice : price,
            quantity: numericQuantity,
            stopPrice,
            margin: marginRequired,
            fees,
        });
        // Dismiss any open price/quantity input keyboard first, otherwise the confirm
        // sheet presents underneath the still-visible keyboard instead of cleanly above it.
        Keyboard.dismiss();
        openbottomsheet(placeOrderref);
    };

    // tradePair.marketPrice ticks on every futureTicker socket update - read from a ref
    // instead of closing over it directly, so this useCallback (passed into the now-
    // memoized <PlaceOrder>) doesn't get a new reference on every tick, only when the
    // user actually changes something on the form.
    const marketPriceRef = useRef(tradePair.marketPrice);
    marketPriceRef.current = tradePair.marketPrice;

    const placeOrder = useCallback(async () => {
        const { successtoast, failuretoast } = hookFnsRef.current;
        if (!tradePair._id) {
            failuretoast("Error", "Please wait, pair is loading");
            return;
        }
        if (!numericQuantity || numericQuantity <= 0) {
            failuretoast("Error", "Enter a valid quantity");
            return;
        }
        try {
            const payload: any = {
                pairId: tradePair._id,
                price: orderType === "market" ? marketPriceRef.current : price,
                quantity: numericQuantity,
                buyorsell: actions,
                orderType: backendOrderType,
                stopPrice,
                reduce_only: reduceOnly,
                makeronly: makerOnly,
                leverage,
            };
            console.log("placeOrder__payload", payload, "isTrailingOrder", isTrailingOrder, "stopPrice", stopPrice, "marketPriceRef.current", marketPriceRef.current);
            if (isTrailingOrder) {
                payload.isTrailingOrder = true;
                payload.trailPrice = stopPrice;
                payload.trailTypePrice = marketPriceRef.current;
            }
            // Bracket legs + flags go out on EVERY order, unconditionally, exactly as
            // web does (TradeActionCard.jsx orderPlacing() spreads the whole formData
            // - takeProfit/stopLoss/isTake/isStop are always present, and web gates
            // only the *UI* on ['limit','market','makeronly'], never the payload).
            // The previous `if (...includes(orderType))` gate here was mobile-only:
            // it silently dropped the bracket from the body for any other entry type,
            // whereas web relies solely on isTake/isStop to say whether a bracket is
            // attached. When no bracket is attached these are the untouched
            // DEFAULT_BRACKET_ORDER values (empty strings + isTake/isStop false),
            // byte-identical to web's initialState, and the backend ignores them.
            payload.takeProfit = bracketOrder.takeProfit;
            payload.stopLoss = bracketOrder.stopLoss;
            payload.isTake = bracketOrder.isTake;
            payload.isStop = bracketOrder.isStop;
            const response = await futureOrderPlacing(payload).unwrap();
            console.log("🚀 ~ BuysellNew ~ response:", response)
            if (response.success) {
                successtoast("Success", response.message);
                setQuantity("");
                setSelectedPercentage(null);
                setBracketOrder(DEFAULT_BRACKET_ORDER);
            } else {
                failuretoast("Error", response.message || "Something went wrong!");
            }
        } catch (e) {
            console.log("placeOrder__err", e);
        }
    }, [tradePair._id, numericQuantity, orderType, price, actions, backendOrderType, stopPrice, reduceOnly, makerOnly, leverage, isTrailingOrder, bracketOrder, futureOrderPlacing]);

    return (
        // Not flex:1 - this is the only place BuysellNew is embedded (future.tsx),
        // where it sits in a column next to the order book and needs to report its
        // own true content height (ending at the Buy/Sell button) via onLayout, so
        // that measurement can cap the order book's height. flex:1 here previously
        // stretched this to fill all remaining space down the screen regardless of
        // its actual content, which silently defeated that cap.
        <View>
            {/* ========================================= */}
            {/* BUY / SELL */}
            {/* ========================================= */}

            <View
                style={{
                    flexDirection: "row",
                    width: "100%",
                    alignSelf: "stretch",
                    marginTop: RFvalue(6),
                    gap: 10,
                }}
            >
                <Pressable
                    onPress={() => setAction("buy")}
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 7,
                        borderRadius: borderradius * 0.6,
                        backgroundColor: actions === "buy" ? "#2563EB" : (theme.theme === "dark" ? "#111A2D" : "#FFFFFF"),
                        borderWidth: 1,
                        borderColor: actions === "buy" ? "#2563EB" : theme.boderColor,
                    }}
                >
                    <Text
                        family={actions === "buy" ? "semiBold" : "regular"}
                        fontSize={RFvalue(10)}
                        color={actions === "buy" ? Colors.white : theme.secondarytext}
                    >
                        BUY / LONG
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setAction("sell")}
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 10,
                        borderRadius: borderradius * 0.6,
                        backgroundColor: actions === "sell" ? Colors.red : (theme.theme === "dark" ? "#111A2D" : "#FFFFFF"),
                        borderWidth: 1,
                        borderColor: actions === "sell" ? Colors.red : theme.boderColor,
                    }}
                >
                    <Text
                        family={actions === "sell" ? "semiBold" : "regular"}
                        fontSize={RFvalue(10)}
                        color={actions === "sell" ? Colors.white : theme.secondarytext}
                    >
                        SELL / SHORT
                    </Text>
                </Pressable>
            </View>

            {/* ========================================= */}
            {/* LEVERAGE + MARGIN */}
            {/* ========================================= */}

            <Flexcomponent
                justifyContent="space-between"
                style={{
                    marginTop: RFvalue(8),
                }}
            >
                {/* LEVERAGE */}

                <Pressable
                    style={[
                        style.card,
                        {
                            width: "48%",
                            paddingVertical: "3%",
                            paddingHorizontal: "4%",
                            borderWidth: 0.8,
                            borderColor: theme.theme == 'dark' ? "#F1F5F9" : "#E2E8F0",
                            backgroundColor: theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                        },
                    ]}
                >
                    <Flexcomponent ispress={true} onPress={() => setLeverageVisible(true)} justifyContent="space-between" >
                        {/* Value only, no "Leverage" label. numoflines={1} + flexShrink so a
                               wide decimal value ("39.04x") ellipsizes instead of pushing the
                               chevron past the pill's right edge. */}
                        <Text
                            numoflines={1}
                            color={Colors.brand}
                            fontSize={RFvalue(10)}
                            style={{ flexShrink: 1, marginRight: 4 }}
                        >
                            {Number(leverage).toFixed(Number.isInteger(Number(leverage)) ? 0 : 1)}x
                        </Text>

                        <VectorIcons
                            family="Ionicons"
                            name="chevron-down"
                            iconcolor={theme.inversetext}
                            size={13}
                            style={{ flexShrink: 0 }}
                        />
                    </Flexcomponent>
                </Pressable>

                {/* MARGIN */}

                <Pressable
                    style={[
                        style.card,
                        {
                            width: "48%",
                            paddingVertical: "3%",
                            paddingHorizontal: "4%",
                            borderWidth: 0.8,
                            borderColor: theme.theme == 'dark' ? "#F1F5F9" : "#E2E8F0",
                            backgroundColor: theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                        },
                    ]}
                    onPress={() => {
                        openbottomsheet(updateMarginsheetref);
                    }}
                >
                    <Flexcomponent justifyContent="space-between">
                        <Text
                            style={{
                                textTransform: "capitalize",
                            }}
                            fontSize={RFvalue(10)}
                        >
                            {marginMode}
                        </Text>

                        <VectorIcons
                            family="Ionicons"
                            name="chevron-down"
                            iconcolor={theme.inversetext}
                            size={13}
                        />
                    </Flexcomponent>
                </Pressable>

            </Flexcomponent>

            {/* ========================================= */}
            {/* LIMIT / MARKET */}
            {/* ========================================= */}

            <View
                style={{
                    marginTop: RFvalue(8),
                    marginBottom: RFvalue(8),
                    borderBottomWidth: 0.8,
                    borderBottomColor: theme.theme == 'dark' ? "#F1F5F9" : "#E2E8F0",
                    paddingBottom: RFvalue(6),
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* LIMIT */}

                    <Pressable
                        style={{
                            width: "18%",
                        }}
                        onPress={() => changeOrderType("limit")}
                    >
                        <Text
                            family="medium"
                            size="small"
                            color={
                                orderType === "limit"
                                    ? theme.futuretext
                                    : Colors.grey
                            }
                        >
                            Limit
                        </Text>
                    </Pressable>

                    {/* MARKET */}

                    <Pressable
                        style={{
                            width: "28%",
                        }}
                        onPress={() => changeOrderType("market")}
                    >
                        <Text
                            family="medium"
                            size="small"
                            color={
                                orderType === "market"
                                    ? theme.futuretext
                                    : Colors.grey
                            }
                        >
                            Market
                        </Text>
                    </Pressable>

                    {/* STOP */}

                    <Pressable
                        style={{
                            width: "40%",
                        }}
                        onPress={() => {
                            // Default to the first sheet item (Stop Limit) only when
                            // nothing from this sheet is already selected (i.e. still on
                            // Limit/Market) - so the sheet never opens with nothing
                            // highlighted, but reopening it after a real pick still shows
                            // that actual pick instead of resetting it.

                            if (!ADVANCED_ORDER_TYPE_LABELS[orderType]) {
                                setOrderType("stop_limit");
                            }
                            openbottomsheet(profitOptionref);
                        }}
                    >
                        <Flexcomponent justifyContent="flex-end">
                            <Text
                                family="medium"
                                size="small"
                                numoflines={1}
                                color={
                                    ADVANCED_ORDER_TYPE_LABELS[orderType]
                                        ? theme.futuretext
                                        : Colors.grey
                                }
                            >
                                {ADVANCED_ORDER_TYPE_LABELS[orderType] ?? "Stop Limit"}
                            </Text>

                            <VectorIcons
                                family="Feather"
                                name="chevron-down"
                                iconcolor={
                                    ADVANCED_ORDER_TYPE_LABELS[orderType]
                                        ? theme.futuretext
                                        : Colors.grey
                                }
                                size={16}
                            />
                        </Flexcomponent>
                    </Pressable>
                </View>
            </View>

            {/* ========================================= */}
            {/* PRICE */}
            {/* ========================================= */}

            {!["makeronly", "market", "stop_market", "take_profit", "trailingStop"].includes(orderType) && (
                <Input
                    value={price}
                    placeHolder="Price"
                    themes={theme}
                    keyboardType="numeric"
                    allowed="number"
                    onChange={(text) => setPrice(text)}
                    // Default box height (Input.tsx) is windowheight*0.06 - visibly taller
                    // than every other compact row on this screen (leverage pills, order-
                    // type tabs, percentage buttons), which is what made this and the
                    // Quantity box below look oversized against the rest of the tightened form.
                    bottom={RFvalue(6)}
                    labelStyle={{
                        color: Colors.grey,
                    }}
                    style={[
                        style.buySellInput,
                        { textAlign: 'left', marginRight: 0, height: RFvalue(36) },
                    ]}
                    rightContent={
                        <View style={style.input}>
                            <Text
                                color={theme.theme === 'dark' ? Colors.white : Colors.black}
                                size="small"
                            >
                                {formatDisplayPair(tradePair.quoteCurrency)}
                            </Text>
                        </View>
                    }
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
            )}

            {/* ========================================= */}
            {/* QUANTITY */}
            {/* ========================================= */}

            <Input
                label="Quantity"
                value={quantity}
                placeHolder={`1 Lot = ${tradePair.minAmount} ${tradePair.baseCurrency}`}
                allowed="number"
                keyboardType="numeric"
                bottom={RFvalue(6)}
                style={[style.quantity, { textAlign: 'left', marginRight: 0, paddingLeft: 0, height: RFvalue(36) }]}
                onChange={(text) => {
                    setQuantity(text);
                    setSelectedPercentage(null);
                }}
                rightContent={
                    <View style={style.quan}>
                        <Dropdown
                            themes={theme}
                            placeholder=""
                            value={quantityIn}
                            height={RFvalue(30)}
                            textStyle={{
                                fontSize: 11,
                            }}
                            itemTextStyle={{
                                fontSize: 11,
                            }}
                            conatinerstyle={{
                                width: windowwidth * 0.14,
                            }}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            inputStyle={{
                                elevation: 0,
                                borderColor:
                                    theme.theme === "dark"
                                        ? "#131D31"
                                        : "#FFFFFF",
                                borderradius: 5
                            }}
                            list={quantityUnitList}
                            onChange={(value) => {
                                setQuantityIn(value?.value);
                            }}
                        />
                    </View>
                }
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            {/* ========================================= */}
            {/* 25 / 50 / 75 / 100 */}
            {/* ========================================= */}

            <Flexcomponent
                justifyContent="space-between"
                style={{
                    marginTop: RFvalue(6),
                    marginBottom: RFvalue(8)
                }}
            >
                {quantityPercentage.map((percent) => (
                    <Pressable
                        key={percent}
                        onPress={() => handlePercentage(percent)}
                        style={[
                            style.percent,
                            {
                                width: "22%",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor:
                                    selectedPercentage === percent
                                        ? theme.theme === "dark"
                                            ? "#111A2D"
                                            : Colors.dustygrey
                                        : theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
                            },
                        ]}
                    >
                        <Text
                            size="small"
                            color={theme.darktext}
                        >
                            {percent}%
                        </Text>
                    </Pressable>
                ))}
            </Flexcomponent>

            {/* ========================================= */}
            {/* BRACKET ORDER */}
            {/* ========================================= */}

            {/* Ported from the older buysell.tsx screen - same limit/market/maker-only
                    gating, same underlying BracketOrders sheet and payload shape. Not
                    available for Stop Limit/Stop Market/Trailing Stop, matching the old UI. */}
            {["limit", "market", "makeronly"].includes(orderType) && (
                bracketAttached ? (
                    <View style={{ marginTop: RFvalue(8) }}>
                        <Flexcomponent justifyContent="space-between">
                            <Text fontSize={RFvalue(11)} family="medium">
                                Bracket Order
                            </Text>
                            <View style={{ flexDirection: "row", gap: 16 }}>
                                <Pressable onPress={() => openbottomsheet(addBracketref)} hitSlop={8}>
                                    <VectorIcons
                                        family="Feather"
                                        name="edit-2"
                                        size={RFvalue(13)}
                                        iconcolor={theme.futuretext}
                                    />
                                </Pressable>
                                <Pressable onPress={removeBracketOrders} hitSlop={8}>
                                    <VectorIcons
                                        family="Feather"
                                        name="trash-2"
                                        size={RFvalue(13)}
                                        iconcolor={Colors.red}
                                    />
                                </Pressable>
                            </View>
                        </Flexcomponent>
                        <Text
                            fontSize={RFvalue(10)}
                            color={theme.theme == 'dark' ? "#9096A1" : theme.graytext}
                            style={{ marginTop: 4 }}
                        >
                            TP: {bracketOrder.takeProfit.stopPrice}
                            {bracketOrder.takeProfit.orderType === "bracket_tp_limit" ? ` / ${bracketOrder.takeProfit.price}` : ""}
                        </Text>
                        <Text
                            fontSize={RFvalue(10)}
                            color={theme.theme == 'dark' ? "#9096A1" : theme.graytext}
                            style={{ marginTop: 2 }}
                        >
                            SL: {bracketOrder.stopLoss.stopPrice}
                            {bracketOrder.stopLoss.orderType === "bracket_sl_limit" ? ` / ${bracketOrder.stopLoss.price}` : ""}
                        </Text>
                    </View>
                ) : (
                    <Flexcomponent justifyContent="space-between" style={{ marginTop: RFvalue(8) }}>
                        <Text fontSize={RFvalue(11)} family="medium">
                            Bracket Order
                        </Text>
                        <Pressable
                            onPress={() => openbottomsheet(addBracketref)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                paddingVertical: 4,
                                paddingHorizontal: 10,
                                borderRadius: borderradius * 0.5,
                                backgroundColor: theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                                borderWidth: 0.8,
                                borderColor: theme.theme == 'dark' ? "#F1F5F9" : "#E2E8F0",
                            }}
                        >
                            <VectorIcons
                                family="Ionicons"
                                name="add"
                                size={RFvalue(13)}
                                iconcolor={theme.futuretext}
                            />
                            <Text fontSize={RFvalue(11)} color={theme.futuretext}>
                                Add
                            </Text>
                        </Pressable>
                    </Flexcomponent>
                )
            )}

            {/* ========================================= */}
            {/* STOP PRICE */}
            {/* ========================================= */}

            {orderType === "makeronly" ? (
                <Input
                    value={price}
                    placeHolder="Price"
                    themes={theme}
                    allowed="number"
                    keyboardType="numeric"
                    onChange={(text) => setPrice(text)}
                    labelStyle={{
                        color: Colors.grey,
                    }}
                    style={[style.buySellInput, { textAlign: 'left', marginRight: 0 }]}
                    rightContent={
                        <View style={style.input}>
                            <Text
                                color={theme.theme === 'dark' ? Colors.white : Colors.black}
                                size="small"
                            >
                                {formatDisplayPair(tradePair.quoteCurrency)}
                            </Text>
                        </View>
                    }
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
            ) : !["limit", "market"].includes(orderType) && (
                <Input
                    value={stopPrice}
                    placeHolder={orderType === "trailingStop" ? "Trail Amount" : "Stop Price"}
                    themes={theme}
                    allowed="number"
                    keyboardType="numeric"
                    onChange={(text) => setStopPrice(text)}
                    labelStyle={{
                        color: Colors.grey,
                    }}
                    style={[style.buySellInput, { textAlign: 'left', marginRight: 0 }]}
                    rightContent={
                        <View style={style.input}>
                            <Text
                                color={theme.theme === 'dark' ? Colors.white : Colors.black}
                                size="small"
                            >
                                {formatDisplayPair(tradePair.quoteCurrency)}
                            </Text>
                        </View>
                    }
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
            )}

            {/* ========================================= */}
            {/* REDUCE ONLY / MAKER ONLY */}
            {/* ========================================= */}

            {/* Single line, always - a row-level flexWrap fallback here previously
                    let "Maker Only" drop to its own line under "Reduce Only" whenever iOS's
                    slightly wider system-font metrics (vs. Android, at the same point size)
                    pushed the combined width just over the column's edge - inconsistent and
                    not the intended layout. Smaller checkbox boxes/font + a tighter gap keep
                    both comfortably on one line on every platform instead of relying on wrap.
                    flexShrink stays only as a last-resort safety net (an individual label
                    wrapping within its own text, not the whole row breaking). */}
            <Flexcomponent
                justifyContent="flex-start"
                style={{
                    marginTop: RFvalue(8),
                }}
            >
                <View style={{ flexShrink: 1 }}>
                    <Input
                        type="checkbox"
                        label="Reduce Only"
                        boxstyle={[style.check, { width: 18, height: 18 }]}
                        initial={reduceOnly}
                        onChange={(value) =>
                            setReduceOnly(value)
                        }
                        labelStyle={{ fontSize: RFvalue(10) }}
                        background={theme.theme == 'dark' ? "#111A2D" : "#FFFFFF"}

                    />
                </View>

                {(orderType === "limit" || orderType === "makeronly") && (
                    <View
                        style={{
                            marginLeft: 8,
                            flexShrink: 1,
                        }}
                    >
                        <Input
                            type="checkbox"
                            label="Maker Only"
                            boxstyle={[style.check, { width: 18, height: 18 }]}
                            initial={makerOnly}
                            onChange={(value) => {
                                setMakerOnly(value);
                                // "makeronly" is also its own selectable order type from
                                // the ProfitOption sheet - keep this checkbox and orderType
                                // in sync regardless of which one the user interacts with.
                                setOrderType(value ? "makeronly" : "limit");
                            }}
                            labelStyle={{ fontSize: RFvalue(10) }}
                            background={theme.theme == 'dark' ? "#111A2D" : "#FFFFFF"}
                        />
                    </View>
                )}
            </Flexcomponent>

            {/* ========================================= */}
            {/* ORDER SUMMARY - each label and its value sit on the same line */}
            {/* ("Available          0.00 USD"), not label-above-value-below - that */}
            {/* read as two disconnected lines instead of one clear fact. Kept as one */}
            {/* pair per full-width row (not 2 crammed side by side) so neither the */}
            {/* label nor the value has to wrap on a narrow device. */}
            {/* ========================================= */}


            <View
                style={{
                    marginTop: RFvalue(8),
                    borderTopWidth: 1,
                    borderTopColor:
                        theme.theme === "dark"
                            ? Colors.grey
                            : theme.boderColor,
                    paddingTop: RFvalue(6),
                }}
            >
                <Flexcomponent justifyContent="space-between">
                    <Text color={theme.theme == 'dark' ? "#9096A1" : theme.graytext} fontSize={RFvalue(12)} style={{ flexShrink: 1 }}>
                        Available
                    </Text>
                    <Text numoflines={1} fontSize={RFvalue(11)} style={{ textAlign: "right", flexShrink: 1 }}>
                        {availableBalance.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

                {/* Fees and Order Cost rows are intentionally hidden from the order
                        placing screen - the values are still rolled into Margin Required. */}

                <Flexcomponent justifyContent="space-between" style={{ marginTop: RFvalue(4) }}>
                    <Text color={theme.theme == 'dark' ? "#9096A1" : theme.graytext} fontSize={RFvalue(12)}>
                        Total
                    </Text>
                    <Text numoflines={1} fontSize={RFvalue(11)} style={{ textAlign: "right", flexShrink: 1 }}>
                        {orderValue.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

                <View
                    style={{
                        marginTop: RFvalue(8),
                        borderTopWidth: 1,
                        borderTopColor:
                            theme.theme === "dark"
                                ? Colors.grey
                                : theme.boderColor,
                        paddingTop: RFvalue(6),
                    }}
                >
                    {/* No fixed width on the value here (unlike an earlier pass) - that
                            was sized for a wider 53% column and, under the current 50%
                            column, pushed the value ("0.00 USD") off the right edge where
                            it got hard-clipped by the screen instead of wrapping/shrinking. */}
                    <Flexcomponent justifyContent="space-between">
                        <Text color={theme.theme == 'dark' ? "#9096A1" : theme.graytext} family="medium" fontSize={RFvalue(12)} style={{ flexShrink: 1 }}>
                            Margin Required
                        </Text>

                        <Text
                            numoflines={1}
                            family="medium"
                            fontSize={RFvalue(12)}
                            style={{
                                flexShrink: 1,
                                textAlign: "right",
                            }}
                        >
                            {marginRequired.toFixed(2)}{" "}
                            {formatDisplayPair(tradePair.quoteCurrency)}
                        </Text>
                    </Flexcomponent>
                </View>
            </View>

            {/* ========================================= */}
            {/* BUY / SELL BUTTON */}
            {/* ========================================= */}

            <Button
                title={
                    actions === "buy"
                        ? `Buy ${tradePair.baseCurrency ?? ""}`
                        : `Sell ${tradePair.baseCurrency ?? ""}`
                }
                style={[
                    style.sell,
                    {
                        marginTop: RFvalue(8),
                        width: "100%",
                        backgroundColor:
                            actions === "buy"
                                ? "#2563EB"
                                : Colors.red,
                    },
                ]}
                loading={orderLoading}
                onPress={reviewOrder}
                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
            />

            <PlaceOrder
                ref={placeOrderref}
                action={actions}
                screen={true}
                loading={orderLoading}
                formData={confirmData}
                orderPlacing={placeOrder}
            />

            <ProfitOption
                ref={profitOptionref}
                formData={profitOptionFormData}
                onChange={handleOrderListSelect}
            />

            <BracketOrders
                ref={addBracketref}
                formData={bracketFormData}
                handleChange={handleBracketChange}
            />

            <UpdateMargin
                ref={updateMarginsheetref}
                value={marginMode}
                accountId={activeAccountId}
                title="Change Margin mode"
                onClose={closeUpdateMargin}
                confirm={closeUpdateMargin}
                onContinue={closeUpdateMargin}
            />

            <Leverage
                visible={leverageVisible}
                onClose={closeLeverage}
                margin={marginMode}
                leverage={Number(leverage)}
                changeLeverage={changeLeverage}
                max={marginMode === "portfolio" ? 200 : Number(tradePair?.max_leverage) || 100}
                loading={levgLod}
            />
        </View>
    );
};

// Embedded in future.tsx (`<BuysellNew />`, no props), which re-renders on every
// futureTicker price tick. Without memo, each of those ticks re-rendered this whole
// ~680-line form tree even though nothing it shows had changed - pure JS-thread work
// competing with sheet open/close animations and their teardown. memo bails on the
// empty props object every time, so it now only re-renders on its own useSelector
// subscriptions actually changing.
export default React.memo(BuysellNew);