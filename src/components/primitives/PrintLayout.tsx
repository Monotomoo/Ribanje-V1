import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /* Slate header text shown at top of page when printing */
  header?: string;
  /* Footer text shown at bottom of page */
  footer?: string;
  /* Watermark text rendered diagonally behind the content (very faint) */
  watermark?: string;
  /* Page orientation */
  orientation?: 'portrait' | 'landscape';
  /* Multiple PrintLayouts in sequence — adds page-break-after */
  multiPage?: boolean;
  /* Additional class names */
  className?: string;
  /* Optional date stamp shown in footer (defaults to today) */
  dateStamp?: string;
}

/* A4 printable wrapper. 210 × 297 mm rendered at ~96 DPI in screen preview
   (794 × 1123 px portrait). Use inside a print-wrapper view; combine with
   `print:` Tailwind utilities elsewhere to hide app chrome on print. */
export function PrintLayout({
  children,
  header,
  footer,
  watermark,
  orientation = 'portrait',
  multiPage = false,
  className = '',
  dateStamp,
}: Props) {
  const widthPx = orientation === 'portrait' ? 794 : 1123;
  const heightPx = orientation === 'portrait' ? 1123 : 794;

  return (
    <div
      className={`print-page mx-auto bg-[color:var(--color-paper-card)] text-[color:var(--color-on-paper)] ${className}`}
      style={{
        width: widthPx,
        minHeight: heightPx,
        padding: '48px 56px',
        boxShadow: '0 2px 12px rgba(14,30,54,0.08)',
        position: 'relative',
        pageBreakAfter: multiPage ? 'always' : 'auto',
        breakAfter: multiPage ? 'page' : 'auto',
      }}
    >
      {watermark && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <span
            className="display-italic"
            style={{
              fontSize: 180,
              transform: 'rotate(-30deg)',
              letterSpacing: '0.06em',
              color: 'rgba(201,169,97,0.06)',
              whiteSpace: 'nowrap',
            }}
          >
            {watermark}
          </span>
        </div>
      )}

      {header && (
        <header
          className="flex items-baseline justify-between pb-4 mb-7 border-b-[0.5px] border-[color:var(--color-border-paper-strong)]"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <span className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            {header}
          </span>
          <span className="label-caps text-[color:var(--color-brass-deep)]">
            Ribanje · MMXXVI
          </span>
        </header>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>

      {footer && (
        <footer
          className="mt-10 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper-strong)] flex items-baseline justify-between"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
            {footer}
          </span>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] tabular-nums">
            {dateStamp || new Date().toISOString().slice(0, 10)}
          </span>
        </footer>
      )}
    </div>
  );
}

/* Helper: content that only appears in print output (cmd+P). */
export function PrintOnly({ children }: { children: ReactNode }) {
  return <div className="hidden print:block">{children}</div>;
}

/* Helper: content that's hidden during printing. */
export function ScreenOnly({ children }: { children: ReactNode }) {
  return <div className="print:hidden">{children}</div>;
}

/* Helper: a forced page break. Place between PrintLayout siblings. */
export function PageBreak() {
  return (
    <div
      style={{ pageBreakAfter: 'always', breakAfter: 'page', height: 0 }}
      aria-hidden
    />
  );
}
