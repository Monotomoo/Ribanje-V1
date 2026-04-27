import { useMemo, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { DOPKitItem } from '../../types';

/* Lens character matrix — 2D scatter plot mapping lenses by warmth × sharpness.
   Tom's lens vocabulary made visual. Pick a mood region → see the lens
   neighborhood. Per-lens character is editable inline.
   Pre-fills sensible defaults for common lenses if numerics aren't set. */

interface MoodRegion {
  label: string;
  warmthMin: number;
  warmthMax: number;
  sharpMin: number;
  sharpMax: number;
  use: string;
  tone: string;
}

const MOOD_REGIONS: MoodRegion[] = [
  {
    label: 'Vintage portrait',
    warmthMin: 1,
    warmthMax: 5,
    sharpMin: 0,
    sharpMax: 5,
    use: 'Elder interviews · skin · candlelight · the soft falloff',
    tone: '#A8884A',
  },
  {
    label: 'Classical drama',
    warmthMin: 1,
    warmthMax: 5,
    sharpMin: 5,
    sharpMax: 10,
    use: 'Establishing wides · golden hour · deck action with weight',
    tone: '#C9A961',
  },
  {
    label: 'Dreamy / ethereal',
    warmthMin: -5,
    warmthMax: 1,
    sharpMin: 0,
    sharpMax: 5,
    use: 'Hektorović verse fragments · dream slow-mo · underwater',
    tone: '#788064',
  },
  {
    label: 'Modern / clinical',
    warmthMin: -5,
    warmthMax: 1,
    sharpMin: 5,
    sharpMax: 10,
    use: 'Drone establishing · bright daylight · technical inserts',
    tone: '#5BA3CC',
  },
];

/* Sensible defaults for common lenses based on real-world reputation.
   Tom can override per-lens. */
function defaultCharacter(label: string): {
  warmth: number;
  sharpness: number;
  contrast: number;
} {
  const l = label.toLowerCase();
  /* Cooke S4i — warm, soft falloff, "Cooke look" */
  if (l.includes('cooke') && l.includes('s4')) return { warmth: 3.5, sharpness: 5.5, contrast: 6 };
  /* Atlas Orion anamorphic — neutral-cool, modern, sharp */
  if (l.includes('atlas') || l.includes('orion')) return { warmth: -1, sharpness: 7.5, contrast: 7 };
  /* Zeiss Master Prime — cool, clinical, very sharp */
  if (l.includes('master') && l.includes('prime')) return { warmth: -2, sharpness: 9, contrast: 8 };
  /* Zeiss Supreme — modern, neutral */
  if (l.includes('supreme')) return { warmth: 0, sharpness: 8, contrast: 7 };
  /* Sigma Cine — sharp, neutral */
  if (l.includes('sigma') && l.includes('cine')) return { warmth: 0, sharpness: 8.5, contrast: 7.5 };
  /* Canon CN-E — neutral warm, broadcast-ish */
  if (l.includes('canon') && l.includes('cn-e')) return { warmth: 1, sharpness: 6.5, contrast: 6.5 };
  /* Sony G-Master — modern sharp */
  if (l.includes('g master') || l.includes('g-master') || l.includes('gm')) return { warmth: 0, sharpness: 8, contrast: 7 };
  /* Tokina Vista — modern, sharp */
  if (l.includes('vista')) return { warmth: -0.5, sharpness: 7, contrast: 7 };
  /* Vintage Lomo / Russian — warm, soft */
  if (l.includes('lomo') || l.includes('russian')) return { warmth: 4, sharpness: 4, contrast: 5 };
  /* DZO/Vespid — modern budget, neutral */
  if (l.includes('vespid') || l.includes('dzo')) return { warmth: 0.5, sharpness: 7, contrast: 7 };
  /* default */
  return { warmth: 0, sharpness: 6, contrast: 6 };
}

const VIEW_W = 600;
const VIEW_H = 460;
const PAD_L = 50;
const PAD_R = 30;
const PAD_T = 30;
const PAD_B = 50;
const PLOT_W = VIEW_W - PAD_L - PAD_R;
const PLOT_H = VIEW_H - PAD_T - PAD_B;

function xFor(warmth: number) {
  /* warmth -5..5 → PAD_L..(PAD_L + PLOT_W) */
  return PAD_L + ((warmth + 5) / 10) * PLOT_W;
}
function yFor(sharpness: number) {
  /* sharpness 0..10 → (PAD_T + PLOT_H)..PAD_T (inverted, sharper = top) */
  return PAD_T + PLOT_H - (sharpness / 10) * PLOT_H;
}

export function LensCharacterMatrix() {
  const { state, dispatch } = useApp();
  const lenses = state.dopKit.filter((k) => k.category === 'lens');
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);

  /* Resolve characteristics — fall back to defaults if numerics not set */
  const lensesWithChar = useMemo(
    () =>
      lenses.map((l) => {
        const def = defaultCharacter(l.label);
        return {
          lens: l,
          warmth: l.lensWarmth ?? def.warmth,
          sharpness: l.lensSharpness ?? def.sharpness,
          contrast: l.lensContrast ?? def.contrast,
        };
      }),
    [lenses]
  );

  function patch(id: string, p: Partial<DOPKitItem>) {
    dispatch({ type: 'UPDATE_DOP_KIT', id, patch: p });
  }

  if (lenses.length === 0) {
    return (
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No lenses in kit yet — add some on the Kit tab to map them here.
      </p>
    );
  }

  const selectedLens = lensesWithChar.find((l) => l.lens.id === selectedLensId);

  return (
    <div className="space-y-7">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
          <Crosshair size={16} className="text-[color:var(--color-brass-deep)]" />
          Lens character matrix
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Warmth (cool ← → warm) × Sharpness (soft ↓ painterly · sharp ↑ clinical).
          Tom's vocabulary mapped. Click a mood quadrant for the lens neighborhood.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 md:gap-6">
        {/* SVG matrix */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full">
            {/* Quadrant tints */}
            {MOOD_REGIONS.map((m) => {
              const x1 = xFor(m.warmthMin);
              const x2 = xFor(m.warmthMax);
              const y1 = yFor(m.sharpMax);
              const y2 = yFor(m.sharpMin);
              const isHi = highlightedRegion === m.label;
              return (
                <g key={m.label}>
                  <rect
                    x={x1}
                    y={y1}
                    width={x2 - x1}
                    height={y2 - y1}
                    fill={`${m.tone}${isHi ? '30' : '10'}`}
                    stroke={isHi ? m.tone : 'transparent'}
                    strokeWidth={1}
                    style={{ cursor: 'pointer', transition: 'fill 200ms' }}
                    onClick={() =>
                      setHighlightedRegion(
                        highlightedRegion === m.label ? null : m.label
                      )
                    }
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="var(--font-sans)"
                    letterSpacing="0.10em"
                    fill={m.tone}
                    style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}

            {/* Center axes */}
            <line
              x1={xFor(0)}
              y1={PAD_T}
              x2={xFor(0)}
              y2={PAD_T + PLOT_H}
              stroke="rgba(14,30,54,0.20)"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <line
              x1={PAD_L}
              y1={yFor(5)}
              x2={PAD_L + PLOT_W}
              y2={yFor(5)}
              stroke="rgba(14,30,54,0.20)"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />

            {/* Outer border */}
            <rect
              x={PAD_L}
              y={PAD_T}
              width={PLOT_W}
              height={PLOT_H}
              fill="none"
              stroke="rgba(14,30,54,0.30)"
              strokeWidth={0.75}
            />

            {/* Axis labels */}
            <text
              x={PAD_L - 8}
              y={yFor(10) + 4}
              textAnchor="end"
              fontSize={9}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.55)"
            >
              CLINICAL
            </text>
            <text
              x={PAD_L - 8}
              y={yFor(0) + 4}
              textAnchor="end"
              fontSize={9}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.55)"
            >
              SOFT
            </text>
            <text
              x={xFor(-5)}
              y={VIEW_H - 16}
              textAnchor="start"
              fontSize={9}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.55)"
            >
              COOL
            </text>
            <text
              x={xFor(5)}
              y={VIEW_H - 16}
              textAnchor="end"
              fontSize={9}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.55)"
            >
              WARM
            </text>

            {/* Lens dots */}
            {lensesWithChar.map(({ lens, warmth, sharpness, contrast }) => {
              const x = xFor(warmth);
              const y = yFor(sharpness);
              const isSelected = selectedLensId === lens.id;
              const inRegion =
                highlightedRegion &&
                MOOD_REGIONS.find((m) => m.label === highlightedRegion);
              const inThisRegion =
                inRegion &&
                warmth >= inRegion.warmthMin &&
                warmth <= inRegion.warmthMax &&
                sharpness >= inRegion.sharpMin &&
                sharpness <= inRegion.sharpMax;
              const dim =
                highlightedRegion && !inThisRegion ? 'opacity-30' : 'opacity-100';
              const dotR = 5 + contrast * 0.4;
              return (
                <g
                  key={lens.id}
                  className={`cursor-pointer transition-opacity ${dim}`}
                  onClick={() => setSelectedLensId(lens.id === selectedLensId ? null : lens.id)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={dotR}
                    fill={isSelected ? 'var(--color-brass)' : 'rgba(14,30,54,0.65)'}
                    stroke="var(--color-paper-light)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={x + dotR + 4}
                    y={y + 3}
                    fontSize={10}
                    fontFamily="var(--font-spectral)"
                    fontStyle="italic"
                    fill="rgba(14,30,54,0.85)"
                  >
                    {lens.label.length > 22 ? lens.label.slice(0, 22) + '…' : lens.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side rail — selected lens detail or region detail */}
        <aside className="space-y-4">
          {highlightedRegion && (
            <div
              className="bg-[color:var(--color-paper-light)] border-l-2 px-4 py-3"
              style={{
                borderColor: MOOD_REGIONS.find((m) => m.label === highlightedRegion)?.tone,
              }}
            >
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                mood region
              </div>
              <div className="display-italic text-[16px] text-[color:var(--color-on-paper)] mb-1">
                {highlightedRegion}
              </div>
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
                {MOOD_REGIONS.find((m) => m.label === highlightedRegion)?.use}
              </p>
            </div>
          )}

          {selectedLens ? (
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-brass)]/60 rounded-[3px] px-4 py-4 space-y-3">
              <div>
                <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                  selected lens
                </div>
                <div className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight">
                  {selectedLens.lens.label}
                </div>
              </div>

              <CharSlider
                label="Warmth"
                value={selectedLens.warmth}
                min={-5}
                max={5}
                step={0.5}
                leftLabel="cool"
                rightLabel="warm"
                onChange={(v) => patch(selectedLens.lens.id, { lensWarmth: v })}
              />
              <CharSlider
                label="Sharpness"
                value={selectedLens.sharpness}
                min={0}
                max={10}
                step={0.5}
                leftLabel="soft"
                rightLabel="clinical"
                onChange={(v) => patch(selectedLens.lens.id, { lensSharpness: v })}
              />
              <CharSlider
                label="Contrast"
                value={selectedLens.contrast}
                min={0}
                max={10}
                step={0.5}
                leftLabel="low"
                rightLabel="high"
                onChange={(v) => patch(selectedLens.lens.id, { lensContrast: v })}
              />

              {selectedLens.lens.characterNotes && (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)] leading-relaxed">
                  {selectedLens.lens.characterNotes}
                </p>
              )}
            </div>
          ) : (
            <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-6">
              Click a lens dot to edit its character.
              Click a mood quadrant to highlight the lens neighborhood.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function CharSlider({
  label,
  value,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  leftLabel: string;
  rightLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label-caps text-[color:var(--color-brass-deep)]">{label}</span>
        <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
