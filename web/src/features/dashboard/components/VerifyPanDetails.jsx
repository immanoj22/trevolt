import React, { useState, useRef } from "react";
import Button from "../../../components/Button/Button";
import Images from "../../../utils/Images";
import { InputComponent } from "../../../components/Input/InputFields";

function VerifyPanDetails(props) {
  const { handleVerifiedPan, panNumber, fullName, dateOfBirth } = props;

  return (
    <div className="verify_panDetails">
      <div className="">
        <h4 className="mb-2 title-txt">Verify your PAN Details</h4>
        <p className="sub-title-txt">Please make sure details are correct</p>
        <div className="panDetails mt-4">
          <div className="mb-4">
            <InputComponent
              label={"Pan Number"}
              type="text"
              placeholder={"Pan Number"}
              value={panNumber}
            />
          </div>
          <div className="mb-4">
            <InputComponent
              label={"Full Name"}
              type="text"
              placeholder={"Full Name"}
              value={fullName}
            />
          </div>
          <div className="mb-4">
            <InputComponent
              label={"Date of Birth"}
              type="text"
              placeholder={"Date of Birth"}
              value={dateOfBirth}
            />
          </div>
        </div>
      </div>

      <div className="btn_sec mt-5 pt-sm-4">
        <Button
          isLoading={false}
          // loadingText="Loading..."
          btnText="Proceed"
          className="cardSuccessBtnSm"
          onClick={handleVerifiedPan}
        />
      </div>
    </div>
  );
}

export default VerifyPanDetails;
