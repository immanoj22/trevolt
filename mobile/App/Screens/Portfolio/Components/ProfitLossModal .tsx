import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import Text from "../../../Components/text";
import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import { athuDataProps } from "../../../Actions/type";
import VectorIcons from "../../../Utilities/vectoricons";
import { Button, Input } from "../../../Components/Field";
import { isEmpty } from "../../../Utilities/helerfunction";
import Flexcomponent from "../../../Components/flexcomponent";
import { useUpdateBracketMutation } from "../../../Slices/future";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";

interface ProfitLossModalprops {
    ref?: any
    orderData?: any
}

const initialState = {
    pairId: "",
    positionSide: "0",
    entryPrice: "0",
    positionFilled: "0",
    exitPandL: "0",
    stopPandL: "0",
    takeProfit: {
        type: "takeprofit",
        stopPrice: "0",
        orderType: "bracket_tp_market",
        price: "0"
    },
    stopLoss: {
        type: "stoploss",
        stopPrice: "0",
        orderType: "bracket_sl_market",
        price: "0"
    }
}

const ProfitLossModal: React.FC<ProfitLossModalprops> = ({
    ref,
    orderData
}) => {
    const { theme, closebottomsheet, successtoast, failuretoast } = useCustomHooks();

    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);

    const [formdata, setFormdata] = useState<athuDataProps>(initialState);
    const [exitPandL, setExitPandL] = useState(0)
    const [stopPandL, setStopPandL] = useState(0)
    const [gainPrecn, setGainPercen] = useState<any>('0')
    const [lossPrecn, setLossPercen] = useState<any>('0')
    const [errors, setErrors] = useState({})
    const [trigger, setTrigger] = useState("Market")
    const [stopLoss, setstopLoss] = useState("Market")

    const { triggerpositionOrders } = useApihooks();

    const [updateBracket, { isLoading, error, status }] = useUpdateBracketMutation();

    const changeBraketOrder = async () => {

        try {
            const payload: any = {
                bracketOrders: [formdata.takeProfit, formdata.stopLoss],
                pairId: formdata.pairId,
                entryPrice: formdata.entryPrice,
                positionSide: formdata.positionSide,
                positionFilled: formdata.positionFilled,
            }
            const response = await updateBracket(payload).unwrap();

            if (response.success) {
                successtoast("Success", response.message);
                triggerpositionOrders()
                setExitPandL(0);
                setStopPandL(0);
                closebottomsheet(ref)
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (err: any) {
            let msg =
                err?.data?.errors?.takeProfit?.stopPrice ||
                err?.data?.errors?.stopLoss?.stopPrice ||
                err?.data?.message ||
                "Failed to update bracket order";

            // Flatten nested objects safely
            while (typeof msg === "object" && msg !== null) {
                msg = Object.values(msg)[0];
            }

            failuretoast("Order Error", String(msg));
        }
    }

    const checkTpandSl = (type: any, value: any, buyorsell = 'buy') => {

        try {
            if (buyorsell == 'buy' && value < futureTicker.marketPrice && type == 'isTake') {
                setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be greater than market price' } })
            }
            else if (buyorsell == 'sell' && value > futureTicker.marketPrice && type == 'isTake') {
                setErrors({ ...errors, ...{ 'takeProfitPrice': 'Take profit price must be less than market price' } })
            } else if (type == 'isTake') {

                setErrors(errors)
            }
            if (buyorsell == 'buy' && value > futureTicker.marketPrice && type == 'isStop') {
                setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be less than market price' } })
            }
            else if (buyorsell == 'sell' && value < futureTicker.marketPrice && type == 'isStop') {
                setErrors({ ...errors, ...{ 'stopLossPrice': 'Stop Loss price must be greater than market price' } })
            } else if (type == 'isStop') {
                setErrors(errors)
            }
        } catch (err) {
            console.log(err, 'CheckTpandSl')
        }
    }

    const setGainAndLoss = (type: any, value: any, call = 'edit') => {
        try {
            const buyorsell = orderData.positionSide == 'short' ? 'sell' : 'buy'
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
                let barket = { ...formdata }
                barket[name]['stopPrice'] = value
                setFormdata(barket)
                checkTpandSl(isTake ? 'isTake' : 'isStop', value);
                // onChangeHandler(name, 'stopPrice', '');
                return false;
            }
            let marketPrice: any = parseFloat(futureTradePair.marketPrice);
            if (orderData.positionSide == 'short') {
                marketPrice = isTake ? orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice
            } else if (orderData.positionSide == 'long') {
                marketPrice = isTake ? orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice
            }
            marketPrice = parseFloat(marketPrice)
            const percent = parseFloat(value);
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
            stopPrice = isNaN(stopPrice) || !isFinite(stopPrice) ? 0 : stopPrice.toFixed(futureTradePair.quoteDecimal)
            // Apply updates
            if (isTake) {
                // setGainPercen(value);
                checkTpandSl('isTake', stopPrice);
            } else {
                // setLossPercen(value);
                checkTpandSl('isStop', stopPrice);
            }
            if (call == 'initial') {
                return stopPrice
            } else {
                let barket = { ...formdata }
                barket[name]['stopPrice'] = isNaN(stopPrice) ? '' : stopPrice
                setFormdata(barket)
                // onChangeHandler(name, 'stopPrice', isNaN(stopPrice) ? '' : stopPrice);
            }
        } catch (err) {
            console.error('SetGainAndLoss__err', err);
        }
    };

    const calculatePercentage = (stopPrice: any, type: any) => {
        try {
            const buyorsell = orderData.positionSide == 'short' ? 'sell' : 'buy'
            const isTake = type === 'isTake';
            const isStop = type === 'isStop';
            if (stopPrice == '') {
                if (isTake) {
                    setGainPercen('');
                } else if (isStop) {
                    setLossPercen('');
                }
                return false
            }
            let marketPrice = parseFloat(futureTradePair.marketPrice);
            if (orderData.positionSide == 'short') {
                marketPrice = isTake ? orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice
            } else if (orderData.positionSide == 'long') {
                marketPrice = isTake ? orderData.entryPrice > marketPrice ? orderData.entryPrice : marketPrice : orderData.entryPrice < marketPrice ? orderData.entryPrice : marketPrice
            }
            let percentage: any = 0;
            if (buyorsell === 'buy') {
                percentage = ((stopPrice - marketPrice) / marketPrice) * 100;
            } else if (buyorsell === 'sell') {
                percentage = ((marketPrice - stopPrice) / marketPrice) * 100;
            }
            percentage = (percentage).toFixed(2)
            if (isTake) {
                setGainPercen(Math.abs(percentage));
            } else if (isStop) {
                setLossPercen(Math.abs(percentage));
            }
        } catch (err) {
            console.log('calculatePercentage__err', err)
        }
    }

    const onConfirm = () => {
        const error: any = {
            takeProfit: {},
            stopLoss: {}
        };

        if (isEmpty(formdata.takeProfit?.stopPrice)) {
            error.takeProfit.stopPrice = 'Stop price is required';
        }
        if (isEmpty(formdata.takeProfit?.price) && trigger === 'Limit') {
            error.takeProfit.price = 'Price is required';
        }
        if (isEmpty(formdata.takeProfit?.orderType)) {
            error.takeProfit.orderType = 'Order type is required';
        }

        if (isEmpty(formdata.stopLoss?.stopPrice)) {
            error.stopLoss.stopPrice = 'Stop price is required';
        }
        if (isEmpty(formdata.stopLoss?.price) && stopLoss === 'Limit') {
            error.stopLoss.price = 'Price is required';
        }
        if (isEmpty(formdata.stopLoss?.orderType)) {
            error.stopLoss.orderType = 'Order type is required';
        }

        if (Object.keys(error.takeProfit).length === 0) {
            delete error.takeProfit;
        }
        if (Object.keys(error.stopLoss).length === 0) {
            delete error.stopLoss;
        }
        changeBraketOrder()
    };

    const getPorfitCalculation = (entryPrice: any, closePrice: any, quantity: any, positionSide: any) => {
        try {
            let profit = 0
            if (positionSide == 'short') {
                profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
            } else {
                profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
            }
            return profit
        } catch (err) {
            console.log("getPorfitCalculation_err", err)
            return 0
        }
    }

    const onChangeHandler = (field: any, name: any, value: any) => {
        const numberRegex = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
        if (['stopPrice', 'price'].includes(name) && !numberRegex.test(value) && value !== '') {
            return false;
        }
        let barket: any = { ...formdata }
        barket[field][name] = value

        if (!isNaN(value)) {
            calculatePercentage(value, field == 'takeProfit' ? 'isTake' : 'isStop')
        }
        setFormdata(barket)
        calculatePandL(barket)
    }

    const calculatePandL = (order: any) => {
        const error: any = {
            takeProfit: {},
            stopLoss: {}
        };
        let stop: any, exit: any = 0
        if (trigger.toLowerCase() == 'market') {
            exit = getPorfitCalculation(order.entryPrice, isEmpty(order.takeProfit.stopPrice) ? 0 : order.takeProfit.stopPrice, order.positionFilled, order.positionSide)
        } else if (trigger.toLowerCase() == 'limit') {
            exit = getPorfitCalculation(order.entryPrice, isEmpty(order.takeProfit.price) ? 0 : order.takeProfit.price, order.positionFilled, order.positionSide)
        }
        if (stopLoss.toLowerCase() == 'market') {
            stop = getPorfitCalculation(order.entryPrice, isEmpty(order.stopLoss.stopPrice) ? 0 : order.stopLoss.stopPrice, order.positionFilled, order.positionSide)
        } else if (stopLoss.toLowerCase() == 'limit') {
            stop = getPorfitCalculation(order.entryPrice, isEmpty(order.stopLoss.price) ? 0 : order.stopLoss.price, order.positionFilled, order.positionSide)
        }
        if (isEmpty(order.takeProfit.stopPrice)) {
            error.takeProfit.stopPrice = 'Trigger price is required'
        } else if ((order.positionSide == 'long' && parseFloat(order.entryPrice) >= parseFloat(order.takeProfit.stopPrice))) {
            error.takeProfit.stopPrice = 'Trigger price must be greater than entry price'
        } else if ((order.positionSide == 'short' && parseFloat(order.entryPrice) <= parseFloat(order.takeProfit.stopPrice))) {
            error.takeProfit.stopPrice = 'Trigger price must be lesser than entry price'
        }
        if (isEmpty(order.stopLoss.stopPrice)) {
            error.stopLoss.stopPrice = 'Trigger price is required'
        } else if ((order.positionSide == 'long' && parseFloat(order.entryPrice) <= parseFloat(order.stopLoss.stopPrice))) {
            error.stopLoss.stopPrice = 'Trigger price must be lesser than entry price'
        } else if ((order.positionSide == 'short' && parseFloat(order.entryPrice) >= parseFloat(order.stopLoss.stopPrice))) {
            error.stopLoss.stopPrice = 'Trigger price must be greater than entry price'
        }
        if (Object.keys(error.takeProfit).length === 0) {
            delete error.takeProfit;
        }
        if (Object.keys(error.stopLoss).length === 0) {
            delete error.stopLoss;
        }
        setStopPandL(isNaN(stop) ? 0 : stop === 0 ? 0 : stop.toFixed(futureTradePair?.quoteDecimal))
        setExitPandL(isNaN(exit) ? 0 : exit === 0 ? 0 : exit.toFixed(futureTradePair?.quoteDecimal))
    }

    useEffect(() => {
        if (isEmpty(orderData)) return
        const bracketOrders = orderData?.bracketOrders || [];
        const takeProfit = bracketOrders.find((el: any) => el.type === "takeprofit");
        const stopLoss = bracketOrders.find((el: any) => el.type === "stoploss");
        if (!isEmpty(takeProfit)) {
            setTrigger(takeProfit?.orderType == "bracket_tp_market" ? "Market" : 'Limit')
        }
        if (!isEmpty(stopLoss)) {
            setstopLoss(stopLoss?.orderType == "bracket_sl_market" ? "Market" : 'Limit')
        }
        const updateData = {
            pairId: orderData.pairId,
            orderId: orderData._id,
            entryPrice: orderData.price ?? orderData.entryPrice,
            positionFilled: orderData.quantity,
            positionSide: orderData.positionSide,
            takeProfit: {
                type: "takeprofit",
                stopPrice: takeProfit?.stopPrice ?? 0,
                orderType: takeProfit?.orderType ?? "bracket_tp_market",
                price: takeProfit?.price ?? 0,
            },
            stopLoss: {
                type: "stoploss",
                stopPrice: stopLoss?.stopPrice ?? 0,
                orderType: stopLoss?.orderType ?? "bracket_sl_market",
                price: stopLoss?.price ?? 0,
            }
        }
        if (isEmpty(updateData.takeProfit.stopPrice)) {
            let stopPrice = setGainAndLoss('isTake', "0.25", 'initial')
            updateData.takeProfit.stopPrice = stopPrice
        }
        if (isEmpty(updateData.stopLoss.stopPrice)) {
            let stopPrice = setGainAndLoss('isStop', "0.25", 'initial')
            updateData.stopLoss.stopPrice = stopPrice
        }
        setFormdata((prev) => ({
            ...prev,
            ...updateData
        }));
        calculatePandL(updateData);
    }, [orderData])


    return (
        <Sheet
            sheetref={ref}
            snappoint={["80%"]}
            custominterface={true}
            // KeyboardAwareScrollView (below) isn't a gorhom scrollable, so the sheet's
            // content-pan gesture would otherwise eat vertical drags instead of letting
            // the list scroll. The sheet still closes via the header X / backdrop.
            bottomSheetProps={{ enableContentPanningGesture: false }}
        >
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: "5%", flex: 1, paddingBottom: "5%" }} >
                    <View style={{ flexDirection: "row", width: windowwidth, alignSelf: "center", height: windowheight * 0.08, paddingHorizontal: "5%", justifyContent: "space-between", alignItems: "center" }} >
                        <Text color={theme.tabactive} family="semiBold">Add Bracket Order: {formatDisplayPair(orderData?.pairName)}</Text>
                        <Pressable style={{ backgroundColor: theme.card, borderRadius: 10, padding: 10 }} onPress={() => {
                            setExitPandL(0);
                            setStopPandL(0);
                            closebottomsheet(ref)
                        }}>
                            <VectorIcons
                                family="Ionicons"
                                name="close"
                                size={windowwidth * 0.05}
                                iconcolor={theme.darktext}
                            />
                        </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                        <KeyboardAwareScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: "25%" }}
                            showsVerticalScrollIndicator={false}
                            // Gap kept between the focused input and the top of the keyboard.
                            bottomOffset={24}
                        >
                            <Flexcomponent justifyContent="space-between" style={{ marginTop: 10 }}>
                                <Text style={{ color: Colors.grey }}>Entry Price</Text>
                                <Text style={{ color: theme.theme == "dark" ? Colors.white : Colors.grey }}>{formdata?.entryPrice}</Text>
                            </Flexcomponent>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: '5%' }}>
                                <Text style={{ color: Colors.grey }}>Take Profit</Text>
                                <View style={{ flexDirection: 'row', justifyContent: "flex-end" }}>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: trigger === "Market" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setTrigger("Market")
                                            onChangeHandler('takeProfit', 'orderType', 'bracket_tp_market')
                                        }}>
                                        <Text style={{ color: trigger === "Market" ? Colors.brand : theme.primarytext, }}>Market</Text>
                                    </Pressable>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: 5, borderRadius: 10, marginLeft: 15, borderWidth: 1, borderColor: trigger === "Limit" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setTrigger("Limit")
                                            onChangeHandler('takeProfit', 'orderType', 'bracket_tp_limit')
                                        }}>
                                        <Text style={{ color: trigger === "Limit" ? Colors.brand : theme.primarytext }}>Limit</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={{ marginTop: "5%" }} >
                                <Input
                                    value={formdata?.takeProfit?.stopPrice}
                                    rightContent={
                                        <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                            <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                        </View>
                                    }
                                    themes={theme}
                                    label="Trigger Price"
                                    labelStyle={{ color: Colors.grey }}
                                    onChange={(text) => onChangeHandler('takeProfit', "stopPrice", text)}
                                    style={{ textAlign: "right", marginRight: 25 }}
                                    keyboardType="numeric"
                                    allowed={"number"}
                                />
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: "5%" }}>
                                <View style={{ width: "68%", flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: theme.card, height: 40, borderRadius: 10 }}>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 0.25) }}>
                                        <Text size="small" style={{ color: theme.darktext }}>0.25%</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 0.5) }}>
                                        <Text size="small" style={{ color: theme.darktext }}>0.5%</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 0.1) }}>
                                        <Text size="small" style={{ color: theme.darktext }}>0.1%</Text>
                                    </Pressable>
                                    <Pressable onPress={() => { setGainAndLoss('isTake', 0.2) }}>
                                        <Text size="small" style={{ color: theme.darktext }}>0.2%</Text>
                                    </Pressable>
                                </View>
                                <View>
                                    <Input
                                        value={gainPrecn}
                                        rightContent={
                                            <View style={{ backgroundColor: theme.card }}>
                                                <Text style={{ color: theme.darktext }}>%</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        containerprops={{ width: 100, borderColor: "#ddd", borderWidth: 0.9 }}
                                        style={{ paddingHorizontal: 10, height: 40 }}
                                        onChange={(text) => {
                                            setGainAndLoss('isTake', text)
                                        }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                    />
                                </View>
                            </View>
                            {
                                trigger === "Limit" && (
                                    <Input
                                        value={formdata?.takeProfit?.price}
                                        rightContent={
                                            <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        label="Limit Price"
                                        labelStyle={{ color: Colors.grey }}
                                        onChange={(text) => {
                                            onChangeHandler('takeProfit', "price", text)
                                        }}
                                        style={{ textAlign: "right", marginRight: 25 }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                    />

                                )
                            }
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: "4%" }}>
                                <Text style={{ color: Colors.grey }}>Stop Loss</Text>
                                <View style={{ flexDirection: 'row', justifyContent: "flex-end" }}>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: stopLoss === "Market" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setstopLoss("Market"),
                                                onChangeHandler('stopLoss', 'orderType', 'bracket_sl_market')
                                        }}>
                                        <Text style={{ color: stopLoss === "Market" ? Colors.brand : theme.primarytext }}>Market</Text>
                                    </Pressable>
                                    <Pressable style={{ width: "35%", backgroundColor: theme.card, justifyContent: "center", alignItems: "center", paddingVertical: 5, borderRadius: 10, marginLeft: 15, borderWidth: 1, borderColor: stopLoss === "Limit" ? Colors.brand : theme.boderColor }}
                                        onPress={() => {
                                            setstopLoss("Limit"),
                                                onChangeHandler('stopLoss', 'orderType', 'bracket_sl_limit')
                                        }}>
                                        <Text style={{ color: stopLoss === "Limit" ? Colors.brand : theme.primarytext }}>Limit</Text>
                                    </Pressable>
                                </View>
                            </View>
                            {
                                stopLoss !== "Trail" && (
                                    <>
                                        <Input
                                            value={formdata?.stopLoss?.stopPrice}
                                            rightContent={
                                                <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                    <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                                </View>
                                            }
                                            themes={theme}
                                            label="Trigger Price"
                                            labelStyle={{ color: Colors.grey }}
                                            onChange={(text) => {
                                                onChangeHandler('stopLoss', "stopPrice", text)
                                            }}
                                            style={{ textAlign: "right", marginRight: 25 }}
                                            keyboardType="numeric"
                                            allowed={"number"}
                                        />

                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: "5%" }}>
                                            <View style={{ width: "68%", flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: theme.card, height: 40, borderRadius: 10 }}>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 0.25) }}>
                                                    <Text size="small" style={{ color: theme.darktext }}>0.25%</Text>
                                                </Pressable>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 0.5) }}>
                                                    <Text size="small" style={{ color: theme.darktext }}>0.5%</Text>
                                                </Pressable>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 0.1) }}>
                                                    <Text size="small" style={{ color: theme.darktext }}>0.1%</Text>
                                                </Pressable>
                                                <Pressable onPress={() => { setGainAndLoss('isStop', 0.2) }}>
                                                    <Text size="small" style={{ color: theme.darktext }}>0.2%</Text>
                                                </Pressable>
                                            </View>
                                            <View>
                                                <Input
                                                    value={lossPrecn}
                                                    rightContent={
                                                        <View style={{ backgroundColor: theme.card }}>
                                                            <Text style={{ color: theme.darktext }}>%</Text>
                                                        </View>
                                                    }
                                                    themes={theme}
                                                    containerprops={{ width: 100, borderColor: "#ddd", borderWidth: 0.9 }}
                                                    style={{ paddingHorizontal: 10, height: 40 }}
                                                    onChange={(text) => {
                                                        setGainAndLoss('isStop', text)
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
                                        value={formdata?.stopLoss?.price}
                                        rightContent={
                                            <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                                <Text color={Colors.white} size="small">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                            </View>
                                        }
                                        themes={theme}
                                        label="Limit Price"
                                        labelStyle={{ color: Colors.grey }}
                                        onChange={(text) => {
                                            onChangeHandler('stopLoss', "price", text)
                                        }}
                                        style={{ textAlign: "right", marginRight: 25 }}
                                        keyboardType="numeric"
                                        allowed={"number"}
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
                                        label="Trail Amount"
                                        labelStyle={{ color: Colors.grey }}
                                        keyboardType="numeric"
                                        allowed={"number"}
                                    />

                                )
                            }
                            <View style={{ flexDirection: "row", width: "100%", alignItems: "center", justifyContent: "space-between", marginBottom: "3%" }}>
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
                                <Button
                                     title="Confirm"
                                    onPress={onConfirm}
                                    buttonStyle={{ width: '45%', paddingVertical: 10, backgroundColor: '#2EBD85' }}
                                    loading={isLoading}
                                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                // disabled={!isEmpty(errors) && Object.keys(errors).length > 0 ? true : false}
                                />
                            </View>


                        </KeyboardAwareScrollView>
                    </View>
                </View>
            </View>
        </Sheet>
    )
}

export default ProfitLossModal;