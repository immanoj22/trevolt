export const normalizeBracketInput = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return typeof value === 'string' ? value : String(value);
};

export const formatSafeNumber = (value, decimals = 2, fallback = 0) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return Number(fallback).toFixed(decimals);
  }

  return Number(numericValue).toFixed(decimals);
};

export const calculateBracketOrderPnl = ({
  entryPrice,
  triggerPrice,
  quantity,
  positionSide,
}) => {
  const safeEntry = Number(entryPrice);
  const safeTrigger = Number(triggerPrice);
  const safeQuantity = Number(quantity);

  if (!Number.isFinite(safeEntry) || !Number.isFinite(safeTrigger) || !Number.isFinite(safeQuantity)) {
    return 0;
  }

  if (positionSide === 'buy') {
    return (safeTrigger - safeEntry) * safeQuantity;
  }

  if (positionSide === 'sell') {
    return (safeEntry - safeTrigger) * safeQuantity;
  }

  return 0;
};
