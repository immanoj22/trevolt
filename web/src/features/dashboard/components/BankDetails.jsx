/** package import */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/** local import */

import styles from '../styles/authInnerPage.module.css'
import Button from '../../../components/Button/Button'
import NoData from '../../../components/NoData/NoData'
import { MdRadioButtonUnchecked } from 'react-icons/md'
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa'
import Swal from 'sweetalert2';
import { useGlobalContext } from '../../../context/GlobalProvider'
import { deleteBankAccountHooks, setDefaultBankAccountHooks } from '../../../actions/walletAction'
import { getUserDetailsHooks } from '../../../actions/userAction'
import { showToastMessage } from '../../../lib/toast'
import { useSelector, useDispatch } from 'react-redux'
import { UserDetails } from '../../../redux/action'
import { useEffect } from 'react'
/** code start */

const BankDetails = ({ actions = true, bankDetails, pathName, selectedBankData }) => {

  const { theme } = useGlobalContext();
  const { userdetails } = useSelector((state) => state.user)
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [defaultBank, setDefaultBank] = useState(0)

  // Was missing — deleting a bank account only toasted the result and left
  // this component's `bankDetails` prop (sourced from Redux's
  // `userdetails.bankAccounts`, see MyProfile.jsx) untouched, so the row
  // stayed on screen until the next full login/refresh. Re-pulling and
  // re-dispatching userdetails here (same call GlobalProvider.jsx makes on
  // login) makes the deleted account disappear immediately.
  const refreshUserDetails = async () => {
    try {
      const resp = await getUserDetailsHooks();
      const result = resp?.data;
      if (result?.success) {
        dispatch(UserDetails({ userdetails: result?.result?.data }));
      }
    } catch (e) {
      console.log("refreshUserDetails__Err", e);
    }
  }





  const confirmation = (data) => {
    Swal.fire({
      title: "Are You Sure You Want to Change Your Delete Bank Detail?",
      icon: "warning",

      showCancelButton: true,
      confirmButtonText: "Continue",
      confirmButtonColor: theme == 'dark' ? "#2563EB" : "#2563EB",
      cancelButtonColor: theme == 'dark' ? "#2A2C2F" : "#eaecef",
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const cancelBtn = Swal.getCancelButton();

        if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
        if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
      }

    }).then(async (result) => {

      if (result.isConfirmed) {
        let reqData = { accountNo: data?.accountNo }
        const resp = await deleteBankAccountHooks(reqData, userdetails?.secretKey);
        if (resp?.data?.success) {
          showToastMessage(resp?.data?.message, 'success');
          await refreshUserDetails();
        } else if (!resp?.data?.success) {
          if (resp?.data?.message) {
            showToastMessage(resp?.data?.message, 'error')
          }
        }
      } else if (result.isDenied) {

      }
    });
  }


  const handleSetDefault = async (item, index) => {
    const prevDefault = defaultBank;
    setDefaultBank(index); // optimistic
    selectedBankData(item);

    try {
      const reqData = { accountNo: item?.accountNo };
      const resp = await setDefaultBankAccountHooks(reqData, userdetails?.secretKey);

      if (resp?.data?.success) {
        showToastMessage(resp?.data?.message, 'success');
      } else {
        setDefaultBank(prevDefault);
        showToastMessage(resp?.data?.message || 'Failed to set default bank', 'error');
      }
    } catch (err) {
      setDefaultBank(prevDefault);
      showToastMessage('Something went wrong', 'error');
    }
  };


  const MAX_BANK_ACCOUNTS = 3;
  const hasReachedBankLimit = (bankDetails?.length || 0) >= MAX_BANK_ACCOUNTS;

  const handleAddBank = () => {
    if (hasReachedBankLimit) {
      showToastMessage(`Maximum ${MAX_BANK_ACCOUNTS} bank accounts allowed`, 'error');
      return;
    }
    navigate('/add-bank', { state: { navigatepath: pathName } })
  }


  useEffect(() => {
    if (bankDetails?.length) {
      const primaryIndex = bankDetails.findIndex(b => b.isPrimary);
      setDefaultBank(primaryIndex !== -1 ? primaryIndex : 0);
    }
  }, [bankDetails]);

  return (

    <>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitleSm}>Bank Details</p>
        <Button
          isLoading={false}
          loadingText="Redirecting..."
          btnText="Add Bank"
          onClick={handleAddBank}
          className="cardSuccessBtn"
          selectedValue={null}
          disabled={hasReachedBankLimit}
        />
      </div>

      <div className='mt-4'>
        {
          bankDetails && bankDetails?.length
            ?
            <div className={styles.bankDetailsContainer}>
              {bankDetails.map((item, index) => (
                <div
                  className={`${styles.cardBorder} ${defaultBank === index ? styles.active : ""}`}
                  onClick={() => handleSetDefault(item, index)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.selectIcon}
                    onClick={() => handleSelectBank(index)}
                    style={{ cursor: 'pointer' }}

                  >

                    {
                      defaultBank == index ? <FaCheckCircle />
                        : <FaRegCircle />
                    }
                  </div>
                  <div className={`${styles.singleFormWrapperSm} `}>
                    <p className={styles.singleFormLabel}>
                      Bank Name
                    </p>
                    <p className={`${styles.singleFormValue}`}>
                      {item?.bankName}
                    </p>
                  </div>
                  <div className={`${styles.singleFormWrapperSm} mt-4`}>
                    <p className={styles.singleFormLabel}>
                      Account Number
                    </p>
                    <p className={`${styles.singleFormValue}`}>
                      {item?.accountNo}
                    </p>
                  </div>
                  <div className={`${styles.singleFormWrapperSm} mt-4`}>
                    <p className={styles.singleFormLabel}>
                      IFSC
                    </p>
                    <p className={`${styles.singleFormValue}`}>
                      {item?.bankcode}
                    </p>
                  </div>
                  <div className={`${styles.singleFormWrapperSm} mt-4`}>
                    <p className={styles.singleFormLabel}>
                      Holder Name
                    </p>
                    <p className={`${styles.singleFormValue}`}>
                      {item?.holderName}
                    </p>
                  </div>
                  {/* {actions &&
                    <div className={styles.bankDetailsActionContainer}>
                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Edit"
                        onClick={() => navigate('/edit-bank', { state: item })}
                        className="cardSuccessBtnXs"
                        selectedValue={null}
                      />
                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Delete"
                        onClick={() => confirmation(item)}
                        className="cardBtnRectangleXs"
                        selectedValue={null}
                      />
                    </div>
                  } */}

                  {actions &&
                    <div
                      className={styles.bankDetailsActionContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Edit"
                        onClick={() => navigate('/edit-bank', { state: item })}
                        className="cardSuccessBtnXs"
                        selectedValue={null}
                      />
                      <Button
                        isLoading={false}
                        loadingText="Redirecting..."
                        btnText="Delete"
                        onClick={() => confirmation(item)}
                        className="cardBtnRectangleXs"
                        selectedValue={null}
                      />
                    </div>
                  }
                </div>
              ))}
            </div>
            :
            <div className='mt-4'>
              {
                bankDetails && bankDetails?.length
                  ?
                  <div className={styles.bankDetailsContainer}>
                    {bankDetails.map((item, index) => (
                      <div
                        className={`${styles.cardBorder} ${defaultBank === index ? styles.active : ""}`}
                        // onClick={() => handleSetDefault(item, index)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* <div className={styles.selectIcon}
                                        onClick={() => handleSelectBank(index)}
                                        style={{ cursor: 'pointer' }}
                                    >

                                        {
                                            defaultBank == index ? <FaCheckCircle />
                                                : <FaRegCircle />
                                        }
                                    </div> */}

                        <div className={styles.selectIcon} onClick={() => handleSetDefault(item, index)}>
                          {
                            defaultBank == index ? <FaCheckCircle />
                              : <FaRegCircle />
                          }
                        </div>


                        <div className={`${styles.singleFormWrapperSm} `}>
                          <p className={styles.singleFormLabel}>
                            Bank Name
                          </p>
                          <p className={`${styles.singleFormValue}`}>
                            {item?.bankName}
                          </p>
                        </div>
                        <div className={`${styles.singleFormWrapperSm} mt-4`}>
                          <p className={styles.singleFormLabel}>
                            Account Number
                          </p>
                          <p className={`${styles.singleFormValue}`}>
                            {item?.accountNo}
                          </p>
                        </div>
                        <div className={`${styles.singleFormWrapperSm} mt-4`}>
                          <p className={styles.singleFormLabel}>
                            IFSC
                          </p>
                          <p className={`${styles.singleFormValue}`}>
                            {item?.bankcode}
                          </p>
                        </div>
                        <div className={`${styles.singleFormWrapperSm} mt-4`}>
                          <p className={styles.singleFormLabel}>
                            Holder Name
                          </p>
                          <p className={`${styles.singleFormValue}`}>
                            {item?.holderName}
                          </p>
                        </div>
                        {/* {actions &&
                                        <div className={styles.bankDetailsActionContainer}>
                                            <Button
                                                isLoading={false}
                                                loadingText="Redirecting..."
                                                btnText="Edit"
                                                onClick={() => navigate('/edit-bank', { state: item })}
                                                className="cardSuccessBtnXs"
                                                selectedValue={null}
                                            />
                                            <Button
                                                isLoading={false}
                                                loadingText="Redirecting..."
                                                btnText="Delete"
                                                onClick={() => confirmation(item)}
                                                className="cardBtnRectangleXs"
                                                selectedValue={null}
                                            />
                                        </div>
                                    } */}

                        {actions &&
                          <div
                            className={styles.bankDetailsActionContainer}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              isLoading={false}
                              loadingText="Redirecting..."
                              btnText="Edit"
                              onClick={() => navigate('/edit-bank', { state: item })}
                              className="cardSuccessBtnXs"
                              selectedValue={null}
                            />
                            <Button
                              isLoading={false}
                              loadingText="Redirecting..."
                              btnText="Delete"
                              onClick={() => confirmation(item)}
                              className="cardBtnRectangleXs"
                              selectedValue={null}
                            />
                          </div>
                        }

                      </div>
                    ))}
                  </div>
                  :

                  <div className={styles.cardBorder}>
                    <NoData content={"No bank details added"} />
                  </div>
              }
            </div>
        }
      </div>
    </>
  )
}

export default BankDetails