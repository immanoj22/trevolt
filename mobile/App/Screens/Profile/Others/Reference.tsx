import React, { useState } from "react";
import { Pressable, View, Share } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import { APIURL } from "../../../Actions/Constant/constant";
import FormGroup from "../../../Components/Field/FormGroup";
import WebviewModal from "../../../Components/DialogBox/Web";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Reference'>;

const Reference: React.FC<Props> = () => {
    const { theme, navigation, copyData } = useCustomHooks();
    const style = styles(theme);

    const { referralCode } = useSelector((state: any) => state.auth.userData);
    const URL = `${APIURL}/register/${referralCode}`

    const onShare = async () => {
        try {
            await Share.share({
                message: `${APIURL}/register/${referralCode}`
            });
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    const [popup, setPopup] = useState(false);

    return (
        <>
            <Mainview
                isheader={true}
                isscollable={false}
                headertitle="Refer & Earn"
                onleftfn={() => navigation.goBack()}
                gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
                gradientLocations={[0, 0.20, 1]}
            >
                <View style={style.container}>
                    <Text size="medium">Refer and Earn Benifit</Text>
                    <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}>Invite friends to Trevolt and earn fee rebates when they complete KYC and trade.</Text>
                    <View style={{ alignItems: "center", marginTop: "5%" }}>
                        <Images
                            type="svg"
                            name="ReferEarn"
                            width={windowwidth * 0.70}
                            height={windowheight * 0.4}
                        />
                    </View>
                    <FormGroup
                        label="Your Referral link"
                        rightContent={
                            <Pressable style={style.copy} onPress={() => copyData(URL)}>
                                <Text style={{ color: Colors.brand }}>  Copy</Text>
                            </Pressable>
                        }
                        background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    >
                        <View style={{ height: windowheight * 0.06, justifyContent: "center" }}>
                            <Text numoflines={1}>{URL}</Text>
                        </View>
                    </FormGroup>
                    <View style={style.bottomButton}>
                        <Button
                            title="Invite now"
                            onPress={onShare}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                    </View>
                </View>
            </Mainview>
            {
                popup === true && (
                    <WebviewModal
                        url={`${APIURL}/referral`}
                        onCloseHandler={() => setPopup(false)}
                    />
                )
            }
        </>
    )

}

export default Reference;