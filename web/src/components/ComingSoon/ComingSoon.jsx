import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './comingSoon.module.css'
import Images from '../../utils/Images'
import config from '../../config/env'
import { useGlobalContext } from '../../context/GlobalProvider'

/**
 * Shows a full-screen "Coming Soon" page in place of children.
 *
 * @param {boolean} active - if true, renders the Coming Soon page instead of children
 * @param {string} title - heading text
 * @param {string} message - subtext
 * @param {boolean} showDemoBadge - if true, always shows the orange "Demo"
 *   badge next to the logo regardless of environment. Optional, defaults to
 *   false. In practice this is now redundant with the automatic
 *   isDemoEnv check below (config.ENV !== 'live') — same condition already
 *   used in HeaderMenus.jsx for the header's own "Demo" badge — but kept
 *   as an explicit override for callers that want it unconditionally.
 * @param {Function} [onClose] - optional. If provided, the logo click and
 *   the bottom button call this instead of navigating home — used when this
 *   is shown as an overlay on top of whatever page the user is already on
 *   (e.g. Demo Trade, triggered from a menu click with no URL/route change
 *   at all) rather than as a page occupying its own dedicated route. When
 *   omitted, behavior is exactly as before: both navigate to '/'.
 * @param {string} [closeButtonText] - optional, defaults to "Back to Home".
 *   Pass e.g. "Close" when using onClose, since there's no "home" being
 *   navigated to in that case.
 * @param {ReactNode} children - the real page content, only rendered when active=false
 */
const ComingSoon = ({
    active = true,
    title = "Coming Soon",
    message = "No trading pairs are available for this market yet. Please check back later.",
    showDemoBadge = false,
    onClose,
    closeButtonText = "Back to Home",
    children
}) => {
    const navigate = useNavigate()
    const { theme } = useGlobalContext()

    if (!active) return <>{children}</>

    // Same condition already used in HeaderMenus.jsx for the header's own
    // orange "Demo" badge — reused here so every Coming Soon page (Options,
    // Affiliate, Institutional, Demo Trade) automatically picks up the same
    // demo-environment badge + orange theme with no per-page change needed,
    // and automatically stays plain/green on the live production domain —
    // "without affecting already working flow" there.
    const isDemoEnv = false
    const shouldShowDemoBadge = showDemoBadge || isDemoEnv

    const handleGoHome = () => {
        if (onClose) {
            onClose()
        } else {
            navigate('/')
        }
    }

    return (
        <div className={styles.comingSoonOverlay}>
            <div className={styles.comingSoonBox}>
                <div className={styles.logoRow}>
                    <img
                        src={theme == "dark" ? Images.logo : Images.logoDark}
                        alt="logo"
                        className={styles.logo}
                        onClick={handleGoHome}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleGoHome()}
                    />
                    {shouldShowDemoBadge && <span className={styles.demoBadge}>Demo</span>}
                </div>
                <h2>{title}</h2>
                <p>{message}</p>
                <button
                    className={`${styles.homeButton} ${isDemoEnv ? styles.homeButtonDemo : ''}`}
                    onClick={handleGoHome}
                >
                    {closeButtonText}
                </button>
            </div>
        </div>
    )
}

export default ComingSoon