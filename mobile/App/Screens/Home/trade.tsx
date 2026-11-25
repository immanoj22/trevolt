// import React, { memo } from "react";
// import { Pressable, View } from "react-native";
// import { useSelector } from "react-redux";

// import Text from "../../Components/text";
// import { Colors } from "../../Utilities/uiasset";
// import { futureSelector } from "../../Slices/future";
// import { setOption } from "../../Slices/option";
// import { SetFutureparams } from "../../Slices/helper";
// import Images, { image } from "../../Utilities/images";
// import Flexcomponent from "../../Components/flexcomponent";
// import useCustomHooks from "../../Actions/Hooks/customhook";
// import { borderradius, RFvalue, windowwidth } from "../../Utilities/dimensions";

// interface Normalprops {
//     type?: "normal",
//     image?: any,
//     title?: string,
//     price?: string | number,
//     change?: string | number,
//     change_percentage?: string | number
//     subtitle?: any,
//     pair?: any;
//     head?: any;
//     onSelect?: any;
//     token?: any;
//     tradeMode?: string;
// }

// interface Popularprops {
//     type: "popular",
//     title: string,
//     des: string,
//     image: any,
//     price: string | number,
//     change: string | number,
//     change_percentage: string | number,
//     status: string,
//     subtitle?: any
//     pair?: any;
//     onSelect?: any
//     token?: any
// }

// type Tradeprops = Normalprops | Popularprops

// const Trade: React.FC<Tradeprops> = (props) => {
//     const { futurePairData } = useSelector(futureSelector)
//     const { theme, navigation, dispatch } = useCustomHooks();

//     if (props.type == "normal") {
//         const { image, title, price, change, subtitle, head, token, onSelect, tradeMode } = props;
//         const pairDetail = futurePairData.find((val: any) => val.tickerRoot === token);
//         const livePrice = pairDetail?.marketPrice ?? price;
//         const liveChange = pairDetail?.change ?? change;
//         const isChangeGain = Number(liveChange) >= 0;
//         return (
//             <View style={{ padding: "4%", backgroundColor: theme.card, width: "48%", borderRadius: borderradius * 0.5, marginBottom: "3.5%" }} >
//                 <Pressable onPress={() => {
//                     if (tradeMode === "option") {
//                         dispatch(setOption(title));
//                         navigation.navigate('Dashboard', { screen: 'Option' });
//                         return;
//                     }
//                     SetFutureparams("trade"),
//                         onSelect(token),
//                         navigation.navigate('Dashboard', { screen: 'Future' })
//                 }} disabled={pairDetail === undefined && tradeMode !== "option"}>
//                     <Images type="image" source={image} style={{ width: windowwidth * 0.075, height: windowwidth * 0.075, resizeMode: "contain" }} />
//                     <Text family="medium" size="medium" top={"5%"} >{title || head}</Text>
//                     <Text size="small" color={theme.secondarytext}>{title}{subtitle}</Text>
//                     <Text size="semimedium" top={"10%"} >$ {Number(livePrice ?? 0).toFixed(2)}</Text>
//                     <Text color={isChangeGain ? theme.homegreen : Colors.red} fontSize={RFvalue(12)} top={"2.5%"} >{isChangeGain ? "+" : ""}{liveChange}%</Text>
//                 </Pressable>
//             </View>
//         )
//     }

//     if (props.type == "popular") {
//         const { title, des, pair, token, onSelect } = props;
//         const pairDetail = futurePairData.find((val: any) => val.tickerRoot === token);
//         const livePair = pairDetail ? { ...pair, ...pairDetail } : pair;
//         const isGain = livePair?.change >= 0;
//         return (
//             <View style={{ padding: "4%", backgroundColor: theme.card, width: "48%", borderRadius: borderradius * 0.5, marginBottom: "5.5%" }} >
//                 <Pressable onPress={() => {
//                     if (livePair?.tradeMode === "option") {
//                         dispatch(setOption(livePair?.baseCurrency));
//                         navigation.navigate('Dashboard', { screen: 'Option' });
//                         return;
//                     }
//                     SetFutureparams("trade"), onSelect(token), navigation.navigate('Dashboard', { screen: 'Future' })
//                 }} disabled={pairDetail === undefined && livePair?.tradeMode !== "option"}>
//                     <Flexcomponent>
//                         <View style={{ width: "75%" }} >
//                             <Text size="medium" family="medium">{title}</Text>
//                             <Text color="#9094A0" size="semimedium" family="medium" numoflines={1}>{des}</Text>
//                         </View>
//                         <View style={{ width: "25%", alignItems: "flex-end" }} >
//                             <Images
//                                 type="image"
//                                 source={image.Btcicon}
//                                 style={{ width: windowwidth * 0.075, height: windowwidth * 0.075, resizeMode: "contain" }}
//                             />
//                         </View>
//                     </Flexcomponent>
//                     <View style={{ borderRadius: borderradius * 0.25, justifyContent: "center", marginTop: "10%", paddingVertical: "5%" }}>
//                         <Text size="medium" >$ {livePair?.marketPrice}</Text>
//                         <Text color={isGain ? theme.homegreen : Colors.red} fontSize={RFvalue(12)}>{isGain ? "+" : ""}{livePair?.changePrice} ({livePair?.change}%)</Text>
//                     </View>
//                     <Text color="#9094A0" size="xsmall" style={{ marginTop: "5%" }}>Volume: {Number(livePair?.volume).toLocaleString()}</Text>
//                 </Pressable>
//             </View>
//         )
//     }
// }

// export default memo(Trade);


import React, { memo, useContext } from "react";
import { Pressable, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import { setOption } from "../../Slices/option";
import { SetFutureparams } from "../../Slices/helper";
import Images, { image } from "../../Utilities/images";
import ThemeContext from "../../Utilities/themecontext";
import Flexcomponent from "../../Components/flexcomponent";
import { borderradius, RFvalue, windowwidth } from "../../Utilities/dimensions";
import { formatDisplayPair } from "../../Utilities/formatPair";

const dirColor = (dir: any, neutral: any) =>
    dir === "up" ? Colors.green : dir === "down" ? Colors.red : neutral;

interface Normalprops {
    type?: "normal",
    image?: any,
    title?: string,
    price?: string | number,
    change?: string | number,
    change_percentage?: string | number
    subtitle?: any,
    pair?: any;
    head?: any;
    onSelect?: any;
    token?: any;
    tradeMode?: string;
}

interface Popularprops {
    type: "popular",
    title: string,
    des: string,
    image: any,
    price: string | number,
    change: string | number,
    change_percentage: string | number,
    status: string,
    subtitle?: any
    pair?: any;
    onSelect?: any
    token?: any
}

type Tradeprops = Normalprops | Popularprops


const Trade: React.FC<Tradeprops> = (props) => {
    const theme = useContext(ThemeContext);
    const dispatch = useDispatch<any>();
    const navigation = useNavigation<any>();
    // Subscribe only to this card's own pair - so a price tick for one pair
    // re-renders one card, not all 12 on the Home screen.
    const token = (props as any).token;
    const live = useSelector((s: any) => s.future.livePrices?.[token]);

    if (props.type == "normal") {
        const { image, title, price, change, subtitle, head, onSelect, tradeMode } = props;
        const pairDetail = live;
        const livePrice = pairDetail?.marketPrice ?? price;
        const liveChange = pairDetail?.change ?? change;
        const isChangeGain = Number(liveChange) >= 0;
        return (
            <View
                style={{
                    padding: "4%",
                    backgroundColor: theme.theme == 'dark' ? "#151a1786" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
                    width: "48%",
                    borderRadius: borderradius * 0.6,
                    marginBottom: "3.5%",
                }}
            >
                <Pressable onPress={() => {
                    if (tradeMode === "option") {
                        dispatch(setOption(title));
                        navigation.navigate('Dashboard', { screen: 'Option' });
                        return;
                    }
                    dispatch(SetFutureparams("trade"));
                    onSelect(token);
                    navigation.navigate('Dashboard', { screen: 'Market' });
                }} disabled={pairDetail === undefined && tradeMode !== "option"}>
                    <Flexcomponent style={{ justifyContent: "space-between" }}>
                        <Text family="bold" style={{ fontSize: 14 }} color={theme.darktext}>{formatDisplayPair(title || head)}</Text>
                        <Text size="semimedium" style={{ fontSize: 14 }} color={dirColor(pairDetail?._dir, theme.darktext)}>$ {Number(livePrice ?? 0).toFixed(2)}</Text>
                    </Flexcomponent>
                    <View style={{ marginTop: "3%" }}>
                        <Flexcomponent style={{ justifyContent: "space-between" }}>
                            <Text size="small" color="#7B8288">{title}{formatDisplayPair(subtitle)}</Text>
                            <View
                            >
                                <Text color={isChangeGain ? theme.profit : Colors.red} fontSize={RFvalue(11)}>
                                    {isChangeGain ? "+" : ""}{liveChange}%
                                </Text>
                            </View>
                        </Flexcomponent>
                    </View>
                </Pressable>
            </View>
        )
    }

    if (props.type == "popular") {
        const { title, des, pair, onSelect } = props;
        const pairDetail = live;
        const livePair = pairDetail ? { ...pair, ...pairDetail } : pair;
        const isGain = livePair?.change >= 0;
        return (
            <View
                style={{
                    padding: "4%",
                    backgroundColor: theme.theme == 'dark' ? "#151a1786" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
                    width: "48%",
                    borderRadius: borderradius * 0.6,
                    marginBottom: "5.5%",
                }}
            >
                <Pressable onPress={() => {
                    if (livePair?.tradeMode === "option") {
                        dispatch(setOption(livePair?.baseCurrency));
                        navigation.navigate('Dashboard', { screen: 'Option' });
                        return;
                    }
                    dispatch(SetFutureparams("trade"));
                    onSelect(token);
                    navigation.navigate('Dashboard', { screen: 'Market' });
                }} disabled={pairDetail === undefined && livePair?.tradeMode !== "option"}>
                    <Flexcomponent>
                        <View style={{ width: "75%" }} >
                            <Text size="medium" family="medium" color={theme.darktext}>{title}</Text>
                            <Text color="#7B8288" size="semimedium" family="medium" numoflines={1}>{formatDisplayPair(des)}</Text>
                        </View>
                        <View style={{ width: "25%", alignItems: "flex-end" }} >
                            <Images
                                type="image"
                                source={image.Btcicon}
                                style={{ width: windowwidth * 0.075, height: windowwidth * 0.075, resizeMode: "contain" }}
                            />
                        </View>
                    </Flexcomponent>
                    <View style={{ borderRadius: borderradius * 0.25, justifyContent: "center", marginTop: "10%", paddingVertical: "5%" }}>
                        <Text size="medium" color={dirColor(livePair?._dir, theme.darktext)}>$ {livePair?.marketPrice}</Text>
                        <Text color={isGain ? theme.profit : Colors.red} fontSize={RFvalue(12)}>{isGain ? "+" : ""}{livePair?.changePrice} ({livePair?.change}%)</Text>
                    </View>
                    <Text color="#7B8288" size="xsmall" style={{ marginTop: "5%" }}>Volume: {Number(livePair?.volume).toLocaleString()}</Text>
                 </Pressable>
            </View>
        )
    }
}

export default memo(Trade);