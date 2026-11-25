import { useSelector } from 'react-redux'

export function useAvailableMargin() {
    const { isAuthStatus, wallet } = useSelector((state) => state.user);

    if (!isAuthStatus) return { isAuthStatus, balanceLabel: null };

    const balanceLabel = `${(wallet?.availableBalance ?? 0).toFixed(2)} USD`;
    return { isAuthStatus, balanceLabel };
}
