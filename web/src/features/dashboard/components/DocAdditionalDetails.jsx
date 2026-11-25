import React, { useState } from "react";
import Button from "../../../components/Button/Button";
import Form from "react-bootstrap/Form";
import Select from "react-select";
import { additionalVerification } from "../../../actions/userAction";
import { useSelector } from "react-redux";
import { showToastMessage } from "../../../lib/toast";

function DocAdditionalDetails(props) {
  const { handleAdditionalDetails } = props;
  const { userdetails } = useSelector((state) => state.user);

  // Select options
  const occupationOption = [
    { value: "business", label: "Business" },
    { value: "professional", label: "Professional" },
    { value: "self-employed", label: "Self-employed" },
  ];

  const incomeOption = [
    { value: "1-5-lakhs", label: "1-5 lakhs" },
    { value: "5-10-lakhs", label: "5-10 lakhs" },
    { value: "10-25-lakhs", label: "10-25 lakhs" },
  ];

  // State for inputs
  const [occupation, setOccupation] = useState(null);
  const [income, setIncome] = useState(null);
  const [isPep, setIsPep] = useState(""); // "" | "yes" | "no"

  // Error state
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (!occupation) {
      errs.occupation = "Please select your occupation";
    }
    if (!income) {
      errs.income = "Please select your income range";
    }
    if (!isPep) {
      errs.isPep = "Please confirm if you are politically exposed";
    }

    setErrors(errs);

    // valid if no errors
    return Object.keys(errs).length === 0;
  };

  const handleProceed = async () => {
    if (!validate()) {
      return;
    }

    // Construct payload
    const payload = {
      occupation: occupation.value,
      income: income.value,
      politicallyExposed: isPep === "yes",
    };

    const result = await additionalVerification(payload, userdetails.secretKey);
    showToastMessage(
      result?.data?.message,
      result?.data?.success ? "success" : "error",
    );
    if (result.data.success) {
      handleAdditionalDetails();
    }
  };

  return (
    <div className="doc_additionalDetails">
      <div>
        <h4 className="mb-2 pb-1 title-txt">Additional Details</h4>
        <p className="sub-title-txt">
          Please verify and fill in accurate details for faster approval
        </p>

        {/* Occupation */}
        <div className="mt-3">
          <Select
            isSearchable={false}
            placeholder="What is your Occupation?*"
            classNamePrefix="react-select__primary"
            options={occupationOption}
            value={occupation}
            onChange={setOccupation}
          />
          {errors.occupation && (
            <p className="text-danger" style={{ fontSize: "13px" }}>
              {errors.occupation}
            </p>
          )}
        </div>

        {/* Income */}
        <div className="mt-3">
          <Select
            isSearchable={false}
            placeholder="Income?*"
            classNamePrefix="react-select__primary"
            options={incomeOption}
            value={income}
            onChange={setIncome}
          />
          {errors.income && (
            <p className="text-danger" style={{ fontSize: "13px" }}>
              {errors.income}
            </p>
          )}
        </div>

        {/* PEP Radio */}
        <div className="mt-3 pt-1">
          <p className="sub-title-txt">Are you politically exposed?</p>

          <div className="d-flex align-items-center gap-3 my-3">
            <div className="custom-radioForm__primary">
              <Form.Check
                label="No"
                type="radio"
                name="pepRadio"
                value="no"
                checked={isPep === "no"}
                onChange={(e) => setIsPep(e.target.value)}
              />
            </div>

            <div className="custom-radioForm__primary">
              <Form.Check
                label="Yes"
                type="radio"
                name="pepRadio"
                value="yes"
                checked={isPep === "yes"}
                onChange={(e) => setIsPep(e.target.value)}
              />
            </div>
          </div>

          {errors.isPep && (
            <p className="text-danger" style={{ fontSize: "13px" }}>
              {errors.isPep}
            </p>
          )}

          <p className="sub-title-txt">
            A Politically Exposed Person (PEP) is an individual who holds an
            important public position, domestically or internationally...
          </p>
        </div>
      </div>

      <div className="btn_sec mt-4">
        <Button
          isLoading={false}
          btnText="Proceed"
          className="cardSuccessBtnSm"
          onClick={handleProceed}
        />
      </div>
    </div>
  );
}

export default DocAdditionalDetails;
