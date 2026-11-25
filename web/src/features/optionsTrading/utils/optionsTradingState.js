export const hasResolvedUnderlyingList = (underlyingDetails = []) => Array.isArray(underlyingDetails) && underlyingDetails.length > 0;

export const getFirstAvailableUnderlyingAsset = (underlyingDetails = []) => {
  if (!hasResolvedUnderlyingList(underlyingDetails)) return null;

  return underlyingDetails.find((asset) => Array.isArray(asset?.options) && asset.options.length > 0) || null;
};

export const shouldSkipInitialOptionHydration = (underlyingDetails = []) => {
  if (!hasResolvedUnderlyingList(underlyingDetails)) return true;

  return !underlyingDetails.some((asset) => Array.isArray(asset?.options) && asset.options.length > 0);
};

export const shouldKeepContentVisibleWhileContractLoads = (tikerRoot, optionContractData) => {
  if (!tikerRoot) return false;

  if (!optionContractData) return true;

  return Array.isArray(optionContractData) && optionContractData.length === 0;
};

export const buildUnderlyingDataSnapshot = (asset = {}) => ({
  _id: asset?._id ?? '',
  symbol: asset?.symbol ?? '',
  marketPrice: asset?.marketPrice ?? 0,
  minQuantity: asset?.minQuantity ?? 0,
  baseCurrency: asset?.baseCurrency ?? asset?.symbol ?? 'EURUSD',
  quoteCurrency: asset?.quoteCurrency ?? 'USD',
});

export const resetOptionContractReduxState = (dispatch) => {
  if (!dispatch) return;

  dispatch({ type: 'option/OptionContractDetail', payload: { optionContractData: [] } });
  dispatch({ type: 'option/OptionTradePair', payload: { tradePair: {} } });
  dispatch({ type: 'option/OptionTicker', payload: { tikerData: {} } });
  dispatch({ type: 'option/Options', payload: { optionsData: [] } });
  dispatch({ type: 'option/UnderlyingData', payload: { underlyingData: {} } });
};
