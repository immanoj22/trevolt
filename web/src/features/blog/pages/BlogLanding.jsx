/** package import */
import { useState, useEffect } from "react";
import { NavLink } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

/** local import */
import Images from "../../../utils/Images";
import BlogDetailsCard from "../components/BlogDetailsCard";
import styles from "../styles/blogLanding.module.css";
import Button from "../../../components/Button/Button";
import BlogDetailsList from "../components/BlogDetailsList";
import bannerVideo from "../../../assets/videos/candlestick.mp4";
import CollectionCard from "../components/CollectionCard";
import { getBlog } from "../../../actions/LearnAndBlogActions";

/** code start */

// const blogDetailsDatas = [
//     {
//         img: Images.blogImageOne,
//         date: '18-06-2025',
//         title: 'Saylor hints Strategys buying BTC',
//         desc: 'The current state of the forex and CFD market is dynamic and diverse. With a range of trending trade coins capturing attention, keep an eye out on the movement of the trade market and their prices.',
//     },
//     {
//         img: Images.blogImageOne,
//         date: '18-06-2025',
//         title: 'Saylor hints Strategys buying BTC',
//         desc: 'The current state of the forex and CFD market is dynamic and diverse. With a range of trending trade coins capturing attention, keep an eye out on the movement of the trade market and their prices.',
//     },
//     // {
//     //     img: Images.blogImageOne,
//     //     date: '18-06-2025',
//     //     title: 'Saylor hints Strategys buying BTC',
//     //     desc: 'The current state of the forex and CFD market is dynamic and diverse. With a range of trending trade coins capturing attention, keep an eye out on the movement of the trade market and their prices.',
//     // },
// ]

const BlogLanding = () => {
  const [searchParams] = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "true";
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [count, setCount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let reqData = { limit: limit, page: page, search: "" };
    fetchLearn(reqData);
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const fetchLearn = async (reqData) => {
    try {
      const result = await getBlog(reqData);

      // console.log('resultttt', result)

      if (result?.status) {
        setCount(result?.data?.count);
        setData((prev) => [
          ...(prev || []),
          ...(result?.data?.existingBlog || []),
        ]);
        setIsLoading(false);
      }
    } catch (error) {
      console.log("error learn", error);
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      let reqData = { limit: limit, page: page + 1, search: "" };
      setPage(page + 1);
      fetchLearn(reqData);
    }, 500);
  };

  return (
    <div className={styles.blogLanding} style={isEmbedded ? { paddingTop: 0 } : undefined}>
      <section className={`${styles.cardsSection} pb-5`}>
        {/* <div className={styles.videoSectionContainer}>
                    <video autoPlay muted loop className={styles.videoSectionFile}>
                        <source src={bannerVideo} type="video/mp4" />
                    </video>
                </div> */}
        <div className={styles.cardsSectionContent}>
          <div className="custom-container container">
            <div className={styles.sectionHeader} style={isEmbedded ? { paddingTop: 0 } : undefined}>
              <h1 className={`fw-700 text-center`}>Our Latest Blogs</h1>
              <div className={styles.blogCardsGrid}>
                {data?.length > 0 ? (
                  <div className={styles.blogCards + " row"}>
                    {data?.map((item, index) => (
                      <div className="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-4 col-xxl-3 mb-4 ">
                        <BlogDetailsCard item={item} key={index} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="my-5 py-5 text-center">No Data Found</div>
                )}

                {/* <div className={styles.blogLists}>
                                    {data?.map((item, index) => (
                                        <BlogDetailsList item={item} key={index} />
                                    ))}
                                </div> */}
                {/* {} */}
                {count > 10 && count !== data?.length && (
                  <div className="mt-4 d-flex align-items-center justify-content-center">
                    <Button
                      isLoading={false}
                      // loadingText="Loading..."
                      btnText={isLoading ? "Loading ..." : "Load More"}
                      onClick={handleLoadMore}
                      className="primaryBtn"
                      // selectedValue={currentResult}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* <section className='position-relative'>
                <div className={styles.backgroundPosition}>
                </div>
                <div className={styles.collectionCards}>
                    <div className='custom-container container'>
                        <div className={styles.bannerRow}>
                            <div className={styles.collectionGrids}>
                                <div className={styles.collectionContent}>
                                    <p className={`${styles.sectionDesc} d-flex align-items-center gap-2`}>
                                        <img src={Images.collection} alt="Collection" />
                                        Collection
                                    </p>
                                    <h4 className={`${styles.sectionTitle} mt-4`}>XRP ETF to be launched in US today</h4>
                                    <p className={`${styles.sectionDesc} my-3`}>The current state of the forex and CFD market is dynamic and diverse. With a range of trending trade coins capturing attention, keep an eye out on the movement of the trade market and their prices.</p>
                                    <NavLink to='#' className={styles.greenClr}>
                                        View the collection
                                    </NavLink>
                                </div>
                                <div className={styles.collectionCardGrid}>
                                    {collectionCardsData.map((item, index) => (
                                        <CollectionCard item={item} key={index} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
      {/* <section className={styles.allCardSection}>
                <div className={styles.cardsSectionContent}>
                    <div className='custom-container container'>
                        <div className={styles.bannerRow}>
                            <div className={styles.showCardsGrid}>
                                {blogDetailsDatas.map((item, index) => (
                                    <BlogDetailsCard item={item} key={index} />
                                ))}
                            </div>
                            <div className={styles.loadMore}>
                                <Button
                                    isLoading={false}
                                    // loadingText="Redirecting..."
                                    btnText="Load More"
                                    // onClick={handleStartTrading}
                                    className="primaryBtn"
                                    // selectedValue={currentResult}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
      {/* <section className={styles.downloadSection}>
                <div className={styles.downloadBanner}>
                    <img src={Images.downloadBG}
                        alt="downloadBG"
                        className={styles.imgSectionFile} />
                </div>
                <div className={styles.bannerSectionContent}>
                    <div className='custom-container container'>
                        <div className={`${styles.bannerRow} row align-items-center`}>
                            <div className='col-lg-5 '>
                                <div className={styles.bannerLeft}>
                                    <h1 className={`${styles.bannerTitleXl} text-center text-lg-start`}>
                                        Download now
                                    </h1>
                                    <p className={`${styles.bannerDescription} text-center text-lg-start`}>
                                        A fast, focused mobile trading experience with margin trading, advanced charts, an options chain and dependable order execution. Place orders, track positions and manage risk from anywhere.</p>
                                    <div className={styles.downloadLinks}>
                                        <NavLink to='#'>
                                            <img src={Images.downloadLinksOne} alt="Google_Play" />
                                        </NavLink>
                                        <NavLink>
                                            <img src={Images.downloadLinksTwo} alt="App_Store" />
                                        </NavLink>
                                    </div>
                                </div>
                            </div>
                            <div className='offset-lg-1 col-lg-6 mt-5 mt-lg-0'>
                                <div className={styles.bannerRight}>
                                    <img src={Images.downloadBannerImage} alt="Mobile" className={styles.bannerRightImage} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}
    </div>
  );
};

export default BlogLanding;
