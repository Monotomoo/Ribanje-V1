import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { DOPCategory, DOPKitItem } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import { LCDCard } from '../primitives/LCDCard';
import { newId } from '../episode/shared';
import { KitStatusBoard } from './KitStatusBoard';
import { KitFailureSimulator } from './KitFailureSimulator';

const CATEGORY_LABEL: Record<DOPCategory, string> = {
  camera: 'Cameras',
  lens: 'Lenses',
  audio: 'Audio',
  stab: 'Stabilisation',
  aerial: 'Aerial',
  underwater: 'Underwater',
  storage: 'Storage',
  other: 'Other',
};

const CATEGORY_ORDER: DOPCategory[] = [
  'camera',
  'lens',
  'stab',
  'audio',
  'aerial',
  'underwater',
  'storage',
  'other',
];

export function KitDashboard() {
  const { state, dispatch } = useApp();

  /* Hero stats */
  const totalWeight = state.dopKit.reduce(
    (s, k) => s + (k.weightKg ?? 0),
    0
  );
  const totalWh = state.dopKit.reduce(
    (s, k) => s + (k.wattsPerHour ?? 0),
    0
  );
  const totalGb = state.dopKit.reduce(
    (s, k) => s + (k.capacityGb ?? 0),
    0
  );
  const totalDailyK = state.dopKit.reduce(
    (s, k) => s + (k.dailyRateK ?? 0),
    0
  );

  function addItem(category: DOPCategory) {
    const item: DOPKitItem = {
      id: newId('kit'),
      category,
      label: 'New item',
    };
    dispatch({ type: 'ADD_DOP_KIT', item });
  }

  return (
    <div className="space-y-7">
      {/* Live kit status board — DURING-shoot grid */}
      <KitStatusBoard />

      {/* Kit failure simulator — disaster-scenario decision support */}
      <KitFailureSimulator />

      <section className="grid grid-cols-4 gap-5">
        <LCDCard
          label="Kit weight"
          value={`${totalWeight.toFixed(1)}kg`}
          sub={`${state.dopKit.length} items in kit`}
        />
        <LCDCard
          label="Power draw"
          value={`${Math.round(totalWh)}W`}
          sub="Wh per running hour"
        />
        <LCDCard
          label="Storage"
          value={
            totalGb >= 1000
              ? `${(totalGb / 1000).toFixed(1)}TB`
              : `${totalGb}GB`
          }
          sub="rolling capacity"
        />
        <LCDCard
          label="Daily kit cost"
          value={`${totalDailyK.toFixed(2)}k`}
          sub="€ · sum of day rates"
        />
      </section>

      <div className="grid grid-cols-2 gap-5">
        {CATEGORY_ORDER.map((cat) => {
          const items = state.dopKit.filter((k) => k.category === cat);
          return (
            <KitCategoryCard
              key={cat}
              category={cat}
              label={CATEGORY_LABEL[cat]}
              items={items}
              onAdd={() => addItem(cat)}
            />
          );
        })}
      </div>
    </div>
  );
}

function KitCategoryCard({
  label,
  items,
  onAdd,
}: {
  category: DOPCategory;
  label: string;
  items: DOPKitItem[];
  onAdd: () => void;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <header className="flex items-baseline justify-between mb-3 pb-2 border-b-[0.5px] border-[color:var(--color-border-paper)]">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          {label}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add item"
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] p-1"
        >
          <Plus size={13} />
        </button>
      </header>
      {items.length === 0 ? (
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
          no items
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <KitRow key={it.id} item={it} />
          ))}
        </ul>
      )}
    </article>
  );
}

function KitRow({ item }: { item: DOPKitItem }) {
  const { dispatch } = useApp();
  function patch(p: Partial<DOPKitItem>) {
    dispatch({ type: 'UPDATE_DOP_KIT', id: item.id, patch: p });
  }
  return (
    <li className="group">
      <div className="flex items-baseline gap-2">
        <div className="flex-1 min-w-0">
          <EditableText
            value={item.label}
            onChange={(v) => patch({ label: v })}
            className="display-italic text-[15px] text-[color:var(--color-on-paper)]"
          />
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'DELETE_DOP_KIT', id: item.id })}
          aria-label="Delete"
          className="opacity-0 group-hover:opacity-100 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-all p-1"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <details className="mt-1.5 group/det">
        <summary className="label-caps text-[color:var(--color-on-paper-faint)] cursor-pointer list-none hover:text-[color:var(--color-brass-deep)]">
          <span className="group-open/det:hidden">specs</span>
          <span className="hidden group-open/det:inline">close</span>
        </summary>
        <div className="pt-3 space-y-3">
          {/* Specs key/value table */}
          <SpecsEditor item={item} />

          {/* Numeric quick-fields */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <KV label="Weight">
              <EditableNumber
                value={item.weightKg ?? 0}
                onChange={(v) => patch({ weightKg: v })}
                suffix="kg"
                size="sm"
                align="left"
              />
            </KV>
            <KV label="Watts/h">
              <EditableNumber
                value={item.wattsPerHour ?? 0}
                onChange={(v) => patch({ wattsPerHour: v })}
                suffix="W"
                size="sm"
                align="left"
              />
            </KV>
            <KV label="Day rate">
              <EditableNumber
                value={item.dailyRateK ?? 0}
                onChange={(v) => patch({ dailyRateK: v })}
                suffix="k"
                size="sm"
                align="left"
              />
            </KV>
          </div>

          {item.category === 'lens' && (
            <KV label="Character notes">
              <EditableText
                value={item.characterNotes ?? ''}
                onChange={(v) => patch({ characterNotes: v })}
                multiline
                rows={2}
                placeholder="What does this lens give you?"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
              />
            </KV>
          )}

          {item.category === 'storage' && (
            <KV label="Capacity (GB)">
              <EditableNumber
                value={item.capacityGb ?? 0}
                onChange={(v) => patch({ capacityGb: v })}
                size="sm"
                align="left"
              />
            </KV>
          )}

          <KV label="Notes">
            <EditableText
              value={item.notes ?? ''}
              onChange={(v) => patch({ notes: v })}
              placeholder="Free-text notes"
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
            />
          </KV>
        </div>
      </details>
    </li>
  );
}

function SpecsEditor({ item }: { item: DOPKitItem }) {
  const { dispatch } = useApp();
  const specs = item.specs ?? {};
  const entries = Object.entries(specs);
  function patch(p: Partial<DOPKitItem>) {
    dispatch({ type: 'UPDATE_DOP_KIT', id: item.id, patch: p });
  }
  function setKV(key: string, value: string) {
    patch({ specs: { ...specs, [key]: value } });
  }
  function removeKey(key: string) {
    const next = { ...specs };
    delete next[key];
    patch({ specs: next });
  }
  function addKV() {
    const k = window.prompt('Spec key (e.g., sensor, mount, max ISO)?');
    if (!k) return;
    setKV(k, '');
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="label-caps text-[color:var(--color-brass-deep)]">
          spec sheet
        </span>
        <button
          type="button"
          onClick={addKV}
          className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)]"
        >
          + add
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
          no specs yet
        </p>
      ) : (
        <ul className="space-y-1">
          {entries.map(([k, v]) => (
            <li
              key={k}
              className="grid grid-cols-[120px_1fr_auto] items-baseline gap-2"
            >
              <span className="label-caps text-[color:var(--color-on-paper-muted)] truncate">
                {k}
              </span>
              <EditableText
                value={v}
                onChange={(nv) => setKV(k, nv)}
                placeholder="—"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
              />
              <button
                type="button"
                onClick={() => removeKey(k)}
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
                aria-label="Remove key"
              >
                <Trash2 size={10} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KV({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
