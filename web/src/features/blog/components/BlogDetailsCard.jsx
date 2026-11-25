/** package import */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/** local import */
import styles from "../styles/blogDetailsCard.module.css";
import config from "../../../config/env";

/** code start */

const BlogDetailsCard = React.memo(({ key, item }) => {
  // console.log('items', item)

  const { image, title, blogdescription, _id, slug } = item;

  const navigate = useNavigate();

  return (
    <Link
      to={`/blog-details/${slug}`}
      state={{ id: _id, slug: slug }}
      className="h-100 d-block"
    >
      <div
        className={styles.blogDetails + " h-100"}
        // onClick={() => navigate('/blog-details')}
      >
        {/* <img src={img} alt="Blog" className={styles.blogImage} /> */}
        <img
          src={config.IMG_URL + image}
          alt="Blog"
          className={styles.blogImage}
        />

        <div className="p-3">
          {/* <p className={`${styles.blogDesc} mt-2`}>{date} Category</p> */}
          <p className={`${styles.blogTitle} mt-2`}>{title}</p>
          <p className={`${styles.blogDescOne} mt-2`}>{blogdescription}</p>
          {/* <p className={`${styles.blogTitle} mt-3`}>Trevolt</p> */}
        </div>
      </div>
    </Link>
  );
});

export default BlogDetailsCard;
