import React, { useEffect, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import { Button, Input } from "../../../Components/Field";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { style } from "../styles";

interface Manageriskprops {
    sheetref: React.RefObject<BottomSheetModal | null>;
    setFormData?: any
    formData?: any
}

const Managerisk: React.FC<Manageriskprops> = ({
    sheetref,
    setFormData,
    formData
}) => {
    const { theme, closebottomsheet } = useCustomHooks();
    const styles = style(theme);

    // Extra scroll runway is only added while the keyboard is up, so the sheet
    // has no dead space / scroll at its resting 60% height.
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
        const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    return (
        <Sheet
            sheetref={sheetref}
            snappoint={["60%"]}
            custominterface={true}
        >
            <View style={styles.sheet} >
                <View style={styles.risk}>
                    <View>
                        <Text color={theme.tabactive}>Risk Management</Text>
                    </View>
                    <Pressable onPress={() => { closebottomsheet(sheetref) }} style={styles.close}>
                        <Images
                            type='svg'
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.075}
                            height={windowwidth * 0.075}
                        />
                    </Pressable>
                </View>

                <View style={styles.container} >
                    <BottomSheetScrollView
                        keyboardShouldPersistTaps="handled"
                        // Sheet height stays at 60%; the keyboard just overlays it.
                        // Only while the keyboard is up do we add bottom runway so
                        // inputs 3 & 4 can scroll clear of it - with the keyboard
                        // closed there's no extra padding and nothing to scroll.
                        contentContainerStyle={{ paddingBottom: keyboardVisible ? windowheight * 0.4 : "5%" }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={{ marginTop: "5%" }} >
                            <Input
                                themes={theme}
                                keyboardType="numeric"
                                placeHolder="Enter Stop loss"
                                label="Stop loss (1-90)"
                                value={formData?.stopLoss}
                                onChange={(val) => { setFormData({ ...formData, ...{ stopLoss: val } }) }}
                                rightContent={
                                    <Text color={Colors.brand} >%</Text>
                                }
                                allowed={"number"}
                            />
                        </View>

                        <View style={{ marginTop: "1%" }} >
                            <Input
                                 themes={theme}
                                keyboardType="numeric"
                                placeHolder="Enter Take profit"
                                label="Take Profit (1-90)"
                                value={formData?.takeProfit}
                                onChange={(val) => { setFormData({ ...formData, ...{ takeProfit: val } }) }}
                                rightContent={
                                    <Text color={Colors.brand} >%</Text>
                                }
                                allowed={"number"}
                            />
                        </View>

                        <View style={{ marginTop: "1%" }} >
                            <Input
                                themes={theme}
                                keyboardType="numeric"
                                placeHolder="Enter Follow amount"
                                label="Maximum Follow Amount"
                                value={formData?.maxAllowAmount}
                                onChange={(val) => { setFormData({ ...formData, ...{ maxAllowAmount: val } }) }}
                                rightContent={
                                    <Text color={Colors.brand} >{formatDisplayPair("USDT")}</Text>
                                }
                                allowed={"number"}
                            />
                        </View>

                        <View style={{ marginTop: "1%" }} >
                            <Input
                                themes={theme}
                                keyboardType="numeric"
                                placeHolder="Enter Leverage"
                                label="Leverage (1-100)"
                                value={formData?.leverage}
                                onChange={(val) => { setFormData({ ...formData, ...{ leverage: val } }) }}
                                rightContent={
                                    <Text color={Colors.brand} >x</Text>
                                }
                                allowed={"numbers"}
                            />
                        </View>
                        <Button
                            title="Confirm"
                            buttonStyle={{ marginTop: "10%" }}
                            onPress={() => closebottomsheet(sheetref)}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                    </BottomSheetScrollView>
                </View>
            </View>
        </Sheet>
    )

}

export default Managerisk;