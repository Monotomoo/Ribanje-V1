import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  ApplicationStatus,
  FundingApplication,
} from '../../types';
import { LongFormEditor } from '../primitives/LongFormEditor';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import { newId } from '../episode/shared';

const STATUSES: ApplicationStatus[] = [
  'planning',
  'drafting',
  'submitted',
  'won',
  'declined',
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  planning: 'text-[color:var(--color-on-paper-muted)]',
  drafting: 'text-[color:var(--color-warn)]',
  submitted: 'text-[color:var(--color-brass-deep)]',
  won: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-coral-deep)]',
};

export function Applications() {
  const { state, dispatch } = useApp();
  const [activeId, setActiveId] = useState<string | null>(
    state.applications[0]?.id ?? null
  );

  function add() {
    const a: FundingApplication = {
      id: newId('app'),
      name: 'New application',
      funder: '',
      status: 'planning',
      draftSections: [
        { id: newId('lf'), label: 'Section 1', body: '' },
      ],
      notes: '',
    };
    dispatch({ type: 'ADD_APPLICATION', application: a });
    setActiveId(a.id);
  }

  const active = state.applications.find((a) => a.id === activeId);

  return (
    <div className="space-y-7">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Funding applications
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            HAVC dev / prod, EU MEDIA, HRT, Filming-in-Croatia rebate. Drafts saved per application.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
        >
          <Plus size={11} />
          New application
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-6">
        {/* Application sidebar */}
        <aside>
          <ul className="space-y-2">
            {state.applications.map((a) => {
              const isActive = a.id === activeId;
              const days = a.deadline
                ? Math.ceil(
                    (new Date(a.deadline + 'T00:00:00Z').getTime() -
                      Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(a.id)}
                    className={`w-full text-left px-4 py-3 rounded-[3px] transition-colors ${
                      isActive
                        ? 'bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-brass)]'
                        : 'bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)]'
                    }`}
                  >
                    <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] leading-tight">
                      {a.name}
                    </div>
                    <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                      {a.funder}
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                      <span
                        className={`label-caps border-[0.5px] border-current rounded-full px-2 py-[1px] ${STATUS_TONE[a.status]}`}
                      >
                        {a.status}
                      </span>
                      {days !== null && (
                        <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] tabular-nums">
                          {days >= 0 ? `${days}d` : 'past'}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Active application detail */}
        {active ? (
          <ApplicationDetail key={active.id} application={active} />
        ) : (
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
            Pick or create an application.
          </p>
        )}
      </div>
    </div>
  );
}

function ApplicationDetail({
  application,
}: {
  application: FundingApplication;
}) {
  const { dispatch } = useApp();
  function patch(p: Partial<FundingApplication>) {
    dispatch({ type: 'UPDATE_APPLICATION', id: application.id, patch: p });
  }
  return (
    <article className="space-y-6">
      <header className="grid grid-cols-[1fr_180px_120px_140px_40px] gap-4 items-baseline pb-4 border-b-[0.5px] border-[color:var(--color-border-brass)]">
        <div>
          <EditableText
            value={application.name}
            onChange={(v) => patch({ name: v })}
            className="display-italic text-[24px] text-[color:var(--color-on-paper)]"
          />
          <EditableText
            value={application.funder}
            onChange={(v) => patch({ funder: v })}
            placeholder="Funder"
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-1"
          />
        </div>
        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
            Deadline
          </div>
          <input
            type="date"
            value={application.deadline ?? ''}
            onChange={(e) =>
              patch({ deadline: e.target.value || undefined })
            }
            className="bg-transparent prose-body italic text-[14px] text-[color:var(--color-on-paper)] outline-none"
          />
        </div>
        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
            Amount
          </div>
          <EditableNumber
            value={application.amountK ?? 0}
            onChange={(v) => patch({ amountK: v })}
            suffix=" k"
            size="sm"
            align="left"
          />
        </div>
        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
            Status
          </div>
          <select
            value={application.status}
            onChange={(e) =>
              patch({ status: e.target.value as ApplicationStatus })
            }
            className={`bg-transparent label-caps border-[0.5px] border-current rounded-full px-2 py-[1px] outline-none ${STATUS_TONE[application.status]}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete this application?')) {
              dispatch({ type: 'DELETE_APPLICATION', id: application.id });
            }
          }}
          aria-label="Delete application"
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] p-1 self-start"
        >
          <Trash2 size={13} />
        </button>
      </header>

      <LongFormEditor
        sections={application.draftSections}
        onChange={(next) => patch({ draftSections: next })}
        printable
      />

      <div className="pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
          Notes
        </div>
        <EditableText
          value={application.notes}
          onChange={(v) => patch({ notes: v })}
          multiline
          rows={3}
          placeholder="Anything else"
          className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
        />
      </div>
    </article>
  );
}
