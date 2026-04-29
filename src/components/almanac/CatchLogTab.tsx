import { useMemo, useState } from 'react';
import { Clock, Fish, MapPin, Plus, Ruler, Trash2, User, Weight, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT, useI18n } from '../../i18n';
import type { Catch, CatchMethod, SpeciesCard } from '../../types';

/* ---------- CatchLogTab (Phase 14) ----------

   The actual fisherman's log Ivan keeps. Quick capture: pick species,
   weight + length, method. Auto-tags time + active anchorage + crew
   (defaults to Tomislav).

   Empty by default — fills as the trip happens. */

const METHODS: CatchMethod[] = [
  'parangal',
  'kanjci',
  'koža',
  'osti',
  'panula',
  'vrše',
  'pučina',
  'mreže',
];

interface DateRange {
  key: 'today' | 'trip' | 'all';
  daysBack: number;
}

const RANGES: { range: DateRange; labelKey: 'almanac.catch.today' | 'almanac.catch.this.trip' | 'almanac.catch.all' }[] = [
  { range: { key: 'today', daysBack: 1 },  labelKey: 'almanac.catch.today' },
  { range: { key: 'trip',  daysBack: 7 },  labelKey: 'almanac.catch.this.trip' },
  { range: { key: 'all',   daysBack: 0 },  labelKey: 'almanac.catch.all' },
];

export function CatchLogTab() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { fmtDate } = useI18n();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<DateRange>(RANGES[0].range);

  /* Filter catches by date range. */
  const filteredCatches = useMemo<Catch[]>(() => {
    return [...state.catches]
      .filter((c) => {
        if (filter.key === 'all') return true;
        const ts = c.caughtAt
          ? new Date(c.caughtAt).getTime()
          : null;
        if (ts == null) return false;
        const cutoff = Date.now() - filter.daysBack * 24 * 60 * 60 * 1000;
        return ts >= cutoff;
      })
      .sort((a, b) => {
        const ta = a.caughtAt ?? '';
        const tb = b.caughtAt ?? '';
        return tb.localeCompare(ta);
      });
  }, [state.catches, filter]);

  const totalKg = filteredCatches.reduce((s, c) => s + (c.weightKg ?? 0), 0);

  function addCatch(entry: Catch) {
    dispatch({ type: 'ADD_CATCH', entry });
    setOpen(false);
  }

  function removeCatch(id: string) {
    if (!window.confirm('Delete this catch?')) return;
    dispatch({ type: 'DELETE_CATCH', id });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
            {t('almanac.catch.title')}
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('almanac.catch.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[13px] hover:bg-[color:var(--color-brass-deep)] transition-colors group"
        >
          <Plus size={13} className="group-hover:rotate-90 transition-transform" />
          <span className="display-italic">{t('almanac.catch.add')}</span>
        </button>
      </header>

      {/* Range chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.range.key}
            type="button"
            onClick={() => setFilter(r.range)}
            className={`label-caps text-[10px] px-2 py-1 rounded-[2px] transition-colors ${
              filter.key === r.range.key
                ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)]'
                : 'bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
            }`}
          >
            {t(r.labelKey)}
          </button>
        ))}
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums ml-auto">
          {filteredCatches.length} catches · {totalKg.toFixed(1)} kg
        </span>
      </div>

      {/* List or empty */}
      {filteredCatches.length === 0 ? (
        <div className="text-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('almanac.catch.empty')}
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredCatches.map((c) => (
            <CatchRow
              key={c.id}
              entry={c}
              species={state.species}
              locations={state.locations}
              crew={state.crew}
              onRemove={() => removeCatch(c.id)}
              fmtDate={fmtDate}
            />
          ))}
        </ul>
      )}

      {open && (
        <CatchLogModal
          species={state.species}
          locations={state.locations}
          crew={state.crew}
          onCancel={() => setOpen(false)}
          onSave={addCatch}
        />
      )}
    </div>
  );
}

/* ---------- Catch row ---------- */

function CatchRow({
  entry,
  species,
  locations,
  crew,
  onRemove,
  fmtDate,
}: {
  entry: Catch;
  species: SpeciesCard[];
  locations: { id: string; label: string }[];
  crew: { id: string; name: string }[];
  onRemove: () => void;
  fmtDate: (iso: string) => string;
}) {
  const sp = entry.speciesId ? species.find((s) => s.id === entry.speciesId) : null;
  const loc = entry.anchorageId ? locations.find((l) => l.id === entry.anchorageId) : null;
  const c = entry.caughtBy ? crew.find((m) => m.id === entry.caughtBy) : null;
  return (
    <li className="rounded-[3px] bg-[color:var(--color-paper-light)] border-l-[3px] border-[color:var(--color-success)]/60 border-[0.5px] border-[color:var(--color-border-paper)] px-3 py-2">
      <div className="flex items-baseline gap-2 mb-1">
        <Fish size={12} className="text-[color:var(--color-brass-deep)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] leading-tight">
            {sp?.nameCro ?? entry.fishCro}
            {entry.weightKg != null && (
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums ml-2">
                {entry.weightKg.toFixed(2)} kg
              </span>
            )}
            {entry.lengthCm != null && (
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums ml-2">
                {entry.lengthCm} cm
              </span>
            )}
          </div>
          {sp && (
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] truncate">
              {sp.scientific}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] p-0.5 transition-colors"
          aria-label="delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="flex items-center gap-3 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums flex-wrap">
        {entry.caughtAt && (
          <span className="flex items-center gap-1">
            <Clock size={9} />
            {fmtDate(entry.caughtAt.split('T')[0])} · {entry.caughtAt.split('T')[1]?.slice(0, 5)}
          </span>
        )}
        {loc && (
          <span className="flex items-center gap-1">
            <MapPin size={9} />
            {loc.label}
          </span>
        )}
        {c && (
          <span className="flex items-center gap-1">
            <User size={9} />
            {c.name.split(/\s+/)[0]}
          </span>
        )}
        {entry.method && <span>· {entry.method}</span>}
        {entry.releasedAlive && (
          <span className="text-[color:var(--color-success)]">· released alive</span>
        )}
      </div>
      {entry.notes && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] mt-1.5">
          {entry.notes}
        </div>
      )}
    </li>
  );
}

/* ---------- Catch log modal ---------- */

function CatchLogModal({
  species,
  locations,
  crew,
  onCancel,
  onSave,
}: {
  species: SpeciesCard[];
  locations: { id: string; label: string; episodeId: string }[];
  crew: { id: string; name: string }[];
  onCancel: () => void;
  onSave: (c: Catch) => void;
}) {
  const t = useT();
  const { state } = useApp();

  /* Auto-bind defaults: today's anchorage + first crew member. */
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const todayShoot = state.shootDays.find((d) => d.date === todayIso);
  const defaultAnchorage = todayShoot?.anchorageId ?? '';
  const defaultCrew = state.crew[0]?.id ?? '';

  const [speciesId, setSpeciesId] = useState(species[0]?.id ?? '');
  const [weightKg, setWeightKg] = useState<string>('');
  const [lengthCm, setLengthCm] = useState<string>('');
  const [method, setMethod] = useState<CatchMethod>('panula');
  const [anchorageId, setAnchorageId] = useState<string>(defaultAnchorage);
  const [caughtBy, setCaughtBy] = useState<string>(defaultCrew);
  const [released, setReleased] = useState(false);
  const [notes, setNotes] = useState('');

  function commit() {
    const sp = species.find((s) => s.id === speciesId);
    const c: Catch = {
      id: `catch-${Math.random().toString(36).slice(2, 8)}`,
      episodeId: locations.find((l) => l.id === anchorageId)?.episodeId ?? 'general',
      fishCro: sp?.nameCro ?? '',
      fishLat: sp?.scientific ?? '',
      fishEng: sp?.nameEng ?? '',
      method,
      anchorageId: anchorageId || undefined,
      timeOfDay: timeOfDayNow(),
      weather: '',
      weightKg: weightKg ? Number(weightKg) : undefined,
      lengthCm: lengthCm ? Number(lengthCm) : undefined,
      notes,
      caughtAt: new Date().toISOString(),
      shootDayDate: todayShoot?.date,
      caughtBy: caughtBy || undefined,
      speciesId,
      releasedAlive: released,
    };
    onSave(c);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[color:var(--color-chrome)]/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[520px] overflow-hidden">
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            {t('almanac.catch.add')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
          >
            <X size={14} />
          </button>
        </header>
        <div className="px-5 py-4 space-y-3">
          <Field label={t('almanac.catch.species')}>
            <select
              value={speciesId}
              onChange={(e) => setSpeciesId(e.target.value)}
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
            >
              {species.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.nameCro} · {sp.scientific}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('almanac.catch.weight.kg')}>
              <input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </Field>
            <Field label={t('almanac.catch.length.cm')}>
              <input
                type="number"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('almanac.catch.method')}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as CatchMethod)}
                className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('almanac.catch.location')}>
              <select
                value={anchorageId}
                onChange={(e) => setAnchorageId(e.target.value)}
                className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              >
                <option value="">—</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t('almanac.catch.crew')}>
            <select
              value={caughtBy}
              onChange={(e) => setCaughtBy(e.target.value)}
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
            >
              <option value="">—</option>
              {crew.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('almanac.catch.notes')}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] resize-none"
            />
          </Field>

          <label className="flex items-center gap-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)] cursor-pointer">
            <input
              type="checkbox"
              checked={released}
              onChange={(e) => setReleased(e.target.checked)}
            />
            {t('almanac.catch.released')}
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <button
              type="button"
              onClick={onCancel}
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] px-3 py-1.5"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={commit}
              className="px-4 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[13px] hover:bg-[color:var(--color-brass-deep)] transition-colors display-italic"
            >
              {t('almanac.catch.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function timeOfDayNow(): string {
  const h = new Date().getHours();
  if (h < 6) return 'dawn';
  if (h < 11) return 'morning';
  if (h < 15) return 'midday';
  if (h < 19) return 'afternoon';
  if (h < 22) return 'dusk';
  return 'night';
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { Ruler, Weight };
/* eslint-enable @typescript-eslint/no-unused-vars */
