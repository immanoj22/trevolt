/** package import */
import React, { useState } from "react";
import { IoArrowForward } from "react-icons/io5";
import { NavLink } from "react-bootstrap";

/** local import */
import styles from "../styles/collectionCard.module.css";

/** code start */

const CollectionCard = React.memo(({ key, item }) => {
  const { img, date, title, description } = item;

  return (
    <div>
      <section>
        <div className={styles.collectionCard}>
          <img src={img} alt={title} className={styles.collectionImg} />
          <div className="p-3">
            <p className={styles.cardDescOne}>TREVOLT UPDATES</p>
            <p className={`${styles.cardTitle} mt-3`}>{title}</p>
            <p className={`${styles.cardDesc} mt-3`}>{description}</p>
            <NavLink
              to="#"
              className="mt-3 d-flex align-items-center justify-content-between"
            >
              <p className={`${styles.cardDescOne}`}>{date}</p>
              <IoArrowForward fontSize={20} />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
});

export default CollectionCard;
