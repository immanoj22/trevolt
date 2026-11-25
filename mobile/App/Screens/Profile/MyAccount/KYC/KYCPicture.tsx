import React, { useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../../../Components/text";
import Card from "../../../../Components/Card";
import Mainview from "../../../../Components/mainview";
import { helperSelector } from "../../../../Slices/helper";
import VectorIcons from "../../../../Utilities/vectoricons";
import useApiError from "../../../../Actions/Hooks/errorhook";
import { useInternalkycMutation } from "../../../../Slices/auth";
import { Button, FileUpload } from "../../../../Components/Field";
import { toBase64UploadBody } from "../../../../Utilities/fileToBase64";
import { Stacknavigationtypes } from "../../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../../Actions/Hooks/customhook";

import { styles } from "../../styles";
import { Colors } from "../../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'KYCPicture'>;

const KYCPicture: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);

    const [frontImage, setFrontImage] = useState<any>(undefined);
    const [backImage, setBackImage] = useState<any>(undefined);

    const { kycparms } = useSelector(helperSelector)

    const renderItem = () => {
        return (
            <Card containerStyle={{ justifyContent: "center", alignItems: "center", paddingVertical: "20%", marginBottom: "5%" }}>
                <View style={{ alignItems: "center" }}>
                    <VectorIcons
                        family="Feather"
                        name={"upload"}
                        size={20}
                    />
                    <Text size="semimedium">Upload</Text>
                </View>
            </Card>
        )
    }

    const [internalkyc, { isLoading, error }] = useInternalkycMutation()

    useApiError(error)
    const submit = async () => {
        const body = await toBase64UploadBody({
            attachments: [frontImage, backImage],
            type: kycparms.type,
            kycType: kycparms?.kycType,
        });
        const response = await internalkyc(body).unwrap();
        if (response.success) {
            await triggeruserdetails();
            successtoast("Success", response.message)
            navigation?.pop(2)
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }
    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            isscollable={true}
            headertitle={"Upload Address Proof"}
            onleftfn={() => navigation.goBack()}
            isoverlaploader={isLoading}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={[style.container]}>
                <View>
                    <Text style={{ color: theme.secondarytext, marginBottom: "3%" }}>Front side picuter</Text>
                    <FileUpload
                        source="sheet"
                        mediaData={frontImage}
                        component={renderItem()}
                        onChange={(data) => {
                            setFrontImage(data);
                        }}
                    />
                    <Text style={{ color: theme.secondarytext, marginBottom: "3%" }}>Back side picture</Text>
                    <FileUpload
                        source="sheet"
                        mediaData={backImage}
                        component={renderItem()}
                        onChange={(data) => {
                            setBackImage(data);
                        }}
                    />
                    <Button
                        title="Continue"
                        buttonStyle={{ width: "40%", marginTop: "5%", borderRadius: 30 }}
                        onPress={() => submit()}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>
            </View>
        </Mainview>
    )

}

export default KYCPicture;