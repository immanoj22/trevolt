/** PACKAGE IMPORT */

import React, { useState } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import ReactDatatable from "react-data-table-component";
import { useSelector } from "react-redux";

/** LOCAL FILES IMPORT */

import styles from ".././styles/authInnerPage.module.css";
import TableNoData from "../../../components/TableNoData/TableNoData";
import { useEffect } from "react";
import { getUserWalletHooks } from "../../../actions/walletAction";
import Loader from "../../../components/Loader/Loader";
import Button from "../../../components/Button/Button";
import WalletTransfer from "../modal/WalletTransfer";
import { toCutOff } from "../../../calculation/calculationlib";
/** Config */

/** ACTIONS */

/** CODE START */

const MyAssetTable = (props) => {
  const [assetTableData, setAssetTableData] = useState([]);
  const [hideZeroBal, setHideZerBal] = useState(false);
  const [search, setSearch] = useState("");
  const [loader, setLoader] = useState(false);
  const [showWalletTransfer, setShowWalletTransfer] = useState(false);

  const handleShowWalletTransfer = () => {
    setShowWalletTransfer(true);
  };
  const handleCloseWalletTransfer = () => {
    setShowWalletTransfer(false);
  };

  const assetColumns = [
    {
      name: "Coin",
      align: "left",
      width: "100px",
      selector: (record) => {
        return (
          <>
            <p>{record?._id}</p>
          </>
        );
      },
    },
    {
      name: "Main",
      align: "right",
      selector: (record) => {
        return (
          <>
            <p className={`table-dataValue__md`}>
              {toCutOff(record?.balance, record?.pip)}
            </p>
            <p className={`table-dataValue__sm`}>~~ {record?._id}</p>
          </>
        );
      },
    },
    {
      name: "Futures",
      align: "right",
      selector: (record) => {
        return (
          <>
            <p className={`table-dataValue__md`}>
              {toCutOff(record?.futuresBalance, record?.pip)}
            </p>
            <p className={`table-dataValue__sm`}>~~ {record?._id}</p>
          </>
        );
      },
    },
    {
      name: "Options",
      align: "right",
      selector: (record) => {
        return (
          <>
            <p className={`table-dataValue__md`}>
              {toCutOff(record?.optionBalance, record?.pip)}
            </p>
            <p className={`table-dataValue__sm`}>~~ {record?._id}</p>
          </>
        );
      },
    },
    {
      name: "Action",
      align: "right",
      width: "200px",
      selector: (record) => {
        return (
          <>
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              btnText="Transfer"
              onClick={handleShowWalletTransfer}
              className="cardSuccessBtnSm"
              selectedValue={null}
            />
          </>
        );
      },
    },
  ];

  const { userdetails } = useSelector((state) => state.user);

  useEffect(() => {
    async function fetchData() {
      if (Object.values(userdetails)?.length > 0) {
        let reqData = { search: search, hideZeroBalance: hideZeroBal };
        const resp = await getUserWalletHooks(reqData, userdetails?.secretKey);
        let result = resp?.data;
        if (result?.success) {
          setAssetTableData(result?.result?.data);
          setLoader(true);
        }
      }
    }
    fetchData();
  }, [userdetails, search, hideZeroBal]);

  return (
    <>
      {/* modal import - start */}

      <WalletTransfer
        assetTableData={assetTableData}
        show={showWalletTransfer}
        handleClose={handleCloseWalletTransfer}
      />

      {/* modal import - end */}

      <div className={`${styles.cardHeader}`}>
        <h5 className={`${styles.pageTitle}`}>My Asset</h5>
        <div className={`${styles.headerRight}`}>
          <div className={`${styles.searchContainer}`}>
            <FiSearch />
            <input
              placeholder="Search..."
              onChange={(e) => setSearch(e?.target?.value)}
            />
          </div>
          <div className="custom-checkInput__container">
            <label className="custom-checkInput__label">
              <input
                type="checkbox"
                onChange={(e) => setHideZerBal(e?.target?.checked)}
              />
              <span className="custom-checkInput__checkmark"></span>
            </label>
            <p className="custom-checkInput__content">Hide zero balance</p>
          </div>
        </div>
      </div>
      {/* {loader ? 
           <> <Loader /></> */}
      <div className="custom-table__secondary mt-4">
        <ReactDatatable
          columns={assetColumns}
          data={assetTableData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20, 50, 100]}
          // customStyles={customStyles}
          className="dataTableComponent"
          // sortIcon={<BiSort style={{ marginLeft: "0.5rem", color: "#000" }} />}
          noDataComponent={<TableNoData />}
        />
      </div>
    </>
  );
};

export default MyAssetTable;
