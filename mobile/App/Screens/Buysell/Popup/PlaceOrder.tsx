import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import Sheet from "../../../Components/bottomsheet";
import Flexcomponent from "../../../Components/flexcomponent";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import { calcLiquidationPrice } from "../../../Actions/Hooks/usePriceConversion";
import { RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks, { capitalizeFirst } from "../../../Actions/Hooks/customhook";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { styles } from "../styles";
import { ScrollView } from "react-native-gesture-handler";

const ORDER_TYPE_LABELS: any = {
    market: "Market",
    limit: "Limit",
    makeronly: "Maker Only",
    stop_limit: "Stop Limit",
    stop_market: "Stop Market",
    trailingStop: "Trailing Stop",
    take_profit_limit: "Take Profit Limit",
    take_profit: "Take Profit Market",
};

const CONDITIONAL_TYPES = ["stop_limit", "stop_market", "take_profit_limit", "take_profit", "trailingStop"];
const EXIT_TYPES = ["take_profit_limit", "take_profit"]
const STOP_TYPES = ["stop_limit", "stop_market", "trailingStop"];
const LIMIT_TYPES = ["limit", "market", "makeronly"];
const getOrderTypeLabels = (type: any) => ORDER_TYPE_LABELS[type] || "Limit";

const orderPriceEnum: any = {
    "market": "Mark",
    "last": "Last",
    "index": "Index",
}

interface ConfirmProps {
    ref?: any;
    formData?: any;
    loading?: any;
    orderPlacing?: any
    action?: any
    screen?: any
    data?: any
    page?: any
}

const PlaceOrderComponent: React.FC<ConfirmProps> = ({
    ref,
    formData = {},
    loading,
    orderPlacing,
    action,
    screen,
    data,
    page
}) => {
    const { theme, closebottomsheet } = useCustomHooks();
    const style = styles(theme);
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const { leverage } = useSelector((state: any) => state.auth);
    const tradePair = page === "options" ? data : futureTradePair;
    const ticker = page === "options" ? data : futureTicker;

    const [liquidityPrice, setLiquidityPrice] = useState(0);
    const [trigger_type, setTrigger_type] = useState("above");

    const side = action === "buy" ? "long" : "short";
    useEffect(() => {
        if (!isEmpty(formData)) {
            if (CONDITIONAL_TYPES.includes(formData?.orderType)) {
                let trigger_type = "above"
                if (STOP_TYPES.includes(formData?.orderType)) {
                    let trigger_type = action == "buy" ? "above" : "below"
                } else if (EXIT_TYPES.includes(formData?.orderType)) {
                    let trigger_type = action == "buy" ? "below" : "above"
                }
                setTrigger_type(trigger_type)
            }
            setLiquidityPrice(
                calcLiquidationPrice(side, formData?.price, leverage, tradePair.maintenanceMargin)
            );
        }
    }, [formData, side]);

    const notional = useMemo(() => {
        const basePrice =
            formData?.orderType === "market" ? ticker?.marketPrice : formData?.price;
        return ((basePrice || 0) * (formData?.quantity || 0)).toFixed(2);
    }, [formData, ticker]);

    return (
        <Sheet
            sheetref={ref}
            snappoint={[LIMIT_TYPES.includes(formData?.orderType) ? "55%" : "40%"]}
            custominterface={true}
            backgroundStyle={style.sheetContainer}
        >
            <View style={style.sheet}>
                <View style={style.between}>

                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}> Confirm your {getOrderTypeLabels(formData?.orderType)} Order</Text>
                    <Pressable onPress={() => { closebottomsheet(ref) }}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </View>
            </View>
            <ScrollView>
                <View style={{ padding: "5%", marginBottom: 30 }}>
                    {
                        LIMIT_TYPES.includes(formData?.orderType) && (
                            <Text color={theme.darktext}><Text color={Colors.green}><Text color={action == 'buy' ? Colors.green : Colors.red}>{capitalizeFirst(action)}</Text></Text> {formData?.quantity} of {formatDisplayPair(ticker?.tickerRoot)}{" "}{action === "buy" ? "<=" : ">="} {formData?.price}</Text>
                        )
                    }

                    {
                        CONDITIONAL_TYPES.includes(formData?.orderType) && (
                            <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                                <Text color={theme.darktext}> Trigger at {orderPriceEnum[formData.trailType]} Price @ {formData?.stopPrice} and {trigger_type}</Text>
                            </Flexcomponent>
                        )
                    }

                    <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                        <Text color={Colors.grey}>Notional</Text>
                        <Text color={theme.darktext}>{notional} {formatDisplayPair(ticker?.quoteCurrency)}</Text>
                    </Flexcomponent>
                    {
                        LIMIT_TYPES.includes(formData?.orderType) && (
                            <>
                                <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                                    <Text color={Colors.grey}>Est. Margin Required</Text>
                                    <Text color={theme.darktext}>{formatValue(formData?.margin, tradePair.quoteDecimal)} {formatDisplayPair(ticker?.quoteCurrency)} @{" "} {Number(leverage).toFixed(Number.isInteger(Number(leverage)) ? 0 : 1)}x</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                                    <Text color={Colors.grey}>Est. Trading Fee</Text>
                                    <Text color={theme.darktext}>{formatValue(formData?.fees, tradePair.quoteDecimal)} {formatDisplayPair(ticker?.quoteCurrency)}</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                                    <Text color={Colors.grey}>Est. Execution Price</Text>
                                    <Text color={theme.darktext}>{ticker?.marketPrice} {formatDisplayPair(tradePair?.quoteCurrency)}</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                                    <Text color={Colors.grey}>Est. Liquidation Price</Text>
                                    <Text color={theme.darktext}>{screen ? `${liquidityPrice} ${formatDisplayPair(tradePair?.quoteCurrency) ?? ""}` : "NA"}</Text>
                                </Flexcomponent>
                                {/* {
                                screen && (
                                    <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                                        <Text color={Colors.grey}>Est. Premium to be received</Text>
                                        <Text color={theme.darktext}>{ticker?.marketPrice} {ticker?.quoteCurrency}</Text>
                                    </Flexcomponent>
                                )
                            } */}
                            </>
                        )
                    }
                    <Flexcomponent justifyContent="space-between" style={{ marginTop: "2.5%" }}>
                        <Text color={Colors.grey}>Pos. Size after Execution</Text>
                        <Text color={theme.darktext}>{action === "sell" && "-"}
                            {formData?.quantity} Qty</Text>
                    </Flexcomponent>
                    <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginVertical: "5%" }}>
                        <Button
                            title="Place Order"
                            loading={loading}
                            onPress={async () => {
                                await orderPlacing();
                                setTimeout(() => {
                                    closebottomsheet(ref);
                                }, 600);
                            }}
                            buttonStyle={{ width: "48%" }}
                            vibration={true}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                        <Button
                            title="Cancel"
                            buttonStyle={{ width: "48%", backgroundColor: theme.background, borderWidth: 1.5, borderColor: Colors.brand }}
                            textStyle={{ color: Colors.brand }}
                            onPress={() => closebottomsheet(ref)}
                        />
                    </Flexcomponent>
                    <Text size="small" color={theme.darktext}>
                        NB: All orders must execute within the allowed trading band. The
                        part of your order that will breach the trading band on execution
                        will be changed to a limit order with price = max allowed price.
                    </Text>

                </View>
            </ScrollView>
        </Sheet>
    )

}

// Stays mounted (just hidden) inside BuysellNew, which re-renders on every live
// futureTicker socket tick - without memoizing, every tick re-ran this whole sheet
// (fee/liquidation calculations included) even while closed, competing for the JS
// thread with things like the Leverage popup's drag-to-slide interaction.
const PlaceOrder = React.memo(PlaceOrderComponent);

export default PlaceOrder;