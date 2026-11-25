import React, { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import SwitchToggle from "react-native-switch-toggle";
import { useSelector } from "react-redux";
import { EventRegister } from "react-native-event-listeners";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import messaging from '@react-native-firebase/messaging';

import ListItem from "./ListItem";
import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { logoutAction, store } from "../../Slices";
import { useLazyLogoutQuery } from "../../Slices/auth";
import VectorIcons from "../../Utilities/vectoricons";
import { windowwidth } from "../../Utilities/dimensions";
import WebviewModal from "../../Components/DialogBox/Web";
import { SUPPORTURL } from "../../Actions/Constant/constant";
import Images, { icons, image } from "../../Utilities/images";
import { getItem, setItem } from "../../Actions/Storage/localstorage";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks, { Commonalert } from "../../Actions/Hooks/customhook";

import { styles } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Profile'>;

const Profile: React.FC<Props> = () => {
    const { theme, navigation, cleardata, failuretoast } = useCustomHooks();
    const style = styles(theme);
    const mobiletheme = getItem("mobiletheme")
    const { status } = useSelector((state: any) => state.auth.affiliateData);
    const { kycStatus } = useSelector((state: any) => state.auth.userData);
    const { fcmtoken } = useSelector((state: any) => state.auth.deviceinfo ?? {});

    const [isEnabled, setIsEnabled] = useState(mobiletheme == "light" ? true : false);

    const onthemechange = () => {
        setIsEnabled(!isEnabled)
        setItem("mobiletheme", isEnabled ? "dark" : "light")
        EventRegister.emit("mobiletheme", isEnabled ? "dark" : "light")
    }

    const [triggerLogout] = useLazyLogoutQuery();

    const logoutfn = async () => {
        try {
            // Must run before cleardata() clears the token - the backend marks
            // *this* session's loginHistory entry inactive by matching the
            // Authorization header. Without this the server still thinks the
            // session is active, so it stays a valid token, keeps counting as
            // an active session (which is what the new-device login alert is
            // keyed off), and this device keeps receiving pushes.
            // fcmtoken (this device's push token) tells the backend to drop just
            // this device's entry from deviceTokens, so this logout doesn't stop
            // pushes on any other device the account is still signed into.
            await triggerLogout(fcmtoken).unwrap();
        } catch (error) {
            console.log("logout_api__err", error)
            // The server-side deviceTokens removal above didn't happen (network
            // drop, timeout, backend error) - cleardata() below still has to run
            // regardless so the user isn't stuck unable to log out, but that would
            // leave this device's fcmtoken registered on the backend indefinitely,
            // still receiving pushes for an account this device is no longer
            // signed into. deleteToken() invalidates the token at the FCM layer
            // itself: the backend's own next send to it fails with
            // registration-token-not-registered, which its existing invalidTokens
            // cleanup (notificationHook.js) prunes - so this device stops
            // receiving pushes even though the removal call never reached the server.
            try {
                await messaging().deleteToken();
            } catch (deleteErr) {
                console.log("logout_deleteToken_err", deleteErr)
            }
        }
        cleardata();
        store.dispatch(logoutAction());
        try {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
        } catch (error) {
            console.log("googleSignOut_err", error)
        }
    }

    const [support, setSupport] = useState(false);

    return (
        <Mainview
            isheader={false}
            isscollable={true}
            iskeyboardaware={false}
            gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#1438185d", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            customheader={
                <View style={style.headerContainer}>
                    <Pressable style={style.leftContent} onPress={() => navigation.goBack()}>
                        <VectorIcons
                            family="Ionicons"
                            name="chevron-back"
                        />
                    </Pressable>
                    <Text style={style.header}>Profile</Text>
                    <Pressable style={style.rightContent} onPress={() => Commonalert({
                        title: "Logout!",
                        des: "Are you sure want to logout",
                        yes: () => logoutfn()
                    })}>
                        <View style={{ width: windowwidth * 0.1, height: windowwidth * 0.1, borderRadius: 100, backgroundColor: theme.iconBgColor, alignItems: "center", justifyContent: "center" }}>
                            <Images
                                type="svg"
                                name="Logout"
                                width={windowwidth * 0.04}
                                height={windowwidth * 0.04}
                            />
                        </View>
                    </Pressable>
                </View>
            }>
            <View style={style.container}>
                <ListItem icon={theme.theme == 'dark' ? icons.MyAccount : icons.MyAccountLight} title="My Account" onPress={() => navigation.navigate("MyAccount")} />
                <ListItem
                    icon={theme.theme == 'dark' ? icons.Theme : icons.ThemeLight}
                    onPress={() => onthemechange()}
                    title="Theme"
                    rightContent={
                        <View style={style.buttonDark}>
                            <SwitchToggle
                                switchOn={isEnabled}
                                onPress={() => onthemechange()}
                                backgroundColorOn={theme.theme == "dark" ? "#0a0c10" : Colors.white}
                                backgroundColorOff={theme.theme == "dark" ? "#0a0c10" : Colors.white}
                                circleColorOn={theme.theme == "dark" ? "#0a0c10" : Colors.white}
                                circleColorOff={theme.theme == "dark" ? "#0a0c10" : Colors.white}
                                containerStyle={style.circleContainer}
                                circleStyle={style.circle}
                            />
                            <View style={style.icon} >
                                <VectorIcons
                                    family="Feather"
                                    name="sun"
                                    size={15}
                                    iconcolor={isEnabled ? "#3B82F6" : "#535962"}
                                />
                            </View>
                            <View style={style.iconRight}>
                                <VectorIcons
                                    family="Feather"
                                    name="moon"
                                    size={15}
                                    iconcolor={!isEnabled ? "#3B82F6" : "#535962"}
                                />
                            </View>
                        </View>
                    }
                />

                <ListItem icon={theme.theme == 'dark' ? icons.Verification : icons.VerificationLight} title="Verification" onPress={() => navigation.navigate("Verification")} />

                <ListItem icon={theme.theme == 'dark' ? icons.BankDetails : icons.BankDetailsLight} title="Bank Details" onPress={() => navigation.navigate("BankDetails")} />

                <ListItem icon={theme.theme == 'dark' ? icons.PreferenceSide : icons.PreferenceSideLight} title="Preference" onPress={() => navigation.navigate("Preference")} />

                <ListItem icon={theme.theme == 'dark' ? icons.SubAccountSide : icons.SubAccountSideLight} title="Sub Accounts" onPress={() => navigation.navigate("SubAccount", { pageName: "subacc" })} />

                <ListItem icon={theme.theme == 'dark' ? icons.SecuritySide : icons.SecuritySideLight} title="Security" onPress={() => navigation.navigate("Security")} />

                <ListItem icon={theme.theme == 'dark' ? icons.ReferSide : icons.ReferSideLight} title="Refer & Earn" onPress={() => navigation.navigate("Referaldashboard")} />

                <ListItem icon={theme.theme == 'dark' ? icons.AffiliateSide : icons.AffiliateSideLight} title="Affiliate" onPress={() => {
                    // Affiliate isn't available for this release yet - Overview always
                    // renders the ComingSoon placeholder regardless of kyc/status now, so
                    // just go there directly instead of branching into KYC/approval
                    // toasts or the separate AffiliateRegister screen for a feature
                    // that's not live. Restore the original kycStatus/status branching
                    // below (still intact, just unreachable) to re-enable:
                    // if (kycStatus !== 'approved') {
                    //     failuretoast("Error!", "Please complete your KYC details")
                    // }
                    // else if (status === "approved") {
                    //     navigation.navigate('Overview');
                    // }
                    // else if (status === "pending") {
                    //     failuretoast("Error!", "Please wait for admin approval")
                    // } else {
                    //     navigation.navigate('AffiliateRegister');
                    // }
                    navigation.navigate('Overview');
                }} />

                <ListItem icon={theme.theme == 'dark' ? icons.Transaction : icons.TransactionLight} title="Transaction logs" onPress={() => navigation.navigate("TransactionLogs")} />

                <ListItem icon={theme.theme == 'dark' ? icons.AlgoTrading : icons.AlgoTradingLight} title="Algo Trading" onPress={() => navigation.navigate("CreateWebhook")} />

                <ListItem icon={theme.theme == 'dark' ? icons.Pnl : icons.PnlLight} title="PNL Analytics" onPress={() => navigation.navigate("PnlAnalytics")} />

                <ListItem icon={theme.theme == 'dark' ? icons.ExportSide : icons.ExportSideLight} title="Export" onPress={() => navigation.navigate("ExportData", { type: "" })} />

                <ListItem icon={theme.theme == 'dark' ? icons.Api : icons.ApiLight} title="API Keys" onPress={() => navigation.navigate("APIKeys")} />

                <ListItem icon={theme.theme == 'dark' ? icons.Support : icons.SupportLight} title="Support" onPress={() => setSupport(true)} />

                <ListItem icon={theme.theme == 'dark' ? icons.Features : icons.FeaturesLight} title="Features" onPress={() => navigation.navigate("Features")} />
            </View>
            {
                support && (
                    <WebviewModal
                        title="Support"
                        url={SUPPORTURL}
                        onCloseHandler={() => setSupport(false)}
                    />
                )
            }
        </Mainview>
    )

}

export default Profile;