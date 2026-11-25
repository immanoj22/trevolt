import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import useApiError from "../../Actions/Hooks/errorhook";

import Text from "../../Components/text";
import Flexcomponent from "../../Components/flexcomponent";
import { Button, Dropdown, Input } from "../../Components/Field";
import VectorIcons from "../../Utilities/vectoricons";
import { Colors, Fontsize } from "../../Utilities/uiasset";
import {
    borderradius,
    RFvalue,
    windowheight,
    windowwidth,
} from "../../Utilities/dimensions";

import { useFutureLeverageMutation } from "../../Slices/future";
import { setUserLeverage } from "../../Slices/auth";
import { useOptionPlaceMutation, optionTradeSelector } from "../../Slices/option";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { formatDisplayPair } from "../../Utilities/formatPair";

import { styles } from "./styles";
import Leverage from "./Popup/Leverage";
import UpdateMargin from "../Profile/SubAccount/Manage/UpdateMargin";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import ProfitOption from "./Popup/ProfitOption";

// Matches the labels ProfitOption.tsx's sheet uses for screen="options" (only these two
// apply here - the rest are futures-only order types).
const ADVANCED_ORDER_TYPE_LABELS: Record<string, string> = {
    stop_limit: "Stop Limit",
    take_profit_limit: "Take Profit Limit",
};

interface OptionBuySellProps {
    embedded?: boolean;
    pageName?: string;
    screen?: string;
    data?: any;
    onClose?: () => void;
}

const OptionBuySell = ({
    embedded,
    pageName,
    screen,
    data: contract,
    onClose,
}:OptionBuySellProps) => {
    const { theme, navigation, bottomsheetref, closebottomsheet, openbottomsheet, successtoast, failuretoast, dispatch } = useCustomHooks();

    // useCustomHooks() rebuilds successtoast/failuretoast fresh every render, so they
    // can't be useCallback deps without defeating the memoized <Leverage> popup (it
    // stays mounted and re-renders on every socket tick otherwise). Read the latest
    // ones from a ref instead - same pattern buysellNew.tsx uses.
    const hookFnsRef = useRef({ successtoast, failuretoast });
    hookFnsRef.current = { successtoast, failuretoast };

    const style = styles(theme);

    // -----------------------------
    // LIVE DATA
    // -----------------------------

    const { takerFee } = useSelector(optionTradeSelector);
    // The user's actual saved leverage and the currently selected sub-account's margin
    // mode - same source of truth used by buysellNew.tsx (Futures) and correctly read
    // already by Positions.tsx/OpenOrders.tsx elsewhere.
    const currentLeverage = useSelector((state: any) => state.auth.leverage);
    const accountMarginMode = useSelector((state: any) => state.auth.userData?.marginMode);
    // Same fix as buysellNew.tsx - UpdateMargin needs accountId to submit; it was
    // never passed down here either.
    const activeAccountId = useSelector((state: any) => state.auth.userData?.accountId);
    const { wallet } = useSelector((state: any) => state.wallet);

    const tradePair: any = {
        _id: contract?._id,
        baseCurrency: contract?.baseCurrency ?? "",
        quoteCurrency: contract?.quoteCurrency ?? "",
        minAmount: contract?.minAmount ?? 0,
        marketPrice: Number.isFinite(contract?.marketPrice) ? contract.marketPrice : 0,
        maxLeverage: contract?.max_leverage ?? contract?.maxLeverage ?? 100,
        max_leverage: contract?.max_leverage ?? contract?.maxLeverage ?? 100,
        quoteDecimal: contract?.quoteDecimal ?? 2,
        baseDecimal: contract?.baseDecimal ?? 4,
    };

    const availableBalance = wallet?.availableBalance ?? 0;

    // -----------------------------
    // STATES
    // -----------------------------

    const [actions, setAction] = useState<"buy" | "sell">("buy");

    const [orderType, setOrderType] = useState<
        "limit" | "market" | "stop_limit"
    >("limit");

    const [quantityIn, setQuantityIn] = useState("lot");
    // Must stay a stable reference, not an inline `list={[...]}` literal - the
    // underlying react-native-element-dropdown re-runs a useEffect keyed on this
    // array's identity and calls setListData whenever it changes. A fresh literal
    // every render was retriggering that effect on every live-price socket tick,
    // which was enough to trip React's "Maximum update depth exceeded" guard.
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

    const [price, setPrice] = useState((contract?.marketPrice ?? 0).toString());

    const [quantity, setQuantity] = useState("");

    const [stopPrice, setStopPrice] = useState("");

    const [leverage, setLeverage] = useState(currentLeverage || tradePair.max_leverage || 100);

    // Was hardcoded and never synced with the user's actually saved values -
    // navigating away and back always reset both to their hardcoded defaults
    // regardless of what was last set/saved. Same fix as buysellNew.tsx.
    useEffect(() => {
        if (currentLeverage) setLeverage(currentLeverage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLeverage]);

    useEffect(() => {
        if (tradePair.max_leverage && leverage > tradePair.max_leverage) {
            setLeverage(tradePair.max_leverage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tradePair.max_leverage]);

    const [marginMode, setMarginMode] = useState(accountMarginMode || "isolated");

    useEffect(() => {
        if (accountMarginMode) setMarginMode(accountMarginMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountMarginMode]);

    const [reduceOnly, setReduceOnly] = useState(false);

    const [makerOnly, setMakerOnly] = useState(false);

    const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
        null
    );


    const [leverageVisible, setLeverageVisible] = useState(false);
    const [futureChangeLeverage, { isLoading: levgLod, error: levgErr }] = useFutureLeverageMutation();
    const [optionOrderPlacing, { isLoading: orderLoading, error: orderErr }] = useOptionPlaceMutation();

    useApiError(levgErr ?? orderErr);
    const updateMarginsheetref = useRef<BottomSheetModal>(null);
    const placeOrderref = useRef<BottomSheetModal>(null);
    const profitOptionref = useRef<BottomSheetModal>(null);
    const addBracketref = useRef<BottomSheetModal>(null);

    // -----------------------------
    // STATIC CALCULATED VALUES
    // -----------------------------

    const safeNumber = (value: any) => (Number.isFinite(value) ? value : 0);

    const numericQuantity = Number(quantity) || 0;
    const numericPrice = Number(price) || tradePair.marketPrice;

    const orderValue = safeNumber(numericQuantity * numericPrice);

    const fees = safeNumber(orderValue * (Number(takerFee || 0) / 100) * 2 * 1.18);

    const orderCost = safeNumber(orderValue / leverage);

    const marginRequired = safeNumber(orderCost + fees);

    // -----------------------------
    // PERCENTAGE
    // -----------------------------

    const quantityPercentage = [25, 50, 75, 100];

    const handlePercentage = (percentage: number) => {
        setSelectedPercentage(percentage);

        const investBalance = availableBalance * (percentage / 100);
        const orderValueAtBalance = investBalance * leverage;
        const quantity = tradePair.marketPrice > 0
            ? (orderValueAtBalance / tradePair.marketPrice).toFixed(tradePair.baseDecimal)
            : "";

        setQuantity(quantity);
    };

    // -----------------------------
    // ORDER TYPE
    // -----------------------------

    const changeOrderType = (
        type: "limit" | "market" | "stop_limit"
    ) => {
        setOrderType(type);

        if (type === "market") {
            setPrice(tradePair.marketPrice.toString());
        }
    };

    // Memoized so the prop stays stable across the screen's socket-tick re-renders -
    // the <Leverage> popup is React.memo'd and a fresh function reference every
    // render defeats that, re-rendering the whole popup (and fighting a drag) on
    // every tick. Toasts read from hookFnsRef.
    const closeLeverage = useCallback(() => setLeverageVisible(false), []);
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
                // Push the newly saved leverage into redux immediately, same fix as
                // buysellNew.tsx - otherwise state.auth.leverage stays stale until the
                // next full userData refetch. Also set it directly rather than relying
                // solely on the userLeverage-watching effect to catch up - that round
                // trip was what left the "Leverage Nx" badge showing the old value.
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tradePair._id, futureChangeLeverage, dispatch])

    const handleOrderListSelect = (value: any) => {
        closebottomsheet(bottomsheetref);
    };

    const placeOrder = async () => {
        if (!tradePair._id) {
            failuretoast("Error", "Please wait, pair is loading");
            return;
        }
        if (!numericQuantity || numericQuantity <= 0) {
            failuretoast("Error", "Enter a valid quantity");
            return;
        }
        try {
            const payload = {
                pairId: tradePair._id,
                price: orderType === "market" ? tradePair.marketPrice : price,
                quantity,
                buyorsell: actions,
                orderType: makerOnly ? "makeronly" : orderType,
                stopPrice,
                reduce_only: reduceOnly,
                makeronly: makerOnly,
                leverage,
            };
            const response = await optionOrderPlacing(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                setQuantity("");
                setSelectedPercentage(null);
                onClose?.();
            } else {
                failuretoast("Error", response.message || "Something went wrong!");
            }
        } catch (e) {
            console.log("placeOrder__err", e);
        }
    };

    return (
        <View style={{ flex: 1 }}>
                {/* ========================================= */}
                {/* BUY / SELL */}
                {/* ========================================= */}

                <View
                    style={{
                        flexDirection: "row",
                        width: "100%",
                        alignSelf: "stretch",
                        marginTop: "4%",
                        gap: 10,
                    }}
                >
                    <Pressable
                        onPress={() => setAction("buy")}
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingVertical: 10,
                            borderRadius: borderradius * 0.6,
                            backgroundColor: actions === "buy" ? "#2563EB" : (theme.theme === "dark" ? "#111A2D" : "#FFFFFF"),
                            borderWidth: 1,
                            borderColor: actions === "buy" ? "#2563EB" : theme.boderColor,
                        }}
                    >
                        <Text
                            family={actions === "buy" ? "semiBold" : "regular"}
                            fontSize={RFvalue(12)}
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
                            fontSize={RFvalue(12)}
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
                        marginTop: "5%",
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
                            <Text
                                numoflines={1}
                                color={Colors.grey}
                                fontSize={RFvalue(10)}
                                /* Flexible so a wide decimal leverage value ("39.04x") shrinks/
                                   ellipsizes instead of pushing the chevron icon past the pill's
                                   right edge - previously unconstrained, sized to fixed short
                                   values like "10x". */
                                style={{ flexShrink: 1, marginRight: 4 }}
                            >
                                Leverage{" "}
                                <Text color={Colors.brand} fontSize={RFvalue(10)}>
                                    {Number(leverage).toFixed(Number.isInteger(Number(leverage)) ? 0 : 1)}x
                                </Text>
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
                        marginTop: "5%",
                        marginBottom: "5%",
                        borderBottomWidth: 0.8,
                        borderBottomColor: theme.theme == 'dark' ? "#F1F5F9" : "#E2E8F0",
                        paddingBottom: "3%",
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
                                width: "28%",
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
                                // Same default-to-first-item fix as buysellNew.tsx - only
                                // when nothing from this sheet is already selected.
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

                {orderType !== "market" && (
                    <Input
                        value={price}
                        placeHolder="Price"
                        themes={theme}
                        keyboardType="numeric"
                        allowed="number"
                        onChange={(text) => setPrice(text)}
                        labelStyle={{
                            color: Colors.grey,
                        }}
                        style={[
                            style.buySellInput,
                            { textAlign: 'left', marginRight: 0 },
                        ]}
                        rightContent={
                            <View style={style.input}>
                                <Text
                                    color={Colors.white}
                                    size="small"
                                >
                                    {formatDisplayPair(tradePair.quoteCurrency)}
                                </Text>
                            </View>
                        }
                        background={
                            theme.theme === "dark"
                                ? "#111A2D"
                                : "#FFFFFF"
                        }
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
                    style={[style.quantity, { textAlign: 'left', marginRight: 0, paddingLeft: 0 }]}
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
                                height={windowheight * 0.04}
                                textStyle={{
                                    fontSize: 11,
                                }}
                                itemTextStyle={{
                                    fontSize: 11,
                                }}
                                conatinerstyle={{
                                    width: windowwidth * 0.14,
                                }}
                                background={
                                    theme.theme === "dark"
                                        ? theme.card
                                        : "#FFFFFF"
                                }
                                inputStyle={{
                                    elevation: 0,
                                    borderColor:
                                        theme.theme === "dark"
                                            ? "#131D31"
                                            : "#FFFFFF",
                                }}
                                list={quantityUnitList}
                                onChange={(value) => {
                                    setQuantityIn(value?.value);
                                }}
                            />
                        </View>
                    }
                    background={
                        theme.theme === "dark"
                            ? "#111A2D"
                            : "#FFFFFF"
                    }
                />

                {/* ========================================= */}
                {/* 25 / 50 / 75 / 100 */}
                {/* ========================================= */}

                <Flexcomponent
                    justifyContent="space-between"
                    style={{
                        marginTop: "3%",
                        marginBottom: "5%"
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
                                            : theme.card,
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
                {/* STOP PRICE */}
                {/* ========================================= */}

                {!["limit", "market"].includes(orderType) && (
                    <Input
                        value={stopPrice}
                        placeHolder="Stop Price"
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
                                    color={Colors.white}
                                    size="small"
                                >
                                    {formatDisplayPair(tradePair.quoteCurrency)}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* ========================================= */}
                {/* REDUCE ONLY / MAKER ONLY */}
                {/* ========================================= */}

                <Flexcomponent
                    justifyContent="flex-start"
                    style={{
                        marginTop: "6%",
                    }}
                >
                    <View
                    // style={{
                    //     flexDirection: "row",
                    //     alignItems: "center",
                    // }}
                    >
                        
                        <Input
                            type="checkbox"
                            label="Reduce Only"
                            boxstyle={style.check}
                            initial={reduceOnly}
                            onChange={(value) =>
                                setReduceOnly(value)
                            }
                            labelStyle={{ fontSize: 11 }}
                            background={theme.theme == 'dark' ? "#111A2D" : "#FFFFFF"}

                        />

                        {/* <Text size="small">
                            Reduce Only
                        </Text> */}
                    </View>

                    {orderType === "limit" && (
                        <View
                            style={{
                                marginLeft: 10,
                            }}
                        >
                            <Input
                                type="checkbox"
                                label="Maker Only"
                                boxstyle={style.check}
                                initial={makerOnly}
                                onChange={(value) =>
                                    setMakerOnly(value)
                                }
                                labelStyle={{ fontSize: 11 }}
                                background={theme.theme == 'dark' ? "#111A2D" : "#FFFFFF"}
                            />
                        </View>
                    )}
                </Flexcomponent>

                {/* ========================================= */}
                {/* AVAILABLE */}
                {/* ========================================= */}

                <Flexcomponent
                    justifyContent="space-between"
                    style={{
                        marginTop: "5%",
                    }}
                >
                    <Text color={theme.graytext}>
                        Available
                    </Text>

                    <Text
                        numoflines={1}
                        style={{
                            width: "50%",
                            textAlign: "right",
                        }}
                    >
                        {availableBalance.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

                {/* ========================================= */}
                {/* ORDER DETAILS */}
                {/* ========================================= */}

                <View
                    style={{
                        marginTop: "3%",
                        borderTopWidth: 1,
                        borderTopColor:
                            theme.theme === "dark"
                                ? Colors.grey
                                : theme.boderColor,
                    }}
                />

                <Flexcomponent
                    paddingVertical="2.5%"
                    justifyContent="space-between"
                >
                    <Text color={theme.graytext}>
                        Fees
                    </Text>

                    <Text
                        style={{
                            width: "50%",
                            textAlign: "right",
                        }}
                    >
                        {fees.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

                <Flexcomponent
                    paddingVertical="2.5%"
                    justifyContent="space-between"
                >
                    <Text color={theme.graytext}>
                        Order Cost
                    </Text>

                    <Text
                        style={{
                            width: "50%",
                            textAlign: "right",
                        }}
                    >
                        {orderCost.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

                <Flexcomponent
                    paddingVertical="2.5%"
                    justifyContent="space-between"
                >
                    <Text color={theme.graytext}>
                        Total
                    </Text>

                    <Text
                        style={{
                            width: "50%",
                            textAlign: "right",
                        }}
                    >
                        {orderValue.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

                <Flexcomponent
                    paddingVertical="2.5%"
                    justifyContent="space-between"
                >
                    <Text color={theme.graytext}>
                        Margin Required
                    </Text>

                    <Text
                        style={{
                            width: "50%",
                            textAlign: "right",
                        }}
                    >
                        {marginRequired.toFixed(2)}{" "}
                        {formatDisplayPair(tradePair.quoteCurrency)}
                    </Text>
                </Flexcomponent>

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
                            marginTop: "5%",
                            width: "100%",
                            backgroundColor:
                                actions === "buy"
                                    ? "#2563EB"
                                    : Colors.red,
                        },
                    ]}
                    loading={orderLoading}
                    onPress={placeOrder}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />

            <ProfitOption
                screen="options"
                ref={profitOptionref}
                formData={{ orderType }}
                onChange={handleOrderListSelect}
            />

            <UpdateMargin
                ref={updateMarginsheetref}
                value={marginMode}
                accountId={activeAccountId}
                title="Change Margin mode"
                onClose={() => {
                    closebottomsheet(updateMarginsheetref);
                }}
                confirm={() => {
                    closebottomsheet(updateMarginsheetref);
                }}
                onContinue={() => {
                    closebottomsheet(updateMarginsheetref);
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
        </View>
    );
};

export default OptionBuySell;