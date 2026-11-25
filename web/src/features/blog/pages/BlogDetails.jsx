/** package import */
import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';

/** local import */

import Images from "../../../utils/Images";
import BlogDetailsCard from "../components/BlogDetailsCard";
import BlogDetailsList from "../components/BlogDetailsList";
import styles from "../styles/blogDetails.module.css";
import Button from "../../../components/Button/Button";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getParticularBlog } from "../../../actions/LearnAndBlogActions";
import SeoHelmet from "../../../meta/SeoHelmet";
import { MetaTags } from "../../../meta/metaTags";

/** code start */

const BlogDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();
  // console.log('slug', slug)
  const { id } = location.state || "";
  const [data, setData] = useState();

  useEffect(() => {
    fetchSubCourse();
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const fetchSubCourse = async () => {
    try {
      const result = await getParticularBlog(slug);

      if (result?.status) {
        setData(result?.data);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // console.log('dataaaaaa', data);

  return (
    <>
      {
        data && (
          <SeoHelmet
            title={data?.meta_title}
            description={data?.meta_description}
            image={data?.image}
            keywords={data?.meta_keywords}
          />
        )

        // <MetaTags
        //     pageContentKey={"blog"}
        //     // dynamic
        // />
        // <SeoHelmet

        // />
      }

      <div className={styles.blogDetailsLanding}>
        <section className={styles.detailsSection}>
          <div className={styles.detailSectionContent}>
            <div className="custom-container container">
              <div className={styles.sectionHeader}>
                <div className="d-flex justify-content-end">
                  <Button
                    className="backBtn"
                    btnText={"Back"}
                    onClick={() => navigate(-1)}
                  />
                </div>
                <div className={styles.blogDetailGrid + " mt-4"}>
                  <div className={styles.blogCards}>
                    <div
                      className={
                        styles.blogDetails +
                        " row d-flex justify-content-center"
                      }
                    >
                      {/* <img src={Images.blogImageOne} alt="Blog" className={styles.blogImage} /> */}
                      <div className="col-12 col-sm-11 col-md-10 col-lg-9 col-xl-8 col-xxl-8">
                        <h1
                          className={`${styles.bannerTitleXl} text-start mb-0`}
                        >
                          {data?.title}
                        </h1>
                        {/* <p className={`${styles.blogDesc} mt-2`}>18-06-2025 Category</p> */}
                        {/* <p className={`${styles.blogTitle} mt-2`}>Saylor hints Strategys buying BTC</p> */}
                        <p className={`${styles.blogDescOne} mt-2 text-start`}>
                          {data?.blogdescription}
                        </p>
                        <div
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data?.content) }}
                          className="mt-5"
                        ></div>
                      </div>
                    </div>
                  </div>
                  {/* <div className={styles.blogLists}>
                                    <div className={styles.listSection}>
                                        <div>
                                            <img src={Images.blogImageOne} alt='list' className={styles.listImg} />
                                        </div>
                                        <div>
                                            <p className={styles.listDesc}>18-06-2025 Category</p>
                                            <p className={`${styles.listTitle} mt-1`}>Saylor hints Strategys buying BTC</p>
                                        </div>
                                    </div>
                                    <div className={styles.listSection}>
                                        <div>
                                            <img src={Images.blogImageOne} alt='list' className={styles.listImg} />
                                        </div>
                                        <div>
                                            <p className={styles.listDesc}>18-06-2025 Category</p>
                                            <p className={`${styles.listTitle} mt-1`}>Saylor hints Strategys buying BTC</p>
                                        </div>
                                    </div>
                                    <div className={styles.listSection}>
                                        <div>
                                            <img src={Images.blogImageOne} alt='list' className={styles.listImg} />
                                        </div>
                                        <div>
                                            <p className={styles.listDesc}>18-06-2025 Category</p>
                                            <p className={`${styles.listTitle} mt-1`}>Saylor hints Strategys buying BTC</p>
                                        </div>
                                    </div>
                                    <div className={styles.listSection}>
                                        <div>
                                            <img src={Images.blogImageOne} alt='list' className={styles.listImg} />
                                        </div>
                                        <div>
                                            <p className={styles.listDesc}>18-06-2025 Category</p>
                                            <p className={`${styles.listTitle} mt-1`}>Saylor hints Strategys buying BTC</p>
                                        </div>
                                    </div>
                                </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogDetails;
