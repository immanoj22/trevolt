import React, { useCallback } from "react";
import { FlatList, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Trade from "./trade";
import { image } from "../../Utilities/images";
import Mainview from "../../Components/mainview";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { setItem } from "../../Actions/Storage/localstorage";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import { futureSelector, setFutureTicker, setTradePairData } from "../../Slices/future";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Seeall'>;

const Seeall: React.FC<Props> = (props) => {
    const { dispatch } = useCustomHooks();
    const { theme } = useCustomHooks();
    const { type, data } = props?.route?.params;
    const { navigation } = useCustomHooks();
    const { futurePairData } = useSelector(futureSelector);

    const handlePairChange = (pair: any) => {
        try {
            const pairDetail = futurePairData.find((val: any) => val.tickerRoot === pair);
            setItem("futurespair", pair)
            dispatch(setTradePairData(pairDetail));
            dispatch(setFutureTicker(pairDetail));
        } catch (error) {
            console.log('handlePairChange__err', error);
        }
    };

    const renderTrade = useCallback((item: any, type: string) => {
        switch (type) {
            case "trendTrade":
                return (
                    <Trade
                        type="normal"
                        image={image.Normaltrade}
                        price={item?.price}
                        change={item?.totalTrades}
                        change_percentage={item?.totalTrades}
                        title={item?.baseCurrency}
                        subtitle={item?.quoteCurrency}
                        onSelect={handlePairChange}
                        token={item?._id}
                        tradeMode={item?.tradeMode}
                    />
                );

            case "popular":
                return (
                    <Trade
                        pair={item}
                        type="popular"
                        image={item?.image}
                        price={item?.price}
                        change={item?.change}
                        change_percentage={item?.change_percentage}
                        title={item?.baseCurrency}
                        des={item?.tickerRoot}
                        status={item?.status}
                        onSelect={handlePairChange}
                        token={item?.tickerRoot}
                    />
                );

            default:
                return (
                    <Trade
                        head={item?.pairName}
                        type="normal"
                        subtitle={item?.lastClosePrice}
                        image={image.Normaltrade}
                        price={item?.baseEntryPrice}
                        change={item?.totalTrades}
                        onSelect={handlePairChange}
                        token={item?.pairName}
                    />
                );
        }
    }, []);

    return (
        <Mainview
            headertitle={type == "trendTrade" ? "Most Trade" : "Popular Trade"}
            isscollable={false}
            onleftfn={() => navigation?.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={{ flex: 1 }}>
                <FlatList
                    data={data}
                    numColumns={2}
                    renderItem={({ item, index }) => { return renderTrade(item, type) }}
                    columnWrapperStyle={{ justifyContent: "space-between" }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </Mainview>
    )

}

export default Seeall;