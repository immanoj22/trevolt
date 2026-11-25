/**
 * DraggableResizablePanel.jsx
 *
 * A free-floating, draggable + resizable panel — the building block for
 * the Binance-style "customize layout" mode on the Futures page.
 *
 * Deliberately self-contained and additive: it only renders (and only gets
 * mounted at all) when the page's `customizeMode` is on. With customize
 * mode off — the default, unchanged state — none of this exists in the
 * DOM and the page renders exactly as it did before, via the normal CSS
 * Grid areas. That's the whole point: this can't affect the existing
 * working layout, because it's a fully separate render path, not a
 * modification of it.
 *
 * Position/size are lifted up (via `rect`/`onChange`) rather than kept as
 * fully local state, so the parent can persist the whole layout (all
 * panels) as one object and restore it on reload — same
 * localStorage-persistence pattern already used elsewhere on this page
 * (openOrderBook/openRecentTrade/openChart).
 *
 * Unlike an earlier version of this component, this wrapper renders NO
 * header/title bar and NO close icon of its own — Order Book, Recent
 * Trades and the chart each already have their own header (with their own
 * title) and their own hover-to-reveal close icon (see orderBook.module.css
 * / recentTrades.module.css / tradingChart.module.css). Rendering a
 * second header here would just duplicate the first. Instead, this panel
 * makes THEIR existing header double as the drag handle: any section
 * marks its header with `data-panel-drag-handle`, and this wrapper listens
 * for pointerdown anywhere inside itself, starting a move-drag only when
 * the event originated inside one of those marked headers (and not on an
 * interactive control within it, e.g. the section's own close icon or its
 * layout-toggle buttons — those need to keep working as clicks).
 */

import React, { useCallback, useRef } from 'react';
import styles from '../styles/draggableResizablePanel.module.css';

const DEFAULT_DRAG_HANDLE_SELECTOR = '[data-panel-drag-handle]';
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"]';

/**
 * @param {object} rect        { x, y, w, h } — current position/size, in
 *                              pixels, relative to the canvas this panel
 *                              lives in.
 * @param {function} onChange  (nextRect, mode) => void — called
 *                              continuously while dragging/resizing (not
 *                              just on release), so the visible position
 *                              always matches what's about to be
 *                              persisted. `mode` is 'move' or 'resize', so
 *                              a parent can react differently to each
 *                              (e.g. reflowing sibling panels only when
 *                              this one is resized).
 * @param {function} onFocus   () => void — called on pointerdown anywhere
 *                              on the panel, so the parent can bring it to
 *                              the front (raise its z-index) the same way
 *                              every other floating-window system does.
 * @param {number} zIndex
 * @param {function} getBounds () => DOMRect — the canvas's current
 *                              bounding box, read live (not cached) so
 *                              dragging stays correctly clamped even if
 *                              the canvas itself is mid-resize (e.g. the
 *                              browser window changing size).
 * @param {string} dragHandleSelector  CSS selector identifying which
 *                              descendant element(s) act as the drag
 *                              handle. Defaults to any element carrying
 *                              `data-panel-drag-handle`.
 */
const DraggableResizablePanel = ({
    rect,
    onChange,
    onFocus,
    zIndex,
    getBounds,
    minW = 260,
    minH = 180,
    dragHandleSelector = DEFAULT_DRAG_HANDLE_SELECTOR,
    children,
}) => {
    const dragStateRef = useRef(null); // { startX, startY, startRect, mode: 'move' | 'resize', pointerId, target }

    const clamp = useCallback((next) => {
        const bounds = getBounds?.();
        if (!bounds) return next;
        const w = Math.max(minW, Math.min(next.w, bounds.width));
        const h = Math.max(minH, Math.min(next.h, bounds.height));
        const x = Math.max(0, Math.min(next.x, bounds.width - w));
        const y = Math.max(0, Math.min(next.y, bounds.height - h));
        return { x, y, w, h };
    }, [getBounds, minW, minH]);

    const onPointerMove = useCallback((e) => {
        const drag = dragStateRef.current;
        if (!drag) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;

        if (drag.mode === 'move') {
            onChange(clamp({ ...drag.startRect, x: drag.startRect.x + dx, y: drag.startRect.y + dy }), 'move');
        } else {
            onChange(clamp({ ...drag.startRect, w: drag.startRect.w + dx, h: drag.startRect.h + dy }), 'resize');
        }
    }, [onChange, clamp]);

    const endDrag = useCallback(() => {
        const drag = dragStateRef.current;
        dragStateRef.current = null;
        document.body.style.cursor = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        window.removeEventListener('blur', endDrag);
        if (drag?.target && drag.target.hasPointerCapture?.(drag.pointerId)) {
            try {
                drag.target.releasePointerCapture(drag.pointerId);
            } catch (err) {
                // Already released (e.g. the browser auto-released it when
                // the pointer left the document) — nothing left to do.
            }
        }
    }, [onPointerMove]);

    const startDrag = useCallback((mode) => (e) => {
        // Left click / primary touch point only.
        if (e.button !== undefined && e.button !== 0) return;
        onFocus?.();
        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startRect: { ...rect },
            mode,
            pointerId: e.pointerId,
            target: e.currentTarget,
        };
        // Locks the cursor for the whole gesture, not just while the
        // pointer happens to still be over the header/corner — a fast
        // drag can easily outrun that element's own hover box.
        document.body.style.cursor = mode === 'move' ? 'grabbing' : 'se-resize';
        // Pointer capture keeps every subsequent pointermove/pointerup for
        // THIS gesture targeted at this element, even once the cursor
        // moves over the TradingView chart's own iframe. Without it, the
        // pointerup that's supposed to end the drag can fire inside that
        // iframe's own document instead — which never reaches the
        // `window` listener below at all — leaving the drag stuck
        // "running" (still resizing/moving) even after the mouse button's
        // been released, until the pointer happens to cross back over
        // this page's own content.
        try {
            e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch (err) {
            // Some pointer types/older browsers don't support capture —
            // the drag still works via the window listeners below, just
            // without the iframe safety net.
        }
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', endDrag, { once: true });
        // Safety nets for cases where pointerup itself never fires at all
        // (e.g. the gesture gets cancelled — common on touch — or the
        // window loses focus mid-drag, such as alt-tabbing away): without
        // these, the drag would otherwise stay stuck forever since nothing
        // else would ever call endDrag.
        window.addEventListener('pointercancel', endDrag, { once: true });
        window.addEventListener('blur', endDrag, { once: true });
        e.preventDefault();
    }, [rect, onPointerMove, endDrag, onFocus]);

    // Delegated drag-start: begins a move-drag only when the pointerdown
    // lands inside one of this panel's OWN existing section headers
    // (marked with data-panel-drag-handle by the section itself), and
    // never when it lands on an interactive control (a button, the
    // section's close icon, etc.) even if that control happens to sit
    // inside the header — those need to keep receiving normal clicks.
    const handlePanelPointerDown = useCallback((e) => {
        onFocus?.();
        if (e.target.closest(INTERACTIVE_SELECTOR)) return;
        if (!e.target.closest(dragHandleSelector)) return;
        startDrag('move')(e);
    }, [dragHandleSelector, onFocus, startDrag]);

    return (
        <div
            className={styles.panel}
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex }}
            onPointerDown={handlePanelPointerDown}
        >
            <div className={styles.body}>
                {children}
            </div>
            <div className={styles.resizeHandle} onPointerDown={startDrag('resize')} />
        </div>
    );
};

export default DraggableResizablePanel;