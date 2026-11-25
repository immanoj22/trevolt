import React, { useCallback, useContext, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import VectorIcons from "../../Utilities/vectoricons";
import ThemeContext from "../../Utilities/themecontext";
import Flexcomponent from "../../Components/flexcomponent";
import { windowwidth } from "../../Utilities/dimensions";
import { formatDisplayPair } from "../../Utilities/formatPair";

const TABS = ["Future", "Option", "Watchlist"];
const MAX_VISIBLE_ROWS = 10;

interface StaticMarketTableProps {
    futureData?: any[];
    optionData?: any[];
    favourites?: any[];
    onSelectFuture?: (tickerRoot: string) => void;
    onSelectOption?: (symbol: string) => void;
    onToggleFavourite?: (pairId: string, tickerRoot: string) => void;
    favouriteLoadingId?: string | null;
}

const formatPrice = (value: any) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return "0.00";
    const d = Math.abs(num) >= 1000 ? 2 : Math.abs(num) >= 10 ? 3 : 5;
    return num.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

const formatChange = (value: any) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return "0.00";
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}`;
};

const formatVol = (value: any) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return "0";
    return num.toLocaleString("en-US", { maximumFractionDigits: 3 });
};

interface MarketRowProps {
    symbol: string;
    price: string;
    change: string;
    vol: string;
    tradeMode: "future" | "option";
    pairId: string;
    favName: string;
    isFav: boolean;
    isFavouriteLoading: boolean;
    theme: any;
    onPress: (symbol: string, tradeMode: string) => void;
    onToggleFavourite?: (pairId: string, favName: string) => void;
}

// Every field here is a primitive (string/number/boolean), never a freshly-allocated
// object/array - primitives compare by value, so even though the parent recomputes
// these on every render, React.memo's default shallow prop comparison still correctly
// bails out for a row whose values didn't actually change. That's what stops a single
// pair's price tick from re-rendering every other visible row in the table.
const MarketRow = React.memo<MarketRowProps>(({
    symbol, price, change, vol, tradeMode, pairId, favName, isFav, isFavouriteLoading,
    theme, onPress, onToggleFavourite,
}) => {
    // Futures rows read their own live price straight from the per-ticker map, so a
    // tick for one pair re-renders one row. Options aren't in the map - they use
    // the props the parent passed. `price`/`change`/`vol` (static, load-time) are
    // the fallback until the first tick.
    const live = useSelector((s: any) => (tradeMode === "future" ? s.future.livePrices?.[symbol] : undefined));
    const dispPrice = live && live.marketPrice != null ? formatPrice(live.marketPrice) : price;
    const dispChange = live && live.change != null ? formatChange(live.change) : change;
    const dispVol = live && live.volume != null ? formatVol(live.volume) : vol;
    const priceColor = live?._dir === "up" ? Colors.green : live?._dir === "down" ? Colors.red : theme.secondarytext;
    const isGain = dispChange.startsWith("+");

    return (
        <Flexcomponent
            onPress={() => onPress(symbol, tradeMode)}
            ispress={true}
            justifyContent="space-between"
            alignItems="center"
            top={"4%"}
        >
            <Flexcomponent justifyContent="flex-start" alignItems="center" style={{ width: "34%" }}>
                {tradeMode === "option" ? (
                    <View style={{ width: windowwidth * 0.04 }} />
                ) : (
                    <TouchableOpacity
                        style={{ alignItems: "center", justifyContent: "center" }}
                        disabled={isFavouriteLoading}
                        onPress={() => onToggleFavourite?.(pairId, favName)}
                    >
                        <VectorIcons
                            family="FontAwesome"
                            name={isFav ? "star" : "star-o"}
                            size={windowwidth * 0.04}
                            iconcolor="#FDD25A"
                        />
                    </TouchableOpacity>
                )}
                <View style={{ marginLeft: "6%" }}>
                    <Text size="small" family="medium" color={theme.primarytext}>{formatDisplayPair(symbol)}</Text>
                    <Text size="xsmall" color={priceColor}>{dispPrice}</Text>
                </View>
            </Flexcomponent>

            <View style={{ width: "33%", alignItems: "center" }}>
                <Text size="small" family="medium" color={isGain ? theme.profit : Colors.red}>{dispChange}</Text>
            </View>

            <View style={{ width: "33%", alignItems: "center" }}>
                <Text size="small" color={theme.primarytext}>{dispVol}</Text>
            </View>
        </Flexcomponent>
    );
});

const StaticMarketTable: React.FC<StaticMarketTableProps> = ({
    futureData = [],
    optionData = [],
    favourites = [],
    onSelectFuture,
    onSelectOption,
    onToggleFavourite,
    favouriteLoadingId,
}) => {
    const theme = useContext(ThemeContext);
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState(0);

    const favSet = new Set((favourites ?? []).map((f: any) => f?.pairName));

    const futureRows = (futureData ?? []).map((item: any) => ({
        key: item?.tickerRoot ?? item?._id,
        symbol: item?.tickerRoot,
        favName: item?.tickerRoot,
        pairId: item?._id,
        price: formatPrice(item?.marketPrice),
        change: formatChange(item?.change),
        vol: formatVol(item?.volume),
        tradeMode: "future" as const,
    }));

    const watchRows = futureRows.filter((row: any) => favSet.has(row.symbol));

    // Option tab (index 1) always shows the "Coming Soon" panel below - it never
    // reads from `rows` - matching Market/market.tsx's own Options tab.
    const rows = activeTab === 0 ? futureRows : activeTab === 2 ? watchRows : [];
    const visibleRows = rows.slice(0, MAX_VISIBLE_ROWS);
    const hasMore = rows.length > MAX_VISIBLE_ROWS;

    const handleViewMore = useCallback(() => {
        const marketTab = activeTab === 0 ? "Futures" : activeTab === 1 ? "Options" : "Watchlist";
        navigation.navigate("Market", { tab: marketTab });
    }, [navigation, activeTab]);

    const handleRowPress = useCallback((symbol: string, tradeMode: string) => {
        if (tradeMode === "option") {
            onSelectOption?.(symbol);
        } else {
            onSelectFuture?.(symbol);
        }
    }, [onSelectFuture, onSelectOption]);

    return (
        <View style={{ width: "100%", marginTop: "5%" }}>
            <Flexcomponent justifyContent="flex-start" style={{ gap: windowwidth * 0.06, borderBottomWidth: 1, borderBottomColor: "#8c868644" }}>
                {TABS.map((tab, i) => (
                    <Flexcomponent
                        key={tab}
                        onPress={() => setActiveTab(i)}
                        ispress={true}
                        style={{ width: "auto", paddingBottom: "3%" }}
                    >
                        <Text
                            family={activeTab === i ? "semiBold" : "regular"}
                            size="medium"
                            style={{ fontSize: 14 }}
                            color={activeTab === i ? theme.primarytext : theme.secondarytext}
                        >
                            {tab}
                        </Text>
                        {activeTab === i && (
                            <View style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 2, backgroundColor: theme.primarytext }} />
                        )}
                    </Flexcomponent>
                ))}
            </Flexcomponent>

            <Flexcomponent justifyContent="space-between" top={"4%"} style={{paddingHorizontal: "10%"}}>
                <Text size="xsmall" color={theme.secondarytext}>Price</Text>
                <Text size="xsmall" color={theme.secondarytext}>24h change</Text>
                <Text size="xsmall" color={theme.secondarytext}>24h vol</Text>
            </Flexcomponent>

            {/* {rows.length > 0 ? (
                rows.map((row, i) => (
                    <MarketRow
                        key={row.key + i}
                        symbol={row.symbol}
                        price={row.price}
                        change={row.change}
                        vol={row.vol}
                        tradeMode={row.tradeMode}
                        pairId={row.pairId}
                        favName={row.favName}
                        isFav={favSet.has(row.favName)}
                        isFavouriteLoading={favouriteLoadingId === row.pairId}
                        theme={theme}
                        onPress={handleRowPress}
                        onToggleFavourite={onToggleFavourite}
                    />
                ))
            ) : (
                <View style={{ alignItems: "center", paddingVertical: "10%" }}>
                    <Text size="small" color={theme.secondarytext}>No records found</Text>
                </View>
            )} */}

            {activeTab === 1 ? (
                <View style={{ alignItems: "center", paddingVertical: "10%" }}>
                    <View
                        style={{
                            width: windowwidth * 0.14,
                            height: windowwidth * 0.14,
                            borderRadius: windowwidth * 0.07,
                            backgroundColor: theme.theme === "dark" ? "#101A2C" : "#E8EFFC",
                            alignItems: "center",
                            justifyContent: "center",
                             marginBottom: "6%",
                        }}
                    >
                        <VectorIcons
                            family="Feather"
                            name="clock"
                            iconcolor={Colors.brand}
                            size={windowwidth * 0.06}
                        />
                    </View>
                    <Text family="semiBold" size="small" style={{ textAlign: "center" }}>Coming Soon</Text>
                    <Text
                        color={theme.secondarytext}
                        style={{ marginTop: "3%", lineHeight: 20, textAlign: "center" }}
                    >
                        This feature isn't available yet. Please check back later.
                    </Text>
                </View>
            ) : rows.length > 0 ? (
                <>
                    {visibleRows.map((row, i) => (
                        <MarketRow
                            key={row.key + i}
                            symbol={row.symbol}
                            price={row.price}
                            change={row.change}
                            vol={row.vol}
                            tradeMode={row.tradeMode}
                            pairId={row.pairId}
                            favName={row.favName}
                            isFav={favSet.has(row.favName)}
                            isFavouriteLoading={favouriteLoadingId === row.pairId}
                            theme={theme}
                            onPress={handleRowPress}
                            onToggleFavourite={onToggleFavourite}
                        />
                    ))}
                    {hasMore && (

                        <TouchableOpacity
                            onPress={handleViewMore}
                            activeOpacity={0.6}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: "4%",
                                gap: windowwidth * 0.015,
                                borderWidth: 1,
                                borderColor: theme.theme == 'dark' ? "#1B2740" : "#E8EFFC",
                                paddingVertical: 7,
                                borderRadius: 7
                            }}
                        >
                            <Text size="small" family="medium" color={theme.secondarytext}>View more</Text>
                            <VectorIcons
                                family="Feather"
                                name="chevron-right"
                                size={windowwidth * 0.04}
                                iconcolor={theme.secondarytext}
                            />
                        </TouchableOpacity>
                    )}
                </>
            ) : (
                <View style={{ alignItems: "center", paddingVertical: "10%" }}>
                    <Text size="small" color={theme.secondarytext}>No records found</Text>
                </View>
            )}
        </View>
    );
};

export default React.memo(StaticMarketTable);
