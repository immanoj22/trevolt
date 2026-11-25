import moment from 'moment'

export function getContractLabel(contract) {
    if (contract.kind === 'futures') {
        return contract.symbol;
    }
    return `${contract.posType.label}-${contract.strike.label}-${contract.expiry.label}`;
}

// Normalizes an expiry date string like "15Jul26" to numeric "150726" (DDMMYY)
export function formatExpiryNumeric(expiryDateStr) {
    const parsed = moment(expiryDateStr, "DDMMMYY", true);
    return parsed.isValid() ? parsed.format("DDMMYY") : expiryDateStr;
}
