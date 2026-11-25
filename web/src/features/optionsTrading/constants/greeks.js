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
      return 1.0 - c2 * Math.exp(-0.5 * x * x) * t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    } else {
      return 1.0 - cumulativeNormalDistribution(-x);
    }
  }
  
  function normalDensity(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }
  
 export function calculateGreeks(S, K, T, r, sigma, type) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
  
    let delta, gamma, theta, vega;
  
    if (type === "CALL") {
      delta = cumulativeNormalDistribution(d1);
      theta = -(S * normalDensity(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * cumulativeNormalDistribution(d2);
    } else {
      delta = cumulativeNormalDistribution(d1) - 1;
      theta = -(S * normalDensity(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * cumulativeNormalDistribution(-d2);
    }
  
    gamma = normalDensity(d1) / (S * sigma * Math.sqrt(T));
    vega = S * normalDensity(d1) * Math.sqrt(T);
   
    
  
    return { delta, gamma, theta, vega };
  }
  
  
  