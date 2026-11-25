import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import { helperSelector } from "../../../Slices/helper";
import { Colors, limit } from "../../../Utilities/uiasset";
import useApiError from "../../../Actions/Hooks/errorhook";
import Flexcomponent from "../../../Components/flexcomponent";
import { windowheight } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { capitalizeFirst } from "../../../Utilities/helerfunction";
import { useTransactionhistoryMutation } from "../../../Slices/wallet";

interface Recenttransactionprops {
    startdate?: any,
    enddate?: any,
    transferType?: string,
    change?: boolean
}

const Recenttransaction: React.FC<Recenttransactionprops> = ({ }) => {

    const { theme, convert, convertSec } = useCustomHooks()

    const [transactionhistory, { error, isLoading }] = useTransactionhistoryMutation()

    useApiError(error)
    const [page, setPage] = useState(1)

    const { transactionlogdata } = useSelector(helperSelector)
    const [transaction, setTransactions] = useState<any[]>([])
    const [maxreached, setMaxreached] = useState(false)
    useEffect(() => {
        if (transactionlogdata) {
            setMaxreached(false)
            setPage(1)
            fetchhistory(1)
        }
    }, [transactionlogdata])

    useFocusEffect(
        useCallback(() => {
            fetchhistory(page)
        }, [page])
    );

    // Accepts the page explicitly instead of reading the `page` state via closure -
    // when the filter changes mid-scroll (page > 1), the stale closured `page` from
    // before the reset would still be whatever the user had scrolled to, so the reset
    // fetch would APPEND its (now unfiltered) results onto the old filtered list
    // instead of replacing it, and the tester would see leftover/incorrect entries
    // (or nothing, if the filtered set doesn't reach that page) instead of a clean reset.
    const fetchhistory = async (pageParam: number = page) => {
        const formData = new FormData();
        formData.append("page", pageParam)
        formData.append("limit", limit.recent_tranaction)
        formData.append("transferType", (transactionlogdata?.transferType)?.toLocaleLowerCase() ?? "all")
        formData.append("startDate", (transactionlogdata?.startdate) ?? "")
        formData.append("endDate", (transactionlogdata?.enddate) ?? "")
        const res = await transactionhistory(formData).unwrap()
        const result: any[] = res?.result?.data
        if (pageParam == 1) {
            setTransactions(result ?? [])
        }
        else {
            setTransactions((prevstate) => [...prevstate, ...(result ?? [])])
        }
        if ((result?.length < Number(limit.recent_tranaction))) {
            setMaxreached(true)
        }
    }

    const handleNextPage = () => {
        if (!maxreached && !isLoading) {
            setPage(prev => prev + 1)
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginBottom: 20 }} >
            {(isLoading && (page == 1)) ?
                <Loadercomponent containerstyle={{ flex: 1 }} /> :
                <FlatList
                    data={transaction}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ marginTop: 20, }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => handleNextPage()}
                    onEndReachedThreshold={0.5}
                    renderItem={({ item }) => {
                        return (
                            <Card borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: 15, marginBottom: 10, backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF", }}>
                                <Flexcomponent justifyContent="space-between" alignItems="center" >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Type</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{capitalizeFirst(item?.transferType)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Request Amount</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{convert(item?.transactionAmount)}</Text>
                                        <Text size="small" color={theme.graytext}>{convertSec(item?.transactionAmount)}</Text>
                                    </View>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Transferred Amount</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{convert(item?.finalAmount)}</Text>
                                        <Text size="small" color={theme.graytext}>{convertSec(item?.finalAmount)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} ></Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}></Text>
                                    </View>
                                </Flexcomponent>
                                <Flexcomponent top={"5%"} justifyContent="space-between" >
                                    <Card backgroundColor={theme.background} containerStyle={{ padding: "2.5%", width: "45%", alignItems: "center" }} >
                                        <Text family="medium" size="semimedium"  >{(new Date(item?.updatedAt)).toDateString()}</Text>
                                    </Card>

                                    <View style={{ width: "50%", alignItems: "flex-end" }} >
                                        <Text color={item?.status == "completed" ? Colors.green : (item?.status == "rejected") ? Colors.red : "#FDD25A"} family="medium" size="semimedium">{capitalizeFirst(item?.status)}</Text>
                                    </View>
                                </Flexcomponent>
                            </Card>
                        )
                    }}
                    ListFooterComponent={(page > 1 && isLoading) ?
                        <Loadercomponent containerstyle={{ height: windowheight * 0.05 }} /> : null
                    }
                    ListEmptyComponent={() => (
                        <View style={{ height: windowheight * 0.8, justifyContent: "center", alignItems: "center", }} >
                            <Text family="medium" size="small" style={{ marginTop: 10 }} >No Data Found</Text>
                        </View>
                    )}
                />
            }
        </View>
    )

}

export default Recenttransaction;