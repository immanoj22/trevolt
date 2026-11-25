import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import { Button, Dropdown } from "../../../Components/Field";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { income, occuptation } from "../../../Utilities/helerfunction";
import { useAdditionalVerificationMutation } from "../../../Slices/auth";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AdditionalDetails'>;

const AdditionalDetails: React.FC<Props> = () => {
    const { theme, navigation, failuretoast, successtoast } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);
    const { kycfinancialStatus } = useSelector((state: any) => state.auth.userData);
    const [exposed, setExposed] = useState("");
    const [occuptations, setOccuptations] = useState("");
    const [incomes, setIncome] = useState("");
    const [isSubmit, setIsSubmit] = useState<boolean>(false);

    const [additionalVerify, { isLoading, error }] = useAdditionalVerificationMutation();

    useApiError(error);

    const handleSubmit = async () => {
        setIsSubmit(true)
        const payload = {
            occupation: occuptations,
            income: incomes,
            politicallyExposed: exposed
        }
        const response = await additionalVerify(payload).unwrap();
        if (response.success) {
            await triggeruserdetails();
            successtoast("Success", response.message);
            navigation.navigate("Verification", { popup: true })
            setIsSubmit(false)
        } else {
            failuretoast(response?.message ?? "Something went wrong. Please try again.")
            setIsSubmit(false)
        }
    }


    useEffect(() => {
        if (kycfinancialStatus == 'approved' && !isSubmit) {
            navigation.navigate("Verification", { popup: true })
        }
    }, [kycfinancialStatus])

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"Additional Details"}
            isscollable={true}
            onleftfn={() => navigation.navigate("Verification")}
            bottomContent={
                <Button
                    title="Procced"
                    loading={isLoading}
                    onPress={handleSubmit}
                    textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Text size="medium" style={{ marginBottom: "5%" }}>Please verify and fill in accurate details for faster approval</Text>
                <Dropdown
                    list={occuptation}
                    placeholder="What is your Occuptions ?*"
                    onChange={(item) => setOccuptations(item.value)}
                />
                <Dropdown
                    list={income}
                    placeholder="Income ?*"
                    onChange={(item) => setIncome(item.value)}
                />
                <Text size="medium">Are you politically exposed?</Text>
                <Flexcomponent alignItems="center" justifyContent="flex-start" top={"3%"}>
                    <View style={{ flexDirection: 'row', alignItems: "center" }}>
                        <Pressable style={[style.select, { backgroundColor: theme.theme === "dark" ? Colors.dune : exposed === "no" ? Colors.brand : theme.card, }]} onPress={() => setExposed("no")}>
                            {
                                exposed === "no" && (
                                    <VectorIcons
                                        family="Octicons"
                                        name="dot-fill"
                                        iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                        size={windowwidth * 0.055}
                                    />
                                )
                            }
                        </Pressable>
                        <Text>  No    </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: "center" }}>
                        <Pressable style={[style.select, { backgroundColor: theme.theme === "dark" ? Colors.dune : exposed === "yes" ? Colors.brand : theme.card, }]} onPress={() => setExposed("yes")}>
                            {
                                exposed === "yes" && (
                                    <VectorIcons
                                        family="Octicons"
                                        name="dot-fill"
                                        iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                        size={windowwidth * 0.055}
                                    />
                                )
                            }
                        </Pressable>
                        <Text>  Yes</Text>
                    </View>
                </Flexcomponent>
                <Text style={{ marginTop: '6%' }}>A Politically Exposed Person (PEP) is an individual who holds an important public position, domestically or Internationally...</Text>
            </View>
        </Mainview>
    )

}

export default AdditionalDetails;