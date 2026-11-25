import React, { useEffect, useState } from 'react'
import styles from "../styles/authInnerPage.module.css";
import Button from '../../../components/Button/Button';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';

/** Actions */
import { createCashfreeRequest, getUserDetailsHooks, panKycVerfifactionStatusChecking, verificationStatus } from '../../../actions/userAction';
import AddPhoneNumber from '../modal/AddPhoneNumber';
import KycVerificationModal from '../modal/KycVerificationModal';
import KycSubmittedModal from '../modal/KycSubmittedModal';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { UserDetails } from '../../../redux/action';
import { showToastMessage } from '../../../lib/toast';
const statusEnum = {
  pending: "Pending",
  AUTHENTICATED: "Approved",
  approved: "Approved",
  expired: "Pending",
  CONSENT_DENIED: 'Pending',
  FAILURE: 'Rejected',
  rejected: 'Rejected',
  notVerified: "Not-Verified",
}


export const KYC_STATUS = {
  NOT_VERIFIED: "notVerified",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
};

export const KYC_STEPS = [
  {
    key: "kycMobileStatus",
    title: "Mobile Verification",
  },
  {
    key: "kycAadharStatus",
    title: "Aadhaar Verification",
  },
  {
    key: "kycPanCardStatus",
    title: "PAN Verification",
  },
  {
    key: "kycLiveNessStatus",
    title: "Liveness Verification",
  },
  {
    key: "kycfinancialStatus",
    title: "Financial Verification",
  },
];

export default function VerificationCard() {
  const { theme } = useGlobalContext()
  const dispatch = useDispatch();
  const { userdetails } = useSelector((state) => state.user);
  const [showNumber, setShowNumber] = useState(false);
  const [kycVerifyModal, setKycVerifymodal] = useState(false); // false
  const [kycSubmitModal, setKycSubmitmodal] = useState(false);
  const [isActiveModelNumber, setIsActiveModelNumber] = useState(2);
  const [panKycFirstStep, setPanKycFirstStep] = useState('');
  const [pendingDocsText, setPendingDocsText] = useState('Pending Docs')

  const getKycInfo = (userdetails) => {

    // Check rejected first
    for (const step of KYC_STEPS) {

      const status = userdetails?.[step.key];

      if (status === KYC_STATUS.REJECTED) {
        return `${step.title} was rejected. Please try again.`
        return {
          status: "rejected",
          step: step.key,
          title: step.title,
          message:
            userdetails?.reason ||
            `${step.title} was rejected. Please try again.`,
        };
      }
    }

    // Find current active step
    for (const step of KYC_STEPS) {

      const status = userdetails?.[step.key];

      if (status === KYC_STATUS.NOT_VERIFIED) {
        return `${step.title} is pending. Please complete verification.`
        return {
          status: "notVerified",
          step: step.key,
          title: step.title,
          message: `${step.title} is pending. Please complete verification.`,
        };
      }

      if (status === KYC_STATUS.PENDING) {
        return `${step.title} is currently under review.`
        return {
          status: "pending",
          step: step.key,
          title: step.title,
          message: `${step.title} is currently under review.`,
        };
      }
    }

    // All approved
    return "Your identity has been successfully verified. Your dashboard is now active and fully accessible."
    return {
      status: "approved",
      message:
        "Your identity has been successfully verified. Your dashboard is now active and fully accessible.",
    };
  };

  const normalize = (value) => String(value || "").toLowerCase();

  const isPendingStage = (value) => ["pending"].includes(normalize(value));
  const isRejectedStage = (value) => ["rejected"].includes(normalize(value));
  const isNotVerifiedStage = (value) => ["notverified"].includes(normalize(value));


  const createRequest = async () => {
    try {
      const element = userdetails?.individuallInformation?.[0];
      const kycAadharStatus = userdetails?.kycAadharStatus;
      const kycPanCardStatus = userdetails?.kycPanCardStatus;
      const kycMobileStatus = userdetails?.kycMobileStatus;
      const kycLiveNessStatus = userdetails?.kycLiveNessStatus;
      const kycfinancialStatus = userdetails?.kycfinancialStatus;
      /* ---------- STEP 1: MOBILE NUMBER ---------- */
      if (!userdetails?.mobileNumber || kycMobileStatus === "notVerified") {
        setShowNumber(true);
        return;
      }
      /* ---------- STEP 2: AADHAR VERIFY ---------- */
      else if (kycAadharStatus != 'approved') {
        const aadhaarCard = await getCashFreeStatus();
        if (((aadhaarCard?.status == "expired")
          ||
          (kycAadharStatus != "approved")
        )) {
          let secretKey = userdetails?.secretKey;
          await AadharVerification(secretKey)
        }
      }
      /* ---------- STEP 3: PAN CARD ---------- */
      else if (kycPanCardStatus != "approved") {
        setKycVerifymodal(true);
        setPendingDocsText('Pending Docs');

        /* ---- NO PAN DATA: START FROM BEGINNING ---- */
        if (!element) {
          setIsActiveModelNumber(2); // PAN upload
          return;
        }

        const hasFront = !!element?.front;
        const hasNumber = !!element?.number;
        if (!hasFront || element.status == 'INVALID' || !hasNumber) {
          setIsActiveModelNumber(2);
          return;
        }
      }
      /* ---------- STEP 4: LiveNess  ---------- */
      else if (kycLiveNessStatus != "approved") {
        setKycVerifymodal(true);
        const hasLiveness = element?.liveness;
        if (!hasLiveness) {
          setIsActiveModelNumber(5);
          return;
        }
      }
      /* ---------- STEP 5: Financial Info  ---------- */
      else if (kycfinancialStatus != "approved") {
        setKycVerifymodal(true);
        setIsActiveModelNumber(7);
        return;
      } else {
        /* ---------- ALL KYC COMPLETED ---------- */
        setIsActiveModelNumber(0);
        setPendingDocsText('Verification Pending');
        allDocsAreUploadedSuccess();
        return;
      }
    } catch (error) {
    }
  };

  const AadharVerification = async (secretKey) => {
    try {
      const { status, result, message } = await createCashfreeRequest(
        secretKey
      );

      if (status) {
        window.open(result.data.url, '_blank');
      } else {
        showToastMessage(message, status ? 'success' : "error");
      }
    } catch (e) {
      console.log("AadharVerification__err", e)
    }
  }

  const getCashFreeStatus = async () => {
    try {
      const { status, message, result } = await verificationStatus(userdetails?.secretKey);
      if (status) {
        return result.data;
      }
    } catch (e) {
      console.log("createRequest_err", e);
    }
  }

  const allDocsAreUploadedSuccess = () => {
    Swal.fire({
      title: "All Documents Are Uploaded Successfully",
      icon: "success",
      showCancelButton: false,
      confirmButtonText: "OK",
      confirmButtonColor: theme == 'dark' ? "#2563EB" : "#2563EB",
      cancelButtonColor: theme == 'dark' ? "#2A2C2F" : "#eaecef",

    }).then((result) => {
      if (result.isConfirmed) {

        // fetchKycStatus()
      }
    })
  }

  const handleNumberVerified = () => {
    Swal.fire({
      title: "Phone number verified successfully",
      icon: "success",
      showCancelButton: false,
      confirmButtonText: "Continue with ID verification",
      confirmButtonColor: theme == 'dark' ? "#2563EB" : "#2563EB",
      cancelButtonColor: theme == 'dark' ? "#2A2C2F" : "#eaecef",
      customClass: {
        confirmButton: 'number-verified-btn',
        popup: 'number-verified-popup',
        title: 'my-title'
      },
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        // const cancelBtn = Swal.getCancelButton();

        if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
        // if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
      }
    }).then((result) => {

      if (result.isConfirmed) {
        // setTimeout(() => {
        //     createRequest()
        // }, 2000)

        // handleOpenLocker()
        // Its call only after the Ph verification so its enabled pancard instead of
        // aadhar
      } else if (result.isDenied) {

      }
    });
  }

  const handleOpenLocker = () => {
    // console.log('locker called');
    // setKycSubmitmodal(true)

    setKycVerifymodal(true)
  }

  const handleCloseVerification = async () => {
    setKycVerifymodal(false)
    const userDetail = await getUserDetailsHooks();

    dispatch(UserDetails({ userdetails: userDetail.data.result.data }));
  }
  let stageStatuses = [
    userdetails?.kycMobileStatus,
    userdetails?.kycAadharStatus,
    userdetails.kycPanCardStatus,
    userdetails?.kycLiveNessStatus,
    userdetails?.kycfinancialStatus
  ];
  useEffect(() => {
    stageStatuses = [
      userdetails?.kycMobileStatus,
      userdetails?.kycAadharStatus,
      userdetails.kycPanCardStatus,
      userdetails?.kycLiveNessStatus,
      userdetails?.kycfinancialStatus
    ]
  }, [userdetails])



  return (
    <div className={`${styles.singleFormWrapper} col-md-6  mt-4`}>
      {/* <p className={styles.singleFormLabel}>
                Diglocker Verification
            </p> */}

      {/* Add Number Modal */}
      {
        showNumber &&

        <AddPhoneNumber
          type={'mobile-verification'}
          show={showNumber}
          handleClose={() => setShowNumber(false)}
          handleNumberVerified={handleNumberVerified}
        />
      }

      {
        kycVerifyModal &&

        <KycVerificationModal
          show={kycVerifyModal}
          handleClose={() => handleCloseVerification(false)}
          handleShowKycSubmitted={() => setKycSubmitmodal(true)}
          // panValues={panKycFirstStep}
          isActiveModelNumber={isActiveModelNumber}
        // fetchCurrentData={fetchKycStatus()}
        />

      }

      {
        kycSubmitModal &&
        <KycSubmittedModal
          show={kycSubmitModal}
          handleClose={() => setKycSubmitmodal(false)}

        />
      }


      <div className={styles.cardMaxWidthLg}>
        <div className={styles.singleFormView}>
          {/* {"Unfortunately, your submission did not meet our verification criteria. Please review the details and try again."} */}
          <p>{getKycInfo(userdetails)}
          </p>

          <div className='flexBetween  mt-5'>
            <div className={`${styles.statusView}`}>
              Status :
              <span
                className={
                  userdetails?.externalKycStatus == "approved" ?
                    `${styles.approved} ms-2` :
                    (["pending", "rejected", "expired"].includes(userdetails?.externalKycStatus)) && `${styles.pending} ms-2`}
              >
                {statusEnum[userdetails?.externalKycStatus]}
              </span>
            </div>
            {
              (["pending", "authenticated", "expired", "consent_denied", "notverified", 'rejected'].includes(userdetails?.externalKycStatus?.toLowerCase())) &&
              <Button
                isLoading={false}
                loadingText="Redirecting..."
                btnText={
                  stageStatuses.some(isPendingStage) ? "Pending" :
                    stageStatuses.some(isRejectedStage) ? 'Resubmit' :
                      stageStatuses.some(isNotVerifiedStage) ? 'Continue' :
                        "Approved"
                }
                onClick={() => {
                  if (stageStatuses.some(isPendingStage) || stageStatuses.some(isRejectedStage) || stageStatuses.some(isNotVerifiedStage)) {
                    createRequest()
                  }
                }}
                className="cardSuccessBtn"
                selectedValue={null}
              />
            }
          </div>

        </div>
      </div>
    </div>
  )
}