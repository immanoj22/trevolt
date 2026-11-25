import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import { helperSelector } from "../../../Slices/helper";
import useApiError from "../../../Actions/Hooks/errorhook";
import { Colors, limit } from "../../../Utilities/uiasset";
import { dateTimeFormat } from "../../../Utilities/dateTime";
import { windowheight } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useGetpassbookMutation } from "../../../Slices/wallet";
import Loadercomponent from "../../../Components/loadercomponent";
import { capitalizeFirst } from "../../../Utilities/helerfunction";

interface Historyprops {

}

const History: React.FC<Historyprops> = ({ }: Historyprops) => {
    const { theme, convert, convertSec } = useCustomHooks()

    const [getpassbook, { error, isLoading, }] = useGetpassbookMutation()

    useApiError(error)
    const [page, setPage] = useState(1)

    const { transactionlogdata } = useSelector(helperSelector)
    const [transaction, setTransactions] = useState<any[]>([])
    const [maxreached, setMaxreached] = useState(false)
    useEffect(() => {
        if (transactionlogdata) {
            fetchhistory()
            setPage(1)
        }
    }, [transactionlogdata])

    useFocusEffect(
        useCallback(() => {
            if (page) {
                fetchhistory()
            }
        }, [page])
    );

    const fetchhistory = async () => {
        const formData = new FormData();
        formData.append("page", page)
        formData.append("limit", limit.recent_tranaction)
        formData.append("transferType", (transactionlogdata?.transferType)?.toLocaleLowerCase() ?? "all")
        formData.append("startDate", (transactionlogdata?.startdate) ?? "")
        formData.append("endDate", (transactionlogdata?.enddate) ?? "")
        formData.append("selectedType", (transactionlogdata?.selectedType)?.toLocaleLowerCase() ?? "")

        const res = await getpassbook(formData).unwrap()
        const result: any[] = res?.result?.data
        if (page == 1) {
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
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{capitalizeFirst(item?.type)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Transfer Type</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{capitalizeFirst(item?.transferType)}</Text>
                                    </View>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Before Balance</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{convert(item?.beforeBalance ?? 0, item?.pip)}</Text>
                                        <Text size="small" color={theme.graytext}>{convertSec(item?.beforeBalance ?? 0, item?.pip)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >After Balance</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{convert(item?.afterBalance ?? 0, item?.pip)}</Text>
                                        <Text size="small" color={theme.graytext}>{convertSec(item?.afterBalance ?? 0, item?.pip)}</Text>
                                    </View>

                                </Flexcomponent>

                                {/* {(new Date(item?.updatedAt)).toDateString()} */}
                                <Flexcomponent top={"5%"} justifyContent="space-between" >
                                    <View style={{ width: "45%" }} >
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Amount</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{convert(item?.amount)}</Text>
                                        <Text size="small" color={theme.graytext}>{convertSec(item?.amount)}</Text>
                                    </View>
                                    <Card backgroundColor={theme.background} containerStyle={{ padding: "2.5%", width: "55%", alignItems: "center" }} >
                                        <Text family="medium" size="semimedium"  >{dateTimeFormat(item?.updatedAt)}</Text>
                                    </Card>
                                </Flexcomponent>

                            </Card>
                        )
                    }
                    }
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

export default History;