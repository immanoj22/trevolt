import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";
import { useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import config from "../../../config/env";
import isEmpty from "is-empty";

const CrispChat = () => {
  const { userdetails } = useSelector((state) => state.user);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Step 1: Configure Crisp ONLY once
  useEffect(() => {
    if (!config.CRISP_WEBSITE_ID) return;
    Crisp.configure(config.CRISP_WEBSITE_ID);
  }, []);

  // Step 2: Set user / guest info after session loads
  useEffect(() => {
    Crisp.session.onLoaded(() => {
      let visitorId = localStorage.getItem("crisp_visitor_id");

      if (!visitorId) {
        visitorId = "guest_" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("crisp_visitor_id", visitorId);
      }

      Crisp.session.setData({ visitor_id: visitorId });

      if (!isEmpty(userdetails)) {
        Crisp.user.setEmail(userdetails.email);
        Crisp.user.setNickname(userdetails.userName);
      }
    });
  }, [userdetails]);

  // Step 3: Hide chat on specific routes, and always inside the mobile app's WebView
  useEffect(() => {
    const hideRoutes = ["/futures-chart"];

    const isMobileWebview = searchParams.get("webview") === "1";
    const shouldHide =
      isMobileWebview || hideRoutes.some((r) => location.pathname.startsWith(r));

    if (shouldHide) Crisp.chat.hide();
    else Crisp.chat.show();
  }, [location.pathname, searchParams]);

  return null;
};

export default CrispChat;
