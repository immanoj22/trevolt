import React, { useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import ListItem from "../ListItem";
import { icons, image } from "../../../Utilities/images";
import Mainview from "../../../Components/mainview";
import { APIURL } from "../../../Actions/Constant/constant";
import WebviewModal from "../../../Components/DialogBox/Web";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Features'>;

const Features: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);
    const [demo, setDemo] = useState(false);
    const [announcement, setAnnouncement] = useState(false);
    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle="Features"
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                <ListItem icon={icons.Megaphone} title="Announcement" onPress={() => setAnnouncement(true)} />
                <ListItem icon={icons.YoutubeIcon} title="Youtube Tutorial" onPress={() => setDemo(true)} />
            </View>
            {
                demo &&
                <WebviewModal
                    title="Youtube Tutorial"
                    url={`${APIURL}/learn`}
                    onCloseHandler={() => setDemo(false)}
                    contentStyle={{ marginTop: -65 }}
                    stripChrome={true}
                />
            }
            {
                announcement &&
                <WebviewModal
                    title="Announcement"
                    url={`${APIURL}/blog?embed=true`}
                    onCloseHandler={() => setAnnouncement(false)}
                    contentStyle={{ marginTop: -65 }}
                    stripChrome={true}
                />

            }
        </Mainview>
    )

}

export default Features;