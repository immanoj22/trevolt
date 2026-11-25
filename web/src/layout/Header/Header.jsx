  /** package import */

import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Offcanvas } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";
import { useSelector } from "react-redux";

/** local import */

import styles from "./header.module.css";
import { useGlobalContext } from "../../context/GlobalProvider";
import Images from "../../utils/Images";
import HeaderMenus from "./HeaderMenus";
import HeaderRight from "./HeaderRight";
import NotificationCanva from "../../pages/Notification/NotificationCanva";
import SettingsCanva from "../../pages/Settings/SettingsCanva";

/** code start */

const Header = ({ customClass }) => {
  const { theme, isAuth } = useGlobalContext();
  const { isAuthStatus } = useSelector((state) => state.user);
  // console.log('theme__1', theme)

  const [canvasShow, setCanvasShow] = useState(false);
  const [NotificationShow, setNotificationShow] = useState(false);
  const [SettingCanvasShow, setSettingCanvasShow] = useState(false);

  const handleCanvaShow = () => {
    setCanvasShow(true);
  };
  const handleCanvaClose = () => {
    setCanvasShow(false);
  };

  const handleNotificationCanvaShow = () => {
    setNotificationShow(true);
  };
  const handleNotificationCanvaClose = () => {
    setNotificationShow(false);
  };
  const handleSettingCanvaShow = () => {
    setSettingCanvasShow(true);
  }
  const handleSettingsCanvaClose = () => {
    setSettingCanvasShow(false);
  }

  return (
    <header className={`${styles.header} `}>
      {/* start of web */}
      <div
        className={`${styles.headerContainer} ${customClass != undefined && styles.futureTradingHeading}`}
      >
        <div className={`${styles.headerContainerInner}`}>
          <div className={`${styles.headerLeft}`}>
            <Link className="" to={isAuthStatus ? "/dashboard" : "/"}>
              <img
                src={theme == "dark" ? Images.logo : Images.logoDark}
                alt="logo"
                className={`img-fluid ${styles.logo}`}
              />
            </Link>
            <div className={`${styles.menus} d-none d-lg-flex h-100`}>
              <HeaderMenus
                handleCanvaShow={handleCanvaShow}
                handleNotificationCanvaShow={handleNotificationCanvaShow}
              />
            </div>
          </div>

          <div className="d-flex h-100">
            {/* <HeaderRight
                            isAuthenticated={isAuth}
                            token={token}
                            getUser={getUser}
                            userLogout={userLogout}
                            theme={theme}
                            userSettings={userSettings}
                            handleThemeChange={handleThemeChange}
                            handleCanvaShow={handleCanvaShow} /> */}
            <HeaderRight
              handleCanvaShow={handleCanvaShow}
              handleNotificationCanvaShow={handleNotificationCanvaShow}
              handleSettingCanvaShow={handleSettingCanvaShow}
                handleSettingsCanvaClose={handleSettingsCanvaClose}
            />
          </div>
        </div>
      </div>

      {/* end of web */}

      {/* start of mobile */}

      <Offcanvas show={canvasShow} className={`${styles.customOffcanva}`}>
        <Offcanvas.Header>
          <Offcanvas.Title className={`${styles.customOffcanvaTitle}`}>
            <NavLink to="/" className="">
              <img
                src={theme == "dark" ? Images.logo : Images.logoDark}
                alt="logo"
                className="img-fluid"
              />
            </NavLink>
            <button
              aria-label="closeIcon"
              className={`${styles.customOffCanvaCloseButton} d-xl-none`}
              onClick={handleCanvaClose}
            >
              <IoMdClose fontSize={25} />
            </button>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div>
            <div className={`${styles.menus}  h-100`}>
              <HeaderMenus
                handleCanvaShow={handleCanvaShow}
                handleNotificationCanvaShow={handleNotificationCanvaShow}
              />
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* end of mobile */}

      {/* Notification Canva start*/}

      <NotificationCanva
        NotificationShow={NotificationShow}
        handleNotificationCanvaClose={handleNotificationCanvaClose}
      />

      {/* Notification Canva end */}

      {/* settings canva start  */}

      <SettingsCanva
        SettingCanvasShow={SettingCanvasShow}
        handleSettingsCanvaClose={handleSettingsCanvaClose}
      />

      {/* settings canva end  */}
    </header>
  );
};

export default Header;
