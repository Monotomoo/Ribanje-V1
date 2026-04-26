import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { ColorPalette } from '../../types';

/* Tiny k-means in RGB space to extract a 5-colour palette from an image. */
async function extractPalette(file: File, k = 5): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    const SIZE = 96;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
    const pixels: number[][] = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    const centroids = kmeans(pixels, k, 12);
    return centroids.map(rgbToHex);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function kmeans(pixels: number[][], k: number, iterations: number): number[][] {
  /* Initialise centroids with k-means++ for stability */
  const centroids: number[][] = [];
  const seedIdx = Math.floor(Math.random() * pixels.length);
  centroids.push([...pixels[seedIdx]]);
  while (centroids.length < k) {
    const dists = pixels.map((p) => {
      let min = Infinity;
      for (const c of centroids) {
        const d = sqDist(p, c);
        if (d < min) min = d;
      }
      return min;
    });
    const total = dists.reduce((s, x) => s + x, 0);
    let r = Math.random() * total;
    let chosen = 0;
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push([...pixels[chosen]]);
  }

  for (let iter = 0; iter < iterations; iter++) {
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);
    for (const p of pixels) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < k; i++) {
        const d = sqDist(p, centroids[i]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      sums[best][0] += p[0];
      sums[best][1] += p[1];
      sums[best][2] += p[2];
      counts[best]++;
    }
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        centroids[i] = [
          Math.round(sums[i][0] / counts[i]),
          Math.round(sums[i][1] / counts[i]),
          Math.round(sums[i][2] / counts[i]),
        ];
      }
    }
  }
  /* Sort by luminance for display */
  return centroids.sort((a, b) => luminance(a) - luminance(b));
}

function sqDist(a: number[], b: number[]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function luminance(p: number[]): number {
  return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
}

function rgbToHex(p: number[]): string {
  return (
    '#' +
    p
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function ColorPaletteStudio() {
  const { state, dispatch } = useApp();
  const [palette, setPalette] = useState<string[]>([]);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [episodeId, setEpisodeId] = useState<string>('general');
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const colors = await extractPalette(file);
      setPalette(colors);
      const reader = new FileReader();
      reader.onload = () => setImgPreview(String(reader.result));
      reader.readAsDataURL(file);
    } catch {
      /* swallow */
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (palette.length === 0) return;
    const entry: ColorPalette = {
      id: newId('pal'),
      episodeId,
      label: label || `palette ${state.colorPalettes.length + 1}`,
      colors: palette,
      sourceImageBase64: imgPreview ?? undefined,
      notes: '',
    };
    dispatch({ type: 'ADD_PALETTE', palette: entry });
    setPalette([]);
    setImgPreview(null);
    setLabel('');
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Color palette studio
        </h2>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 space-y-4">
        <label className="flex items-center justify-center border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] py-8 cursor-pointer hover:border-[color:var(--color-brass)] transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {imgPreview ? (
            <img
              src={imgPreview}
              alt="source"
              className="max-h-32 rounded-[2px] border-[0.5px] border-[color:var(--color-border-paper)]"
            />
          ) : (
            <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
              {busy ? 'extracting…' : 'drop a still image to extract a 5-colour palette'}
            </span>
          )}
        </label>

        {palette.length > 0 && (
          <>
            <div className="flex">
              {palette.map((c, i) => (
                <div
                  key={i}
                  className="h-16 flex-1 first:rounded-l-[3px] last:rounded-r-[3px] border-[0.5px] border-[color:var(--color-border-paper)]"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {palette.map((c, i) => (
                <span
                  key={i}
                  className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums text-center"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
              <input
                type="text"
                placeholder="palette label (e.g. lastovo dawn)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
              />
              <select
                value={episodeId}
                onChange={(e) => setEpisodeId(e.target.value)}
                className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
              >
                <option value="general">All episodes</option>
                {state.episodes.map((e) => (
                  <option key={e.id} value={e.id}>
                    Ep {e.number} · {e.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={save}
              className="w-full label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] rounded-[2px] py-2 transition-colors"
            >
              Save palette
            </button>
          </>
        )}
      </div>

      {state.colorPalettes.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="label-caps text-[color:var(--color-on-paper-faint)]">
            Saved palettes ({state.colorPalettes.length})
          </div>
          {state.colorPalettes.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] px-4 py-2"
            >
              <div className="flex">
                {p.colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-6 h-6 first:rounded-l-[2px] last:rounded-r-[2px]"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] flex-1">
                {p.label}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DELETE_PALETTE', id: p.id })}
                className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
