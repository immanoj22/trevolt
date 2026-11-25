/** PACKAGE IMPORT */

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

/** LOCAL FILES IMPORT */

import styles from "./sidebar.module.css"
import { useGlobalContext } from "../../context/GlobalProvider";
import config from "../../config/env";


/** ACTIONS */

/** CODE START */

const Sidebar = React.memo(({ navigationLinks, handleSidebarClose }) => {

    const location = useLocation().pathname;

    // const { userType } = useGlobalContext()


    // const filteredLinks = navigationLinks.filter(link =>
    //     link.userType?.includes(userType)
    // );

    return (
        <div className={styles.sidebarWrapper + ' mblOffcanva'}>

            {navigationLinks.map((value, index) => {
                if (config.ENV == 'demo' && ["/deposit", "/verification", "/withdraw"].includes(value.links)) {
                    return false
                }
                return (
                    <NavLink
                        key={index}
                        className={({ isActive }) =>
                            `${styles.links} ${isActive || value.activeLinks?.includes(location)
                                ? styles.active
                                : ""
                            }`
                        }
                        to={value.links}
                        data-click-effect="none"
                        onClick={() => { handleSidebarClose ? handleSidebarClose() : null }}
                    >


                        <img src={value.img} alt={value.name} className={styles.icon} />
                        <span className={styles.name}>
                            {value.name}
                        </span>
                    </NavLink>
                )
            })}
        </div>
    );
});

export default Sidebar;
