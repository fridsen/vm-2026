import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { haptics } from '../utils/haptics.js';

const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const CLOSE_DURATION_MS = 280;

export default function BottomSheet({
  open,
  onClose,
  children,
  labelledBy,
  className,
  padded = true,
  maxWidth = 'max-w-[420px]',
  /** `surface` = white cards; `sheet` = prediction-sheet container (#F0F5F9). */
  bg = 'surface',
  /** Rendered above the sheet panel (e.g. in-sheet spotlight onboarding). */
  overlay = null,
  /** Called when open/animation phase changes: opening | idle | dragging | settling | closing */
  onPhaseChange,
  /** When true, backdrop tap and drag-to-dismiss are disabled. */
  lockDismiss = false,
}) {
  const [phase, setPhase] = useState('opening'); // opening | idle | dragging | settling | closing
  const [dragY, setDragY] = useState(0);
  const overlayRef = useRef(null);
  const sheetRef = useRef(null);
  const closeTimer = useRef(null);
  const drag = useRef({ id: null, startY: 0, lastY: 0, lastT: 0, v: 0, dragging: false });
  const movedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      let cancelled = false;
      queueMicrotask(() => {
        if (cancelled) return;
        setPhase('opening');
        setDragY(0);
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    setPhase('opening');
    setDragY(0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        setPhase('idle');
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(closeTimer.current);
    };
  }, [open]);

  useEffect(() => {
    onPhaseChange?.(open ? phase : null);
  }, [open, phase, onPhaseChange]);

  useEffect(() => {
    const root = document.documentElement;
    if (open) root.classList.add('bottom-sheet-open');
    else root.classList.remove('bottom-sheet-open');
    return () => root.classList.remove('bottom-sheet-open');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const findScrollable = (node) => {
      let el = node?.parentElement;
      while (el) {
        const oy = getComputedStyle(el).overflowY;
        if (/(auto|scroll)/.test(oy) && el.scrollHeight > el.clientHeight) return el;
        el = el.parentElement;
      }
      return null;
    };
    const scroller =
      findScrollable(overlayRef.current) ||
      overlayRef.current?.closest('main') ||
      null;
    const targets = [document.body, scroller].filter(Boolean);
    const prev = targets.map((el) => el.style.overflow);
    targets.forEach((el) => {
      el.style.overflow = 'hidden';
    });
    return () => {
      targets.forEach((el, i) => {
        el.style.overflow = prev[i];
      });
    };
  }, [open]);

  const requestClose = () => {
    if (lockDismiss || phase === 'closing') return;
    haptics.light();
    setPhase('closing');
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setPhase('opening');
      setDragY(0);
      onClose?.();
    }, CLOSE_DURATION_MS);
  };

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    drag.current = {
      id: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: performance.now(),
      v: 0,
      dragging: false,
    };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (d.id === null || e.pointerId !== d.id) return;
    const dy = e.clientY - d.startY;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = now;
    if (!d.dragging) {
      if (dy > 8) {
        d.dragging = true;
        try {
          sheetRef.current?.setPointerCapture(d.id);
        } catch {
          /* ignore */
        }
        setPhase('dragging');
      } else {
        return;
      }
    }
    setDragY(Math.max(0, dy));
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (d.id === null || e.pointerId !== d.id) return;
    const wasDragging = d.dragging;
    const dy = Math.max(0, e.clientY - d.startY);
    const v = d.v;
    drag.current = { id: null, startY: 0, lastY: 0, lastT: 0, v: 0, dragging: false };
    if (!wasDragging) return;
    movedRef.current = true;
    if (!lockDismiss && (dy > 120 || v > 0.6)) {
      haptics.medium();
      setPhase('closing');
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => {
        setPhase('opening');
        setDragY(0);
        onClose?.();
      }, CLOSE_DURATION_MS);
    } else {
      setPhase('settling');
      setDragY(0);
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setPhase('idle'), 280);
    }
  };

  const onClickCapture = (e) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  if (!open) return null;

  const sheetStyle = { touchAction: 'none' };
  if (phase === 'opening') {
    sheetStyle.transform = 'translateY(110%)';
    sheetStyle.transition = 'none';
  } else if (phase === 'closing') {
    sheetStyle.transform = 'translateY(110%)';
    sheetStyle.transition = `transform 0.28s ${SHEET_EASE}`;
  } else if (phase === 'idle') {
    sheetStyle.transform = 'translateY(0)';
    sheetStyle.transition = `transform 0.32s ${SHEET_EASE}`;
  } else if (phase === 'dragging') {
    sheetStyle.transform = `translateY(${dragY}px)`;
    sheetStyle.transition = 'none';
  } else if (phase === 'settling') {
    sheetStyle.transform = `translateY(${dragY}px)`;
    sheetStyle.transition = `transform 0.25s ${SHEET_EASE}`;
  }

  const backdropOpacity =
    phase === 'opening' || phase === 'closing'
      ? 0
      : phase === 'dragging' || phase === 'settling'
        ? Math.max(0, 1 - dragY / 500)
        : 1;

  return createPortal(
    <div
      ref={overlayRef}
      data-bottom-sheet-overlay=""
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="fixed inset-0 z-0 bg-black/40"
        style={{ opacity: backdropOpacity, transition: 'opacity 0.28s ease' }}
      />
      <div
        ref={sheetRef}
        className={clsx(
          'bottom-sheet-panel relative z-10 flex max-h-[calc(100dvh-34px)] w-full flex-col overflow-hidden rounded-t-[32px] pb-0 shadow-[0_0_20px_rgba(0,0,0,0.15)]',
          bg === 'sheet' ? 'bg-sheet' : 'bg-surface',
          maxWidth,
          padded && 'px-4',
          className,
        )}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        onClickCapture={onClickCapture}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button type="button" className="flex justify-center pb-3 pt-2" onClick={requestClose} aria-label="Stäng">
          <span className="h-1 w-10 rounded-full bg-sheet" />
        </button>
        {children}
      </div>
      {overlay ? (
        <div
          className="absolute inset-0 z-20"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {overlay}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
