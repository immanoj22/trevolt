import React, { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { LinearGradient } from "../../Components/lineargradient";

import Text from "../../Components/text";
import VectorIcons from "../../Utilities/vectoricons";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import Images from "../../Utilities/images";

interface ExploreProps {
    data?: any[];
}

const Announcments: React.FC<ExploreProps> = ({ data = [] }) => {
    const { theme } = useCustomHooks();
    const [visible, setVisible] = useState(true);

    if (!visible) return null;
    if (!data?.length) return null;

    return (
        <View style={{ width: "100%", marginTop: "5%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "600" }} color={theme.darktext}>Announcement</Text>

                    <Images
                        type="svg"
                        name={"Announcement"}
                        width={windowwidth * 0.06}
                        height={windowwidth * 0.06}
                        style={{ marginLeft: 9 }}
                    />
                </View>

                <Pressable onPress={() => setVisible(false)} hitSlop={10}>
                    <VectorIcons
                        family="Ionicons"
                        name="close"
                        size={windowwidth * 0.055}
                        iconcolor={theme.theme == 'dark' ? "#A2A2A2" : "#0000"}
                    />
                </Pressable>
            </View>

            <FlatList
                horizontal
                data={data}
                keyExtractor={(item: any, index) => item?._id ?? `${index}`}
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: "3%" }}
                renderItem={({ item }: any) => {
                    const content = (
                        <>
                            <Text color={theme.darktext} size="medium" style={{ marginRight: "10%", fontSize: 14, fontWeight: "600" }} family="medium">
                                {item?.title || "New Listing Event"}
                            </Text>

                            <Text family="regular" color={theme.homegreen} style={{ fontSize: 12, marginTop: 6 }}>
                                {item?.description}
                            </Text>
                        </>
                    );

                    return (
                        <LinearGradient
                            colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.02)"]}
                            locations={[0.0585, 0.9401]}
                            start={{ x: 0.0315, y: 0.3255 }}
                            end={{ x: 0.9685, y: 0.6745 }}
                            style={{ borderRadius: borderradius * 1, padding: 1, marginRight: windowwidth * 0.02, width: windowwidth * 0.9 }}
                        >
                            <LinearGradient
                                colors={theme.theme == 'dark' ? ["rgba(15, 47, 94, 0.5)", "rgba(0, 0, 0, 0.5)"] : ["#FFFFFF", "#EEF4FF"]}
                                locations={[0.1092, 0.964]}
                                start={{ x: 0.0504, y: 0.2812 }}
                                end={{ x: 0.9496, y: 0.7188 }}
                                style={{ borderRadius: borderradius * 1, padding: "5%" }}
                            >
                                {content}
                            </LinearGradient>
                        </LinearGradient>
                    );
                }}
            />
        </View>
    );
};

export default Announcments;
