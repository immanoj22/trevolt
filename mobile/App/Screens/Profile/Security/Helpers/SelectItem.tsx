import React, { useEffect, useState } from "react";
import { Pressable, View, FlatList } from "react-native";

import Text from "../../../../Components/text";
import Sheet from "../../../../Components/bottomsheet";
import { Colors } from "../../../../Utilities/uiasset";
import VectorIcons from "../../../../Utilities/vectoricons";
import { windowheight } from "../../../../Utilities/dimensions";
import Flexcomponent from "../../../../Components/flexcomponent";
import useCustomHooks from "../../../../Actions/Hooks/customhook";

import { styles } from "../../styles";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";

interface SelectProps {
    ref?: any;
    cancel?: () => void,
    onSelect?: (item: string) => void
    value?: any;
    data?: any[]
}

const SelectItem: React.FC<SelectProps> = ({
    ref,
    cancel = () => { },
    onSelect = () => { },
    value,
    data,
}) => {
    const { theme } = useCustomHooks();
    const style = styles(theme);
    const [selectedItem, setSelectedItem] = useState(value);

    const defaultData = [
        { id: "1", label: "Options", value: "options" },
        { id: "2", label: "Futures", value: "futures" },
    ]

    useEffect(
        () => {
            onSelect(selectedItem ?? "")
        }, [selectedItem]
    );

    return (
        <Sheet
            custominterface={true}
            sheetref={ref}
            snappoint={["28%"]}
            backgroundStyle={style.sheet}
        >
            <View style={{ paddingHorizontal: "5%", paddingTop: "2%" }}>
                <View>
                    <BottomSheetFlatList
                        data={data ? data : defaultData}
                        keyExtractor={(item) => item.id}
                        style={{ marginTop: 20 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const isSelected = selectedItem === item.value;
                            return (
                                <Pressable onPress={() => { setSelectedItem(item.value); cancel() }}>
                                    <Flexcomponent
                                        justifyContent="space-between"
                                        style={{
                                            marginVertical: 10,
                                            padding: 12,
                                            borderRadius: 8
                                        }}
                                    >
                                        <Text
                                            family="medium"
                                            size="semimedium"
                                            style={{
                                                color: isSelected ? theme.darktext : theme.graytext,
                                            }}
                                        >
                                            {item.label}
                                        </Text>

                                        {isSelected && (
                                            <VectorIcons
                                                family="Feather"
                                                name="check"
                                                iconcolor={Colors.brand}
                                                size={25}
                                            />
                                        )}
                                    </Flexcomponent>
                                </Pressable>
                            );
                        }}
                        ListEmptyComponent={() => (
                            <View
                                style={{
                                    height: windowheight * 0.5,
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <Text family="medium" size="small" style={{ marginTop: 10 }}>
                                    No Data Found
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </View>
        </Sheet>
    )

}

export default SelectItem;