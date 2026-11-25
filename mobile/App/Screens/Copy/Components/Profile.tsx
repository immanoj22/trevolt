import React from "react";
import { Pressable, View } from "react-native";
import { SOCKET_URL } from "@env";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import { copyTradeSelector } from "../../../Slices/copy";
import VectorIcons from "../../../Utilities/vectoricons";
import { windowwidth } from "../../../Utilities/dimensions";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { openLink, timeAgo } from "../../../Utilities/helerfunction";

import { style } from "../styles"

interface Copyprofileprops {
    type?: string,
    data?: any,
    onPress?: any
    following?: any
    isUpdating?: boolean
}

const Copyprofile: React.FC<Copyprofileprops> = ({ type, data, onPress, following, isUpdating }) => {
    const { theme, navigation } = useCustomHooks();
    const styles = style(theme);
    const { userId, } = useSelector((state: any) => state.auth.userData);
    const { myStrategy } = useSelector(copyTradeSelector);
    const masterActive = myStrategy?.strategyStatus === "inactive" || myStrategy?.strategyStatus === "active";
    const findCopier = data?.copiersId?.find((e: any) => e?.userId == userId);

    const roiValue = parseFloat(
        data?.roi ??
        data?.stradegyDetails?.[0]?.totalRoi ??
        0
    );

    console.log("daaaaaaa", data)
    return (
        <Flexcomponent alignItems="flex-start" paddingVertical={"1%"}>
            <View style={styles.profileContainer}>
                {
                    data?.profileImage ?
                        <Images
                            type="image"
                            source={{ uri: `${SOCKET_URL}${data?.profileImage}` }}
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
                <Button
                    title={"Unfollow"}
                    textStyle={{ fontSize: Fontsize.small }}
                    style={[styles.follow, { opacity: following ? 1 : 0.4, marginTop: "10%" }]}
                    onPress={

                        // () => {
                        // if (findCopier?.status === "active" || type === "viewtrader") {
                        //     navigation.navigate("Copytrade");
                        // } else {
                        //     navigation.navigate("Tradepairs", { type: "add", data: data })
                        // }
                        () => onPress()
                    }
                    disabled={(following?.status === "active" ? false : true) || isUpdating}
                    loading={isUpdating}
                />
            </View>
            <View style={styles.profileContent}>
                <Text size="medium" family="medium">{data?.name}</Text>
                <Text size="semimedium" color={theme.secondarytext} family="medium">Registered {timeAgo(data?.createdAt)}</Text>
                <Flexcomponent justifyContent="space-between" top={"2.5%"} >
                    {/* <Text color={data?.roi > 0 ? Colors.green : Colors.red}><Text>- ROI </Text>{data?.roi || "0"}</Text> */}
                    {/* <Text color={data?.roi > 0 ? Colors.green : Colors.red}>
                        <Text>ROI- </Text>
                        {parseFloat(data?.roi || 0).toFixed(6).replace(/\.?0+$/, "")}
                    </Text> */}

                    <Text color={roiValue > 0 ? Colors.green : Colors.red}>
                {roiValue.toFixed(6).replace(/\.?0+$/, "")}
                <Text> - ROI </Text>
            </Text>
                </Flexcomponent>
                {
                    type === "user" && (
                        <Flexcomponent justifyContent="flex-start" top={"2.5%"} >
                            <Pressable style={styles.icons} onPress={() => openLink(data?.telegramUrl)}>
                                <VectorIcons
                                    family="FontAwesome"
                                    iconcolor={theme.activetabtext}
                                    name={"facebook"}
                                    size={windowwidth * 0.035}
                                />
                            </Pressable>
                            <Pressable style={[styles.icons, { marginLeft: "4%" }]} onPress={() => openLink(data?.linkedInUrl)}>
                                <VectorIcons
                                    family="Entypo"
                                    iconcolor={theme.activetabtext}
                                    name={"linkedin"}
                                    size={windowwidth * 0.0325}
                                />
                            </Pressable>
                            <Pressable style={[styles.icons, { marginLeft: "4%" }]} onPress={() => openLink(data?.twitterUrl)}>
                                <VectorIcons
                                    family="FontAwesome6"
                                    iconcolor={theme.activetabtext}
                                    name={"x-twitter"}
                                    size={windowwidth * 0.0325}
                                />
                            </Pressable>
                        </Flexcomponent>
                    )
                }
            </View>
        </Flexcomponent>
    )

}

export default Copyprofile;