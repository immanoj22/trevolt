import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { useLazyGetCopyTradeAssetsQuery } from "../../../Slices/copy";

import { style } from "../styles";

interface Orderprops {
    data?: any
}

const AssetsHistroy: React.FC<Orderprops> = ({ data }) => {
    const { theme } = useCustomHooks();
    const styles = style(theme);
    const [tradeassets, setTradeAssets] = useState<any>([]);

    const [tradeAssets, { isFetching }] = useLazyGetCopyTradeAssetsQuery();

    const handeTradeAssets = async (id: any) => {
        const params = {
            id: id
        }
        const response = await tradeAssets(params).unwrap();
        setTradeAssets(response?.result)
    }

    useFocusEffect(
        useCallback(() => {
            handeTradeAssets(data._id)
        }, [data])
    );

    return (
        <View style={styles.container}>
            {
                isFetching ?
                    <View style={styles.noData}>
                        <Loadercomponent />
                    </View> :
                    <FlatList
                        data={tradeassets}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ marginTop: 10 }}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.orderHistory}>
                                <View style={[styles.item, { marginBottom: "3%" }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Asset</Text>
                                </View>
                                <View style={[styles.item, { marginBottom: "3%" }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Amount</Text>
                                </View>
                            </View>
                        }
                        renderItem={({ item }) => {
                            return (
                                <View style={styles.orderItem}>
                                    <View style={[styles.item, { marginTop: "5%" }]}>
                                        <Text>{item.asset}</Text>
                                    </View>
                                    <View style={styles.item}>
                                        <Text>{item.amount}</Text>
                                    </View>
                                </View>
                            )
                        }}
                        ListEmptyComponent={
                            <View style={styles.noData}>
                                <NoData title="No Assets Found" />
                            </View>
                        }
                    />
            }
        </View>
    )
}

export default AssetsHistroy;