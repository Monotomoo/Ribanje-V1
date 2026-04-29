import { useState } from 'react';
import { Anchor, Ruler } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { BottomType } from '../../types';

/* ---------- AnchorHoldingTab (Phase 15) ----------
   Per-anchorage anchor holding profile. Editable inline:
     • Bottom type (sand · rock · grass · mud · gravel · mixed)
     • Depth range (min-max meters)
     • Swing room (radius for the boat as it pivots)
     • Free-form ground tackle notes
*/

const BOTTOM_TYPES: BottomType[] = [
  'pijesak',
  'blato',
  'pijesak',
  'stijena',
  'trava',
  'šljunak',
  'mješovito',
];

const BOTTOM_OPTIONS: BottomType[] = [
  'pijesak',
  'blato',
  'stijena',
  'trava',
  'šljunak',
  'mješovito',
];

const BOTTOM_TONE: Record<BottomType, string> = {
  pijesak:    'var(--color-brass)',
  blato:      'var(--color-success)',
  stijena:    'var(--color-coral-deep)',
  trava:      'var(--color-coral-deep)',
  šljunak:    'var(--color-on-paper-muted)',
  mješovito:  'var(--color-on-paper)',
};

export function AnchorHoldingTab() {
  const { state, dispatch } = useApp();
  const t = useT();
  const [locationId, setLocationId] = useState<string>(state.locations[0]?.id ?? '');
  const location = state.locations.find((l) => l.id === locationId);

  function patch(p: Partial<typeof location>) {
    if (!location) return;
    dispatch({ type: 'UPDATE_LOCATION', id: location.id, patch: p as never });
  }

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('bridge.anchor.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('bridge.anchor.subtitle')}
        </p>
      </header>

      <label>
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
          {t('bridge.wind.pick')}
        </div>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] min-w-[220px]"
        >
          {state.locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      {!location ? (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] py-12 text-center border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          —
        </div>
      ) : (
        <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-5">
          <header className="flex items-baseline justify-between mb-4">
            <div>
              <h4 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
                {location.label}
              </h4>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums mt-0.5">
                {location.lat.toFixed(3)}°N · {location.lng.toFixed(3)}°E
              </div>
            </div>
            <Anchor size={16} className="text-[color:var(--color-brass-deep)]" />
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bottom type */}
            <div>
              <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2">
                {t('bridge.anchor.bottom.type')}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {BOTTOM_OPTIONS.map((b) => {
                  const active = location.bottomType === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => patch({ bottomType: b })}
                      className={`text-left px-2 py-1.5 rounded-[3px] border-[0.5px] transition-colors ${
                        active
                          ? 'border-[color:var(--color-brass)]'
                          : 'border-[color:var(--color-border-paper)] hover:border-[color:var(--color-on-paper-muted)]'
                      }`}
                      style={{
                        background: active
                          ? `color-mix(in oklab, ${BOTTOM_TONE[b]} 15%, transparent)`
                          : 'var(--color-paper)',
                      }}
                    >
                      <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                        {b}
                      </div>
                      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                        {t(`bridge.anchor.bottom.${b}` as never)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Depth + swing */}
            <div className="space-y-4">
              <div>
                <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2">
                  <Ruler size={10} className="inline -mt-0.5 mr-1" />
                  {t('bridge.anchor.depth')}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="min"
                    value={location.anchorDepthRangeM?.min ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value);
                      patch({
                        anchorDepthRangeM: {
                          min: v ?? 0,
                          max: location.anchorDepthRangeM?.max ?? 0,
                        },
                      });
                    }}
                    className="w-20 px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                  />
                  <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">→</span>
                  <input
                    type="number"
                    placeholder="max"
                    value={location.anchorDepthRangeM?.max ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value);
                      patch({
                        anchorDepthRangeM: {
                          min: location.anchorDepthRangeM?.min ?? 0,
                          max: v ?? 0,
                        },
                      });
                    }}
                    className="w-20 px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                  />
                  <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">m</span>
                </div>
              </div>

              <div>
                <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2">
                  {t('bridge.anchor.swing')}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={location.swingRoomM ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value);
                      patch({ swingRoomM: v });
                    }}
                    className="w-24 px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                  />
                  <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">m radius</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2">
              {t('bridge.anchor.tackle')}
            </div>
            <textarea
              value={location.groundTackleNotes ?? ''}
              onChange={(e) => patch({ groundTackleNotes: e.target.value || undefined })}
              rows={3}
              placeholder="e.g. Bruce 25kg + 50m chain · 5:1 scope · backup CQR · watch for weed"
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] resize-none"
            />
          </div>

          {!location.bottomType && !location.groundTackleNotes && !location.anchorDepthRangeM && (
            <div className="mt-4 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
              {t('bridge.anchor.no.data')}
            </div>
          )}
        </article>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { BOTTOM_TYPES };
/* eslint-enable @typescript-eslint/no-unused-vars */
