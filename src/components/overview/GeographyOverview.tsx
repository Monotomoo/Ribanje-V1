import { useApp } from '../../state/AppContext';
import type { ViewKey } from '../../types';
import { EPISODE_COLORS } from '../map/AdriaticChart';

interface Props {
  onJump?: (view: ViewKey) => void;
}

/* Rough km-per-degree at our mid-latitude. */
const KM_PER_DEG_LAT = 111;
const KM_PER_DEG_LON_44 = 80;
const KM_PER_NM = 1.852;

function distanceNm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = (a.lat - b.lat) * KM_PER_DEG_LAT;
  const dLng = (a.lng - b.lng) * KM_PER_DEG_LON_44;
  const km = Math.sqrt(dLat * dLat + dLng * dLng);
  return km / KM_PER_NM;
}

export function GeographyOverview({ onJump }: Props) {
  const { state } = useApp();

  /* Per-episode anchorage + leg distance summary */
  const perEp = state.episodes.map((ep) => {
    const anchorages = state.locations.filter((l) => l.episodeId === ep.id);
    const routes = state.routes.filter((r) => r.episodeId === ep.id);
    const totalNm = routes.reduce((s, r) => {
      const a = state.locations.find((l) => l.id === r.fromLocationId);
      const b = state.locations.find((l) => l.id === r.toLocationId);
      if (!a || !b) return s;
      return s + distanceNm(a, b);
    }, 0);
    return { ep, anchorages: anchorages.length, routes: routes.length, totalNm };
  });

  const totalAnchorages = state.locations.filter(
    (l) => l.episodeId !== 'general' && l.episodeId !== 'hektorovic'
  ).length;
  const totalRoutes = state.routes.length;
  const totalNm = perEp.reduce((s, p) => s + p.totalNm, 0);

  /* First and last anchorage by episode 1 / 6 if assigned */
  const firstAnchor =
    state.locations.find((l) => l.episodeId === state.episodes[0]?.id)?.label ??
    '—';
  const lastEp = state.episodes[state.episodes.length - 1];
  const lastEpLocs = state.locations.filter((l) => l.episodeId === lastEp?.id);
  const lastAnchor = lastEpLocs[lastEpLocs.length - 1]?.label ?? '—';

  const max = Math.max(1, ...perEp.map((p) => p.anchorages));

  return (
    <section className="grid grid-cols-3 gap-5">
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 col-span-2">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Voyage geography
          </h3>
          <button
            type="button"
            onClick={() => onJump?.('map')}
            className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]"
          >
            open chart →
          </button>
        </header>

        <ul className="space-y-2">
          {perEp.map((p) => {
            const accent = EPISODE_COLORS[p.ep.id] ?? '#2D4A6B';
            return (
              <li
                key={p.ep.id}
                className="grid grid-cols-[80px_1fr_70px_70px_minmax(220px,1fr)] items-center gap-3"
              >
                <span
                  className="prose-body italic text-[13px] tabular-nums leading-none"
                  style={{ color: accent }}
                >
                  Ep {p.ep.number}
                </span>
                <span className="prose-body text-[13px] text-[color:var(--color-on-paper)] truncate">
                  {p.ep.title}
                </span>
                <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                  {p.anchorages}{' '}
                  <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] not-italic">
                    pins
                  </span>
                </span>
                <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] tabular-nums text-right">
                  {Math.round(p.totalNm)}{' '}
                  <span className="label-caps text-[color:var(--color-on-paper-faint)] ml-0.5">
                    NM
                  </span>
                </span>
                <div className="h-1.5 bg-[color:var(--color-paper-deep)]/55 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(p.anchorages / max) * 100}%`,
                      background: accent,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </article>

      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 flex flex-col">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Voyage span
          </h3>
        </header>
        <div className="grid grid-cols-2 gap-y-4">
          <Stat label="Anchorages" value={`${totalAnchorages}`} sub="across 6 episodes" />
          <Stat label="Routes" value={`${totalRoutes}`} sub="planned legs" />
          <Stat
            label="Distance"
            value={`${Math.round(totalNm)} NM`}
            sub="~estimate · linear"
          />
          <Stat
            label="Crew boats"
            value="2"
            sub="camera + talent"
          />
        </div>
        <div className="mt-auto pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            From{' '}
            <span className="display-italic text-[14px] not-italic text-[color:var(--color-on-paper)]">
              {firstAnchor}
            </span>{' '}
            to{' '}
            <span className="display-italic text-[14px] not-italic text-[color:var(--color-on-paper)]">
              {lastAnchor}
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      <div className="display-italic text-[20px] text-[color:var(--color-on-paper)] tabular-nums">
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
