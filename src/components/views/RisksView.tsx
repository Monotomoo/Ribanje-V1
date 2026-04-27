import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  Risk,
  RiskCategory,
  RiskScale,
  RiskStatus,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { FilterableRegister } from '../primitives/FilterableRegister';
import { NoteThread } from '../primitives/NoteThread';
import { LCDCard } from '../primitives/LCDCard';
import { newId } from '../episode/shared';
import { riskSummary } from '../../lib/selectors';
import { RiskBurnDown } from '../risks/RiskBurnDown';

const CATEGORIES: RiskCategory[] = [
  'weather',
  'equipment',
  'talent',
  'regulatory',
  'financial',
  'operational',
  'post',
  'health',
  'legal',
];

const CATEGORY_COLOR: Record<RiskCategory, string> = {
  weather: '#3D7280',
  equipment: '#788064',
  talent: '#C9A961',
  regulatory: '#8C5C7A',
  financial: '#C26A4A',
  operational: '#2D4A6B',
  post: '#B86B58',
  health: '#6B9080',
  legal: '#4A6B91',
};

const STATUSES: RiskStatus[] = [
  'open',
  'mitigating',
  'mitigated',
  'accepted',
  'closed',
];
const STATUS_TONE: Record<RiskStatus, string> = {
  open: 'text-[color:var(--color-coral-deep)]',
  mitigating: 'text-[color:var(--color-warn)]',
  mitigated: 'text-[color:var(--color-success)]',
  accepted: 'text-[color:var(--color-on-paper-muted)]',
  closed: 'text-[color:var(--color-on-paper-faint)]',
};

type ViewMode = 'register' | 'matrix';

function getP(r: Risk): RiskScale {
  return r.probabilityScale ?? (r.probability === 'high' ? 4 : 2);
}
function getI(r: Risk): RiskScale {
  return r.impactScale ?? (r.impact === 'high' ? 4 : 2);
}
function getStatus(r: Risk): RiskStatus {
  return r.status ?? 'open';
}
function getCategory(r: Risk): RiskCategory {
  return r.category ?? 'operational';
}
function score(r: Risk): number {
  return getP(r) * getI(r);
}
function residualScore(r: Risk): number {
  const rp = r.residualP ?? getP(r);
  const ri = r.residualI ?? getI(r);
  return rp * ri;
}

export function RisksView() {
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState<ViewMode>('register');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const summary = riskSummary(state);

  function add() {
    const risk: Risk = {
      id: newId('r'),
      title: 'New risk',
      description: '',
      mitigation: '',
      probability: 'low',
      impact: 'low',
      category: 'operational',
      probabilityScale: 2,
      impactScale: 2,
      status: 'open',
      triggerConditions: '',
      responsePlan: '',
    };
    dispatch({ type: 'ADD_RISK', risk });
  }

  const selected = state.risks.find((r) => r.id === selectedId);

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Risk register
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            ISO&nbsp;31000-style · probability × impact on a 1–5 scale · per-risk mitigation log
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
        >
          <Plus size={11} />
          Add risk
        </button>
      </div>

      {/* Stats strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <LCDCard label="Total risks" value={`${summary.total}`} />
        <LCDCard
          label="Critical"
          value={`${summary.highHigh}`}
          sub="high × high"
          trend={summary.highHigh > 0 ? 'down' : 'flat'}
        />
        <LCDCard
          label="Mitigation rate"
          value={
            summary.total > 0
              ? `${Math.round((summary.mitigated / summary.total) * 100)}%`
              : '—'
          }
          sub={`${summary.mitigated} of ${summary.total} closed/mitigated`}
          trend={
            summary.total > 0 && summary.mitigated / summary.total >= 0.5
              ? 'up'
              : 'flat'
          }
        />
        <LCDCard
          label="Residual score"
          value={`${summary.residualScore}`}
          sub={`raw ${summary.totalScore} · post-mitigation`}
          trend={
            summary.residualScore < summary.totalScore ? 'up' : 'flat'
          }
        />
      </section>

      {/* Mode toggle */}
      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit max-w-full overflow-x-auto">
        {(['register', 'matrix'] as ViewMode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 transition-colors rounded-[2px] ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[15px]'
                    : 'font-sans text-[11px] tracking-[0.14em] uppercase'
                }
              >
                {m}
              </span>
            </button>
          );
        })}
      </div>

      {mode === 'register' ? (
        <RegisterMode onSelect={setSelectedId} />
      ) : (
        <MatrixMode onSelect={setSelectedId} />
      )}

      {/* Burn-down + weather pane */}
      <RiskBurnDown />

      <RiskDrawer
        risk={selected ?? null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function RegisterMode({ onSelect }: { onSelect: (id: string) => void }) {
  const { state } = useApp();
  return (
    <FilterableRegister
      rows={state.risks}
      rowId={(r) => r.id}
      onRowClick={(r) => onSelect(r.id)}
      defaultSortKey="score"
      defaultSortDir="desc"
      filters={[
        {
          key: 'category',
          label: 'Category',
          options: CATEGORIES.map((c) => ({ value: c, label: c })),
          match: (r, v) => getCategory(r) === v,
        },
        {
          key: 'status',
          label: 'Status',
          options: STATUSES.map((s) => ({ value: s, label: s })),
          match: (r, v) => getStatus(r) === v,
        },
      ]}
      columns={[
        {
          key: 'title',
          label: 'Title',
          width: 'minmax(220px, 1fr)',
          render: (r) => (
            <span className="display-italic text-[15px] text-[color:var(--color-on-paper)] block truncate">
              {r.title}
            </span>
          ),
          sortValue: (r) => r.title.toLowerCase(),
        },
        {
          key: 'category',
          label: 'Category',
          width: '120px',
          render: (r) => (
            <span
              className="label-caps"
              style={{ color: CATEGORY_COLOR[getCategory(r)] }}
            >
              {getCategory(r)}
            </span>
          ),
          sortValue: (r) => getCategory(r),
        },
        {
          key: 'p',
          label: 'P',
          width: '50px',
          align: 'right',
          render: (r) => (
            <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
              {getP(r)}
            </span>
          ),
          sortValue: (r) => getP(r),
        },
        {
          key: 'i',
          label: 'I',
          width: '50px',
          align: 'right',
          render: (r) => (
            <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
              {getI(r)}
            </span>
          ),
          sortValue: (r) => getI(r),
        },
        {
          key: 'score',
          label: 'Score',
          width: '70px',
          align: 'right',
          render: (r) => {
            const s = score(r);
            const tone =
              s >= 16
                ? 'text-[color:var(--color-coral-deep)]'
                : s >= 9
                ? 'text-[color:var(--color-warn)]'
                : 'text-[color:var(--color-on-paper)]';
            return (
              <span className={`display-italic text-[16px] tabular-nums ${tone}`}>
                {s}
              </span>
            );
          },
          sortValue: (r) => score(r),
        },
        {
          key: 'residual',
          label: 'After',
          width: '60px',
          align: 'right',
          render: (r) => (
            <span className="display-italic text-[14px] text-[color:var(--color-success)] tabular-nums">
              {residualScore(r)}
            </span>
          ),
          sortValue: (r) => residualScore(r),
        },
        {
          key: 'owner',
          label: 'Owner',
          width: '120px',
          render: (r) => {
            const owner = r.ownerId
              ? state.crew.find((c) => c.id === r.ownerId)
              : null;
            return (
              <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
                {owner?.name ?? '—'}
              </span>
            );
          },
          sortValue: (r) => {
            const owner = r.ownerId
              ? state.crew.find((c) => c.id === r.ownerId)
              : null;
            return owner?.name ?? '~';
          },
        },
        {
          key: 'status',
          label: 'Status',
          width: '120px',
          render: (r) => (
            <span
              className={`label-caps border-[0.5px] border-current rounded-full px-2 py-[1px] ${
                STATUS_TONE[getStatus(r)]
              }`}
            >
              {getStatus(r)}
            </span>
          ),
          sortValue: (r) => getStatus(r),
        },
      ]}
      emptyMessage="No risks logged yet."
    />
  );
}

function MatrixMode({ onSelect }: { onSelect: (id: string) => void }) {
  const { state } = useApp();
  /* 5x5 matrix — P on Y axis, I on X axis. Each risk a small chip in its cell. */
  const cells: Record<string, Risk[]> = {};
  for (const r of state.risks) {
    const key = `${getP(r)}-${getI(r)}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(r);
  }

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
      <div className="grid grid-cols-[40px_repeat(5,1fr)] gap-1.5">
        {/* Header row: I scale */}
        <div />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="label-caps text-center text-[color:var(--color-on-paper-muted)] pb-2"
          >
            I{i}
          </div>
        ))}

        {/* 5 rows top to bottom = P5 down to P1 */}
        {[5, 4, 3, 2, 1].map((p) => (
          <Row key={p} p={p as RiskScale} cells={cells} onSelect={onSelect} />
        ))}
      </div>

      <div className="mt-5 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-baseline gap-5 flex-wrap">
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          Categories:
        </span>
        {CATEGORIES.map((c) => (
          <span key={c} className="flex items-baseline gap-1.5">
            <span
              className="w-2 h-2 rounded-full mt-1"
              style={{ background: CATEGORY_COLOR[c] }}
            />
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              {c}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Row({
  p,
  cells,
  onSelect,
}: {
  p: RiskScale;
  cells: Record<string, Risk[]>;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="label-caps text-right text-[color:var(--color-on-paper-muted)] pr-1 self-center">
        P{p}
      </div>
      {[1, 2, 3, 4, 5].map((i) => {
        const key = `${p}-${i}`;
        const list = cells[key] ?? [];
        const s = p * i;
        const bg =
          s >= 16
            ? 'rgba(194,106,74,0.10)'
            : s >= 9
            ? 'rgba(217,169,62,0.10)'
            : s >= 4
            ? 'rgba(120,128,100,0.10)'
            : 'rgba(120,128,100,0.05)';
        return (
          <div
            key={i}
            className="border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] min-h-[80px] p-1.5"
            style={{ background: bg }}
          >
            <div className="flex flex-wrap gap-1">
              {list.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className="rounded-full px-2 py-[1px] text-[10px] font-mono uppercase tracking-[0.05em] hover:scale-105 transition-transform"
                  style={{
                    background: CATEGORY_COLOR[getCategory(r)],
                    color: 'var(--color-paper)',
                  }}
                  title={r.title}
                >
                  {r.title.length > 18 ? r.title.slice(0, 16) + '…' : r.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function RiskDrawer({
  risk,
  onClose,
}: {
  risk: Risk | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useApp();
  function patch(p: Partial<Risk>) {
    if (!risk) return;
    dispatch({ type: 'UPDATE_RISK', id: risk.id, patch: p });
  }

  return (
    <AnimatePresence>
      {risk && (
        <>
          <motion.button
            type="button"
            aria-label="close drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[color:var(--color-chrome)]/30 z-40"
          />
          <motion.aside
            key={risk.id}
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[480px] bg-[color:var(--color-paper-card)] border-l-[0.5px] border-[color:var(--color-border-paper-strong)] z-50 flex flex-col"
          >
            <header className="flex items-start justify-between px-7 pt-7 pb-5 border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: CATEGORY_COLOR[getCategory(risk)] }}
                  />
                  <select
                    value={getCategory(risk)}
                    onChange={(e) =>
                      patch({ category: e.target.value as RiskCategory })
                    }
                    className="bg-transparent label-caps text-[color:var(--color-on-paper-muted)] outline-none -ml-0.5"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
                  <EditableText
                    value={risk.title}
                    onChange={(v) => patch({ title: v })}
                    className="display-italic text-[28px] text-[color:var(--color-on-paper)]"
                  />
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="close"
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <ScaleField
                  label="Probability"
                  value={getP(risk)}
                  onChange={(v) => patch({ probabilityScale: v })}
                />
                <ScaleField
                  label="Impact"
                  value={getI(risk)}
                  onChange={(v) => patch({ impactScale: v })}
                />
                <Field label="Score">
                  <span className="display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums">
                    {score(risk)}
                  </span>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <ScaleField
                  label="Residual P"
                  value={risk.residualP ?? getP(risk)}
                  onChange={(v) => patch({ residualP: v })}
                />
                <ScaleField
                  label="Residual I"
                  value={risk.residualI ?? getI(risk)}
                  onChange={(v) => patch({ residualI: v })}
                />
                <Field label="Residual">
                  <span className="display-italic text-[24px] text-[color:var(--color-success)] tabular-nums">
                    {residualScore(risk)}
                  </span>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <Field label="Owner">
                  <select
                    value={risk.ownerId ?? ''}
                    onChange={(e) =>
                      patch({ ownerId: e.target.value || undefined })
                    }
                    className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
                  >
                    <option value="">— unassigned —</option>
                    {state.crew.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={getStatus(risk)}
                    onChange={(e) =>
                      patch({ status: e.target.value as RiskStatus })
                    }
                    className={`w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] py-1 ${STATUS_TONE[getStatus(risk)]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <EditableText
                  value={risk.description}
                  onChange={(v) => patch({ description: v })}
                  multiline
                  rows={3}
                  placeholder="What's the threat?"
                  className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]"
                />
              </Field>

              <Field label="Mitigation">
                <EditableText
                  value={risk.mitigation}
                  onChange={(v) => patch({ mitigation: v })}
                  multiline
                  rows={3}
                  placeholder="Plan to soften the blow"
                  className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]"
                />
              </Field>

              <Field label="Trigger conditions">
                <EditableText
                  value={risk.triggerConditions ?? ''}
                  onChange={(v) => patch({ triggerConditions: v })}
                  multiline
                  rows={2}
                  placeholder="When this risk activates: …"
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
                />
              </Field>

              <Field label="Response plan">
                <EditableText
                  value={risk.responsePlan ?? ''}
                  onChange={(v) => patch({ responsePlan: v })}
                  multiline
                  rows={3}
                  placeholder="If it activates, do: …"
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
                />
              </Field>

              <div className="pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <h3 className="label-caps text-[color:var(--color-brass-deep)] mb-3">
                  Mitigation log
                </h3>
                <NoteThread
                  targetType="risk"
                  targetId={risk.id}
                  emptyMessage="No mitigation actions logged."
                />
              </div>
            </div>

            <footer className="px-7 py-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this risk?')) {
                    dispatch({ type: 'DELETE_RISK', id: risk.id });
                    onClose();
                  }
                }}
                className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-colors"
              >
                delete risk
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RiskScale;
  onChange: (v: RiskScale) => void;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        {label}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n as RiskScale)}
              className={`flex-1 py-1.5 rounded-[2px] label-caps tabular-nums transition-colors ${
                active
                  ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper)]'
                  : 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-paper-deep)]/60'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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
