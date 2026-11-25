/** PACKAGE IMPORT */
import React, { useState } from 'react';
import { FiSearch } from "react-icons/fi";
import Select, { components } from "react-select";

/** LOCAL FILES IMPORT */
import styles from './inputFields.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdContentPaste } from 'react-icons/md';
import PasswordRequirementsInfo from '../UiComponents/PasswordRequirementsInfo';

/**
 * A customizable button component.
 *
 * @param {Object} props - The props for the input component.
 * @param {string} [props.id] - The ID of the input element.
 * @param {string} [props.label] - The ID of the input element.
 * @param {string} [props.currency] - The ID of the input element.
 * @param {"text" | "number" | "email" | "password" | "search" | "tel" | "url"} [props.type="text"] - The HTML input type.
 * @param {string} [props.error] - Error message to display.
 * @param {function} props.onChange - Change handler function; receives the change event or value.
 * @param {boolean} [props.disabled=false] - Whether the input is disabled.
 * @param {string} [props.placeholder] - Placeholder text for the input.
 * @param {string | number} [props.value] - The current value of the input.
 * @param {string} [props.name] - Name attribute for the input.
 * @param {boolean} [props.readOnly=false] - Whether the input is read-only.
 * @param {boolean} [props.showSearchIcon=true] - Whether the input is read-only.
 * @param {"primaryInput" | "primaryTextarea" | "InputWithCurrencyAndLabel" | "primaryInputBgFour" | "InputTextStartCurrencyAndLabel" | "InputTextSecondaryCurrencyAndLabel" | "InputTextThirdCurrencyAndLabel" | "secondarySearch" | "tableInputXs"} [props.className="primaryInput"] - Style class name for the input.
 * @param {1 | 2} [props.iconOrder=1] - Position of the icon: 1 = left, 2 = right.
 */

export const SearchInput = ({
    id,
    type,
    error,
    onChange,
    disabled = false,
    placeholder,
    value,
    name,
    className,
    readOnly = false,
    showSearchIcon = true,
    iconOrder = 1
}) => {

    return (
        <>
            <div className={`${styles.defaultSearch} ${styles[className] || ''}`}>
                {(showSearchIcon && iconOrder == 1) && <FiSearch fontSize={14} />}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={onChange}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                    autoComplete="off"
                />
                {(showSearchIcon && iconOrder == 2) && <FiSearch fontSize={14} />}
            </div>

            {error && <p className={`text-danger mt-2`}>{error}</p>}
        </>
    )
}

/** password input */
export const PasswordInput = ({
    id,
    error,
    onChange,
    disabled = false,
    placeholder,
    value,
    name,
    className = "",
    readOnly = false,
    label,
    maxLength,
    showInfo = false,

}) => {

    const htmlTagPattern = /<[^>]*>/;
    const [passwordView, setPasswordView] = useState(true);
    const handlePasswordView = () => {
        setPasswordView(!passwordView);
    };
    return (
        <div className={`${styles.passwordInputContainer} ${styles[className]} mt-2`}>
            {showInfo ? (
                <div className={`${styles.formLabel} d-flex justify-content-between align-items-center`}>
                    <span>{label}</span>
                    <PasswordRequirementsInfo />
                </div>
            ) : (
                <label className={styles.formLabel}>{label}</label>
            )}
            <div className={`${styles.formPasswordInput} mt-2`}>
                <input
                    type={passwordView ? "password" : "text"}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={onChange}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                    autoComplete="new-password"
                    maxLength={maxLength}
                />
                <button
                    aria-label='eyeIcon'
                    type="button"
                    className=""
                    onClick={() => handlePasswordView()}
                >
                    {passwordView ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            <p className={`text-danger mt-2`}>
                {error}
            </p>
        </div>
    )
}

/** input component with label */

export const InputComponent = ({
    id,
    error,
    onChange,
    type = "text",
    disabled = false,
    placeholder,
    value,
    name,
    className = "",
    readOnly = false,
    label,
    staticClass = 'mt-2',
    staticClassInput = 'mt-2',
    min,
    max
}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={`${styles.inputComponent} ${styles[className]} ${staticClass}`}>
            <label className={styles.formLabel}>{label}</label>
            <div className={`${styles.formPasswordInput} ${staticClassInput}`}>
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={onChange}
                    // onChange={(e) => { onChange(name, e.target.value) }}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                    autoComplete="off"
                    min={min}
                    max={max}
                />
            </div>
            {
                error &&
                <p className={`text-danger mt-2`}>
                    {error}
                </p>
            }

        </div>
    )
}

/** input only with error message - (No label)*/

export const PrimaryInput = ({
    id,
    error,
    onChange,
    type = "text",
    disabled = false,
    placeholder,
    value,
    name,
    className = 'primaryInput',
    readOnly = false,
    label,

}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={` ${styles[className]} `}>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                id={id}
                onChange={onChange}
                disabled={disabled}
                name={name}
                readOnly={readOnly}
                autoComplete="off"
            />
            {error &&
                <p className={`text-danger mt-2`}>
                    {error}
                </p>
            }
        </div>
    )
}

/** input with copy component */

export const InputWithCopy = ({
    id,
    error,
    onChange,
    type = "text",
    disabled = false,
    placeholder,
    value,
    name,
    className = "",
    readOnly = false,
    label,
    onPaste
}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={`${styles.inputComponent} ${styles[className]} mt-2`}>
            <label className={styles.formLabel}>{label}</label>
            <div className={`${styles.formPasswordInput} mt-2`}>
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={onChange}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                />
                <button
                    aria-label='copyIcon'
                    className=""
                    onClick={onPaste ?? ''}
                >
                    {true ? (
                        <MdContentPaste
                            className="copy_svg"
                        />
                    ) : (
                        <></>
                    )}
                </button>
            </div>
            <p className={`text-danger mt-2`}>
                {error}
            </p>
        </div>
    )
}

/**  input with currency and label */
export const InputWithCurrencyAndLabel = ({
    id,
    type,
    error,
    onChange,
    disabled = false,
    placeholder,
    value,
    name,
    className,
    readOnly = false,
    label,
    currency,
    staticClass = "",
    renderInsideTopRight,

}) => {

    if (renderInsideTopRight) {
        return (
            <>
                <div
                    className={`${styles.defaultSearch} ${styles[className] || ''} ${staticClass}`}
                    style={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        height: 'auto',
                        gap: '4px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                    }}
                >
                    <div style={{ width: '100%' }}>{renderInsideTopRight}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                        {label &&
                            <p className={styles.label}>{label}</p>
                        }
                        <input
                            type={type}
                            placeholder={placeholder}
                            value={value}
                            id={id}
                            onChange={(e) => { onChange(name, e.target.value) }}
                            disabled={disabled}
                            name={name}
                            readOnly={readOnly}
                        />
                        {
                            currency &&
                            <div className={styles.currency}>{currency}</div>
                        }
                    </div>
                </div>

                {error && <p className={`text-danger mt-2`}>{error}</p>}
            </>
        );
    }

    return (
        <>
            <div className={`${styles.defaultSearch} ${styles[className] || ''} ${staticClass}`}>
                {label &&
                    <p className={styles.label}>{label}</p>
                }
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={(e) => { onChange(name, e.target.value) }}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                />
                {
                    currency &&
                    <div className={styles.currency}>{currency}</div>
                }
            </div>

            {error && <p className={`text-danger mt-2`}>{error}</p>}
        </>
    )
}

const orderPriceEnum = [
    {
        label: "Mark",
        Value: "market"
    },
    {
        label: "Last",
        Value: "last"
    },
    {
        label: "Index",
        Value: "index"
    }
]
/**  input with currency and label */
export const InputWithSelectAndLabel = ({
    id,
    type,
    error,
    onChange,
    onSelect,
    disabled = false,
    placeholder,
    selectedValue,
    value,
    name,
    className,
    readOnly = false,
    label,
    currency
}) => {

    return (
        <>
            <div className={`${styles.defaultSearch} ${styles[className] || ''}`}>
                {/**trailType selection would be used in future like (Mark , Last ,Index) */}
                {/* <Select
                    isSearchable={false}
                    placeholder="Select"
                    className="w-50"
                    classNamePrefix="react-select__eleventh"
                    menuPosition='fixed'
                    options={orderPriceEnum}
                    value={orderPriceEnum.find((el) => el.Value === selectedValue)}
                    onChange={(e) => { onSelect(e.value) }}
                /> */}
                { /**temporary change*/}
                {label &&
                    <p className={styles.label}>{label}</p>
                }
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={(e) => { onChange(name, e.target.value) }}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                />
                <div className={styles.currency}>{currency}</div>
            </div>

            {error && <p className={`text-danger mt-2`}>{error}</p>}
        </>
    )
}

export const InputWithSelectOption = ({
    id,
    type,
    error,
    onChange,
    onSelect,
    disabled = false,
    placeholder,
    selectedValue,
    value,
    name,
    className,
    readOnly = false,
    label,
    currency,
    selectOption,
    labelText,
    onFocus
}) => {
    // console.log(selectedValue, "selectedValue")
    return (
        <>
            {
                labelText &&
                <label className='fs12 mb-1' htmlFor="">{labelText}</label>
            }
            <div className={`${styles.defaultSearch} ${styles[className] || ''}`}>
                {label &&
                    <p className={styles.label}>{label}</p>
                }
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={(e) => { onChange(name, e.target.value) }}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                    onBlur={() => {
                        if (typeof onFocus === 'function') onFocus(false)
                    }}
                    onFocus={() => {
                        if (typeof onFocus === 'function') onFocus(true)
                    }}
                />
                <div className={styles.selectOptionPart}>
                    <Select
                        isSearchable={false}
                        placeholder="Select"
                        className="w-50"
                        classNamePrefix="react-select__eleventh"
                        menuPosition='fixed'
                        options={selectOption}
                        value={selectOption.find((el) => el.value === selectedValue)}
                        onChange={(e) => { onSelect(e.value) }}
                    />
                </div>
            </div>

            {error && <p className={`text-danger mt-2`}>{error}</p>}
        </>
    )
}
/** input textarea component */
export const InputTextareaComponent = ({
    id,
    error,
    onChange,
    type = "text",
    disabled = false,
    placeholder,
    value,
    name,
    className = "",
    readOnly = false,
    rows,
    label,

}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={`${styles.inputComponent} ${styles[className]} mt-2`}>
            <label className={styles.formLabel}>{label}</label>
            <div className={`${styles.formTextareaInput} mt-2`}>
                <textarea
                    placeholder={placeholder}
                    value={value}
                    id={id}
                    onChange={onChange}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                    rows={rows || 4}
                />
            </div>
            {
                error &&
                <p className={`text-danger mt-2`}>
                    {error}
                </p>
            }
        </div>
    )
}

/** textarea only with error message - (No label) */

export const PrimaryTextarea = ({
    id,
    error,
    onChange,
    type = "text",
    disabled = false,
    placeholder,
    value,
    name,
    className = 'primaryTextarea',
    readOnly = false,
    label,
    rows

}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={` ${styles[className]} `}>
            <textarea
                type={type}
                placeholder={placeholder}
                value={value}
                id={id}
                onChange={onChange}
                disabled={disabled}
                name={name}
                readOnly={readOnly}
                rows={rows || 4}
            />
            {error &&
                <p className={`text-danger mt-2`}>
                    {error}
                </p>
            }
        </div>
    )
}

/** inputFileComponent only with error message - (No label)  */

export const InputFileComponentPrimary = ({
    id,
    error,
    onChange,
    type = "file",
    disabled = false,
    value,
    name,
    className = "",
    readOnly = false,
    label,

}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={`${styles.inputComponent} ${styles[className]} mt-2`}>
            <label className={styles.formLabel}>{label}</label>
            <div className={`${styles.formFileInput} mt-2`}>
                <input
                    type={type}
                    value={value}
                    id={id}
                    onChange={onChange}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                />
            </div>
            <p className={`text-danger mt-2`}>
                {error}
            </p>
        </div>
    )
}

/** input file component */

export const InputFileComponent = ({
    id,
    error,
    onChange,
    type = "file",
    disabled = false,
    value,
    name,
    className = "",
    readOnly = false,
    label,

}) => {
    const htmlTagPattern = /<[^>]*>/;
    return (
        <div className={`${styles.inputComponent} ${styles[className]} mt-2`}>
            <label className={styles.formLabel}>{label}</label>
            <div className={`${styles.formFileInput} mt-2`}>
                <input
                    type={type}
                    value={value}
                    id={id}
                    onChange={onChange}
                    disabled={disabled}
                    name={name}
                    readOnly={readOnly}
                />
            </div>
            <p className={`text-danger mt-2`}>
                {error}
            </p>
        </div>
    )
}


export const MultipleCheckboxSelect = ({ value, onChange, options }) => {


    const CheckboxOption = (props) => {
        return (
            <components.Option {...props}>
                <input
                    type="checkbox"
                    checked={props.isSelected}
                    onChange={() => null}
                    style={{ marginRight: "8px" }}
                />
                <label>{props.label}</label>
            </components.Option>
        );
    };

    return (
        <Select
            isMulti
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            components={{ Option: CheckboxOption }}
            options={options}
            value={value}
            onChange={onChange}
            placeholder="Select Source"
            isSearchable={false}
            classNamePrefix="react-select__eighth"
            menuPosition="fixed"
        />
    );
};

export const InputRange = () => {
    return <input className={styles.rangebarInput} type="range" />
}