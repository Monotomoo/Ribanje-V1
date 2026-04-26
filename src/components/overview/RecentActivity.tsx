import { useApp } from '../../state/AppContext';
import type { JournalEntry, MoodTag, ViewKey } from '../../types';

const MOOD_TONE: Record<MoodTag, string> = {
  great: 'text-[color:var(--color-success)]',
  good: 'text-[color:var(--color-success)]',
  neutral: 'text-[color:var(--color-on-paper-muted)]',
  rough: 'text-[color:var(--color-warn)]',
  bad: 'text-[color:var(--color-coral-deep)]',
};

interface Props {
  onJump?: (view: ViewKey) => void;
}

export function RecentActivity({ onJump }: Props) {
  const { state } = useApp();
  const entries = [...state.journalEntries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  if (entries.length === 0) return null;

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
      <header className="flex items-baseline justify-between mb-4">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Recent activity
        </h3>
        {onJump && (
          <button
            type="button"
            onClick={() => onJump('journal')}
            className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]"
          >
            Open journal →
          </button>
        )}
      </header>
      <ul className="space-y-3">
        {entries.map((e) => (
          <Entry key={e.id} entry={e} />
        ))}
      </ul>
    </section>
  );
}

function Entry({ entry }: { entry: JournalEntry }) {
  const { state } = useApp();
  const loc = state.locations.find((l) => l.id === entry.anchorageId);
  return (
    <li className="grid grid-cols-[120px_1fr_auto] gap-4 items-baseline pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 last:pb-0">
      <div>
        <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] tabular-nums">
          {entry.date}
        </div>
        <div className="label-caps text-[color:var(--color-on-paper-faint)] mt-0.5">
          {loc?.label ?? entry.weather ?? 'shore'}
        </div>
      </div>
      <p className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55] line-clamp-2">
        {entry.whatHappened || (
          <em className="text-[color:var(--color-on-paper-faint)]">no notes</em>
        )}
      </p>
      <span
        className={`label-caps border-[0.5px] border-current rounded-full px-2 py-[1px] ${MOOD_TONE[entry.moodTag]}`}
      >
        {entry.moodTag}
      </span>
    </li>
  );
}
