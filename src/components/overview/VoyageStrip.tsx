import { useApp } from '../../state/AppContext';
import type { Episode, EpisodeStatus, ViewKey } from '../../types';
import { Pill } from '../primitives/Pill';
import { EPISODE_COLORS } from '../map/AdriaticChart';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

interface Props {
  onJump?: (view: ViewKey, episodeId?: string) => void;
}

export function VoyageStrip({ onJump }: Props) {
  const { state } = useApp();

  return (
    <div className="grid grid-cols-6 gap-3">
      {state.episodes.map((ep) => (
        <EpisodeCard key={ep.id} ep={ep} onJump={onJump} />
      ))}
    </div>
  );
}

function EpisodeCard({
  ep,
  onJump,
}: {
  ep: Episode;
  onJump?: (view: ViewKey, episodeId?: string) => void;
}) {
  const { state } = useApp();
  const accent = EPISODE_COLORS[ep.id] ?? '#2D4A6B';
  const anchorages = state.locations.filter((l) => l.episodeId === ep.id);
  const moments = state.antiScriptMoments.filter((m) => m.episodeId === ep.id);
  const captured = moments.filter((m) => m.status === 'captured').length;
  const catches = state.catches.filter((c) => c.episodeId === ep.id);
  const meals = state.meals.filter((m) => m.episodeId === ep.id);
  const talents = state.talents.filter((t) => t.episodeId === ep.id);
  const sponsors = state.sponsors.filter((s) =>
    (s.episodeIds ?? []).includes(ep.id)
  );

  return (
    <button
      type="button"
      onClick={() => onJump?.('episodes', ep.id)}
      className="text-left bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)] rounded-[3px] px-4 py-4 transition-colors flex flex-col"
    >
      <div className="flex items-baseline justify-between mb-2">
        <span
          className="display-italic text-[18px] tabular-nums leading-none"
          style={{ color: accent }}
        >
          {ROMAN[ep.number] ?? ep.number}.
        </span>
        <Pill variant={statusVariant(ep.status)}>{ep.status}</Pill>
      </div>

      <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
        {ep.title}
      </h3>
      <div className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] mt-0.5 lowercase">
        {ep.theme}
      </div>

      <div
        className="h-px my-3"
        style={{ background: accent, opacity: 0.4 }}
      />

      <ul className="space-y-1.5 prose-body text-[11px] text-[color:var(--color-on-paper-muted)] flex-1">
        <Stat label="anchorages" value={anchorages.length} accent={accent} />
        <Stat
          label="beats"
          value={moments.length}
          extra={captured > 0 ? `· ${captured} captured` : undefined}
          accent={accent}
        />
        <Stat label="catches" value={catches.length} accent={accent} />
        <Stat label="meals" value={meals.length} accent={accent} />
        <Stat label="talents" value={talents.length} accent={accent} />
        <Stat label="sponsors" value={sponsors.length} accent={accent} />
      </ul>

      <div className="font-sans text-[10px] tracking-[0.14em] uppercase text-[color:var(--color-on-paper-faint)] pt-3 mt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] truncate">
        {ep.anchor}
      </div>
    </button>
  );
}

function Stat({
  label,
  value,
  extra,
  accent,
}: {
  label: string;
  value: number;
  extra?: string;
  accent: string;
}) {
  return (
    <li className="flex items-baseline gap-2">
      <span
        className="w-1 h-1 rounded-full shrink-0 translate-y-[-1px]"
        style={{ background: value > 0 ? accent : 'var(--color-on-paper-faint)' }}
      />
      <span className="flex-1 italic">{label}</span>
      <span className="display-italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums">
        {value}
      </span>
      {extra && <span className="text-[10px] italic">{extra}</span>}
    </li>
  );
}

function statusVariant(s: EpisodeStatus) {
  return s;
}
