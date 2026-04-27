import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useEffect, useRef } from 'react';

/* usePointerDrag — unified mouse + touch drag helper.
   Used by EnhancedProductionGantt phase resize/slide and the Shoot calendar
   drag-swap (Phase 11). The hook returns a `start` function — call it from
   onMouseDown or onTouchStart with the data + handlers. The helper attaches
   document-level move/end listeners only for the duration of the drag, then
   cleans up. Touch moves call preventDefault() to keep the page from scrolling
   while a drag is in flight. */

export interface DragState<T> {
  data: T;
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

export interface DragHandlers<T> {
  onMove: (state: DragState<T>) => void;
  onEnd: (state: DragState<T>) => void;
  onCancel?: () => void;
}

interface PointerXY {
  x: number;
  y: number;
}

function pointerXY(e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent): PointerXY | null {
  /* React.TouchEvent / TouchEvent have `touches`. Otherwise mouse. */
  if ('touches' in e) {
    if (e.touches.length === 0) return null;
    const t = e.touches[0];
    return { x: t.clientX, y: t.clientY };
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

export function usePointerDrag<T>() {
  const cleanupRef = useRef<(() => void) | null>(null);

  function start(
    e: ReactMouseEvent | ReactTouchEvent,
    data: T,
    handlers: DragHandlers<T>
  ) {
    /* Tear down any in-flight drag. */
    cleanupRef.current?.();

    const startXY = pointerXY(e);
    if (!startXY) return;

    const state: DragState<T> = {
      data,
      startX: startXY.x,
      startY: startXY.y,
      curX: startXY.x,
      curY: startXY.y,
    };

    function onMove(ev: MouseEvent | TouchEvent) {
      const xy = pointerXY(ev);
      if (!xy) return;
      state.curX = xy.x;
      state.curY = xy.y;
      handlers.onMove(state);
      /* Stop the page from scrolling while dragging on touch. */
      if ('touches' in ev) ev.preventDefault();
    }

    function onEnd() {
      handlers.onEnd(state);
      cleanup();
    }

    function onCancel() {
      handlers.onCancel?.();
      cleanup();
    }

    function cleanup() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onCancel);
      cleanupRef.current = null;
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onCancel);
    cleanupRef.current = cleanup;
  }

  /* Clean up if the consumer unmounts mid-drag. */
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { start };
}
