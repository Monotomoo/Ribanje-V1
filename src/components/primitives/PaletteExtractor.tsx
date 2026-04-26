/* Pure utilities + tiny React component for palette extraction.
   Promoted from `components/dop/ColorPaletteStudio.tsx` so Mood board,
   Catch-of-the-day, and other surfaces can reuse it without duplicating
   the k-means logic. The studio component itself is unchanged. */

export async function extractPaletteFromFile(file: File, k = 5): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return extractPaletteFromImage(img, k);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractPaletteFromUrl(url: string, k = 5): Promise<string[]> {
  const img = await loadImage(url);
  return extractPaletteFromImage(img, k);
}

export async function extractPaletteFromImage(
  img: HTMLImageElement,
  k = 5
): Promise<string[]> {
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
  /* k-means++ seeding for stable centroids. */
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
  /* Sort dark→light for consistent display. */
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

/* Reusable swatch row. Used in mood boards, palette studio, catch cards. */
export function PaletteSwatchRow({
  colors,
  height = 32,
  showHex = false,
}: {
  colors: string[];
  height?: number;
  showHex?: boolean;
}) {
  if (colors.length === 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex" style={{ height }}>
        {colors.map((c, i) => (
          <div
            key={i}
            className="flex-1 first:rounded-l-[3px] last:rounded-r-[3px] border-[0.5px] border-[color:var(--color-border-paper)]"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
      {showHex && (
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0, 1fr))` }}
        >
          {colors.map((c, i) => (
            <span
              key={i}
              className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums text-center"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
