import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Plus,
  Plane,
  Anchor,
  Music,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  Users,
  Building,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  Contract,
  ContractStatus,
  PermitCategory,
  PermitLegal,
  PermitStatus,
} from '../../types';

/* ---------- Permit & Legal Wall (Phase 12) ----------

   Cross-module legal compliance dashboard. Aggregates:
     • state.permits   (regulatory / government / insurance)
     • state.contracts (talent / location releases, music clearance, crew)

   into one wall view grouped by category. Red rows = "blocks shoot"
   flagged or expired; amber = pending; green = approved/signed.

   Why it matters: a producer can't shoot at a National Park without the
   permit signed. Talent can't appear without a release. The wall makes
   "what's still missing" obvious in one screen.

   Croatian-specific quick-add templates pre-populate common forms:
     - JOPPD monthly tax/social
     - P-1 income tax
     - Autorski ugovor (handled via Contracts crew)
     - HDS-ZAMP music clearance
     - Stari Grad Plain UNESCO permit
     - CARO drone permit
     - Production insurance / E&O
*/

const CATEGORY_META: Record<PermitCategory, { label: string; description: string; Icon: LucideIcon }> = {
  tax:             { label: 'Tax / payroll',     description: 'P-1 · JOPPD · autorski ugovor declarations', Icon: FileText },
  location:        { label: 'Location permits',  description: 'national parks · public spaces · harbours',  Icon: Building },
  drone:           { label: 'Drone',             description: 'CARO airspace authorisation',                Icon: Plane },
  maritime:        { label: 'Maritime',          description: 'charter · captain · port permissions',       Icon: Anchor },
  insurance:       { label: 'Insurance',         description: 'equipment · E&O · production · liability',   Icon: Shield },
  'music-rights':  { label: 'Music rights',      description: 'HDS-ZAMP · mechanical · sync licenses',      Icon: Music },
  'talent-release':{ label: 'Talent releases',   description: 'subject + interview consents',               Icon: User },
  broadcast:       { label: 'Broadcast / delivery', description: 'HRT spec · network compliance',           Icon: ShieldAlert },
  other:           { label: 'Other',             description: 'anything that doesn\'t fit above',           Icon: FileText },
};

const STATUS_TONE: Record<PermitStatus, { bg: string; fg: string; ring: string; label: string }> = {
  'not-started':  { bg: 'var(--color-paper-deep)',   fg: 'var(--color-on-paper-muted)', ring: 'var(--color-border-paper)',   label: 'not started' },
  'in-progress':  { bg: 'var(--color-brass)',         fg: 'var(--color-paper-light)',    ring: 'var(--color-brass)',           label: 'in progress' },
  'submitted':    { bg: 'var(--color-on-paper)',      fg: 'var(--color-paper-light)',    ring: 'var(--color-on-paper)',        label: 'submitted' },
  'approved':     { bg: 'var(--color-success)',       fg: 'var(--color-paper-light)',    ring: 'var(--color-success)',         label: 'approved' },
  'expired':      { bg: 'var(--color-coral-deep)',    fg: 'var(--color-paper-light)',    ring: 'var(--color-coral-deep)',      label: 'expired' },
  'denied':       { bg: 'var(--color-coral-deep)',    fg: 'var(--color-paper-light)',    ring: 'var(--color-coral-deep)',      label: 'denied' },
};

const CONTRACT_STATUS_TONE: Record<ContractStatus, { bg: string; fg: string; label: string }> = {
  drafted:  { bg: 'var(--color-paper-deep)',   fg: 'var(--color-on-paper-muted)', label: 'drafted' },
  sent:     { bg: 'var(--color-brass)',         fg: 'var(--color-paper-light)',   label: 'sent' },
  signed:   { bg: 'var(--color-success)',       fg: 'var(--color-paper-light)',   label: 'signed' },
  expired:  { bg: 'var(--color-coral-deep)',    fg: 'var(--color-paper-light)',   label: 'expired' },
};

const CROATIAN_TEMPLATES: Array<{ category: PermitCategory; label: string; authority?: string; jurisdiction?: string; blocksShoot?: boolean }> = [
  { category: 'tax',            label: 'JOPPD monthly report',                  authority: 'Porezna uprava',                jurisdiction: 'HR' },
  { category: 'tax',            label: 'P-1 income tax declaration',            authority: 'Porezna uprava',                jurisdiction: 'HR' },
  { category: 'location',       label: 'Stari Grad Plain UNESCO permit',         authority: 'Ministarstvo kulture',           jurisdiction: 'HR', blocksShoot: true },
  { category: 'location',       label: 'National park / Mljet permit',           authority: 'Javna ustanova nacionalni parkovi', jurisdiction: 'HR', blocksShoot: true },
  { category: 'location',       label: 'Hvar harbour shooting permit',           authority: 'Lučka uprava Hvar',             jurisdiction: 'HR' },
  { category: 'drone',          label: 'CARO drone permit',                      authority: 'Hrvatska agencija za civilno zrakoplovstvo', jurisdiction: 'HR', blocksShoot: true },
  { category: 'maritime',       label: 'Charter boat license',                   authority: 'Lučka kapetanija',               jurisdiction: 'HR', blocksShoot: true },
  { category: 'maritime',       label: 'Captain certification (Luka)',           jurisdiction: 'HR' },
  { category: 'insurance',      label: 'Equipment insurance',                    blocksShoot: true },
  { category: 'insurance',      label: 'E&O insurance',                          blocksShoot: true },
  { category: 'insurance',      label: 'Production liability',                   blocksShoot: true },
  { category: 'music-rights',   label: 'HDS-ZAMP master clearance',              authority: 'HDS-ZAMP',                      jurisdiction: 'HR' },
  { category: 'broadcast',      label: 'HRT delivery spec compliance',           authority: 'HRT',                            jurisdiction: 'HR' },
];

interface Props {
  compact?: boolean;
}

export function PermitLegalWall({ compact = false }: Props) {
  const { state, dispatch } = useApp();
  const [filterCat, setFilterCat] = useState<PermitCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'blocking' | 'open' | 'done'>('all');
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredPermits = useMemo(() => {
    return state.permits.filter((p) => {
      if (filterCat !== 'all' && p.category !== filterCat) return false;
      if (filterStatus === 'blocking') {
        return p.blocksShoot && (p.status !== 'approved');
      }
      if (filterStatus === 'open') {
        return p.status !== 'approved' && p.status !== 'denied';
      }
      if (filterStatus === 'done') {
        return p.status === 'approved';
      }
      return true;
    });
  }, [state.permits, filterCat, filterStatus]);

  const blockingPermits = useMemo(
    () => state.permits.filter((p) => p.blocksShoot && p.status !== 'approved'),
    [state.permits]
  );
  const expiredPermits = useMemo(
    () => state.permits.filter((p) => p.status === 'expired' || p.status === 'denied'),
    [state.permits]
  );

  /* Group permits by category. */
  const byCategory = useMemo(() => {
    const m = new Map<PermitCategory, PermitLegal[]>();
    filteredPermits.forEach((p) => {
      if (!m.has(p.category)) m.set(p.category, []);
      m.get(p.category)?.push(p);
    });
    return m;
  }, [filteredPermits]);

  /* Pull contracts that are legal-relevant for cross-module surfacing. */
  const legalContracts = useMemo(() => {
    return state.contracts.filter((c) =>
      ['talent-release', 'location-release', 'music-clearance'].includes(c.type)
    );
  }, [state.contracts]);

  function addFromTemplate(tpl: (typeof CROATIAN_TEMPLATES)[number]) {
    const permit: PermitLegal = {
      id: `permit-${Math.random().toString(36).slice(2, 8)}`,
      category: tpl.category,
      label: tpl.label,
      authority: tpl.authority,
      jurisdiction: tpl.jurisdiction,
      blocksShoot: tpl.blocksShoot,
      status: 'not-started',
    };
    dispatch({ type: 'ADD_PERMIT', permit });
    setShowTemplates(false);
  }

  function addBlank(category?: PermitCategory) {
    const permit: PermitLegal = {
      id: `permit-${Math.random().toString(36).slice(2, 8)}`,
      category: category ?? 'other',
      label: 'New permit',
      status: 'not-started',
    };
    dispatch({ type: 'ADD_PERMIT', permit });
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Shield
              size={14}
              className={
                blockingPermits.length || expiredPermits.length
                  ? 'text-[color:var(--color-coral-deep)]'
                  : 'text-[color:var(--color-success)]'
              }
            />
            Permit &amp; legal wall
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
            {state.permits.length} permits · {legalContracts.length} legal contracts
            {blockingPermits.length > 0 && (
              <>
                {' · '}
                <span className="text-[color:var(--color-coral-deep)]">
                  {blockingPermits.length} blocking shoot
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-paper-deep)] hover:bg-[color:var(--color-brass)]/15 text-[11px] transition-colors"
          >
            <Plus size={11} />
            <span className="prose-body italic">add from template</span>
          </button>
          <button
            type="button"
            onClick={() => addBlank()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper)] text-[11px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
          >
            <Plus size={11} />
            <span className="prose-body italic">blank</span>
          </button>
        </div>
      </header>

      {/* Filter bar */}
      {!compact && state.permits.length > 0 && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <Filter size={12} className="text-[color:var(--color-on-paper-muted)]" />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as PermitCategory | 'all')}
            className="px-2 py-1 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          >
            <option value="all">all categories</option>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            {(['all', 'blocking', 'open', 'done'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`label-caps text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                  filterStatus === s
                    ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)]'
                    : 'text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-paper-deep)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates picker */}
      {showTemplates && (
        <div className="mb-3 p-3 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-brass)]/40">
          <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] mb-2 flex items-center justify-between">
            Common Croatian templates
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CROATIAN_TEMPLATES.map((tpl, i) => {
              const M = CATEGORY_META[tpl.category];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => addFromTemplate(tpl)}
                  className="flex items-start gap-2 text-left px-2 py-1.5 rounded-[3px] hover:bg-[color:var(--color-brass)]/10 transition-colors"
                >
                  <M.Icon size={11} className="text-[color:var(--color-brass-deep)] mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] leading-tight">
                      {tpl.label}
                      {tpl.blocksShoot && (
                        <span className="ml-1 prose-body italic text-[9px] text-[color:var(--color-coral-deep)]">
                          ·blocks
                        </span>
                      )}
                    </div>
                    {tpl.authority && (
                      <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] truncate">
                        {tpl.authority}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Blocking-shoot strip — always visible at top */}
      {blockingPermits.length > 0 && (
        <div className="mb-3 p-3 rounded-[3px] bg-[color:var(--color-coral-deep)]/10 border-[0.5px] border-[color:var(--color-coral-deep)]/40">
          <div className="display-italic text-[13px] text-[color:var(--color-coral-deep)] mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            Blocking shoot — must clear before October
          </div>
          <ul className="space-y-1">
            {blockingPermits.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between prose-body italic text-[12px]">
                <span className="text-[color:var(--color-on-paper)]">{p.label}</span>
                <span className="label-caps text-[9px] text-[color:var(--color-coral-deep)] tabular-nums">
                  {STATUS_TONE[p.status].label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {state.permits.length === 0 && legalContracts.length === 0 && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-4">
          No permits or legal contracts yet. Click "add from template" for common
          Croatian forms (JOPPD, CARO drone, location permits, insurance, HDS-ZAMP).
        </div>
      )}

      {/* By-category groups */}
      {Array.from(byCategory.entries()).map(([cat, items]) => {
        const M = CATEGORY_META[cat];
        return (
          <div key={cat} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <M.Icon size={11} className="text-[color:var(--color-on-paper-muted)]" />
              <span className="display-italic text-[12px] text-[color:var(--color-on-paper)]">
                {M.label}
              </span>
              <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
                {items.length}
              </span>
              <button
                type="button"
                onClick={() => addBlank(cat)}
                className="ml-auto text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] transition-colors"
                title={`Add ${M.label} item`}
              >
                <Plus size={11} />
              </button>
            </div>
            <ul className="space-y-1.5">
              {items.map((p) => (
                <PermitRow
                  key={p.id}
                  permit={p}
                  onPatch={(patch) => dispatch({ type: 'UPDATE_PERMIT', id: p.id, patch })}
                  onRemove={() => {
                    if (window.confirm(`Remove "${p.label}"?`)) {
                      dispatch({ type: 'DELETE_PERMIT', id: p.id });
                    }
                  }}
                  locations={state.locations}
                  crew={state.crew}
                />
              ))}
            </ul>
          </div>
        );
      })}

      {/* Legal contracts cross-reference */}
      {!compact && legalContracts.length > 0 && (
        <div className="mt-4 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] mb-2 flex items-center gap-2">
            <Users size={11} className="text-[color:var(--color-brass-deep)]" />
            Cross-referenced contracts
            <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
              from Contracts module
            </span>
          </div>
          <ul className="space-y-1.5">
            {legalContracts.map((c) => (
              <ContractRow key={c.id} contract={c} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ---------- Permit row ---------- */

function PermitRow({
  permit,
  onPatch,
  onRemove,
  locations,
  crew,
}: {
  permit: PermitLegal;
  onPatch: (p: Partial<PermitLegal>) => void;
  onRemove: () => void;
  locations: { id: string; label: string }[];
  crew: { id: string; name: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const tone = STATUS_TONE[permit.status];
  const owner = permit.ownerId ? crew.find((c) => c.id === permit.ownerId) : null;
  const loc = permit.locationId ? locations.find((l) => l.id === permit.locationId) : null;

  return (
    <li
      className={`rounded-[3px] border-l-[3px] bg-[color:var(--color-paper)] transition-colors ${
        permit.blocksShoot && permit.status !== 'approved'
          ? 'border-l-[color:var(--color-coral-deep)]'
          : permit.status === 'approved'
          ? 'border-l-[color:var(--color-success)]'
          : 'border-l-[color:var(--color-border-paper)]'
      }`}
    >
      <div
        className="px-2.5 py-1.5 flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <input
          type="text"
          value={permit.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-[12px] display-italic text-[color:var(--color-on-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] rounded-[2px] px-1"
        />
        {permit.blocksShoot && permit.status !== 'approved' && (
          <span title="Blocks shoot">
            <AlertTriangle
              size={11}
              className="text-[color:var(--color-coral-deep)] shrink-0"
            />
          </span>
        )}
        <select
          value={permit.status}
          onChange={(e) => onPatch({ status: e.target.value as PermitStatus })}
          onClick={(e) => e.stopPropagation()}
          className="px-1.5 py-0.5 rounded-[2px] text-[10px] label-caps tabular-nums focus:outline-none border-[0.5px]"
          style={{
            background: tone.bg,
            color: tone.fg,
            borderColor: tone.ring,
          }}
        >
          {(Object.keys(STATUS_TONE) as PermitStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_TONE[s].label}</option>
          ))}
        </select>
      </div>

      {expanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t-[0.5px] border-[color:var(--color-border-paper)] space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Field label="authority">
              <input
                type="text"
                value={permit.authority ?? ''}
                onChange={(e) => onPatch({ authority: e.target.value || undefined })}
                placeholder="Ministarstvo kulture"
                className="w-full px-1.5 py-0.5 text-[11px] rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </Field>
            <Field label="application date">
              <input
                type="date"
                value={permit.applicationDate ?? ''}
                onChange={(e) => onPatch({ applicationDate: e.target.value || undefined })}
                className="w-full px-1.5 py-0.5 text-[11px] tabular-nums rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </Field>
            <Field label="expiry">
              <input
                type="date"
                value={permit.expiryDate ?? ''}
                onChange={(e) => onPatch({ expiryDate: e.target.value || undefined })}
                className="w-full px-1.5 py-0.5 text-[11px] tabular-nums rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </Field>
            <Field label="owner">
              <select
                value={permit.ownerId ?? ''}
                onChange={(e) => onPatch({ ownerId: e.target.value || undefined })}
                className="w-full px-1.5 py-0.5 text-[11px] rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              >
                <option value="">—</option>
                {crew.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="location">
              <select
                value={permit.locationId ?? ''}
                onChange={(e) => onPatch({ locationId: e.target.value || undefined })}
                className="w-full px-1.5 py-0.5 text-[11px] rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              >
                <option value="">—</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </Field>
            <Field label="fee €">
              <input
                type="number"
                step="0.01"
                value={permit.feeEur ?? ''}
                onChange={(e) => onPatch({ feeEur: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-1.5 py-0.5 text-[11px] tabular-nums rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </Field>
          </div>
          <Field label="notes">
            <textarea
              value={permit.notes ?? ''}
              onChange={(e) => onPatch({ notes: e.target.value || undefined })}
              rows={2}
              className="w-full px-1.5 py-1 text-[11px] rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] resize-none"
              placeholder="Reference numbers, contact, deadlines"
            />
          </Field>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={permit.blocksShoot ?? false}
                onChange={(e) => onPatch({ blocksShoot: e.target.checked })}
              />
              blocks shoot
            </label>
            <div className="flex items-center gap-2 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
              {owner && <span className="flex items-center gap-1"><User size={9} />{owner.name}</span>}
              {loc && <span>· {loc.label}</span>}
              <button
                type="button"
                onClick={onRemove}
                className="text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral-deep)]/10 rounded-[2px] p-0.5"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- Contract row (read-only cross-ref) ---------- */

function ContractRow({ contract }: { contract: Contract }) {
  const tone = CONTRACT_STATUS_TONE[contract.status];
  return (
    <li className="flex items-baseline gap-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-1">
      <FileText size={10} className="text-[color:var(--color-on-paper-muted)] shrink-0" />
      <span className="flex-1 truncate">
        {contract.partyName}
        <span className="text-[color:var(--color-on-paper-faint)] ml-1.5 text-[10px] tabular-nums">
          {contract.type}
        </span>
      </span>
      <span
        className="label-caps text-[9px] px-1.5 py-0.5 rounded-[2px] tabular-nums"
        style={{ background: tone.bg, color: tone.fg }}
      >
        {tone.label}
      </span>
      {contract.dateDue && (
        <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          due {contract.dateDue}
        </span>
      )}
    </li>
  );
}

/* ---------- Field shim ---------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-muted)] mb-1 leading-tight">
        {label}
      </div>
      {children}
    </label>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { Clock, CheckCircle2 };
/* eslint-enable @typescript-eslint/no-unused-vars */
