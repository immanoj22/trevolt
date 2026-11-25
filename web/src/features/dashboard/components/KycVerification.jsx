import React, { useState, useRef } from "react";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import Webcam from "react-webcam";
import Form from "react-bootstrap/Form";
import Select from "react-select";

function KycVerification(props) {
  const { handleClose } = props;

  return (
    <>
      <div className="doc_additionalDetails">
        <div className="">
          <h4 className="mb-2 pb-1 title-txt">Additional Details</h4>
          <p className="sub-title-txt">
            Please verify and fill in accurate details for faster approval
          </p>

          <div className="mt-3">
            <Select
              isSearchable={false}
              placeholder="What is your Occupation?*"
              classNamePrefix="react-select__primary"
              options={occupationOption}
            />
          </div>
          <div className="mt-3">
            <Select
              isSearchable={false}
              placeholder="Income?*"
              classNamePrefix="react-select__primary"
              options={incomeOption}
            />
          </div>

          <div className="mt-3 pt-1">
            <p className="sub-title-txt">Are you politically exposed?</p>
            <p className="sub-title-txt mt-2">
              Are you related to any person who is in a prominent political
              position or influence?
            </p>

            <div className="d-flex align-items-center gap-3 my-3">
              <div className="custom-radioForm__primary">
                <Form.Check label="No" type="radio" id={"no"} />
              </div>
              <div className="custom-radioForm__primary">
                <Form.Check label="Yes" type="radio" id={"yes"} />
              </div>
            </div>

            <p className="sub-title-txt">
              A Politically Exposed Person (PEP) is an individual who holds an
              important public position, domestically or internationally. PEPs
              may include heads of states or governments, senior politicians,
              senior government or judicial or military officers, senior
              executives of state owned corporations and important political
              party officials.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default KycVerification;
