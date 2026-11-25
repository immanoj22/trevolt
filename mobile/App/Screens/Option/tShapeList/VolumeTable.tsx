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
    convert: (value: any) => any;
    isInTheMoney?: boolean;
    itmStyle?: any;
    // 24h Price Ch. is a percentage, not a currency amount - keep it out of convert()
    // so it doesn't pick up a currency symbol.
    askIsPercent?: boolean;
}


interface MarkCellProps {
    price?: any;
    iv?: any;
    onPress?: () => void;
    isSelected?: boolean;
    styles: any;
    convert: (value: any) => any;
    isInTheMoney?: boolean;
    itmStyle?: any;
    priceColor: string;
    ivColor: string;
    barColor: string;
    barSide: "call" | "put";
}


/* ================= BID / ASK CELL ================= */

const BidAskCell = memo(({
    bid,
    ask,
    onPress,
    isSelected,
    styles: style,
    convert,
    isInTheMoney,
    itmStyle,
    askIsPercent,
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
        <Text
            fontSize={RFvalue(11)}
            family="medium"
            color={Colors.brand}
            style={style.priceText}
        >
            {bid === undefined || bid === null
                ? "--"
                : convert(bid)}
        </Text>

        <Text
            fontSize={RFvalue(10)}
            family="medium"
            color={Colors.red}
            style={style.quantityText}
        >
            {ask === undefined || ask === null
                ? "--"
                : askIsPercent
                    ? `${Number(ask).toFixed(2)}%`
                    : convert(ask)}
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
    convert,
    isInTheMoney,
    itmStyle,
    priceColor,
    ivColor,
    barColor,
    barSide,
}: MarkCellProps) => {
    // flex:1 so this block always takes exactly the space left over after the fixed-
    // width bar (never more), and hugs whichever edge is away from the bar - a wide
    // value like "₹1,64,050" then shrinks/truncates in place instead of pushing the
    // bar over or wrapping onto a second line and leaving a gap.
    const textBlock = (
        <View style={[style.markTextBlock, barSide === "call" ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
            <Text
                fontSize={RFvalue(11)}
                family="semiBold"
                color={priceColor}
                style={[style.priceText, {
                    marginLeft: barSide === 'put' ? "40%" : 0,
                    marginRight: barSide === 'call' ? "40%" : 0
                }]}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.6 }}
            >
                {price === undefined || price === null
                    ? "--"
                    : convert(price)}
            </Text>

            {/* IV */}

            <Text
                fontSize={RFvalue(10)}
                color={ivColor}
                style={[style.quantityText, {
                    marginLeft: barSide === 'put' ? "35%" : 0,
                    marginRight: barSide === 'call' ? "35%" : 0
                }]}
                numoflines={1}
            >
                {iv === undefined || iv === null
                    ? "--"
                    : `${Number(iv).toFixed(2)}%`}
            </Text>
        </View>
    );

    // Small progress chip sits on the inner edge nearest Strike - text before it for
    // calls (Mark-Call sits left of Strike, so its inner edge is on the right), text
    // after it for puts (Mark-Put sits right of Strike, so its inner edge is on the left).
    const bar = (
        <View
            pointerEvents="none"
            style={[style.markBar, {
                width: 78,
                backgroundColor: barColor,
                borderTopLeftRadius: barSide === "call" ? 3 : 0,
                borderBottomLeftRadius: barSide === "call" ? 3 : 0,
                borderTopRightRadius: barSide === "put" ? 3 : 0,
                borderBottomRightRadius: barSide === "put" ? 3 : 0,
                left: barSide === 'put' ? 0 : undefined,
                right: barSide === 'call' ? 0 : undefined
            }]}
        />
    );

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            style={[
                style.priceCell,
                style.markCellRow,
                isInTheMoney && itmStyle,
                isSelected && style.selectedCell,
            ]}
        >
            {barSide === "call" ? (
                <>
                    {textBlock}
                    {bar}
                </>
            ) : (
                <>
                    {bar}
                    {textBlock}
                </>
            )}
        </Pressable>
    );
});


/* ================= MAIN COMPONENT ================= */

const VolumeTable: React.FC<TShapeListProps> = ({
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

    const style = styles(theme);


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


                {/* ================= CALL BID / ASK ================= */}

                <BidAskCell
                    bid={item.call?.volume}
                    ask={item.call?.percent24Change}
                    askIsPercent
                    onPress={
                        item.call
                            ? () =>
                                onSelect?.(item.call)
                            : undefined
                    }
                    isSelected={callSelected}
                    styles={style}
                    convert={convert}
                    isInTheMoney={callInTheMoney}
                    itmStyle={style.inTheMoneyCell}
                />


                {/* ================= CALL OI ================= */}

                <MarkCell
                    price={item.call?.openInterest}
                    iv={item.call?.oiChangePct}
                    onPress={
                        item.call
                            ? () =>
                                onSelect?.(item.call)
                            : undefined
                    }
                    isSelected={callSelected}
                    styles={style}
                    convert={convert}
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
                    barColor={theme.theme === 'dark' ? "#ee165749" : "#EE165740"}
                    barSide="call"
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


                {/* ================= PUT OI ================= */}

                <MarkCell
                    price={item.put?.openInterest}
                    iv={item.put?.oiChangePct}
                    onPress={
                        item.put
                            ? () =>
                                onSelect?.(item.put)
                            : undefined
                    }
                    isSelected={putSelected}
                    styles={style}
                    convert={convert}
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
                    barColor={theme.theme === 'dark' ? "#00D0B280" : "#00D0B240"}
                    barSide="put"
                />


                {/* ================= PUT BID / ASK ================= */}

                <BidAskCell
                    bid={item.put?.volume}
                    ask={item.put?.percent24Change}
                    askIsPercent
                    onPress={
                        item.put
                            ? () =>
                                onSelect?.(item.put)
                            : undefined
                    }
                    isSelected={putSelected}
                    styles={style}
                    convert={convert}
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


                {/* CALL 24h VOL / 24h PRICE CH. */}

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
                        // color={theme.secondarytext}
                        color={theme.theme == 'dark' ? "#6D7584" : "#6D7584"}
                    >
                        24h Price Ch.
                    </Text>

                </View>


                {/* CALL OI */}

                <View style={style.headerCell}>

                    <Text
                        fontSize={RFvalue(10)}
                        family="medium"
                        color={theme.futuretext}
                    >
                        OI
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
                        // color={theme.secondarytext}
                        color={theme.theme == 'dark' ? "#6D7584" : "#6D7584"}
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


export default VolumeTable;


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


        /* ================= MARK CELL: TEXT + BAR SIDE BY SIDE ================= */

        markCellRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            //   paddingHorizontal:4
        },

        // flex:1 (not shrink-wrapped) so a wide value like "₹1,64,050" fills exactly
        // the space left of/right of the bar instead of leaving a gap or wrapping.
        markTextBlock: {
            flex: 1,
        },

        /* Small static progress chip next to the Mark price/IV - not full cell height,
           so it never overlaps the text next to it. Fixed width, never shrinks, so it
           can't get squeezed out by a wide price value. */
        markBar: {
            position: "absolute",
            height: "40%",
            flexShrink: 0,
            top: 4
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
