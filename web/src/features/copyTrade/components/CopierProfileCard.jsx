// package import

import React, { useState } from "react";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

// local import

import styles from "../styles/copierProfileCard.module.css";
import Images from "../../../utils/Images";
import Button from "../../../components/Button/Button";

const CopierProfileCard = React.memo(({ key, item }) => {
  const { img, title, description, profileCount, pnl, roi, aum, traderspnl } =
    item;
  const [activeHeart, setActiveHeart] = useState(false);
  let navigate = useNavigate();

  const handleCopyNavigate = () => {
    navigate("/copy/profile");
  };

  const handleViewNavigate = () => {
    navigate("/copy/profile");
  };

  return (
    <div className={styles.card} key={key}>
      <div className={styles.cardHead}>
        <div className={styles.profileDetails}>
          <img src={img} alt={key} className={styles.image} />
          <div className={`{styles.cardContent} mt-2`}>
            <h5 className={styles.title}>{title}</h5>

            <p className={styles.description}>{description}</p>
          </div>
        </div>
        <button
          aria-label="heartIcon"
          className={`${styles.heartBtn}`}
          onClick={() => setActiveHeart(!activeHeart)}
        >
          {" "}
          {activeHeart ? (
            <IoMdHeart fontSize={20} />
          ) : (
            <IoMdHeartEmpty fontSize={20} />
          )}{" "}
        </button>
      </div>
      <div className={styles.cardBody}>
        <div>
          <p className={`${styles.labelValues} m-0`}>{profileCount}</p>
          <p className={`${styles.label}`}>Follower</p>
        </div>
        <div>
          <p className={`${styles.labelValues} m-0`}>{roi}</p>
          <p className={`${styles.label} text-end`}>ROI</p>
        </div>
      </div>
      <div className={styles.cardPoints}>
        <div>
          <p className={styles.label}>AUM</p>
          <p className={`${styles.labelValues} mt-1`}>{aum}</p>
        </div>
        <div className="tradersPnl">
          <p className={styles.label}>Copy Trader's Pnl</p>
          <p className={`${styles.labelValues} ${styles.textEnd} mt-1`}>
            {traderspnl}
          </p>
        </div>
      </div>
      <div className={styles.cardButtons}>
        <Button
          isLoading={false}
          // loadingText="Redirecting..."
          btnText="View Trader"
          onClick={handleCopyNavigate}
          className="successFillRectangleBtn"
          // selectedValue={currentResult}
        />
        <Button
          isLoading={false}
          // loadingText="Redirecting..."
          btnText="View Copier"
          onClick={handleViewNavigate}
          className="darkFillRectangleBtn"
          // selectedValue={currentResult}
        />
      </div>
    </div>
  );
});

export default CopierProfileCard;
