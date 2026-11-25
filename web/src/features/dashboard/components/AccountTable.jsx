/** PACKAGE IMPORT */

import React, { useState } from "react";
import { FaBoxOpen } from "react-icons/fa6";
import { FiSearch } from "react-icons/fi";
import ReactDatatable from "react-data-table-component";
import { useSelector } from "react-redux";
import { BsThreeDotsVertical } from "react-icons/bs";

/** LOCAL FILES IMPORT */

import styles from ".././styles/authInnerPage.module.css";
import TableNoData from "../../../components/TableNoData/TableNoData";
import { useEffect } from "react";
import Loader from "../../../components/Loader/Loader";
import Button from "../../../components/Button/Button";
import { toCutOff } from "../../../calculation/calculationlib";
import { getSubAccount } from "../../../actions/subAccountAction";
import isEmpty from "is-empty";
// import EditSubAccountModel from "../modal/EditSubAccountModel";
// import TransferFundModel from "../modal/TransferFundModel";
import SwitchModal from "../../futuresTrading/modal/SwitchModal";
import EditSubAccountModel from "../modal/EditSubAccountModel";
import TransferFundModel from "../modal/TransferFundModel";
import { useGlobalContext } from "../../../context/GlobalProvider";
/** Config */

/** ACTIONS */

/** CODE START */

const AccountTable = (props) => {
  const [switchModel, setSwitchModel] = useState(false);
  const [editSubModel, setEditSubModel] = useState(false);
  const [transferFundModel, setTransferFundModel] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState({});
  const [type, setType] = useState("edit");

  const { convertValue, convertSecValue } = useGlobalContext();

  const handleShowEdit = (data) => {
    setType("edit");
    setSelectedRecord(data);
    setEditSubModel(true);
  };

  const handleCloseEdit = () => {
    setType("");
    setSelectedRecord({});
    setEditSubModel(false);
  };

  const assetColumns = [
    {
      name: "Account Name",
      // selector: row => row.accountName,
      selector: (record) => {
        return <p className="text-wrap">{record.accountName}</p>;
      },
      align: "left",
      width: "150px",
    },
    {
      name: "Account Id",
      selector: (row) => row.accountId,
      align: "right",
      width: "150px",
    },
    {
      name: "Margin Mode",
      align: "right",
      width: "200px",
      selector: (record) => {
        return <p className="text-capitalize">{record.marginMode}</p>;
      },
    },
    {
      name: "Balance",
      // selector: row => row.balance,
      align: "right",
      width: "200px",
      selector: (record) => {
        return (
          <div className={"fs15"}>
            {userdetails?.hideBalance ? (
              "*****"
            ) : (
              <>
                <p>{convertValue(record?.balance ?? 0, 4)}</p>
                <p className="fs13 mt-2 ms-1">
                  <span>{convertSecValue(record?.balance ?? 0, 4)}</span>
                </p>
              </>
            )}
          </div>
        );
      },
    },
    {
      name: "Action",
      align: "left",
      width: "500px",
      className: "centerThTag",
      headerClassName: "centerThTag",
      selector: (record) => {
        return (
          <div
            style={{ width: "450px" }}
            className="d-flex justify-content-center gap-3"
          >
            {/* <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            onClick={() => handleShowEdit(record)}
                            className="successTextBtn"
                            btnText={"Create API Key"}
                        /> */}
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              onClick={() => handleShowEdit(record)}
              className="successTextBtn"
              btnText={"Manage"}
              disabled={record.isPrimary}
            />
            {/* <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            onClick={() => handleShowEdit(record)}
                            className="successTextBtn"
                            btnText={"Transfer History"}
                        /> */}
          </div>
        );
      },
    },
  ];

  const { userdetails, subAccountList, wallet } = useSelector(
    (state) => state.user,
  );

  return (
    <>
      {/* modal import - start */}
      <EditSubAccountModel
        type={type}
        records={selectedRecord}
        show={editSubModel}
        handleClose={() => {
          handleCloseEdit();
        }}
      />
      <TransferFundModel
        show={transferFundModel}
        handleClose={() => {
          setTransferFundModel(false);
        }}
      />
      <SwitchModal
        show={switchModel}
        handleClose={() => {
          setSwitchModel(false);
        }}
      />
      {/* modal import - end */}
      <div className={styles.subAccountCard}>
        <div className="d-flex gap-3 flex-wrap align-items-center justify-content-between">
          <h3 className={`fs17 ${styles.grayLabel}`}>
            Account in Use{" "}
            <span className={styles.whiteLabel}>
              {userdetails && userdetails?.accountName}
            </span>
          </h3>
          <div className={`${styles.headerRight}`}>
            <Button
              isLoading={false}
              loadingText="Redirecting..."
              onClick={() => {
                setType("add");
                setEditSubModel(true);
              }}
              className="successFillRectangleBtn"
              btnText={"Create Sub Account"}
              selectedValue={null}
            />

            {subAccountList.length > 1 ? (
              <>
                <Button
                  isLoading={false}
                  loadingText="Redirecting..."
                  onClick={() => {
                    setSwitchModel(true);
                  }}
                  className="successFillRectangleBtn"
                  btnText={"Switch Account"}
                  selectedValue={null}
                />

                <Button
                  isLoading={false}
                  loadingText="Redirecting..."
                  onClick={() => {
                    setTransferFundModel(true);
                  }}
                  className="successFillRectangleBtn"
                  btnText={"Transfer Funds"}
                  selectedValue={null}
                />
              </>
            ) : (
              ""
            )}
          </div>
        </div>
        <div className={`mt-2`}>
          <ul className={`d-flex gap-5`}>
            <li>
              <h3 className={`fs17 mb-2 ${styles.whiteLabel}`}>Account ID</h3>
              <p className={`fs15 ${styles.grayLabel}`}>
                {/* {subAccountList && subAccountList.length > 0 && subAccountList.find((el) => el.isPrimary).accountId} */}
                {userdetails && userdetails?.accountId}
              </p>
            </li>
            <li>
              <h3 className={`fs17 mb-2 ${styles.whiteLabel}`}>
                Account Value
              </h3>
              {/**
               * BUG FIX: this was a <p> (className="fs15 grayLabel")
               * wrapping a <span> that itself contained TWO MORE <p>
               * tags — <p> cannot legally contain another <p> in HTML,
               * which is exactly what React's "validateDOMNesting: <p>
               * cannot appear as a descendant of <p>" warning was
               * flagging. Changed the outer wrapper from <p> to <div> —
               * same className, same visual result, and it now matches
               * the exact pattern the Balance column above already uses
               * correctly (a plain wrapper containing two sibling <p>
               * tags, not one <p> nested inside another).
               */}
              <div className={`fs15 ${styles.grayLabel}`}>
                <span className={styles.whiteLabel}>
                  <p>{wallet && convertValue(wallet.walletBalance ?? 0)}</p>
                  <p className="fs12">
                    <span>
                      {" "}
                      {wallet && convertSecValue(wallet.walletBalance ?? 0)}
                    </span>
                  </p>
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className={`${styles.cardHeader}`}>
        <h5 className={`${styles.pageTitle}`}>Accounts</h5>
      </div>

      <div className="custom-table__secondary table_subAccount mt-4">
        <ReactDatatable
          columns={assetColumns}
          data={subAccountList}
          // pagination
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

export default AccountTable;