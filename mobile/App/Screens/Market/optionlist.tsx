import React from "react";
import { FlatList, View } from "react-native";

import Text from "../../Components/text";
import Images from "../../Utilities/images";
import NoData from "../../Components/Nodata";
import { Colors } from "../../Utilities/uiasset";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { getTokenImage } from "../../Utilities/helerfunction";
import { windowheight, windowwidth } from "../../Utilities/dimensions";

// Underlying option markets (BTC, ETH, ...) fetched via /option/get_underlying_asset -
// same 4-column layout as Marketfuture, but `last`/`change`/`volume`/`FirstcurrencyData`
// don't come from that endpoint (it only returns symbol/marketPrice). market.tsx enriches
// each item with those fields by cross-referencing the matching futures pair for the same
// base currency before handing pairData to this component, so it's still its own list (the
// raw shapes differ) but renders identically to the Futures tab.
interface MarketOptionListProps {
    pairData?: any[];
    onOpenOption?: (symbol: string) => void;
}

const MarketOptionList: React.FC<MarketOptionListProps> = ({
    pairData = [],
    onOpenOption,
}) => {
    const { theme } = useCustomHooks();

    return (
        <View style={{ flex: 1 }}>
            <Flexcomponent style={{ paddingHorizontal: "2.5%", marginTop: "2%" }} paddingVertical={"2.5%"} width={"100%"}>
                <Flexcomponent style={{ width: "25%", justifyContent: "flex-start" }}>
                    <Text size="semimedium" family="medium" color={theme.graytext}>Name</Text>
                </Flexcomponent>

                <Flexcomponent justifyContent="flex-end" style={{ width: "25%" }}>
                    <Text size="semimedium" family="medium" color={theme.graytext}>Last Price</Text>
                </Flexcomponent>

                <Flexcomponent justifyContent="flex-end" style={{ width: "22%" }}>
                    <Text size="semimedium" family="medium" color={theme.graytext}>24 Chg.</Text>
                </Flexcomponent>

                <Flexcomponent justifyContent="flex-end" style={{ width: "28%" }}>
                    <Text size="semimedium" family="medium" color={theme.graytext}>24h Vol.</Text>
                </Flexcomponent>
            </Flexcomponent>

            <View style={{ flex: 1, paddingHorizontal: "2.5%" }}>
                {pairData.length > 0 ? (
                    <FlatList
                        data={pairData}
                        keyExtractor={(item: any, i) => item?._id ?? item?.symbol ?? i.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Flexcomponent
                                onPress={() => onOpenOption?.(item.symbol)}
                                ispress={true}
                                style={{ marginVertical: "2.5%" }}
                                height={windowheight * 0.05}
                                width={"100%"}
                            >
                                <Flexcomponent alignItems="flex-start" justifyContent="flex-start" style={{ width: "25%" }}>
                                    {/* TODO: token image temporarily disabled, re-enable later
                                    <View style={{ alignItems: "center", flexDirection: "row" }}>
                                        <Images
                                            type="image"
                                            source={item?.FirstcurrencyData?.currencyImage ? { uri: item.FirstcurrencyData.currencyImage } : getTokenImage(item.symbol)}
                                            width={windowwidth * 0.065}
                                            height={windowwidth * 0.065}
                                        />
                                    </View> */}
                                    <View>
                                        <Text size="xsmall" color={theme.futuretext} numoflines={1}>  {item.symbol}</Text>
                                        <Text size="xsmall" color={theme.graytext}>  {Number(item.marketPrice ?? 0).toFixed(2)}</Text>
                                    </View>
                                </Flexcomponent>

                                <View style={{ width: "25%", justifyContent: "center", alignItems: "flex-end", paddingRight: 4 }}>
                                    <Text size="xsmall" color={theme.theme === "dark" ? Colors.brand : Colors.brand}>{item.last}</Text>
                                </View>

                                <View style={{ width: "22%", justifyContent: "center", alignItems: "flex-end" }}>
                                    <Text size="xsmall" color={Colors.red}>{item.change}</Text>
                                </View>
                                <View style={{ width: "28%", justifyContent: "center", alignItems: "flex-end" }}>
                                    <Text size="xsmall" color={theme.darktext}>{item.volume}</Text>
                                </View>
                            </Flexcomponent>
                        )}
                    />
                ) : (
                    <View style={{ alignItems: "center", justifyContent: "center", marginTop: "20%" }}>
                        <NoData title="No Record Found!" />
                    </View>
                )}
            </View>
        </View>
    );
};

export default MarketOptionList;
