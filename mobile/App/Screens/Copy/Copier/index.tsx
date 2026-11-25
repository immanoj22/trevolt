import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { SOCKET_URL } from "@env";

import useFavorite from "../helper";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { isEmpty, timeAgo, getProfileImageUrl } from "../../../Utilities/helerfunction";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { copyTradeSelector, useLazyGetCopierQuery } from "../../../Slices/copy";

import { style } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'GetCopierDetails'>;

const GetCopierDetails: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const styles = style(theme);
    const { profileImage, userName, favStradegies, accountId, userId } = useSelector((state: any) => state.auth.userData);
    const [copier, serCopier] = useState<any>()
    const { toggleFavorite, isFavoriteLoadingId } = useFavorite();

    const [getCopier, { isFetching }] = useLazyGetCopierQuery();
    const [records, setRecords] = useState<any>([]);
    const { allStrategy } = useSelector(copyTradeSelector);
    const getCopierDetails = async () => {
        const params = {
            page: 1,
            limit: 10
        }
        const response = await getCopier(params).unwrap();
        if (response.success) {
            serCopier(response.result);
        } else {
            console.log("Error", "getcopier")
        }
    }

    // useEffect(() => {
    //     getCopierDetails()
    //     if (!isEmpty(allStrategy)) {
    //         const filteredVal = allStrategy?.map((item: any) => {
    //             const isFavorite = favStradegies?.includes(item._id) || false;
    //             const isCopied = Array.isArray(item.copiersId) &&
    //                 item.copiersId.some((c: any) => c.userId === userId && c.accountId == accountId && c.status == 'active');
    //             return {
    //                 ...item,
    //                 isFavorite,
    //                 isCopied
    //             };
    //         });
    //         setRecords(filteredVal);
    //     }
    // }, [allStrategy]);

    useFocusEffect(
        useCallback(() => {
        getCopierDetails();

        if (!isEmpty(allStrategy)) {
            const filteredVal = allStrategy.map((item: any) => {
                const isFavorite =
                    favStradegies?.includes(item._id) || false;

                const isCopied =
                    Array.isArray(item.copiersId) &&
                    item.copiersId.some(
                        (c: any) =>
                            c.userId === userId &&
                            c.accountId == accountId &&
                            c.status === "active"
                    );

                const activeFollowers =
                    item?.copiersId?.filter(
                        (copier: any) => copier.status === "active"
                    ).length || 0;
                console.log("aaaa_____", item.copiersId)

                return {
                    ...item,
                    isFavorite,
                    isCopied,
                    activeFollowers,
                };
            });

            setRecords(filteredVal);
        }
        }, [allStrategy])
    );

    console.log("My Trading__", records)

    return (
        <Mainview
            headertitle={"My Trading Dashboard"}
            isscollable={false}
            onleftfn={() => navigation?.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={styles.container}>
                <Text color={theme.secondarytext}>Explore detailed trader profiles, track performance, and copy top strategies in real time. Get expert trading insights for every trade you make.</Text>
                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.copier}>
                    <View style={styles.user}>
                        {
                            profileImage ?
                                <Images
                                    type="image"
                                    source={{ uri: getProfileImageUrl(profileImage) }}
                                    width={windowwidth * 0.15}
                                    height={windowwidth * 0.15}
                                    style={{ borderRadius: 100, }}
                                    resizeMode="cover"
                                />
                                :
                                <Images
                                    type="svg"
                                    name={theme.theme == "dark" ? "DarkUser" : "EmptyUser"}
                                    width={windowwidth * 0.15}
                                    height={windowwidth * 0.15}
                                />
                        }
                        <View style={styles.contentname}>
                            <Text family="medium" numoflines={1} size="small">{userName}</Text>
                            <Text color={copier?.roi > 0 ? Colors.green : Colors.red}><Text>ROI - </Text>{copier?.roi ? copier?.roi > 0 ? `+${copier?.roi.toFixed(2)} %` : `${copier?.roi.toFixed(2)} %` : `0`}</Text>
                        </View>
                    </View>
                    <View style={styles.pnl}>
                        <Text size="xsmall" numoflines={1}>{(copier?.totalPandL ?? 0).toFixed(2)}</Text>
                        <Text size="xsmall" color={theme.secondarytext}>Total PNL</Text>
                    </View>
                </Card>
                {
                    isFetching ?
                        <Loadercomponent />
                        : <FlatList
                            data={records}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => {
                                const favouriteList = copier?.strategyData?.filter((strategy: any) =>
                                    favStradegies?.some((fav: any) => fav.strategyId === strategy?._id && fav.accountId === accountId)
                                );
                                const favourites = favouriteList?.filter((copier: any) => copier._id === item._id);
                                return (

                                    item.isCopied ? <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.card}>
                                        <Flexcomponent>
                                            <View style={styles.profile} >
                                                {
                                                    item.profileImage ?
                                                        <Images
                                                            type="image"
                                                            source={{ uri: `${SOCKET_URL}${item.profileImage}` }}
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
                                            <View style={styles.name} >
                                                <Flexcomponent justifyContent="flex-start" style={{ width: "85%" }} alignItems="flex-start">
                                                    <Text numoflines={2}>{item.name}</Text>
                                                </Flexcomponent>
                                                <Text top={"1%"} fontSize={RFvalue(11)} color="#9E9E9E" >Registered {timeAgo(item?.createdAt)}</Text>
                                            </View>
                                            <Pressable style={{ width: "10%" }} onPress={() => toggleFavorite(item?._id)} disabled={isFavoriteLoadingId === item?._id}>
                                                {
                                                    favourites?.length > 0 ?
                                                        <Images
                                                            type="svg"
                                                            name="Heart"
                                                            width={windowwidth * 0.065}
                                                            height={windowwidth * 0.065}
                                                        /> :
                                                        <VectorIcons
                                                            name={"heart-outline"}
                                                            family="Ionicons"
                                                            iconcolor={theme.futuretext}
                                                            size={windowwidth * 0.065}
                                                        />
                                                }
                                            </Pressable>
                                        </Flexcomponent>
                                        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.content}>
                                            <Flexcomponent justifyContent="space-between">
                                                <View style={{ width: "45%" }} >
                                                    {/* <Text>{item?.curCopier}</Text>
                                                    <Text color={theme.secondarytext} size="small" >Follower</Text> */}

                                                    <Text>{item?.activeFollowers}</Text>
                                                    <Text color={theme.secondarytext} size="small">Followers</Text>

                                                </View>
                                                <View style={{ width: "45%", alignItems: "flex-end" }} >
                                                    {/* <Text>{item?.stradegyDetails[0]?.totalRoi || 0}</Text> */}

                                                    <Text>{(item?.stradegyDetails?.[0]?.totalRoi ?? 0).toFixed(2)}</Text>

                                                    <Text color={theme.secondarytext} size="small" >ROI</Text>
                                                </View>
                                            </Flexcomponent>
                                            <Flexcomponent justifyContent="space-between" top={"7.5%"}>
                                                <View style={{ width: "45%" }} >
                                                    {/* <Text>{`${item?.copierDetails?.[0]?.totalAUM?.toFixed(4) || 0} USDT`}</Text> */}
                                                    <Text>{`${(item?.copierDetails?.[0]?.totalAUM ?? 0).toFixed(4)} ${formatDisplayPair("USDT")}`}</Text>
                                                    <Text color={theme.secondarytext} size="small">AUM</Text> 
                                                </View>
                                                <View style={{ width: "45%", alignItems: "flex-end" }}>
                                                    <Text>{(item?.copyTraderPnlDetails?.[0]?.copyTraderPnl ?? 0).toFixed(2)} {formatDisplayPair("USDT")}</Text>
                                                     <Text color={theme.secondarytext} size="small">Copy Trader's PnL</Text>
                                                </View>
                                            </Flexcomponent>
                                        </Card>
                                        <Flexcomponent justifyContent="space-between">
                                            <Button
                                                title="View Trader"
                                                style={[styles.copy, { backgroundColor: Colors.brand }]}
                                                onPress={() => navigation.navigate("Tradedetail", { type: "viewtrader", data: item })}
                                            />
                                            <Button
                                                title="View Copier"
                                                style={styles.copy}
                                                textStyle={{ color: theme.theme === "dark" ? Colors.white : Colors.black }}
                                                onPress={() => navigation.navigate("Tradedetail", { type: "viewcoiper", data: item })}
                                            />
                                        </Flexcomponent>
                                    </Card> : null

                                )
                            }}
                        />
                }
            </View>
        </Mainview>
    )
}

export default GetCopierDetails;