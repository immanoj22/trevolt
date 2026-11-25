import React, { useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Text from "../../../../Components/text";
import Mainview from "../../../../Components/mainview";
import { setKycparms } from "../../../../Slices/helper";
import { Button, Dropdown } from "../../../../Components/Field";
import useCustomHooks from "../../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../../Navigations/navigationtypes";

import { styles } from "../../styles";
import { Colors } from "../../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'KYCVerification'>;

const KYCVerification: React.FC<Props> = () => {
    const { theme, navigation, dispatch } = useCustomHooks();
    const style = styles(theme);

    const dropdownData = [
        { label: "Individual", value: "individual" },
        { label: "Entity", value: "entity" },
    ];

    const source = [
        { label: "AadharCard", value: "aadhaar" },
        { label: "PandCard", value: "pancard" },
        { label: "VoterID", value: "voterid" },
        { label: "Passport", value: "passport" },
    ];
    const [type, setType] = useState("")
    const [kycType, setkycType] = useState("")

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            isscollable={true}
            headertitle={"KYC Verification"}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={[style.container]}>
                <Text size={"medium"}>Verification</Text>
                <View style={{ marginTop: '10%' }}>
                    <Dropdown
                        list={dropdownData}
                        label="KYC Type"
                        value={kycType}
                        onChange={(value) => {
                            setkycType(value?.value)
                        }}
                    />
                    <Dropdown
                        list={source}
                        label="ID Type"
                        value={type}
                        onChange={(value) => setType(value?.value)}
                    />
                    <Button
                        title="Continue"
                        buttonStyle={{ width: "40%", marginTop: "5%", borderRadius: 30 }}
                        onPress={() => {
                            const payload = {
                                type,
                                kycType
                            }
                            dispatch(setKycparms(payload))
                            navigation.navigate("KYCPicture")
                        }}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>
            </View>
        </Mainview>
    )

}

export default KYCVerification;