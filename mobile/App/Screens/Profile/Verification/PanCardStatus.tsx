import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import LottieView from "lottie-react-native";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import useApiError from "../../../Actions/Hooks/errorhook";
import { Button, FileUpload } from "../../../Components/Field";
import { toBase64UploadBody } from "../../../Utilities/fileToBase64";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import Images, { icons, Lotties } from "../../../Utilities/images";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { setPanDetails, usePanCardCreateMutation } from "../../../Slices/auth";

import { styles } from "../styles";
import { useSelector } from "react-redux";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'PanCardStatus'>;

const PanCardStatus: React.FC<Props> = () => {
    const { theme, navigation, failuretoast, successtoast, dispatch } = useCustomHooks();
    const style = styles(theme);
    const { kycPanCardStatus } = useSelector((state: any) => state.auth.userData);
    const [frontImage, setFrontImage] = useState<any>(undefined);
    const [isSubmit, setIsSubmit] = useState<boolean>(false);

    const renderItem = () => {
        return (
            <View style={{
                width: "100%",
                backgroundColor: theme.card,
                paddingHorizontal: 20,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                height: windowheight * 0.050
            }}>
                <Text size="semimedium" >   {frontImage ? "Retake Photo" : "Upload"}</Text>
            </View>
        )
    }

    const [panCardCreate, { isLoading, error }] = usePanCardCreateMutation();

    useApiError(error);

    const handleSubmit = async () => {
        setIsSubmit(true)
        const body = await toBase64UploadBody({
            files: frontImage,
            kycType: "individual",
            type: "pan",
        });
        const response = await panCardCreate(body).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            navigation.navigate("PanDetails")
            dispatch(setPanDetails(response?.result?.data));
            setIsSubmit(false)
        } else {
            failuretoast(response?.message ?? "Something went wrong. Please try again.")
            setIsSubmit(false)
        }
    }

    useEffect(() => {
        if (kycPanCardStatus == 'approved' && !isSubmit) {
            navigation.navigate("PanDetails")
        }
    }, [kycPanCardStatus])

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"PAN card"}
            isscollable={true}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <>
                    {
                        frontImage && (
                            <Button
                                title="Use This Photo"
                                loading={isLoading}
                                buttonStyle={{ marginBottom: "5%" }}
                                onPress={handleSubmit}
                                textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                            />
                        )
                    }
                    <FileUpload
                        source="sheet"
                        mediaData={frontImage}
                        component={renderItem()}
                        onChange={(data) => {
                            setFrontImage(data);
                        }}
                        background={theme.theme === "dark" ? "#16181A" : Colors.white}
                        preview={false}
                    />
                </>
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >
            <View style={style.container}>
                <Text size="medium">PAN Card front side Caputre Tips</Text>
                <Text color={theme.secondarytext} style={{ marginBottom: "5%" }}>Ensure a clear picture of PAN Card to get approved faster.</Text>
                {
                    frontImage ?
                        <>
                            {
                                isLoading ?
                                    <View style={{ width: "100%", height: windowheight * 0.3, borderRadius: 10, overflow: "hidden" }} >
                                        <Images type="image" source={icons.PAN} style={{ width: "100%", height: windowheight * 0.3, resizeMode: "cover", borderRadius: 10 }} />
                                        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                                            <Loadercomponent color={Colors.white} containerstyle={{ flex: 0 }} />
                                            <Text size="medium" family="bold" style={{ color: "#fff", marginTop: 10 }}>Checking your PAN Card</Text>
                                        </View>
                                    </View>
                                    : <Images
                                        type="image"
                                        source={{ uri: frontImage?.uri }}
                                        style={{ width: "100%", height: windowheight * 0.30, resizeMode: "cover", borderRadius: 10 }}
                                    />
                            }
                        </>
                        :
                        <LottieView
                            source={Lotties.docscanning}
                            autoPlay
                            style={{ width: windowwidth, height: windowwidth * 0.65, alignSelf: "center", marginTop: "5%" }}
                        />
                }
            </View>
        </Mainview>
    )

}

export default PanCardStatus;