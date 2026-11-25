import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import Images, { icons } from "../../../Utilities/images";
import Flexcomponent from "../../../Components/flexcomponent";
import { capitalizeFirst, openLink } from "../../../Utilities/helerfunction";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { setPhoneparams } from "../../../Slices/helper";
import { setUserData, useCashfreekycMutation, useLazyCashfreestatusQuery, useLazyUserDetailsQuery } from "../../../Slices/auth";

import KYCSuccessModal from "./Modal";

import { styles } from "../styles";
import VectorIcons from "../../../Utilities/vectoricons";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Verification'>;

const Verification: React.FC<Props> = ({ route }) => {
    const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();
    const style = styles(theme);
    const { kycMobileStatus, kycLiveNessStatus, kycPanCardStatus, kycAadharStatus, kycfinancialStatus, kycStatus, externalKycStatus } = useSelector((state: any) => state.auth.userData);
    console.log("[Verification] kyc statuses", {
        kycMobileStatus,
        kycAadharStatus,
        kycPanCardStatus,
        kycLiveNessStatus,
        kycfinancialStatus,
        kycStatus,
        externalKycStatus,
    });
    const popup = route?.params?.popup ?? false;

    const [showModal, setShowModal] = useState(popup);
    const [cashfreekyc] = useCashfreekycMutation();
    const [isVerifying, setIsVerifying] = useState(false);

    const cashfreesubmit = async () => {
        const response = await cashfreekyc(true).unwrap()
        const url = response?.result?.data?.url;
        console.log(response, "cashfreesubmit")
        if (response?.success && url) {
            await openLink(url);
            successtoast(response?.message);
        } else {
            failuretoast(response?.message || "Unable to start KYC verification. Please try again.");
        }
    }


    const normalize = (value: any) => String(value || "").toLowerCase();
    const isPendingStage = (value: any) => ["pending"].includes(normalize(value));
    const isRejectedStage = (value: any) => ["rejected", "expired"].includes(normalize(value));
    const isNotVerifiedStage = (value: any) => ["notverified"].includes(normalize(value));
    // The per-stage icons below used to compare each status with strict `===
    // "approved"` - a genuinely verified Aadhaar/Liveness stage still shows a
    // red icon whenever the backend's raw Cashfree status doesn't land exactly
    // on the lowercase "approved" string (e.g. its case-sensitive status-code
    // lookup misses and leaves the field stale/differently-cased). Comparing
    // through the same `normalize()` used for the button text above, and also
    // accepting "authenticated" (Cashfree's own verified status, in case it
    // passes through unmapped) and "success" (a historical status value the
    // web app's Verification.jsx still explicitly checks for, alongside
    // "pending"/"rejected" - evidence it's a real value this system can
    // produce), makes the icon resilient to that instead of quietly showing
    // "verified" as "rejected".
    const isApprovedStage = (value: any) => ["approved", "authenticated", "success"].includes(normalize(value));

    // The button label used to scan "is ANY of the 5 stages pending/rejected/
    // notVerified" while handleVerifyNow below always acts on the FIRST
    // unapproved stage in phone -> aadhaar -> pan -> liveness -> financial
    // order. Those two could disagree - e.g. phone notVerified + aadhaar
    // pending showed "Pending" even though tapping it actually opens phone
    // registration. Computing the next actionable stage once and deriving
    // both the label and the action from it keeps them in sync.
    const nextStep: "mobile" | "aadhar" | "pan" | "liveness" | "financial" | null =
        !isApprovedStage(kycMobileStatus) ? "mobile"
            : !isApprovedStage(kycAadharStatus) ? "aadhar"
                : !isApprovedStage(kycPanCardStatus) ? "pan"
                    : !isApprovedStage(kycLiveNessStatus) ? "liveness"
                        : !isApprovedStage(kycfinancialStatus) ? "financial"
                            : null;

    const nextStepStatus = nextStep === "mobile" ? kycMobileStatus
        : nextStep === "aadhar" ? kycAadharStatus
            : nextStep === "pan" ? kycPanCardStatus
                : nextStep === "liveness" ? kycLiveNessStatus
                    : nextStep === "financial" ? kycfinancialStatus
                        : "approved";

    // A "pending" stage no longer disables the button - handleVerifyNow's per-step
    // chain below only checks `!== "approved"`, so tapping it while a step is pending
    // still re-checks/re-opens that exact step (e.g. re-fetches Aadhaar's Cashfree
    // status, or navigates to PanCardStatus/Selfie/AdditionalDetails to show/resubmit)
    // instead of just sitting blocked until the status changes on its own.
    const isVerifyDisabled = false;
    const verifyBtnText = isPendingStage(nextStepStatus)
        ? "Pending"
        : isRejectedStage(nextStepStatus)
            ? "Resubmit"
            : isNotVerifiedStage(nextStepStatus)
                ? "Verify"
                : "Approved";

    const [cashfreestatus] = useLazyCashfreestatusQuery()
    const [fetchUserDetails] = useLazyUserDetailsQuery();

    // `cashfreestatus` only refreshes Aadhaar's own Cashfree-side status (used
    // inside fetchCashfree() below) - it never touches `state.auth.userData`,
    // which is what kycMobileStatus/kycAadharStatus/kycPanCardStatus/
    // kycLiveNessStatus/kycfinancialStatus actually come from. Without this,
    // this screen kept showing whatever KYC state was cached since login,
    // looking identical to a real rejection until something else happened to
    // refetch userData.
    const refreshKycData = useCallback(() => {
        cashfreestatus(true);
        (async () => {
            const res = await fetchUserDetails(true);
            if (res?.data?.result?.data) {
                dispatch(setUserData(res.data.result.data));
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshKycData();
        }, [refreshKycData])
    );

    // Covers the actual "open the KYC link, verify, come back" flow: `openLink`
    // sends the app to the background and opens the system browser as a
    // separate app - this screen never loses navigation focus (it's still the
    // active route the whole time), so useFocusEffect above never fires again
    // on return. Only an AppState transition back to "active" actually
    // signals the user came back from the browser.
    const appState = useRef(AppState.currentState);
    useEffect(() => {
        const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextState === "active") {
                refreshKycData();
            }
            appState.current = nextState;
        });
        return () => sub.remove();
    }, [refreshKycData]);

    const fetchCashfree = async () => {
        const response = await cashfreestatus(true).unwrap()
        console.log(response, "fetchCashfree")
        if (response?.success) {
            return response?.result?.data
        }
        return {}
    }

    const handleVerifyNow = async () => {
        if (isVerifyDisabled || !nextStep) return;
        setIsVerifying(true);
        try {
            switch (nextStep) {
                case "mobile":
                    // RegisterNumber only sends an OTP when phoneparams.type is "add"
                    // (it no-ops otherwise) - set it explicitly instead of relying on
                    // it still being the untouched initial redux value.
                    dispatch(setPhoneparams({ type: "add", values: "" }));
                    navigation.navigate("RegisterNumber");
                    break;

                case "aadhar":
                    // Refresh the live Cashfree status before resubmitting - the
                    // stale check this used to do here (`status === "expired" ||
                    // !isApprovedStage(kycAadharStatus)`) was always true inside
                    // this branch anyway, since kycAadharStatus is guaranteed
                    // un-approved to have reached "aadhar" as the next step.
                    await fetchCashfree();
                    await cashfreesubmit();
                    break;

                case "pan":
                    navigation.navigate("PanCardStatus");
                    break;

                case "liveness":
                    navigation.navigate("Selfie");
                    break;

                case "financial":
                    navigation.navigate("AdditionalDetails");
                    break;
            }
        } catch (error: any) {
            if (error?.data?.errors) {
                failuretoast("Error", Object.values(error.data.errors)[0] as string);
            } else {
                failuretoast("Error", error?.data?.message || "Something went wrong. Please try again.");
            }
        } finally {
            setIsVerifying(false);
        }
    };
    console.log("[Verification] isVerifyDisabled",kycMobileStatus, kycAadharStatus, kycPanCardStatus, kycLiveNessStatus, kycfinancialStatus, kycStatus, externalKycStatus);
    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"KYC Verification"}
            isscollable={true}
            // onleftfn={() => navigation.navigate("Dashboard")}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <>
                    {
                        kycStatus !== "approved" && (
                            <Button
                                title={verifyBtnText}
                                onPress={handleVerifyNow}
                                loading={isVerifying}
                                disabled={isVerifyDisabled}
                                textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                            />
                        )
                    }
                </>
            }
            isrefereshcontrol={true}
            onreload={() => {
                cashfreestatus(true)
            }}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                <Text size="semilarge" style={{ marginBottom: "5%" }} color={theme.secondarytext}>Requirements</Text>
                <Flexcomponent justifyContent="space-between" top={"2%"}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
                                borderRadius: 25,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Images
                                type="svg"
                                name= { theme.theme == 'dark' ? "TelephoneIcon" : "TelephoneIconLight"}
                                width={18}
                                height={18}
                            />
                        </View>
                        <Text size="medium">   Phone Verification</Text>
                    </View>
                    {
                        isApprovedStage(kycMobileStatus) ? (
                            <Images
                                type="image"
                                source={icons.Group}
                                width={18}
                                height={18}
                            />
                        ) : (
                            <VectorIcons
                                family="MaterialDesignIcons"
                                name="alert-decagram"
                                size={20}
                                iconcolor={isPendingStage(kycMobileStatus) ? Colors.red : isNotVerifiedStage(kycMobileStatus) ? Colors.red : Colors.red}
                            />
                        )
                    }
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" top={"8%"}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
                                borderRadius: 25,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Images
                                type="svg"
                                name= { theme.theme == 'dark' ?  "IdCardIcon" : "IdCardIconLight" }
                                width={20}
                                height={20}
                            />
                        </View>
                        <Text size="medium">   Aadhar Card 
                             {/* {(kycAadharStatus === "pending" || kycAadharStatus === "expired") && (<Text color={Colors.red} size="small">{capitalizeFirst(kycAadharStatus)}</Text>)} */}
                              </Text>
                    </View>
                    {
                        isApprovedStage(kycAadharStatus) ? (
                            <Images
                                type="image"
                                source={icons.Group}
                                width={18}
                                height={18}
                            />
                        ) : (
                            <VectorIcons
                                family="MaterialDesignIcons"
                                name="alert-decagram"
                                size={20}
                                iconcolor={isPendingStage(kycAadharStatus) ? Colors.red : isNotVerifiedStage(kycAadharStatus) ? Colors.red : Colors.red}
                            />
                        )
                    }
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" top={"8%"}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
                                borderRadius: 25,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Images
                                type="svg"
                                name= {theme.theme == 'dark' ? "IdentityIcon" : "IdentityIconLight"}
                                width={18}
                                height={18}
                            />
                        </View>
                        <Text size="medium">   PAN Card</Text>
                    </View>
                    {
                        isApprovedStage(kycPanCardStatus) ? (
                            <Images
                                type="image"
                                source={icons.Group}
                                width={18}
                                height={18}
                            />
                        ) : (
                            <VectorIcons
                                family="MaterialDesignIcons"
                                name="alert-decagram"
                                size={20}
                                iconcolor={isPendingStage(kycPanCardStatus) ? Colors.red : isNotVerifiedStage(kycPanCardStatus) ? Colors.red: Colors.red}
                            />
                        )
                    }
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" top={"8%"}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
                                borderRadius: 25,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Images
                                type="svg"
                                name= { theme.theme == 'dark' ? "SelfieIcon" : "SelfieIconLight" }
                                width={18}
                                height={18}
                            />
                        </View>
                        <Text size="medium">   Selfie Verification</Text>
                    </View>
                    {
                        isApprovedStage(kycLiveNessStatus) ? (
                            <Images
                                type="image"
                                source={icons.Group}
                                width={18}
                                height={18}
                            />
                        ) : (
                            <VectorIcons
                                family="MaterialDesignIcons"
                                name="alert-decagram"
                                size={20}
                                iconcolor={isPendingStage(kycLiveNessStatus) ? Colors.red : isNotVerifiedStage(kycLiveNessStatus) ?  Colors.red: Colors.red}
                            />
                        )
                    }
                </Flexcomponent>
            </View>
            <KYCSuccessModal
                visible={showModal}
                onClose={() => setShowModal(false)}
            />
        </Mainview>
    )

}

export default Verification;