export const calculateLeverageValue = (percent, maxLeverage, minLeverage = 1) => {
  if (!Number.isFinite(maxLeverage) || maxLeverage <= 0) {
    return minLeverage;
  }

  const safeMin = Number.isFinite(minLeverage) ? minLeverage : 1;
  const value = (percent / 100) * maxLeverage;

  if (percent === 0) {
    return Math.max(safeMin, 1);
  }

  return Math.min(Math.max(value, safeMin), maxLeverage);
};

export const safeInvokeFocus = (onFocus, value) => {
  if (typeof onFocus === 'function') {
    onFocus(value);
  }
};
