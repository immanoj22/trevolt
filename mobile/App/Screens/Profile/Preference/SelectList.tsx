import React, { useContext } from 'react';
import { FlatList, StyleSheet, Pressable, View } from 'react-native';

import Text from '../../../Components/text';
import { Colors } from '../../../Utilities/uiasset';
import VectorIcons from '../../../Utilities/vectoricons';
import ThemeContext from '../../../Utilities/themecontext';

type Option = {
    label: string;
    value: string;
    addIcon?: React.ReactNode;
    activetext?: string;
    flag?: any
};

type Props = {
    title?: string;
    options?: Option[];
    selectedValue?: any;
    onChange?: (value: string) => void;
    activetext?: string
};

const SelectList: React.FC<Props> = ({
    options,
    onChange,
}) => {
    const theme = useContext(ThemeContext)
    return (
        <>
            <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                    return (
                        <Pressable
                            style={styles.option}
                            onPress={() => onChange?.(item.value)}
                            hitSlop={5}
                        >
                            <View style={{ flexDirection: "row" }}>
                                <Text style={{ color: item.flag ? theme.darktext : Colors.warmgrey }}>{item.label}  </Text>
                                {item.addIcon && (item.addIcon)}
                            </View>
                            <VectorIcons
                                family="Feather"
                                name="check"
                                iconcolor={item.flag ? Colors.brand : Colors.warmgrey}
                                size={18}
                            />
                        </Pressable>
                    )
                }
                }
            />

        </>
    );
};

export default SelectList;

const styles = StyleSheet.create({
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: "8%"
    },
});