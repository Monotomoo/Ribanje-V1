import { useEffect, useState } from 'react';

/* useViewport — single source of truth for responsive decisions.
   Phase 11 viewport classes:
   - phone     <  768px  (drawer sidebar, stacked layouts, daily-touch surfaces editable)
   - tablet    768-1279  (full sidebar, 2-col where 3-4 was, touch interactions work)
   - desktop  >= 1280    (current desktop experience preserved exactly)
*/

export interface ViewportInfo {
  width: number;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
}

const PHONE_MAX = 768;
const TABLET_MAX = 1280;

function read(): ViewportInfo {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      isPhone: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
    };
  }
  const width = window.innerWidth;
  const isTouch =
    window.matchMedia?.('(pointer: coarse)').matches ?? 'ontouchstart' in window;
  return {
    width,
    isPhone: width < PHONE_MAX,
    isTablet: width >= PHONE_MAX && width < TABLET_MAX,
    isDesktop: width >= TABLET_MAX,
    isTouch,
  };
}

export function useViewport(): ViewportInfo {
  const [info, setInfo] = useState<ViewportInfo>(read);

  useEffect(() => {
    let pending = 0;
    function update() {
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        setInfo(read());
        pending = 0;
      });
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (pending) window.cancelAnimationFrame(pending);
    };
  }, []);

  return info;
}
