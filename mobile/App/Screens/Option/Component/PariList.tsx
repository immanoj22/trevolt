import React, { memo } from "react";
import { Pressable, View } from "react-native";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";

import { styles } from "./styles";

interface PariListProps {
    item?: any;
    style?: any
    selectedStrike?: any
}

const PariList: React.FC<PariListProps> = memo(({ item }) => {
    const { convert, navigation, theme } = useCustomHooks();
    const style = styles(theme);

    const goToTrade = (option: any, type: "CALL" | "PUT") => {
        if (!option) return;
        navigation.navigate("Buysell", {
            pageName: type === "CALL" ? "buy" : "sell",
            screen: "options",
            data: option,
        });
    };

    return (
        <View style={style.row}>
            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={[style.text]}>{item.call?.strikePrice}</Text>
                </Pressable>
            </View>
            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={[style.text, { color: Colors.brand }]}>C</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={[style.text, { color: Colors.red }]}>P</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{convert(item.call.openInterest)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{convert(item.put.openInterest)}</Text>
                </Pressable>
            </View>
            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{convert(item.call.marketPrice)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{convert(item.put.marketPrice)}</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{convert(item.call.bid)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{convert(item.put.bid)}</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{convert(item.call.ask)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{convert(item.put.ask)}</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>-</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>-</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>-</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>-</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>-</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>-</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{item.call.percent24Change}%</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{item.put.percent24Change}%</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                </Pressable>
                <Text style={style.text}>{item.call.percent24High}</Text>
                <Text style={style.text}>{item.put.percent24High}</Text>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{item.call.delta?.toFixed(2)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{item.put.delta?.toFixed(2)}</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>

                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{item.call.gamma?.toFixed(2)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{item.put.gamma?.toFixed(2)}</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{item.call.vega?.toFixed(2)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{item.put.vega?.toFixed(2)}</Text>
                </Pressable>
            </View>

            <View style={[style.cell, { justifyContent: "space-around" }]}>
                <Pressable onPress={() => goToTrade(item.call, "CALL")}>
                    <Text style={style.text}>{item.call.theta?.toFixed(2)}</Text>
                </Pressable>
                <Pressable onPress={() => goToTrade(item.put, "PUT")}>
                    <Text style={style.text}>{item.put.theta?.toFixed(2)}</Text>
                </Pressable>
            </View>
        </View>
    );
});

export default React.memo(PariList);;