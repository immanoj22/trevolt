

export const cmsData = (data, identifier, key) => {
    if (data && data?.SECTION?.length > 0) {
        if (key == "CARD") {
            if (data?.SECTION.find((el) => (el.identifier == identifier))?.[key]) {
                return data?.SECTION.find((el) => (el.identifier == identifier))?.[key]
            } else {
                return []
            }

        } else {
            if (data?.SECTION.find((el) => (el.identifier == identifier))?.[key]) {
                return data?.SECTION.find((el) => (el.identifier == identifier))?.[key]
            } else {
                return ""
            }
        }
    } else {
        if (key == "CARD") {
            return []
        } else {
            return ""
        }
    }
}


export const cmsCardData = (data, identifier, index, key) => {
    try {
        if (data && data?.SECTION?.length > 0) {
            if (data?.SECTION.find((el) => (el.identifier == identifier))) {
                let card = data?.SECTION.find((el) => (el.identifier == identifier))?.["CARD"];
                if (card?.length > 0) {
                    if (index < card?.length) {
                        return card[index][key]
                    } else {
                        return ""
                    }
                } else {
                    return ""
                }
            } else {
                return ""
            }
        }
    } catch (e) {
        console.log("cmsCardData__Err", e)
    }

}
