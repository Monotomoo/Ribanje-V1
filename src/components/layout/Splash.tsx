import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HEKTOROVIC_EPIGRAPH } from '../../lib/seed';
import { markSplashSeen } from '../../lib/storage';

type Phase =
  | 'fade-in'
  | 'letterbox-in'
  | 'title'
  | 'subtitle'
  | 'epigraph'
  | 'hold'
  | 'letterbox-out'
  | 'done';

interface Props {
  onComplete: () => void;
}

/*
  Editorial cinematic open.
  Letterbox bars in → italic Fraunces "Ribanje" fades in + drifts up →
  italic subtitle fades in → Hektorović epigraph fades in →
  hold → letterbox bars expand outward → reveal app.
  Total ~4.5s. Click anywhere to skip.
*/
export function Splash({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('fade-in');

  useEffect(() => {
    const advance = (n: Phase, ms: number) => {
      const id = window.setTimeout(() => setPhase(n), ms);
      return () => window.clearTimeout(id);
    };
    if (phase === 'fade-in')       return advance('letterbox-in', 200);
    if (phase === 'letterbox-in')  return advance('title', 600);
    if (phase === 'title')         return advance('subtitle', 1100);
    if (phase === 'subtitle')      return advance('epigraph', 700);
    if (phase === 'epigraph')      return advance('hold', 600);
    if (phase === 'hold')          return advance('letterbox-out', 700);
    if (phase === 'letterbox-out') return advance('done', 750);
    if (phase === 'done') {
      markSplashSeen();
      const t = window.setTimeout(onComplete, 250);
      return () => window.clearTimeout(t);
    }
    // onComplete is stable (useCallback in parent); intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function skip() {
    if (phase === 'done') return;
    setPhase('letterbox-out');
  }

  const titleVisible =
    phase === 'title' ||
    phase === 'subtitle' ||
    phase === 'epigraph' ||
    phase === 'hold' ||
    phase === 'letterbox-out';

  const subtitleVisible =
    phase === 'subtitle' ||
    phase === 'epigraph' ||
    phase === 'hold' ||
    phase === 'letterbox-out';

  const epigraphVisible =
    phase === 'epigraph' || phase === 'hold' || phase === 'letterbox-out';

  const lettersIn =
    phase === 'letterbox-in' ||
    phase === 'title' ||
    phase === 'subtitle' ||
    phase === 'epigraph' ||
    phase === 'hold';

  const lettersOut = phase === 'letterbox-out' || phase === 'done';

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={skip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Letterbox bars */}
          <motion.div
            className="absolute left-0 right-0 bg-[color:var(--color-chrome-deep)]"
            initial={{ top: -120, height: 100 }}
            animate={{
              top: lettersIn ? 0 : lettersOut ? -260 : -120,
              height: lettersIn ? 90 : lettersOut ? 260 : 100,
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            className="absolute left-0 right-0 bg-[color:var(--color-chrome-deep)]"
            initial={{ bottom: -120, height: 100 }}
            animate={{
              bottom: lettersIn ? 0 : lettersOut ? -260 : -120,
              height: lettersIn ? 90 : lettersOut ? 260 : 100,
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)',
            }}
          />

          {/* Center stage */}
          <div className="relative text-center px-10 max-w-3xl">
            <AnimatePresence>
              {titleVisible && (
                <motion.h1
                  key="title"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                  className="display-italic text-[clamp(72px,11vw,128px)] text-[color:var(--color-paper)] leading-[0.95]"
                >
                  Ribanje
                </motion.h1>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {subtitleVisible && (
                <motion.div
                  key="subtitle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="prose-body italic text-[18px] text-[color:var(--color-brass)] mt-7"
                >
                  ribanje i ribarsko prigovaranje
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {epigraphVisible && (
                <motion.div
                  key="epigraph"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="prose-body italic text-[13px] text-[color:var(--color-on-chrome-faint)] mt-4 tracking-wide"
                >
                  {HEKTOROVIC_EPIGRAPH.line}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 right-9 label-caps text-[color:var(--color-on-chrome-faint)]">
            click to skip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
