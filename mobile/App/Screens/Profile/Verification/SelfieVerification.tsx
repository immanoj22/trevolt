import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import LottieView from "lottie-react-native";

import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import useApiError from "../../../Actions/Hooks/errorhook";
import Images, { Lotties } from "../../../Utilities/images";
import { delay } from "../../../Actions/Constant/encryption";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { toBase64UploadBody } from "../../../Utilities/fileToBase64";
import { useCheckFaceLivenessMutation } from "../../../Slices/auth";
import { borderradius, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";
import { useSelector } from "react-redux";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Selfie'>;

const Selfie: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);
    const { kycLiveNessStatus } = useSelector((state: any) => state.auth.userData);
    const { hasPermission, requestPermission } = useCameraPermission()
    const device = useCameraDevice("front");

    useEffect(() => {
        requestPermission()
    }, [])

    const camera = useRef<any>(null)

    const [picture, setPicture] = useState<any>("");
    const [isSubmit, setIsSubmit] = useState<boolean>(false);

    const [checkFaceLive, { isLoading, error }] = useCheckFaceLivenessMutation();

    useApiError(error);

    const [capture, setCapture] = useState(true);

    const handleSubmit = async () => {
        setIsSubmit(true)
        const filePath = Platform.OS === "android" ? `file://${picture.path}` : picture.path;
        const body = await toBase64UploadBody({
            image: { uri: filePath, fileName: `selfie_${Date.now()}.jpg` },
            kycType: "individual",
            type: "pan",
        });
        const response = await checkFaceLive(body).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            navigation.navigate("AdditionalDetails")
            setIsSubmit(false)
        } else {
            failuretoast(response?.message ?? "Something went wrong. Please try again.")
            setIsSubmit(false)
        }
    }

    useEffect(() => {
        if (kycLiveNessStatus == 'approved' && !isSubmit) {
            navigation.navigate("AdditionalDetails")
        }
    }, [kycLiveNessStatus])

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"Selfie Verification"}
            isscollable={true}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <>
                    {
                        capture ? (
                            <Button
                                title="Proceed to Capture"
                                onPress={() => setCapture(false)}
                                textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                            />
                        ) : (
                            <>
                                {
                                    picture ? (
                                        <>
                                            <Button
                                                title="Use This Photo"
                                                loading={isLoading}
                                                onPress={handleSubmit}
                                                textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                            />
                                            <Button
                                                title="Retake Photo"
                                                onPress={() => { setPicture("") }}
                                                buttonStyle={{ marginTop: '5%', backgroundColor: theme.card }}
                                                textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                            />
                                        </>
                                    ) : (
                                        <Button
                                            title="Capture photo"
                                            loading={isLoading}
                                            onPress={async () => {
                                                const photo = await camera.current.takePhoto()
                                                await delay(1000)
                                                setPicture(photo)
                                            }}
                                            textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                        />
                                    )
                                }
                            </>

                        )
                    }
                </>
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >
            <View style={style.container}>
                <Text size="medium">Take a Selfie</Text>
                <Text color={theme.secondarytext} style={{ marginBottom: "5%" }}>Please remove spectacies, had and mask. A clearly visible face will get approved faster.</Text>
                <View style={{ alignItems: "center" }}>
                    {
                        isLoading ?
                            <LottieView
                                source={Lotties.loader}
                                autoPlay
                                style={{ width: windowwidth, height: windowwidth * 0.65, alignSelf: "center", marginTop: "5%" }}
                            />
                            :
                            <>
                                {
                                    capture ? (
                                        <LottieView
                                            source={Lotties.face}
                                            autoPlay
                                            style={{ width: windowwidth, height: windowwidth * 0.65, alignSelf: "center", marginTop: "5%" }}
                                        />
                                    ) : (
                                        <View style={{ width: windowwidth * 0.52, height: windowwidth * 0.52, position: "absolute", borderRadius: borderradius * 5, justifyContent: "center", overflow: "hidden", alignItems: "center", marginTop: "5%" }} >
                                            {picture?.path ?
                                                <>
                                                    <Images
                                                        type="image"
                                                        source={{ uri: 'file://' + picture?.path }}
                                                        width={"100%"}
                                                        height={"100%"}
                                                        resizeMode="cover"
                                                    />
                                                </>
                                                :
                                                <>
                                                    {
                                                        (device && hasPermission) && (
                                                            <Camera
                                                                ref={camera}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    borderRadius: borderradius * 10
                                                                }}
                                                                device={device}
                                                                isActive={true}
                                                                preview={true}
                                                                photo={true}
                                                                isMirrored={true}

                                                            />
                                                        )
                                                    }
                                                </>
                                            }
                                        </View>
                                    )
                                }
                            </>
                    }
                </View>
            </View>
        </Mainview>
    )

}

export default Selfie;