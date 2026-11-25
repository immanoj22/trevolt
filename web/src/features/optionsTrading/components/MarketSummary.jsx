/** PACKAGE IMPORT */
import React from 'react'
import { IoIosStar, IoIosStarOutline } from "react-icons/io";

/**LOCAL FILES IMPORT */

import styles from "../styles/marketSummary.module.css"
import CustomDropdown from '../../../components/UiComponents/DropDownComponent';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { futureAddFavouritePair } from '../../../actions/futureActions';
import { showToastMessage } from '../../../lib/toast';
import { formatDisplayPair } from '../../../lib/pairDisplay';

/**ACTIONS */

/** CODE START */

const MarketSummary = (props) => {

    const { tikerRoot } = useParams()
    const { userdetails } = useSelector((state) => state.user);
    const { optionTradePair, optionTicker, optionContractData } = useSelector((state) => state.option);

    const currentContract = [
        ...(optionContractData?.callpair ?? []),
        ...(optionContractData?.putpair ?? [])
    ].find((el) => el?.tickerRoot === tikerRoot)

    const isFavourite = userdetails?.futureFav?.some((f) => f.pairName === tikerRoot);

    const handleAddFavourite = async (e) => {
        e.stopPropagation();
        if (!currentContract?._id) return;
        const { status, message } = await futureAddFavouritePair({ pairId: currentContract._id, pairName: currentContract.tickerRoot }, userdetails?.secretKey);
        showToastMessage(message, status ? 'success' : 'error');
    };

    return (
        <div className={styles.marketSummaryPart}>
            <div className={`d-flex justify-content-between ${styles.marketSummaryDropdownPart}`}>
                <div className='d-flex align-items-center gap-1'>
                    <span
                        role='button'
                        aria-label='star'
                        className={`${styles.toggleFavorite} ${isFavourite ? styles.active : ''}`}
                        onClick={handleAddFavourite}
                    >
                        {isFavourite ? <IoIosStar /> : <IoIosStarOutline />}
                    </span>
                    <p className={styles.selectedCellText}>{formatDisplayPair(tikerRoot)}</p>
                </div>
                <div className='d-flex'>
                    <CustomDropdown
                        toggleElement={
                            <div className={styles.deltaDropDownToogle}>
                                <p>Delta <span>{parseFloat(optionTicker?.delta).toFixed(2)}</span></p>
                            </div>
                        }
                        menuItems={
                            <ul className={styles.deltaDropDownMenu}>
                                <li>
                                    <h5>
                                        Gamma
                                    </h5>
                                    <p>
                                        {parseFloat(optionTicker?.gamma).toFixed(2)}
                                    </p>
                                </li>
                                <li>
                                    <h5>
                                        Theta
                                    </h5>
                                    <p>
                                        {parseFloat(optionTicker?.theta).toFixed(2)}
                                    </p>
                                </li>
                                <li>
                                    <h5>
                                        Vega
                                    </h5>
                                    <p>
                                        {parseFloat(optionTicker?.vega).toFixed(2)}
                                    </p>
                                </li>
                            </ul>
                        }
                    />
                    <CustomDropdown
                        toggleElement={
                            <div className={styles.lotSizeDropDownToggle}>
                                <p>Lot Size <span>{optionTradePair?.minAmount} {optionTradePair?.baseCurrency}</span></p>
                            </div>
                        }
                    // menuItems={
                    //     <ul className={styles.lotSizeDropDownMenu}>
                    //         <li>
                    //             <div className={styles.dropdownTitle}>
                    //                 <h4>
                    //                     Lorem ipsum dolor sit
                    //                 </h4>
                    //             </div>
                    //         </li>
                    //         <li>
                    //             <h5>
                    //                 Lorem ipsum dolor sit
                    //             </h5>
                    //             <p>
                    //                 consectetur adipisicing elit.
                    //             </p>
                    //         </li>
                    //         <li>
                    //             <h5>
                    //                 Lorem ipsum dolor sit
                    //             </h5>
                    //             <p>
                    //                 consectetur adipisicing elit.
                    //             </p>
                    //         </li>
                    //         <li>
                    //             <h5>
                    //                 Lorem ipsum dolor sit
                    //             </h5>
                    //             <p>
                    //                 consectetur adipisicing elit.
                    //             </p>
                    //         </li>
                    //         <li>
                    //             <h5>
                    //                 Lorem ipsum dolor sit
                    //             </h5>
                    //             <p>
                    //                 consectetur adipisicing elit.
                    //             </p>
                    //         </li>
                    //         <li>
                    //             <h5>
                    //                 Lorem ipsum dolor sit
                    //             </h5>
                    //             <p>
                    //                 consectetur adipisicing elit.
                    //             </p>
                    //         </li>
                    //         <li>
                    //             <h5>
                    //                 Lorem ipsum dolor sit
                    //             </h5>
                    //             <p>
                    //                 consectetur adipisicing elit.
                    //             </p>
                    //         </li>
                    //     </ul>
                    // }
                    />
                </div>
            </div>
            <div className={styles.marketSummaryDetails}>
                <ul>
                    <li>
                        <h3>24h Changes</h3>
                        <p>{optionTicker?.percent24Change ?? 0}</p>
                    </li>
                    <li>
                        <h3>Price</h3>
                        <p>${optionTicker?.last ?? 0}</p>
                    </li>
                    <li>
                        <h3>Mark IV</h3>
                        <p>{parseFloat(optionTicker?.markIV).toFixed(2) ?? 0}%</p>
                    </li>
                    <li>
                        <h3>24h Vol</h3>
                        <p>${optionTicker?.volume ?? 0}</p>
                    </li>
                    {/* <li>
                        <h3>OI</h3>
                        <p>${optionTicker.volume}</p>
                    </li> */}
                </ul>
            </div>
        </div>
    )
}
export default MarketSummary