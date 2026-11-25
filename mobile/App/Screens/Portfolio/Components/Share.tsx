import React, { useEffect, useRef, useState } from "react";
import { View, Pressable, Platform, Linking, Alert } from "react-native";
import RNFS from "react-native-fs";
import QRCode from "react-native-qrcode-svg";
import { useSelector } from "react-redux";
import ViewShot, { captureRef } from 'react-native-view-shot';

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Colors } from "../../../Utilities/uiasset";
import Sheet from "../../../Components/bottomsheet";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { APIURL } from "../../../Actions/Constant/constant";
import { dateTimeFormat } from "../../../Utilities/dateTime";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useOgGenerateUpdatMutation } from "../../../Slices/future";
import { windowwidth, windowheight, RFvalue } from "../../../Utilities/dimensions";
import { capitalizeFirst, convertFileToBase64, isEmpty } from "../../../Utilities/helerfunction";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { styles } from "../styles";

interface ShareModalprops {
    ref?: any;
    data?: any
}

const ShareModal: React.FC<ShareModalprops> = ({ ref, data }) => {
    const { theme, closebottomsheet, copyData, successtoast, failuretoast } = useCustomHooks();
    const { referralCode } = useSelector((state: any) => state.auth.userData);
    const style = styles(theme);
    const type = parseFloat(data?.pnl) > 0 ? 'profit' : 'loss';
    // Closed positions carry a real backend-computed `roi` (leverage-adjusted,
    // see calculateROI in Trevolt-backend/Library/calculation.js). Open positions
    // (shared straight from Positions.tsx) don't have that field yet - derive the
    // same leverage-adjusted return from pnl/initialMargin instead, unless the
    // position is on portfolio (cross) margin, where a single position's margin
    // isn't a meaningful denominator on its own.
    const roe = data?.roi != null
        ? parseFloat(data.roi)
        : (data?.marginMode === 'portfolio' || !data?.initialMargin)
            ? null
            : (parseFloat(data?.pnl ?? 0) / parseFloat(data.initialMargin)) * 100;
    const [links, setLinks] = useState("")
    const contentRef = useRef<any>(null);
    const [base64Data, setBase64Data] = useState("")

    const processImageHandle = async () => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (!contentRef.current) return '';
            const uri = await captureRef(contentRef.current, {
                format: 'png',
                quality: 1.0,
                result: 'tmpfile',
            });
            return uri;
        } catch (error) {
            console.error('Error capturing view:', error);
            return '';
        }
    };

    const [futureOgGenerateUpdate, { isLoading, error, status }] = useOgGenerateUpdatMutation();

    useApiError(error)

    const onRedirectHandle = async (type: string) => {
        let redirectLnk = '';
        if (type === 'twitter') {
            redirectLnk = `https://twitter.com/intent/tweet?url=${links}`;
        } else if (type === 'facebook') {
            redirectLnk = `https://www.facebook.com/sharer/sharer.php?u=${links}`;
        } else if (type === 'whatsapp') {
            redirectLnk = `https://api.whatsapp.com/send?text=${links}`;
        } else if (type === 'telegram') {
            redirectLnk = `https://t.me/share/url?url=${links}`;
        } else if (type === 'reddit') {
            redirectLnk = `https://www.reddit.com/submit?url=${links}`;
        }

        if (redirectLnk) {
            const supported = await Linking.canOpenURL(redirectLnk);
            if (supported) {
                await Linking.openURL(redirectLnk);
            } else {
                console.warn(`Can't open URL: ${redirectLnk}`);
            }
        }
    };

    const updateOGImage = async () => {
        try {
            const buffData = await processImageHandle();
            if (!isEmpty(buffData)) {
                const base64Data = await convertFileToBase64(buffData);
                const body = {
                    buffData: base64Data,
                    pairName: data?.pairName,
                    positionSide: data?.positionSide,
                    accountId: data?.accountId,
                    entryPrice: data?.entryPrice,
                    close_price: data?.close_price,
                    referralCode: referralCode,
                    pnl_percen: data?.pnl_percen,
                    pnl: data?.pnl,
                    date: dateTimeFormat(new Date().getTime(), "DD/MM/YYYY"),
                };

                setBase64Data(base64Data)
                const response = await futureOgGenerateUpdate(body).unwrap();
                if (response.success) {
                    setLinks(response?.result?.data?.share_url)
                } else {
                    failuretoast('error')
                }
            }
        } catch (e) {
            console.log("updateOGImage_err", e);
        }
    }

    useEffect(() => {
        // ShareModal is mounted once and reused for every position row, with
        // `data` starting as `{}` before any share tap - skip that initial
        // empty-data pass instead of screenshotting a blank card and hitting
        // the API with nothing to show.
        if (isEmpty(data?.pairName)) return;
        updateOGImage();
    }, [data]);


    const downloadBase64Image = async (base64Data: string) => {
        try {
            const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
            const fileName = `image_${Date.now()}.png`;
            const path =
                Platform.OS === "android"
                    ? `${RNFS.PicturesDirectoryPath}/${fileName}`
                    : `${RNFS.DocumentDirectoryPath}/${fileName}`;

            await RNFS.writeFile(path, base64, "base64");
            successtoast("Success", "Image saved to Gallery");
        } catch (e: any) {
            failuretoast("Error", e?.message || "Failed to save image");
        }
    };

    return (
        <Sheet
            sheetref={ref}
            snappoint={["50%"]}
            custominterface
            backgroundStyle={{ paddingHorizontal: 0 }}
        >
            <View style={{ paddingHorizontal: "5%", alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 10 }}>
                <Flexcomponent justifyContent="space-between" alignItems="center">
                    <Text></Text>
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(16) }}>Share This</Text>
                    <Pressable onPress={() => closebottomsheet(ref)}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </Flexcomponent>
            </View>
            <ViewShot ref={contentRef} style={{ alignItems: "center", justifyContent: "center", width: "100%" }} options={{ format: "png", quality: 1.0 }}>
                {/* backgroundColor: type === "loss" ? "#4E0202" : "#002050"  */}
                <Images
                    type="svg"
                    name={type === "loss" ? "Loss" : "Profit"}
                    width="100%"
                    height="100%"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                    resizeMode="cover"
                />
                <View style={{ width: "100%", aspectRatio: 1.3, overflow: "hidden", padding: 22, justifyContent: "space-between" }}>
                    <View>
                        <Flexcomponent justifyContent="space-between" alignItems="center">
                            <View>
                                <Text size="small" color={Colors.white}>Profit | {capitalizeFirst(data.positionSide)}</Text>
                                <Text  size="large" family="bold" color={Colors.white} style={{ marginTop: 6 }}>
                                    {parseFloat(data?.pnl ?? 0).toFixed(2)} {formatDisplayPair("USDT")}
                                </Text>
                            </View>
                        </Flexcomponent>
                        <View style={{ marginTop: 10 }}>
                            <View style={{
                                backgroundColor: type === "loss" ? "#260000" : "#000f26",
                                borderRadius: 20,
                                alignSelf: "flex-start",
                                paddingVertical: 5,
                                paddingHorizontal: 15,
                                marginBottom: 8,
                            }}>
                                <Text color={Colors.white} size="xsmall">
                                    {dateTimeFormat(new Date().getTime(), "DD/MM/YYYY")}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Text
                        size="large"
                        family="bold"
                        color={Colors.white}
                        style={{ marginTop: 14 }}
                    >
                        {parseFloat(data?.pnl_percen ?? 0).toFixed(2)}%  <Text size="small" color={Colors.white}>({formatDisplayPair("USDT")})</Text>
                    </Text>
                    <Text color={Colors.white} size="small" style={{marginBottom: 15}}>
                        ROE {roe == null ? "--" : `${roe.toFixed(2)}%`}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                        {/* Entry / Exit price bar */}
                        <View style={{
                            flex: 1,
                            flexDirection: "row",
                            backgroundColor: type === "loss" ? "#26000099" : "#0D1F0099",
                            borderRadius: 10,
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text color={Colors.grey} size="small">Entry Price</Text>
                                <Text family="bold" size="small" color={Colors.white}>
                                    {Number(data?.entryPrice ?? 0).toFixed(2)} {formatDisplayPair("USDT")}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text color={Colors.grey} size="small">Exit Price</Text>
                                <Text family="bold" size="small" color={Colors.white}>
                                    {Number(data?.close_price ?? 0).toFixed(2)} {formatDisplayPair("USDT")}
                                </Text>
                            </View>
                        </View>

                        {/* QR + Ref Code, to the right of the bar */}
                        {!isEmpty(referralCode) && (
                            <View style={{ alignItems: "center", marginLeft: 12, marginTop: -75 }}>
                                <View style={{
                                    borderWidth: 1.5,
                                    borderColor: "#FFFFFF66",
                                    borderRadius: 16,
                                    padding: 12,
                                }}>
                                    <QRCode
                                        value={`${APIURL}/register/${referralCode}`}
                                        size={windowwidth * 0.2}
                                        color={Colors.white}
                                        backgroundColor="transparent"
                                    />
                                </View>
                                <Text color={Colors.grey} size="xsmall" style={{ marginTop: 6 }}>
                                    Ref Code: <Text size="xsmall" family="bold" color={Colors.white}>{referralCode}</Text>
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ViewShot>

            <Flexcomponent justifyContent="space-between" alignItems="center" style={{ paddingHorizontal: "5%", marginBottom: 10, marginTop: 10 }}>
                <Pressable style={style.icon} onPress={() => onRedirectHandle('twitter')}>
                    <Images
                        type="svg"
                        name="Twitter"
                        width={15}
                    />
                </Pressable>
                <Pressable style={style.icon} onPress={() => onRedirectHandle('facebook')}>
                    <VectorIcons
                        family="FontAwesome"
                        name="facebook-f"
                        size={15}
                        iconcolor={Colors.white}
                    />
                </Pressable>
                <Pressable style={style.icon} onPress={() => onRedirectHandle('whatsapp')}>
                    <VectorIcons
                        family="FontAwesome"
                        name="whatsapp"
                        size={18}
                        iconcolor={Colors.white}
                    />
                </Pressable>
                <Pressable style={style.icon} onPress={() => onRedirectHandle('telegram')}>
                    <VectorIcons
                        family="FontAwesome"
                        name="telegram"
                        size={18}
                        iconcolor={Colors.white}
                    />
                </Pressable>
                <Pressable style={style.icon} onPress={() => onRedirectHandle('reddit')}>
                    <VectorIcons
                        family="Fontisto"
                        name="reddit"
                        size={15}
                        iconcolor={Colors.white}
                    />
                </Pressable>
                <Pressable style={style.icon} onPress={() => copyData(links)}>
                    <VectorIcons
                        family="FontAwesome5"
                        name="copy"
                        size={15}
                        iconcolor={Colors.white}
                    />
                </Pressable>
                <Pressable style={style.icon} onPress={() => downloadBase64Image(base64Data)}>
                    <VectorIcons
                        family="FontAwesome5"
                        name="download"
                        size={15}
                        iconcolor={Colors.white}
                    />
                </Pressable>
            </Flexcomponent>
        </Sheet>
    );
};

export default ShareModal;