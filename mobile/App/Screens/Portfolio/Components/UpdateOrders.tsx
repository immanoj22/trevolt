import React, { useContext } from "react";
import { Pressable, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import Sheet from "../../../Components/bottomsheet";
import { Button, Input } from "../../../Components/Field";
import ThemeContext from "../../../Utilities/themecontext";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

interface ConfirmProps {
    ref?: any;
    data?: any;
    changeHandler?: any;
    onPress?: any
    loading?: any,
    type?: any
}

const UpdateOrders: React.FC<ConfirmProps> = ({
    ref,
    data,
    changeHandler,
    onPress,
    loading,
    type
}) => {
    const { closebottomsheet } = useCustomHooks();
    const theme = useContext(ThemeContext);
    const style = styles(theme);

    return (
        <Sheet
            sheetref={ref}
            snappoint={["55%"]}
            custominterface={true}
            backgroundStyle={style.border}
        >
            <View style={[style.header, { backgroundColor: "transparent" }]}>
                <Flexcomponent justifyContent="space-between" alignItems="center">
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>Update Orders</Text>
                    <Pressable onPress={() => closebottomsheet(ref)}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </Flexcomponent>
            </View>
            <View style={{ flex: 1 }}>
                <BottomSheetScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: "55%" }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={style.containerCon}>
                        {
                            type === "quantity" && (
                                <Input
                                    label="Quantity"
                                    themes={theme}
                                    keyboardType="numeric"
                                    value={data?.quantity}
                                    onChange={(text) => {
                                        changeHandler("quantity", text)
                                    }}
                                    allowed={"number"}
                                />
                            )
                        }
                        {
                            type === "price" && (
                                <Input
                                    label="Price"
                                    themes={theme}
                                    keyboardType="numeric"
                                    value={data?.price}
                                    onChange={(text) => {
                                        changeHandler("price", text)
                                    }}
                                    allowed={"number"}
                                />
                            )
                        }
                        {
                            type === "trailPrice" && (
                                data?.isTrailingOrder ? (
                                    <Input
                                        label="Trigger Price"
                                        themes={theme}
                                        keyboardType="numeric"
                                        value={data?.trailPrice}
                                        onChange={(text) => {
                                            changeHandler("trailPrice", text)
                                        }}
                                        allowed={"number"}
                                    />
                                ) :
                                    <Input
                                        label="Trigger Price"
                                        themes={theme}
                                        keyboardType="numeric"
                                        value={data?.stopPrice}
                                        onChange={(text) => {
                                            changeHandler("stopPrice", text)
                                        }}
                                        allowed={"number"}
                                    />
                            )
                        }
                        <Flexcomponent justifyContent="flex-end" style={{ marginTop: 10 }}>
                            <Button
                                title="Confirm"
                                buttonStyle={{ width: windowwidth * 0.30 }}
                                loading={loading}
                                onPress={onPress}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </Flexcomponent>
                    </View>

                </BottomSheetScrollView>
            </View>
        </Sheet>
    )

}

export default UpdateOrders;