
import React, { useState, useEffect } from "react";
import { Pressable, View } from "react-native";
import { SOCKET_URL } from "@env";
import { useSelector } from "react-redux";

import useFavorite from "../helper";
import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import { copyTradeSelector } from "../../../Slices/copy";
import VectorIcons from "../../../Utilities/vectoricons";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { isEmpty, timeAgo } from "../../../Utilities/helerfunction";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { style } from "../styles";

interface Tradecomponentprops {
    item?: any
    favourite?: any
    onOptimisticToggle?: (item: any) => void;  // ← new prop
}

const Trade: React.FC<Tradecomponentprops> = ({
    item,
    favourite,
    onOptimisticToggle
}) => {
    const { theme, navigation, failuretoast } = useCustomHooks();
    const styles = style(theme);
    const { _id, name, curCopier, createdAt, profileImage } = item;
    const { userId } = useSelector((state: any) => state.auth.userData);
    const { toggleFavorite, isFavoriteLoadingId } = useFavorite();
    const { myStrategy } = useSelector(copyTradeSelector);
    const findCopier = item?.copiersId?.find((e: any) => e?.userId == userId);

    const favourites = favourite?.filter((copier: any) => copier._id === item._id);
    const isFav = (favourites?.length ?? 0) > 0;


    const handleToggleFavorite = () => {
        onOptimisticToggle?.(item);
        toggleFavorite(_id);
    };

    return (
        <Pressable style={{ marginTop: "5%" }}>
            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.card}>
                <Flexcomponent>
                    <View style={styles.profile}>
                        {
                            profileImage ?
                                <Images
                                    type="image"
                                    source={{ uri: `${SOCKET_URL}${profileImage}` }}
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
                        <Flexcomponent justifyContent="flex-start" style={{ width: "85%" }}>
                            <Text numoflines={2}>{name}</Text>
                            <Images
                                type="svg"
                                name="Crown"
                                width={windowwidth * 0.045}
                                height={windowwidth * 0.045}
                                style={{ marginLeft: "2.5%" }}
                            />
                        </Flexcomponent>
                        <Text top={"1%"} fontSize={RFvalue(11)} color="#9E9E9E" >Registered {timeAgo(createdAt)}</Text>
                        <Flexcomponent justifyContent="flex-start" >
                            <Images
                                type="svg"
                                name="Members"
                                width={windowwidth * 0.045}
                                height={windowwidth * 0.045}
                            />
                            <Text top={"1%"} left={"2.5%"} fontSize={RFvalue(11)}>{curCopier}</Text>
                        </Flexcomponent>
                    </View>
                    {/* <Pressable style={{ width: "10%" }} onPress={() => toggleFavorite(_id)}>
                        {
                            favourites.length > 0 ?
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
                    </Pressable> */}

                    <Pressable style={{ width: "10%" }} onPress={handleToggleFavorite} disabled={isFavoriteLoadingId === _id}>
                        {isFav ? (
                            <Images
                                type="svg"
                                name="Heart"
                                width={windowwidth * 0.065}
                                height={windowwidth * 0.065}
                            />
                        ) : (
                            <VectorIcons
                                name={"heart-outline"}
                                family="Ionicons"
                                iconcolor={theme.futuretext}
                                size={windowwidth * 0.065}
                            />
                        )}
                    </Pressable>


                </Flexcomponent>
                <Pressable onPress={() => navigation.navigate("Tradedetail", { type: "user", data: item })}>
                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.content}>
                        {/* <Flexcomponent justifyContent="space-between">
                            <View style={{ width: "45%" }} >
                                <Text>{!isEmpty(item?.stradegyDetails) ? item?.stradegyDetails[0]?.totalPnl : 0}</Text>
                                <Text color={theme.secondarytext} size="small" >Total PNL</Text>
                            </View>
                            <View style={{ width: "45%", alignItems: "flex-end" }} >
                                <Text>{item?.stradegyDetails[0]?.totalRoi || 0}</Text>
                                <Text color={theme.secondarytext} size="small">ROI</Text>
                            </View>
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" top={"7.5%"}>
                            <View style={{ width: "45%" }} >
                                <Text>{!isEmpty(item?.copierDetails) ? item?.copierDetails[0].totalAUM?.toFixed(2) : 0} USD</Text>
                                <Text color={theme.secondarytext} size="small" >AUM</Text>
                            </View>

                            <View style={{ width: "45%", alignItems: "flex-end" }} >
                                <Text>{!isEmpty(item.copierDetails) ? item?.copyTraderPnlDetails[0].copyTraderPnl?.toFixed(2) : 0} USD</Text>
                                <Text color={theme.secondarytext} size="small" >Copy Trader’s PnL</Text>
                            </View>
                        </Flexcomponent> */}

                        <Flexcomponent justifyContent="space-between">
                            <View style={{ width: "45%" }}>
                                <Text>
                                    {!isEmpty(item?.stradegyDetails)
                                        ? Number(item?.stradegyDetails[0]?.totalPnl || 0).toFixed(4)
                                        : "0.00"}
                                </Text>
                                <Text color={theme.secondarytext} size="small">
                                    Total PNL
                                </Text>
                            </View>

                            <View style={{ width: "45%", alignItems: "flex-end" }}>
                                <Text>
                                    {!isEmpty(item?.stradegyDetails)
                                        ? Number(item?.stradegyDetails[0]?.totalRoi || 0).toFixed(4)
                                        : "0.00"}
                                </Text>
                                <Text color={theme.secondarytext} size="small">
                                    ROI
                                </Text>
                            </View>
                        </Flexcomponent>

                        <Flexcomponent justifyContent="space-between" top={"7.5%"}>
                            <View style={{ width: "45%" }}>
                                <Text>
                                    {!isEmpty(item?.copierDetails)
                                        ? Number(item?.copierDetails[0]?.totalAUM || 0).toFixed(4)
                                        : "0.00"}{" "}
                                    {formatDisplayPair("USDT")}
                                </Text>
                                <Text color={theme.secondarytext} size="small">
                                    AUM
                                </Text>
                            </View>

                            <View style={{ width: "45%", alignItems: "flex-end" }}>
                                <Text>
                                    {!isEmpty(item?.copyTraderPnlDetails)
                                        ? Number(item?.copyTraderPnlDetails[0]?.copyTraderPnl || 0).toFixed(4)
                                        : "0.00"}{" "}
                                    {formatDisplayPair("USDT")}
                                </Text>
                                <Text color={theme.secondarytext} size="small">
                                    Copy Trader’s PNL
                                </Text>
                            </View>
                        </Flexcomponent>


                    </Card>
                </Pressable>
                {
                    findCopier?.status === "active" ?
                        <View>
                            <Button
                                title="Following"
                                buttonStyle={{
                                    marginTop: "5%",
                                    backgroundColor: theme.theme === "dark" ? "#24272C" : Colors.white,
                                }}
                                textStyle={{
                                    color: theme.theme === "dark" ? "#fff" : "#24272C"
                                }}
                            // onPress={() => navigation.navigate("Tradedetail", { type: "viewcoiper", data: item })}
                            />
                        </View>
                        :
                        <Flexcomponent justifyContent="space-between">
                            <Button
                                title="Copy"
                                onPress={() => {
                                    if (myStrategy?.strategyStatus === "inactive" || myStrategy?.strategyStatus === "active") {
                                        failuretoast("Error!", "You're already a strategy provider, So you're not able to copy")
                                    } else {
                                        navigation.navigate("Tradepairs", { type: "add", data: item })
                                    }
                                }}
                                style={[styles.copy, { backgroundColor: Colors.brand }]}
                                 textStyle={{color: theme.theme == 'dark' ? Colors.black : Colors.white}}
                            />
                            <Button
                                title="View"
                                onPress={() => navigation.navigate("Tradedetail", { type: "user", data: item })}
                                style={styles.copy}
                                textStyle={{ color: theme.darktext }}
                            />
                        </Flexcomponent>
                }
            </Card>
        </Pressable>
    )

}

export default Trade;