import { useEffect, useLayoutEffect, useState } from "react"
import { useSelector } from 'react-redux';

const useThemeChange = (key = "trevolt-theme",) => {
    const { userdetails, beforelogin } = useSelector((state) => state.user);
    const { userTheme } = userdetails;
    const [theme, setTheme] = useState("light")

    const getLocalStoreageValue = () => {
        return localStorage.getItem("trevolt-theme");
    }

    useLayoutEffect(() => {
        const value = getLocalStoreageValue() ? getLocalStoreageValue() : "light"
        setTheme(value);
        changeDocumentValue(value)
    }, [])

    useEffect(() => {
        try {
            if (userTheme != undefined) {
                localStorage.setItem(key, userTheme);
                changeDocumentValue(userTheme)
            } else {
                let data = getLocalStoreageValue() != null ? getLocalStoreageValue() : "light"
                localStorage.setItem(key, data);
                setTheme(data);
                changeDocumentValue(data);
            }

        } catch (error) {
        }
    }, [key, theme, userTheme])


    useEffect(() => {
        if (userTheme != undefined && Object.values(userdetails).length > 0) {
            changeDocumentValue(userTheme)
            setTheme(userTheme !== "dark" ? "light" : "dark");
        } else {
            changeDocumentValue(theme)
        }
    }, [userTheme, theme]);

    useEffect(() => {
        if (beforelogin) {
            changeDocumentValue(beforelogin)
            setTheme(beforelogin);
        }
    }, [beforelogin])

    const toggleTheme = () => {
        setTheme((prev) => prev == "dark" ? "light" : "dark")
    }

    const changeDocumentValue = (value) => {
        document.body.setAttribute("data-theme", value);
    }


    return { theme, toggleTheme }
}

export default useThemeChange