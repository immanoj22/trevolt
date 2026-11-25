import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";

import Text from "../../Components/text";
import Images from "../../Utilities/images";
import { Colors } from "../../Utilities/uiasset";
import Sheet from "../../Components/bottomsheet";
import VectorIcons from "../../Utilities/vectoricons";
import { formatExpiryLabel, getRemainingTimeFromDate } from "../../Utilities/dateTime";
import { windowheight, windowwidth } from "../../Utilities/dimensions";

interface OptionListProps {
    ref?: any;
    data?: any[];
    title?: any;
    onSelect?: (item: any) => void;
    onClose?: () => void;
    selectedId?: any
    // "expiry" (default) renders the expiryDateStr/expiryDate chain-item shape used by
    // the Add-Contracts picker. "strike" reuses the same sheet chrome for a plain
    // strikePrice list (Strategy Builder's Edit-leg sheet), matched by strikePrice value.
    variant?: "expiry" | "strike";
}

const OptionList: React.FC<OptionListProps> = ({
    ref,
    data = [],
    title,
    onSelect,
    onClose,
    selectedId,
    variant = "expiry"
}) => {
    const { theme } = useCustomHooks();
    const style = styles(theme);

    const renderOption = ({ item }: {
        item?: any;
        onDelete?: (newValue: any) => void;
    }) => {
        const isStrike = variant === "strike";
        const { expiryDateStr, expiryDate } = item;
        const isSelected = isStrike
            ? selectedId?.strikePrice === item?.strikePrice
            : selectedId?.expiryDateStr === expiryDateStr;
        return (

            <Pressable style={[style.bewteen, style.content]}
                onPress={() => {
                    onSelect?.(item);
                    onClose?.();
                }}>
                <View>
                    <Text style={{ color: theme.darktext }} >{isStrike ? item?.strikePrice : formatExpiryLabel(expiryDateStr)}</Text>
                    {!isStrike && (
                        <Text style={{ color: theme.graytext, marginTop: '2%' }}>{expiryDate && <Text style={{ color: theme.graytext }}>Expire in {getRemainingTimeFromDate(expiryDate)}</Text>}</Text>
                    )}
                </View>
                <View style={[style.select, { backgroundColor: theme.theme === "dark" ? Colors.dune : isSelected ? Colors.brand : theme.card, }]}>
                    {
                        isSelected && (
                            <VectorIcons
                                family="Octicons"
                                name="dot-fill"
                                iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                size={windowwidth * 0.055}
                            />
                        )
                    }
                </View>
            </Pressable>
        )
    }

    return (
        <Sheet
            sheetref={ref}
            custominterface={true}
            snappoint={["45%"]}
            bottomSheetProps={{ stackBehavior: "push" }}
        >
            <View style={{ flex: 1 }}>
                <View style={style.container}>
                    <View style={style.bewteen}>
                        <Text family="semiBold" size="medium" style={{ color: theme.darktext }}>{title}</Text>
                        <Pressable onPress={onClose}>
                            <Images
                                type="svg"
                                name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                                width={windowwidth * 0.060}
                                height={windowheight * 0.040}
                            />
                        </Pressable>
                    </View>
                </View>
                <BottomSheetFlatList
                    data={data}
                    keyExtractor={(item, index) => (variant === "strike" ? item?.strikePrice : item?.expiryDateStr) ?? index.toString()}
                    renderItem={renderOption}
                    ItemSeparatorComponent={() => <View style={[style.separator, { backgroundColor: theme.theme === "dark" ? "#1B2740" : "#E2E8F0" }]} />}
                />
            </View>
        </Sheet>
    )
}

export default OptionList;

const styles = (theme: any) => StyleSheet.create({
    container: {
        padding: "4%",
        paddingHorizontal: "6%"
    },
    bewteen: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    content: {
        paddingVertical: "3%",
        paddingHorizontal: "6%"
    },
    separator: {
        height: 1,
        marginHorizontal: "6%"
    },
    select: {
        width: windowwidth * 0.065,
        height: windowwidth * 0.065,
        borderRadius: 100,
        borderColor: theme.theme === "dark" ? "" : theme.boderColor,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    }
})