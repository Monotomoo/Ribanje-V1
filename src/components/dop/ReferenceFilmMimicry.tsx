import { useMemo, useRef, useState } from 'react';
import { Award, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';

/* Reference Film Mimicry — pick a reference still (from references library or
   upload), upload our frame, get quantified match scores:
   - Palette match: % overlap of dominant 5-color palettes
   - Exposure match: similarity of luma histograms
   - Framing match: rule-of-thirds bright/dark distribution alignment

   The "are we making the show we said we'd make" score. */

interface ImageData {
  url: string;
  palette: { hex: string; weight: number }[]; // top 5 dominant
  lumaHistogram: number[]; // 16 bins
  thirdsScore: { topThird: number; midThird: number; bottomThird: number };
}

const SCORE_TONE = (s: number): { fg: string; bg: string } => {
  if (s >= 75) return { fg: 'rgb(75,110,90)', bg: 'rgba(107,144,128,0.18)' };
  if (s >= 50) return { fg: 'rgb(140,100,30)', bg: 'rgba(201,169,97,0.18)' };
  return { fg: 'rgb(140,60,40)', bg: 'rgba(194,106,74,0.18)' };
};

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.round(c).toString(16).padStart(2, '0'))
      .join('')
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function analyzeImage(img: HTMLImageElement): ImageData {
  const W = 200;
  const ratio = W / img.width;
  const H = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No ctx');
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;

  /* Bin pixels into a coarse 6×6×6 RGB cube for palette extraction */
  const cube: Record<string, { r: number; g: number; b: number; count: number }> = {};
  const lumaHist = new Array(16).fill(0);
  let topThirdLuma = 0;
  let midThirdLuma = 0;
  let bottomThirdLuma = 0;
  let topCount = 0;
  let midCount = 0;
  let botCount = 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const bin = Math.min(15, Math.floor((luma / 256) * 16));
      lumaHist[bin]++;

      /* Cube key */
      const key = `${Math.floor(r / 43)}-${Math.floor(g / 43)}-${Math.floor(b / 43)}`;
      const e = cube[key] ?? { r: 0, g: 0, b: 0, count: 0 };
      e.r += r;
      e.g += g;
      e.b += b;
      e.count++;
      cube[key] = e;

      /* Thirds bands */
      if (y < H / 3) {
        topThirdLuma += luma;
        topCount++;
      } else if (y < (2 * H) / 3) {
        midThirdLuma += luma;
        midCount++;
      } else {
        bottomThirdLuma += luma;
        botCount++;
      }
    }
  }

  /* Top 5 dominant cube buckets */
  const sorted = Object.values(cube).sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, e) => s + e.count, 0);
  const palette = sorted.slice(0, 5).map((e) => ({
    hex: rgbToHex(e.r / e.count, e.g / e.count, e.b / e.count),
    weight: e.count / total,
  }));

  return {
    url: canvas.toDataURL('image/jpeg', 0.7),
    palette,
    lumaHistogram: lumaHist,
    thirdsScore: {
      topThird: topThirdLuma / topCount,
      midThird: midThirdLuma / midCount,
      bottomThird: bottomThirdLuma / botCount,
    },
  };
}

function compareImages(ref: ImageData, target: ImageData): {
  paletteMatchPct: number;
  exposureMatchPct: number;
  framingMatchPct: number;
  overallMatchPct: number;
  diagnosis: string[];
} {
  /* Palette match: for each color in ref, find closest in target.
     Score by inverse distance, weighted by ref weight. */
  let paletteSum = 0;
  for (const rc of ref.palette) {
    const refRgb = hexToRgb(rc.hex);
    let bestDist = Infinity;
    for (const tc of target.palette) {
      const dist = colorDistance(refRgb, hexToRgb(tc.hex));
      if (dist < bestDist) bestDist = dist;
    }
    /* Max distance ~441 (sqrt(255²×3)). Convert to similarity 0-1. */
    paletteSum += (1 - bestDist / 441) * rc.weight;
  }
  const paletteMatchPct = Math.round(paletteSum * 100);

  /* Exposure match: histogram intersection */
  const refSum = ref.lumaHistogram.reduce((s, v) => s + v, 0);
  const tgtSum = target.lumaHistogram.reduce((s, v) => s + v, 0);
  let intersect = 0;
  for (let i = 0; i < 16; i++) {
    intersect += Math.min(ref.lumaHistogram[i] / refSum, target.lumaHistogram[i] / tgtSum);
  }
  const exposureMatchPct = Math.round(intersect * 100);

  /* Framing match: thirds luma profile similarity */
  const tDiff =
    Math.abs(ref.thirdsScore.topThird - target.thirdsScore.topThird) +
    Math.abs(ref.thirdsScore.midThird - target.thirdsScore.midThird) +
    Math.abs(ref.thirdsScore.bottomThird - target.thirdsScore.bottomThird);
  /* Max diff ~768 (3 × 256). Convert to similarity. */
  const framingMatchPct = Math.round((1 - Math.min(tDiff, 768) / 768) * 100);

  const overallMatchPct = Math.round(
    paletteMatchPct * 0.4 + exposureMatchPct * 0.35 + framingMatchPct * 0.25
  );

  /* Diagnosis */
  const diag: string[] = [];

  /* Palette warmth direction */
  const refMeanWarmth = avgWarmth(ref.palette);
  const tgtMeanWarmth = avgWarmth(target.palette);
  if (Math.abs(refMeanWarmth - tgtMeanWarmth) > 30) {
    diag.push(
      tgtMeanWarmth < refMeanWarmth
        ? 'Target reads cooler than reference — push warmth in grade or tungsten WB.'
        : 'Target reads warmer than reference — pull back warmth or daylight WB.'
    );
  }

  /* Exposure direction */
  const refMidLuma =
    ref.lumaHistogram.slice(4, 12).reduce((s, v) => s + v, 0) / refSum;
  const tgtMidLuma =
    target.lumaHistogram.slice(4, 12).reduce((s, v) => s + v, 0) / tgtSum;
  if (refMidLuma - tgtMidLuma > 0.1) {
    diag.push('Target midtones are crushed compared to reference — lift in grade.');
  } else if (tgtMidLuma - refMidLuma > 0.1) {
    diag.push('Target midtones are lifted compared to reference — push contrast.');
  }

  /* Framing direction */
  if (
    target.thirdsScore.topThird - ref.thirdsScore.topThird > 30 &&
    target.thirdsScore.bottomThird - ref.thirdsScore.bottomThird < -30
  ) {
    diag.push('Target weight is top-heavy compared to reference — recompose lower or tilt up.');
  } else if (
    ref.thirdsScore.topThird - target.thirdsScore.topThird > 30 &&
    ref.thirdsScore.bottomThird - target.thirdsScore.bottomThird < -30
  ) {
    diag.push('Target weight is bottom-heavy compared to reference — recompose higher.');
  }

  if (diag.length === 0) diag.push('Match is good — proceed with current grade.');

  return { paletteMatchPct, exposureMatchPct, framingMatchPct, overallMatchPct, diagnosis: diag };
}

function avgWarmth(palette: { hex: string; weight: number }[]): number {
  /* Warmth ~ R - B */
  let sum = 0;
  let totalWeight = 0;
  for (const c of palette) {
    const [r, , b] = hexToRgb(c.hex);
    sum += (r - b) * c.weight;
    totalWeight += c.weight;
  }
  return totalWeight > 0 ? sum / totalWeight : 0;
}

export function ReferenceFilmMimicry() {
  const { state } = useApp();
  const [refData, setRefData] = useState<ImageData | null>(null);
  const [tgtData, setTgtData] = useState<ImageData | null>(null);
  const [refLabel, setRefLabel] = useState<string>('');
  const [busy, setBusy] = useState<'ref' | 'tgt' | null>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const tgtInputRef = useRef<HTMLInputElement>(null);

  /* References from state with images */
  const refsLibrary = state.references.filter(
    (r) => (r.type === 'film' || r.type === 'image') && r.imageBase64
  );

  function loadFromBase64(base64: string, label: string, target: 'ref' | 'tgt') {
    setBusy(target);
    const img = new Image();
    img.onload = () => {
      try {
        const data = analyzeImage(img);
        if (target === 'ref') {
          setRefData(data);
          setRefLabel(label);
        } else {
          setTgtData(data);
        }
      } catch (e) {
        console.error('analysis failed', e);
      }
      setBusy(null);
    };
    img.onerror = () => setBusy(null);
    img.src = base64;
  }

  function handleFile(file: File, target: 'ref' | 'tgt') {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') loadFromBase64(result, file.name, target);
    };
    reader.readAsDataURL(file);
  }

  const comparison = useMemo(
    () => (refData && tgtData ? compareImages(refData, tgtData) : null),
    [refData, tgtData]
  );

  return (
    <section>
      <header className="mb-4">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
          <Award size={16} className="text-[color:var(--color-brass-deep)]" />
          Reference film mimicry
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Pick a reference frame · upload our frame · get quantified palette /
          exposure / framing match scores.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {/* Reference panel */}
        <ImagePanel
          title="Reference frame"
          subtitle="from a film we want to mimic"
          data={refData}
          inputRef={refInputRef}
          busy={busy === 'ref'}
          onFile={(f) => handleFile(f, 'ref')}
          onClear={() => {
            setRefData(null);
            setRefLabel('');
          }}
          accent="brass"
          extraSelector={
            refsLibrary.length > 0 && (
              <div className="mb-3">
                <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                  pick from references library
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    const ref = refsLibrary.find((r) => r.id === e.target.value);
                    if (ref?.imageBase64) loadFromBase64(ref.imageBase64, ref.title, 'ref');
                  }}
                  className="w-full bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none rounded-[2px] px-2 py-1 prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                >
                  <option value="">— select reference —</option>
                  {refsLibrary.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                      {r.director && ` · ${r.director}`}
                    </option>
                  ))}
                </select>
              </div>
            )
          }
          label={refLabel}
        />

        {/* Target panel */}
        <ImagePanel
          title="Our frame"
          subtitle="from today's shoot or yesterday's dailies"
          data={tgtData}
          inputRef={tgtInputRef}
          busy={busy === 'tgt'}
          onFile={(f) => handleFile(f, 'tgt')}
          onClear={() => setTgtData(null)}
          accent="dock"
          label="our shot"
        />
      </div>

      {/* Match scores */}
      {comparison && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ScoreCard
              label="Overall match"
              pct={comparison.overallMatchPct}
              big
            />
            <ScoreCard label="Palette" pct={comparison.paletteMatchPct} />
            <ScoreCard label="Exposure" pct={comparison.exposureMatchPct} />
            <ScoreCard label="Framing" pct={comparison.framingMatchPct} />
          </div>

          {/* Diagnosis */}
          <div className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-5 py-3">
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              diagnosis
            </div>
            <ul className="space-y-1.5">
              {comparison.diagnosis.map((d, i) => (
                <li
                  key={i}
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed flex items-baseline gap-2"
                >
                  <span className="text-[color:var(--color-brass-deep)] tabular-nums shrink-0">
                    {i + 1}.
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Side-by-side palettes */}
          {refData && tgtData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PaletteStrip label="reference palette" palette={refData.palette} />
              <PaletteStrip label="our palette" palette={tgtData.palette} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ImagePanel({
  title,
  subtitle,
  data,
  inputRef,
  busy,
  onFile,
  onClear,
  accent,
  extraSelector,
  label,
}: {
  title: string;
  subtitle: string;
  data: ImageData | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  busy: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
  accent: 'brass' | 'dock';
  extraSelector?: React.ReactNode;
  label: string;
}) {
  const accentColor = accent === 'brass' ? 'var(--color-brass)' : 'var(--color-dock)';
  const id = `mimicry-${title}`;
  return (
    <div className="bg-[color:var(--color-paper-light)] border-l-2 px-4 py-3" style={{ borderColor: accentColor }}>
      <header className="flex items-baseline justify-between mb-2">
        <div>
          <h4 className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
            {title}
          </h4>
          <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
            {subtitle}
          </p>
        </div>
        {data && (
          <button
            type="button"
            onClick={onClear}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)]"
          >
            <X size={11} />
          </button>
        )}
      </header>
      {extraSelector}
      {data ? (
        <div>
          <img
            src={data.url}
            alt={label}
            className="w-full rounded-[2px] mb-1"
          />
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] truncate">
            {label}
          </div>
        </div>
      ) : (
        <div className="aspect-[16/10] bg-[color:var(--color-paper)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[2px] flex flex-col items-center justify-center gap-2">
          <ImageIcon size={20} className="text-[color:var(--color-on-paper-faint)]" />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
            className="hidden"
            id={id}
          />
          <label
            htmlFor={id}
            className="inline-flex items-baseline gap-1 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] cursor-pointer transition-colors"
          >
            <Upload size={9} />
            upload
          </label>
          {busy && (
            <span className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)]">
              analyzing…
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  pct,
  big,
}: {
  label: string;
  pct: number;
  big?: boolean;
}) {
  const tone = SCORE_TONE(pct);
  return (
    <article
      className="px-4 py-3 rounded-[3px] border-[0.5px]"
      style={{ background: tone.bg, borderColor: tone.fg }}
    >
      <div className="label-caps mb-1" style={{ color: tone.fg }}>
        {label}
      </div>
      <div
        className={`display-italic tabular-nums leading-none ${
          big ? 'text-[36px]' : 'text-[24px]'
        }`}
        style={{ color: tone.fg }}
      >
        {pct}%
      </div>
      {/* Mini bar */}
      <div className="mt-1.5 h-[3px] bg-[color:var(--color-paper)] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: tone.fg }}
        />
      </div>
    </article>
  );
}

function PaletteStrip({
  label,
  palette,
}: {
  label: string;
  palette: { hex: string; weight: number }[];
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-1">
        {label}
      </div>
      <div className="flex h-[40px] rounded-[2px] overflow-hidden border-[0.5px] border-[color:var(--color-border-paper)]">
        {palette.map((c, i) => (
          <div
            key={i}
            className="flex items-end justify-center pb-1"
            style={{ background: c.hex, width: `${c.weight * 100}%` }}
            title={`${c.hex} · ${(c.weight * 100).toFixed(0)}%`}
          >
            <span
              className="prose-body italic text-[8px] tabular-nums opacity-70"
              style={{
                color:
                  /* simple luma heuristic for legibility */
                  hexToRgb(c.hex).reduce((s, v) => s + v, 0) > 384 ? '#0E1E36' : '#F4F1EA',
              }}
            >
              {(c.weight * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
