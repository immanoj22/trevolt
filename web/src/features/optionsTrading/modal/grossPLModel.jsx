import React, { useEffect, useRef, useState } from 'react';
import { Modal } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import Images from "../../../utils/Images";
import { toPng } from 'html-to-image';
import { FaXTwitter } from 'react-icons/fa6';
import { FaCopy, FaDownload, FaFacebookF, FaRedditAlien } from 'react-icons/fa';
import { RiWhatsappFill } from 'react-icons/ri';
import { IoIosSend } from 'react-icons/io';
import styles from "../styles/modal.module.css";

const GrossPLModel = (props) => {
    const { show, handleClose } = props
    const contentRef1 = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);

    const processImageHandle = async () => {
        if (contentRef1.current === null) return;
        try {
            const dataUrl = await toPng(contentRef1.current);
            setImgSrc(dataUrl)
        } catch (err) {
        }
    };
    const handleDownload = async () => {
        if (!imgSrc) return;
        const dataUrl = imgSrc;
        const link = document.createElement('a');
        link.download = 'gross-status.png';
        link.href = dataUrl;
        link.click();
    };

    useEffect(() => {
        if (show) {
            processImageHandle()
        }
    }, [show])

    return (
        <div>
            <Modal
                centered
                size="md"
                backdrop="static"
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                <Modal.Header className={styles.modalPrimaryHeader}>
                    <h4 className={`${styles.modalHeaderTitle} `}>Title</h4>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header>
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.grossContentContainer}>
                        {
                            imgSrc &&
                            <img src={imgSrc} alt="image" />
                        }
                        <div className={styles.grossContentWrapper}>
                            <GrossProfitAndLoseContent containerRef={contentRef1} type='profit' />
                            {/* <GrossProfitAndLoseContent containerRef={contentRef1} type='lose' /> */}
                        </div>
                    </div>
                    <div className={styles.shareOptionPart}>
                        <ul>
                            <li>
                                <button aria-label='twitter'>
                                    <FaXTwitter />
                                </button>
                            </li>
                            <li>
                                <button aria-label='facebook'>
                                    <FaFacebookF />
                                </button>
                            </li>
                            <li>
                                <button aria-label='whatsapp'>
                                    <RiWhatsappFill />
                                </button>
                            </li>
                            <li>
                                <button aria-label='send'>
                                    <IoIosSend />
                                </button>
                            </li>
                            <li>
                                <button aria-label='reddit'>
                                    <FaRedditAlien />
                                </button>
                            </li>
                            <li>
                                <button aria-label='copy'>
                                    <FaCopy />
                                </button>
                            </li>
                            <li>
                                <button aria-label='download' onClick={handleDownload}>
                                    <FaDownload />
                                </button>
                            </li>
                        </ul>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

const GrossProfitAndLoseContent = ({ containerRef, type = "profit" }) => {
    const grossClassName = type == "profit" ? "grossProfitContent" : "grossLoseContent"
    return <div ref={containerRef} className={styles[grossClassName]}>
        <div className={styles.cardLogo}>
            <img src={Images.logo} alt="logo" />
        </div>
        <div className={styles.grossDetails}>
            <h1>5000 INR</h1>
            <h2>20% Return on Deposit Capital</h2>
            <p>Apr 26 - May 28</p>
            <div>
                <h2>Instant Equity</h2>
                <p>$42530.222</p>
            </div>
        </div>
        <div className={styles.grossValues}>
            <div className="d-flex gap-4">
                <div>
                    <h2>Entry Price</h2>
                    <p>100000 USD</p>
                </div>
                <div>
                    <h2>Entry Price</h2>
                    <p>100000 USD</p>
                </div>
            </div>
            <div className={styles.qrCodePart}>
                <img src={Images.qrcodeImg} alt="img" />
                <p>10% Free Discount</p>
            </div>
        </div>
    </div>
}

export default GrossPLModel;
