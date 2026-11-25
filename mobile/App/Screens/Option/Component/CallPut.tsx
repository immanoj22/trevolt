import React, { memo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";

import { styles } from "./styles";
import VectorIcons from "../../../Utilities/vectoricons";
interface CallPutListProps {
    item?: any;
    underlyingPrice?: any
    type?: any
    conv?: any
    isSelected?: boolean
    onSelect?: (item: any) => void
    // Strategy Builder "Add contracts" mode: tapping a row expands it in place to a
    // qty input + Buy/Sell buttons instead of navigating/selecting.
    pickerMode?: boolean
    onAddLeg?: (item: any, buyOrSell: boolean, qty: string) => void
    isFavourite?: boolean
    onToggleFavourite?: () => void
    isTogglingFavourite?: boolean
}

const CallPutList: React.FC<CallPutListProps> = memo(({ item, underlyingPrice, type, conv, isSelected, onSelect, pickerMode, onAddLeg, isFavourite, onToggleFavourite, isTogglingFavourite }) => {
    const { convert, theme } = useCustomHooks();
    const style = styles(theme);
    const [expanded, setExpanded] = useState(false);
    const [qty, setQty] = useState("0.001");

    const getMarkPriceBg = () => {
        // Matches web: clicking a strike makes it the active/selected contract driving
        // the chart/order book/recent trades and buy-sell panel — give it a visible
        // highlight instead of tapping silently just navigating away.
        if (isSelected) return theme.theme === "dark" ? "#2d3a2fff" : "#dee7f6";
        if (type === 'calls') {
            return underlyingPrice < item.strikePrice ? theme.background : theme.theme == 'dark' ? "#0e1e3c" : "#FFFFFF";
        }
        if (type === 'puts') {
            return underlyingPrice > item.strikePrice ? theme.background : theme.theme == 'dark' ? "#0e1e3c" : "#FFFFFF";
        }
        return theme.background;
    };

    const bgColor = getMarkPriceBg();

    const handleRowPress = () => {
        if (pickerMode) {
            setExpanded((prev) => !prev);
            return;
        }
        onSelect?.(item);
    };

    const handleAdd = (buyOrSell: boolean) => {
        onAddLeg?.(item, buyOrSell, qty);
        setExpanded(false);
    };

    return (
        <>
            {
                item.isMarkPrice ? (
                    <View style={[style.mark]}>
                        <View style={style.markPrice}>
                            <View style={style.strikePrice}>
                                <Text style={style.text}>  </Text>
                                <VectorIcons
                                    name="graph"
                                    family="Octicons"
                                    iconcolor={Colors.white}
                                    size={10}
                                />
                                <Text style={[style.text, { color: Colors.white }]}> {item?.strikePrice}</Text>
                            </View>
                            <View style={style.line} />
                        </View>
                    </View>
                ) : (
                    // Column order/coloring mirrors web-frontend's CallPutTable/OptionCard
                    // exactly: bid is always green, ask is always red (static per-field,
                    // not value-direction-based — web's dynamic sign coloring is dead code
                    // there too), everything else uses the default text color.
                    // Tapping a row only selects it (matches web: clicking a strike just
                    // makes it the active contract) — placing the trade is a separate,
                    // explicit action via the persistent Buy/Sell bar. In pickerMode (the
                    // Strategy Builder "Add contracts" screen) it expands in place instead.
                    <Pressable
                        style={{
                            backgroundColor: bgColor,
                            minHeight: 50,
                            paddingVertical: expanded ? 8 : 0,
                            borderBottomWidth: 0.5,
                            borderColor: theme.tableBorder,
                        }}
                        onPress={handleRowPress}
                    >
                    <View style={[style.rows, { height: 50, borderBottomWidth: 0 }]}>
                        <View style={[style.cells, style.strike, { flexDirection: "row", alignItems: "center" }]}>
                            <Pressable onPress={onToggleFavourite} disabled={isTogglingFavourite} hitSlop={8} style={{ width: 18, alignItems: "center", opacity: isFavourite ? 1 : 0.35 }}>
                                <VectorIcons
                                    family="FontAwesome"
                                    name={isFavourite ? "star" : "star-o"}
                                    size={12}
                                    iconcolor={isFavourite ? "#FDD25A" : theme.secondarytext}
                                />
                            </Pressable>
                            <Text style={style.text}>{item?.strikePrice}</Text>
                        </View>
                        <View style={[style.cells, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }]}>
                            <View
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "30%",
                                    width: "20%",
                                    height: "35%",
                                    borderTopRightRadius: 3,
                                    borderBottomEndRadius: 3,
                                    backgroundColor: item?.optionType === "CALL" ? "#EE165780" : "#00D0B280",
                                }}
                            />
                            <Text style={[style.text, { color: item?.optionType === "CALL" ? Colors.green : Colors.red }]}>{item?.optionType === "CALL" ? "C" : "P"}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.last)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.openInterest)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.high)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.volume)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{item?.oiChangePct}%</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{item?.delta?.toFixed(2)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{item?.theta?.toFixed(2)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{item?.percent24Change}%</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{item?.gamma?.toFixed(2)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>-</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{item?.vega?.toFixed(2)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.low)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.open)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.askQty)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={[style.text, { color: Colors.red }]}>{convert(item?.ask)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.marketPrice)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={[style.text, { color: Colors.brand }]}>{convert(item?.bid)}</Text>
                        </View>
                        <View style={[style.cells, { justifyContent: "space-around" }]}>
                            <Text style={style.text}>{convert(item?.bidQty)}</Text>
                        </View>
                    </View>

                        {pickerMode && expanded && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, marginTop: 6 }}>
                                <TextInput
                                    value={qty}
                                    onChangeText={setQty}
                                    keyboardType="decimal-pad"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: theme.boderColor,
                                        borderRadius: 6,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        color: theme.primarytext,
                                        minWidth: 90,
                                    }}
                                />
                                <Pressable
                                    style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: Colors.brand, alignItems: "center", justifyContent: "center" }}
                                    onPress={() => handleAdd(true)}
                                >
                                    <Text color={Colors.white} family="bold">B</Text>
                                </Pressable>
                                <Pressable
                                    style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: Colors.red, alignItems: "center", justifyContent: "center" }}
                                    onPress={() => handleAdd(false)}
                                >
                                    <Text color={Colors.white} family="bold">S</Text>
                                </Pressable>
                            </View>
                        )}
                    </Pressable>
                )
            }
        </>
    );
});

export default React.memo(CallPutList);
