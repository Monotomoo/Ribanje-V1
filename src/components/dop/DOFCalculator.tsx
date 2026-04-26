import { useMemo, useState } from 'react';
import { Aperture, Crosshair } from 'lucide-react';

/* DOF + focus calculator — pCAM equivalent.
   Subject distance bar with hyperfocal · near · far · DOF range overlay.
   Tom-grade math; circles-of-confusion per sensor format. */

interface SensorFormat {
  key: string;
  label: string;
  /* Circle of confusion in mm — standard approximations */
  coc: number;
  hint: string;
}

const SENSORS: SensorFormat[] = [
  { key: 's35',  label: 'Super 35 · Alexa 35',     coc: 0.025, hint: 'ARRI Alexa 35 / Mini · Cooke S4i territory' },
  { key: 'ff',   label: 'Full-frame · FX3',        coc: 0.030, hint: 'Sony FX3 · A7S · most full-frame digital' },
  { key: 'mft',  label: 'MFT · Inspire 3 X9-8K',   coc: 0.020, hint: 'DJI Inspire 3 X9-8K Air · Lumix GH' },
  { key: 'one',  label: '1" sensor · drone',       coc: 0.011, hint: 'DJI Mavic 3 Pro main · 1" pocket cams' },
  { key: 'gp',   label: '1/2.3" · GoPro / phone',  coc: 0.005, hint: 'GoPro Hero · iPhone main' },
];

const APERTURES = [
  { label: 'T1.4', value: 1.4 },
  { label: 'T2.0', value: 2.0 },
  { label: 'T2.8', value: 2.8 },
  { label: 'T4',   value: 4 },
  { label: 'T5.6', value: 5.6 },
  { label: 'T8',   value: 8 },
  { label: 'T11',  value: 11 },
  { label: 'T16',  value: 16 },
];

const FOCAL_PRESETS = [12, 18, 25, 32, 40, 50, 75, 85, 100, 135];

export function DOFCalculator() {
  const [sensorKey, setSensorKey] = useState('s35');
  const [focalMm, setFocalMm] = useState(32);
  const [aperture, setAperture] = useState(2.0);
  const [subjectM, setSubjectM] = useState(3);

  const sensor = SENSORS.find((s) => s.key === sensorKey) ?? SENSORS[0];

  const calc = useMemo(() => {
    /* All math in meters where possible. f in mm → convert. */
    const f = focalMm / 1000;          // meters
    const N = aperture;
    const c = sensor.coc / 1000;       // meters

    /* Hyperfocal distance H = f² / (N × c) + f  (meters) */
    const H = (f * f) / (N * c) + f;

    /* Subject distance s in meters */
    const s = Math.max(0.05, subjectM);

    /* Near and far focus distances */
    const Dn = (s * (H - f)) / (H + s - 2 * f);
    const isInfinity = s >= H;
    const Df = isInfinity ? Infinity : (s * (H - f)) / (H - s);
    const totalDof = isInfinity ? Infinity : Df - Dn;

    return {
      H,             // hyperfocal in meters
      Dn,            // near focus
      Df,            // far focus (or Infinity)
      totalDof,
      isInfinity,
      sensor,
    };
  }, [focalMm, aperture, subjectM, sensor]);

  /* Visual scale — the distance bar shows 0 → 30m by default, scaling to subject if needed */
  const barMaxM = Math.max(15, calc.Dn * 0.5 + 12, calc.isInfinity ? 30 : Math.min(50, calc.Df * 1.1 + 2));
  const W = 760;
  const H_BAR = 60;
  const padL = 30;
  const padR = 60;
  const innerW = W - padL - padR;

  function xFor(m: number) {
    return padL + Math.min(innerW, (m / barMaxM) * innerW);
  }
  const subjectX = xFor(subjectM);
  const nearX = xFor(calc.Dn);
  const farX = calc.isInfinity ? padL + innerW : xFor(calc.Df);

  return (
    <div className="space-y-7 max-w-[1200px]">
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <Crosshair size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div>
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            DOF + focus calculator
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            Sensor · focal length · aperture · subject distance →
            hyperfocal + near + far + total depth of field. The boat moves; this tells you
            the focus latitude you've got.
          </p>
        </div>
      </header>

      {/* Inputs */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <div className="grid grid-cols-2 gap-7 mb-5">
          {/* Sensor */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              Sensor
            </div>
            <select
              value={sensorKey}
              onChange={(e) => setSensorKey(e.target.value)}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[16px] text-[color:var(--color-on-paper)] py-1"
            >
              {SENSORS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
              {sensor.hint} · CoC {sensor.coc} mm
            </p>
          </div>

          {/* Focal length */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              Focal length · {focalMm}mm
            </div>
            <input
              type="range"
              min={12}
              max={200}
              step={1}
              value={focalMm}
              onChange={(e) => setFocalMm(parseInt(e.target.value, 10))}
              className="w-full accent-[color:var(--color-brass)]"
            />
            <div className="flex items-baseline justify-between mt-1.5">
              {FOCAL_PRESETS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFocalMm(f)}
                  className={`label-caps tracking-[0.10em] text-[10px] py-0.5 px-1 rounded-[2px] transition-colors ${
                    focalMm === f
                      ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                      : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          {/* Aperture */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              Aperture · T{aperture}
            </div>
            <div className="flex items-baseline gap-1">
              {APERTURES.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setAperture(a.value)}
                  className={`flex-1 label-caps tracking-[0.10em] text-[10px] py-1 rounded-[2px] transition-colors ${
                    aperture === a.value
                      ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                      : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)] border-[0.5px] border-[color:var(--color-border-paper)]'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-2">
              Wider aperture (T1.4) = thinner DOF. Stop down (T8+) for landscape coverage.
            </p>
          </div>

          {/* Subject distance */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              Subject distance ·{' '}
              {subjectM < 1 ? `${(subjectM * 100).toFixed(0)} cm` : `${subjectM.toFixed(2)} m`}
            </div>
            <input
              type="range"
              min={0.3}
              max={30}
              step={0.1}
              value={subjectM}
              onChange={(e) => setSubjectM(parseFloat(e.target.value))}
              className="w-full accent-[color:var(--color-brass)]"
            />
            <div className="flex items-baseline justify-between mt-1.5">
              {[0.5, 1, 2, 3, 5, 10, 20, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSubjectM(d)}
                  className={`label-caps tracking-[0.10em] text-[10px] py-0.5 px-1 rounded-[2px] transition-colors ${
                    Math.abs(subjectM - d) < 0.01
                      ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                      : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Output stats */}
      <section className="grid grid-cols-4 gap-4">
        <Stat label="Near focus" value={fmtDist(calc.Dn)} sub={`${(subjectM - calc.Dn).toFixed(2)} m in front`} />
        <Stat label="Far focus" value={calc.isInfinity ? '∞' : fmtDist(calc.Df)} sub={calc.isInfinity ? 'past hyperfocal' : `${(calc.Df - subjectM).toFixed(2)} m behind`} />
        <Stat label="Total DOF" value={calc.isInfinity ? '∞' : fmtDist(calc.totalDof)} sub={dofVerdict(calc.totalDof, calc.isInfinity)} tone={dofTone(calc.totalDof, calc.isInfinity)} />
        <Stat label="Hyperfocal" value={fmtDist(calc.H)} sub="focus here for ∞ depth" />
      </section>

      {/* Distance bar visualization */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-5">
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            Focus latitude
          </h4>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
            scale 0 → {barMaxM.toFixed(1)} m
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H_BAR + 36}`} className="w-full" style={{ maxHeight: 120 }}>
          {/* Horizontal axis line */}
          <line
            x1={padL}
            x2={padL + innerW}
            y1={H_BAR / 2 + 6}
            y2={H_BAR / 2 + 6}
            stroke="rgba(14,30,54,0.15)"
            strokeWidth={0.5}
          />
          {/* DOF range band */}
          <rect
            x={nearX}
            y={H_BAR / 2 + 6 - 14}
            width={Math.max(2, farX - nearX)}
            height={28}
            fill="var(--color-brass)"
            opacity={0.18}
            rx={2}
          />
          <rect
            x={nearX}
            y={H_BAR / 2 + 6 - 14}
            width={Math.max(2, farX - nearX)}
            height={28}
            fill="none"
            stroke="var(--color-brass)"
            strokeWidth={0.5}
            rx={2}
          />
          {/* Near marker */}
          <line
            x1={nearX}
            x2={nearX}
            y1={H_BAR / 2 + 6 - 18}
            y2={H_BAR / 2 + 6 + 18}
            stroke="var(--color-brass-deep)"
            strokeWidth={1.2}
          />
          {/* Far marker */}
          <line
            x1={farX}
            x2={farX}
            y1={H_BAR / 2 + 6 - 18}
            y2={H_BAR / 2 + 6 + 18}
            stroke="var(--color-brass-deep)"
            strokeWidth={1.2}
          />
          {/* Subject pin */}
          <circle cx={subjectX} cy={H_BAR / 2 + 6} r={6} fill="var(--color-on-paper)" />
          <circle cx={subjectX} cy={H_BAR / 2 + 6} r={2} fill="var(--color-paper-card)" />
          {/* Subject label */}
          <text
            x={subjectX}
            y={H_BAR / 2 + 6 - 24}
            textAnchor="middle"
            fontFamily="Fraunces, serif"
            fontStyle="italic"
            fontSize={11}
            fill="var(--color-on-paper)"
          >
            subject {fmtDist(subjectM)}
          </text>
          {/* Near + far labels */}
          <text
            x={nearX}
            y={H_BAR + 26}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize={10}
            letterSpacing={1}
            fill="var(--color-brass-deep)"
          >
            {fmtDist(calc.Dn)}
          </text>
          {!calc.isInfinity && (
            <text
              x={farX}
              y={H_BAR + 26}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize={10}
              letterSpacing={1}
              fill="var(--color-brass-deep)"
            >
              {fmtDist(calc.Df)}
            </text>
          )}
          {calc.isInfinity && (
            <text
              x={padL + innerW}
              y={H_BAR + 26}
              textAnchor="end"
              fontFamily="Inter, sans-serif"
              fontSize={10}
              letterSpacing={1}
              fill="var(--color-brass-deep)"
            >
              ∞
            </text>
          )}
          {/* Tick marks */}
          {[0, 1, 2, 3, 5, 10, 20].filter((t) => t <= barMaxM).map((t) => (
            <g key={t}>
              <line
                x1={xFor(t)}
                x2={xFor(t)}
                y1={H_BAR / 2 + 6 + 4}
                y2={H_BAR / 2 + 6 + 8}
                stroke="rgba(14,30,54,0.3)"
                strokeWidth={0.5}
              />
              <text
                x={xFor(t)}
                y={H_BAR + 8}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize={9}
                fill="rgba(14,30,54,0.5)"
              >
                {t}m
              </text>
            </g>
          ))}
        </svg>
      </section>

      {/* Practical guidance card */}
      <section className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-6 py-4 max-w-[800px]">
        <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
          Boat-doc focus advice
        </div>
        <ul className="space-y-1.5 prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
          <li>
            Boat moves a lot. Your subject distance shifts ±0.5m without warning. If your DOF is
            tighter than 0.5m, you'll miss the focus most takes — open up or step back.
          </li>
          <li>
            For falkuša-on-bow shots, set focus at hyperfocal · everything past it stays sharp.
            Useful for unrehearsed action.
          </li>
          <li>
            Cooke S4i 32mm at T2.8 from 3m gives ~0.6m DOF on Alexa 35 — workable for two faces in
            frame.
          </li>
          <li>
            For elder interviews on 85mm, you want isolation — open to T2.0, subject 2m → razor-thin
            DOF, but the boat is anchored so it holds.
          </li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- helpers ---------- */

function fmtDist(m: number): string {
  if (!isFinite(m)) return '∞';
  if (m < 1) return `${(m * 100).toFixed(0)} cm`;
  if (m < 10) return `${m.toFixed(2)} m`;
  return `${m.toFixed(1)} m`;
}

function dofVerdict(dof: number, isInf: boolean): string {
  if (isInf) return 'past hyperfocal · all in';
  if (dof < 0.1) return 'razor-thin · breathing-distance only';
  if (dof < 0.5) return 'tight · choreographed only';
  if (dof < 1.5) return 'workable · two faces';
  if (dof < 5) return 'comfortable';
  return 'wide · landscape latitude';
}

function dofTone(dof: number, isInf: boolean): 'success' | 'warn' | 'coral' | undefined {
  if (isInf) return 'success';
  if (dof < 0.3) return 'coral';
  if (dof < 1) return 'warn';
  return 'success';
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'success' | 'warn' | 'coral';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'warn'
      ? 'text-[color:var(--color-warn)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">{label}</div>
      <div className={`display-italic text-[24px] tabular-nums leading-none ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1 leading-tight">
          {sub}
        </div>
      )}
    </div>
  );
}

/* unused-import suppressor */
export const _icons = { Aperture };
