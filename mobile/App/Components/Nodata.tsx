import React from 'react';
import { View } from 'react-native';

import Text from './text';
import Images from '../Utilities/images';
import { windowwidth } from '../Utilities/dimensions';
import useCustomHooks from '../Actions/Hooks/customhook';

interface NoDataProps {
    title?: string;
}

const NoData: React.FC<NoDataProps> = ({ title = "No Data Found" }) => {

    const { theme } = useCustomHooks();
    return (
        <View style={{ alignItems: "center" }}>
            <Images
                type="svg"
                name={theme.theme === "dark" ? "NOdataLight" : "NOdataDark"}
                width={windowwidth * 0.15}
                height={windowwidth * 0.15}
            />
            <Text style={{ marginTop: "2%" }} align="center" family="semiBold">
                {title}
            </Text>
        </View>
    );
};

export default NoData;