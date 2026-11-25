import React, { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Text from "../../Components/text";
import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import Images, { image } from "../../Utilities/images";
import useApiError from "../../Actions/Hooks/errorhook";
import { Button, Input, Textarea } from "../../Components/Field";
import { useAffiliateRegisterMutation } from "../../Slices/affiliate";
import { windowheight, windowwidth } from "../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";
 
import styles from "./styles";
import VectorIcons from "../../Utilities/vectoricons";
import { Colors } from "../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AffiliateRegister'>;

const AffiliateRegister: React.FC<Props> = () => {
    const { theme, successtoast, failuretoast, navigation } = useCustomHooks();
    const style = styles(theme);
    const [activeTab, setActiveTab] = useState(1);

    const initialUserData: athuDataProps = useMemo(() => ({
        fullName: {
            value: '',
            rules: { required: true },
            messages: { required: 'Last name is required!' },
            isValid: true,
        },
        contactInformation: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'Email is required!',
                email: 'Invalid email address!!',
            },
            isValid: true,
        },
        referralCode: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'Password is required!',
            },
            isValid: true,
        },
        channelDetails: {
            value: '',
            rules: { required: true, equalTo: 'password' },
            messages: {
                required: 'Confirm password is required!', equalTo: 'Not matches with password',
            },
            isValid: true,
        },
        promotionIdeas: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'Date of birth is required'
            },
            isValid: true,
        },
        followersCount: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        tradingExperience: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        youtube: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        telegram: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        discord: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        instagram: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        twitch: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        facebook: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
        x: {
            value: '',
            rules: { required: false },
            isValid: true,
        },
    }), []);

    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [register, { isLoading, error }] = useAffiliateRegisterMutation();
    const { triggeraffiliate } = useApihooks();
    const [completedTabs, setCompletedTabs] = useState<number[]>([]);

    useApiError(error ?? false);

    const handleSubmit = async () => {
        const payload: any = {
            "placeOfResidence": "IND",
            "fullName": userData.fullName?.value,
            "contactInformation": userData.contactInformation?.value,
            "referralCode": userData.referralCode?.value,
            "channelDetails": userData.channelDetails?.value,
            "promotionIdeas": userData.promotionIdeas?.value,
            "followersCount": Number(userData.followersCount?.value) || 0,
            "tradingExperience": Number(userData.tradingExperience?.value) || 0,
            "youtube": userData.youtube?.value,
            "telegram": userData.telegram?.value,
            "discord": userData.discord?.value,
            "instagram": userData.instagram?.value,
            "twitch": userData.twitch?.value,
            "facebook": userData.facebook?.value,
            "x": userData.x?.value
        };
        const response = await register(payload).unwrap()
        if (response.success) {
            successtoast("Success", response.message);
            triggeraffiliate();
            navigation.goBack();
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    const validateTab = (tab: number): boolean => {
        if (tab === 1) {
            if (!userData?.fullName?.value?.trim())
                return failuretoast("Error!", "FullName is required"), false;

            if (!userData?.contactInformation?.value?.trim())
                return failuretoast("Error!", "Contact information is required"), false;

            if (!userData?.referralCode?.value?.trim())
                return failuretoast("Error!", "Referral code is required"), false;

            if ((userData?.referralCode?.value?.length ?? 0) < 6)
                return failuretoast("Error!", "Referral code must be more than 6 characters"), false;

            return true;
        }

        if (tab === 2) {
            // const fields = [
            //     { key: "YouTube", value: userData?.youtube?.value },
            //     { key: "X (Twitter)", value: userData?.x?.value },
            //     { key: "Telegram", value: userData?.telegram?.value },
            //     { key: "Discord", value: userData?.discord?.value },
            //     { key: "Instagram", value: userData?.instagram?.value },
            //     { key: "Twitch", value: userData?.twitch?.value },
            //     { key: "Facebook", value: userData?.facebook?.value },
            // ];
            // for (const field of fields) {
            //     if (!field.value?.trim()) {
            //         failuretoast("Error!", `${field.key} is required`);
            //         return false;
            //     }
            // }
            return true;
        }

        if (tab === 3) {
            if (!userData?.channelDetails?.value?.trim())
                return failuretoast("Error!", "Channel details is required"), false;

            if (!userData?.promotionIdeas?.value?.trim())
                return failuretoast("Error!", "Promotion ideas is required"), false;

            if (!userData?.followersCount?.value?.trim())
                return failuretoast("Error!", "Followers count is required"), false;

            if (!userData?.tradingExperience?.value?.trim())
                return failuretoast("Error!", "Trading experience is required"), false;

            return true;
        }

        return false;
    };


    useEffect(() => {
    }, [activeTab, userData]);


    useEffect(() => {
        const backAction = () => {
            if (activeTab > 1) {
                setActiveTab(prev => prev - 1);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [activeTab]);


    return (
        <Mainview
            isheader={true}
            isscollable={true}
            headertitle={"Trevolt Affiliate"}
            onleftfn={() => {
                if (activeTab > 1) {
                    setActiveTab(prev => prev - 1);
                } else {
                    navigation.goBack();
                }
            }}
            bottomContent={
                <>
                    {
                        activeTab === 1 || activeTab === 2 ? (
                            <Button
                                title="Next"
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                onPress={() => {
                                    const isValid = validateTab(activeTab);
                                    if (!isValid) return;
                                    setCompletedTabs(prev =>
                                        prev.includes(activeTab) ? prev : [...prev, activeTab]
                                    );

                                    setActiveTab(prev => prev + 1);
                                }}
                            />
                        ) : activeTab === 3 ? (
                            <Button
                                loading={isLoading}
                                title="Submit"
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                onPress={() => {
                                    const isValid = validateTab(activeTab);
                                    if (!isValid) return;
                                    handleSubmit();
                                }}
                            />
                        ) : null}
                </>
            }
            stickyHeader={<View style={style.tabContainer}>
                {[1, 2, 3].map((item) => (
                    <React.Fragment key={item}>
                        <Pressable style={[style.circle, activeTab === item && style.activeCircle, completedTabs.includes(item) && style.activeCircle]}
                        // onPress={() => setActiveTab(item)}
                        >
                            {
                                completedTabs.includes(item) ?
                                    <VectorIcons
                                        family="Feather"
                                        name="check"
                                        size={18}
                                    />
                                    :
                                    <Text style={[style.circleText, activeTab === item && style.activeText]}>{item}</Text>
                            }
                        </Pressable>
                        {item !== 3 && <View style={style.line} />}
                    </React.Fragment>
                ))}
            </View>}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                {
                    activeTab === 1 && (
                        <View style={{ marginTop: '10%' }}>
                            <Text size="medium" style={{ marginBottom: "5%" }}>Your contact information</Text>
                            <Input
                                placeHolder="Your Name"
                                value={userData.fullName?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, fullName: { ...prev.fullName, value: text } }))}
                                allowed={"text"}
                            />
                            <Input
                                placeHolder="Contact information"
                                value={userData.contactInformation?.value}
                                keyboardType="numeric"
                                onChange={(text: any) => setUserData(prev => ({ ...prev, contactInformation: { ...prev.contactInformation, value: text } }))}
                            />
                            <Input
                                label="Referral Code"
                                placeHolder="Enter Referral Code"
                                value={userData.referralCode?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, referralCode: { ...prev.referralCode, value: text } }))}
                            />
                        </View>
                    )
                }
                {
                    activeTab === 2 && (
                        <View style={{ marginTop: '10%' }}>
                            <Text size="medium" style={{ marginBottom: "5%" }}>Your Social Channels</Text>
                            <Input
                                placeHolder="Youtube channel link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Youtubes}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.youtube?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, youtube: { ...prev.youtube, value: text } }))}

                            />
                            <Input
                                placeHolder="X Profile link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Twitter}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.x?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, x: { ...prev.x, value: text } }))}
                            />
                            <Input
                                placeHolder="Telegram group link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Telegram}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.telegram?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, telegram: { ...prev.telegram, value: text } }))}
                            />
                            <Input
                                placeHolder="Discord group link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Discord}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.discord?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, discord: { ...prev.discord, value: text } }))}
                            />
                            <Input
                                placeHolder="Instagram profile link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Inta}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.instagram?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, instagram: { ...prev.instagram, value: text } }))}
                            />
                            <Input
                                placeHolder="Twich profile link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Twich}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.twitch?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, twitch: { ...prev.twitch, value: text } }))}
                            />
                            <Input
                                placeHolder="Facebook profile link"
                                leftContent={
                                    <Images
                                        type="image"
                                        source={image.Facebook}
                                        width={windowwidth * 0.070}
                                        height={windowheight * 0.070}
                                    />
                                }
                                style={{ marginLeft: -10 }}
                                value={userData.facebook?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, facebook: { ...prev.facebook, value: text } }))}
                            />
                        </View>
                    )
                }
                {
                    activeTab === 3 && (
                        <View style={{ marginTop: '10%' }}>
                            <Text size="medium" style={{ marginBottom: "5%" }}>Other Information</Text>
                            <Textarea
                                label="Channel Details"
                                value={userData.channelDetails?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, channelDetails: { ...prev.channelDetails, value: text } }))}
                            />

                            <Textarea
                                label="Promotion Ideas"
                                value={userData.promotionIdeas?.value}
                                onChange={(text: any) => setUserData(prev => ({ ...prev, promotionIdeas: { ...prev.promotionIdeas, value: text } }))}
                            />

                            <Input
                                label="Followers Count"
                                value={userData.followersCount?.value}
                                keyboardType="numeric"
                                onChange={(text: any) => setUserData(prev => ({ ...prev, followersCount: { ...prev.followersCount, value: text } }))}
                                placeHolder="Enter your followers count"
                            />
                            <Input
                                label="Trading Experience (in year)"
                                value={userData.tradingExperience?.value}
                                keyboardType="numeric"
                                placeHolder="Enter your trading experience"
                                onChange={(text: any) => setUserData(prev => ({ ...prev, tradingExperience: { ...prev.tradingExperience, value: text } }))}
                            />
                        </View>
                    )
                }
            </View>
        </Mainview>
    )

}

export default AffiliateRegister;