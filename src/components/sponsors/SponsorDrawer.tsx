import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  OutreachChannel,
  OutreachContact,
  Sponsor,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import { Pill } from '../primitives/Pill';
import { VariationStack } from '../primitives/VariationStack';
import { newId } from '../episode/shared';
import { SponsorROI } from './SponsorROI';

const CHANNELS: OutreachChannel[] = [
  'email',
  'phone',
  'intro',
  'meeting',
  'event',
  'other',
];

interface Props {
  sponsor: Sponsor | null;
  onClose: () => void;
}

export function SponsorDrawer({ sponsor, onClose }: Props) {
  const { state, dispatch } = useApp();

  if (!sponsor) {
    return <AnimatePresence>{null}</AnimatePresence>;
  }

  const outreach = state.outreachContacts
    .filter((c) => c.sponsorId === sponsor.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  function patch(p: Partial<Sponsor>) {
    if (!sponsor) return;
    dispatch({ type: 'UPDATE_SPONSOR', id: sponsor.id, patch: p });
  }

  function addOutreach() {
    if (!sponsor) return;
    const contact: OutreachContact = {
      id: newId('out'),
      sponsorId: sponsor.id,
      date: new Date().toISOString().slice(0, 10),
      channel: 'email',
      reachedOut: 'Tomislav Kovacic',
      response: '',
    };
    dispatch({ type: 'ADD_OUTREACH', contact });
  }

  function toggleEpisode(epId: string) {
    if (!sponsor) return;
    const current = sponsor.episodeIds ?? [];
    const next = current.includes(epId)
      ? current.filter((x) => x !== epId)
      : [...current, epId];
    patch({ episodeIds: next });
  }

  return (
    <AnimatePresence>
      <motion.button
        key="backdrop"
        type="button"
        aria-label="close"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[color:var(--color-chrome)]/30 z-40"
      />
      <motion.aside
        key={sponsor.id}
        initial={{ x: 520 }}
        animate={{ x: 0 }}
        exit={{ x: 520 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 bottom-0 w-[520px] bg-[color:var(--color-paper-card)] border-l-[0.5px] border-[color:var(--color-border-paper-strong)] z-50 flex flex-col"
      >
        <header className="flex items-start justify-between px-7 pt-7 pb-5 border-b-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1.5">
              <Pill
                variant={
                  sponsor.tier === 1 ? 'shot' : sponsor.tier === 2 ? 'pitched' : 'concept'
                }
              >
                tier {sponsor.tier === 1 ? 'i' : sponsor.tier === 2 ? 'ii' : 'iii'}
              </Pill>
              <span className="label-caps text-[color:var(--color-on-paper-faint)]">
                {sponsor.status}
              </span>
            </div>
            <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
              <EditableText
                value={sponsor.name}
                onChange={(v) => patch({ name: v })}
                className="display-italic text-[28px] text-[color:var(--color-on-paper)]"
              />
            </h2>
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-1">
              <EditableText
                value={sponsor.category}
                onChange={(v) => patch({ category: v })}
                placeholder="Category / sector"
              />
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-7">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Expected">
              <EditableNumber
                value={sponsor.expectedAmount}
                onChange={(v) => patch({ expectedAmount: v })}
                suffix=" k"
                size="md"
                align="left"
              />
            </Field>
            <Field label="Tier">
              <select
                value={sponsor.tier}
                onChange={(e) =>
                  patch({ tier: parseInt(e.target.value, 10) as 1 | 2 | 3 })
                }
                className="bg-transparent display-italic text-[18px] text-[color:var(--color-on-paper)] outline-none py-0.5"
              >
                <option value={1}>I</option>
                <option value={2}>II</option>
                <option value={3}>III</option>
              </select>
            </Field>
            <Field label="Last contact">
              <span className="prose-body italic text-[14px] text-[color:var(--color-on-paper)]">
                {sponsor.lastContactDate ?? '—'}
              </span>
            </Field>
          </div>

          {/* Brief library */}
          <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)] space-y-4">
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
              Brief
            </h3>
            <Field label="Decision maker">
              <EditableText
                value={sponsor.decisionMaker ?? ''}
                onChange={(v) => patch({ decisionMaker: v })}
                placeholder="Who decides on their side?"
                className="prose-body text-[14px] text-[color:var(--color-on-paper)]"
              />
            </Field>
            <Field label="Value exchange (beyond money)">
              <EditableText
                value={sponsor.valueExchange ?? ''}
                onChange={(v) => patch({ valueExchange: v })}
                multiline
                rows={2}
                placeholder="Access · locations · integration · brand alignment"
                className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]"
              />
            </Field>
            <Field label="Brief / fit memo">
              <EditableText
                value={sponsor.briefNotes ?? ''}
                onChange={(v) => patch({ briefNotes: v })}
                multiline
                rows={4}
                placeholder="Long-form brief — fit, history, what they get, what we get."
                className="prose-body text-[13px] text-[color:var(--color-on-paper)] leading-[1.6]"
              />
            </Field>
            <Field label="Notes">
              <EditableText
                value={sponsor.notes}
                onChange={(v) => patch({ notes: v })}
                multiline
                rows={2}
                placeholder="Anything else"
                className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
              />
            </Field>
          </div>

          {/* Episode tie-ins */}
          <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-3">
              Episode tie-ins
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.episodes.map((ep) => {
                const active = (sponsor.episodeIds ?? []).includes(ep.id);
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => toggleEpisode(ep.id)}
                    className={`label-caps border-[0.5px] rounded-full px-3 py-1 transition-colors ${
                      active
                        ? 'border-[color:var(--color-brass)] text-[color:var(--color-brass-deep)] bg-[color:var(--color-paper-light)]'
                        : 'border-[color:var(--color-border-paper-strong)] text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
                    }`}
                  >
                    Ep {ep.number} · {ep.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROI + deliverables */}
          <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-3">
              ROI &amp; deliverables
            </h3>
            <SponsorROI sponsor={sponsor} />
          </div>

          {/* Outreach log */}
          <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <header className="flex items-baseline justify-between mb-3">
              <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
                Outreach log
              </h3>
              <button
                type="button"
                onClick={addOutreach}
                className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
              >
                <Plus size={11} />
                Log a contact
              </button>
            </header>
            {outreach.length === 0 ? (
              <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
                No outreach logged yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {outreach.map((c) => (
                  <OutreachRow key={c.id} contact={c} />
                ))}
              </ul>
            )}
          </div>

          {/* Pitchmaker */}
          <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-1">
              Pitchmaker
            </h3>
            <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3">
              Save tailored pitch text for {sponsor.name}. ⌘P to print all variants together.
            </p>
            <VariationStack
              category="sponsor-pitch"
              sponsorId={sponsor.id}
              rows={5}
              heading="Tailored pitch variants"
              emptyMessage="No tailored variants yet."
              placeholder={`Hello ${sponsor.decisionMaker ?? '—'},\n\n${sponsor.name} fits Ribanje where the show needs ${sponsor.category || 'an institutional partner'}…`}
            />
          </div>
        </div>

        <footer className="px-7 py-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this sponsor?')) {
                dispatch({ type: 'DELETE_SPONSOR', id: sponsor.id });
                onClose();
              }
            }}
            className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
          >
            delete sponsor
          </button>
        </footer>
      </motion.aside>
    </AnimatePresence>
  );
}

function OutreachRow({ contact }: { contact: OutreachContact }) {
  const { dispatch } = useApp();
  function patch(p: Partial<OutreachContact>) {
    dispatch({ type: 'UPDATE_OUTREACH', id: contact.id, patch: p });
  }
  return (
    <li className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3 group">
      <div className="grid grid-cols-3 gap-3 items-baseline mb-2">
        <input
          type="date"
          value={contact.date}
          onChange={(e) => patch({ date: e.target.value })}
          className="bg-transparent prose-body italic text-[13px] text-[color:var(--color-on-paper)] outline-none"
        />
        <select
          value={contact.channel}
          onChange={(e) => patch({ channel: e.target.value as OutreachChannel })}
          className="bg-transparent label-caps text-[color:var(--color-brass-deep)] outline-none"
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => dispatch({ type: 'DELETE_OUTREACH', id: contact.id })}
          className="opacity-0 group-hover:opacity-100 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] justify-self-end transition-all p-1"
          aria-label="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <Field label="Reached out">
          <EditableText
            value={contact.reachedOut}
            onChange={(v) => patch({ reachedOut: v })}
            placeholder="Who from our side"
            className="prose-body text-[12px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Contacted">
          <EditableText
            value={contact.contactedPerson ?? ''}
            onChange={(v) => patch({ contactedPerson: v })}
            placeholder="Who on their side"
            className="prose-body text-[12px] text-[color:var(--color-on-paper)]"
          />
        </Field>
      </div>
      <Field label="Response">
        <EditableText
          value={contact.response}
          onChange={(v) => patch({ response: v })}
          multiline
          rows={2}
          placeholder="What did they say?"
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Next step">
          <EditableText
            value={contact.nextStep ?? ''}
            onChange={(v) => patch({ nextStep: v })}
            placeholder="Follow up: …"
            className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Next date">
          <input
            type="date"
            value={contact.nextStepDate ?? ''}
            onChange={(e) => patch({ nextStepDate: e.target.value || undefined })}
            className="bg-transparent prose-body italic text-[12px] text-[color:var(--color-on-paper)] outline-none"
          />
        </Field>
      </div>
    </li>
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
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
