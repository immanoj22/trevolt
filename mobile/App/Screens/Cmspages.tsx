import React, { useCallback, useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, View } from "react-native";

import Mainview from "../Components/mainview";
import { windowheight } from "../Utilities/dimensions";
import useCustomHooks from "../Actions/Hooks/customhook";
import HtmlView from "../Components/DialogBox/HtmlView";
import { splitHtmlIntoChunks } from "../Utilities/htmlChunk";
import { useLazyCmsActionQuery } from "../Slices/cmsActions";
import { Stacknavigationtypes } from "../Navigations/navigationtypes";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Cmspage'>;

const renderChunk = ({ item }: { item: string }) => <HtmlView text={item} />;
const keyExtractor = (_item: string, index: number) => String(index);

const Cmspage: React.FC<Props> = ({ route }) => {
    const { theme, navigation, dispatch, cleardata } = useCustomHooks();

    const { name } = route.params;

    const [data, setData] = useState<any>([]);
    const [cmsAction, { isFetching }] = useLazyCmsActionQuery();

    const fetchCms = async (name: any) => {
        const response = await cmsAction(name).unwrap();
        if (response.success) {
            setData(response?.result);
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchCms(name);
        }, [name])
    );

    // A Terms of Service / Privacy Policy document can run long enough that
    // handing it whole to <RenderHtml> (inside HtmlView) parses and builds its
    // entire element tree in one synchronous JS-thread burst before anything
    // paints - that's what read as the screen freezing on open. Splitting it
    // into per-section chunks and handing those to a FlatList means only the
    // sections near the visible screen get parsed up front; the rest are
    // deferred until the user actually scrolls to them.
    const chunks = useMemo(() => splitHtmlIntoChunks(data?.content), [data?.content]);

    return (
        <Mainview
            iskeyboardaware={false}
            isscollable={false}
            headertitle={name}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1 }}>
                {
                    isFetching ?
                        <View style={{ alignItems: "center", justifyContent: "center", height: windowheight, marginTop: -55 }}>
                            <ActivityIndicator
                                size={"small"}
                                color={theme.tabactive}
                            />
                        </View>
                        :
                        <FlatList
                            data={chunks}
                            renderItem={renderChunk}
                            keyExtractor={keyExtractor}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={4}
                            maxToRenderPerBatch={4}
                            windowSize={5}
                            removeClippedSubviews
                        />
                }
            </View>
        </Mainview>
    )

}

export default Cmspage;