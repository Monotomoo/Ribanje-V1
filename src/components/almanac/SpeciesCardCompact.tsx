import {
  Anchor,
  Fish,
  Layers,
  Moon,
  Ruler,
  Sun,
  Sunset,
  type LucideIcon,
} from 'lucide-react';
import { useT } from '../../i18n';
import type { SpeciesCard } from '../../types';

/* ---------- Compact species card ----------
   Used in SpeciesCardsTab grid + as the species drawer. Croatian name
   is the headline (always Croatian per Q4=C choice), Latin scientific
   subtitle, English in small label, plus biology + methods + dialects. */

const MONTH_NAMES_EN = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const CATEGORY_ICONS: Record<SpeciesCard['category'], LucideIcon> = {
  pelagic:    Fish,
  demersal:   Anchor,
  cephalopod: Layers,
  crustacean: Layers,
  shellfish:  Layers,
  other:      Fish,
};

const STATUS_TONE: Record<string, string> = {
  LC:        'var(--color-success)',
  NT:        'var(--color-success)',
  VU:        'var(--color-brass-deep)',
  EN:        'var(--color-coral-deep)',
  CR:        'var(--color-coral-deep)',
  DD:        'var(--color-on-paper-muted)',
  healthy:   'var(--color-success)',
  stable:    'var(--color-success)',
  declining: 'var(--color-brass-deep)',
  depleted:  'var(--color-coral-deep)',
  protected: 'var(--color-brass)',
  unknown:   'var(--color-on-paper-muted)',
};

interface Props {
  species: SpeciesCard;
  onClick?: () => void;
  expanded?: boolean;
  highlightMonth?: number;        // 1–12 to highlight (e.g. current month)
}

export function SpeciesCardCompact({
  species,
  onClick,
  expanded = false,
  highlightMonth,
}: Props) {
  const t = useT();
  const Icon = CATEGORY_ICONS[species.category];
  const months = species.monthsActive ?? [];
  const inSeasonNow = highlightMonth ? months.includes(highlightMonth) : false;

  return (
    <article
      onClick={onClick}
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] transition-all hover:border-[color:var(--color-brass)] ${
        onClick ? 'cursor-pointer' : ''
      } ${expanded ? 'p-4' : 'p-3'}`}
    >
      {/* Header */}
      <header className="flex items-baseline gap-2 mb-1.5">
        <Icon size={12} className="text-[color:var(--color-brass-deep)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] leading-tight truncate">
            {species.nameCro}
          </div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-0.5 truncate">
            <span className="text-[color:var(--color-on-paper-faint)]">
              {species.scientific}
            </span>
            <span className="mx-1.5">·</span>
            {species.nameEng}
          </div>
        </div>
        {inSeasonNow && (
          <span className="label-caps text-[8px] tabular-nums px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] shrink-0">
            ✓ {t('almanac.windows.this.month')}
          </span>
        )}
      </header>

      {/* Months ring */}
      <div className="flex items-center gap-0.5 mb-2">
        {MONTH_NAMES_EN.map((m, idx) => {
          const monthNum = idx + 1;
          const active = months.includes(monthNum);
          const highlight = highlightMonth === monthNum;
          return (
            <span
              key={idx}
              title={`${monthNum}`}
              className={`flex-1 text-center text-[8px] py-0.5 rounded-[1px] ${
                highlight
                  ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)]'
                  : active
                  ? 'bg-[color:var(--color-success)]/30 text-[color:var(--color-on-paper)]'
                  : 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper-faint)]'
              }`}
            >
              {m}
            </span>
          );
        })}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
        {species.depthRangeM && (
          <span className="flex items-center gap-1">
            <Ruler size={9} />
            {species.depthRangeM.min}-{species.depthRangeM.max}m
          </span>
        )}
        {species.minSizeCm && (
          <span>min {species.minSizeCm}cm</span>
        )}
        {species.bestTimeOfDay && species.bestTimeOfDay.length > 0 && (
          <span className="flex items-center gap-1">
            {species.bestTimeOfDay.includes('night') ? (
              <Moon size={9} />
            ) : species.bestTimeOfDay.includes('dawn') || species.bestTimeOfDay.includes('dusk') ? (
              <Sunset size={9} />
            ) : (
              <Sun size={9} />
            )}
            {species.bestTimeOfDay.join(' · ')}
          </span>
        )}
      </div>

      {/* Methods chips */}
      {species.methods && species.methods.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {species.methods.slice(0, 4).map((m) => (
            <span
              key={m}
              className="px-1.5 py-0.5 rounded-[2px] text-[9px] display-italic bg-[color:var(--color-paper-deep)] text-[color:var(--color-on-paper)]"
            >
              {m}
            </span>
          ))}
          {species.methods.length > 4 && (
            <span className="px-1.5 py-0.5 text-[9px] text-[color:var(--color-on-paper-muted)]">
              +{species.methods.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Status badges */}
      {(species.iucn || species.adriaticStock) && (
        <div className="flex items-center gap-2 mt-2 prose-body italic text-[9px]">
          {species.iucn && (
            <span
              className="label-caps text-[8px] tabular-nums px-1 py-0.5 rounded-[1px]"
              style={{
                color: STATUS_TONE[species.iucn] ?? 'var(--color-on-paper-muted)',
                background: `color-mix(in oklab, ${STATUS_TONE[species.iucn] ?? 'var(--color-on-paper-muted)'} 12%, transparent)`,
              }}
            >
              IUCN {species.iucn}
            </span>
          )}
          {species.adriaticStock && species.adriaticStock !== 'unknown' && (
            <span
              className="label-caps text-[8px] tabular-nums px-1 py-0.5 rounded-[1px]"
              style={{
                color: STATUS_TONE[species.adriaticStock] ?? 'var(--color-on-paper-muted)',
                background: `color-mix(in oklab, ${STATUS_TONE[species.adriaticStock] ?? 'var(--color-on-paper-muted)'} 12%, transparent)`,
              }}
            >
              {species.adriaticStock}
            </span>
          )}
        </div>
      )}

      {/* Dialects + notes (expanded only) */}
      {expanded && species.dialects && species.dialects.length > 0 && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('almanac.species.dialects')}
          </div>
          <ul className="space-y-1">
            {species.dialects.map((d, i) => (
              <li
                key={i}
                className="flex items-baseline gap-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
              >
                <span className="label-caps text-[9px] text-[color:var(--color-brass-deep)] w-20">
                  {d.region}
                </span>
                <span>{d.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {expanded && species.notes && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body text-[12px] text-[color:var(--color-on-paper)] leading-snug italic">
          {species.notes}
        </div>
      )}
    </article>
  );
}
