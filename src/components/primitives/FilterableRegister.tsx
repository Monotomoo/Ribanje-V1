import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDownUp } from 'lucide-react';

export interface RegisterColumn<T> {
  key: string;
  label: string;
  width?: string;            // CSS grid template column (e.g., "120px", "1fr", "minmax(160px, 220px)")
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right';
}

export interface RegisterFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
}

interface Props<T> {
  rows: T[];
  columns: RegisterColumn<T>[];
  filters?: RegisterFilter<T>[];
  rowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
}

/* Editorial sortable / filterable table.
   Used by Risks register, Festival submissions, Funding applications. */
export function FilterableRegister<T>({
  rows,
  columns,
  filters,
  rowId,
  onRowClick,
  emptyMessage = 'No entries.',
  defaultSortKey,
  defaultSortDir = 'asc',
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let out = rows;
    if (filters) {
      for (const f of filters) {
        const v = filterValues[f.key];
        if (v && v !== '__all__') {
          out = out.filter((r) => f.match(r, v));
        }
      }
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const sv = col.sortValue;
        out = [...out].sort((a, b) => {
          const av = sv(a);
          const bv = sv(b);
          if (av < bv) return sortDir === 'asc' ? -1 : 1;
          if (av > bv) return sortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }
    return out;
  }, [rows, columns, filters, filterValues, sortKey, sortDir]);

  const gridCols = columns.map((c) => c.width ?? '1fr').join(' ');

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div>
      {filters && filters.length > 0 && (
        <div className="flex items-baseline gap-4 mb-3 flex-wrap">
          {filters.map((f) => (
            <label key={f.key} className="flex items-baseline gap-2">
              <span className="label-caps text-[color:var(--color-on-paper-faint)]">
                {f.label}
              </span>
              <select
                value={filterValues[f.key] ?? '__all__'}
                onChange={(e) =>
                  setFilterValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
              >
                <option value="__all__">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        <header
          className="grid items-baseline gap-4 px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)]"
          style={{ gridTemplateColumns: gridCols }}
        >
          {columns.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => c.sortValue && toggleSort(c.key)}
              disabled={!c.sortValue}
              className={`label-caps flex items-baseline gap-1 ${
                c.align === 'right' ? 'justify-end' : 'justify-start'
              } ${
                c.sortValue
                  ? 'text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] cursor-pointer'
                  : 'text-[color:var(--color-on-paper-faint)]'
              }`}
            >
              {c.label}
              {sortKey === c.key && (
                <ArrowDownUp size={9} className="opacity-70" />
              )}
            </button>
          ))}
        </header>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
            {emptyMessage}
          </div>
        ) : (
          <div>
            {filtered.map((row) => (
              <div
                key={rowId(row)}
                onClick={() => onRowClick?.(row)}
                className={`grid items-baseline gap-4 px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[color:var(--color-paper-deep)]/30'
                    : ''
                }`}
                style={{ gridTemplateColumns: gridCols }}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    className={
                      c.align === 'right' ? 'text-right' : 'text-left'
                    }
                  >
                    {c.render(row)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-right label-caps text-[color:var(--color-on-paper-faint)]">
        {filtered.length} of {rows.length}
      </div>
    </div>
  );
}
