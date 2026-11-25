import React, { memo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { RFvalue, windowheight } from "../../../Utilities/dimensions";
import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import VectorIcons from "../../../Utilities/vectoricons";


interface TShapeRow {
    strikePrice: any;
    call?: any;
    put?: any;
    isMarkPrice?: boolean;
}


interface TShapeListProps {
    data?: TShapeRow[];
    onSelect?: (item: any) => void;
    selectedId?: any;
    currentPrice?: any;
    underlyingSymbol?: string;
    onStrikeHeaderPress?: () => void;
    isFavourite?: (item: any) => boolean;
    onToggleFavourite?: (item: any) => void;
    isTogglingFavourite?: (item: any) => boolean;
}


interface BidAskCellProps {
    bid?: any;
    ask?: any;
    onPress?: () => void;
    isSelected?: boolean;
    styles: any;
    isInTheMoney?: boolean;
    itmStyle?: any;
    theme: any;
}


interface MarkCellProps {
    price?: any;
    iv?: any;
    onPress?: () => void;
    isSelected?: boolean;
    styles: any;
    isInTheMoney?: boolean;
    itmStyle?: any;
    priceColor: string;
    ivColor: string;
    barColor: string;
    barSide: "call" | "put";
    // Row's |delta| as a fraction (0-1) of the max |delta| across the visible strikes,
    // so the bar's width reflects how large this delta is relative to the rest of the
    // chain instead of always being a fixed width.
    barWidthFraction: number;
}

// The highest-magnitude row's bar stops here, not at 100% - otherwise it fills the
// cell edge-to-edge and reads as a solid block instead of a proportional bar.
const MAX_BAR_PERCENT = 70;




/* ================= THETA / VEGA CELL ================= */

const BidAskCell = memo(({
    bid,
    ask,
    onPress,
    isSelected,
    styles: style,
    isInTheMoney,
    itmStyle,
    theme,
}: BidAskCellProps) => (
    <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={[
            style.priceCell,
            isInTheMoney && itmStyle,
            isSelected && style.selectedCell,
        ]}
    >
        {/* Theta - a plain greek value, not a currency amount, so no convert() */}
        <Text
            fontSize={RFvalue(11)}
            family="medium"
            color={theme.darktext}
            style={style.priceText}
        >
            {bid === undefined || bid === null
                ? "--"
                : Number(bid).toFixed(2)}
        </Text>

        {/* Vega */}
        <Text
            fontSize={RFvalue(10)}
            family="medium"
            color={theme.secondarytext}
            style={style.quantityText}
        >
            {ask === undefined || ask === null
                ? "--"
                : Number(ask).toFixed(2)}
        </Text>
    </Pressable>
));


/* ================= MARK CELL ================= */

const MarkCell = memo(({
    price,
    iv,
    onPress,
    isSelected,
    styles: style,
    isInTheMoney,
    itmStyle,
    priceColor,
    ivColor,
    barColor,
    barSide,
    barWidthFraction,
}: MarkCellProps) => {
    // Bar is an absolutely-positioned background layer behind the text (priceCell is
    // already position:'relative'). The text keeps its normal centered flow position -
    // zIndex puts it above the bar - so growing/shrinking the bar's width can NEVER move
    // the value; it only changes how much color shows behind it.
    // Rounded only on the outer end (away from Strike) - the inner edge, where the bar
    // starts growing from Strike outward, stays square so it doesn't read as a plain box.
    const barWidthPct = Math.min(Math.max(barWidthFraction, 0), 1) * MAX_BAR_PERCENT;

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            style={[
                style.priceCell,
                isInTheMoney && itmStyle,
                isSelected && style.selectedCell,
            ]}
        >
            {barWidthPct > 0 && (
                <View
                    pointerEvents="none"
                    style={[
                        style.markBar,
                        {
                            backgroundColor: barColor,
                            width: `${barWidthPct}%`,
                        },
                        barSide === "call"
                            ? { right: 0, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }
                            : { left: 0, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
                    ]}
                />
            )}

            {/* Delta - a plain greek value, not a currency amount, so no convert() */}
            <Text
                fontSize={RFvalue(11)}
                family="semiBold"
                color={priceColor}
                style={style.priceText}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.6 }}
            >
                {price === undefined || price === null
                    ? "--"
                    : Number(price).toFixed(2)}
            </Text>

            {/* Gamma */}

            <Text
                fontSize={RFvalue(10)}
                color={ivColor}
                style={style.quantityText}
                numoflines={1}
            >
                {iv === undefined || iv === null
                    ? "--"
                    : Number(iv).toFixed(5)}
            </Text>
        </Pressable>
    );
});


/* ================= MAIN COMPONENT ================= */

const GreeksTable: React.FC<TShapeListProps> = ({
    data = [],
    onSelect,
    selectedId,
    currentPrice,
    underlyingSymbol,
    onStrikeHeaderPress,
    isFavourite,
    onToggleFavourite,
    isTogglingFavourite,
}) => {

    const { theme, convert } = useCustomHooks();

const style = styles(theme)

    // Bars are scaled against their own side's max |delta|, not one shared max across
    // both columns - calls and puts trend toward opposite-signed deltas, so a shared max
    // would let one side dwarf the other into a near-invisible bar.
    const maxCallDelta = Math.max(0, ...data.map((row) => Math.abs(Number(row.call?.delta)) || 0));
    const maxPutDelta = Math.max(0, ...data.map((row) => Math.abs(Number(row.put?.delta)) || 0));


    /* ================= RENDER ROW ================= */

    const renderOption = ({
        item,
    }: {
        item: TShapeRow;
    }) => {

        /* ================= CURRENT PRICE MARK ================= */

        if (item.isMarkPrice) {
            return (
                <View style={style.markRow}>

                    <View style={style.markLine} />

                    <View style={style.markLine} />

                    <View style={style.markPricePill}>
                        <Text
                            fontSize={RFvalue(9)}
                            family="medium"
                            color={Colors.white}
                        >
                            {underlyingSymbol}{" "}
                            {convert(
                                currentPrice ??
                                item.strikePrice
                            )}
                        </Text>
                    </View>

                </View>
            );
        }


        /* ================= SELECTED ================= */

        const callSelected =
            Boolean(
                selectedId &&
                item.call?._id === selectedId
            );

        const putSelected =
            Boolean(
                selectedId &&
                item.put?._id === selectedId
            );


        /* ================= IN THE MONEY ================= */

        const strike =
            Number(item.strikePrice);

        const callInTheMoney =
            Boolean(
                currentPrice &&
                strike <= currentPrice
            );

        const putInTheMoney =
            Boolean(
                currentPrice &&
                strike >= currentPrice
            );


        return (

            <View style={style.tableRow}>


                {/* ================= CALL THETA / VEGA ================= */}

                <BidAskCell
                    bid={item.call?.theta}
                    ask={item.call?.vega}
                    onPress={
                        item.call
                            ? () =>
                                onSelect?.(item.call)
                            : undefined
                    }
                    isSelected={callSelected}
                    styles={style}
                    theme={theme}
                    isInTheMoney={callInTheMoney}
                    itmStyle={style.inTheMoneyCell}
                />


                {/* ================= CALL DELTA / GAMMA ================= */}

                <MarkCell
                    price={item.call?.delta}
                    iv={item.call?.gamma}
                    onPress={
                        item.call
                            ? () =>
                                onSelect?.(item.call)
                            : undefined
                    }
                    isSelected={callSelected}
                    styles={style}
                    isInTheMoney={callInTheMoney}
                    itmStyle={style.inTheMoneyCell}
                    priceColor={
                        theme.darktext ||
                        Colors.dune
                    }
                    ivColor={
                        theme.futuretext ||
                        theme.graytext
                    }
                    barColor={Colors.redbar}
                    barSide="call"
                    barWidthFraction={
                        maxCallDelta > 0
                            ? (Math.abs(Number(item.call?.delta)) || 0) / maxCallDelta
                            : 0
                    }
                />


                {/* ================= STRIKE ================= */}

                <Pressable
                    disabled={
                        !item.call &&
                        !item.put
                    }
                    onPress={() =>
                        onSelect?.(
                            item.call ??
                            item.put
                        )
                    }
                    style={style.strikeCell}
                >

                    {/* FAVOURITE */}

                    {onToggleFavourite && (
                        <Pressable
                            onPress={() =>
                                onToggleFavourite(
                                    item.call ??
                                    item.put
                                )
                            }
                            disabled={
                                isTogglingFavourite?.(
                                    item.call ??
                                    item.put
                                )
                            }
                            hitSlop={8}
                            style={{
                                opacity:
                                    isFavourite?.(
                                        item.call ??
                                        item.put
                                    )
                                        ? 1
                                        : 0.35,
                            }}
                        >

                            <VectorIcons
                                family="FontAwesome"
                                name={
                                    isFavourite?.(
                                        item.call ??
                                        item.put
                                    )
                                        ? "star"
                                        : "star-o"
                                }
                                size={11}
                                iconcolor={
                                    isFavourite?.(
                                        item.call ??
                                        item.put
                                    )
                                        ? "#FDD25A"
                                        : theme.secondarytext
                                }
                            />

                        </Pressable>
                    )}


                    {/* STRIKE PRICE */}

                    <Text
                        fontSize={RFvalue(11)}
                        family="medium"
                        color={theme.darktext}
                    >
                        {item.strikePrice}
                    </Text>

                </Pressable>


                {/* ================= PUT DELTA / GAMMA ================= */}

                <MarkCell
                    price={item.put?.delta}
                    iv={item.put?.gamma}
                    onPress={
                        item.put
                            ? () =>
                                onSelect?.(item.put)
                            : undefined
                    }
                    isSelected={putSelected}
                    styles={style}
                    isInTheMoney={putInTheMoney}
                    itmStyle={style.inTheMoneyCell}
                    priceColor={
                        theme.darktext ||
                        Colors.dune
                    }
                    ivColor={
                        theme.futuretext ||
                        theme.graytext
                    }
                    barColor={Colors.greenbar}
                    barSide="put"
                    barWidthFraction={
                        maxPutDelta > 0
                            ? (Math.abs(Number(item.put?.delta)) || 0) / maxPutDelta
                            : 0
                    }
                />


                {/* ================= PUT THETA / VEGA ================= */}

                <BidAskCell
                    bid={item.put?.theta}
                    ask={item.put?.vega}
                    onPress={
                        item.put
                            ? () =>
                                onSelect?.(item.put)
                            : undefined
                    }
                    isSelected={putSelected}
                    styles={style}
                    theme={theme}
                    isInTheMoney={putInTheMoney}
                    itmStyle={style.inTheMoneyCell}
                />

            </View>
        );
    };


    return (

        <View style={style.container}>


            {/* ================= TABLE HEADER ================= */}

            <View style={style.columnHeader}>


                {/* CALL THETA / VEGA */}

                <View style={style.headerCell}>

                    <Text
                        fontSize={RFvalue(10)}
                        family="medium"
                        color={theme.futuretext}
                    >
                        Theta
                    </Text>

                    <Text
                        fontSize={RFvalue(9)}
                        color={theme.secondarytext}
                    >
                        Vega
                    </Text>

                </View>


                {/* CALL DELTA / GAMMA */}

                <View style={style.headerCell}>

                    <Text
                        fontSize={RFvalue(10)}
                        family="medium"
                        color={theme.futuretext}
                    >
                        Delta
                    </Text>

                    <Text
                        fontSize={RFvalue(9)}
                        color={theme.secondarytext}
                    >
                        Gamma
                    </Text>

                </View>


                {/* STRIKE */}

                <Pressable
                    onPress={onStrikeHeaderPress}
                    style={style.strikeHeader}
                >

                    <Text
                        fontSize={RFvalue(10)}
                        family="medium"
                        color={theme.futuretext}
                    >
                        STRIKE
                    </Text>


                    <View
                        style={{
                            marginLeft: 6,
                        }}
                    >

                        <VectorIcons
                            family="Ionicons"
                            name="caret-up-outline"
                            iconcolor={theme.futuretext}
                            size={RFvalue(7)}
                        />

                        <VectorIcons
                            family="Ionicons"
                            name="caret-down-outline"
                            iconcolor={theme.futuretext}
                            size={RFvalue(7)}
                            style={{
                                marginTop: -3,
                            }}
                        />

                    </View>

                </Pressable>


                {/* PUT OI */}

                <View style={style.headerCell}>

                    <Text
                        fontSize={RFvalue(10)}
                        family="medium"
                        color={theme.futuretext}
                    >
                        OI
                    </Text>

                </View>


                {/* PUT 24h VOL / 24h PRICE CH. */}

                <View style={style.headerCell}>

                    <Text
                        fontSize={RFvalue(10)}
                        family="medium"
                        color={theme.futuretext}
                    >
                        24h Vol
                    </Text>

                    <Text
                        fontSize={RFvalue(9)}
                        color={theme.secondarytext}
                    >
                        24h Price Ch.
                    </Text>

                </View>

            </View>


            {/* ================= T-SHAPE LIST ================= */}

            <FlatList
                data={data}
                renderItem={renderOption}
                keyExtractor={(item, index) =>
                    `${item.strikePrice}-${index}`
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    style.listContent
                }
                initialNumToRender={14}
                maxToRenderPerBatch={10}
                windowSize={7}
                removeClippedSubviews
            />

        </View>
    );
};


export default GreeksTable;


/* ================= STYLES ================= */

const styles = (theme: any) =>
    StyleSheet.create({

        container: {
            flex: 1,
        },


        /* ================= HEADER ================= */

        columnHeader: {
            flexDirection: "row",
            height: windowheight * 0.045,
            backgroundColor: "transparent",
            borderBottomWidth: 0.5,
            borderBottomColor: theme.boderColor,
        },


        headerCell: {
            width: "20%",
            alignItems: "center",
            justifyContent: "center",
        },


        strikeHeader: {
            width: "20%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
        },


        /* ================= TABLE ROW ================= */

        tableRow: {
            flexDirection: "row",
            minHeight: windowheight * 0.047,
            borderBottomWidth: 0.5,
            borderBottomColor: theme.boderColor,
        },


        /* ================= PRICE CELL ================= */

        priceCell: {
            width: "20%",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            paddingVertical: 3,
        },


        /* ================= MARK CELL: BAR BEHIND THE TEXT ================= */

        // Absolute background layer behind the Delta/Gamma text (priceCell is already
        // position:'relative') - grows/shrinks under the value without ever moving it.
        markBar: {
            position: "absolute",
            top: 0,
            bottom: 0,
        },


        priceText: {
            zIndex: 1,
        },


        quantityText: {
            zIndex: 1,
            marginTop: 1,
        },


        /* ================= SELECTED ================= */

        selectedCell: {
            backgroundColor:
                theme.theme === "dark"
                    ? "#1E3A8A"
                    : "#dee7f6",
        },


        /* ================= IN THE MONEY ================= */

        inTheMoneyCell: {
            backgroundColor:
                theme.theme === "dark"
                    ? "#0e1e3c"
                    : "#dbe4f4",
        },


        /* ================= STRIKE ================= */

        strikeCell: {
            width: "20%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,

            // backgroundColor:
            //     theme.theme === "dark"
            //         ? "#182523"
            //         : theme.infoCardBg,

            borderLeftWidth: 0.5,
            borderRightWidth: 0.5,
            // borderColor: theme.boderColor,
            borderColor: theme.theme === 'dark' ? "#102c5c" : "#125a3533",
        },


        /* ================= CURRENT PRICE MARK ================= */

        markRow: {
            height: windowheight * 0.038,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.background,
        },


        markLine: {
            flex: 1,
            height: 0.5,
            backgroundColor: "#14A35B80",
        },


        markPricePill: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginHorizontal: 4,
            borderRadius: 10,
            backgroundColor: "#14A35B80",
        },


        listContent: {
            paddingBottom: 30,
        },

    });
