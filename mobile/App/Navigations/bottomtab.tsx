
// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import Option from '../Screens/Option';
// import Home from '../Screens/Home/home';
// import Images from '../Utilities/images';
// import Future from '../Screens/Future/future';
// import Orders from '../Screens/Orders/orders';
// import { Fontfamily } from '../Utilities/uiasset';
// import { BottomTabParamList } from './navigationtypes';
// import Portfolio from '../Screens/Portfolio/portfolio';
// import useCustomHooks from '../Actions/Hooks/customhook';
// import { RFvalue, windowheight, windowwidth } from '../Utilities/dimensions';

// const Tab = createBottomTabNavigator<BottomTabParamList>();

// const Bottomtab: React.FC = () => {
//     const { theme } = useCustomHooks()
//     const tabs = [
//         {
//             name: "Home",
//             component: Home,
//             icon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Home' : "Homelight"}
//                 width={windowwidth * 0.065}
//                 height={windowwidth * 0.065}
//             />,
//             activeicon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Homeactive' : "HomelightActive"}
//                 width={windowwidth * 0.065}
//                 height={windowwidth * 0.065}

//             />,
//         },
//         {
//             name: "Future",
//             component: Future,
//             icon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Future' : "Futurelight"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//             activeicon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Futureactive' : "FuturelightActive"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//         },
//         {
//             name: "Portfolio",
//             component: Portfolio,
//             icon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Portfolio' : "Portfoliolight"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//             activeicon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Portfolioactive' : "PortfoliolightActive"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//         },
//         {
//             name: "Option",
//             component: Option,
//             icon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Option' : "Optionlight"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//             activeicon: <Images
//                 type='svg'
//                 name={theme.theme ==const handlePairChange = (pair: any) => {
    //     try {
    //         const pairDetail = futurePairData.find((val: any) => val.tickerRoot === pair);
    //         setItem("futurespair", pair)
    //         dispatch(setTradePairData(pairDetail));
    //         dispatch(setFutureTicker(pairDetail));
    //         navigation.navigate('Future')
    //         // navigation.goBack()
    //     } catch (error) {
    //         console.log('handlePairChange__err', error);
    //     }
    // }; "dark" ? 'Optionactive' : "OptionlightActive"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//         },
//         {
//             name: "Orders",
//             component: Orders,
//             icon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Orders' : "Orderslight"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//             activeicon: <Images
//                 type='svg'
//                 name={theme.theme == "dark" ? 'Ordersactive' : "OrderslightActive"}
//                 width={windowwidth * 0.0575}
//                 height={windowwidth * 0.0575}
//             />,
//         },
//     ]

//     const insets = useSafeAreaInsets();

//     return (
//         <Tab.Navigator
//             screenOptions={{
//                 headerShown: false,
//                 tabBarHideOnKeyboard: true,
//                 tabBarStyle: {
//                     backgroundColor: theme.background,
//                     height: insets.bottom + windowheight * 0.08,
//                     borderTopWidth: 0,
//                 },
//                 tabBarItemStyle: {
//                     alignItems: "center",
//                     flexDirection: "row",
//                     marginTop: 10
//                 },
//                 tabBarActiveTintColor: theme.theme == "light" ? "#000C51" : "#FFFFFF",
//                 tabBarInactiveTintColor: theme.theme == "dark" ? "#55555F" : "#A2A2A2",
//                 tabBarLabelStyle: {
//                     fontFamily: Fontfamily.regular,
//                     fontSize: RFvalue(12),
//                     marginTop: 5
//                 }
//             }}
//         >
//             {tabs?.map((e: any) => (
//                 <Tab.Screen
//                     key={e?.name}
//                     name={e?.name}
//                     component={e?.component}
//                     options={{
//                         tabBarIcon: ({ focused }: any) => {
//                             return focused ? e?.activeicon : e?.icon
//                         },
//                     }}
//                 />
//             ))}
//         </Tab.Navigator>
//     )
// }

// export default Bottomtab;

import React, { Component } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Option from '../Screens/Option';
import Chart from '../Screens/Chart/chart';
import Home from '../Screens/Home/home';
import Orders from '../Screens/Orders/orders';
import { Fontfamily } from '../Utilities/uiasset';
import { BottomTabParamList } from './navigationtypes';
import Portfolio from '../Screens/Portfolio/portfolio';
import Images from '../Utilities/images';
import useCustomHooks from '../Actions/Hooks/customhook';
import { RFvalue, windowheight, windowwidth } from '../Utilities/dimensions';
import Market from '../Screens/Market/market';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const Bottomtab: React.FC = () => {
    const { theme } = useCustomHooks()

    const tabs = [
        { name: "Home", label: "Home", component: Home, iconName: "BottomHome" },
        // { name: "Future", label: "Market", component: FutureNew, iconName: "BottomMarket"},
        // { name: "Future", label: "Market", component: Future, iconName: "BottomMarket" },
        { name: "Market", label: "Market", component: Market, iconName: "BottomMarket" },
        { name: "Portfolio", label: "Portfolio", component: Portfolio, iconName: "BottomPortfolio" },
        { name: "Option", label: "Option", component: Option, iconName: "BottomOptions" },
        // { name: "Chart", label: "Chart", component: Chart, iconName: "BottomOptions" },
        { name: "Orders", label: "Orders", component: Orders, iconName: "BottomOrders" },
        // Reachable via navigation.navigate('Dashboard', { screen: 'Chart' }) - keeps
        // the bottom tab bar visible. Its own tab button is hidden.
        { name: "Chart", label: "Chart", component: Chart, iconName: "BottomOptions", hidden: true },
    ]

    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    backgroundColor: theme.theme === "dark" ? "#0E1626" : "#FFFFFF",
                    height: insets.bottom + windowheight * 0.082,
                    borderTopWidth: 0,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    shadowColor: "#0B1F3A",
                    shadowOpacity: theme.theme === "dark" ? 0.5 : 0.1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: -6 },
                    elevation: 16,
                },
                tabBarItemStyle: {
                    alignItems: "center",
                    justifyContent: "center",
                },
                tabBarActiveTintColor: theme.homegreen,
                tabBarInactiveTintColor: theme.theme == "dark" ? "#A2A2A2" : "#A2A2A2",
                tabBarLabelStyle: {
                    fontFamily: Fontfamily.medium,
                    fontSize: RFvalue(11),
                    marginTop: 4
                }
            }}
        >
            {tabs?.map((e: any) => (
                <Tab.Screen
                    key={e.name}
                    name={e.name}
                    component={e.component}
                    options={{
                        tabBarLabel: e.label,
                        tabBarButton: e.hidden ? () => null : undefined,
                        tabBarItemStyle: e.hidden ? { display: "none" } : undefined,
                        tabBarIcon: ({ color }) => (
                            <Images
                                type="svg"
                                name={e.iconName}
                                width={windowwidth * 0.06}
                                height={windowwidth * 0.06}
                                svgprops={{ fill: color }}
                            />
                        ),
                    }}
                />
            ))}
        </Tab.Navigator>
    )
}

export default Bottomtab;
