import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isEmpty } from "../lib/isEmpty";
import { formatValue } from "../lib/Common";
const usePriceConversion = (base = "USDT", quote = "INR") => {
  const { showCurrency, secondaryCurrency } = useSelector(
    (state) => state.wallet,
  );
  const { priceConversionList } = useSelector((state) => state.currency);
  // console.log("usePriceConversion", base, quote)
  const [conversionRate, setConversionRate] = useState({});
  useEffect(() => {
    try {
      if (!isEmpty(priceConversionList)) {
        let conversionRate = priceConversionList.find(
          (val) => val.pair == `${base}${quote}`,
        );
        if (!isEmpty(conversionRate)) {
          setConversionRate(conversionRate);
        } else {
          conversionRate = priceConversionList.find(
            (val) => val.pair == `${quote}${base}`,
          );
          conversionRate.price = 1 / conversionRate.price;
          setConversionRate(conversionRate);
        }
      }
    } catch (error) {
    }
  }, [priceConversionList, base, quote]);

  // const convertValue = (value, pip = 2) => {
  //     const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  //     try {
  //         let amount = parseFloat(value)
  //         amount = isNaN(amount) || !isFinite(amount) ? 0 : amount
  //         if (amount !== 0 && !isEmpty(conversionRate) && (showCurrency !== "USD")) {
  //             amount = (parseFloat(value) * conversionRate.price)
  //         }
  //         // amount = amount.toFixed(pip)
  //         console.log("convertValue_formatValue : ", {amount, pip});
  //         amount = formatValue(amount, pip)
  //         console.trace("convertValue_formatValue_afterConversion : ", {value, amount, pip});
  //         return (showCurrency === 'INR' ? <><span className="inrTag">₹</span> {amount.toLocaleString('en-IN')}</> : <> <span></span>{usdFormatter.format(amount)}</>)

  //     } catch (err) {
  //         console.log('convertValue__err', err)
  //         return (showCurrency === 'INR' ? <><span className="inrTag">₹</span> {value.toLocaleString('en-IN')}</> : <> <span></span>{value}</>)
  //     }
  // }

  const convertValue = (value, pip = 2) => {
    const usdFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });
    try {
      let amount = parseFloat(value);
      amount = isNaN(amount) || !isFinite(amount) ? 0 : amount;

      if (amount !== 0 && !isEmpty(conversionRate) && showCurrency !== "USD") {
        amount = parseFloat(value) * conversionRate.price;
      }

      const formatted = formatValue(amount, pip);
      const isSpecialString =
        typeof formatted === "string" && formatted.includes("<");

      // If formatValue returned a special string like '<0.01', display as-is
      const displayValue = isSpecialString
        ? showCurrency === "INR"
          ? formatted
          : `<$${formatted.replace("<", "")}`
        : showCurrency === "INR"
          ? Number(formatted).toLocaleString("en-IN")
          : usdFormatter.format(Number(formatted));

      return (showCurrency === "INR") ? (
        <>
          <span className="inrTag">₹</span> {displayValue}
        </>
      ) : (
        <>
          <span></span>
          {displayValue}
        </>
      );
    } catch (err) {
      console.log("convertValue__err", err);
      return showCurrency === "INR" ? (
        <>
          <span className="inrTag">₹</span> {value.toLocaleString("en-IN")}
        </>
      ) : (
        <>
          <span></span>
          {value}
        </>
      );
    }
  };

  const convertSecValue = (value, pip = 2) => {

      const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
      let isNotConvert = false
      try {
          let amount = parseFloat(value)
          amount = isNaN(amount) || !isFinite(amount) ? 0 : amount

          if (amount !== 0 && !isEmpty(conversionRate) && (secondaryCurrency !== "USD")) {
              amount = (parseFloat(value) * conversionRate.price)
          }
          // console.log("convertSecValue_formatValue : ", {amount, pip});
          amount = formatValue(amount, pip)
          // console.trace("convertSecValue_formatValue_afterConversion : ", {value, amount, pip});

          isNotConvert = typeof amount === 'string' && amount.split('').includes('<')
          // console.log("value, pip = 2_convertSecValue", amount, value, usdFormatter.format(amount), isNotConvert);
          // console.log("convertSecValue_formatValue : ", value , "->", amount);

          return (secondaryCurrency === 'INR' ? <span className="inrTag">₹ {amount.toLocaleString('en-IN')} </span> : <span>{isNotConvert ? amount : usdFormatter.format(amount)}</span>)

      } catch (err) {
          console.log('convertSecValue_err', err)
          return (secondaryCurrency === 'INR' ? <span className="inrTag">₹ {value.toLocaleString('en-IN')} </span> : <span>{isNotConvert ? amount : usdFormatter.format(value)}</span>)
      }
  }

  const convertTo = (value, base, quote, pip = "") => {
    try {
      let amount = value;
      if (base == quote) {
        return value;
      }
      let conversionRate = priceConversionList.find(
        (val) => val.pair == `${base}${quote}`,
      );
      if (isEmpty(conversionRate)) {
        conversionRate = priceConversionList.find(
          (val) => val.pair == `${quote}${base}`,
        );
        conversionRate.price = 1 / conversionRate.price;
      }
      amount = value * conversionRate.price;
      amount = isNaN(amount) || !isFinite(amount) ? value : amount;
      if (!isEmpty(pip)) {
        amount = amount.toFixed(pip);
      }
      return amount;
    } catch (err) {
      console.log(err, "convertTo___err");
      return value;
    }
  };

  const ChangeConversionRate = (base = "USD", quote = "INR") => {
    try {
      if (!isEmpty(priceConversionList)) {
        let conversionRate = priceConversionList.find(
          (val) => val.pair == `${base}${quote}`,
        );
        if (!isEmpty(conversionRate)) {
          setConversionRate(conversionRate);
        } else {
          conversionRate = priceConversionList.find(
            (val) => val.pair == `${quote}${base}`,
          );
          conversionRate.price = 1 / conversionRate.price;
          setConversionRate(conversionRate);
        }
      }
    } catch (err) {
      console.log("convertValue__err", err);
      return value;
    }
  };

  const convertValueforChart = (value, pip = 2) => {
    try {
      // console.log('convertValueforChart', value, showCurrency)
      let amount = parseFloat(value);
      amount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
      if (amount !== 0 && !isEmpty(conversionRate) && showCurrency !== "USD") {
        amount = parseFloat(value) * conversionRate.price;
      }
      // amount = amount.toFixed(pip)
      amount = formatValue(amount, pip);
      const isSpecialString = typeof amount === "string" && amount.includes("<");
      const displayValue = isSpecialString
        ? amount
        : Number(amount).toLocaleString(showCurrency === "INR" ? "en-IN" : "en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: pip,
          });
      return showCurrency === "INR" ? `₹${displayValue}` : `$${displayValue}`;
    } catch (err) {
      console.log("convertValue__err", err);
      return showCurrency === "INR" ? `₹${value}` : `$${value}`;
    }
  };

  return {
    convertValue,
    convertSecValue,
    conversionRate,
    ChangeConversionRate,
    convertValueforChart,
    convertTo,
  };
};

export default usePriceConversion;
