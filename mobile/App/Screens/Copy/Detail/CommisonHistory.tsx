import React, { useCallback, useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Colors } from "../../../Utilities/uiasset";
import { helperSelector } from "../../../Slices/helper";
import { dateTimeFormat } from "../../../Utilities/dateTime";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { useLazyCommissionHistoryQuery } from "../../../Slices/copy";

import { style } from "../styles";

interface CommisonHistoryprops {
    search?: any
}

const CommisonHistory: React.FC<CommisonHistoryprops> = ({ search }) => {
    const { theme } = useCustomHooks();
    const styles = style(theme);
    const [commission, setCommission] = useState<any>([]);
    const { transactionlogdata } = useSelector(helperSelector)
    const [commissionhistory, { isFetching }] = useLazyCommissionHistoryQuery();

    const fetchCommissionHistory = async () => {
        const params = {
            startDate: (transactionlogdata?.startdate) ?? "",
            endDate: (transactionlogdata?.enddate) ?? "",
            search: search,
            coin: ""
        }

        const response = await commissionhistory(params).unwrap();
        setCommission(response?.result);
    }

    useFocusEffect(
        useCallback(() => {
            fetchCommissionHistory();
        }, [search])
    );

    return (
        <View style={styles.container}>
            {
                isFetching ?
                    <View style={styles.noData}>
                        <Loadercomponent />
                    </View> :
                    <FlatList
                        data={commission}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ marginTop: 10, }}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={0.5}
                        renderItem={({ item }) => {
                            return (
                                <Card containerStyle={styles.orders}>
                                    <Flexcomponent justifyContent="space-between" alignItems="center">
                                        <View style={{ flex: 0.9 }}>
                                            <Text color={theme.graytext} >Email</Text>
                                            <Text family="medium" style={{ marginTop: 3 }}>{item.email}</Text>
                                        </View>
                                        <View style={styles.rightContent}>
                                            <Text color={theme.graytext} >Coin</Text>
                                            <Text family="medium" style={{ marginTop: 3 }}>{item.currecnySymbol}</Text>
                                        </View>
                                    </Flexcomponent>
                                    <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }}>
                                        <View style={{ flex: 0.9 }}>
                                            <Text color={theme.graytext}>Fee</Text>
                                            <Text family="medium" style={{ marginTop: 3 }}>{item.fees}</Text>
                                        </View>
                                        <View style={styles.rightContent}>
                                        </View>
                                    </Flexcomponent>
                                    <Flexcomponent top={"5%"} justifyContent="space-between">
                                        <Card backgroundColor={theme.background} containerStyle={styles.date}>
                                            <Text family="medium">{dateTimeFormat(item.createdAt)}</Text>
                                        </Card>
                                        <View style={styles.status}>
                                        </View>
                                    </Flexcomponent>
                                </Card>
                            )
                        }}
                        ListEmptyComponent={
                            <View style={styles.noData}>
                                <NoData title="No Open Order" />
                            </View>
                        }
                    />
            }
        </View>
    )

}

export default CommisonHistory;