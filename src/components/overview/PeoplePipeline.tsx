import { useApp } from '../../state/AppContext';
import type { TalentStatus, ViewKey } from '../../types';

const TALENT_COLOR: Record<TalentStatus, string> = {
  prospect: 'rgba(14,30,54,0.25)',
  contacted: 'var(--color-dock)',
  confirmed: 'var(--color-success)',
  declined: 'var(--color-coral)',
};

interface Props {
  onJump?: (view: ViewKey) => void;
}

/* People + pipeline summary on Overview. Two columns: Crew · Talent. */
export function PeoplePipeline({ onJump }: Props) {
  const { state } = useApp();

  /* Crew breakdown */
  const crewWithRate = state.crew.filter((c) => c.rate).length;
  const crewWithContact = state.crew.filter((c) => c.contact).length;
  const openTasks = state.tasks.filter(
    (t) => t.context === 'crew' && t.status !== 'done'
  ).length;
  const openNotes = state.notes.filter(
    (n) => n.targetType === 'crew' && !n.resolvedAt
  ).length;

  /* Talent pipeline by status */
  const talents = state.talents;
  const total = talents.length;
  const counts: Record<TalentStatus, number> = {
    prospect: 0,
    contacted: 0,
    confirmed: 0,
    declined: 0,
  };
  for (const t of talents) counts[t.status] += 1;

  /* Per-episode talent confirmed */
  const perEp = state.episodes.map((ep) => {
    const list = talents.filter(
      (t) => t.episodeId === ep.id || t.episodeId === 'general'
    );
    const confirmed = list.filter((t) => t.status === 'confirmed').length;
    return { ep, count: list.length, confirmed };
  });

  return (
    <section className="grid grid-cols-2 gap-5">
      {/* Crew */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Crew
          </h3>
          <button
            type="button"
            onClick={() => onJump?.('crew')}
            className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]"
          >
            open →
          </button>
        </header>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Stat label="Roster" value={`${state.crew.length}`} sub="people on the crew" />
          <Stat label="Rates set" value={`${crewWithRate}/${state.crew.length}`} sub="day-rate or equity logged" />
          <Stat
            label="Contacts"
            value={`${crewWithContact}/${state.crew.length}`}
            sub="contact details on file"
          />
          <Stat
            label="Open tasks"
            value={`${openTasks}`}
            sub={openNotes > 0 ? `${openNotes} open notes` : 'no open threads'}
            tone={openTasks === 0 ? 'success' : 'brass'}
          />
        </div>

        <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {state.crew.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline gap-2 prose-body text-[12px] text-[color:var(--color-on-paper)]"
              >
                <span className="w-6 h-6 rounded-full bg-[color:var(--color-chrome)] text-[color:var(--color-brass)] flex items-center justify-center display-italic text-[10px] shrink-0">
                  {m.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || '·'}
                </span>
                <span className="display-italic text-[13px] flex-1 truncate">
                  {m.name}
                </span>
                <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] truncate">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* Talent */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Talent pipeline
          </h3>
          <button
            type="button"
            onClick={() => onJump?.('episodes')}
            className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]"
          >
            episodes →
          </button>
        </header>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
          <Stat label="Total" value={`${total}`} sub="elders · klapa · guests" />
          <Stat
            label="Confirmed"
            value={`${counts.confirmed}`}
            sub={`${counts.contacted} contacted · ${counts.prospect} prospect`}
            tone="success"
          />
        </div>

        {total > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden bg-[color:var(--color-paper-deep)]/40 mb-4">
            {(['prospect', 'contacted', 'confirmed', 'declined'] as TalentStatus[])
              .filter((s) => counts[s] > 0)
              .map((s) => (
                <div
                  key={s}
                  style={{
                    width: `${(counts[s] / total) * 100}%`,
                    background: TALENT_COLOR[s],
                  }}
                  title={`${s}: ${counts[s]}`}
                />
              ))}
          </div>
        )}

        <ul className="space-y-1.5">
          {perEp.map(({ ep, count, confirmed }) => (
            <li
              key={ep.id}
              className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 prose-body text-[12px] text-[color:var(--color-on-paper-muted)]"
            >
              <span className="italic truncate">
                Ep {ep.number} · {ep.title}
              </span>
              <span className="display-italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums">
                {count}
              </span>
              <span
                className={`label-caps tabular-nums ${
                  confirmed > 0
                    ? 'text-[color:var(--color-success)]'
                    : 'text-[color:var(--color-on-paper-faint)]'
                }`}
              >
                {confirmed} conf
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'success' | 'brass' | 'coral';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      <div className={`display-italic text-[20px] tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
