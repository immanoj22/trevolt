import React from 'react';
import { Linking, StyleProp, TextStyle } from 'react-native';
import RenderHtml from 'react-native-render-html';

import { isValidUrl } from '../../Utilities/helerfunction';
import useCustomHooks from '../../Actions/Hooks/customhook';
import { Fontfamily, Fontsize } from '../../Utilities/uiasset';
import { RFvalue, windowwidth } from '../../Utilities/dimensions';

type HtmlViewProps = {
    text?: string;
    textStyle?: StyleProp<TextStyle>;
};

const HtmlView: React.FC<HtmlViewProps> = ({
    text = '',
    textStyle = {},
}) => {
    const { theme } = useCustomHooks()

    const onPress = (_event: any, href: string) => {
        if (href.startsWith('tel:') || href.startsWith('mailto:')) {
            Linking.openURL(href);
            return;
        }
        if (isValidUrl(href) === true && href.includes("mapping") === false) {
            // setPopup(href);
        }
    };

    const tagsStyles: any = {
        p: {
            color: theme.inversetext,
            fontSize: Fontsize.semimedium,
            fontFamily: Fontfamily.regular,
            ...(textStyle as object),
        },
        h1: {
            fontSize: RFvalue(16),
            color: theme.inversetext,
            marginBottom: "2%",
            fontFamily: Fontfamily.regular
        },
        h3: {
            color: theme.inversetext,
            fontFamily: Fontfamily.bold,
        },
        h4: {
            color: theme.inversetext,
            fontFamily: Fontfamily.regular,
        },
        ol: {
            color: theme.inversetext,
            fontFamily: Fontfamily.bold,
            marginTop: '3%',
        },
        li: {
            color: theme.inversetext,
            fontFamily: Fontfamily.regular,
        },
        a: {
            color: theme.inversetext,
            fontFamily: Fontfamily.regular,
        },
        b: {
            color: theme.inversetext,
            fontFamily: Fontfamily.bold
        },
        ul: {
            color: theme.inversetext,
            fontFamily: Fontfamily.regular,
            marginTop: '2%'
        },
        div: {
        },
    };

    const onElement = (el: any) => {
        const { children, name } = el;
        if (name === 'ul' && children && children.length) {
            children.forEach((listItem: any) => {
                listItem.attribs = { class: 'ul-li' };
            });
        }
    };

    const renderersProps: any = {
        img: {
            enableExperimentalPercentWidth: true,
        },
        a: {
            onPress,
        },
    };

    return (

        <RenderHtml
            contentWidth={windowwidth}
            source={{ html: text }}
            baseStyle={{

                ...(textStyle as object),
            }}
            systemFonts={[
                'inter-Medium',
                'inter-Regular',
                'inter-Semibold',
                'inter-Semibold',
                'inter-Bold',
            ]}
            tagsStyles={tagsStyles}
            domVisitors={{ onElement }}
            renderersProps={renderersProps}
            ignoredStyles={['height', 'width']}
        />
    );
};

export default React.memo(HtmlView);
