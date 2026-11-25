
import { useEffect } from "react";
import useCustomHooks from "./customhook";

// Module-level (not a ref) on purpose: an error object coming from a cached/shared
// RTK Query result can outlive the component that first showed it. Navigate away and
// back (or a parent re-renders the tree such that this hook's component remounts) and
// this effect fires fresh on the new mount with that same still-truthy error - a ref
// would have already been reset by the remount and wouldn't know the toast was ever
// shown, so the same "error" toast pops again purely from a screen change, not a new
// failure. A WeakSet keyed by the exact error object survives across those remounts
// without leaking (entries drop once nothing else references the error).
const shownErrors = new WeakSet<object>();

const useApiError = (error: any, duration?: number) => {
    const { failuretoast } = useCustomHooks();
    useEffect(() => {
        if (!error || typeof error !== "object") return;
        if (shownErrors.has(error)) return;
        shownErrors.add(error);

        if (error?.data?.message) {
            if (duration) {
                failuretoast("Error!", error.data.message, duration);
            }
            else {
                failuretoast("Error!", error.data.message);
            }
        }
        else if (error?.data?.errors) {
            const firstError = Object.values(error?.data?.errors)[0];
            failuretoast("Error!", firstError);

        }
    }, [error]);
};

export default useApiError;