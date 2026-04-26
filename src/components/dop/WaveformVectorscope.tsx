import { useRef, useState } from 'react';
import { Activity, Image as ImageIcon, Upload, X } from 'lucide-react';

/* Waveform + Vectorscope simulator — DP power tool. Drop a still, the
   tool extracts pixel data via canvas, computes:
   - Luma waveform (per X-pixel column → average luma 0–100 IRE)
   - Vectorscope (chroma vector polar plot, with skin-tone line at ~123°)

   Pure UI — no state in the app. Reads pixels client-side, renders SVG. */

interface ScopeData {
  imageUrl: string;
  width: number;
  height: number;
  /* Per-column avg luma 0–100 */
  waveform: number[];
  /* Chroma points binned in polar histogram: 36 bins × 10 radius bins */
  vectorscope: number[][];
  /* Stats */
  lumaMin: number;
  lumaMax: number;
  lumaMean: number;
  dominantHueDeg: number;
}

const WAVEFORM_W = 480;
const WAVEFORM_H = 200;
const VEC_SIZE = 280;
const VEC_RADIUS = 130;

function rgbToYUV(r: number, g: number, b: number): { y: number; u: number; v: number } {
  /* BT.709 */
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const u = (b - y) * 0.5389 + 128;
  const v = (r - y) * 0.6350 + 128;
  return { y, u, v };
}

function analyzeImage(img: HTMLImageElement): ScopeData {
  /* Downsample to ~480 wide for speed */
  const targetW = 480;
  const ratio = targetW / img.width;
  const w = targetW;
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  /* Per-column avg luma */
  const waveform: number[] = new Array(w).fill(0);
  const colCounts: number[] = new Array(w).fill(0);

  /* Vectorscope: 36 angle bins × 10 radius bins */
  const vec: number[][] = Array(36)
    .fill(null)
    .map(() => Array(10).fill(0));

  let lumaMin = 255;
  let lumaMax = 0;
  let lumaSum = 0;
  let lumaCount = 0;

  /* Hue accumulator for dominant */
  const hueAccum: number[] = new Array(36).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const { y: lumY, u, v } = rgbToYUV(r, g, b);
      waveform[x] += lumY;
      colCounts[x]++;

      lumaSum += lumY;
      lumaCount++;
      if (lumY < lumaMin) lumaMin = lumY;
      if (lumY > lumaMax) lumaMax = lumY;

      /* Vectorscope: u/v centered at 128, scale to radius */
      const du = u - 128;
      const dv = v - 128;
      const angle = (Math.atan2(dv, du) * 180) / Math.PI; // -180..180
      const angleNorm = (angle + 360) % 360; // 0..360
      const radius = Math.min(Math.sqrt(du * du + dv * dv) / 12, 9.99); // 0..10
      const angleBin = Math.floor(angleNorm / 10) % 36;
      const radiusBin = Math.floor(radius);
      vec[angleBin][radiusBin]++;

      /* Only count pixels with meaningful chroma for hue dominance */
      if (radius > 2) {
        hueAccum[angleBin] += radius;
      }
    }
  }

  /* Average waveform per column → 0–100 IRE */
  const wf = waveform.map((sum, i) =>
    colCounts[i] === 0 ? 0 : (sum / colCounts[i]) * (100 / 255)
  );

  /* Find dominant hue */
  let maxHueBin = 0;
  let maxHueValue = 0;
  for (let i = 0; i < 36; i++) {
    if (hueAccum[i] > maxHueValue) {
      maxHueValue = hueAccum[i];
      maxHueBin = i;
    }
  }
  const dominantHueDeg = maxHueBin * 10 + 5;

  return {
    imageUrl: canvas.toDataURL('image/jpeg', 0.7),
    width: w,
    height: h,
    waveform: wf,
    vectorscope: vec,
    lumaMin: (lumaMin / 255) * 100,
    lumaMax: (lumaMax / 255) * 100,
    lumaMean: (lumaSum / lumaCount / 255) * 100,
    dominantHueDeg,
  };
}

export function WaveformVectorscope() {
  const [scope, setScope] = useState<ScopeData | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const data = analyzeImage(img);
          setScope(data);
        } catch (err) {
          console.error('Scope analysis failed', err);
        }
        setBusy(false);
      };
      img.onerror = () => setBusy(false);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function clear() {
    setScope(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Activity size={16} className="text-[color:var(--color-brass-deep)]" />
            Waveform &amp; vectorscope
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Drop a still — luma distribution + chroma vector plot. The DP power tool.
          </p>
        </div>
        {scope && (
          <button
            type="button"
            onClick={clear}
            className="flex items-baseline gap-1 label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)]"
          >
            <X size={11} />
            clear
          </button>
        )}
      </header>

      {!scope ? (
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
          <ImageIcon
            size={28}
            className="mx-auto text-[color:var(--color-on-paper-faint)] mb-3"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
            id="scope-upload"
          />
          <label
            htmlFor="scope-upload"
            className="inline-flex items-baseline gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] cursor-pointer transition-colors"
          >
            <Upload size={11} />
            upload still
          </label>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed">
            JPG/PNG · best with a frame from your show — sees luma + chroma exactly as
            broadcast scopes would.
          </p>
          {busy && (
            <p className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] mt-2">
              analyzing…
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image preview + stats */}
          <div className="grid grid-cols-[1fr_240px] gap-4">
            <img
              src={scope.imageUrl}
              alt="Source"
              className="w-full rounded-[3px] border-[0.5px] border-[color:var(--color-border-paper)]"
            />
            <div className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-4 py-3 space-y-2">
              <Stat
                label="Luma range"
                value={`${scope.lumaMin.toFixed(0)} – ${scope.lumaMax.toFixed(0)} IRE`}
                tone={
                  scope.lumaMax > 100
                    ? 'coral'
                    : scope.lumaMin < 0
                    ? 'coral'
                    : 'success'
                }
              />
              <Stat
                label="Luma mean"
                value={`${scope.lumaMean.toFixed(0)} IRE`}
              />
              <Stat
                label="Dominant hue"
                value={`${scope.dominantHueDeg.toFixed(0)}°`}
                sub={describeHue(scope.dominantHueDeg)}
              />
              <Stat
                label="Broadcast safe"
                value={
                  scope.lumaMax <= 100 && scope.lumaMin >= 0 ? '✓ within' : '✗ clipping'
                }
                tone={
                  scope.lumaMax <= 100 && scope.lumaMin >= 0 ? 'success' : 'coral'
                }
              />
            </div>
          </div>

          {/* Scopes */}
          <div className="grid grid-cols-[1fr_320px] gap-4">
            {/* Waveform */}
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
                waveform · luma
              </div>
              <Waveform data={scope.waveform} />
            </div>
            {/* Vectorscope */}
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
                vectorscope · chroma
              </div>
              <Vectorscope data={scope.vectorscope} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
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
  tone?: 'success' | 'coral';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div>
      <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-0.5">
        {label}
      </div>
      <div className={`display-italic text-[15px] tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
          {sub}
        </div>
      )}
    </div>
  );
}

function Waveform({ data }: { data: number[] }) {
  const W = WAVEFORM_W;
  const H = WAVEFORM_H;
  const padL = 30;
  const padB = 18;
  const innerW = W - padL - 8;
  const innerH = H - padB - 8;
  /* X axis: pixel column 0..n; Y: 0–100 IRE */
  const xFor = (i: number) => padL + (i / data.length) * innerW;
  const yFor = (luma: number) => 8 + innerH - (luma / 100) * innerH;
  const path = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ background: '#0E1E36' }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((ire) => (
        <g key={ire}>
          <line
            x1={padL}
            y1={yFor(ire)}
            x2={padL + innerW}
            y2={yFor(ire)}
            stroke={
              ire === 100 || ire === 0
                ? 'rgba(194,106,74,0.45)'
                : 'rgba(244,241,234,0.10)'
            }
            strokeWidth={0.5}
            strokeDasharray={ire === 100 || ire === 0 ? undefined : '2 4'}
          />
          <text
            x={padL - 6}
            y={yFor(ire) + 3}
            textAnchor="end"
            fontSize={9}
            fontFamily="var(--font-sans)"
            fill="rgba(244,241,234,0.45)"
          >
            {ire}
          </text>
        </g>
      ))}
      {/* Broadcast safe zone tint */}
      <rect
        x={padL}
        y={yFor(100)}
        width={innerW}
        height={yFor(7.5) - yFor(100)}
        fill="rgba(107,144,128,0.06)"
      />
      {/* Waveform path */}
      <path d={path} stroke="rgba(201,169,97,0.85)" strokeWidth={1} fill="none" />
      {/* X label */}
      <text
        x={padL + innerW / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize={8}
        fontFamily="var(--font-sans)"
        letterSpacing="0.10em"
        fill="rgba(244,241,234,0.45)"
      >
        PIXEL COLUMN →
      </text>
    </svg>
  );
}

function Vectorscope({ data }: { data: number[][] }) {
  const cx = VEC_SIZE / 2;
  const cy = VEC_SIZE / 2;
  const R = VEC_RADIUS;

  /* Find max bin for normalization */
  let maxCount = 0;
  for (const row of data) {
    for (const v of row) {
      if (v > maxCount) maxCount = v;
    }
  }

  /* Standard target boxes for Rec.709 primary colors at 75% saturation.
     Approximate angles (Rec.709 vectorscope): R 103°, Y 167°, G 240°, C 283°, B 347°, M 60° */
  const targets = [
    { label: 'R', angle: 103, color: '#C26A4A' },
    { label: 'Y', angle: 167, color: '#C9A961' },
    { label: 'G', angle: 240, color: '#788064' },
    { label: 'C', angle: 283, color: '#5BA3CC' },
    { label: 'B', angle: 347, color: '#3D7FA0' },
    { label: 'M', angle: 60, color: '#876B4A' },
  ];

  const SKIN_TONE_DEG = 123; // typical I-line for skin tones

  return (
    <svg viewBox={`0 0 ${VEC_SIZE} ${VEC_SIZE}`} className="w-full" style={{ background: '#0E1E36' }}>
      {/* Outer circle */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(244,241,234,0.20)"
        strokeWidth={0.75}
      />
      {/* Inner saturation rings */}
      {[0.25, 0.5, 0.75].map((s) => (
        <circle
          key={s}
          cx={cx}
          cy={cy}
          r={R * s}
          fill="none"
          stroke="rgba(244,241,234,0.10)"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
      ))}
      {/* Skin-tone I-line */}
      <line
        x1={cx + Math.cos((SKIN_TONE_DEG * Math.PI) / 180) * R * 0.95}
        y1={cy + Math.sin((SKIN_TONE_DEG * Math.PI) / 180) * R * 0.95}
        x2={cx + Math.cos(((SKIN_TONE_DEG + 180) * Math.PI) / 180) * R * 0.95}
        y2={cy + Math.sin(((SKIN_TONE_DEG + 180) * Math.PI) / 180) * R * 0.95}
        stroke="rgba(168,136,74,0.55)"
        strokeWidth={0.75}
        strokeDasharray="3 3"
      />
      <text
        x={cx + Math.cos((SKIN_TONE_DEG * Math.PI) / 180) * (R + 14)}
        y={cy + Math.sin((SKIN_TONE_DEG * Math.PI) / 180) * (R + 14)}
        textAnchor="middle"
        fontSize={8}
        fontFamily="var(--font-sans)"
        letterSpacing="0.10em"
        fill="rgba(168,136,74,0.85)"
      >
        SKIN
      </text>
      {/* Target labels */}
      {targets.map((t) => {
        const x = cx + Math.cos((t.angle * Math.PI) / 180) * (R + 12);
        const y = cy + Math.sin((t.angle * Math.PI) / 180) * (R + 12);
        return (
          <text
            key={t.label}
            x={x}
            y={y + 3}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-sans)"
            fontWeight={500}
            fill={t.color}
          >
            {t.label}
          </text>
        );
      })}
      {/* Data points — render as dots scaled by count */}
      {data.flatMap((row, angleBin) =>
        row.map((count, radiusBin) => {
          if (count === 0) return null;
          const angle = (angleBin * 10 + 5) * (Math.PI / 180);
          const r = (radiusBin / 10) * R;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const intensity = Math.min(count / (maxCount / 4), 1);
          return (
            <circle
              key={`${angleBin}-${radiusBin}`}
              cx={x}
              cy={y}
              r={1.5 + intensity * 2.5}
              fill={`rgba(201,169,97,${0.2 + intensity * 0.5})`}
            />
          );
        })
      )}
    </svg>
  );
}

function describeHue(deg: number): string {
  /* Rough mapping of vectorscope angles → mood description */
  if (deg < 60) return 'magenta-warm';
  if (deg < 120) return 'red-orange · warm dominant';
  if (deg < 170) return 'yellow-orange · golden';
  if (deg < 210) return 'yellow-green';
  if (deg < 270) return 'green-cyan · cool';
  if (deg < 330) return 'blue-cyan · cool dominant';
  return 'magenta-cool';
}
