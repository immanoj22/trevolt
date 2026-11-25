import React from 'react'
import { Helmet } from "react-helmet";

function SeoHelmet(props) {
    const { title, description, keywords, image, type = "website" } = props;

    // console.log('title..', title, 'description..', description, "keywords..", keywords, "image..", image)

    return (
        <Helmet>

            <meta charSet="utf-8" />

            {title && <title>{title}</title>}
            {description && <meta name="description" content={description}
            />}
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Open Graph Meta Tags */}
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}
            <meta property="og:type" content={type} />
            {/* {url && <meta property="og:url" content={url} />} */}



            {/* {image && (
                <>
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta property="og:image:type" content="image/jpeg" />
                </>
            )} */}

        </Helmet>
    )
}

export default SeoHelmet;


