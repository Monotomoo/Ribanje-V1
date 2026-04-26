import { useState } from 'react';
import { Crosshair } from 'lucide-react';

interface Touchstone {
  id: string;
  label: string;
  director: string;
  year: number;
  /* Position in 0–100 space.
     X: naturalism (0) ↔ styled (100)
     Y: intimate (100) ↔ epic (0) — note: SVG y is inverted, we'll flip at render */
  x: number;
  y: number;
  /* Optional notes shown on hover */
  note?: string;
  isProject?: boolean;
}

const TOUCHSTONES: Touchstone[] = [
  /* Top-left quadrant — naturalism + epic */
  {
    id: 'leviathan',
    label: 'Leviathan',
    director: 'Castaing-Taylor & Paravel',
    year: 2012,
    x: 8,
    y: 32,
    note: 'GoPros on a New Bedford trawler. Pure observational, almost pre-language.',
  },
  {
    id: 'fire-at-sea',
    label: 'Fire at Sea',
    director: 'Rosi',
    year: 2016,
    x: 22,
    y: 48,
    note: 'Lampedusa fishing-island life intersecting with the migration crisis.',
  },
  {
    id: 'cave-of-forgotten',
    label: 'Cave of Forgotten Dreams',
    director: 'Herzog',
    year: 2010,
    x: 45,
    y: 25,
    note: 'Chauvet cave · subjective awe · Herzog\'s essayistic voice.',
  },
  /* Bottom-left — naturalism + intimate */
  {
    id: 'casa-de-lava',
    label: 'Casa de Lava',
    director: 'Costa',
    year: 1994,
    x: 18,
    y: 78,
    note: 'Cape Verde · slow · intimate · the body in landscape.',
  },
  {
    id: 'wind-will-carry',
    label: 'The Wind Will Carry Us',
    director: 'Kiarostami',
    year: 1999,
    x: 32,
    y: 70,
    note: 'Iranian village · patience · listening · gentle absurdism.',
  },
  /* Right side — more styled */
  {
    id: 'tabu',
    label: 'Tabu',
    director: 'Gomes',
    year: 2012,
    x: 72,
    y: 55,
    note: 'Mozambique chapter · 16mm · romantic styling · narrated memory.',
  },
  {
    id: 'encounters-end',
    label: 'Encounters at the End of the World',
    director: 'Herzog',
    year: 2007,
    x: 62,
    y: 35,
    note: 'Antarctica · Herzog\'s narration · awe + dry comedy.',
  },
  {
    id: 'baraka',
    label: 'Baraka',
    director: 'Fricke',
    year: 1992,
    x: 85,
    y: 18,
    note: 'Wordless · ritual · 70mm · most styled · the far edge.',
  },
  /* Centre — Croatian cultural touchstone */
  {
    id: 'sa-gunjcem',
    label: 'S a gunjcem',
    director: 'Croatian doc tradition · placeholder',
    year: 2018,
    x: 35,
    y: 60,
    note: 'Slot for relevant Croatian doc — Tomo to ratify with team.',
  },
  /* The project itself */
  {
    id: 'ribanje',
    label: 'Ribanje',
    director: '— this show —',
    year: 2026,
    x: 30,
    y: 55,
    note: 'Aimed between intimate-naturalism (Castaing-Taylor) and gentle-essayistic (Rosi · Kiarostami). Brass + paper · italic Fraunces · slow.',
    isProject: true,
  },
];

/* SVG dimensions */
const W = 760;
const H = 460;
const PAD_L = 56;
const PAD_R = 32;
const PAD_T = 32;
const PAD_B = 64;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;

/* Scale 0–100 to inner box */
function xFor(x: number) {
  return PAD_L + (x / 100) * INNER_W;
}
function yFor(y: number) {
  return PAD_T + (y / 100) * INNER_H;
}

export function TouchstoneGraph() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hovered = TOUCHSTONES.find((t) => t.id === hoverId);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <Crosshair size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Cinematic touchstones
          </h3>
        </div>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          where Ribanje sits in the doc landscape
        </span>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
          {/* Quadrant guides — soft cross at center */}
          <line
            x1={xFor(50)}
            x2={xFor(50)}
            y1={PAD_T}
            y2={PAD_T + INNER_H}
            stroke="rgba(14,30,54,0.08)"
            strokeWidth={0.5}
            strokeDasharray="2 4"
          />
          <line
            x1={PAD_L}
            x2={PAD_L + INNER_W}
            y1={yFor(50)}
            y2={yFor(50)}
            stroke="rgba(14,30,54,0.08)"
            strokeWidth={0.5}
            strokeDasharray="2 4"
          />

          {/* Bounding box */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={INNER_W}
            height={INNER_H}
            fill="none"
            stroke="rgba(14,30,54,0.15)"
            strokeWidth={0.5}
          />

          {/* Axis labels */}
          <text
            x={PAD_L}
            y={PAD_T + INNER_H + 22}
            fontFamily="Inter, sans-serif"
            fontSize={10}
            letterSpacing={1.2}
            fill="rgba(14,30,54,0.55)"
          >
            NATURALISM
          </text>
          <text
            x={PAD_L + INNER_W}
            y={PAD_T + INNER_H + 22}
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize={10}
            letterSpacing={1.2}
            fill="rgba(14,30,54,0.55)"
          >
            STYLED
          </text>
          <text
            x={PAD_L + INNER_W + 18}
            y={PAD_T + 8}
            fontFamily="Inter, sans-serif"
            fontSize={10}
            letterSpacing={1.2}
            fill="rgba(14,30,54,0.55)"
            transform={`rotate(90, ${PAD_L + INNER_W + 18}, ${PAD_T + 8})`}
          >
            EPIC
          </text>
          <text
            x={PAD_L - 12}
            y={PAD_T + INNER_H}
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize={10}
            letterSpacing={1.2}
            fill="rgba(14,30,54,0.55)"
            transform={`rotate(-90, ${PAD_L - 12}, ${PAD_T + INNER_H})`}
          >
            INTIMATE
          </text>

          {/* Quadrant labels (very faint) */}
          <text
            x={xFor(20)}
            y={yFor(15)}
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontStyle="italic"
            fontSize={10}
            fill="rgba(14,30,54,0.25)"
          >
            naturalist epics
          </text>
          <text
            x={xFor(80)}
            y={yFor(15)}
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontStyle="italic"
            fontSize={10}
            fill="rgba(14,30,54,0.25)"
          >
            styled vistas
          </text>
          <text
            x={xFor(20)}
            y={yFor(88)}
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontStyle="italic"
            fontSize={10}
            fill="rgba(14,30,54,0.25)"
          >
            quiet observations
          </text>
          <text
            x={xFor(80)}
            y={yFor(88)}
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontStyle="italic"
            fontSize={10}
            fill="rgba(14,30,54,0.25)"
          >
            authored portraits
          </text>

          {/* Plot dots */}
          {TOUCHSTONES.map((t) => {
            const cx = xFor(t.x);
            const cy = yFor(t.y);
            const isHovered = hoverId === t.id;
            return (
              <g
                key={t.id}
                onMouseEnter={() => setHoverId(t.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover halo */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={t.isProject ? 16 : 12}
                    fill="rgba(201,169,97,0.18)"
                  />
                )}
                {/* Dot — project gets the brass diamond, others get a small circle */}
                {t.isProject ? (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill="var(--color-brass)"
                      stroke="var(--color-on-paper)"
                      strokeWidth={1}
                    />
                    <circle cx={cx} cy={cy} r={2.5} fill="var(--color-on-paper)" />
                  </g>
                ) : (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="var(--color-on-paper)"
                    opacity={isHovered ? 1 : 0.65}
                  />
                )}
                {/* Label */}
                <text
                  x={cx + (t.isProject ? 12 : 8)}
                  y={cy + 4}
                  fontFamily="Fraunces, serif"
                  fontStyle="italic"
                  fontSize={t.isProject ? 14 : 11}
                  fontWeight={t.isProject ? 700 : 400}
                  fill={
                    t.isProject
                      ? 'var(--color-on-paper)'
                      : isHovered
                      ? 'var(--color-on-paper)'
                      : 'rgba(14,30,54,0.65)'
                  }
                >
                  {t.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover info bar */}
        <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)] min-h-[60px]">
          {hovered ? (
            <div>
              <div className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                {hovered.label}{' '}
                <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] ml-2 not-italic">
                  · {hovered.director} · {hovered.year}
                </span>
              </div>
              {hovered.note && (
                <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed max-w-[640px]">
                  {hovered.note}
                </p>
              )}
            </div>
          ) : (
            <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
              Hover over a dot to read the touchstone. The brass diamond marks where Ribanje
              aims — between intimate-naturalism and gentle-essayistic, with room to drift
              upward toward the epic in the open-Adriatic episodes.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
