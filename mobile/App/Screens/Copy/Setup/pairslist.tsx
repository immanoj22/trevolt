import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import Linecomponent from "../../../Components/line";
import { Button, Input } from "../../../Components/Field";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { style } from "../styles";

interface Pairsprops {
    sheetref: React.RefObject<BottomSheetModal | null>;
    onSelect?: any
    initialSelected?: any[]
}

const Pairs: React.FC<Pairsprops> = ({
    sheetref,
    onSelect,
    initialSelected
}) => {
    const { theme, closebottomsheet } = useCustomHooks();
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const styles = style(theme);

    const [selectedPairs, setSelectedPairs] = useState<any[]>(initialSelected || []);
    const [selectAll, setSelectAll] = useState(false);

    const toggleSelect = (pair: any) => {
        const exists = selectedPairs.some((p) => p.value === pair._id);
        if (exists) {
            const updated = selectedPairs.filter((p) => p.value !== pair._id);
            setSelectedPairs(updated);
        } else {
            const updated = [
                ...selectedPairs,
                { label: formatDisplayPair(pair.tickerRoot), value: pair._id }
            ];
            setSelectedPairs(updated);
        }
    };

    useEffect(() => {
        setSelectedPairs(initialSelected || []);
    }, [initialSelected]);

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPairs([]);
            setSelectAll(false);
        } else {
            const allPairs = futurePairData.map((pair: any) => ({
                label: formatDisplayPair(pair.tickerRoot),
                value: pair._id
            }));
            setSelectedPairs(allPairs);
            setSelectAll(true);
        }
    };

    useEffect(() => {
        const allSelected = selectedPairs.length === futurePairData.length;
        setSelectAll(allSelected);
    }, [selectedPairs]);

    return (
        <Sheet
            sheetref={sheetref}
            custominterface={true}
            snappoint={["35%"]}
        >
            <View style={styles.copyPair}>
                <Flexcomponent justifyContent="space-between" paddingVertical={"2.5%"}>
                    <Text color={theme.tabactive} >Select Copy Trading Pairs</Text>
                    <Flexcomponent justifyContent="flex-end" width={"45%"}>
                        <Text size="small" style={{ marginRight: "5%" }} color={theme.secondarytext}>Select all</Text>
                        <Input
                            type="checkbox"
                            initial={selectAll}
                            boxstyle={styles.check}
                            activecheckboxcolor={Colors.white}
                            activecheckbox={Colors.brand}
                            onChange={handleSelectAll}
                        />
                    </Flexcomponent>
                </Flexcomponent>
                <Linecomponent backgroundcolor={"#313131"} containerstyle={{ marginTop: "2.5%" }} />
                <View style={styles.copyPair}>
                    <BottomSheetFlatList
                         data={futurePairData}
                        keyExtractor={(item: any) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.list}
                        numColumns={3}
                        renderItem={({ item }) => {
                            const isSelected = selectedPairs.some((p) => p.value === item._id);
                            return (
                                <Pressable
                                    onPress={() => toggleSelect(item)}
                                    style={[styles.toggle, { backgroundColor: isSelected ? theme.theme === "dark" ? Colors.white : Colors.bgcolor : theme.card }]}>
                                    <Text color={isSelected ? Colors.black : theme.secondarytext} size="small">{item.baseCurrency}/{formatDisplayPair(item.quoteCurrency)}</Text>
                                </Pressable>
                            )
                        }}
                    />
                </View>
                <Button
                    title="Select"
                    onPress={() => {
                        closebottomsheet(sheetref)
                        onSelect(selectedPairs)
                    }}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            </View>
        </Sheet>
    )
}

export default Pairs;