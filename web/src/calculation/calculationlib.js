import isEmpty from "is-empty";

export const feeManagment = async (amount, currency, out = false) => {
    try {

        amount = parseFloat(amount); // Ensure amount is a number

        const gst = (amount * currency.gstFee) / 100;
        const fee = (amount * (out ? currency.withdrawalFee : currency.depositFee)) / 100;
        const tds = out ? (amount * currency.tdsFee) / 100 : 0;
        const totalFee = gst + fee + tds;
        return { gst, fee, tds, totalFee };
    } catch (e) {
        console.log("feeManagment_err", e);
        return { gst: 0, fee: 0, tds: 0, totalFee: 0 };
    }
};




export const toCutOff = (value = 0, decimal = 6) => {
    try {
        if (!isEmpty(value)) {
            value = value.toString()
            if (value.split('.')[1]?.length <= decimal) {
                return value
            } else {
                value = parseFloat(value)
                decimal = parseFloat(decimal)
                const factor = Math.pow(10, decimal);
                const result = Math.floor(value * factor) / factor;
                if (result == 0) {
                    return Number(result).toPrecision(decimal + 1)
                }
                return result
            }
        }
        return 0
    } catch (err) {
        console.log(err, 'CutOf__err')
        return value
    }
}


/** Whole the number  */
export const toFixedNumber = (x) => {
    if (Math.abs(x) < 1.0) {
        var e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10, e - 1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        var e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10, e);
            x += (new Array(e + 1)).join('0');
        }
    }
    return x;
}