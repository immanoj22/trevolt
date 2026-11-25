import React from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Description from "../Description";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'SubAccountDetails'>;

const SubAccountDetails: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);
    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"Sub Account"}
            isscollable={true}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Description
                    title="Sub Account"
                    content="To ensure smooth withdrawals and comply with regulations, please verify your bank account."
                />
                <Description
                    title="Accounts Details"
                    containerStyle={{ marginTop: "10%" }}
                />
                <Card containerStyle={{ marginTop: '10%' }}>
                    <View style={[style.between, { paddingHorizontal: "5%", paddingVertical: '2%' }]}>
                        <Text>Main Account</Text>
                        <Pressable onPress={() => navigation.goBack()}>
                            {
                                theme.theme === "dark" ?
                                    <Images
                                        type="svg"
                                        name="Pen"
                                        width={windowwidth * 0.06}
                                    />
                                    :
                                    <Images
                                        type="svg"
                                        name="PenDark"
                                        width={windowwidth * 0.06}
                                    />
                            }
                        </Pressable>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.boderColor }} />
                    <View style={[style.between, { paddingHorizontal: "5%", paddingTop: "8%" }]}>
                        <Text style={{ color: theme.secondarytext }}>User ID</Text>
                        <Text>895624755</Text>
                    </View>
                    <View style={[style.between, { paddingHorizontal: "5%", marginTop: '5%' }]}>
                        <Text style={{ color: theme.secondarytext }}>Email Id</Text>
                        <Text>abc@gmail.com</Text>
                    </View>
                    <View style={style.verifiedContainer}>
                        <Button
                            title="Transfer History"
                            buttonStyle={style.historyButton}
                            textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                        />
                    </View>
                </Card>
            </View>
        </Mainview>
    )

}

export default SubAccountDetails;