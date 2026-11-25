import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";

import Text from "../../Components/text";
import { Input } from "../../Components/Field";
import Mainview from "../../Components/mainview";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { Colors, Fontfamily } from "../../Utilities/uiasset";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AddUPIDetails'>;

const AddUPIDetails: React.FC<Props> = () => {

    const { theme, navigation } = useCustomHooks();

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle="Add UPI"
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >

            <KeyboardAvoidingView
                behavior="padding">
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false} >
                    <View style={{ flex: 1, marginTop: 20, width: "auto", justifyContent: "flex-start", }}>
                        <Input label="Enter UPI ID" placeHolder="" />
                    </View>
                </KeyboardAwareScrollView>
            </KeyboardAvoidingView>
            <View style={styles.bottomView}>
                <Pressable onPress={() => navigation.goBack()} style={{ backgroundColor: Colors.btnBgGreen, alignItems: "center", borderRadius: 10, width: "100%", marginRight: 10, minHeight: 40, }}>
                    <Text style={styles.btntxtStyle}>Verify</Text>
                </Pressable>
            </View>
        </Mainview>
    )

}
const styles = StyleSheet.create({
    bottomView: {
        width: "100%",
        justifyContent: "center",
        bottom: 0,
        position: "absolute",
    },
    btntxtStyle: {
        color: Colors.textWhite,
        fontFamily: Fontfamily.semiBold,
        padding: 12,
    },
    item: {

    }
})

export default AddUPIDetails;