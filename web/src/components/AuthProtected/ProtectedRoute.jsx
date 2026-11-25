import React from "react";
import { useLocation } from "react-router-dom";
import PageNotFound from "../pages/static/PageNotFound";
import { navigationLinks } from "../utils/navigationLinks";

const ProtectedRoute = ({ element, userType }) => {
    const location = useLocation();

    const allowedPaths = navigationLinks
        .filter(link => link.userType?.includes(userType))
        .flatMap(link => [link.links, ...(link.activeLinks || [])]);

    if (!allowedPaths.includes(location.pathname)) {
        return <PageNotFound />;
    }

    return element;
};

export default ProtectedRoute;
