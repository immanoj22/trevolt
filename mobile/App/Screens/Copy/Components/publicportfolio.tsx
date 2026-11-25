import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";

import Trade from "./Trade";
import NoData from "../../../Components/Nodata";
import Loadercomponent from "../../../Components/loadercomponent";

interface Publicportfolioprops {
    data?: any
    isLoading?: any
    favourite?: any
}

const Publicportfolio: React.FC<Publicportfolioprops> = ({ data, isLoading, favourite }) => {

    const [localFavourite, setLocalFavourite] = useState<any[]>(favourite ?? []);

    // ✅ Sync only when server data genuinely refreshes (not during refetch flicker)
    useEffect(() => {
        if (!isLoading && favourite !== undefined) {
            setLocalFavourite(favourite);
        }
    }, [favourite, isLoading]);

    const handleOptimisticToggle = (item: any) => {
        setLocalFavourite(prev => {
            const exists = prev.some((f: any) => f._id === item._id);
            return exists
                ? prev.filter((f: any) => f._id !== item._id)  // remove
                : [...prev, item];                               // add
        });
    };

    return (
        <>
            {
                isLoading ?
                    <Loadercomponent />
                    :
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            return (
                                // <Trade item={item} favourite={favourite} />
                                <Trade
                                    item={item}
                                    favourite={localFavourite}              // ← local copy
                                    onOptimisticToggle={handleOptimisticToggle}  // ← toggle callback
                                />
                            )
                        }}
                        ListEmptyComponent={
                            <View style={{ marginTop: "50%" }}>
                                <NoData />
                            </View>
                        }
                    />
            }
        </>
    )

}

export default Publicportfolio;