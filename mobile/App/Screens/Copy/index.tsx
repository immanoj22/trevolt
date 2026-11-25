import React, { useCallback, useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Toptabs from "../../Components/toptabs";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { Dropdown } from "../../Components/Field";
import Wishlistcomponent from "./Components/wishlist";
import VectorIcons from "../../Utilities/vectoricons";
import Publicportfolio from "./Components/publicportfolio";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { handleTrade, source } from "../../Utilities/helerfunction";
import { windowheight, windowwidth } from "../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import { copyTradeSelector, setAllStrategy, useGetAllStrategyMutation } from "../../Slices/copy";

import { style } from "./styles";
import SelectItem from "../Profile/Security/Helpers/SelectItem";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Copytrade'>;

const Copytrade: React.FC<Props> = () => {
    const { theme, navigation, dispatch, openbottomsheet, closebottomsheet, bottomsheetref } = useCustomHooks()
    const styles = style(theme);
    const { favStradegies, userId, accountId } = useSelector((state: any) => state.auth.userData);

    const { myStrategy } = useSelector(copyTradeSelector);
    const [allStrategy, { isLoading }] = useGetAllStrategyMutation();
    const [activeindex, setActiveindex] = useState(0);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("last30Days");
    const [data, setData] = useState<any>([]);

    const getAllStrategy = async () => {
        const payload = {
            filterBy: filter,
            search: search,
            id: userId,
            accountId: accountId
        }
        const response = await allStrategy(payload).unwrap();
        if (response.success) {
            setData(response.result)
            dispatch(setAllStrategy(response.result));
        } else {
            console.log("Error", "Something went wrong")
        }
    }

    useFocusEffect(
        useCallback(() => {
            getAllStrategy()
        }, [search, filter, myStrategy])
    );

    const favouriteList = data?.filter((strategy: any) =>
        favStradegies?.some((fav: any) => fav.strategyId === strategy?._id && fav.accountId === accountId)
    );
    const masterActive = myStrategy?.strategyStatus === "inactive" || myStrategy?.strategyStatus === "active";
    const isCopier = data.some((item: any) => item.copiersId?.some((c: any) => c.userId === userId && c.status === "active"));
    const updatedData = data.filter((item: any) => item?._id !== myStrategy?._id);

    return (
        <Mainview
            headertitle={"Copy Trading"}
            onleftfn={() => navigation.navigate("Dashboard")}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            {/* <Flexcomponent justifyContent="space-between">
                <Pressable style={styles.trade} disabled={myStrategy?.strategyStatus === "inactive"}
                    onPress={() => {
                        if (myStrategy?.strategyStatus === "active") {
                            navigation.navigate("Tradedetail", { type: "your", data: "" })
                        } else {
                            navigation.navigate("MasterTrader")
                        }
                    }}
                >
                    <Text size="small" color={theme.activetabtext} family="medium">{handleTrade(myStrategy?.strategyStatus)}</Text>
                </Pressable>
                <Pressable disabled={masterActive || !isCopier} style={[styles.trade, { backgroundColor: theme.card, opacity: masterActive || !isCopier ? 0.3 : 1 }]} onPress={() => navigation.navigate("GetCopierDetails")}>
                    <Text size="small" color={theme.darktext} family="medium">Copy trade dashborad</Text>
                </Pressable>
            </Flexcomponent> */}

            <View style={[styles.between, { marginTop: "0%" }]}>
                <View style={{ width: "48%" }}>
                    <Pressable style={styles.trade} disabled={myStrategy?.strategyStatus === "inactive"}
                        onPress={() => {
                            if (myStrategy?.strategyStatus === "active") {
                                navigation.navigate("Tradedetail", { type: "your", data: "" })
                            } else {
                                navigation.navigate("MasterTrader")
                            }
                        }}
                    >
                        <Text size="xsmall" color={theme.activetabtext} family="medium">{handleTrade(myStrategy?.strategyStatus)}</Text>
                    </Pressable>
                </View>
                <View style={{ width: "48%" }}>
                    <Pressable disabled={masterActive || !isCopier} style={[styles.trade, { backgroundColor: theme.card, opacity: masterActive || !isCopier ? 0.3 : 1 }]} onPress={() => navigation.navigate("GetCopierDetails")}>
                        <Text size="xsmall" color={theme.darktext} family="medium">Copy Trade Dashboard</Text>
                    </Pressable>
                </View>
            </View>
            <View style={styles.between}>
                <View style={{ width: "55%" }}>
                    <Flexcomponent paddingHorizontal={"5%"} style={styles.search}>
                        <VectorIcons
                            family="Feather"
                            name={"search"}
                            size={windowwidth * 0.045}
                            style={styles.icon}
                        />
                        <TextInput
                            value={search}
                            placeholder="Search..."
                            style={styles.searchText}
                            placeholderTextColor={theme.graytext}
                            onChangeText={(text) => setSearch(text)}
                        />
                    </Flexcomponent>
                </View>
                <View style={{ width: "40%" }}>
                    <Pressable onTouchEnd={() => openbottomsheet(bottomsheetref)}>
                        <Dropdown
                            value={filter}
                            list={source}
                            bottom={0}
                            onChange={(value) => setFilter(value.value)}
                            placeholder={"Select"}
                            height={windowheight * 0.05}
                            inputStyle={styles.select}
                            disabled={true}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                        />
                    </Pressable>
                </View>
            </View>
            <Toptabs
                tabs={["Public Portfolio", "My Favorites"]}
                activeindex={activeindex}
                onchangeindex={setActiveindex}
            />
            <View style={styles.container}>
                {
                    activeindex == 0 && (
                        <Publicportfolio
                            data={updatedData}
                            isLoading={isLoading}
                            favourite={favouriteList}
                        />
                    )
                }
                {
                    activeindex == 1 && (
                        <Wishlistcomponent
                            isLoading={isLoading}
                            favourite={favouriteList}
                        />
                    )
                }
            </View>
            <SelectItem
                value={filter}
                data={source}
                ref={bottomsheetref}
                onSelect={(value) => { setFilter(value) }}
                cancel={() => closebottomsheet(bottomsheetref)}
            />
        </Mainview>
    )

}

export default Copytrade;