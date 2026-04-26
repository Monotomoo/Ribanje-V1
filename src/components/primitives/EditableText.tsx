import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  rows?: number;
}

/*
  Inline editable text. Click to edit, blur or Enter (on single line) commits,
  Escape cancels. Multiline keeps Enter as a newline; Cmd/Ctrl+Enter commits.
*/
export function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit',
  multiline = false,
  className = '',
  inputClassName = '',
  rows = 4,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current instanceof HTMLInputElement) {
        ref.current.select();
      }
    }
  }, [editing]);

  function commit() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          rows={rows}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
            else if (e.key === 'Escape') cancel();
          }}
          className={`w-full bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-brass)] rounded-[2px] px-3 py-2 outline-none resize-y text-[color:var(--color-on-paper)] ${inputClassName}`}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          else if (e.key === 'Escape') cancel();
        }}
        className={`bg-transparent border-b border-[color:var(--color-brass)] outline-none w-full text-[color:var(--color-on-paper)] ${inputClassName}`}
        placeholder={placeholder}
      />
    );
  }

  const empty = !value || value.length === 0;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`text-left w-full hover:text-[color:var(--color-brass-deep)] transition-colors duration-150 cursor-text ${
        empty ? 'italic text-[color:var(--color-on-paper-faint)]' : ''
      } ${className}`}
    >
      {empty ? placeholder : value}
    </button>
  );
}
