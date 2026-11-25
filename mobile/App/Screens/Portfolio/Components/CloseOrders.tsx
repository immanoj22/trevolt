import React, { useContext, useEffect, useMemo, useState ,useRef} from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Colors } from "../../../Utilities/uiasset";
import Sheet from "../../../Components/bottomsheet";
import useApiError from "../../../Actions/Hooks/errorhook";
import ThemeContext from "../../../Utilities/themecontext";
import { isEmpty } from "../../../Utilities/helerfunction";
import Flexcomponent from "../../../Components/flexcomponent";
import { Button, Dropdown, Input } from "../../../Components/Field";
import { useFutureCloseOrdersMutation } from "../../../Slices/future";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";
import { LotToquantity, quantityToLot } from "../../../Actions/Hooks/usePriceConversion";

import { styles } from "../styles";

interface ConfirmProps {
    ref?: any;
    data?: any;
    strategyData?: any;
}

const initialState = {
    price: 0,
    quantity: 0,
    percentage: 0,
    typeTIF: ""
}

const CloseOrders: React.FC<ConfirmProps> = ({ ref, data, strategyData }) => {
    const { successtoast, closebottomsheet, failuretoast } = useCustomHooks();
    const theme = useContext(ThemeContext);
    const style = styles(theme);

    const [currentType, setCurrentType] = useState('market');
    const [formData, setFormData] = useState(initialState);
    const [quantityIn, setQuantityIn] = useState('lot');
    const [lotQuantity, setlotQuantity] = useState('');
    // Must stay a stable reference, not an inline `list={[...]}` literal - the
    // underlying react-native-element-dropdown re-runs a useEffect keyed on this
    // array's identity and calls setListData whenever it changes, which a fresh
    // literal every render can retrigger fast enough to trip React's "Maximum
    // update depth exceeded" guard (same pattern found in buysellNew.tsx).
    const quantityUnitList = useMemo(() => ([
        {
            label: "LOT", value: 'lot'
        },
        {
            label: data?.pairData?.baseCurrency, value: data?.pairData?.baseCurrency
        }
    ]), [data?.pairData?.baseCurrency]);
    const scrollRef = useRef<any>(null);

    // The custom <Input> renders a plain RN TextInput, which gorhom's keyboard
    // handling can't track - so on focus we expand the sheet to its tall snap
    // point (keeping the field above the keyboard) and scroll it into view; on
    // blur we drop back.
    const onFieldFocus = (y: number) => {
        (ref as any)?.current?.expand?.();
        setTimeout(() => scrollRef.current?.scrollTo?.({ y, animated: true }), 300);
    };
    const onFieldBlur = () => {
        (ref as any)?.current?.snapToIndex?.(0);
    };

    const [futureCloseOrders, { error, isLoading }] = useFutureCloseOrdersMutation();
    const { triggerpositionOrders } = useApihooks();

    useApiError(error);

    const closingPositionOrder = async () => {
        const payload = {
            pairId: data?.pairId,
            positionSide: data?.positionSide,
            quantity: formData?.quantity,
            orderType: currentType,
            price: formData?.price,
            typeTIF: formData?.typeTIF,
            traderId: data?.traderId ?? strategyData?.traderId ?? '',
            traderAccountId: data?.traderAccountId ?? strategyData?.traderAccountId ?? '',
            isCopier: (data?.traderAccountId ?? strategyData?.traderAccountId) ? true : false
        }
        console.log("close_order_response", payload, data)
        try {
            const response = await futureCloseOrders(payload).unwrap()
            if (response.success) {
                successtoast("Success", response.message);
                triggerpositionOrders();
                closebottomsheet(ref);
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (error: any) {
            let msg = error?.data?.message || error?.data?.errors;
            while (typeof msg === "object" && msg !== null) {
                msg = Object.values(msg)[0];
            }
            failuretoast("Error", String(msg || "Something went wrong!"));
        }
    };

    const changeOrderType = (type: string) => {
        setCurrentType(type);
        if (type === "market") {
            setFormData({ ...formData, ...{ price: data?.close_price } });
        }
    };

    const changePercentage = (percentage: any) => {
        let quantity: any = parseFloat(data?.positionFilled) * (parseFloat(percentage) / 100)
        quantity = isNaN(quantity) || !isFinite(quantity) ? 0 : quantity
        quantity = parseFloat(quantity).toFixed(data?.pairData?.baseDecimal)
        if (quantityIn == 'lot') {
            let lot = quantityToLot(quantity, data?.pairData?.minAmount, data?.pairData?.baseDecimal)
            setlotQuantity(lot)
        } else {
            setlotQuantity(quantity)
        }
        setFormData({ ...formData, ...{ quantity: quantity, percentage: percentage } })
    }

    const onChangeHandler = (name: any, value: any) => {
        try {
            let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

            if (['price', 'quantity'].includes(name) && !numbers.test(value) && value !== "") {
                return false
            }
            if (name === 'quantity') {
                let quantity = value
                if (quantityIn == 'lot') {
                    const decimal = /^[+]?[0-9]+$/
                    if (value !== "" && !decimal.test(value)) return false;
                    let maxLot = quantityToLot(data?.pairData?.maxAmount, data?.pairData?.minAmount, data?.pairData?.baseDecimal)
                    let minLot = quantityToLot(data?.pairData?.minAmount, data?.pairData?.minAmount, data?.pairData?.baseDecimal)
                    if (parseFloat(value) < parseFloat(minLot) || parseFloat(value) > parseFloat(maxLot)) {
                        return false
                    }
                    quantity = LotToquantity(value, data?.pairData?.minAmount, data?.pairData?.baseDecimal)
                }
                setlotQuantity(value)
                setFormData({ ...formData, ...{ [name]: quantity } })
                return false
            }
            setFormData({ ...formData, ...{ [name]: value } })
        } catch (e) {
            console.log("onChangeHandler_err", e);
        }
    }

    useEffect(() => {
        if (isEmpty(data)) return
        setFormData({
            ...formData,
            ...{
                quantity: data.positionFilled,
                price: data?.close_price,
                percentage: 100
            }
        })
        let lotQuantity = data.positionFilled
        if (quantityIn == 'lot') {
            lotQuantity = quantityToLot(lotQuantity, data?.pairData?.minAmount, data?.pairData?.baseDecimal)
        }
        setlotQuantity(lotQuantity)
    }, [data])

    useEffect(() => {
        if (!isEmpty(formData.quantity)) {
            let lotQuantity: any = formData.quantity
            if (quantityIn == 'lot') {
                lotQuantity = quantityToLot(lotQuantity, data?.pairData?.minAmount, data?.pairData?.baseDecimal)
            }
            setlotQuantity(lotQuantity)
        }
    }, [quantityIn])

    return (
        <Sheet
            sheetref={ref}
            snappoint={["55%", "90%"]}
            custominterface={true}
            backgroundStyle={style.border}
        >
            <View style={{ flex: 1 }}>
                <View style={[style.header, { backgroundColor: "transparent" }]}>
                    <Flexcomponent justifyContent="space-between" alignItems="center">
                        <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>Close order</Text>
                        <Pressable onPress={() => closebottomsheet(ref)}>
                            <Images
                                type="svg"
                                name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                                width={windowwidth * 0.060}
                                 height={windowheight * 0.040}
                            />
                        </Pressable>
                    </Flexcomponent>
                </View>
                <View style={style.containerCon}>
                    <BottomSheetScrollView
                        ref={scrollRef}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: "55%" }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={style.market}>
                            <Pressable style={[style.marketContent, { backgroundColor: currentType === "market" ? Colors.brand : theme.card }]}
                                onPress={() => changeOrderType("market")}>
                                <Text style={{ color: currentType === "market" ? Colors.white : theme.primarytext, }}>Market</Text>
                            </Pressable>
                            <Pressable style={[style.limitContent, { backgroundColor: currentType === "limit" ? Colors.brand : theme.card }]}
                                onPress={() => changeOrderType("limit")}>
                                <Text style={{ color: currentType === "limit" ? Colors.white : theme.primarytext }}>Limit</Text>
                            </Pressable>
                        </View>
                        {
                            currentType === 'limit' && (
                                <Input
                                    themes={theme}
                                    label="Price"
                                    value={formData.price}
                                    placeHolder="0"
                                    keyboardType="numeric"
                                    background={theme.card}
                                    onChange={(text) => onChangeHandler('price', text)}
                                    inputprops={{ onFocus: () => onFieldFocus(0), onBlur: onFieldBlur }}
                                />
                            )
                        }
                        <Input
                            themes={theme}
                            label="Quantity"
                            value={lotQuantity}
                            onChange={(text) => onChangeHandler("quantity", text)}
                            rightContent={
                                <View style={style.quan}>
                                    <Dropdown
                                        value={quantityIn}
                                        themes={theme}
                                        placeholder="Select"
                                        background={theme.theme === "dark" ? theme.card : "#FFFFFF"}
                                        conatinerstyle={{
                                            width: windowwidth * 0.2,

                                        }}
                                        inputStyle={{ shadowOffset: 0, shadowColor: 0 }}
                                        height={windowheight * 0.060}
                                        onChange={(value) => {
                                            setQuantityIn(value?.value)
                                        }}
                                        list={quantityUnitList}
                                    />
                                </View>
                            }
                            leftContent={<Text color={Colors.grey}>{`1 Lot = ${data?.pairData?.minAmount} ${data?.pairData?.baseCurrency}`}</Text>}
                            placeHolder="0"
                            keyboardType="numeric"
                            background={theme.card}
                            style={style.quantity}
                            inputprops={{ onFocus: () => onFieldFocus(currentType === 'limit' ? 160 : 90), onBlur: onFieldBlur }}
                        />
                        <Text color={theme.secondarytext}>Select Prcentage 100%</Text>
                        <Flexcomponent justifyContent="space-between" style={{ marginTop: "3%" }}>
                            {[5, 10, 25, 50, 75, 100].map((percent) =>
                                <Pressable key={percent} onPress={() => changePercentage(percent)} style={[style.percent, { backgroundColor: percent === formData.percentage ? Colors.green : theme.card }]}>
                                    <Text color={theme.darktext}>{percent}</Text>
                                </Pressable>
                            )}
                        </Flexcomponent>
                        <Flexcomponent justifyContent="flex-end" alignItems="center" style={{ marginTop: "8%" }}>
                            <Button
                                title="Cancel"
                                buttonStyle={style.cancel}
                                onPress={() => closebottomsheet(ref)}
                                textStyle={{ color: theme.theme === "dark" ? Colors.white : Colors.black }}
                            />
                            <Button
                                title="Confirm"
                                loading={isLoading}
                                onPress={() => closingPositionOrder()}
                                buttonStyle={style.confim}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </Flexcomponent>
                    </BottomSheetScrollView>
                </View>
            </View>
        </Sheet>
    )

}

export default CloseOrders;