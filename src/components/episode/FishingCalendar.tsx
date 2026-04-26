import { useMemo } from 'react';
import { Fish, Moon } from 'lucide-react';

interface MonthEntry {
  month: number;          // 1–12
  cro: string;
  hr: string;             // Croatian month name
  bestSpecies: { cro: string; eng: string; note?: string }[];
  waterTempC: [number, number];
  fishingNote: string;
}

/* Croatian Adriatic fishing calendar — distilled from regional folklore +
   marine biology. Used as a reference card in Episode Subject tab to
   contextualise the episode's catches against the actual fishing season. */
const CALENDAR: MonthEntry[] = [
  {
    month: 1,
    cro: 'Siječanj',
    hr: 'January',
    bestSpecies: [
      { cro: 'Cipal', eng: 'Mullet', note: 'In river mouths' },
      { cro: 'Iglica', eng: 'Garfish' },
      { cro: 'Inćun', eng: 'Anchovy', note: 'Deeper waters' },
    ],
    waterTempC: [9, 13],
    fishingNote: 'Cold water · slow metabolism · patient line work. Limited but rewarding.',
  },
  {
    month: 2,
    cro: 'Veljača',
    hr: 'February',
    bestSpecies: [
      { cro: 'Sipa', eng: 'Cuttlefish', note: 'Spawning' },
      { cro: 'Lignja', eng: 'Squid' },
      { cro: 'Cipal', eng: 'Mullet' },
    ],
    waterTempC: [9, 12],
    fishingNote: 'Cuttlefish spawn — peak time for sipa. Cold but the most productive winter month.',
  },
  {
    month: 3,
    cro: 'Ožujak',
    hr: 'March',
    bestSpecies: [
      { cro: 'Sipa', eng: 'Cuttlefish' },
      { cro: 'Brancin', eng: 'Sea bass' },
      { cro: 'Lubin', eng: 'European sea bass' },
    ],
    waterTempC: [10, 14],
    fishingNote: 'Sea bass returns to inshore. Sipa season tail. Spring stirring.',
  },
  {
    month: 4,
    cro: 'Travanj',
    hr: 'April',
    bestSpecies: [
      { cro: 'Brancin', eng: 'Sea bass' },
      { cro: 'Komarča', eng: 'Gilt-head bream' },
      { cro: 'Tunj', eng: 'Tuna', note: 'Migration begins' },
    ],
    waterTempC: [13, 16],
    fishingNote: 'Spring migration begins. Bream + bass active. Open-water tuna routes warming.',
  },
  {
    month: 5,
    cro: 'Svibanj',
    hr: 'May',
    bestSpecies: [
      { cro: 'Tunj', eng: 'Tuna' },
      { cro: 'Skuša', eng: 'Mackerel' },
      { cro: 'Plavica', eng: 'Bonito' },
    ],
    waterTempC: [16, 19],
    fishingNote: 'Pelagic season opens. Mackerel + bonito + tuna in open Adriatic.',
  },
  {
    month: 6,
    cro: 'Lipanj',
    hr: 'June',
    bestSpecies: [
      { cro: 'Tunj', eng: 'Tuna' },
      { cro: 'Skuša', eng: 'Mackerel' },
      { cro: 'Lokarda', eng: 'Spanish mackerel' },
    ],
    waterTempC: [19, 23],
    fishingNote: 'Peak tuna in deep water. Long-line season for traditional fishermen.',
  },
  {
    month: 7,
    cro: 'Srpanj',
    hr: 'July',
    bestSpecies: [
      { cro: 'Tunj', eng: 'Tuna' },
      { cro: 'Lubin', eng: 'Sea bass' },
      { cro: 'Hobotnica', eng: 'Octopus', note: 'Reef hunting' },
    ],
    waterTempC: [22, 26],
    fishingNote: 'Warm shallows = octopus on rocky reefs. Spear-fishing season opens.',
  },
  {
    month: 8,
    cro: 'Kolovoz',
    hr: 'August',
    bestSpecies: [
      { cro: 'Hobotnica', eng: 'Octopus' },
      { cro: 'Tunj', eng: 'Tuna' },
      { cro: 'Lignja', eng: 'Squid', note: 'Night fishing' },
    ],
    waterTempC: [23, 27],
    fishingNote: 'Squid on night lines under acetylene lamps — the most photographed scene of summer.',
  },
  {
    month: 9,
    cro: 'Rujan',
    hr: 'September',
    bestSpecies: [
      { cro: 'Lignja', eng: 'Squid' },
      { cro: 'Lokarda', eng: 'Mackerel' },
      { cro: 'Skuša', eng: 'Mackerel' },
    ],
    waterTempC: [21, 24],
    fishingNote: 'Squid peak. Pelagics still active before cooling. Klapa fishing-songs season.',
  },
  {
    month: 10,
    cro: 'Listopad',
    hr: 'October',
    bestSpecies: [
      { cro: 'Lignja', eng: 'Squid', note: 'Peak season' },
      { cro: 'Tunj', eng: 'Tuna', note: 'Late migration' },
      { cro: 'Skuša', eng: 'Mackerel' },
      { cro: 'Brancin', eng: 'Sea bass' },
    ],
    waterTempC: [18, 22],
    fishingNote:
      'Ribanje 2026 shoots here. Squid · tuna · mackerel · bass all active. Best month for variety.',
  },
  {
    month: 11,
    cro: 'Studeni',
    hr: 'November',
    bestSpecies: [
      { cro: 'Brancin', eng: 'Sea bass' },
      { cro: 'Sipa', eng: 'Cuttlefish' },
      { cro: 'Cipal', eng: 'Mullet' },
    ],
    waterTempC: [14, 18],
    fishingNote: 'Cooling water. Bass + cuttlefish returning to inshore. Last warm-light shoots possible.',
  },
  {
    month: 12,
    cro: 'Prosinac',
    hr: 'December',
    bestSpecies: [
      { cro: 'Sipa', eng: 'Cuttlefish' },
      { cro: 'Iglica', eng: 'Garfish' },
      { cro: 'Cipal', eng: 'Mullet' },
    ],
    waterTempC: [11, 14],
    fishingNote: 'Winter inshore species. Short days · golden hour everywhere. Reflective season.',
  },
];

interface Props {
  episodeMonth?: number;        // 1–12 to highlight (default October if any)
  compact?: boolean;
}

export function FishingCalendar({ episodeMonth, compact }: Props) {
  const highlightMonth = episodeMonth ?? 10;
  const highlight = CALENDAR[highlightMonth - 1];

  if (compact && highlight) {
    return <FishingCalendarCard entry={highlight} compact />;
  }

  return (
    <section>
      <header className="flex items-baseline gap-3 mb-3">
        <Fish size={13} className="text-[color:var(--color-brass-deep)]" />
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Adriatic fishing calendar
        </h3>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          season × species × water temp · highlighting{' '}
          <span className="text-[color:var(--color-brass-deep)]">{highlight?.hr}</span>
        </span>
      </header>
      <ul className="grid grid-cols-3 gap-3">
        {CALENDAR.map((m) => (
          <FishingCalendarCard
            key={m.month}
            entry={m}
            highlighted={m.month === highlightMonth}
          />
        ))}
      </ul>
    </section>
  );
}

function FishingCalendarCard({
  entry,
  highlighted,
  compact,
}: {
  entry: MonthEntry;
  highlighted?: boolean;
  compact?: boolean;
}) {
  const moonPhase = useMemo(() => {
    /* Simple: month % 4 → cycle indicator. Cosmetic only. */
    return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][entry.month % 8];
  }, [entry.month]);
  void moonPhase;

  return (
    <li
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] rounded-[3px] px-4 py-3 ${
        highlighted
          ? 'border-[color:var(--color-brass)] ring-1 ring-[color:var(--color-brass)]/40'
          : 'border-[color:var(--color-border-paper)]'
      }`}
    >
      <header className="flex items-baseline justify-between mb-2">
        <div>
          <div className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            {entry.cro}
          </div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
            {entry.hr} · month {entry.month}
          </div>
        </div>
        <div className="text-right">
          <div className="label-caps text-[color:var(--color-brass-deep)] tabular-nums">
            {entry.waterTempC[0]}–{entry.waterTempC[1]}°C
          </div>
          <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] mt-0.5">
            water
          </div>
        </div>
      </header>
      <ul className="space-y-1 mb-2">
        {entry.bestSpecies.slice(0, compact ? 3 : 5).map((s, i) => (
          <li
            key={i}
            className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-tight"
          >
            <span className="display-italic text-[13px] text-[color:var(--color-on-paper)]">
              {s.cro}
            </span>
            <span className="text-[color:var(--color-on-paper-muted)]"> · {s.eng}</span>
            {s.note && (
              <span className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] block">
                {s.note}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-relaxed pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        {entry.fishingNote}
      </p>
    </li>
  );
}

/* Light moon icon for re-export hint */
export const _icons = { Moon };
