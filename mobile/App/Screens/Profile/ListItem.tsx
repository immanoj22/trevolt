import React from "react";
import { Pressable, View } from "react-native";

import Card from "../../Components/Card";
import Text from "../../Components/text";
import Images from "../../Utilities/images";
import { Colors } from "../../Utilities/uiasset";
import VectorIcons from "../../Utilities/vectoricons";
import { windowwidth } from "../../Utilities/dimensions";
import useCustomHooks from "../../Actions/Hooks/customhook";

import { styles } from "./styles";

interface ListItemProps {
    icon?: any;
    title: string;
    iconWidth?: number;
    iconHeight?: number;
    onPress?: () => void;
    rightContent?: React.ReactNode;
}

const ListItem: React.FC<ListItemProps> = ({
    icon = false,
    title,
    iconWidth = windowwidth * 0.050,
    iconHeight = windowwidth * 0.050,
    onPress,
    rightContent,
}) => {

    const { theme } = useCustomHooks();
    const style = styles(theme)
    const IconComponent = typeof icon === "function" ? icon : null;
    return (
        <Pressable onPress={onPress}>
            <Card
                backgroundColor={theme.theme == 'dark' ? "#151a17ab" : "#FFFFFF"} 
                borderColor={theme.theme == 'dark' ? "#1B2740" : "#0000000a"}
                containerStyle={[style.profileContainer, icon ? { padding: "2%" } : { padding: "3%" }]}
            >
                <View style={style.row}>
                    {
                        icon && (
                            <View style={style.img}>
                                <View 
                                style={{ width: iconWidth * 1.7, height: iconHeight * 1.7, borderRadius: 100, backgroundColor: theme.theme == 'dark' ? "#EAF1FF" : "#E8EFFC", alignItems: "center", justifyContent: "center", marginRight: "10%" }}
                                >
                                    {IconComponent ? (
                                        <IconComponent width={iconWidth} height={iconHeight} />
                                    ) : (
                                        <Images
                                            type="image"
                                            source={icon}
                                            width={iconWidth}
                                            height={iconHeight}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                            </View>
                        )
                    }
                    <View style={[icon ? style.profileTitle : style.title]}>
                        <Text family="medium">{title}</Text>
                    </View>
                </View>
                {
                    rightContent ?? (
                        <VectorIcons
                            family="Ionicons"
                            name="chevron-forward"
                            iconcolor={Colors.warmgrey}
                            size={18}
                        />
                    )
                }
            </Card>
        </Pressable>
    );
};

export default ListItem;