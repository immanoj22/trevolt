import React from "react";
import { Pressable, View } from "react-native";

import Text from "../../../../Components/text";
import Images from "../../../../Utilities/images";
import { Button } from "../../../../Components/Field";
import { Colors } from "../../../../Utilities/uiasset";
import Sheet from "../../../../Components/bottomsheet";
import VectorIcons from "../../../../Utilities/vectoricons";
import useCustomHooks from "../../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../../Utilities/dimensions";

import { styles } from "../../styles";

interface ConfirmProps {
    ref?: any;
    title?: any;
    value?: string;
    onChange?: any;
    onClose?: () => void
}

const ChangeMargin: React.FC<ConfirmProps> = ({
    ref,
    title,
    value,
    onChange,
    onClose
}) => {
    const { theme } = useCustomHooks();
    const style = styles(theme);

    return (
        <Sheet
            sheetref={ref}
            snappoint={["60%"]}
            custominterface={true}
            backgroundStyle={style.sheet}
        >
            <View style={{
                padding: "4%",
                backgroundColor: theme.bottomheader,
                paddingHorizontal: "5%"
            }}>
                <View style={style.between}>
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>{title}</Text>
                    <Pressable onPress={() => { onChange?.("cross"); onClose?.() }}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </View>
            </View>
            <View style={{ padding: "5%" }}>
                <View style={[style.between, { marginBottom: "4%", justifyContent: "center", gap: 10 }]}>
                    <Pressable style={[value === "isolated" ? style.marginActive : style.margin]} onPress={() => onChange("isolated")}>
                        <Text size="small" style={{ color: theme.darktext }}>Isolated</Text>
                    </Pressable>
                    {/* Portfolio margin mode isn't available for this release yet - hidden
                        rather than shown-disabled. Re-add this Pressable to bring it back:
                        <Pressable style={[value === "portfolio" ? style.marginActive : style.margin]} onPress={() => onChange("portfolio")}>
                            <Text size="small" style={{ color: theme.darktext }}>Portfolio</Text>
                        </Pressable> */}
                    <Pressable style={[value === "cross" ? style.marginActive : style.margin]} onPress={() => onChange("cross")}>
                        <Text size="small" style={{ color: theme.darktext }}>Cross</Text>
                    </Pressable>
                </View>
                <Text style={{ color: Colors.grey }}>You can trade</Text>
                {
                    value === "portfolio" ? (
                        <>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.050}
                                />
                                <Text style={{ color: theme.darktext, marginTop: "1%" }}> Options</Text>
                            </View>
                            <View style={{ marginBottom: "4%", flexDirection: "row", alignItems: "center" }}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.050}
                                />
                                <Text style={{ color: theme.darktext, marginTop: "1%", flexShrink: 1 }}> Futures for underlyings with Options</Text>
                            </View>
                        </>
                    ) : (
                        <View style={{ marginBottom: "4%", flexDirection: "row", alignItems: "center" }}>
                            <VectorIcons
                                family="Feather"
                                name="check"
                                iconcolor={Colors.brand}
                                size={windowwidth * 0.050}
                            />
                            <Text style={{ color: theme.darktext, marginTop: "1%" }}> All instruments / pairs</Text>
                        </View>
                    )
                }

                <Text style={{ color: Colors.grey }}>Salient points</Text>
                <View style={[{ flexDirection: "row" }]}>
                    <VectorIcons
                        family="Feather"
                        name="check"
                        iconcolor={Colors.brand}
                        style={{ marginTop: 5 }}
                    />
                    {
                        (value === "cross" || value === "portfolio") ? <Text style={{ color: theme.darktext, marginTop: "1%", flexShrink: 1 }}> PNL offset - Open positions profits can support losses and new orders</Text> :
                            <Text style={{ color: theme.darktext, marginTop: "1%" }}> Flexible leverage</Text>
                    }
                </View>
                {
                    value === "portfolio" && (
                        <View style={[{ flexDirection: "row", alignItems: "center", marginTop: "1%" }]}>
                            <VectorIcons
                                family="Feather"
                                name="check"
                                iconcolor={Colors.brand}
                                size={windowwidth * 0.050}
                            />
                            <Text style={{ color: theme.darktext, flexShrink: 1 }}> Risk offset</Text>
                        </View>
                    )
                }
                <Button
                    title={value === "cross" ? "Continue with Cross Margin" : value === "portfolio" ? "Continue with Portfolio Margin" : "Switch to Isolated Margin"}
                    buttonStyle={{ marginTop: "5%" }}
                    onPress={onClose}
                    textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                />
            </View>
        </Sheet>
    )

}

export default ChangeMargin;