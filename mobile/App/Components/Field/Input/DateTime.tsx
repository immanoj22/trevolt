import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import Sheet from "../../bottomsheet";
import FormGroup from "../FormGroup";
import { DateTimeInputProps } from "../inputType";
import ThemeContext from "../../../Utilities/themecontext";
import { windowheight } from "../../../Utilities/dimensions";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import { getDateTimeFormat } from "../../../Utilities/dateTime";

// SWITCHED (2026-09-02) from react-native-date-picker to @react-native-community/
// datetimepicker - the standard, actively-maintained RN Community picker (already
// in package.json, previously unused). react-native-date-picker's built-in `modal`
// wraps a persistent React-controlled native view behind a `useModal` hook that
// re-presents itself if it re-renders at the wrong moment - which is what caused
// the "opens today, tap a wheel, jumps back to today" bug (a second native picker
// getting stacked on top, see project_datepicker_glitch_unstable_dates memory).
// This package sidesteps that entirely with a different shape per platform:
//   - Android: DateTimePickerAndroid.open() is a ONE-SHOT imperative call - it opens
//     the real android.app.DatePickerDialog and resolves via a callback. There is no
//     persistent component subscribed to our re-renders, so there is nothing to
//     double-present.
//   - iOS: the picker only exists as an always-inline native view (no built-in
//     modal), so we host it ourselves inside this app's existing bottom-sheet
//     component with our own Cancel/Done row - full control, no library-internal
//     "modal" state machine involved at all.

// Stable "primitive" key for a Date-ish value, bucketed to the minute, so the
// maximumDate/minimumDate useMemos below don't recompute on every render just
// because a caller passed `new Date()` inline (which differs by milliseconds).
const dateKey = (d: any): number | null => {
    if (!d) return null;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return null;
    return Math.floor(t / 60000);
};

const toDate = (d: any): Date => {
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const InputDateTime: React.FC<DateTimeInputProps> = ({
    value,
    inputType = "date",
    onConfirm,
    placeHolder = "Select",
    dateTimeFormat,
    datePickerProps,
    label,
    containerstyle,
    themes,
    restrictFuture,
    restrictPast,
    rightIcon
}) => {
    const theme = themes ?? useContext(ThemeContext)
    const sheetref = useRef<BottomSheetModal>(null);
    // What the iOS spinner is currently showing, ahead of the user tapping Done.
    const [draftDate, setDraftDate] = useState<Date>(() => toDate(value));

    const propMaxKey = dateKey(datePickerProps?.maximumDate);
    const propMinKey = dateKey(datePickerProps?.minimumDate);

    const maximumDate = useMemo(() => {
        if (propMaxKey != null) return new Date(propMaxKey * 60000);
        return restrictFuture ? new Date() : undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propMaxKey, !!restrictFuture]);

    const minimumDate = useMemo(() => {
        if (propMinKey != null) return new Date(propMinKey * 60000);
        return restrictPast ? new Date() : undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propMinKey, !!restrictPast]);

    // Parent passes `onConfirm` as an inline arrow - read the latest one through a
    // ref so none of the callbacks below need it as a dependency.
    const onConfirmRef = useRef(onConfirm);
    onConfirmRef.current = onConfirm;

    const openPicker = useCallback(() => {
        const seed = toDate(value);
        setDraftDate(seed);
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: seed,
                // Android's native dialog only does date OR time, never both at
                // once - every caller in this app uses "date", so that's the only
                // mode that matters here.
                mode: inputType === "time" ? "time" : "date",
                maximumDate,
                minimumDate,
                onChange: (event, date) => {
                    // "dismissed" = user cancelled (back button / tap outside) -
                    // matches the old onCancel behaviour of leaving value alone.
                    if (event.type === "set" && date) {
                        onConfirmRef.current && onConfirmRef.current(date);
                    }
                },
            });
        } else {
            sheetref.current?.present();
        }
    }, [value, inputType, maximumDate, minimumDate]);

    const confirmIOS = useCallback(() => {
        sheetref.current?.dismiss();
        onConfirmRef.current && onConfirmRef.current(draftDate);
    }, [draftDate]);

    const cancelIOS = useCallback(() => {
        sheetref.current?.dismiss();
    }, []);

    return (
        <FormGroup themes={themes} label={label} containerprops={[{ height: windowheight * 0.06 }, containerstyle]}>
            <Pressable onPress={openPicker} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Text style={value ? { color: theme.textinput, fontSize: Fontsize.semimedium } : { color: Colors.grey, fontSize: Fontsize.semimedium }}>
                    {value ? getDateTimeFormat(value, inputType, dateTimeFormat) : placeHolder}
                </Text>
                {rightIcon ? <View>{rightIcon}</View> : null}
            </Pressable>

            {Platform.OS === "ios" && (
                <Sheet sheetref={sheetref} custominterface snappoint={["38%"]}>
                    <View style={{ flex: 1, paddingHorizontal: "5%", paddingTop: "4%" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: "4%" }}>
                            <Pressable onPress={cancelIOS} hitSlop={12}>
                                <Text style={{ color: theme.secondarytext, fontSize: Fontsize.semimedium }}>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={confirmIOS} hitSlop={12}>
                                <Text style={{ color: Colors.brand, fontSize: Fontsize.semimedium, fontWeight: "600" }}>Done</Text>
                            </Pressable>
                        </View>
                        <DateTimePicker
                            value={draftDate}
                            mode={inputType}
                            display="spinner"
                            themeVariant={theme.theme === "dark" ? "dark" : "light"}
                            maximumDate={maximumDate}
                            minimumDate={minimumDate}
                            onChange={(_event, date) => {
                                if (date) setDraftDate(date);
                            }}
                        />
                    </View>
                </Sheet>
            )}
        </FormGroup>
    );
};

export default InputDateTime;
