import { ReactNode } from "react";
import { StyleProp, TextInputProps, TextProps, TextStyle, ViewStyle } from "react-native";

// Only maximumDate/minimumDate are ever set by a caller (InputDateTime folds them
// into its own stable useMemo, keeping every other picker prop internal) - kept
// deliberately narrower than @react-native-community/datetimepicker's own prop
// union, which differs per platform and isn't meant to be spread wholesale.
export interface DateTimePickerOptions {
    maximumDate?: Date;
    minimumDate?: Date;
}

export interface FieldInputProps extends TextInputProps {
    type?: 'search' | 'calculator' | 'checkbox';
    value?: any;
    label?: string;
    disabled?: any;
    placeHolder?: string;
    placeholderTextColor?: string;
    onChange?: (text: any) => void;
    secureTextEntry?: boolean;
    rightContent?: React.ReactNode;
    rightContentClick?: () => void;
    style?: any;
    labelStyle?: StyleProp<TextStyle>;
    error?: string
    initial?: any;
    leftContent?: React.ReactNode;
    placeholder?: string,
    initialValue?: any;
    onValueChange?: (newValue: any) => void | boolean;
    containerprops?: StyleProp<ViewStyle>,
    background?: string,
    checkboxlabelprops?: TextProps,
    activecheckboxcolor?: string,
    checkboxstyle?: StyleProp<ViewStyle>,
    boxstyle?: StyleProp<ViewStyle>,
    themes?: any,
    bottom?: any
    errorMessage?: any,
    isValid?: any,
    inputprops?: TextInputProps,
    increment?: any;
    decrement?: any;
    // Enforced by NumberInput's own +/- buttons, which otherwise always applied
    // the step regardless of any parent-side bounds (typing was validated via
    // onValueChange's false-return veto, but the buttons never went through it).
    max?: any;
    min?: any;
    custom?: any,
    check?: any
    activecheckbox?: any
    allowed?: any
    errorTextStyle?: any
    errorTextContainerStyle?: any
}

type InputType = "date" | "time" | "datetime";

export interface DateTimeInputProps {
    label?: string;
    value?: Date;
    inputType?: InputType;
    onConfirm?: any;
    placeHolder?: string;
    dateTimeFormat?: string;
    datePickerProps?: DateTimePickerOptions;
    containerstyle?: StyleProp<ViewStyle>,
    themes?: any;
    restrictFuture?: any;
    restrictPast?: any;
    rightIcon?: ReactNode;
}

export interface FormGroupProps {
    children?: ReactNode;
    disabled?: boolean;
    label?: string | false;
    labelStyle?: StyleProp<TextStyle>;
    rightContent?: React.ReactNode;
    background?: string,
    containerprops?: StyleProp<ViewStyle>,
    themes?: any,
    bottom?: any,
    leftContent?: React.ReactNode
    
}