import React from 'react'
import { useGlobalContext } from '../../context/GlobalProvider'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux';

/**
 * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
 * This guard used to gate on the raw JWT's presence in localStorage
 * (`GetLocalStorageItem({ key: "accessToken" })`). The JWT is no longer
 * stored there — the backend sets it as an httpOnly cookie instead, which
 * client-side JS cannot read at all, so that check would now always fail.
 * The guard is driven instead by `isAuthStatus`, which GlobalProvider only
 * sets to true after actually confirming the session via the
 * cookie-authenticated `getUserDetailsHooks()` call — so a stale/tampered
 * local flag alone still can't grant access to protected routes.
 */
export default function AuthProtected({ children, redirectLink = "/" }) {
    const { isAuth, isAuthChecked } = useGlobalContext();
    const { isAuthStatus } = useSelector((state) => state.user);
    // Wait for the initial cookie-based session check to finish before
    // deciding to redirect, so a legitimately logged-in user isn't bounced
    // out on page refresh while getUserDetailsHooks() is still in flight.
    if (!isAuthChecked) return null;
    return (
        <>
            {
                (isAuth || isAuthStatus) ? children :
                    <Navigate to={redirectLink} />
            }
        </>
    )
}