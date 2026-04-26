import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';

/* Section heading inside a tab */
export function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-baseline justify-between mb-4">
      <div className="flex items-baseline gap-3">
        <h3 className="display-italic text-[22px] text-[color:var(--color-on-paper)]">
          {title}
        </h3>
        {typeof count === 'number' && (
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            {count} {count === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>
      {action}
    </header>
  );
}

/* Field label + content stacked */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

/* Brass-bordered button to add a new entity */
export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
    >
      <Plus size={11} />
      {label}
    </button>
  );
}

/* Small icon-button delete */
export function DeleteButton({ onClick, label = 'Delete' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-colors p-1"
    >
      <Trash2 size={14} />
    </button>
  );
}

/* Editorial empty-state card */
export function EmptyState({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-8 text-center">
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        {message}
      </p>
      {hint && (
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}

/* Card surface used for entity rows in tabs */
export function EntityCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 hover:border-[color:var(--color-brass)] transition-colors ${className}`}
    >
      {children}
    </article>
  );
}

export function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
