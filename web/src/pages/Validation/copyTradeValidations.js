import isEmpty from "is-empty";
 
export const becomeAtraderValidation = async (formValue) => {
    let regexQuery = "^(https?:\\/\\/)?((([-a-z0-9]{1,63}\\.)*?[a-z0-9]([-a-z0-9]{0,253}[a-z0-9])?\\.[a-z]{2,63})|((\\d{1,3}\\.){3}\\d{1,3}))(:\\d{1,5})?((\\/|\\?)((%[0-9a-f]{2})|[-\\w\\+\\.\\?\\/@~#&=])*)?$";
    let urlRegx = new RegExp(regexQuery, "i");
    let error = {}
    if (isEmpty(formValue.name)) {
        error.name = "Name field is required"
    }
    if (isEmpty(formValue.tradePairs)) {
        error.tradePairs = "Trade pairs field is required"
    }
    if (isEmpty(formValue.description)) {
        error.description = "Description field is required"
    }
    if (isEmpty(formValue.showHistory)) {
        error.showHistory = "Show History field is required"
    }
    if (isEmpty(formValue.maxFollower)) {
        error.maxFollower = "Maximum Followers field is required"
    } else if (parseFloat(formValue.maxFollower) < 1) {
        error.maxFollower = "* Maximum Followers must be at least 1"
    }

    if (isEmpty(formValue.copyTradeFee)) {
        error.copyTradeFee = "Copy trade fee percentage field is required"
    } else if (isEmpty(parseFloat(formValue.copyTradeFee)) || parseFloat(formValue.copyTradeFee) <= 0) {
        error.copyTradeFee = '* Copy trader fee must be greater than zero'
    } else if (parseFloat(formValue.copyTradeFee) > 100) {
        error.copyTradeFee = '* Copy trader fee percentage should be within 100'
    }
 
    if (isEmpty(formValue.linkedInUrl)) {
        error.linkedInUrl = "LinkedIn URL field is required"
    } if (isEmpty(formValue.twitterUrl)) {
        error.twitterUrl = "Twitter URL History field is required"
    } if (isEmpty(formValue.telegramUrl)) {
        error.telegramUrl = "Telegram URL field is required"
    }
 
    if (!isEmpty(formValue.linkedInUrl) && !urlRegx.test(formValue.linkedInUrl)) {
        error.linkedInUrl = "Enter valid LinkedIn URL "
    } if (!isEmpty(formValue.twitterUrl) && !urlRegx.test(formValue.twitterUrl)) {
        error.twitterUrl = "Enter valid Twitter URL"
    } if (!isEmpty(formValue.telegramUrl) && !urlRegx.test(formValue.telegramUrl)) {
        error.telegramUrl = "Enter valid Telegram URL"
    }

    if (isEmpty(formValue.binanceUrl)) {
        error.binanceUrl = "Binance URL field is required"
    } if (isEmpty(formValue.bybitUrl)) {
        error.bybitUrl = "Bybit URL History field is required"
    } if (isEmpty(formValue.coinbaseUrl)) {
        error.coinbaseUrl = "Coinbase URL field is required"
    }

    if (!isEmpty(formValue.binanceUrl) && !urlRegx.test(formValue.binanceUrl)) {
        error.binanceUrl = "Enter valid Binance URL "
    } if (!isEmpty(formValue.bybitUrl) && !urlRegx.test(formValue.bybitUrl)) {
        error.bybitUrl = "Enter valid Bybit URL"
    } if (!isEmpty(formValue.coinbaseUrl) && !urlRegx.test(formValue.coinbaseUrl)) {
        error.coinbaseUrl = "Enter valid Coinbase URL"
    }

    // if (isEmpty(formValue.minFixedInvesPercen)) {
    //     error.minFixedInvesPercen = "Minimum Fixed invest percentage field is required"
    // }    

    if (isEmpty(formValue.minFixedInvesPercen)) {
        error['minFixedInvesPercen'] = '* Minimum Fixed percentage field is required'
    } else if (isEmpty(parseFloat(formValue.minFixedInvesPercen))) {
        error['minFixedInvesPercen'] = '* Minimum Fixed percentage must be greater than zero'
    } else if (parseFloat(formValue.minFixedInvesPercen) > 100) {
        error['minFixedInvesPercen'] = '* Minimum Fixed percentage should be within 100'
    }

    if (Object.keys(error).length > 0) {
        // setError(error)
        return { status: false, error: error }
    }
    return { status: true }
}
 
 
 
/** Validates just the Risk Management fields (Stop loss, Take profit, Max allow amount, Leverage).
 *  Shared by the Risk Management modal's "Confirm" action and the Request Copier "Copy" submit,
 *  so both enforce identical rules from a single source. */
export const validateRiskManagement = (data) => {
    let errors = {}
    if (isEmpty(data?.takeProfit)) {
        errors.takeProfit = "Take profit field is required"
    }
    if (isEmpty(data?.stopLoss)) {
        errors.stopLoss = "Stop loss field is required"
    }
    if (isEmpty(data?.maxAllowAmount)) {
        errors.maxAllowAmount = "Max Allow Amount field is required"
    }

    if (isEmpty(data?.leverage)) {
        errors.leverage = "Leverage is required."
    } else if (!/^\d+$/.test(data.leverage.toString().trim())) {
        errors.leverage = "Leverage must be a number."
    } else if (Number(data.leverage) < 1 || Number(data.leverage) > 100) {
        errors.leverage = "Leverage must be between 1 and 100."
    }

    if (Object.keys(errors).length > 0) {
        return { status: false, errors }
    }
    return { status: true, errors: {} }
}

export const requestCopierValidation = async (formValue) => {
    try {
        let error = {}
        if (isEmpty(formValue.investType)) {
            error.investType = "Type field is required"
        }

        if (formValue?.investType == 'fixed' && isEmpty(formValue.investPercen)) {
            error.investPercen = "Invest percentage field is required"
        } else if (formValue?.investType == 'fixed' && isEmpty(parseFloat(formValue.investPercen))) {
            error['investPercen'] = '*Invest percentage must be greater than zero'
        } else if (formValue?.investType == 'fixed' && parseFloat(formValue.investPercen) > 100) {
            error['investPercen'] = '*Invest percentage should be within 100'
        }

        const riskValidation = validateRiskManagement(formValue);
        if (!riskValidation.status) {
            error = { ...error, ...riskValidation.errors }
            error.riskManagement = "Risk Management details are incomplete."
        }

        if (isEmpty(formValue.tradePairs)) {
            error.tradePairs = "Please select pairs"
        }



        if (Object.keys(error).length > 0) {
            return { errors: error, status: false }
        }
        return { status: true }
    } catch (e) {
        console.log("requestCopierValidation_err", e);
        return false
    }
}


export const EditTraderValidation = (data) => {
    try {
        let errors = {}

        if (isEmpty(data.name)) {
            errors['name'] = '* Name is required'
        }
        if (isEmpty(data.description)) {
            errors['description'] = '* Description is required'
        }
        if (isEmpty(data.showHistory)) {
            errors['showHistory'] = '* Show history is required'
        }

        if (isEmpty(data.maxFollower)) {
            errors['maxFollower'] = '* Maximum followers is required'
        } else if (parseFloat(data.maxFollower) < 1) {
            errors['maxFollower'] = '* Maximum followers must be at least 1'
        }

        if (isEmpty(data.minFixedInvesPercen)) {
            errors['minFixedInvesPercen'] = '* Minimum Fixed percentage field is required'
        } else if (isEmpty(parseFloat(data.minFixedInvesPercen))) {
            errors['minFixedInvesPercen'] = '* Minimum Fixed percentage must be greater than zero'
        } else if (parseFloat(data.minFixedInvesPercen) > 100) {
            errors['minFixedInvesPercen'] = '* Minimum Fixed percentage should be within 100'
        }

        if (isEmpty(data.linkedInUrl)) {
            errors['linkedInUrl'] = '* LinkedIn URL is required'
        }
        if (isEmpty(data.twitterUrl)) {
            errors['twitterUrl'] = '* Twitter URL is required'
        }
        if (isEmpty(data.telegramUrl)) {
            errors['telegramUrl'] = '* Telegram URL is required'
        }
        if (isEmpty(data.binanceUrl)) {
            errors['binanceUrl'] = '* Binance URL is required'
        }
        if (isEmpty(data.coinbaseUrl)) {
            errors['coinbaseUrl'] = '* Coinbase URL is required'
        }
        if (isEmpty(data.bybitUrl)) {
            errors['bybitUrl'] = '* Bybit URL is required'
        }

        if (isEmpty(data.copyTradeFee)) {
            errors['copyTradeFee'] = '* Copy trader fee is required'
        } else if (isEmpty(parseFloat(data.copyTradeFee))) {
            errors['copyTradeFee'] = '* Copy trader fee must be greater than zero'
        } else if (parseFloat(data.copyTradeFee) > 100) {
            errors['copyTradeFee'] = '* Copy trader fee percentage should be within 100'
        }

        if (Object.keys(errors).length > 0) {
            return { errors: errors, status: false }
        }
        return { status: true }
    } catch (err) {
        console.log(err, 'RequestTraderValidation')
        return { status: false,errors: {} }
    }
}


export const EditCopierValidation = (data) => {
    try {
        let errors = {}

        // if (isEmpty(data.strategyId)) {
        //     errors['strategyId'] = '* Please select the strategy'
        // } else if (!ObjectId.isValid(data.strategyId)) {
        //     errors['strategyId'] = '* Invalid strategy'
        // }
        // if (isEmpty(data.investType)) {
        //     errors['investType'] = '*Please select the Invetment type'
        // }

        if (data.investType == "fixed") {
            if (isEmpty(data.investPercen)) {
                errors['investPercen'] = '*Invest percentage is required'
            } else if (isEmpty(parseFloat(data.investPercen))) {
                errors['investPercen'] = '*Invest percentage must be greater than zero'
            } else if (parseFloat(data.investPercen) > 100) {
                errors['investPercen'] = '*Invest percentage should be within 100'
            }
        }


        if (isEmpty(data.takeProfit)) {
            errors['takeProfit'] = '*Take profit field is required'
        } else if (isEmpty(parseFloat(data.takeProfit))) {
            errors['takeProfit'] = '*Take profit must be greater than zero'
        } else if (parseFloat(data.takeProfit) > 90) {
            errors['takeProfit'] = '*Take profit must be less than 90'
        }

        if (isEmpty(data.stopLoss)) {
            errors['stopLoss'] = '*Stop loss field is required'
        } else if (isEmpty(parseFloat(data.stopLoss))) {
            errors['stopLoss'] = '*Stop loss must be greater than zero'
        } else if (parseFloat(data.stopLoss) > 90) {
            errors['stopLoss'] = '*Stop loss must be less than 90'
        }

        if (isEmpty(data.maxAllowAmount)) {
            errors['maxAllowAmount'] = '* Maximum Allow amount is required'
        } else if (isEmpty(parseFloat(data.maxAllowAmount))) {
            errors['maxAllowAmount'] = '* Maximum Allow amount must be greater than zero'
        }

        if (isEmpty(data.leverage)) {
            errors['leverage'] = 'Leverage is required.'
        } else if (!/^\d+$/.test(data.leverage.toString().trim())) {
            errors['leverage'] = 'Leverage must be a number.'
        } else if (Number(data.leverage) < 1 || Number(data.leverage) > 100) {
            errors['leverage'] = 'Leverage must be between 1 and 100.'
        }

        if (isEmpty(data.tradePairs)) {
            errors['tradePairs'] = `* Trade pairs is required`
        }

        if (Object.keys(errors).length > 0) {
            return { errors: errors, status: false }
        }
        return { status: true }

    } catch (err) {
        console.log(err, 'RequestCopierValidation__err')
        return { status: false,errors: {} }
    }
}