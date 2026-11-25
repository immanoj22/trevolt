import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { Button, Input } from "../../../Components/Field";
import { isEmpty } from "../../../Utilities/helerfunction";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { RFvalue } from "../../../Utilities/dimensions";
import { formatDisplayPair } from "../../../Utilities/formatPair";

interface ProfitLossModalprops {
    ref?: any
    formData?: any
    handleChange?: any
}

const BracketOrdersComponent: React.FC<ProfitLossModalprops> = ({
    ref,
    formData,
    handleChange,
}) => {
    const { theme, closebottomsheet } = useCustomHooks();
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);

    // futureTicker defaults to (and can reset to) an empty array - state.future's
    // reducer does `state.futureTicker = next ?? []` (Slices/future.ts) on a pair
    // switch or before the first live tick arrives. `futureTicker.marketPrice` on an
    // array is `undefined`, so `parseFloat(...)` was silently NaN at exactly that
    // moment - every price calculation below has an explicit `isNaN(...) ? 0 : ...`
    // fallback, so the Trigger Price field would show a literal "0" instead of the
    // correct price. Live is still preferred (that's what keeps the % validation
    // consistent with the actually-current price), but this now falls back to
    // futureTradePair.marketPrice - a stable snapshot set once when the pair loads -
    // instead of falling all the way through to 0.
    const getMarketPrice = (): number => {
        const live = parseFloat(futureTicker?.marketPrice);
        if (Number.isFinite(live) && live > 0) return live;
        const snapshot = parseFloat(futureTradePair?.marketPrice);
        return Number.isFinite(snapshot) && snapshot > 0 ? snapshot : 0;
    };

    const [barketOrders, setBraketOrders] = useState<any>({})
    const [gainPrecn, setGainPercen] = useState<any>('0')
    const [lossPrecn, setLossPercen] = useState<any>('0')
    const [exitPandL, setExitPandL] = useState(0)
    const [stopPandL, setStopPandL] = useState(0)

    const [trigger, setTrigger] = useState("Market");
    const [stopLoss, setstopLoss] = useState("Market");
    const [errors, setErrors] = useState({})
    // `errors` holds two different value shapes under different keys: checkTpandSl()
    // below writes plain strings (errors.takeProfitPrice = "message"), calculatePandL()
    // writes nested objects (errors.takeProfit = { stopPrice: "message" }). Treating
    // every value as an object (the old Object.keys(field)/Object.values(field)[0])
    // silently mistreated a string as an array of characters - Object.values("Take
    // profit price...")[0] is just "T", which is exactly the single-letter "Error: T"
    // toast this produced. Handle both shapes explicitly instead.
    const hasErrors = Object.values(errors).some((field: any) =>
        typeof field === 'string' ? field.length > 0 : Object.keys(field ?? {}).length > 0
    );

    const onChangeHandler = (field: any, name: any, value: any) => {
        const numberRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
        // Only the two numeric fields are regex-guarded, matching web's
        // BracketOrder.jsx exactly (`['stopPrice', 'price']`). This list previously
        // also carried 'quantity' and 'orderType' - copied from web's *other*
        // handler, TradeActionCard.jsx's main-form onChangeHandler, which does guard
        // those. The consequence was that the Market/Limit toggles, which call
        // onChangeHandler(field, 'orderType', 'bracket_tp_limit'), hit the guard:
        // 'bracket_tp_limit' isn't numeric, so it returned false and the orderType
        // was never written. Tapping "Limit" flipped the tab and revealed the Limit
        // Price input (that's separate local state) while the bracket silently kept
        // orderType 'bracket_tp_market' - so the backend, which keys the limit price
        // off `orderType == 'bracket_tp_limit'`, stored price 0 and placed a MARKET
        // TP/SL. The UI said Limit; the order was Market.
        if (['stopPrice', 'price'].includes(name)) {
            if (value !== "" && !numberRegex.test(value)) return false;
        }
        let barket: any = { ...barketOrders }
        barket[field][name] = value
        if (!isNaN(value)) {
            calculatePercentage(value, field == 'takeProfit' ? 'isTake' : 'isStop')
        }
        setBraketOrders(barket)
        calculatePandL(barket)
    }

    const checkTpandSl = (type: any, value: any, buyorsell = 'buy') => {
        const marketPrice = getMarketPrice();
        if (buyorsell == 'buy' && value < marketPrice && type == 'isTake') {
            setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be greater than market price' } })
        }
        else if (buyorsell == 'sell' && value > marketPrice && type == 'isTake') {
            setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be less than market price' } })
        } else if (type == 'isTake') {
            setErrors({ ...errors, ...{ 'takeProfitPrice': '' } })
        }

        if (buyorsell == 'buy' && value > marketPrice && type == 'isStop') {
            setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be less than market price' } })
        }
        else if (buyorsell == 'sell' && value < marketPrice && type == 'isStop') {
            setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be greater than market price' } })
        } else if (type == 'isStop') {
            setErrors({ ...errors, ...{ 'stopLossPrice': '' } })
        }

    }

    const setGainAndLoss = (type: any, value: any, buyorsell: any = 'buy', call: any = 'edit') => {
        const isTake = type === 'isTake';
        const isStop = type === 'isStop';

        const numberRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

        // Validation
        if ((parseFloat(value) < 0 || parseFloat(value) > 100 || !numberRegex.test(value)) && value !== '') {
            return false;
        }

        if (isStop && parseFloat(value) > 99) {
            return false;
        }

        const name = isTake ? 'takeProfit' : 'stopLoss';
        isTake ? setGainPercen(value) : setLossPercen(value);
        // Handle empty input
        if (value === '') {
            let barket: any = { ...barketOrders }
            barket[name]['stopPrice'] = value
            setBraketOrders(barket)
            // onChangeHandler(name, 'stopPrice', '');
            return false;
        }

        // getMarketPrice() - live futureTicker.marketPrice when available (keeps
        // checkTpandSl's validation consistent with the actually-current price),
        // falling back to the futureTradePair snapshot instead of silently going to
        // NaN -> 0 whenever the ticker is momentarily empty (see getMarketPrice's
        // own comment - this is what caused the Trigger Price field to sometimes
        // show a literal "0" after tapping a %-button).
        let marketPrice = getMarketPrice();
        // formData.price is stored as a STRING (see buysellNew.tsx's useState(...toString())).
        // marketPrice must stay a number here, or the `+` arithmetic below silently
        // does string concatenation instead of addition (this is what produced the
        // "stopPrice.toFixed is not a function" crash).
        const entryPrice = parseFloat(formData?.price);
        if (buyorsell == 'sell') {
            marketPrice = isTake ? entryPrice < marketPrice ? entryPrice : marketPrice : entryPrice > marketPrice ? entryPrice : marketPrice
        } else if (buyorsell == 'buy') {
            marketPrice = isTake ? entryPrice > marketPrice ? entryPrice : marketPrice : entryPrice < marketPrice ? entryPrice : marketPrice
        }

        const percent: any = parseFloat(value);
        let stopPrice: any = 0;

        if (buyorsell === 'buy') {
            stopPrice = isTake
                ? marketPrice + (marketPrice * percent) / 100
                : marketPrice - (marketPrice * percent) / 100;
        } else if (buyorsell === 'sell') {
            stopPrice = isTake
                ? marketPrice - (marketPrice * percent) / 100
                : marketPrice + (marketPrice * percent) / 100;
        }
        // Left as the STRING .toFixed() produces, exactly like web's BracketOrder.jsx
        // (`stopPrice = isNaN(...) ? 0 : stopPrice.toFixed(quoteDecimal)`). The two
        // Number() wrappers this replaces made mobile the only client that put a
        // numeric stopPrice on the wire, which is what made the isEmpty()-derived
        // isTake/isStop flags fragile (isEmpty(0) === true). Everything downstream
        // here parses with parseFloat(), so a string is what the rest of this file,
        // and the backend's parseFloat-based StoppriceCondition, already expect.
        stopPrice = isNaN(stopPrice) || !isFinite(stopPrice) ? 0 : stopPrice.toFixed(futureTradePair?.quoteDecimal ?? 2);
        // Apply updates
        if (isTake) {
            setGainPercen(value);
            checkTpandSl('isTake', stopPrice, formData?.buyorsell);
        } else {
            setLossPercen(value);
            checkTpandSl('isStop', stopPrice, formData?.buyorsell);
        }

        if (call == 'initial') {
            return stopPrice
        } else {
            let barket: any = { ...barketOrders }
            barket[name]['stopPrice'] = isNaN(stopPrice) ? '' : stopPrice
            setBraketOrders(barket)
            // Was missing here (and in the web reference this was ported from) -
            // onChangeHandler (typing a price directly) recalculates PnL, but this
            // path (the %-quick-buttons and the % input field) only ever updated
            // barketOrders, leaving Exit PnL / Stop PnL frozen until the user also
            // touched a price field directly.
            calculatePandL(barket);
        }
    };


    const calculatePercentage = (stopPrice: any, type: any) => {
        const buyorsell: any = formData.buyorsell
        const isTake: any = type === 'isTake';
        const isStop: any = type === 'isStop';
        // Same getMarketPrice() as setGainAndLoss above, so typing a trigger price
        // directly and picking a % both anchor to the same (never-0-on-a-fluke)
        // market price.
        let marketPrice: any = getMarketPrice();
        const entryPrice = parseFloat(formData?.price);
        if (buyorsell == 'sell') {
            marketPrice = isTake ? entryPrice < marketPrice ? entryPrice : marketPrice : entryPrice > marketPrice ? entryPrice : marketPrice
        } else if (buyorsell == 'buy') {
            marketPrice = isTake ? entryPrice > marketPrice ? entryPrice : marketPrice : entryPrice < marketPrice ? entryPrice : marketPrice
        }

        let percentage: any = 0;
        if (buyorsell === 'buy') {
            percentage = ((parseFloat(stopPrice) - parseFloat(marketPrice)) / parseFloat(marketPrice)) * 100;
        } else if (buyorsell === 'sell') {
            percentage = ((parseFloat(marketPrice) - parseFloat(stopPrice)) / parseFloat(marketPrice)) * 100;
        }
        percentage = (percentage).toFixed(2)
        if (isTake) {
            setGainPercen(Math.abs(percentage));
        } else if (isStop) {
            setLossPercen(Math.abs(percentage));
        }
    }

    const getPorfitCalculation = (entryPrice: any, closePrice: any, quantity: any, positionSide: any) => {
        console.log(entryPrice, closePrice, quantity, positionSide, "getPorfitCalculation")
        let profit = 0
        if (positionSide == 'buy') {
            profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
        } else {
            profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
        }
        return profit
    }

    const calculatePandL = (order: any) => {
        const error: any = {
            takeProfit: {},
            stopLoss: {}
        };

        let stop: any, exit: any = 0
        // getMarketPrice() here too - same fragile-empty-ticker issue, just showing up
        // as "NaN USD" in the PnL preview instead of a literal 0 in a price field.
        const price: any = ['market', 'stop_market', 'take_profit', 'trailingStop'].includes(formData.orderType)
            ? getMarketPrice()
            : parseFloat(order.price);
        if (trigger.toLowerCase() == 'market') {
            exit = getPorfitCalculation(price, isEmpty(order.takeProfit.stopPrice) ? 0 : order.takeProfit.stopPrice, formData.quantity, formData.buyorsell)
        } else if (trigger.toLowerCase() == 'limit') {
            exit = getPorfitCalculation(price, isEmpty(order.takeProfit.price) ? 0 : order.takeProfit.price, formData.quantity, formData.buyorsell)
        }

        if (stopLoss.toLowerCase() == 'market') {
            stop = getPorfitCalculation(price, isEmpty(order.stopLoss.stopPrice) ? 0 : order.stopLoss.stopPrice, formData.quantity, formData.buyorsell)
        } else if (stopLoss.toLowerCase() == 'limit') {
            stop = getPorfitCalculation(price, isEmpty(order.stopLoss.price) ? 0 : order.stopLoss.price, formData.quantity, formData.buyorsell)
        }

        if (isEmpty(order.takeProfit.stopPrice)) {
            error.takeProfit.stopPrice = 'Trigger price is required'
        } else if ((formData.buyorsell == 'buy' && parseFloat(formData.price) >= parseFloat(order.takeProfit.stopPrice))) {
            error.takeProfit.stopPrice = 'Trigger price must be greater than entry price'
        } else if ((formData.buyorsell == 'sell' && parseFloat(formData.price) <= parseFloat(order.takeProfit.stopPrice))) {
            error.takeProfit.stopPrice = 'Trigger price must be lesser than entry price'
        }

        if (isEmpty(order.stopLoss.stopPrice)) {
            error.stopLoss.stopPrice = 'Trigger price is required'
        } else if ((formData.buyorsell == 'buy' && parseFloat(formData.price) <= parseFloat(order.stopLoss.stopPrice))) {
            error.stopLoss.stopPrice = 'Trigger price must be greater than entry price'
        } else if ((formData.buyorsell == 'sell' && parseFloat(formData.price) >= parseFloat(order.stopLoss.stopPrice))) {
            error.stopLoss.stopPrice = 'Trigger price must be lesser than entry price'
        }

        if (Object.keys(error.takeProfit).length === 0) {
            delete error.takeProfit;
        }
        if (Object.keys(error.stopLoss).length === 0) {
            delete error.stopLoss;
        }

        // Functional updater, preserving takeProfitPrice/stopLossPrice (checkTpandSl's
        // flat-string market-price errors) - setGainAndLoss calls checkTpandSl right
        // before calling this function, and a plain setErrors(error)/setErrors({}) here
        // would silently wipe out whatever checkTpandSl had just set, since neither
        // read the other's update (both start from the same pre-update `errors`
        // closure). Confirm being disabled by a market-price violation shouldn't
        // un-disable itself the instant this entry-price check separately passes.
        if (Object.keys(error).length > 0) {
            setErrors((prev: any) => ({ takeProfitPrice: prev?.takeProfitPrice, stopLossPrice: prev?.stopLossPrice, ...error }));
            return;
        }

        console.log(stop, exit, "stop,exit", order)
        setErrors((prev: any) => ({ takeProfitPrice: prev?.takeProfitPrice, stopLossPrice: prev?.stopLossPrice }));
        setStopPandL(isNaN(stop) ? 0 : stop === 0 ? 0 : stop.toFixed(futureTradePair?.quoteDecimal))
        setExitPandL(isNaN(exit) ? 0 : exit === 0 ? 0 : exit.toFixed(futureTradePair?.quoteDecimal))
    }



    const onConfirm = () => {
        const error: any = {
            takeProfit: {},
            stopLoss: {}
        };
        // Was `=== undefined || === null`, which doesn't catch an emptied '' field -
        // clearing Trigger Price and tapping Confirm slipped through with a blank
        // stopPrice instead of being blocked, unlike the web reference's isEmpty()
        // checks. Also fixes a real operator-precedence bug the web reference has
        // too: `a === null || a === undefined && b === 'Limit'` parses as
        // `a === null || (a === undefined && b === 'Limit')`, so a null price
        // required a value even outside Limit mode - explicit `&&` grouping here.
        if (isEmpty(barketOrders?.takeProfit?.stopPrice)) {
            error.takeProfit.stopPrice = 'Stop price is required';
        }
        if (isEmpty(barketOrders?.takeProfit?.price) && trigger === 'Limit') {
            error.takeProfit.price = 'Price is required';
        }
        if (isEmpty(barketOrders?.takeProfit?.orderType)) {
            error.takeProfit.orderType = 'Order type is required';
        }

        if (isEmpty(barketOrders?.stopLoss?.stopPrice)) {
            error.stopLoss.stopPrice = 'Stop price is required';
        }
        if (isEmpty(barketOrders?.stopLoss?.price) && stopLoss === 'Limit') {
            error.stopLoss.price = 'Price is required';
        }
        if (isEmpty(barketOrders?.stopLoss?.orderType)) {
            error.stopLoss.orderType = 'Order type is required';
        }

        if (Object.keys(error.takeProfit).length === 0) {
            delete error.takeProfit;
        }
        if (Object.keys(error.stopLoss).length === 0) {
            delete error.stopLoss;
        }

        if (Object.keys(error).length > 0) {
            setErrors(error);
            return;
        }
        handleChange(barketOrders)
    };

    useEffect(() => {
        if (isEmpty(formData)) return
        let barketOrders: any = JSON.stringify(formData)
        barketOrders = JSON.parse(barketOrders)
        if (isEmpty(barketOrders.takeProfit.stopPrice)) {
            let stopPrice: any = setGainAndLoss('isTake', 0.25, formData.buyorsell, 'initial')
            barketOrders.takeProfit.stopPrice = parseFloat(stopPrice)
        }
        if (isEmpty(barketOrders.stopLoss.stopPrice)) {
            let stopPrice: any = setGainAndLoss('isStop', 0.25, formData.buyorsell, 'initial')
            barketOrders.stopLoss.stopPrice = parseFloat(stopPrice)
        }
        calculatePandL(barketOrders)
        setBraketOrders(barketOrders)
    }, [formData]);

    return (
        <Sheet
            sheetref={ref}
            snappoint={["80%"]}
            custominterface={true}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={{ paddingHorizontal: "5%", flex: 1, paddingBottom: "5%" }} >
                    {/* Compact header matching ProfitOption.tsx's pattern - the old
                        windowheight*0.08 fixed height + windowwidth-wide row was
                        oversized against the rest of this app's trading-flow sheets. */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: RFvalue(10) }} >
                        <Text color={theme.tabactive} family="semiBold" fontSize={RFvalue(14)}>Bracket Order</Text>
                        <Pressable style={{ backgroundColor: theme.card, borderRadius: 8, padding: 8 }} onPress={() => {
                            setExitPandL(0);
                            setStopPandL(0);
                            closebottomsheet(ref)
                        }}>
                            <VectorIcons
                                family="Ionicons"
                                name="close"
                                size={RFvalue(16)}
                                iconcolor={theme.darktext}
                            />
                        </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                        <BottomSheetScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: "25%" }}
                            showsVerticalScrollIndicator={false}
                        >
                            <Flexcomponent justifyContent="space-between" style={{ marginTop: RFvalue(6) }}>
                                <Text fontSize={RFvalue(12)} style={{ color: Colors.grey }}>Entry Price</Text>
                                <Text fontSize={RFvalue(12)} style={{ color: theme.theme == "dark" ? Colors.white : Colors.grey }}>{formData?.price}</Text>
                            </Flexcomponent>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: RFvalue(10) }}>
                                <Text fontSize={RFvalue(12)} family="medium" style={{ color: Colors.grey }}>Take Profit</Text>
                                <View style={{ flexDirection: 'row', justifyContent: "flex-end" }}>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: RFvalue(5), borderRadius: 8, borderWidth: 1, borderColor: trigger === "Market" ? Colors.brand : theme.boderColor }}
                                        onPress={() => { setTrigger("Market"), onChangeHandler('takeProfit', 'orderType', 'bracket_tp_market') }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: trigger === "Market" ? Colors.brand : theme.primarytext, }}>Market</Text>
                                    </Pressable>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: RFvalue(5), borderRadius: 8, marginLeft: 10, borderWidth: 1, borderColor: trigger === "Limit" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setTrigger("Limit")
                                            onChangeHandler('takeProfit', 'orderType', 'bracket_tp_limit')
                                        }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: trigger === "Limit" ? Colors.brand : theme.primarytext }}>Limit</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={{ marginTop: RFvalue(8) }} >
                                <Input
                                    value={barketOrders?.takeProfit?.stopPrice ?? ""}
                                    rightContent={
                                        <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                            <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                        </View>
                                    }
                                    themes={theme}
                                    // Was falling back to Input's own default background
                                    // (#101A2C), nearly identical to this sheet's own dark-green
                                    // gradient - the box had no visible definition against the
                                    // background, reading as a blank floating area rather than a
                                    // distinct input field. Matches buysellNew.tsx's convention.
                                    background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                    label="Trigger Price"
                                    labelStyle={{ color: Colors.grey, fontSize: RFvalue(11) }}
                                    onChange={(text) => onChangeHandler('takeProfit', "stopPrice", text)}
                                    style={{ textAlign: "right", marginRight: 25 }}
                                    keyboardType="numeric"
                                    allowed={"number"}
                                    bottom={RFvalue(8)}
                                    errorMessage={(errors as any)?.takeProfit?.stopPrice}
                                />
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: RFvalue(10) }}>
                                <View style={{ width: "68%", flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: theme.card, height: RFvalue(34), borderRadius: 8 }}>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 0.25, formData.buyorsell) }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>0.25%</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 0.5, formData.buyorsell) }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>0.5%</Text>
                                    </Pressable>
                                    {/* Was 0.1%/0.2% here - the web reference (the source this was
                                        ported from) uses 1%/2%, matching the values below for Stop
                                        Loss too. */}
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 1, formData.buyorsell) }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>1%</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 2, formData.buyorsell) }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>2%</Text>
                                    </Pressable>
                                </View>
                                <View>
                                    <Input
                                        value={gainPrecn}
                                        rightContent={
                                            <View style={{ backgroundColor: theme.card }}>
                                                <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>%</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                        // Was a hardcoded "#ddd" border - a light grey that ignored
                                        // dark mode entirely and looked harsh/mismatched there.
                                        containerprops={{ width: RFvalue(76), borderColor: theme.theme === "dark" ? "#F1F5F9" : "#E2E8F0", borderWidth: 0.8 }}
                                        style={{ paddingHorizontal: RFvalue(8), height: RFvalue(34), fontSize: RFvalue(12) }}
                                        onChange={(text) => {
                                            setGainAndLoss('isTake', text, formData.buyorsell)
                                        }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                    />
                                </View>
                            </View>
                            {
                                trigger === "Limit" && (
                                    <Input
                                        value={barketOrders?.takeProfit?.price ?? ""}
                                        rightContent={
                                            <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                        label="Limit Price"
                                        labelStyle={{ color: Colors.grey, fontSize: RFvalue(11) }}
                                        onChange={(text) => {
                                            onChangeHandler('takeProfit', "price", text)
                                        }}
                                        style={{ textAlign: "right", marginRight: 25 }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                        bottom={RFvalue(8)}
                                        errorMessage={(errors as any)?.takeProfit?.price}
                                    />

                                )
                            }
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: RFvalue(8) }}>
                                <Text fontSize={RFvalue(12)} family="medium" style={{ color: Colors.grey }}>Stop Loss</Text>
                                <View style={{ flexDirection: 'row', justifyContent: "flex-end" }}>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: RFvalue(5), borderRadius: 8, borderWidth: 1, borderColor: stopLoss === "Market" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setstopLoss("Market"),
                                                onChangeHandler('stopLoss', 'orderType', 'bracket_sl_market')
                                        }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: stopLoss === "Market" ? Colors.brand : theme.primarytext }}>Market</Text>
                                    </Pressable>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: RFvalue(5), borderRadius: 8, marginLeft: 10, borderWidth: 1, borderColor: stopLoss === "Limit" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setstopLoss("Limit"),
                                                onChangeHandler('stopLoss', 'orderType', 'bracket_sl_limit')
                                        }}>
                                        <Text fontSize={RFvalue(11)} style={{ color: stopLoss === "Limit" ? Colors.brand : theme.primarytext }}>Limit</Text>
                                    </Pressable>
                                </View>
                            </View>
                            {
                                stopLoss !== "Trail" && (
                                    <>

                                        <Input
                                            value={barketOrders?.stopLoss?.stopPrice ?? ""}
                                            rightContent={
                                                <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                    <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                                </View>
                                            }
                                            themes={theme}
                                            background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                            label="Trigger Price"
                                            labelStyle={{ color: Colors.grey, fontSize: RFvalue(11) }}
                                            onChange={(text) => {
                                                onChangeHandler('stopLoss', "stopPrice", text)
                                            }}
                                            style={{ textAlign: "right", marginRight: 25 }}
                                            keyboardType="numeric"
                                            allowed={"number"}
                                            bottom={RFvalue(8)}
                                            errorMessage={(errors as any)?.stopLoss?.stopPrice}
                                        />
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: RFvalue(10) }}>
                                            <View style={{ width: "68%", flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: theme.card, height: RFvalue(34), borderRadius: 8 }}>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 0.25, formData.buyorsell) }}>
                                                    <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>0.25%</Text>
                                                </Pressable>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 0.5, formData.buyorsell) }}>
                                                    <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>0.5%</Text>
                                                </Pressable>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 1, formData.buyorsell) }}>
                                                    <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>1%</Text>
                                                </Pressable>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 2, formData.buyorsell) }}>
                                                    <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>2%</Text>
                                                </Pressable>
                                            </View>
                                            <View>
                                                <Input
                                                    value={lossPrecn}
                                                    rightContent={
                                                        <View style={{ backgroundColor: theme.card }}>
                                                            <Text fontSize={RFvalue(11)} style={{ color: theme.darktext }}>%</Text>
                                                        </View>
                                                    }
                                                    themes={theme}
                                                    background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                                    containerprops={{ width: RFvalue(76), borderColor: theme.theme === "dark" ? "#F1F5F9" : "#E2E8F0", borderWidth: 0.8 }}
                                                    style={{ paddingHorizontal: RFvalue(8), height: RFvalue(34), fontSize: RFvalue(12) }}
                                                    onChange={(text) => {
                                                        setGainAndLoss('isStop', text, formData.buyorsell)
                                                    }}
                                                    keyboardType="numeric"
                                                    allowed={"number"}
                                                />
                                            </View>
                                        </View>

                                    </>
                                )
                            }
                            {
                                stopLoss === "Limit" && (
                                    <Input
                                        value={barketOrders?.stopLoss?.price}
                                        rightContent={
                                            <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                        label="Limit Price"
                                        labelStyle={{ color: Colors.grey, fontSize: RFvalue(11) }}
                                        onChange={(text) => {
                                            onChangeHandler('stopLoss', "price", text)
                                        }}
                                        style={{ textAlign: "right", marginRight: 25 }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                        bottom={RFvalue(8)}
                                        // Wired to stopLoss.price, not takeProfit.stopPrice - the web
                                        // reference has this field pointed at the wrong error key
                                        // (a copy-paste slip from the Take Profit block above it).
                                        errorMessage={(errors as any)?.stopLoss?.price}
                                    />
                                )
                            }
                            {
                                stopLoss === "Trail" && (
                                    <Input
                                        rightContent={
                                            <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        background={theme.theme === "dark" ? "#111A2D" : "#FFFFFF"}
                                        label="Trail Amount"
                                        labelStyle={{ color: Colors.grey, fontSize: RFvalue(11) }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                    />

                                )
                            }
                            <View style={{ flexDirection: "row", width: "100%", alignItems: "center", justifyContent: "space-between", marginBottom: RFvalue(8) }}>
                                <View style={{ width: "50%" }}>
                                    <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                                        <Text size="small" style={{ color: theme.darktext }}>Exit PNL</Text>
                                        <Text size="small" style={{ color: Colors.green }}>{exitPandL} <Text size="small" style={{ color: theme.darktext }}>{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text></Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                                        <Text size="small" style={{ color: theme.darktext }} >Stop PNL</Text>
                                        <Text size="small" style={{ color: Colors.red }}>{stopPandL} <Text size="small" style={{ color: theme.darktext }}>{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text></Text>
                                    </View>
                                </View>
                                {/* Matches the web reference (BracketOrder.jsx) exactly - it never
                                    shows a popup for these errors, it just disables Confirm and
                                    (for the ones that have a field to attach to) shows the message
                                    inline under that field - see the four Input errorMessage props
                                    above. The failuretoast('Error', msg) this replaced was mobile-
                                    only invented UX with no web equivalent, and was what surfaced
                                    the single-letter "Error: T" toast in the first place. */}
                                <Button
                                    title="Confirm"
                                    disabled={hasErrors}
                                    onPress={onConfirm}
                                    // Button/index.tsx applies style.disabledButton (greys out the
                                    // background) before this buttonStyle in its style array, so
                                    // this explicit backgroundColor would otherwise always win and
                                    // the button would stay green-looking even while disabled -
                                    // conditioning it on hasErrors keeps the visual state honest.
                                    buttonStyle={{ width: '45%', paddingVertical: 10, backgroundColor: hasErrors ? theme.graytext : '#2EBD85' }}
                                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                />
                            </View>
                        </BottomSheetScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>

        </Sheet>
    )
}

// Stays mounted (just hidden) inside BuysellNew, which re-renders on every live
// futureTicker price tick - see ProfitOption.tsx's identical note. Without this,
// this sheet would re-render (and its internal state/effects re-run) on every tick
// even while closed and untouched, purely from the parent re-rendering.
const BracketOrders = React.memo(BracketOrdersComponent);

export default BracketOrders;