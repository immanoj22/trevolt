import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import Sheet from "../../../Components/bottomsheet";
import Linecomponent from "../../../Components/line";
import { Button, Input } from "../../../Components/Field";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { style } from "../styles";

interface Pairsprops {
    sheetref: React.RefObject<BottomSheetModal | null>;
    onSelect?: any;
    initialSelected?: any[];
    data?: any;
}

// Module constant - a fresh ["40%"] literal on every render would hand <Sheet> a
// new snapPoints array each time, making the sheet re-measure mid-open.
const SNAP_POINTS = ["40%"];

const removeDuplicates = (arr: any[]) =>
    arr.filter(
        (item, index, self) =>
            index === self.findIndex((t) => t.value === item.value)
    );

const Filter: React.FC<Pairsprops> = ({
    sheetref,
    onSelect,
    initialSelected,
    data,
}) => {
    const { theme, closebottomsheet } = useCustomHooks();
    const styles = style(theme);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);

    // Keyed on the *contents* of `data`, not its (often unstable) array reference.
    // A fresh `filteredData` array on every render fed the effects below and, with
    // a parent that re-renders on live data, spun a setState loop that tore this
    // bottom sheet down the instant it opened.
    const dataKey = React.useMemo(
        () => (Array.isArray(data) ? [...data].join(",") : String(data ?? "")),
        [data],
    );

    const filteredData = React.useMemo(() => {
        const ids = new Set(Array.isArray(data) ? data : []);
        return (futurePairData ?? []).filter((item: any) => ids.has(item._id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [futurePairData, dataKey]);

    const [selectedPairs, setSelectedPairs] = useState<any[]>([]);

    // Derived, not state+effect - the old effect wrote state on every render where
    // `filteredData` was a new array, which was part of the loop above.
    const selectAll =
        filteredData.length > 0 && selectedPairs.length === filteredData.length;

    const normalizeSelected = (list: any[]) => {
        return list.map((item) => {
            if (typeof item === "string") {
                const match = futurePairData.find((p: any) => p._id === item);
                return match
                    ? { label: formatDisplayPair(match.tickerRoot), value: match._id }
                    : { label: item, value: item };
            }
            return item;
        });
    };

    // Re-seed the selection only when the actual set of ids changes - not on every
    // new `initialSelected` array reference the parent hands down.
    const initialSelectedKey = React.useMemo(() => {
        if (!Array.isArray(initialSelected) || initialSelected.length === 0) return "";
        return initialSelected
            .map((x: any) => (typeof x === "string" ? x : x?.value ?? x?._id ?? ""))
            .join(",");
    }, [initialSelected]);

    useEffect(() => {
        if (!initialSelectedKey) return;
        setSelectedPairs(removeDuplicates(normalizeSelected(initialSelected ?? [])));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSelectedKey, futurePairData?.length]);


    const toggleSelect = (pair: any) => {
        const exists = selectedPairs.some((p) => p.value === pair._id);

        if (exists) {
            setSelectedPairs((prev) => prev.filter((p) => p.value !== pair._id));
        } else {
            setSelectedPairs((prev) =>
                removeDuplicates([
                    ...prev,
                    { label: formatDisplayPair(pair.tickerRoot), value: pair._id },
                ])
            );
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPairs([]);
        } else {
            const formatted = filteredData.map((p: any) => ({
                label: formatDisplayPair(p.tickerRoot),
                value: p._id,
            }));
            setSelectedPairs(removeDuplicates(formatted));
        }
    };

    return (
        <Sheet sheetref={sheetref} custominterface snappoint={SNAP_POINTS}>
            <View style={styles.copyPair}>
                <Flexcomponent justifyContent="space-between" paddingVertical="2.5%">
                    <Text color={theme.tabactive}>Select Copy Trading Pairs</Text>
                    <Flexcomponent justifyContent="flex-end" width="45%">
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
                <Linecomponent backgroundcolor="#313131" containerstyle={{ marginTop: "2.5%" }} />
                <View style={{ flex: 1, paddingTop: "2%" }}>
                    <BottomSheetFlatList
                        data={filteredData}
                        nestedScrollEnabled={true}
                        keyExtractor={(item: any) => item._id}
                        showsVerticalScrollIndicator={false}
                        numColumns={3}
                        contentContainerStyle={{ paddingBottom: 20 }}
                         renderItem={({ item }) => {
                            const isSelected = selectedPairs.some((p) => p.value === item._id);
                            return (
                                <Pressable
                                    onPress={() => toggleSelect(item)}
                                    style={[styles.toggle, { backgroundColor: isSelected ? theme.theme === "dark" ? Colors.white : Colors.bgcolor : theme.card }]}
                                >
                                    <Text color={isSelected ? Colors.black : theme.secondarytext} size="small">{item.baseCurrency}/{formatDisplayPair(item.quoteCurrency)}</Text>
                                </Pressable>
                            );
                        }}
                    />
                </View>
                <Button
                    title="Select"
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    onPress={() => {
                        closebottomsheet(sheetref);
                        onSelect(removeDuplicates(selectedPairs));
                    }}
                />
            </View>
        </Sheet>
    );
};

export default Filter;