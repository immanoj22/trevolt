function cumulativeNormalDistribution(x) {
    var b1 = 0.31938153;
    var b2 = -0.356563782;
    var b3 = 1.781477937;
    var b4 = -1.821255978;
    var b5 = 1.330274429;
    var p = 0.2316419;
    var c2 = 0.3989423;
  
    if (x >= 0.0) {
      var t = 1.0 / (1.0 + p * x);
      return 1.0 - c2 * Math.exp(-x * x / 2.0) * t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    } else {
      return 1.0 - cumulativeNormalDistribution(-x);
    }
  }
  
 export function blackScholes(S, K, T, r, sigma, type) {
    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
  
    if (type === "CALL") {
      return S * cumulativeNormalDistribution(d1) - K * Math.exp(-r * T) * cumulativeNormalDistribution(d2);
    } else {
      return K * Math.exp(-r * T) * cumulativeNormalDistribution(-d2) - S * cumulativeNormalDistribution(-d1);
    }
  }
  

  