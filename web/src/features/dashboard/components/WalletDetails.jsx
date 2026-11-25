/** package import */

import React, { useEffect } from "react";

/** local import */

import styles from "../styles/walletDetails.module.css";
// import styles from '.././styles/authInnerPage.module.css'
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { showToastMessage } from "../../../lib/toast";
import { toCutOff } from "../../../calculation/calculationlib";
import usePriceConversion from "../../../hooks/usePriceConversion";
import { useGlobalContext } from "../../../context/GlobalProvider";
import config from "../../../config/env";
import { isEmpty } from "../../../lib/isEmpty";
import { trendingTradePairs } from "../../../actions/currencyAction";

/** code start */

const WalletDetails = () => {
  const navigate = useNavigate();

  const { userdetails, wallet } = useSelector((state) => state?.user);
  // const { convertValue } = usePriceConversion("USDT", 'INR')
  const { convertValue, convertSecValue } = useGlobalContext();
  const { assetdetail } = useSelector((state) => state.wallet);

  const handleDeposit = () => {
    if (userdetails?.kycStatus == "approved") {
      navigate("/deposit");
    } else {
      showToastMessage(
        "Please complete your KYC verification to continue using deposits",
        "error",
      );
    }
  };

  const handleWithdraw = () => {
    if (userdetails?.kycStatus == "approved") {
      navigate("/withdraw");
    } else {
      showToastMessage(
        "Please complete your KYC verification to continue using withdrawals",
        "error",
      );
    }
  };

  return (
    <div
      className={`${styles.parent} ${config.ENV == "live" ? styles.liveParent : styles.demoParent}`}
    >
      <div className={styles.div1}>
        <div className={styles.graphCard}>
          <div className={styles.graphCardTop}>
            <img
              src={Images.circleLogo}
              alt="logo"
              className={styles.graphCardLogo}
            />
            <p className={styles.textXs}>Total Asset</p>
            <div className={"fs25"}>
              <p>
                {/* <span className='inrTag'>
                                    ₹
                                </span> */}
                {/* {wallet && convertValue(wallet.tradingBalance).toFixed(2)} */}
                {wallet && userdetails?.hideBalance
                  ? "*****"
                  : convertValue(wallet?.tradingBalance)}
              </p>
              <p className="fs18">
                <span>
                  {wallet && userdetails?.hideBalance
                    ? "*****"
                    : convertSecValue(wallet?.tradingBalance)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      {config.ENV == "live" ? (
        <>
          <div className={styles.div2}>
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.iconWrapper}>
                  <img
                    src={Images.deposit}
                    alt="Deposit"
                    className={styles.cardIcons}
                  />
                </div>
                <p className={styles.cardTitle}>Deposit</p>
                <p className={styles.cardDescription}>
                  Start growing your wealth today with quick, secure deposits!
                </p>
              </div>

              <div className={styles.cardBottom}>
                <Button
                  isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Deposit"
                  onClick={handleDeposit}
                  className="cardLightBtn"
                  selectedValue={null}
                />
              </div>
            </div>
          </div>
          <div className={styles.div3}>
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.iconWrapper}>
                  <img
                    src={Images.withdraw}
                    alt="withdraw"
                    className={styles.cardIcons}
                  />
                </div>
                <p className={styles.cardTitle}>Withdrawal</p>
                <p className={styles.cardDescription}>
                  Start growing your wealth today with quick, secure withdraw!
                </p>
              </div>
              <div className={styles.cardBottom}>
                <Button
                  isLoading={false}
                  loadingText="Redirecting..."
                  btnText="Withdraw"
                  onClick={handleWithdraw}
                  className="cardLightBtn"
                  selectedValue={null}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}

      <div className={styles.div4}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.iconWrapper}>
              <img
                src={Images.trade}
                alt="trade"
                className={styles.cardIcons}
              />
            </div>
            <p className={styles.cardTitle}>Trade</p>
            <p className={styles.cardDescription}>
              Grow your wealth with fast, secure trading today!
            </p>
          </div>
          <div className={styles.cardBottom}>
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText="Start Trading"
              onClick={() => navigate("/futures")}
              className="cardLightBtn"
              selectedValue={null}
            />
          </div>
        </div>
      </div>
      {config.ENV == "live" ? (
        <div className={styles.div5}>
          <div className={styles.card}>
            <div className={styles.cardTop}>
              {/* {(userdetails?.kycStatus == "pending" || userdetails?.kycStatus == "rejected" || userdetails?.kycStatus == "notVerified") ? <> */}
              {userdetails?.kycStatus != "approved" ? (
                <>
                  <p className={styles.cardTitle}>
                    Get verified to secure your account
                  </p>
                  <p className={styles.cardDescription}>
                    Provide your ID, a selfie, and personal information.
                  </p>
                </>
              ) : (
                <>
                  {userdetails?.kycStatus == "approved" && (
                    <>
                      {" "}
                      <p className={styles.cardTitle}>
                        {" "}
                        Your account has been successfully verified!
                      </p>
                      <p className={styles.cardDescription}>
                        Thank you for completing the verification process.
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
            <div className={styles.cardBottom}>
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText={
                  userdetails?.kycStatus != "approved"
                    ? "Get verified"
                    : "Verified"
                }
                onClick={() => navigate("/verification")}
                className="cardSuccessBtn"
                selectedValue={null}
              />
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      <div className={styles.div6}>
        <div
          className={`${styles.card} + " " + ${isEmpty(userdetails?.google2fa) ? styles.cardDangerBdr : ""}`}
        >
          <div className={styles.cardTop}>
            {userdetails?.google2fa ? (
              <>
                <p className={styles.cardTitle}>
                  Great news! Your account has been successfully verified.
                </p>
                <p className={styles.cardDescription}>
                  Go to passkey verification
                </p>
              </>
            ) : (
              <>
                <p className={styles.cardTitle}>
                  Get verified to your account 2FA Authentication
                </p>
                <p className={styles.cardDescription}>
                  We’re glad to have you back — enjoy exploring your account
                  with complete peace of mind!
                </p>
              </>
            )}
          </div>
          <div className={styles.cardBottom}>
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText="2FA"
              onClick={() => navigate("/security")}
              className={
                isEmpty(userdetails?.google2fa)
                  ? "cardDangerBtn"
                  : "cardLightBtn"
              }
              selectedValue={null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDetails;
