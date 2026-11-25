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
import { showToastMessage } from '../../../lib/toast';
import { dateTimeFormat } from '../../../lib/dateTimeHelper';
import { useSelector } from "react-redux";
import { capitalize, formatValue } from '../../../lib/Common';
import { formatDisplayPair } from '../../../lib/pairDisplay';
import Loader from '../../../components/Loader/Loader';
import QRCode from 'react-qr-code';
import isEmpty from 'is-empty';
import config from '../../../config/env';
import { futureOgGenerateUpdate } from '../../../actions/futureActions';
import { useGlobalContext } from '../../../context/GlobalProvider';

const GrossPLModel = (props) => {
    const { show, handleClose, record } = props
    const { userdetails } = useSelector((state) => state.user);
    const contentRef1 = useRef(null);
    const [links, setLinks] = useState("")

    const processImageHandle = async () => {
        if (contentRef1?.current === null) return;
        try {
            const dataUrl = await toPng(contentRef1.current);
            return dataUrl
        } catch (err) {
            return ''
        }
    };

    const handleDownload = async () => {
        let imgSrc = await processImageHandle()
        if (!imgSrc) return;
        const dataUrl = imgSrc;
        const link = document.createElement('a');
        link.download = record.pnl > 0 ? `profit-${record.pairName}-${dateTimeFormat(new Date().getTime(), 'YYYY-MM-DD')}.png` : `loss-${record.pairName}-${dateTimeFormat(new Date().getTime(), 'YYYY-MM-DD')}.png`;
        link.href = dataUrl;
        link.click();
    };

    const onCopyHandle = () => {
        // const origin = window.location.origin;
        // const dynamicURl = "sfkjashfiwour23h2kjnsdfnskjdh";
        // const shareURL = `share/${dynamicURl}`;
        const copyURL = encodeURI(links);

        navigator.clipboard.writeText(copyURL)
            .then(() => {
                showToastMessage("Link Copied", "success");
            })
            .catch((err) => {
                showToastMessage("Failed to Copy", "error");
            });
    };
    const onRedirectHandle = (type = "") => {
        let redirectLnk = ""
        if (type === 'twitter') {
            redirectLnk = `https://twitter.com/intent/tweet?url=${links}`
        } else if (type === 'facebook') {
            redirectLnk = `https://www.facebook.com/sharer/sharer.php?u=${links}`
        } else if (type === 'whatsapp') {
            redirectLnk = `https://api.whatsapp.com/send?${links}`
        } else if (type === 'reddit') {
            redirectLnk = `https://www.reddit.com/submit?url=${links}`
        } else if (type === 'telegram') {
            redirectLnk = `https://t.me/share/url?url=${links}`
        }
        window.open(redirectLnk, '_blank')
    };

    const updateOGImage = async () => {
        try {
            const buffData = await processImageHandle();
            if (!isEmpty(buffData)) {
                const formData = new FormData();

                formData.append("buffData", buffData);
                formData.append("pairName", record.pairName);
                formData.append("positionSide", record.positionSide);
                formData.append("accountId", record.accountId);
                formData.append("entryPrice", record.entryPrice);
                formData.append("close_price", record.close_price);
                formData.append("referralCode", userdetails?.referralCode);
                formData.append("pnl_percen", record?.pnl_percen);
                formData.append("pnl", record?.pnl);
                formData.append("date", dateTimeFormat(new Date().getTime(), "DD/MM/YYYY"));
                const { status, message, result } = await futureOgGenerateUpdate(formData);
                if (status) {
                    setLinks(result.share_url)
                } else {
                    showToastMessage(message, 'error')
                }
            }
        } catch (e) {
            console.log("updateOGImage_err", e);
        }
    }

    useEffect(() => {
        if (show) {
            updateOGImage()
        }
    }, [contentRef1?.current])

    return (
        <div>
            <Modal
                centered
                size="md"
                // backdrop=""
                show={show}
                onHide={handleClose}
                className={styles.modalPrimary}
            >
                {/* <Modal.Header className={styles.modalPrimaryHeader}>
                    <button
                        aria-label='closeIcon'
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        <IoClose />
                    </button>
                </Modal.Header> */}
                <Modal.Body className={styles.modalPrimaryBody}>
                    <div className={styles.grossContentContainer}>
                        {/* {
                            imgSrc &&
                            <img src={imgSrc} alt="image" />
                        } */}
                        {/* <Loader/> */}
                        <div className={styles.grossContentWrapper}>
                            <GrossProfitAndLoseContent containerRef={contentRef1} type={parseFloat(record?.pnl) >= 0 ? 'profit' : 'loss'} record={record} />
                            {/* <GrossProfitAndLoseContent containerRef={contentRef1} type='lose' /> */}
                        </div>
                    </div>
                    <div className={styles.shareOptionPart}>
                        <ul>
                            <li>
                                <button aria-label='twitter' onClick={() => { onRedirectHandle('twitter') }} >
                                    <FaXTwitter />
                                </button>
                            </li>
                            <li>
                                <button aria-label='facebook' onClick={() => { onRedirectHandle('facebook') }}>
                                    <FaFacebookF />
                                </button>
                            </li>
                            <li>
                                <button aria-label='whatsapp' onClick={() => { onRedirectHandle('whatsapp') }} >
                                    <RiWhatsappFill />
                                </button>
                            </li>
                            <li>
                                <button aria-label='send' onClick={() => { onRedirectHandle('telegram') }}>
                                    <IoIosSend />
                                </button>
                            </li>
                            <li>
                                <button aria-label='reddit' onClick={() => { onRedirectHandle('reddit') }}>
                                    <FaRedditAlien />
                                </button>
                            </li>
                            <li>
                                <button aria-label='copy' onClick={onCopyHandle}>
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

const GrossProfitAndLoseContent = ({ containerRef, type = "profit", record }) => {
    const { userdetails } = useSelector((state) => state.user);
    const { showCurrency, secondaryCurrency } = useSelector(
        (state) => state.wallet,
    );
    const { convertTo } = useGlobalContext()
    const grossClassName = type == "profit" ? "grossProfitContent" : "grossLoseContent"
    return <div ref={containerRef} className={styles[grossClassName]}>
        <div className={styles.cardLogo}>
            <img src={Images.logo} alt="logo" />
        </div>
        <div className={styles.grossDetails}>
            <h2>{type} | {capitalize(record.positionSide)}</h2>
            <h1>{convertTo(record?.pnl?.toFixed(2), "USD", 'INR')} INR</h1>
            <div className='d-flex gap-2 mt-2'>
                {/* <p className={styles.shortOrLongLabel}>Short</p> */}
                <p className={styles.dateLabel}>{dateTimeFormat(new Date().getTime(), "DD/MM/YYYY")}</p>
            </div>
            <div className={styles.roePart}>
                <h2>{formatValue(record?.pnl_percen, 2)}% <span>(INR)</span></h2>
                {/* <p>ROE %</p> */}
            </div>
        </div>
        <div className={styles.grossValues}>
            <div className="d-flex gap-4">
                <div>
                    <h2>Entry Price</h2>
                    <p>{record?.entryPrice} {formatDisplayPair('USDT')}</p>
                </div>
                <div>
                    <h2>Exit Price</h2>
                    <p>{record?.close_price} {formatDisplayPair('USDT')}</p>
                </div>
            </div>
            <div className={styles.qrCodePart}>
                {/* <img
                    src={Images.qrcodeImg}
                    alt="img"
                /> */}
                {!isEmpty(userdetails) ?
                    <QRCode
                        size={120}
                        value={`${config.FRONT_URL}/affiliate/${userdetails?.referralCode}`}
                        viewBox={`0 0 120 120`}
                    />
                    : ""}
                <p>Ref Code: <span>{userdetails?.referralCode}</span></p>
            </div>
        </div>
    </div>
}

export default GrossPLModel;