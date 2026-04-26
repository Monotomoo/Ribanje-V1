import { useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { FestivalStatus, FestivalSubmission } from '../../types';
import { FilterableRegister } from '../primitives/FilterableRegister';
import { EditableText } from '../primitives/EditableText';
import { newId } from '../episode/shared';
import { FestivalFitCalculator } from './FestivalFitCalculator';

const STATUSES: FestivalStatus[] = [
  'target',
  'submitted',
  'accepted',
  'declined',
  'won',
  'withdrawn',
];

const STATUS_TONE: Record<FestivalStatus, string> = {
  target: 'text-[color:var(--color-on-paper-muted)]',
  submitted: 'text-[color:var(--color-warn)]',
  accepted: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-on-paper-faint)]',
  won: 'text-[color:var(--color-brass-deep)]',
  withdrawn: 'text-[color:var(--color-coral-deep)]',
};

export function FestivalTracker() {
  const { state, dispatch } = useApp();
  const [calcId, setCalcId] = useState<string>('');

  const calcFestival = state.festivals.find((f) => f.id === calcId);

  function add() {
    const f: FestivalSubmission = {
      id: newId('fest'),
      name: 'New festival',
      city: '',
      country: '',
      status: 'target',
      notes: '',
    };
    dispatch({ type: 'ADD_FESTIVAL', festival: f });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Festival submissions
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Pre-loaded shortlist. Edit fits, deadlines, and statuses inline.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
        >
          <Plus size={11} />
          Add festival
        </button>
      </header>

      <FilterableRegister
        rows={state.festivals}
        rowId={(f) => f.id}
        defaultSortKey="deadline"
        defaultSortDir="asc"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: STATUSES.map((s) => ({ value: s, label: s })),
            match: (f, v) => f.status === v,
          },
        ]}
        columns={[
          {
            key: 'name',
            label: 'Festival',
            width: 'minmax(180px, 1fr)',
            render: (f) => (
              <div>
                <EditableText
                  value={f.name}
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_FESTIVAL',
                      id: f.id,
                      patch: { name: v },
                    })
                  }
                  className="display-italic text-[15px] text-[color:var(--color-on-paper)]"
                />
                <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                  {[f.city, f.country].filter(Boolean).join(' · ')}
                </div>
              </div>
            ),
            sortValue: (f) => f.name.toLowerCase(),
          },
          {
            key: 'category',
            label: 'Category',
            width: '180px',
            render: (f) => (
              <EditableText
                value={f.category ?? ''}
                onChange={(v) =>
                  dispatch({
                    type: 'UPDATE_FESTIVAL',
                    id: f.id,
                    patch: { category: v },
                  })
                }
                placeholder="—"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
              />
            ),
          },
          {
            key: 'deadline',
            label: 'Deadline',
            width: '130px',
            render: (f) => (
              <input
                type="date"
                value={f.deadline ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_FESTIVAL',
                    id: f.id,
                    patch: { deadline: e.target.value || undefined },
                  })
                }
                className="bg-transparent prose-body italic text-[12px] text-[color:var(--color-on-paper)] outline-none"
              />
            ),
            sortValue: (f) => f.deadline ?? '~',
          },
          {
            key: 'fee',
            label: 'Fee €',
            width: '70px',
            align: 'right',
            render: (f) => (
              <input
                type="number"
                value={f.feeEur ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_FESTIVAL',
                    id: f.id,
                    patch: {
                      feeEur: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    },
                  })
                }
                className="bg-transparent display-italic text-[14px] text-[color:var(--color-on-paper)] outline-none tabular-nums text-right w-full"
              />
            ),
            sortValue: (f) => f.feeEur ?? 0,
          },
          {
            key: 'fit',
            label: 'Fit',
            width: '110px',
            render: (f) => (
              <FitStars
                fit={f.fitScore ?? 0}
                onChange={(v) =>
                  dispatch({
                    type: 'UPDATE_FESTIVAL',
                    id: f.id,
                    patch: { fitScore: v },
                  })
                }
              />
            ),
            sortValue: (f) => f.fitScore ?? 0,
          },
          {
            key: 'status',
            label: 'Status',
            width: '120px',
            render: (f) => (
              <select
                value={f.status}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_FESTIVAL',
                    id: f.id,
                    patch: { status: e.target.value as FestivalStatus },
                  })
                }
                className={`bg-transparent label-caps border-[0.5px] border-current rounded-full px-2 py-[1px] outline-none ${STATUS_TONE[f.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ),
            sortValue: (f) => f.status,
          },
          {
            key: 'actions',
            label: '',
            width: '40px',
            align: 'right',
            render: (f) => (
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: 'DELETE_FESTIVAL', id: f.id })
                }
                aria-label="Delete festival"
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] p-1"
              >
                <Trash2 size={12} />
              </button>
            ),
          },
        ]}
        emptyMessage="No festivals yet."
      />

      {/* Fit calculator — pick a festival to score on 5 axes */}
      <section className="pt-7 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
              Festival fit calculator
            </h3>
            <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              Pick a festival → score on 5 axes → get a verdict before paying the fee
            </p>
          </div>
          <select
            value={calcId}
            onChange={(e) => setCalcId(e.target.value)}
            className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[15px] text-[color:var(--color-on-paper)] py-1 min-w-[200px]"
          >
            <option value="">— pick a festival —</option>
            {state.festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </header>
        {calcFestival ? (
          <FestivalFitCalculator festival={calcFestival} />
        ) : (
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-5 py-6 text-center">
            Pick a festival above to score it · 1–5 across programming · territory · timing ·
            prestige · access. Verdict reads as submit / consider / pass.
          </p>
        )}
      </section>
    </div>
  );
}

function FitStars({
  fit,
  onChange,
}: {
  fit: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === fit ? 0 : n)}
          className={
            n <= fit
              ? 'text-[color:var(--color-brass)]'
              : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)]'
          }
        >
          <Star size={11} fill={n <= fit ? 'currentColor' : 'transparent'} />
        </button>
      ))}
    </div>
  );
}
