import React from 'react';
import { FiInfo } from 'react-icons/fi';
import TooltipComponent from './tooltipComponent';

/**
 * Requirement list shown in the tooltip — kept in one place so it can't
 * drift out of sync with the actual Yup password regex used across
 * Register/Reset/Change password (pages/Validation/userValidation.js):
 * 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
 * The regex itself accepts a much wider special-character set than shown
 * here — these are illustrative examples, not the full allowed list.
 */
const PasswordRequirementsList = () => (
    <ul className="ps-3 mb-0 text-start">
        <li>At least 8 characters</li>
        <li>At least 1 uppercase letter (A-Z)</li>
        <li>At least 1 lowercase letter (a-z)</li>
        <li>At least 1 number (0-9)</li>
        <li>At least 1 special character (e.g. !@#$%^&*)</li>
    </ul>
);

/** Small (i) icon that shows the password requirements on click. */
const PasswordRequirementsInfo = ({ placement = "top" }) => (
    <TooltipComponent text={<PasswordRequirementsList />} placement={placement} triggerType="click" highlight={false}>
        <FiInfo aria-label="Password requirements" style={{ color: 'var(--color-green-02)', cursor: 'pointer', verticalAlign: 'middle' }} />
    </TooltipComponent>
);

export default PasswordRequirementsInfo;
