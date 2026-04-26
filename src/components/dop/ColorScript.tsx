import { useState } from 'react';
import { Palette, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { ColorScriptStop } from '../../types';
import { EditableText } from '../primitives/EditableText';

const RUNTIME_MIN = 50; // Episode target runtime

/* Color script — per-episode timeline showing how the palette evolves
   across the runtime. Drop stops at runtime minutes with a hex colour;
   the bar between stops gradient-blends. */
export function ColorScript() {
  const { state, dispatch } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];
  const [activeEp, setActiveEp] = useState(allEpisodes[0]?.id ?? '');

  const stops = state.colorScriptStops
    .filter((s) => s.episodeId === activeEp)
    .sort((a, b) => a.runtimeMin - b.runtimeMin);

  function addStop() {
    /* Place new stop at the next reasonable interval. */
    const lastMin = stops.length > 0 ? stops[stops.length - 1].runtimeMin : 0;
    const nextMin = stops.length === 0 ? 0 : Math.min(RUNTIME_MIN, lastMin + 10);
    const stop: ColorScriptStop = {
      id: newId('cs'),
      episodeId: activeEp,
      runtimeMin: nextMin,
      color: '#0E1E36',
    };
    dispatch({ type: 'ADD_COLOR_SCRIPT_STOP', stop });
  }

  function patch(id: string, p: Partial<ColorScriptStop>) {
    dispatch({ type: 'UPDATE_COLOR_SCRIPT_STOP', id, patch: p });
  }

  /* Build CSS gradient string for the timeline ribbon */
  const gradientStops = stops.length === 0
    ? 'var(--color-paper-deep) 0%, var(--color-paper-deep) 100%'
    : stops
        .map((s) => `${s.color} ${(s.runtimeMin / RUNTIME_MIN) * 100}%`)
        .join(', ');

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <Palette size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Color script
          </h3>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            per episode · how the palette moves through the runtime
          </span>
        </div>
        <button
          type="button"
          onClick={addStop}
          disabled={!activeEp}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] disabled:opacity-30 px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add stop</span>
        </button>
      </header>

      {/* Episode tabs */}
      <nav className="flex items-baseline gap-1 flex-wrap mb-4">
        {allEpisodes.map((ep) => {
          const active = activeEp === ep.id;
          const epStopCount = state.colorScriptStops.filter(
            (s) => s.episodeId === ep.id
          ).length;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => setActiveEp(ep.id)}
              className={`px-3 py-1.5 rounded-[2px] transition-colors ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[14px]'
                    : 'font-sans text-[11px] tracking-[0.10em]'
                }
              >
                Ep {ep.number} · {ep.title}
              </span>
              {epStopCount > 0 && (
                <span className="ml-1.5 prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums">
                  {epStopCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Timeline ribbon */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-5">
        <div className="relative">
          {/* Gradient ribbon */}
          <div
            className="h-12 rounded-[3px] relative"
            style={{
              background: `linear-gradient(to right, ${gradientStops})`,
            }}
          >
            {/* Stop markers */}
            {stops.map((s) => {
              const xPct = (s.runtimeMin / RUNTIME_MIN) * 100;
              return (
                <div
                  key={s.id}
                  className="absolute top-0 bottom-0 group cursor-pointer"
                  style={{ left: `${xPct}%`, transform: 'translateX(-50%)' }}
                  title={s.label || `${s.runtimeMin}'`}
                >
                  <div
                    className="w-3 h-full bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-on-paper)] rounded-[1px]"
                    style={{ borderColor: s.color }}
                  />
                </div>
              );
            })}
          </div>
          {/* Runtime ticks */}
          <div className="flex items-baseline justify-between mt-1.5">
            {[0, 10, 20, 30, 40, RUNTIME_MIN].map((m) => (
              <span
                key={m}
                className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums"
              >
                {m}'
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stop list with editors */}
      {stops.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-4 leading-relaxed max-w-[600px]">
          Empty for this episode. Add stops at meaningful runtime moments (opening minute,
          first catch, sunset wide, closing) — each stop is a hex color that defines the
          dominant palette beat. The ribbon between stops blends as a gradient.
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {stops.map((s) => (
            <li
              key={s.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-2.5 grid grid-cols-[60px_60px_1fr_180px_28px] gap-3 items-baseline"
            >
              <input
                type="number"
                min={0}
                max={RUNTIME_MIN}
                value={s.runtimeMin}
                onChange={(e) =>
                  patch(s.id, { runtimeMin: parseInt(e.target.value, 10) || 0 })
                }
                className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
              />
              <input
                type="color"
                value={s.color}
                onChange={(e) => patch(s.id, { color: e.target.value })}
                className="w-10 h-7 rounded-[2px] border-[0.5px] border-[color:var(--color-border-paper-strong)] cursor-pointer"
              />
              <EditableText
                value={s.label ?? ''}
                onChange={(v) => patch(s.id, { label: v || undefined })}
                placeholder="moment label · 'first catch'"
                className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
              />
              <EditableText
                value={s.notes ?? ''}
                onChange={(v) => patch(s.id, { notes: v || undefined })}
                placeholder="why this color · what's on screen"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
              />
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete stop?')) {
                    dispatch({ type: 'DELETE_COLOR_SCRIPT_STOP', id: s.id });
                  }
                }}
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                aria-label="Delete stop"
              >
                <Trash2 size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
