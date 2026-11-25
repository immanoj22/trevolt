import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Menu, MenuOption, MenuOptions, MenuTrigger } from "react-native-popup-menu";

import Leverage from "./Popup/Leverage";
import Text from "../../Components/text";
import Bookcomponent from "../Future/book"
import PlaceOrder from "./Popup/PlaceOrder";
import Images from "../../Utilities/images";
import ProfitOption from "./Popup/ProfitOption";
import { futureState } from "../../Actions/type";
import Mainview from "../../Components/mainview";
import BracketOrders from "./Popup/BracketOrders";
import AccountMargin from "./Popup/AccountMargin";
import Linecomponent from "../../Components/line";
import { setUserLeverage } from "../../Slices/auth";
import VectorIcons from "../../Utilities/vectoricons";
import useApiError from "../../Actions/Hooks/errorhook";
import Flexcomponent from "../../Components/flexcomponent";
import { Colors, Fontsize } from "../../Utilities/uiasset";
import { optionTradeSelector, useOptionPlaceMutation } from "../../Slices/option";
import { Button, Dropdown, Input } from "../../Components/Field";
import { playSound, soundMap } from "../../Components/Field/Button";
import usePortfolioHook from "../../Actions/Hooks/usePortfolioHook";
import UpdateMargin from "../Profile/SubAccount/Manage/UpdateMargin";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../Utilities/dimensions";
import { formatValue, getOrderTypeLabel, isEmpty, toCutOff } from "../../Utilities/helerfunction";
import { useFutureLeverageMutation, useFutureOrderPlacingMutation } from "../../Slices/future";
import { LotToquantity, quantityToLot, QuantityToVolume, VolumeToquantity } from "../../Actions/Hooks/usePriceConversion";
import { formatDisplayPair } from "../../Utilities/formatPair";

import { styles } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Buysell'>;

// Lets this screen also be rendered inline (e.g. embedded in the Option contract
// detail dashboard, matching how BuysellNew is embedded in the Future tab) instead of
// only as a pushed stack screen — the caller passes pageName/screen/data directly
// instead of them arriving via route.params, and can supply onClose since there's no
// navigation.goBack() to return to when there was no push in the first place.
interface BuysellEmbedProps {
    pageName?: any
    screen?: any
    data?: any
    embedded?: boolean
    onClose?: () => void
}

const quantityPercentage = [25, 50, 75, 100]

const Buysell: React.FC<Partial<Props> & BuysellEmbedProps> = ({ route, pageName: pageNameProp, screen: screenProp, data: dataProp, embedded, onClose }) => {
    const { theme, navigation, bottomsheetref, closebottomsheet, openbottomsheet, successtoast, failuretoast, dispatch } = useCustomHooks();
    const style = styles(theme);
    // useCustomHooks() rebuilds successtoast/failuretoast fresh every render, so they
    // can't be useCallback deps without defeating the memoized <Leverage> popup (it
    // stays mounted and re-renders on every socket tick otherwise). Read the latest
    // ones from a ref instead - same pattern buysellNew.tsx uses.
    const hookFnsRef = useRef({ successtoast, failuretoast });
    hookFnsRef.current = { successtoast, failuretoast };
    const pageName = pageNameProp ?? route?.params?.pageName;
    const screen = screenProp ?? route?.params?.screen;
    const data = dataProp ?? route?.params?.data;
    const Wrapper: any = embedded ? View : Mainview;
    const wrapperProps: any = embedded
        ? { style: { flex: 1, paddingHorizontal: "5%" } }
        : { isheader: false, horizontalpadding: "5%" };
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureMakerFee = useSelector((state: any) => state.future.makerFee);
    const futureTakerFee = useSelector((state: any) => state.future.takerFee);
    const { makerFee: optionMakerFee, takerFee: optionTakerFee, premiumPercentage: optionPremiumPercentage } = useSelector(optionTradeSelector);

    const isOption = screen === "options";
    const makerFee = isOption ? optionMakerFee : futureMakerFee;
    const takerFee = isOption ? optionTakerFee : futureTakerFee;

    const tradePair = data ? data : futureTradePair;

    const initialMarketPrice = isOption ? tradePair?.marketPrice : futureTicker?.marketPrice;

    const initialState = {
        pairId: tradePair?._id,
        price: initialMarketPrice,
        quantity: "",
        buyorsell: pageName === "sell" ? "sell" : "buy",
        reduce_only: false,
        makeronly: false,
        isTrailingOrder: false,
        trailPrice: "",
        trailTypePrice: initialMarketPrice,
        trailType: "market",
        orderType: "limit",
        isTake: false,
        isStop: false,
        typeTIF: "",
        orderCost: "",
        orderValue: "",
        margin: "",
        fees: "",
        stopPrice: "",
        leverage: 1,
        takeProfit: {
            stopPrice: "",
            price: "",
            orderType: "bracket_tp_market"
        },
        stopLoss: {
            stopPrice: "",
            price: "",
            orderType: "bracket_sl_market"
        }
    }

    const updateMarginsheetref = useRef<BottomSheetModal>(null);
    const placeOrderref = useRef<BottomSheetModal>(null);
    const profitOptionref = useRef<BottomSheetModal>(null);
    const addBracketref = useRef<BottomSheetModal>(null);
    // Leverage no longer uses a bottom-sheet ref — it's a CenterModal driven by state
    const [leverageVisible, setLeverageVisible] = useState(false);
    const userLeverage = useSelector((state: any) => state.auth.leverage);
    const { accountName, marginMode, accountId, kycStatus, pairSettings, userId } = useSelector((state: any) => state.auth.userData);

    const { wallet } = useSelector((state: any) => state.wallet);
    const [actions, setAction] = useState(pageName);
    const [formData, setFormData] = useState<futureState>(initialState);

    const [leverage, setLeverage] = useState(userLeverage ?? 1);
    const [expand, setExpand] = useState(true);
    const [balPrecen, setBalPrecen] = useState<any>('0');
    const [quantityIn, setQuantityIn] = useState('lot');
    // Must stay a stable reference, not an inline `list={[...]}` literal - the
    // underlying react-native-element-dropdown re-runs a useEffect keyed on this
    // array's identity and calls setListData whenever it changes. A fresh literal
    // every render was retriggering that effect on every live-price socket tick,
    // which was enough to trip React's "Maximum update depth exceeded" guard.
    const quantityUnitList = useMemo(() => ([
        {
            label: tradePair?.baseCurrency, value: tradePair?.baseCurrency
        },
        {
            label: "Lot", value: "lot"
        },
        {
            label: formatDisplayPair("USDT"), value: tradePair?.quoteCurrency
        },
    ]), [tradePair?.baseCurrency, tradePair?.quoteCurrency]);
    const [lotQuantity, setlotQuantity] = useState('');
    const [isEdit, setIsEdit] = useState<any>(false);
    const [cardDetails, setCardDetails] = useState<any>({
        orderCost: 0,
        orderValue: 0,
        margin: 0,
        fees: 0,
    })
    const { computeOrderIncrementalMargin } = usePortfolioHook();

    const [orderType, setOrderType] = useState("Default");

    const [futureOrderPlacing, { isLoading, error }] = useFutureOrderPlacingMutation();
    const [optionOrderPlacing, { isLoading: optionLoading, error: optionError }] = useOptionPlaceMutation();
    const [futureChangeLeverage, { isLoading: levgLod, error: levgErr }] = useFutureLeverageMutation();

    useApiError(error ?? levgErr ?? optionError);

    const handleOrderListSelect = (value: any) => {
        setBalPrecen('');
        setlotQuantity('');

        setFormData(prev => ({
            ...prev,
            quantity: "",
            orderCost: 0,
            orderValue: 0,
            margin: 0,
            fees: 0,
            orderType: value,
            makeronly: value === 'makeronly' ? true : false,
            isTrailingOrder: value === 'trailingStop' ? true : false,
        }));

        setCardDetails({
            orderCost: 0,
            orderValue: 0,
            margin: 0,
            fees: 0,
        })
        closebottomsheet(bottomsheetref);
    };

    const calculateOrderValue = async (quantity: any, price: any) => {
        if (isOption) {
            const underlyingMarketPrice = parseFloat(tradePair?.underlyingPrice) || parseFloat(tradePair?.marketPrice) || price;
            const premiumRaw: any = quantity * price;
            const notionalRaw: any = quantity * underlyingMarketPrice;
            const orderValueRaw: any = formData.buyorsell === 'sell' ? notionalRaw : premiumRaw;
            const orderCostRaw: any = formData.buyorsell === 'sell' ? (premiumRaw / (leverage ? leverage : 1)) : premiumRaw;

            const orderValue = isNaN(orderValueRaw) ? 0 : orderValueRaw;
            const orderCost = isNaN(orderCostRaw) || !isFinite(orderCostRaw) ? 0 : orderCostRaw;

            let fees: any = Math.min((optionPremiumPercentage / 100) * premiumRaw, (takerFee / 100) * notionalRaw);
            fees = fees * 2 * 1.18;
            fees = isNaN(fees) || !isFinite(fees) ? 0 : fees;

            let margin: any = parseFloat(orderCost) + parseFloat(fees);
            margin = isNaN(margin) || !isFinite(margin) ? 0 : margin;

            setCardDetails({ orderValue, orderCost, fees, margin });
            return;
        }

        const orderValueRaw: any = quantity * price;
        const orderValue = isNaN(orderValueRaw)
            ? 0
            : orderValueRaw;
        const orderCostRaw: any = marginMode == 'portfolio' ?
            await computeOrderIncrementalMargin({
                price: price,
                quantity: quantity,
                tradeMode: 'future',
                buyorsell: formData.buyorsell
            }, tradePair) :
            (quantity * price) / (leverage ? leverage : 1);
        let EffectiveLeverage: any = 0
        if (marginMode == 'portfolio') {
            EffectiveLeverage = parseFloat(orderValueRaw) / parseFloat(orderCostRaw)
            EffectiveLeverage = isNaN(EffectiveLeverage) || !isFinite(EffectiveLeverage) ? 0 : parseFloat(EffectiveLeverage).toFixed(2)
            setLeverage(EffectiveLeverage)
        }
        const orderCost = isNaN(orderCostRaw) || !isFinite(orderCostRaw) ? 0 : orderCostRaw;

        /** Calculate Fee */
        let fees: any = (orderValueRaw * takerFee / 100) * 2
        fees = fees * 1.18
        let margin: any = parseFloat(orderCostRaw) + parseFloat(fees)
        fees = isNaN(fees) || !isFinite(fees)
            ? 0 : fees
        margin = isNaN(margin) || !isFinite(margin)
            ? 0 : parseFloat(margin)
        let updatedForm = {
            orderValue,
            orderCost,
            fees,
            margin
        };
        setCardDetails(updatedForm);
    };

    const handleBalanceprecn = (percentage: any) => {
        try {
            const price = ['market', 'trailingStop', 'stop_market', 'take_profit'].includes(formData.orderType)
                ? (isOption ? tradePair?.marketPrice : futureTicker.marketPrice)
                : parseFloat(formData.price);

            if (!price || !isFinite(price)) {
                console.warn("Invalid price", price);
                return;
            }

            let investBalance = (wallet?.availableBalance * (Number(percentage) / 100)) || 0;
            investBalance = Number(investBalance);

            if (percentage === 100) {
                const feePercent = 2 * parseFloat(takerFee);

                const orderValue = investBalance * leverage;
                let fee = orderValue * (feePercent / 100);
                fee = fee * 1.18
                if (!isFinite(fee)) fee = 0;
                investBalance -= fee;
            }

            let quantity = (investBalance / price) * leverage || 0;

            quantity = toCutOff(Number(quantity), tradePair.baseDecimal)
            let lotQuantity: any = quantity
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, tradePair.minAmount, tradePair.baseDecimal)
            } else if (quantityIn == tradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, price, tradePair.baseDecimal)
            }
            setlotQuantity(lotQuantity)
            calculateOrderValue(quantity, price);
            setBalPrecen(percentage);
            setFormData(prev => ({ ...prev, ['quantity']: quantity }));
        } catch (err) {
            console.error("handleBalanceprecn__err", err);
        }
    };

    const onChangeHandler = (name: any, value: any) => {
        try {
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;

            if (['price', 'quantity', 'stopPrice', 'orderType'].includes(name)) {
                if (value !== "" && !numbers.test(value)) return false;
            }
            if (name === 'price' || name == 'stopPrice') {
                const price = ['market', 'stop_market', 'take_profit', 'trailingStop'].includes(formData.orderType)
                    ? (isOption ? tradePair?.marketPrice : futureTicker.marketPrice)
                    : parseFloat(value);
                calculateOrderValue(formData.quantity, price);
            }

            if (name === 'quantity') {
                const price = ['market', 'trailingStop', 'stop_market', 'take_profit'].includes(formData.orderType)
                    ? (isOption ? tradePair?.marketPrice : futureTicker.marketPrice)
                    : parseFloat(formData.price);
                setBalPrecen('0');
                let quantity = value
                if (quantityIn == 'lot') {
                    const decimal = /^[+]?[0-9]+$/;
                    if (value !== "" && !decimal.test(value)) return false;
                    let maxLot = quantityToLot(tradePair.maxAmount, tradePair.minAmount, tradePair.baseDecimal)
                    let minLot = quantityToLot(tradePair.minAmount, tradePair.minAmount, tradePair.baseDecimal)
                    if (parseFloat(value) < parseFloat(minLot) || parseFloat(value) > parseFloat(maxLot)) {
                        let numericValue = parseFloat(value);
                        if (numericValue > parseFloat(maxLot)) {
                            setlotQuantity("");
                            failuretoast("Error!", `Maximum quantity allowed is ${maxLot}`);
                            return;
                        }
                        if (numericValue < parseFloat(minLot)) {
                            setlotQuantity("");
                            failuretoast("Error!", `Minimum quantity required is ${minLot}`);
                            return;
                        }
                        setlotQuantity(value);
                        return false
                    }
                    quantity = LotToquantity(value, tradePair.minAmount, tradePair.baseDecimal)
                } else if (quantityIn == tradePair.quoteCurrency) {
                    quantity = VolumeToquantity(value, price, tradePair.baseDecimal);
                }
                setlotQuantity(value)
                calculateOrderValue(quantity, price);
                setFormData(prev => ({ ...prev, ['quantity']: quantity }));
                return;
            }
            if (name === 'stopPrice' && formData.orderType === 'trailingStop') {
                setFormData(prev => ({ ...prev, trailPrice: value }));
            }
            setFormData(prev => ({ ...prev, [name]: value }));
        } catch (e) {
            console.error("onChangeHandler_err", e);
        }
    };

    const removeBracketOrders = () => {
        setFormData({
            ...formData,
            isTake: false,
            isStop: false,
            takeProfit: {
                stopPrice: "",
                price: "",
                orderType: "bracket_tp_market"
            },
            stopLoss: {
                stopPrice: "",
                price: "",
                orderType: "bracket_sl_market"
            }
        })
    }

    const orderPlacing = async () => {
        try {
            formData['orderType'] = ({ makeronly: "limit", trailingStop: "stop_market" } as Record<string, string>
            )[formData.orderType] || formData.orderType;

            const response = await futureOrderPlacing({ ...formData, leverage: leverage }).unwrap();
            console.log("🚀 ~ orderPlacing ~ response:", response,formData)
            if (response.success) {
                playSound(soundMap.orderPlaced);
                successtoast("Success", response.message);
                setlotQuantity('')
                setBalPrecen('')
                setCardDetails({})
                setFormData({
                    ...initialState, ...{
                        buyorsell: formData.buyorsell,
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                        pairId: formData.pairId,
                        price: formData.price,
                        takeProfit: {
                            stopPrice: "",
                            price: "",
                            orderType: "bracket_tp_market"
                        },
                        stopLoss: {
                            stopPrice: "",
                            price: "",
                            orderType: "bracket_sl_market"
                        }
                    }
                })
            } else {
                setFormData({
                    ...formData, ...{
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                    }
                })
                if (!isEmpty(response.message)) {
                    openbottomsheet(placeOrderref)
                } else {
                    closebottomsheet(placeOrderref)
                }
            }
        } catch (e) {
            console.log("orderPlacing_err", e);
        }
    }

    const optionOrderPlace = async () => {
        try {
            formData['orderType'] = ({ makeronly: "limit", trailingStop: "stop_market" } as Record<string, string>
            )[formData.orderType] || formData.orderType;
            const response = await optionOrderPlacing({ ...formData, leverage: leverage }).unwrap();
            console.log("🚀 ~ optionOrderPlace ~ response:", response,formData,leverage)
            if (response.success) {
                playSound(soundMap.orderPlaced);
                successtoast("Success", response.message);
                setlotQuantity('')
                setBalPrecen('')
                setCardDetails({})
                setFormData({
                    ...initialState, ...{
                        buyorsell: formData.buyorsell,
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                        pairId: formData.pairId,
                        price: formData.price,
                        takeProfit: {
                            stopPrice: "",
                            price: "",
                            orderType: "bracket_tp_market"
                        },
                        stopLoss: {
                            stopPrice: "",
                            price: "",
                            orderType: "bracket_sl_market"
                        },
                        userId: userId
                    }
                })
            } else {
                setFormData({
                    ...formData, ...{
                        orderType: formData.orderType === 'limit' ? formData.orderType : formData.makeronly ? 'makeronly' : formData.isTrailingOrder ? 'trailingStop' : formData.orderType,
                    }
                })
                if (!isEmpty(response.message)) {
                    openbottomsheet(placeOrderref)
                } else {
                    closebottomsheet(placeOrderref)
                }
            }
        } catch (e) {
            console.log("orderPlacing_err", e);
        }
    }

    useEffect(() => {
        if (screen === "options" && actions === "buy") {
            setFormData(prev => ({
                ...prev,
                leverage: 1
            }));
        }
    }, [screen, actions]);

    // Memoized so the prop stays stable across the screen's socket-tick re-renders -
    // the <Leverage> popup is React.memo'd and a fresh function reference every
    // render defeats that, re-rendering the whole popup (and fighting a drag) on
    // every tick. Toasts read from hookFnsRef; setFormData uses the updater form so
    // it doesn't close over a stale `formData`.
    const closeLeverage = useCallback(() => setLeverageVisible(false), []);
    const changeLeverage = useCallback(async (value: any) => {
        const { successtoast, failuretoast } = hookFnsRef.current;
        if (value < 1) return false;
        setFormData(prev => ({ ...prev, leverage: value }))
        const payload = { leverage: value, pairId: tradePair?._id }
        try {
            const response = await futureChangeLeverage(payload).unwrap();
            if (response.success) {
                dispatch(setUserLeverage(value));
                // Set the local badge value directly here, in the same tick as the
                // dispatch above - there used to also be a useEffect watching the
                // Redux `userLeverage` that re-applied this same update a second
                // time once the store round-tripped back down. Two updates landing
                // back-to-back while the modal was simultaneously animating closed
                // is what caused the visible glitch/jump on the badge.
                setLeverage(value);
                // close the modal BEFORE showing the toast - a native Modal renders in
                // its own OS-level layer above everything else, so a toast fired while
                // it's still open is invisible until the modal closes, then it appears
                // to "pop in" mid-animation instead of showing from the start
                setLeverageVisible(false);
                successtoast("Success", response.message);
            } else {
                // Previously a silent console.log here - a rejected/failed leverage
                // change looked like tapping "Set" did nothing at all.
                failuretoast("Error", response?.message || "Unable to update leverage. Please try again.");
            }
        } catch (error: any) {
            // `.unwrap()` throws on a rejected/errored request (validation error,
            // network failure) - previously uncaught, so the tap silently no-op'd.
            failuretoast("Error", error?.data?.message || "Unable to update leverage. Please try again.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tradePair?._id, futureChangeLeverage, dispatch])

    useEffect(() => {
        if (formData.quantity !== null && formData.quantity !== undefined && formData.quantity !== "") {
            let lotQuantity = formData.quantity
            const price = ['market', 'trailingStop'].includes(formData.orderType)
                ? (isOption ? tradePair?.marketPrice : futureTicker.marketPrice) :
                ['stop_market', 'take_profit'].includes(formData.orderType) ?
                    formData.stopPrice
                    : parseFloat(formData.price);
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, tradePair.minAmount, tradePair.baseDecimal)
            } else if (quantityIn == tradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, price, tradePair.quoteDecimal)
            }
            setlotQuantity(lotQuantity)
        }
    }, [quantityIn])

    useEffect(() => {
        if (['market', 'trailingStop'].includes(formData.orderType) && !isEdit) {
            let lotQuantity = formData.quantity
            if (quantityIn == tradePair.quoteCurrency) {
                lotQuantity = QuantityToVolume(lotQuantity, screen === "options" ? data.marketPrice : futureTicker.marketPrice, tradePair.quoteDecimal)
                setlotQuantity(lotQuantity)
            }
        }
    }, [screen])


    useEffect(() => {
        setInitalData()
    }, [formData.orderType, tradePair])

    const stickyMap: any = {
        makeronly: [12],
        market: [12],
        stop_market: [11],
        take_profit: [11],
        trailingStop: [11],
        limit: [13],
        stop_limit: [12],
        take_profit_limit: [12]
    };

    const stickyHeaders = stickyMap[formData?.orderType] || [];

    const setInitalData = () => {
        try {
            const marketPrice = isOption ? tradePair?.marketPrice : futureTicker.marketPrice;
            setFormData({
                ...formData, ...{
                    price: marketPrice,
                    pairId: tradePair._id,
                    trailTypePrice: marketPrice
                }
            })
        } catch (err) {
            console.log(err, 'SetInitalData___err')
        }
    }

    useEffect(() => {
        if (formData.price !== "" && formData.pairId !== "") {
            setInitalData()
        }
    }, [tradePair])

    const orderOptions = [
        {
            label: "Default",
            image: "defaultOrder",
        },
        {
            label: "Buy Orders",
            image: "buyOrder",
        },
        {
            label: "Sell Orders",
            image: "sellOrder",
        },
    ] as const;


    const [selectedOrder, setSelectedOrder] = useState<typeof orderOptions[number]>(orderOptions[0]);


    // useEffect(() => {
    //     let leverage = pairSettings?.find((val: any) => (val?.pairId?.toString() == tradePair?._id?.toString()))?.leverage;
    //     dispatch(setUserLeverage(isNaN(leverage) ? 1 : leverage));
    // }, [tradePair])

    
    return (
        <Wrapper {...wrapperProps}>
            <Flexcomponent top={"5%"} justifyContent="space-between" alignItems="center">
                <Button
                    title="BUY / LONG"
                    textStyle={{ color: actions == 'buy' ? "#fff" : theme.darktext }}
                    onPress={() => {
                        setFormData({ ...formData, ...{ buyorsell: 'buy' } }), setAction("buy")
                    }}
                    style={[style.buy, { backgroundColor: actions == 'buy' ? Colors.green : "transparent" }]}
                />
                <Button
                    title="SELL / SHORT"
                    textStyle={{ color: actions == 'sell' ? "#fff" : theme.darktext }}
                    onPress={() => {
                        setFormData({ ...formData, ...{ buyorsell: 'sell' } }),
                            setAction("sell")
                    }}
                    style={[style.sellBtn, { backgroundColor: actions == 'sell' ? Colors.red : "transparent" }]}
                />
                {!embedded && (
                    <Pressable onPress={() => (onClose ? onClose() : navigation.goBack())} style={style.close} >
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.07}
                            height={windowwidth * 0.07}
                        />
                    </Pressable>
                )}
            </Flexcomponent>

            <Flexcomponent justifyContent="space-between" top={"5%"}>
                {
                    !(screen === "options" && actions == "buy") && (
                        <Flexcomponent ispress={true} onPress={() => setLeverageVisible(true)} justifyContent="space-between" style={style.card} width={"60%"} paddingVertical={"3%"} bakgroundcolor={theme.card} paddingHorizontal={"5%"} >
                            <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
                                {/* A single Text with numoflines={1} truncates from the tail of the
                                    whole "Leverage 50x" string - at a big value/narrow width that cut
                                    off the number itself ("Leverage 5.."). Splitting the label into its
                                    own shrinkable Text and letting the value keep its natural width
                                    means only the label ever gets ellipsized ("Lev...") while the
                                    number stays fully visible. The row itself is now `flex: 1` (was a
                                    fixed `width: "80%"`) with `minWidth: 0` so it can shrink below its
                                    content size instead of overflowing past the pill's right edge and
                                    pushing the chevron out - decimal leverage values (e.g. "39.04x")
                                    are wider than the old short "10x" values this was tuned for. */}
                                <Text numoflines={1} color={Colors.grey} style={{ flexShrink: 1 }}>Leverage </Text>
                                <Text color={Colors.brand}>{Number(leverage).toFixed(Number.isInteger(Number(leverage)) ? 0 : 1)}x</Text>
                            </View>
                            <VectorIcons
                                family="Ionicons"
                                name={"chevron-down"}
                                iconcolor={theme.inversetext}
                                size={windowwidth * 0.05}
                                style={{ flexShrink: 0 }}
                            />
                        </Flexcomponent>
                    )
                }

                <Flexcomponent ispress={true} justifyContent="space-between" style={style.card} width={!(screen === "options" && actions == "buy") ? "35%" : '60%'} paddingVertical={"3%"} bakgroundcolor={theme.card} paddingHorizontal={"5%"}
                    onPress={() => { openbottomsheet(bottomsheetref) }} >
                    <Text style={{ textTransform: "capitalize" }}>{marginMode} </Text>
                    <VectorIcons
                        name={"chevron-down"}
                        iconcolor={theme.inversetext}
                        family="Ionicons"
                        size={windowwidth * 0.05}
                    />
                </Flexcomponent>
            </Flexcomponent>

            <View style={style.lines}>
                <View style={style.menu}>
                    <Pressable style={{ width: "25%" }} onPress={() => { setFormData({ ...initialState, ...{ buyorsell: formData.buyorsell, orderType: 'limit' } }) }} hitSlop={10}>
                        <Text family="medium" size="tiny" color={formData?.orderType === 'limit' ? theme.futuretext : Colors.grey}>Limit</Text>
                    </Pressable>
                    <Pressable style={{ width: "25%" }} onPress={() => { setFormData({ ...initialState, ...{ buyorsell: formData.buyorsell, orderType: 'market' } }) }} hitSlop={10}>
                        <Text family="medium" size="tiny" color={formData?.orderType === 'market' ? theme.futuretext : Colors.grey}>Market</Text>
                    </Pressable>
                    <View style={{ width: "45%" }}>
                        <Pressable onPress={() => {
                            if (formData?.orderType === "limit" || formData?.orderType === "market") {
                                setFormData({ ...formData, orderType: "stop_limit" });
                            }
                            openbottomsheet(profitOptionref);
                        }} style={{ flexDirection: "row", alignItems: "center" }} hitSlop={10}>
                            <Text family="medium" size="tiny" color={formData?.orderType !== 'limit' && formData?.orderType !== 'market' ? theme.futuretext : Colors.grey}>{getOrderTypeLabel(formData?.orderType)} </Text>
                            <VectorIcons
                                family="Feather"
                                name="chevron-down"
                                iconcolor={formData?.orderType !== 'limit' && formData?.orderType !== 'market' ? theme.futuretext : Colors.grey}
                                size={20}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={style.container}>
                <ScrollView
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    stickyHeaderIndices={stickyHeaders}
                    bounces={false}
                    alwaysBounceVertical={false}
                    overScrollMode="never">
                    {
                        !['makeronly', 'market', 'stop_market', 'take_profit', 'trailingStop'].includes(formData?.orderType) ?
                            (
                                <Input
                                    value={formData.price}
                                    placeHolder="0"
                                    themes={theme}
                                    keyboardType="numeric"
                                    allowed={"number"}
                                    onChange={(text) => onChangeHandler('price', text)}
                                    labelStyle={{ color: Colors.grey }}
                                    style={style.inputStyle}
                                    leftContent={<Text color={Colors.grey}>Price</Text>}
                                    rightContent={
                                        <View style={style.input}>
                                            <Text color={Colors.white} size="small">{formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                                        </View>
                                    }
                                />
                            )
                            : null
                    }
                    <Input
                        label="Quantity"
                        value={lotQuantity}
                        placeHolder="0"
                        allowed={"number"}
                        keyboardType="numeric"
                        style={style.quantity}
                        onChange={(text) => onChangeHandler('quantity', text)}
                        onFocus={(value) => { setIsEdit(value) }}
                        rightContent={
                            <View style={style.quan}>
                                <Dropdown
                                    themes={theme}
                                    placeholder=""
                                    value={quantityIn}
                                    height={windowheight * 0.060}
                                    conatinerstyle={{ width: windowwidth * 0.2 }}
                                    background={theme.theme == "dark" ? theme.card : "#FFFFFF"}
                                    inputStyle={{ elevation: 0, borderColor: theme.theme === "dark" ? "#131D31" : "#FFFFFF" }}
                                    list={quantityUnitList}
                                    onChange={(value) => { setQuantityIn(value?.value) }}
                                />
                            </View>
                        }
                        leftContent={<Text color={Colors.grey}>{`1 Lot = ${tradePair.minAmount ?? "-"} ${tradePair.baseCurrency ?? ""}`}</Text>}
                    />
                    {
                        formData?.orderType == "makeronly" ?
                            <>
                                <Input
                                    value={formData.price}
                                    placeHolder="0"
                                    themes={theme}
                                    allowed={"number"}
                                    keyboardType="numeric"
                                    labelStyle={{ color: Colors.grey }}
                                    style={style.inputStyle}
                                    onChange={(text) => onChangeHandler('price', text)}
                                    leftContent={<Text color={Colors.grey}>Price</Text>}
                                    rightContent={
                                        <View style={style.input}>
                                            <Text color={Colors.white} size="small">{formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                                        </View>
                                    }
                                />
                            </>
                            : formData?.orderType !== 'limit' && formData?.orderType !== "market" ?
                                <>
                                    <Input
                                        value={formData.stopPrice}
                                        placeHolder="0"
                                        themes={theme}
                                        allowed={"number"}
                                        keyboardType="numeric"
                                        onChange={(text) => onChangeHandler('stopPrice', text)}
                                        labelStyle={{ color: Colors.grey }}
                                        style={style.inputStyle}
                                        leftContent={<Text color={Colors.grey}>{formData?.orderType == 'trailingStop' ? 'Trail Amount' : 'Stop Price'}</Text>}
                                        rightContent={
                                            <View style={style.input}>
                                                <Text color={Colors.white} size="small">{formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                                            </View>
                                        }
                                    />
                                </>
                                :
                                <></>
                    }

                    <Flexcomponent justifyContent="space-between" alignItems="center">
                        {
                            quantityPercentage.map((percent) => (
                                <Pressable key={percent} style={[style.percent, percent == balPrecen && { backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey }]}
                                    onPress={() => { handleBalanceprecn(percent); setBalPrecen(percent) }}>
                                    <Text size="small" color={theme.darktext}>{percent}</Text>
                                </Pressable>
                            ))
                        }
                    </Flexcomponent>
                    {
                        ['limit', 'market', 'makeronly'].includes(formData?.orderType) && (
                            <>
                                {
                                    formData?.takeProfit?.stopPrice == null || formData?.takeProfit?.stopPrice === '' ?
                                        <Flexcomponent justifyContent="space-between" style={{ marginTop: "5%" }} alignItems="center">
                                            <Menu style={{ alignItems: "flex-start" }}>
                                                <MenuTrigger>
                                                    <View style={style.linee}>
                                                        <Text style={style.text}>Bracket Order</Text>
                                                    </View>
                                                </MenuTrigger>
                                                <MenuOptions customStyles={{ optionsContainer: style.modalone }}>
                                                    <Text size="small" family="medium" color={theme.secondarytext}>Bracket order: Take profit/ stop loss order pair, enables trader to set take profit and stop loss levels with their orders. Please note that a bracket order will always close the entire position.</Text>
                                                </MenuOptions>
                                            </Menu>
                                            <Button
                                                title="Add"
                                                buttonStyle={style.addButton}
                                                textStyle={{ fontSize: Fontsize.small }}
                                                leftContent={<VectorIcons name="add" family="Ionicons" size={20} iconcolor={Colors.white} />}
                                                onPress={() => openbottomsheet(addBracketref)}
                                            />
                                        </Flexcomponent>
                                        :
                                        <>
                                            <Flexcomponent justifyContent="space-between" style={{ marginTop: "5%" }} alignItems="center">
                                                <Text size="medium">Bracket Order</Text>
                                                <View style={{ flexDirection: "row" }}>
                                                    <Pressable onPress={() => openbottomsheet(addBracketref)}>
                                                        <VectorIcons
                                                            name="edit"
                                                            family="Feather"
                                                            size={windowwidth * 0.05}
                                                            iconcolor={theme.activetab}
                                                        />
                                                    </Pressable>
                                                    <Pressable style={{ marginLeft: 20 }} onPress={() => removeBracketOrders()}>
                                                        <VectorIcons
                                                            name="trash-2"
                                                            family="Feather"
                                                            size={windowwidth * 0.05}
                                                            iconcolor={"red"}
                                                        />
                                                    </Pressable>
                                                </View>
                                            </Flexcomponent>
                                            <Flexcomponent justifyContent="flex-start" style={{ marginTop: '2%' }}>
                                                <Text color={Colors.grey}>TP({formatDisplayPair("USDT")}) : <Text>{formData?.takeProfit?.stopPrice} / {formData?.takeProfit?.orderType === 'bracket_tp_market' ? " -" : formData?.takeProfit?.price}</Text></Text>
                                            </Flexcomponent>
                                            <Flexcomponent justifyContent="flex-start" style={{ marginTop: '2%' }}>
                                                <Text color={Colors.grey}>SL({formatDisplayPair("USDT")}) : <Text>{formData?.stopLoss?.stopPrice} / {formData?.stopLoss?.orderType === 'bracket_sl_market' ? " -" : formData?.stopLoss?.price}</Text></Text>
                                            </Flexcomponent>
                                        </>
                                }
                            </>
                        )
                    }
                    <Flexcomponent justifyContent="flex-start" style={{ marginTop: "5%" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Input
                                type="checkbox"
                                label=""
                                boxstyle={style.check}
                                initial={formData?.reduce_only}
                                onChange={(val) => { setFormData({ ...formData, ...{ reduce_only: val } }) }}
                            />
                            <Menu>
                                <MenuTrigger>
                                    <View style={style.linee}>
                                        <Text>Reduce Only</Text>
                                    </View>
                                </MenuTrigger>
                                <MenuOptions customStyles={{
                                    optionsContainer: {
                                        ...style.modalone,
                                        marginTop: -100,
                                    }
                                }}>
                                    <Text size="small" family="medium" color={theme.secondarytext}>A reduce-only order can only reduce your position and never increase it. You can use reduce-only flag to create take-profit and stop-loss orders.</Text>
                                </MenuOptions>
                            </Menu>
                        </View>
                        {
                            formData?.orderType == "limit" && (
                                <View style={{ marginLeft: 20 }}>
                                    <Input
                                        type="checkbox"
                                        label="Maker Only"
                                        boxstyle={style.check}
                                        initial={formData?.makeronly}
                                        onChange={(val) => { setFormData({ ...formData, ...{ makeronly: val } }) }}
                                    />
                                </View>
                            )
                        }
                    </Flexcomponent>

                    <Flexcomponent justifyContent="space-between" style={{ marginTop: '5%' }}>
                        <Text color={theme.graytext}>Available</Text>
                        <Text numoflines={1} style={{ width: "50%", textAlign: "right" }}> {wallet?.availableBalance?.toFixed(tradePair?.quoteDecimal)} {formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                    </Flexcomponent>
                    <Linecomponent backgroundcolor={theme.theme === "dark" ? Colors.grey : theme.boderColor} containerstyle={{ marginTop: "3%" }} />
                    <Flexcomponent paddingVertical={"2.5%"} justifyContent="space-between">
                        <Text color={theme.graytext} >Fees</Text>
                        <Text numoflines={1} style={{ width: "50%", textAlign: "right" }}>{formatValue(cardDetails?.fees ?? 0, tradePair.quoteDecimal)} {formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                    </Flexcomponent>
                    <Flexcomponent paddingVertical={"2.5%"} justifyContent="space-between">
                        <Text color={theme.graytext}>Order Cost</Text>
                        <Text numoflines={1} style={{ width: "50%", textAlign: "right" }}>{formatValue(cardDetails?.orderCost ?? 0, tradePair.quoteDecimal)} {formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                    </Flexcomponent>
                    <Flexcomponent paddingVertical={"2.5%"} justifyContent="space-between">
                        <Text color={theme.graytext} >Total</Text>
                        <Text numoflines={1} style={{ width: "50%", textAlign: "right" }}>{formatValue(cardDetails?.orderValue ?? 0, tradePair.quoteDecimal)} {formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                    </Flexcomponent>
                    <Flexcomponent paddingVertical={"2.5%"} justifyContent="space-between">
                        <Text color={theme.graytext}>Margin required</Text>
                        <Text numoflines={1} style={{ width: "50%", textAlign: "right", marginBottom: "3%" }}>{formatValue(cardDetails?.margin ?? 0, tradePair.quoteDecimal)} {formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                    </Flexcomponent>

                    <Menu style={{ alignItems: "flex-end" }}>
                        <MenuTrigger>
                            <View style={style.linee}>
                                <Text style={style.text}> % Fees </Text>
                            </View>
                        </MenuTrigger>
                        <MenuOptions
                            customStyles={{ optionsContainer: style.modaltwo }}>
                            <View style={{ flexDirection: 'row', gap: 5 }}>
                                <View style={{ width: 18, height: 18, backgroundColor: Colors.stormGrey, alignItems: "center", justifyContent: "center", borderRadius: 100, marginTop: 2 }}>
                                    <VectorIcons
                                        name={"dollar"}
                                        family="Fontisto"
                                        size={12}
                                        iconcolor={Colors.white}
                                    />
                                </View>
                                <View>
                                    <Text size="small" family="semiBold" color={theme.darktext}>Your fees for the selected contract</Text>
                                    <Text size="small" color={theme.secondarytext}>Marker:{makerFee}%  Taker:{takerFee}%</Text>
                                </View>
                            </View>
                        </MenuOptions>
                    </Menu>
                    <View style={{ backgroundColor: theme.background, marginTop: "8%" }}>
                        <Pressable
                            style={{ flexDirection: "row", marginBottom: "3%", justifyContent: "space-between" }}
                        // onTouchEnd={() => setExpand(prev => !prev)}
                        >
                            {/* <Flexcomponent justifyContent="flex-start" width={"50%"} >
                                <Images
                                    type="svg"
                                    name="Orderbook"
                                    width={windowwidth * 0.055}
                                    height={windowwidth * 0.055}
                                />
                                <Text left={"5%"} family="medium" fontSize={RFvalue(14)}>Order Book</Text>
                            </Flexcomponent> */}
                            <Flexcomponent justifyContent="flex-start" width={"50%"}>
                                <Menu>
                                    <MenuTrigger>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 7,
                                            }}
                                        >
                                            <Images
                                                type="svg"
                                                name={selectedOrder.image}
                                                width={windowwidth * 0.055}
                                                height={windowwidth * 0.055}
                                            />

                                            <VectorIcons
                                                iconcolor={theme.graytext}
                                                family="Ionicons"
                                                name={expand ? "chevron-down" : "chevron-up"}
                                                size={windowwidth * 0.05}
                                            />
                                        </View>
                                    </MenuTrigger>

                                    <MenuOptions
                                        customStyles={{
                                            optionsContainer: {
                                                backgroundColor: theme.activetabtext,
                                                borderRadius: 8,
                                                width: 150,
                                                marginTop: 25,
                                            },
                                        }}
                                    >
                                        {orderOptions.map((item) => (
                                            <MenuOption
                                                key={item.label}
                                                onSelect={() => setSelectedOrder(item)}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor:
                                                            selectedOrder.label === item.label
                                                                ? theme.card
                                                                : "transparent",
                                                        borderRadius: 6,
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 15,
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <Images
                                                        type="svg"
                                                        name={item.image}
                                                        width={windowwidth * 0.055}
                                                        height={windowwidth * 0.055}
                                                    />

                                                    <Text
                                                        color={
                                                            selectedOrder.label === item.label
                                                                ? theme.secondarytext
                                                                : theme.darktext
                                                        }
                                                        family="medium"
                                                    >
                                                        {item.label}
                                                    </Text>
                                                </View>
                                            </MenuOption>
                                        ))}
                                    </MenuOptions>
                                </Menu>

                                <Text left={"5%"} family="medium" fontSize={RFvalue(14)}>
                                    {selectedOrder.label}
                                </Text>
                            </Flexcomponent>
                            <Flexcomponent justifyContent="flex-end" width={"50%"} >
                                <Pressable onTouchEnd={() => setExpand(prev => !prev)} style={{flexDirection: "row", alignItems: "center"}}>
                                <Text color={theme.graytext} style={{ marginRight: "5%" }} family="regular" fontSize={RFvalue(12)}>Hide</Text>
                                <VectorIcons
                                    iconcolor={theme.graytext}
                                    family="Ionicons"
                                    name={expand ? "chevron-up" : "chevron-down"}
                                    size={windowwidth * 0.04}
                                />
                                </Pressable>
                            </Flexcomponent>
                        </Pressable>
                        {
                            expand && (
                                <View style={{ flexDirection: "row" }}>
                                    <View style={{ marginRight: "10%" }}>
                                        <Text size="xsmall">Last Price</Text>
                                        {
                                            screen === "options" ? (
                                                <Text family="medium" color={Colors.brand}>{isNaN(data.last) ? 0 : data?.last?.toFixed(data?.quoteDecimal)}</Text>
                                            ) : (
                                                <Text family="medium" color={Colors.brand}>{isNaN(futureTicker.last) ? 0 : futureTicker?.last?.toFixed(futureTicker?.quoteDecimal)}</Text>

                                            )
                                        }
                                    </View>
                                    <View>
                                        <Text size="xsmall">Change</Text>
                                        {
                                            screen === "options" ? (
                                                <Text family="medium" color={theme.secondarytext} style={{ textDecorationLine: "underline" }}>{isNaN(data?.change) ? 0 : data?.change?.toFixed(2)}</Text>
                                            ) : (
                                                <Text family="medium" color={theme.secondarytext} style={{ textDecorationLine: "underline" }}>{isNaN(futureTicker?.change) ? 0 : futureTicker?.change?.toFixed(2)}</Text>
                                            )
                                        }
                                    </View>
                                </View>
                            )
                        }
                        {
                            expand && (
                                <>
                                    {
                                        selectedOrder.label === "Default" && (
                                            <View style={style.table}>
                                                <View style={style.tableContent}>
                                                    <View style={{ alignItems: "flex-start" }} >
                                                        <Text family="medium" color={theme.secondarytext}>Price ({formatDisplayPair(tradePair.quoteCurrency)})</Text>
                                                    </View>
                                                    <View>
                                                        <Text family="medium" color={theme.secondarytext}>Size ({tradePair.baseCurrency})</Text>
                                                    </View>
                                                </View>
                                                <View style={{ width: "4%" }} />
                                                <View style={style.tableContent}>
                                                    <View>
                                                        <Text family="medium" color={theme.secondarytext}>Price ({formatDisplayPair(tradePair.quoteCurrency)})</Text>
                                                    </View>
                                                    <View style={[, { alignItems: "flex-end" }]} >
                                                        <Text family="medium" color={theme.secondarytext}>Size ({tradePair.baseCurrency})</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    }
                                    {
                                        selectedOrder.label === "Buy Orders" && (
                                            <View style={style.table}>
                                                <View style={[style.tableContent, { width: "100%" }]}>
                                                    <View style={{ alignItems: "flex-start" }} >
                                                        <Text family="medium" color={theme.secondarytext}>Price ({formatDisplayPair(tradePair.quoteCurrency)})</Text>
                                                    </View>
                                                    <View>
                                                        <Text family="medium" color={theme.secondarytext}>Size ({tradePair.baseCurrency})</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    }
                                    {
                                        selectedOrder.label === "Sell Orders" && (
                                            <View style={style.table}>
                                                <View style={[style.tableContent, { width: "100%" }]}>
                                                    <View>
                                                        <Text family="medium" color={theme.secondarytext}>Price ({formatDisplayPair(tradePair.quoteCurrency)})</Text>
                                                    </View>
                                                    <View style={[, { alignItems: "flex-end" }]} >
                                                        <Text family="medium" color={theme.secondarytext}>Size ({tradePair.baseCurrency})</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    }
                                </>
                            )
                        }
                    </View>
                    {
                        expand && (
                            <Bookcomponent
                                space={"0%"}
                                currentIndex={screen === "options" ? data._id : futureTicker._id}
                                header={false}
                                selectedOrder={selectedOrder.label}
                            />
                        )
                    }
                </ScrollView>
            </View>
            <View style={style.buttonContainer} >
                <Button
                    title={actions === 'buy' ? "Buy" : "Sell"}
                    style={[style.sell, { backgroundColor: actions == 'buy' ? Colors.green : Colors.red }]}
                    onPress={() => {
                        if (kycStatus !== 'approved') {
                            failuretoast("Error", "Please complete your KYC details")
                        } else {
                            // Dismiss any open price/quantity input keyboard first, otherwise the
                            // confirm sheet presents underneath the still-visible keyboard on
                            // Android/iOS instead of appearing cleanly above it.
                            Keyboard.dismiss();
                            openbottomsheet(placeOrderref)
                        }
                    }}
                />
            </View>
            <AccountMargin
                ref={bottomsheetref}
                wallet={wallet}
                marginMode={marginMode}
                accountName={accountName}
                futureTradePair={tradePair}
                onChange={() => {
                    closebottomsheet(bottomsheetref)
                    setTimeout(() => {
                        openbottomsheet(updateMarginsheetref)
                    }, 300)
                }}
            />
            <UpdateMargin
                ref={updateMarginsheetref}
                value={marginMode}
                accountId={accountId}
                title={"Change Margin mode"}
                onClose={() => { closebottomsheet(updateMarginsheetref) }}
                confirm={() => closebottomsheet(updateMarginsheetref)}
                onContinue={() => { closebottomsheet(updateMarginsheetref) }}
            />
            <PlaceOrder
                page={screen}
                ref={placeOrderref}
                action={actions}
                data={data}
                screen={!(screen === "options" && actions == "buy")}
                loading={isLoading || optionLoading}
                formData={{ ...formData, ...cardDetails }}
                orderPlacing={screen === "options" ? optionOrderPlace : orderPlacing}
            />
            <ProfitOption
                screen={screen}
                ref={profitOptionref}
                formData={formData}
                onChange={handleOrderListSelect}
            />
            <BracketOrders
                ref={addBracketref}
                formData={formData}
                handleChange={(value: any) => {
                    setFormData({ ...formData, ...{ takeProfit: value.takeProfit, stopLoss: value.stopLoss } });
                    closebottomsheet(addBracketref)
                }}
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
        </Wrapper>
    )
}

export default Buysell;