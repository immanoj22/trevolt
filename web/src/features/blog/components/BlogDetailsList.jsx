/** package import */
import React, { useState } from "react";

/** local import */
import styles from "../styles/blogDetailsList.module.css";

/** code start */

const BlogDetailsList = React.memo(({ key, item }) => {
  const { img, date, title, desc } = item;

  return (
    <div>
      <section>
        <div className={styles.listSection}>
          <div>
            <img src={img} alt={title} className={styles.listImg} />
          </div>
          <div>
            <p className={styles.listDesc}>{date} Category</p>
            <p className={`${styles.listTitle} mt-1`}>{title}</p>
          </div>
        </div>
      </section>
    </div>
  );
});

export default BlogDetailsList;
