import { Fragment, type ReactNode } from 'react';

/* ResponsiveTable — desktop renders as a true table (header row + data rows
   with explicit columns). Below `md` (768px) each row collapses to a card
   showing column-label / cell-value pairs vertically.

   Use this primitive when you have a tabular surface that's too wide to fit
   on phone. Keeps editing capability identical at all sizes — only the
   visual layout shifts. */

export interface RTColumn<T> {
  key: string;
  label: string;
  /* The render fn — same on desktop and phone. Cell content adapts to
     whatever width its container has. */
  render: (row: T) => ReactNode;
  /* CSS grid template column value — used on desktop only. e.g. "120px",
     "minmax(120px, 1fr)", "1fr". */
  width?: string;
  /* Hide this column on phone (e.g., redundant info, or already in another
     column). The label/value still renders in the card form unless `hideOnPhone`
     is true. */
  hideOnPhone?: boolean;
  /* If set, this cell becomes the "title" line at the top of the phone card
     (rendered larger, no label prefix). */
  primary?: boolean;
  /* Right-align on desktop. */
  align?: 'left' | 'right';
}

interface Props<T> {
  rows: T[];
  rowKey: (row: T) => string;
  columns: RTColumn<T>[];
  emptyMessage?: ReactNode;
  /* Optional row-level actions slot — rendered at the right edge of each
     desktop row, and at the bottom of each phone card. */
  rowActions?: (row: T) => ReactNode;
}

export function ResponsiveTable<T>({
  rows,
  rowKey,
  columns,
  emptyMessage,
  rowActions,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-8 text-center">
        {emptyMessage ?? 'No rows to display.'}
      </p>
    );
  }

  /* Compose the desktop grid template */
  const gridTemplate = columns
    .map((c) => c.width ?? 'minmax(120px, 1fr)')
    .join(' ') + (rowActions ? ' auto' : '');

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      {/* Desktop header row — hidden on phone */}
      <div
        className="hidden md:grid border-b-[0.5px] border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)] gap-3 px-4 py-2"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {columns.map((c) => (
          <span
            key={c.key}
            className={`label-caps text-[color:var(--color-on-paper-faint)] ${
              c.align === 'right' ? 'text-right' : ''
            }`}
          >
            {c.label}
          </span>
        ))}
        {rowActions && <span />}
      </div>

      {/* Rows */}
      <ul>
        {rows.map((row) => {
          const id = rowKey(row);
          return (
            <li
              key={id}
              className="border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
            >
              {/* Desktop layout — grid */}
              <div
                className="hidden md:grid items-baseline gap-3 px-4 py-2"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    className={c.align === 'right' ? 'text-right' : ''}
                  >
                    {c.render(row)}
                  </div>
                ))}
                {rowActions && (
                  <div className="flex items-baseline justify-end gap-1">
                    {rowActions(row)}
                  </div>
                )}
              </div>

              {/* Phone layout — card stack */}
              <div className="md:hidden px-4 py-3 space-y-1.5">
                {columns
                  .filter((c) => !c.hideOnPhone)
                  .map((c, i) => (
                    <Fragment key={c.key}>
                      {c.primary ? (
                        <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] leading-tight">
                          {c.render(row)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-[88px_1fr] gap-2 items-baseline">
                          <span className="label-caps text-[color:var(--color-on-paper-faint)] text-[9px]">
                            {c.label}
                          </span>
                          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
                            {c.render(row)}
                          </div>
                        </div>
                      )}
                      {/* Subtle separator between primary and rest */}
                      {c.primary && i === 0 && columns.length > 1 && (
                        <div className="h-px bg-[color:var(--color-border-paper)] my-1.5" />
                      )}
                    </Fragment>
                  ))}
                {rowActions && (
                  <div className="flex flex-wrap items-baseline gap-1.5 pt-2 mt-1 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                    {rowActions(row)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
