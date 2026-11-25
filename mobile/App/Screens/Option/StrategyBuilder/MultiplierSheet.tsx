import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Slider from "@react-native-community/slider";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Sheet from "../../../Components/bottomsheet";
import VectorIcons from "../../../Utilities/vectoricons";
import { Button, Input } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import { RFvalue } from "../../../Utilities/dimensions";

type Props = {
    sheetref: React.RefObject<BottomSheetModal | null>;
    theme: any;
    initialValue: number;
    max: number;
    onConfirm: (value: number) => void;
};

const marks = [1, 25, 50, 75, 100];

const MultiplierSheet: React.FC<Props> = ({ sheetref, theme, initialValue, max, onConfirm }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <Sheet sheetref={sheetref} custominterface snappoint={["45%"]}>
            <View style={{ paddingHorizontal: 16, paddingTop: 12, flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Text family="medium" size="medium">Select Leverage</Text>
                    <Pressable onPress={() => sheetref.current?.dismiss()} hitSlop={10}>
                        <VectorIcons family="Ionicons" name="close" size={22} iconcolor={theme.primarytext} />
                    </Pressable>
                </View>

                <Input
                    type="calculator"
                    themes={theme}
                    boxstyle={{ width: "75%" }}
                    initialValue={String(value)}
                    onValueChange={(newValue: number) => {
                        if (Number.isNaN(newValue)) return;
                        if (newValue > max || newValue < 1) return;
                        setValue(newValue);
                    }}
                />

                <View style={{ marginVertical: "7%" }}>
                    <Slider
                        minimumValue={1}
                        maximumValue={max}
                        step={1}
                        value={value}
                        onValueChange={setValue}
                        minimumTrackTintColor={Colors.brand}
                        maximumTrackTintColor="#444"
                        thumbTintColor={Colors.brand}
                    />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                        {marks.map((p) => {
                            const valAtP = Math.max(1, Math.round((p / 100) * max));
                            const isActive = value >= valAtP;
                            return (
                                <Pressable key={p} onPress={() => setValue(valAtP)}>
                                    <Text style={{ color: isActive ? Colors.brand : theme.darktext, fontSize: RFvalue(12) }}>
                                        {`${valAtP}x`}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <Button
                    title={`Set to ${value}x`}
                    onPress={() => {
                        onConfirm(Math.round(value));
                        sheetref.current?.dismiss();
                    }}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            </View>
        </Sheet>
    );
};

export default MultiplierSheet;
