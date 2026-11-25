import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { FieldInputProps } from '../inputType';
import ThemeContext from '../../../Utilities/themecontext';
import VectorIcons from '../../../Utilities/vectoricons';
import { windowheight } from '../../../Utilities/dimensions';
import { Colors, Fontfamily, Fontsize } from '../../../Utilities/uiasset';

// Rounds to 2dp and drops trailing zeros, so a value coming from the slider
// (e.g. 32.230000000000004, a normal JS float artifact) displays as "32.23"
// instead of the raw float once it's synced back into the (non-focused) field.
const formatDisplayValue = (value: any) => {
    const num = Number(value);
    if (!isFinite(num)) return String(value ?? 0);
    return String(parseFloat(num.toFixed(2)));
};

const NumberInput: React.FC<FieldInputProps> = ({
    initialValue,
    onValueChange,
    themes,
    boxstyle,
    increment,
    decrement,
    onChange,
    disabled,
    onBlur,
    max,
    min,
}) => {

    const theme = themes ?? useContext(ThemeContext)
    const style = styles(theme);
    const [value, setValue] = useState(formatDisplayValue(initialValue));
    const [isFocused, setIsFocused] = useState(false);
    // Android's controlled TextInput resets the cursor to the end on every
    // setState-driven re-render unless `selection` is explicitly restored to
    // where the user just typed - without this, typing anywhere but the very
    // end of the value keeps snapping the cursor away as you type.
    const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);

    // Re-sync from the parent's initialValue only while the field isn't being
    // typed into - otherwise onValueChange -> parent state update -> a new
    // initialValue prop -> this effect would overwrite the in-progress
    // keystroke/cursor with whatever the parent last accepted, which read as
    // the value "changing itself" while typing (also broke typing decimals,
    // since a rejected/clamped parent value would snap the field back).
    // If something OTHER than typing changes the value while this field is
    // focused (e.g. dragging the leverage slider), the caller is expected to
    // blur this field first (see Leverage.tsx's Slider onSlidingStart) so this
    // effect's normal !isFocused path picks up the new value correctly.
    useEffect(() => {
        if (!isFocused) {
            setValue(formatDisplayValue(initialValue));
        }
    }, [initialValue, isFocused]);

    const numericMax = max !== undefined && max !== null ? Number(max) : undefined;
    const numericMin = min !== undefined && min !== null ? Number(min) : undefined;
    const currentValue = Number(value) || 0;
    const atMax = numericMax !== undefined && currentValue >= numericMax;
    const atMin = numericMin !== undefined && currentValue <= numericMin;

    const handleIncrement = () => {
        // Previously always applied +1 regardless of any parent-side max - typed
        // input was validated via onValueChange's false-return veto, but these
        // buttons never went through that at all, so it was possible to hold +
        // straight past a pair's max_leverage.
        if (disabled || atMax) return;
        const newValue = numericMax !== undefined ? Math.min(currentValue + 1, numericMax) : currentValue + 1;
        setValue(String(newValue));
        setSelection(undefined);
        onValueChange?.(newValue);
    };

    const handleDecrement = () => {
        // Same gap as handleIncrement, in reverse - nothing stopped this going
        // below 1 (or whatever the caller's real minimum is).
        if (disabled || atMin) return;
        const newValue = numericMin !== undefined ? Math.max(currentValue - 1, numericMin) : currentValue - 1;
        setValue(String(newValue));
        setSelection(undefined);
        onValueChange?.(newValue);
    };

    const handleChange = (text: string) => {
        // Callers (e.g. Leverage.tsx) validate the typed text and return `false`
        // to reject characters they don't want (like a comma) - only reflect the
        // keystroke in the box when it's actually accepted, otherwise the invalid
        // character stayed visible here even though the parent never stored it.
        if (onValueChange?.(text) === false) return;
        setValue(text);
    };

    return (
        <View style={style.inputWrapper}>
            <Pressable onPress={handleDecrement ?? decrement} disabled={disabled || atMin}>
                <VectorIcons
                    family="AntDesign"
                    name="minus"
                    iconcolor={disabled || atMin ? Colors.grey : theme.theme === "dark" ? Colors.white : Colors.dune}
                    size={18}
                />
            </Pressable>
            <TextInput
                editable={!disabled}
                style={[style.input, boxstyle]}
                value={value}
                selection={selection}
                keyboardType="decimal-pad"
                onChangeText={onChange ? onChange : handleChange}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => { setIsFocused(false); setSelection(undefined); onBlur?.(e); }}
            />
            <Pressable onPress={handleIncrement ?? increment} disabled={disabled || atMax}>
                <VectorIcons
                    family="Ionicons"
                    name="add"
                    iconcolor={disabled || atMax ? Colors.grey : theme.theme === "dark" ? Colors.white : Colors.dune}
                    size={18}
                />
                
            </Pressable>
        </View>

    );
};

const styles = (theme: any) => StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 10,
        height: windowheight * 0.06,
        backgroundColor: theme.theme === "dark" ? "#0A101C" : Colors.white,
        borderColor: theme.theme === "dark" ? "#2F2F2F" : theme.boderColor,
        paddingHorizontal: '3%',
        justifyContent: "center",
    },
    input: {
        width: 40,
        textAlign: 'center',
        color: theme.darktext,
        fontFamily: Fontfamily.regular,
        fontSize: Fontsize.semimedium,
        marginHorizontal: 8,
    },

});

export default NumberInput;