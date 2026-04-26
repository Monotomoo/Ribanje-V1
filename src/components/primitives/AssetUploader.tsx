import { Trash2, Upload } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Asset, AssetType } from '../../types';
import { newId } from '../episode/shared';

const ACCEPT: Record<AssetType, string> = {
  image: 'image/*',
  audio: 'audio/*',
  pdf: 'application/pdf',
  other: '*/*',
};

interface UploaderProps {
  type: AssetType;
  label?: string;
  episodeId?: string;
  catchId?: string;
  mealId?: string;
  journalId?: string;
  noteId?: string;
  /* Maximum bytes per upload — soft warning above this. */
  warnAboveBytes?: number;
}

/* Editorial file uploader. Drops files as data-URLs into state.assets.
   Compresses images to ~1024px max edge. */
export function AssetUploader({
  type,
  label = 'drop a file',
  episodeId,
  catchId,
  mealId,
  journalId,
  noteId,
  warnAboveBytes = 800_000,
}: UploaderProps) {
  const { dispatch } = useApp();

  async function handle(file: File) {
    let dataUrl: string;
    let size = file.size;
    if (type === 'image') {
      dataUrl = await compressImage(file, 1024, 0.82);
      size = dataUrl.length;
    } else {
      dataUrl = await readAsDataURL(file);
    }
    if (size > warnAboveBytes) {
      window.console.warn('[ribanje] asset is large', size, 'bytes');
    }
    const asset: Asset = {
      id: newId('asset'),
      type,
      label: file.name,
      base64: dataUrl,
      size,
      uploadedAt: new Date().toISOString(),
      episodeId,
      catchId,
      mealId,
      journalId,
      noteId,
    };
    dispatch({ type: 'ADD_ASSET', asset });
  }

  return (
    <label className="flex items-center justify-center gap-2 border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-4 py-4 cursor-pointer hover:border-[color:var(--color-brass)] transition-colors">
      <Upload size={13} className="text-[color:var(--color-brass-deep)]" />
      <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
        {label}
      </span>
      <input
        type="file"
        accept={ACCEPT[type]}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handle(f);
            e.target.value = '';
          }
        }}
      />
    </label>
  );
}

interface GridProps {
  assets: Asset[];
  emptyMessage?: string;
}

export function AssetGrid({ assets, emptyMessage }: GridProps) {
  const { dispatch } = useApp();
  if (assets.length === 0) {
    return emptyMessage ? (
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
        {emptyMessage}
      </p>
    ) : null;
  }
  return (
    <ul className="grid grid-cols-3 gap-3">
      {assets.map((a) => (
        <li
          key={a.id}
          className="relative group border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden bg-[color:var(--color-paper-card)]"
        >
          {a.type === 'image' ? (
            <img src={a.base64} alt={a.label} className="w-full h-32 object-cover" />
          ) : (
            <div className="h-32 flex items-center justify-center prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              {a.type.toUpperCase()}
            </div>
          )}
          <div className="px-3 py-2 prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] truncate">
            {a.label}
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'DELETE_ASSET', id: a.id })}
            aria-label="Delete asset"
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-[color:var(--color-paper-card)]/95 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] rounded-full p-1 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function compressImage(
  file: File,
  maxEdge: number,
  quality: number
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return readAsDataURL(file);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
