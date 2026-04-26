import { useMemo } from 'react';
import { useApp } from '../../state/AppContext';

/* Verse-of-the-day — small italic strip at the top of Overview, above the hero.
   Pulls from the 6 episode Hektorović parallels in `episodeExtras` and rotates
   deterministically by day-of-year. Tomo can drop in real verses any time;
   the strip will pick those up automatically.

   `compact` mode renders a tight inline version for use inside TodayBrief. */
export function VerseOfTheDay({ compact = false }: { compact?: boolean } = {}) {
  const { state } = useApp();

  const pool = useMemo(() => {
    const out: { text: string; attribution: string }[] = [];
    const allEps = [...state.episodes, ...state.specials];
    for (const ep of allEps) {
      const ext = state.episodeExtras[ep.id];
      if (!ext) continue;
      /* Prefer real verses (CRO) when available; fall back to the modern parallel. */
      const cro = ext.hektorovicVerseCro?.trim();
      const eng = ext.hektorovicVerseEng?.trim();
      const parallel = ext.hektorovicParallel?.trim();
      const isRealVerse = cro && !cro.startsWith('[draft');
      const isRealEng = eng && !eng.startsWith('[working');
      if (isRealVerse) {
        out.push({
          text: cro,
          attribution: `Ep ${ep.number} · ${ep.title} · Hektorović 1568`,
        });
      } else if (isRealEng) {
        out.push({
          text: eng,
          attribution: `Ep ${ep.number} · ${ep.title} · working translation`,
        });
      } else if (parallel) {
        out.push({
          text: parallel,
          attribution: `Ep ${ep.number} · ${ep.title} · spine`,
        });
      }
    }
    /* Always append a closing fallback so we never render empty. */
    out.push({
      text: '— po Hektoroviću · ribanje i ribarsko prigovaranje',
      attribution: 'Hvar 1568 · the source',
    });
    return out;
  }, [state.episodes, state.specials, state.episodeExtras]);

  /* Day-of-year rotation, stable within a single day. */
  const idx = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear % Math.max(1, pool.length);
  }, [pool.length]);

  const verse = pool[idx];
  if (!verse) return null;

  if (compact) {
    return (
      <div aria-label="verse of the day">
        <div className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)] mb-1">
          verse · today
        </div>
        <p className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-[1.45]">
          {verse.text}
        </p>
        <p className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] mt-1.5 leading-tight">
          — {verse.attribution}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="verse of the day"
      className="text-center pt-2 pb-7"
    >
      <div
        className="display-italic text-[18px] text-[color:var(--color-brass)] mb-3.5"
        aria-hidden="true"
      >
        ✦
      </div>
      <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-[1.55] max-w-[640px] mx-auto">
        {verse.text}
      </p>
      <p className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] tracking-wide mt-3">
        — {verse.attribution}
      </p>
      <div className="mt-5 mx-auto w-12 h-px bg-[color:var(--color-border-brass)]" />
    </section>
  );
}
