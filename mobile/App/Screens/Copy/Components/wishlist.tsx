import React from "react";
import { FlatList, View } from "react-native";

import Trade from "./Trade";
import NoData from "../../../Components/Nodata";
import Loadercomponent from "../../../Components/loadercomponent";

interface Wishlistcomponentprops {
    isLoading?: any
    favourite?: any
}

const Wishlistcomponent: React.FC<Wishlistcomponentprops> = ({ isLoading, favourite }) => {
    return (
        <>
            {
                isLoading ?
                    <Loadercomponent /> :
                    <FlatList
                        data={favourite}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            return (
                                <Trade item={item} favourite={favourite} />
                            )
                        }}
                        ListEmptyComponent={
                            <View style={{ marginTop: "50%" }}>
                                <NoData />
                            </View>}
                    />
            }
        </>
    )

}

export default Wishlistcomponent;