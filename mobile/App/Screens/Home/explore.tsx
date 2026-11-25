// import React from "react";
// import { Pressable, View } from "react-native";

// import Text from "../../Components/text"
// import Images, { icons } from "../../Utilities/images";
// import Flexcomponent from "../../Components/flexcomponent";
// import useCustomHooks from "../../Actions/Hooks/customhook";
// import { borderradius, windowwidth } from "../../Utilities/dimensions";

// interface Exploreprops {
//     setDemo?: any
// }

// const Explore: React.FC<Exploreprops> = ({ setDemo }) => {
//     const { navigation, dispatch } = useCustomHooks()
//     const explore = [
//         {
//             title: "Option Trading",
//             image: <Images
//                 type="svg"
//                 name={"Optionhome"}
//                 width={windowwidth * 0.075}
//                 height={windowwidth * 0.075}
//             />
//         },
//         {
//             title: "Future Trading",
//             image: <Images
//                 type="svg"
//                 name="Futurehome"
//                 width={windowwidth * 0.075}
//                 height={windowwidth * 0.075}
//             />
//         },
//         {
//             title: "Market",
//             image: <Images
//                 width={windowwidth * 0.075}
//                 height={windowwidth * 0.075}
//                 type="svg"
//                 name="Markethome"
//             />
//         },
//         {
//             title: "Copy Trade",
//             image: <Images
//                 type="svg"
//                 name="Copyhome"
//                 width={windowwidth * 0.075}
//                 height={windowwidth * 0.075}
//             />
//         },

//         {
//             title: "Demo Trade",
//             image: <Images
//                 type="image"
//                 source={icons.Demo}
//                 width={windowwidth * 0.075}
//                 height={windowwidth * 0.075}
//             />
//         },
//     ]

//     const onselect = (e: any, i: number) => {

//         switch (i) {
//             case 0:
//                 navigation.navigate("Option")
//                 break;

//             case 1:
//                 navigation.navigate("Future")
//                 break;
//             case 2:
//                 navigation.navigate("Market")
//                 break;
//             case 3:
//                 navigation.navigate("Copytrade")
//                 break;
//             case 4:
//                 // dispatch(SetFutureparams("trade"))
//                 // navigation.navigate('Dashboard', { screen: 'Future' })
//                 setDemo()
//                 break;

//             default:
//                 break;
//         }
//     }
//     const { theme } = useCustomHooks()
//     return (
//         <Flexcomponent alignItems="flex-start" justifyContent="space-between" top={"5%"} paddingHorizontal={2} >
//             {
//                 explore?.map((e: any, i: number) => (
//                     <Pressable key={e.title ?? i} onPress={() => onselect(e, i)} style={{ width: windowwidth * 0.15, alignItems: "center", justifyContent: "center" }} >
//                         <View style={{ width: windowwidth * 0.16, height: windowwidth * 0.15, backgroundColor: theme.card, borderRadius: borderradius * 0.5, justifyContent: "center", alignItems: "center" }} >
//                             {e?.image}
//                         </View>
//                         <Text style={{ textAlign: "center", marginTop: "5%" }} >{e.title}</Text>
//                     </Pressable>))
//             }
//         </Flexcomponent>

//     )
// }

// export default Explore;


import React from "react";
import { Linking, Pressable, View } from "react-native";

import Text from "../../Components/text"
import Images, { icons } from "../../Utilities/images";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import { SetFutureparams } from "../../Slices/helper";

interface Exploreprops {
    setDemo?: any;
    onSelect?: (tickerRoot: string) => void;
    onOpenFuture?: (tickerRoot: string) => void;
}

const Explore: React.FC<Exploreprops> = ({ setDemo, onSelect, onOpenFuture }) => {
    const { navigation, dispatch } = useCustomHooks()
    const explore = [
        {
            title: "Demo Trade",
            image: <Images
                width={windowwidth * 0.075}
                height={windowwidth * 0.075}
                type="svg"
                name="DemoNew"
            />
        },
        {
            title: "Algo Trade",
            image: <Images
                width={windowwidth * 0.075}
                height={windowwidth * 0.075}
                type="svg"
                name="AlgoNew"
            />
        },
        {
            title: "Chart",
            image: <Images
                width={windowwidth * 0.075}
                height={windowwidth * 0.075}
                type="svg"
                name="ChartNew"
            />
        },
        {
            title: "Copy Trade",
            image: <Images
                type="svg"
                name="CopyNew"
                width={windowwidth * 0.075}
                height={windowwidth * 0.075}
            />
        },


    ]

    const onselect = (e: any, i: number) => {

        switch (i) {
            case 0:
                Linking.openURL("https://stagedemo.trevolt.example/");
                break;

            case 1:
                navigation.navigate("CreateWebhook")
                break;
            case 2:
                navigation.navigate('Dashboard', { screen: 'Chart' });
                break;
            case 3:
                navigation.navigate("Copytrade")
                break;
            case 4:
                // dispatch(SetFutureparams("trade"))
                // navigation.navigate('Dashboard', { screen: 'Future' })
                setDemo()
                break;

            default:
                break;
        }
    }
    const { theme } = useCustomHooks()
    return (
        <Flexcomponent alignItems="flex-start" justifyContent="center" top={"5%"} style={{ gap: windowwidth * 0.05 }} >
            {
                explore?.map((e: any, i: number) => (
                    <Pressable key={e.title ?? i} onPress={() => onselect(e, i)} style={{ alignItems: "center", justifyContent: "center" }} >
                        <View style={{ width: windowwidth * 0.16, height: windowwidth * 0.15, justifyContent: "center", alignItems: "center" }} >
                            {e?.image}
                        </View>
                        <Text style={{ textAlign: "center", marginTop: "5%", fontSize: 10 }} color={theme.theme == 'dark' ? "#EBEBEB" : "#131D31"} numoflines={1} >{e.title}</Text>
                    </Pressable>))
            }
        </Flexcomponent>

    )
}

export default Explore;