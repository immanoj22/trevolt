import React, { useContext, useEffect } from "react";
import {
  View,
  Pressable,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler,
} from "react-native";
import { Portal } from "@gorhom/portal";

import { initialWindowMetrics } from "react-native-safe-area-context";

import Text from "./text";
import Images from "../Utilities/images";
import ThemeContext from "../Utilities/themecontext";
import { borderradius, windowwidth } from "../Utilities/dimensions";
import { Colors } from "../Utilities/uiasset";

interface Props {
  visible: boolean;
  children?: React.ReactNode;

  backgroundStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;

  opacity?: number;

  onDismiss?: () => void;
  onClose?: () => void;

  headertitle?: string;
  headerdescrption?: string;

  custominterface?: boolean;
  iskeyboardaware?: boolean;
}

const CenterModal: React.FC<Props> = ({
  visible,
  children,
  backgroundStyle = {},
  containerStyle = {},
  opacity = 0.6,
  onDismiss = () => {},
  onClose = () => {},
  headertitle,
  headerdescrption,
  custominterface,
  iskeyboardaware = true,
}) => {
  // Read theme straight from context, not via useCustomHooks() - that hook also
  // subscribes this component to the whole wallet slice, so every popup rendered
  // through CenterModal used to re-render on every price/balance socket tick.
  const theme = useContext(ThemeContext);
  const KeyboardWrapper: any = iskeyboardaware ? KeyboardAvoidingView : View;

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    // Rendered via Portal instead of a native <Modal> - stays inside the normal view
    // hierarchy (escapes any ScrollView it's opened from) and stacks above screen
    // content but below the app's permanent root FlashMessage, so a toast fired while
    // this is open is never hidden behind it and never gets torn down when this closes.
    <Portal>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: `rgba(0,0,0,${opacity})`,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <KeyboardWrapper
              {...(iskeyboardaware
                ? { behavior: Platform.OS === "ios" ? "padding" : "height" }
                : {})}
              style={{ width: "100%" }}
            >
              <View
                style={[
                  {
                    backgroundColor: theme.background,
                    borderRadius: borderradius,
                    overflow: "hidden",
                  },
                  backgroundStyle,
                  containerStyle,
                ]}
              >
                {custominterface ? (
                  children
                ) : (
                  <>
                    <View
                      style={{
                        backgroundColor: theme.bottomheader,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: "5%",
                        paddingVertical: "5%",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          family="medium"
                          size="medium"
                          style={{ color: theme.inversetext }}
                        >
                          {headertitle}
                        </Text>

                        {!!headerdescrption && (
                          <Text
                            family="medium"
                            size="semimedium"
                            style={{
                              color: theme.graytext,
                              marginTop: 5,
                            }}
                          >
                            {headerdescrption}
                          </Text>
                        )}
                      </View>

                      <Pressable onPress={onClose}>
                        <Images
                          type="svg"
                          name={
                            theme.theme === "dark"
                              ? "Bottomclose"
                              : "Bottomclosedark"
                          }
                          width={windowwidth * 0.07}
                          height={windowwidth * 0.07}
                        />
                      </Pressable>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: "7%",
                        paddingVertical: "5%",
                        paddingBottom:
                          (initialWindowMetrics?.insets?.bottom ?? 0) + 20,
                      }}
                    >
                      {children}
                    </View>
                  </>
                )}
              </View>
            </KeyboardWrapper>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Portal>
  );
};

export default CenterModal;
