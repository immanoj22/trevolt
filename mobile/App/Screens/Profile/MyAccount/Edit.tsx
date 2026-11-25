import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import Confirm from "../Security/Helpers/Confirm";
import Mainview from "../../../Components/mainview";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import { getProfileImageUrl, isEmpty, maskEmail, maskMobile } from "../../../Utilities/helerfunction";
import { toBase64UploadBody } from "../../../Utilities/fileToBase64";
import { Button, FileUpload } from "../../../Components/Field";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { useUpdateSettingsMutation } from "../../../Slices/auth";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AccountEdit'>;

const AccountEdit: React.FC<Props> = () => {
    // const { triggeruserdetails } = useApihooks();
    const { theme, navigation, successtoast, failuretoast, copyData, bottomsheetref, openbottomsheet, closebottomsheet, dispatch } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);
    const bottomref = useRef<BottomSheetModal>(null);
    const dispatchRef = useRef<any>(dispatch);
    const { email, referralCode, profileImage, firstName, lastName, mobileNumber, countryCode, userGreenId, userName } = useSelector((state: any) => state.auth.userData);
    const [frontImage, setFrontImage] = useState<{ uri: string, fileName: string } | false | undefined>();

    // Two separate instances of the same mutation on purpose. RTK Query scopes
    // isLoading/error per hook instance, so the upload and the remove each get
    // their own. They used to share ONE instance, and `loading` was wired only to
    // the Remove button - so picking a new image (which calls update() from
    // handleSubmit) lit the spinner on Remove instead of on the control the user
    // had actually just tapped.
    const [update, { error, isLoading: isUploading }] = useUpdateSettingsMutation();
    const [removeUpdate, { error: removeError, isLoading: isRemoving }] = useUpdateSettingsMutation();

    useApiError(error ?? removeError ?? false);

    const handleSubmit = async (type: any) => {
        if (!frontImage) return;
        // Guarded like removeProfile: this runs from a useEffect that doesn't await
        // it, so a rejected upload would otherwise surface as an unhandled promise
        // rejection. useApiError(error) already shows the message to the user.
        try {
            const body = await toBase64UploadBody({
                attachment: frontImage,
                type: "profile",
                profilestatus: type,
            });
            const response = await update(body).unwrap();
            if (response.success) {
                successtoast("Success", response.message)
                await triggeruserdetails();
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (e) {
            console.log("handleSubmit__Err", e)
        }
    }


    // dispatch(setUserData({
    //     ...data,
    //     favStradegies: currentFavs ?? data.favStradegies,
    // }));

    const removeProfile = async () => {
        try {
            const response = await removeUpdate({ type: "profile", profilestatus: "remove" }).unwrap();
            if (response.success) {
                successtoast("Success", response.message)
                await triggeruserdetails();
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (e) {
            console.log("removeProfile__Err", e)
        }
    }

    useEffect(() => {
        if (frontImage) {
            handleSubmit("add")
        }
         {console.log("profileImage",getProfileImageUrl(profileImage))}
    }, [frontImage])

    

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            isscollable={true}
            headertitle={"Profile Settings"}
            scrollprops={{
                contentContainerStyle: {
                    flexGrow: 1
                }
            }}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View>
                        {
                            profileImage ?
                        
                                <Images
                                    type="image"
                                    source={{ uri: getProfileImageUrl(profileImage) }}
                                    // source={{uri:"http://localhost:2002/profile/b09a8937-6fac-4a1d-8424-9defb388e9a7.jpg"}}
                                    width={windowwidth * 0.18}
                                    height={windowwidth * 0.18}
                                    style={{ borderRadius: 100, }}
                                    resizeMode="cover"
                                />
                                :
                                <Images
                                    type="svg"
                                    name={theme.theme == "dark" ? "DarkUser" : "EmptyUser"}
                                    width={windowwidth * 0.18}
                                    height={windowwidth * 0.18}
                                />
                        }
                    </View>
                    <View style={profileImage && { marginRight: -50 }}>
                        <FileUpload
                            source="sheet"
                            mediaData={frontImage}
                            preview={false}
                            component={
                                <Card backgroundColor={Colors.brand} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={style.card}>
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color={theme.theme == 'dark' ? "#000" : "#ffff"} />
                                    ) : (
                                        <Text style={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? "#000" : "#ffff" }}>{profileImage ? "Change" : "Add Profile"}</Text>
                                    )}
                                </Card>
                            }
                            onChange={(data) => {
                                setFrontImage(data);
                            }}

                        />
                    </View>
                    {
                        profileImage && (
                            <Button
                                title="Remove"
                                onPress={() => removeProfile()}
                                buttonStyle={style.changes}
                                loading={isRemoving}
                                textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        )
                    }
                </View>

                <View style={[style.between, { marginTop: '8%' }]}>
                    <View>
                        <Text style={{ color: theme.secondarytext }}>User ID</Text>
                        <Text style={{ marginTop: "5%" }}>{userGreenId}</Text>
                    </View>
                </View>

                <View style={[style.between, { marginTop: '8%' }]}>
                    <View>
                        <Text style={{ color: theme.secondarytext }}>Display Name</Text>
                        <Text style={{ marginTop: "5%" }}>{userName}</Text>
                    </View>
                    <Button
                        title="Change"
                        onPress={() => navigation.navigate("DisplayName")}
                        buttonStyle={style.changes}
                        textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>

                <View style={[style.between, { marginTop: '8%' }]}>
                    <View>
                        <Text style={{ color: theme.secondarytext }}>First Name - Last Name</Text>
                        <Text style={{ marginTop: "5%" }}>{firstName}-{lastName}</Text>
                    </View>
                    <Button
                        title="Change"
                        onPress={() => navigation.navigate("UpdateName")}
                        buttonStyle={style.changes}
                        textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>

                <View style={[style.between, { marginTop: '8%' }]}>
                    <View style={{ width: "70%" }}>
                        <Text style={{ color: theme.secondarytext }}>Email Address</Text>
                        <Text style={{ marginTop: "5%" }} numoflines={1}>{isEmpty(email) ? email : maskEmail(email)}</Text>
                    </View>
                    <Button
                        title="Change"
                        onPress={() => openbottomsheet(bottomsheetref)}
                        buttonStyle={style.changes}
                        textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>

                <View style={[style.between, { marginTop: '8%' }]}>
                    <View>
                        <Text style={{ color: theme.secondarytext }}>Referral Code</Text>
                        <Text style={{ marginTop: "5%" }}>{referralCode}</Text>
                    </View>
                    <Button
                        title="Copy"
                        onPress={() => copyData(referralCode)}
                        buttonStyle={style.changes}
                        textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>

                <View style={[style.between, { marginTop: '8%' }]}>
                    <View>
                        <Text style={{ color: theme.secondarytext }}>Login password</Text>
                        <Text style={{ marginTop: "5%" }}>*************</Text>
                    </View>
                    <Button
                        title="Change"
                        onPress={() => navigation.navigate("UpdatePassword")}
                        buttonStyle={style.changes}
                        textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>

                {
                    mobileNumber ? (
                        <View style={[style.between, { marginTop: '8%' }]}>
                            <View>
                                <Text style={{ color: theme.secondarytext }}>Mobile number</Text>
                                <Text style={{ marginTop: "5%" }}>+{countryCode} {maskMobile(mobileNumber)}</Text>
                            </View>
                            <Button
                                title="Change"
                                onPress={() => { openbottomsheet(bottomref) }}
                                buttonStyle={style.changes}
                                textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </View>
                    ) : (
                        <View style={[style.between, { marginTop: '8%' }]}>
                            <View>
                                <Text style={{ color: theme.secondarytext }}>Registered mobile number</Text>
                            </View>
                            <Button
                                title="Add"
                                onPress={() => { navigation.navigate("RegisterNumber") }}
                                buttonStyle={style.changes}
                                textStyle={{ fontSize: Fontsize.small, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </View>
                    )
                }
            </View>

            <Confirm
                ref={bottomsheetref}
                title={"Are you sure want to change your email address?"}
                description={"withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email."}
                cancel={() => closebottomsheet(bottomsheetref)}
                confirm={() => { navigation.navigate("UpdateEmail"), closebottomsheet(bottomsheetref) }}
            />

            <Confirm
                ref={bottomref}
                title={"Are you sure want to change your phone number?"}
                description={"withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email."}
                cancel={() => closebottomsheet(bottomref)}
                confirm={() => {
                    // handleChangePhone()
                    navigation.navigate("ChangeNumber")
                    closebottomsheet(bottomref)
                }}
            />
        </Mainview>
    )

}

export default AccountEdit;