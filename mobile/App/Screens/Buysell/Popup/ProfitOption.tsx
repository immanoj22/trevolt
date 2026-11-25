import React from "react";
import { Pressable, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";

import { styles } from "../styles";

interface ConfirmProps {
    ref?: any;
    formData?: any;
    onChange?: any
    screen?: any
}

const ProfitOptionComponent: React.FC<ConfirmProps> = ({
    ref,
    formData,
    onChange,
    screen
}) => {
    const { theme, closebottomsheet } = useCustomHooks();
    const style = styles(theme);

    // The 6-item list (default, non-"options" screen) didn't fit the old "40%" snap
    // point at the old row spacing - only ~3.5 rows showed before the content got cut
    // off mid-row, forcing a scroll for the rest. That's what read as the sheet being
    // unstable/"fluctuating" rather than a clean, fixed, professional-looking sheet.
    // Fix is two-sided: a taller static snap point sized for 6 rows, AND each row
    // trimmed down (smaller radio dot, tighter spacing) so all 6 sit fully visible
    // with no scroll needed - not just a taller sheet with the same loose spacing.
    const optionList = screen === "options"
        ? [{ key: 'stop_limit', label: 'Stop Limit' },
        { key: 'take_profit_limit', label: 'Take Profit Limit' }]
        : [{ key: 'makeronly', label: 'Maker Only' },
        { key: 'trailingStop', label: 'Trailing Stop' },
        { key: 'stop_limit', label: 'Stop Limit' },
        { key: 'stop_market', label: 'Stop Market' },
        { key: 'take_profit', label: 'Take Profit Market' },
        { key: 'take_profit_limit', label: 'Take Profit Limit' }];

    return (
        <Sheet
            sheetref={ref}
            snappoint={screen === "options" ? ["30%"] : ["50%"]}
            custominterface={true}
            backgroundStyle={style.sheetContainer}
        >
            <View style={style.sheet}>
                <View style={style.between}>
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>Select option</Text>
                    <Pressable onPress={() => { closebottomsheet(ref) }}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </View>
            </View>
            <BottomSheetScrollView>
                <View style={{ paddingHorizontal: "5%", paddingTop: RFvalue(4), paddingBottom: "5%" }}>
                    {optionList.map(({ key, label }) => (
                        <Pressable
                            key={key}
                            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: RFvalue(14) }}
                            onPress={() => {
                                onChange(key),
                                    closebottomsheet(ref)
                            }}
                        >
                            <Text size="medium" color={theme.darktext}>
                                {label}
                            </Text>
                            <View style={[{
                                width: RFvalue(18),
                                height: RFvalue(18),
                                borderRadius: 100,
                                borderColor: theme.theme === "dark" ? "" : theme.boderColor,
                                borderWidth: 1,
                                justifyContent: "center",
                                alignItems: "center",
                            }, { backgroundColor: theme.theme === "dark" ? Colors.dune : formData?.orderType === key ? Colors.brand : theme.card, }]}>
                                {
                                    formData?.orderType === key && (
                                        <VectorIcons
                                            family="Octicons"
                                            name="dot-fill"
                                            iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                            size={RFvalue(15)}
                                        />
                                    )
                                }
                            </View>
                        </Pressable>
                    ))}
                </View>
            </BottomSheetScrollView>
        </Sheet>
    )

}

// Stays mounted (just hidden) inside BuysellNew - see PlaceOrder.tsx's identical note.
const ProfitOption = React.memo(ProfitOptionComponent);

export default ProfitOption;