import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Contract, ContractStatus, ContractType } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { newId } from '../episode/shared';
import { PermitLegalWall } from '../legal/PermitLegalWall';

const TYPES: ContractType[] = [
  'talent-release',
  'location-release',
  'music-clearance',
  'sponsor',
  'crew',
  'other',
];

const TYPE_LABEL: Record<ContractType, string> = {
  'talent-release': 'Talent release',
  'location-release': 'Location release',
  'music-clearance': 'Music clearance',
  sponsor: 'Sponsor',
  crew: 'Crew',
  other: 'Other',
};

const STATUSES: ContractStatus[] = ['drafted', 'sent', 'signed', 'expired'];

const STATUS_TONE: Record<ContractStatus, string> = {
  drafted: 'text-[color:var(--color-on-paper-muted)]',
  sent: 'text-[color:var(--color-warn)]',
  signed: 'text-[color:var(--color-success)]',
  expired: 'text-[color:var(--color-coral-deep)]',
};

export function ContractsView() {
  const { state, dispatch } = useApp();

  function add() {
    const contract: Contract = {
      id: newId('ct'),
      type: 'talent-release',
      partyName: 'New party',
      episodeId: 'general',
      status: 'drafted',
      notes: '',
    };
    dispatch({ type: 'ADD_CONTRACT', contract });
  }

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Contracts &amp; legal
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Releases, clearances, permits, insurance — the paperwork that keeps the show shootable.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
        >
          <Plus size={11} />
          New contract
        </button>
      </div>

      {/* Permit & Legal Wall — Phase 12 (cross-cutting view above the contract table) */}
      <PermitLegalWall />

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        <header className="grid grid-cols-[180px_1fr_180px_140px_140px_40px] items-baseline gap-4 px-6 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] label-caps text-[color:var(--color-on-paper-faint)]">
          <span>Type</span>
          <span>Party</span>
          <span>Episode</span>
          <span>Due</span>
          <span>Status</span>
          <span />
        </header>
        <div>
          {state.contracts.length === 0 && (
            <div className="px-6 py-12 text-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
              No contracts logged yet.
            </div>
          )}
          {state.contracts.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContractRow({ contract }: { contract: Contract }) {
  const { state, dispatch } = useApp();
  function patch(p: Partial<Contract>) {
    dispatch({ type: 'UPDATE_CONTRACT', id: contract.id, patch: p });
  }
  function cycleStatus() {
    const i = STATUSES.indexOf(contract.status);
    patch({ status: STATUSES[(i + 1) % STATUSES.length] });
  }

  return (
    <div className="grid grid-cols-[180px_1fr_180px_140px_140px_40px] items-baseline gap-4 px-6 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 group">
      <select
        value={contract.type}
        onChange={(e) => patch({ type: e.target.value as ContractType })}
        className="bg-transparent prose-body italic text-[13px] text-[color:var(--color-on-paper)] outline-none focus:bg-[color:var(--color-paper-card)] py-0.5 -ml-1 px-1 rounded-[2px]"
      >
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABEL[t]}
          </option>
        ))}
      </select>

      <EditableText
        value={contract.partyName}
        onChange={(v) => patch({ partyName: v })}
        className="display-italic text-[15px] text-[color:var(--color-on-paper)]"
      />

      <select
        value={contract.episodeId ?? 'general'}
        onChange={(e) => patch({ episodeId: e.target.value })}
        className="bg-transparent prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] outline-none focus:bg-[color:var(--color-paper-card)] py-0.5 -ml-1 px-1 rounded-[2px]"
      >
        <option value="general">All / general</option>
        {state.episodes.map((e) => (
          <option key={e.id} value={e.id}>
            Ep {e.number} · {e.title}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={contract.dateDue ?? ''}
        onChange={(e) => patch({ dateDue: e.target.value || undefined })}
        className="bg-transparent prose-body italic text-[13px] text-[color:var(--color-on-paper)] outline-none py-0.5"
      />

      <button
        type="button"
        onClick={cycleStatus}
        className={`label-caps border-[0.5px] border-current rounded-full px-2.5 py-[2px] hover:opacity-80 transition-opacity justify-self-start ${STATUS_TONE[contract.status]}`}
      >
        {contract.status}
      </button>

      <button
        type="button"
        onClick={() => dispatch({ type: 'DELETE_CONTRACT', id: contract.id })}
        aria-label="Delete contract"
        className="opacity-0 group-hover:opacity-100 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-all p-1 justify-self-end"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
