import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  align?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  italic?: boolean;
  placeholder?: string;
}

const SIZES = {
  sm: 'text-[14px]',
  md: 'text-[18px]',
  lg: 'text-[24px]',
};

/*
  Inline-editable number. Click → input mode → blur or Enter to commit, Escape to cancel.
  Spectral italic by default to fit the editorial aesthetic.
*/
export function EditableNumber({
  value,
  onChange,
  suffix,
  min = 0,
  max,
  align = 'right',
  size = 'md',
  italic = true,
  placeholder = '—',
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onChange(0);
    } else {
      const n = Number(trimmed);
      if (!Number.isNaN(n)) {
        let next = Math.round(n);
        if (typeof min === 'number') next = Math.max(min, next);
        if (typeof max === 'number') next = Math.min(max, next);
        onChange(next);
      }
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(String(value));
    setEditing(false);
  }

  const baseClasses = `${SIZES[size]} ${italic ? 'italic font-[var(--font-body)]' : ''} tabular-nums ${
    align === 'right' ? 'text-right' : 'text-left'
  }`;

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          else if (e.key === 'Escape') cancel();
        }}
        className={`${baseClasses} bg-transparent border-b border-[color:var(--color-brass)] outline-none w-20 px-0 py-0 text-[color:var(--color-on-paper)]`}
      />
    );
  }

  const display = value === 0 ? placeholder : value;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`${baseClasses} text-[color:var(--color-on-paper)] hover:text-[color:var(--color-brass-deep)] transition-colors duration-150 cursor-text`}
      title="click to edit"
    >
      {display}
      {suffix && value !== 0 && (
        <span className="text-[color:var(--color-on-paper-muted)] ml-0.5 not-italic">
          {suffix}
        </span>
      )}
    </button>
  );
}
