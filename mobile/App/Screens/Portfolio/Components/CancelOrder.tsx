import React, { useContext, useState } from "react";
import { Pressable, View } from "react-native";

import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import Sheet from "../../../Components/bottomsheet";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import ThemeContext from "../../../Utilities/themecontext";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";
import { setCancelOrders, useCancelAllOrdersMutation } from "../../../Slices/future";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

interface ConfirmProps {
    ref?: any;
}

const CancelOrder: React.FC<ConfirmProps> = ({ ref }) => {
    const { successtoast, closebottomsheet, dispatch } = useCustomHooks();
    const theme = useContext(ThemeContext);
    const style = styles(theme);
    const [cancelAllOrders, { isLoading, error }] = useCancelAllOrdersMutation();

    const [isOpen, setIsOpen] = useState(false);
    const [isStop, setIsStop] = useState(false);

    useApiError(error);

    const handelCancelAllOrders = async () => {
        const payload = {
            orderId: "all",
            isOpen,
            isStop
        }
        const response = await cancelAllOrders(payload).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            dispatch(setCancelOrders({
                cancelOrdersList: [],
                cancelType: ''
            }))
            closebottomsheet(ref)
        }
    }

    return (
        <Sheet
            sheetref={ref}
            snappoint={["35%"]}
            custominterface={true}
            backgroundStyle={style.border}
        >
            <View style={style.header}>
                <Flexcomponent justifyContent="space-between" alignItems="center">
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>Cancel all orders</Text>
                    <Pressable onPress={() => closebottomsheet(ref)}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </Flexcomponent>
            </View>
            <View style={style.containerCon}>
                <Text size="tiny" color={theme.darktext}>All open orders of the selected types will be cancelled</Text>
                <Flexcomponent style={{ marginVertical: 20 }} justifyContent="flex-start">

                    <Input
                        type="checkbox"
                        label="Limit orders"
                        themes={theme}
                        labelStyle={{ color: theme.darktext }}
                        boxstyle={{ backgroundColor: theme.card }}
                        onChange={(e) => setIsOpen(e)}
                    />
                    <Input
                        type="checkbox"
                        label="Stop orders"
                        themes={theme}
                        labelStyle={{ color: theme.darktext }}
                        boxstyle={{ backgroundColor: theme.card }}
                        checkboxstyle={{ marginLeft: 20 }}
                        onChange={(e) => setIsStop(e)}
                    />
                </Flexcomponent>
                <Flexcomponent justifyContent="flex-end" style={{ marginTop: 10 }}>
                    <Button
                        title="Confirm"
                        buttonStyle={{ width: windowwidth * 0.30 }}
                        loading={isLoading}
                        disabled={!isOpen && !isStop}
                        onPress={handelCancelAllOrders}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </Flexcomponent>
            </View>
        </Sheet>
    )

}

export default CancelOrder;