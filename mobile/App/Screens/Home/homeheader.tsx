// import React, { useEffect, useRef, useState } from "react";
// import { Animated, Pressable, View } from "react-native";
// import { useSelector } from "react-redux";

// import Text from "../../Components/text";
// import Images from "../../Utilities/images";
// import { Colors } from "../../Utilities/uiasset";
// import { helperSelector } from "../../Slices/helper";
// import VectorIcons from "../../Utilities/vectoricons";
// import useCustomHooks from "../../Actions/Hooks/customhook";
// import { borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";
// import { PROFILEURL } from "../../Actions/Constant/constant";
// import { isEmpty } from "../../Utilities/helerfunction";

// interface Homeheaderprops {

// }

// const Homeheader: React.FC<Homeheaderprops> = () => {
//     const { theme, navigation, failuretoast } = useCustomHooks()
//     const { kycStatus, profileImage } = useSelector((state: any) => state.auth.userData);
//     const { unreadCount } = useSelector(helperSelector)
//     const { futurePairData } = useSelector((state: any) => state.future);

//     const placeholders = futurePairData
//         ?.filter((i: any) => i?.tickerRoot)
//         ?.slice(0, 3)
//         ?.map((i: any) => i.tickerRoot) || [];

//     const [index, setIndex] = useState(0);
//     const [profileImageError, setProfileImageError] = useState(false);

//     useEffect(() => {
//         setProfileImageError(false);
//     }, [profileImage]);

//     const translateY = useRef(new Animated.Value(10)).current;
//     const opacity = useRef(new Animated.Value(0)).current;

//     const animate = () => {
//         translateY.setValue(10);
//         opacity.setValue(0);

//         Animated.parallel([
//             Animated.timing(translateY, {
//                 toValue: 0,
//                 duration: 400,
//                 useNativeDriver: true,
//             }),
//             Animated.timing(opacity, {
//                 toValue: 1,
//                 duration: 400,
//                 useNativeDriver: true,
//             }),
//         ]).start();
//     };

//     useEffect(() => {
//         if (placeholders.length === 0) return;

//         animate();

//         const interval = setInterval(() => {
//             setIndex(prev => (prev + 1) % placeholders.length);
//             animate();
//         }, 2000);

//         return () => clearInterval(interval);
//     }, [placeholders.length]);

//     return (
//         <View style={{ flexDirection: "row", alignItems: "center", height: windowheight * 0.1, justifyContent: "space-around", marginHorizontal: "2.5%" }} >
//             <Pressable style={{ width: "12.5%", height: windowwidth * 0.1, justifyContent: "center", alignItems: "center" }} onPress={() => navigation.navigate("Profile")}>

//                 {!isEmpty(profileImage) && !profileImageError ? (
//                     <Images
//                         type="image"
//                         source={{ uri: `${PROFILEURL}/profile/${profileImage}` }}
//                         width={windowwidth * 0.080}
//                         height={windowwidth * 0.080}
//                         style={{ borderRadius: 100, }}
//                         resizeMode="cover"
//                         props={{ onError: () => setProfileImageError(true) }}
//                     />
//                 ) : (
//                     <Images
//                         type="svg"
//                         name={theme.theme === "dark" ? "DarkUser" : "EmptyUser"}
//                         width={windowwidth * 0.080}
//                         height={windowwidth * 0.080}
//                         style={{ borderRadius: 100, }}
//                     />
//                 )}
//             </Pressable>
//             <Pressable style={{ width: "45%", height: windowheight * 0.05, backgroundColor: theme.card, alignItems: "center", borderRadius: borderradius * 1, flexDirection: "row", paddingHorizontal: "5%" }} onPress={() => navigation.navigate("Market")}>
//                 <VectorIcons
//                     family="Feather"
//                     name={"search"}
//                     size={windowwidth * 0.045}
//                     iconcolor={Colors.grey}
//                 />
//                 <Animated.View
//                     style={{
//                         transform: [{ translateY }],
//                         opacity,
//                     }}
//                 >
//                     <Text size="semimedium" style={{ color: Colors.grey, marginLeft: "5%" }} numoflines={1}> {placeholders[index]}</Text>
//                 </Animated.View>
//             </Pressable>
//             <Pressable onPress={() => {
//                 if (kycStatus !== 'approved') {
//                     failuretoast("Error!", "Please complete your KYC details")
//                 } else {
//                     navigation.navigate('Deposit')
//                 }
//             }} style={{ width: "12.5%", height: windowwidth * 0.1, justifyContent: "center", alignItems: "center" }} >
//                 <VectorIcons
//                     family="MaterialDesignIcons"
//                     name={"wallet-bifold-outline"}
//                     size={windowwidth * 0.07}
//                     iconcolor={theme.inversetext}
//                 />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate('QRcodeScanner')} style={{ width: "12.5%", height: windowwidth * 0.1, justifyContent: "center", alignItems: "center" }} >
//                 <VectorIcons
//                     family="MaterialDesignIcons"
//                     name={"line-scan"}
//                     size={windowwidth * 0.055}
//                     iconcolor={theme.inversetext}
//                 />
//             </Pressable>
//             <Pressable onPress={() => navigation.navigate('Notification')} style={{ width: "12.5%", height: windowwidth * 0.1, justifyContent: "center", alignItems: "center" }} >
//                 <VectorIcons
//                     family="Ionicons"
//                     name={"notifications"}
//                     size={windowwidth * 0.055}
//                     iconcolor={theme.inversetext}
//                 />
//                 {unreadCount > 0 ? <View style={{ width: 10, height: 10, backgroundColor: "#FF4130", position: "absolute", borderRadius: borderradius * 5, top: 0, right: "30%" }} /> : ""}
//             </Pressable>
//         </View>
//     )

// }

// export default Homeheader;

import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Images from "../../Utilities/images";
import { helperSelector } from "../../Slices/helper";
import VectorIcons from "../../Utilities/vectoricons";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";
import { isEmpty, getProfileImageUrl } from "../../Utilities/helerfunction";

interface Homeheaderprops {

}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    return "Good Evening!";
};

const Homeheader: React.FC<Homeheaderprops> = () => {
    const { theme, navigation } = useCustomHooks()
    const { profileImage, firstName, lastName } = useSelector((state: any) => state.auth.userData);
    const { unreadCount } = useSelector(helperSelector)

    const [profileImageError, setProfileImageError] = useState(false);

    useEffect(() => {
        setProfileImageError(false);
    }, [profileImage]);

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    return (
        <View style={{ flexDirection: "row", alignItems: "center", height: windowheight * 0.1, marginHorizontal: "2.5%" }} >
            <Pressable onPress={() => navigation.navigate("Profile")}>
                {!isEmpty(profileImage) && !profileImageError ? (
                    <Images
                        type="image"
                        source={{ uri: getProfileImageUrl(profileImage) }}
                        width={windowwidth * 0.1}
                        height={windowwidth * 0.1}
                        style={{ borderRadius: 100 }}
                        resizeMode="cover"
                        props={{ onError: () => setProfileImageError(true) }}
                    />
                ) : (
                    <Images
                        type="svg"
                        name={theme.theme === "dark" ? "DarkUser" : "EmptyUser"}
                        width={windowwidth * 0.1}
                        height={windowwidth * 0.1}
                        style={{ borderRadius: 100 }}
                    />
                )}
            </Pressable>

            <View style={{ marginLeft: "3.5%", flex: 1 }}>
                <Text size="small" color={theme.secondarytext}>{getGreeting()}</Text>
                <Text size="semilarge" family="semiBold" color={theme.primarytext} top={2}>{fullName}</Text>
            </View>

            {/* <Pressable onPress={() => navigation.navigate('QRcodeScanner')} style={{ width: windowwidth * 0.1, height: windowwidth * 0.1, borderRadius: windowwidth * 0.05, backgroundColor: theme.iconBgColor, justifyContent: "center", alignItems: "center" }} >
                <VectorIcons
                    family="MaterialDesignIcons"
                    name={"line-scan"}
                    size={windowwidth * 0.055}
                    iconcolor={theme.homegreen}
                />
            </Pressable> */}

            <Pressable onPress={() => navigation.navigate('Notification')} style={{ width: windowwidth * 0.1, height: windowwidth * 0.1, borderRadius: windowwidth * 0.05, backgroundColor: theme.iconBgColor, justifyContent: "center", alignItems: "center", marginLeft: "2.5%" }} >
                <VectorIcons
                    family="Ionicons"
                    name={"notifications"}
                    size={windowwidth * 0.055}
                    iconcolor={theme.homegreen}
                />
                {unreadCount > 0 ? <View style={{ width: 10, height: 10, backgroundColor: theme.notificationDot, position: "absolute", borderRadius: borderradius * 5, top: "18%", right: "22%" }} /> : null}
            </Pressable>
        </View>
    )

}

export default Homeheader;