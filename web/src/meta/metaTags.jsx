import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { metaContent } from "./metaData";

export function MetaTags({ pageContentKey }) {
    const { pathname, search, hash } = useLocation();
    const currentData = metaContent[pageContentKey] || metaContent.default;

    const siteUrl = "https://trevolt.example";
    const fullUrl = `${siteUrl}${pathname}${search}${hash}`;

    return (
        <Helmet>
            <title>{currentData?.title}</title>
            <meta name="description" content={currentData?.description} />

            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={currentData?.ogTitle || currentData?.title} />
            <meta
                property="og:description"
                content={currentData?.ogDescription || currentData?.description}
            />
            <meta property="og:image" content={currentData?.ogImage} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={currentData?.ogTitle || currentData?.title} />
            <meta
                name="twitter:description"
                content={currentData?.ogDescription || currentData?.description}
            />
            <meta name="twitter:image" content={currentData?.ogImage} />
        </Helmet>
    );
}
