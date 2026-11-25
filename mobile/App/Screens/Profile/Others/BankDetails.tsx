import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import { authSelector } from "../../../Slices/auth";
import { setBankparams } from "../../../Slices/helper";
import VectorIcons from "../../../Utilities/vectoricons";
import Flexcomponent from "../../../Components/flexcomponent";
import { borderradius, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";

import { useDeletebankMutation, useSetdefaultbankMutation } from "../../../Slices/wallet";


import { styles } from "../styles";
import LinearGradient from "../../../Components/lineargradient";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'BankDetails'>;

const BankDetails: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, dispatch, copyData } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);
    const { userData } = useSelector(authSelector)
    const accounts = userData?.bankAccounts

    // Users may hold at most 3 bank accounts - block adding a 4th.
    const MAX_BANK_ACCOUNTS = 3
    const bankLimitReached = (accounts?.length ?? 0) >= MAX_BANK_ACCOUNTS

    const goToAddBank = () => {
        if (bankLimitReached) {
            failuretoast("Limit reached", `You can add a maximum of ${MAX_BANK_ACCOUNTS} bank accounts`)
            return
        }
        dispatch(setBankparams({ type: "add", value: "" }))
        navigation?.navigate("AddBankDetail")
    }

    // const [selected, setSelected] = useState(0);
    const [selected, setSelected] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (accounts?.length) {
            const primary = accounts.find((acc: any) => acc.isPrimary);
            setSelected(primary ? primary._id : accounts[0]._id);
        }
    }, [accounts]);

    const [setdefaultbank] = useSetdefaultbankMutation();

    // const handleChange = (index: number) => {
    //     setSelected(index)
    // }

    const handleChange = async (item: any) => {
        if (updatingId) return;
        const prevSelected = selected;
        setSelected(item._id); // optimistic update
        setUpdatingId(item._id);

        try {
            const payload = { accountNo: item?.accountNo };
            const response = await setdefaultbank(payload).unwrap();
            if (response?.success) {
                await triggeruserdetails()
                successtoast("Updated!", "Default bank account updated");
            } else {
                setSelected(prevSelected);
            }
        } catch (e) {
            setSelected(prevSelected);
            failuretoast("Error", "Failed to update default bank");
        } finally {
            setUpdatingId(null);
        }
    }

    const [deletebank] = useDeletebankMutation()
    const deletfn = async (item: any) => {
        if (deletingId) return;
        setDeletingId(item._id);
        try {
            const payload = {
                accountNo: item?.accountNo
            }
            const response = await deletebank(payload).unwrap()
            if (response.success) {
                await triggeruserdetails()
                successtoast("Deleted!", "Bank detail deleted successfully")
            }
        } finally {
            setDeletingId(null);
        }
    }
    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle={"Bank Details"}
            onleftfn={() => navigation.goBack()}
            righticon={
                bankLimitReached ? undefined : (
                    <VectorIcons
                        family="Entypo"
                        name={"plus"}
                        size={windowwidth * 0.075}
                    />
                )
            }
            isnodata={accounts?.length < 1}
            customnodata={
                <View style={style.container}>
                    <Text size="medium">Add Bank Details</Text>
                    <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}>To ensure smooth withdrawals and comply with regulations, please verify your bank account.</Text>
                    <View style={style.bottomButton}>
                        {/* <Button
                            title="Add"
                            onPress={() => {
                                const payload = {
                                    type: "add",
                                    value: ""
                                }
                                dispatch(setBankparams(payload))
                                navigation?.navigate("AddBankDetail")
                            }
                            }
                        /> */}
                        <Pressable onPress={() => {
                            const payload = {
                                type: "add",
                                value: ""
                            }
                            dispatch(setBankparams(payload))
                            navigation?.navigate("AddBankDetail")
                        }
                        } style={{ marginTop: "6%" }}>
                            <LinearGradient
                                colors={["#2563EB", "#2563EB"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: borderradius * 3, paddingVertical: "4%", alignItems: "center" }}
                            >
                                <Text family="semiBold" color={theme.theme == 'dark' ? Colors.black : Colors.white}>Add</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            }
            onrightfn={goToAddBank}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <FlatList
                data={accounts}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                renderItem={({ item, index }) => {
                    // const selectedAccount = item.id === selected
                    const selectedAccount = item._id === selected

                    return (
                        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ height: "auto", justifyContent: "center", alignItems: "center", marginVertical: 10, padding: 10, width: "100%" }}>

                            {/* <View style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
                                <Pressable onPress={() => handleChange(index)} style={[selectedAccount && { backgroundColor: theme.textinput }, { width: windowwidth * 0.05, height: windowwidth * 0.05, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 2, borderColor: theme.textinput }]}>
                                    {
                                        selectedAccount && (
                                            <VectorIcons
                                                family="Feather"
                                                name="check"
                                                iconcolor={Colors.darkgray}
                                                size={windowwidth * 0.04}
                                            />
                                        )
                                    }
                                </Pressable>


                                <Pressable onPress={() => handleChange(item)} style={[selectedAccount && { backgroundColor: theme.textinput }, { width: windowwidth * 0.05, height: windowwidth * 0.05, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 2, borderColor: theme.textinput }]}>
                                    {
                                        selectedAccount && (
                                            <VectorIcons
                                                family="Feather"
                                                name="check"
                                                iconcolor={Colors.darkgray}
                                                size={windowwidth * 0.04}
                                            />
                                        )
                                    }
                                </Pressable>
                            </View> */}

                            <View style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
                                <Pressable
                                    onPress={() => handleChange(item)}
                                    disabled={!!updatingId}
                                    style={[
                                        selectedAccount
                                            ? { backgroundColor: Colors.brand, borderColor: Colors.brand }
                                            : { backgroundColor: 'transparent', borderColor: theme.textinput },
                                        { width: windowwidth * 0.05, height: windowwidth * 0.05, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 2 }
                                    ]}
                                >
                                    {
                                        selectedAccount && (
                                            <VectorIcons
                                                family="Feather"
                                                name="check"
                                                iconcolor={theme.theme === "dark" ? "#FFFFFF" : "#FFFFFF"}
                                                size={windowwidth * 0.04}
                                            />
                                        )
                                    }
                                </Pressable>
                            </View>


                            <View style={{ width: "100%" }}>
                                <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>Bank Name</Text>
                                        <Text style={{ marginTop: 8 }}>{item?.bankName}</Text>
                                    </View>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>Account Number</Text>
                                        <Text family="regular" style={{ marginTop: 8 }}>{item?.accountNo}</Text>
                                    </View>
                                </Flexcomponent>

                                <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>IFSC</Text>
                                        <Text family="regular" style={{ marginTop: 8 }}>{item?.bankcode}</Text>
                                    </View>
                                </Flexcomponent>

                                <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>Holder Name</Text>
                                        <Text family="regular" style={{ marginTop: 8 }}>{item?.holderName}</Text>
                                    </View>
                                </Flexcomponent>
                            </View>
                            <Flexcomponent width={"40.5%"} justifyContent="space-between" style={{ alignSelf: "flex-end" }} >
                                <Pressable onPress={() => copyData(item?.accountNo)}
                                 style={{ backgroundColor: theme.background, width: windowwidth * 0.1, height: windowwidth * 0.1, borderRadius: borderradius * 3, justifyContent: "center", alignItems: "center" }} >
                                    <VectorIcons
                                        family="AntDesign"
                                        name={"copy1"}
                                        size={windowwidth * 0.05}
                                        iconcolor={theme.activetab}
                                    />
                                </Pressable>
                                <Pressable onPress={() => {
                                    const payload = {
                                        type: "edit",
                                        value: item
                                    }
                                    dispatch(setBankparams(payload))
                                    navigation?.navigate("AddBankDetail")
                                }} style={{ backgroundColor: theme.background, width: windowwidth * 0.1, height: windowwidth * 0.1, borderRadius: borderradius * 3, justifyContent: "center", alignItems: "center" }} >
                                    <VectorIcons
                                        family="AntDesign"
                                        name={"edit"}
                                        size={windowwidth * 0.05}
                                        iconcolor={theme.activetab}
                                    />
                                </Pressable>
                                <Pressable onPress={() => Commonalert({
                                    title: "Alert!",
                                    des: "Are you sure want to delete this account",
                                    yes: () => deletfn(item)
                                })} disabled={!!deletingId} style={{ backgroundColor: theme.background, width: windowwidth * 0.1, height: windowwidth * 0.1, borderRadius: borderradius * 3, justifyContent: "center", alignItems: "center" }} >
                                    <VectorIcons
                                        family="AntDesign"
                                        name={"delete"}
                                        size={windowwidth * 0.05}
                                        iconcolor={"red"}
                                    />
                                </Pressable>
                            </Flexcomponent>
                        </Card>
                    )
                }}
            />
        </Mainview>
    )

}

export default BankDetails;