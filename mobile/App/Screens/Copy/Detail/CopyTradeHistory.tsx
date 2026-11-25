import React, { useCallback, useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Colors } from "../../../Utilities/uiasset";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { capitalizeFirst } from "../../../Utilities/helerfunction";
import { copyTradeSelector, useLazyGetFollowersDetailsQuery } from "../../../Slices/copy";

import { style } from "../styles";

interface CommisonHistoryprops {
    search?: any
}

const CopyTradeHistory: React.FC<CommisonHistoryprops> = ({ search }) => {
    const { theme } = useCustomHooks();
    const styles = style(theme);

    const [followers, setFollowers] = useState<any>([]);
    const [followersDetails, { isFetching }] = useLazyGetFollowersDetailsQuery();
    const { myStrategy } = useSelector(copyTradeSelector);

    const fetchFollowersDetails = async () => {
        const params = {
            id: myStrategy._id,
            search: search
        }
        const response = await followersDetails(params).unwrap();
        setFollowers(response?.result);
    }

    useFocusEffect(
        useCallback(() => {
            fetchFollowersDetails();
        }, [search])
    );

    return (
        <View style={styles.container}>
            {
                isFetching ?
                    <View style={styles.noData}>
                        <Loadercomponent />
                    </View> : <FlatList
                        data={followers}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ marginTop: 10, }}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={0.5}
                        renderItem={({ item }) => {
                            return (
                                <Card containerStyle={styles.orders}>
                                    <Flexcomponent justifyContent="space-between" alignItems="center">
                                        <View style={{ flex: 0.9 }}>
                                            <Text color={theme.graytext}>Email</Text>
                                            <Text family="medium" style={{ marginTop: 3 }}>{item?.email}</Text>
                                        </View>
                                        <View style={styles.rightContent}>
                                            <Text color={theme.graytext} >Total PNL</Text>
                                            <Text family="medium" style={{ marginTop: 3 }}>{item?.ProfitData?.totalPnl}</Text>
                                        </View>
                                    </Flexcomponent>
                                    <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }}>
                                        <View style={{ flex: 0.9 }}>
                                            <Text color={theme.graytext}>Total ROI</Text>
                                            <Text family="medium" style={{ marginTop: 3 }}>{item?.ProfitData?.totalRoi}</Text>
                                        </View>
                                        <View style={styles.rightContent}>
                                            <Text color={Colors.brand} family="medium">{capitalizeFirst(item?.copierStatus)}</Text>
                                        </View>
                                    </Flexcomponent>
                                </Card>
                            )
                        }}
                        ListEmptyComponent={
                            <View style={styles.noData}>
                                <NoData />
                            </View>
                        }
                    />
            }
        </View>
    )

}

export default CopyTradeHistory;