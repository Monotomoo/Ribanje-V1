import { useApp } from '../../state/AppContext';
import { EditableText } from '../primitives/EditableText';
import { Pill } from '../primitives/Pill';
import {
  AddButton,
  DeleteButton,
  EmptyState,
  EntityCard,
  Field,
  SectionHeader,
  newId,
} from './shared';
import type { Talent, TalentStatus } from '../../types';

const STATUS_CYCLE: TalentStatus[] = ['prospect', 'contacted', 'confirmed', 'declined'];

function variantFor(s: TalentStatus) {
  if (s === 'confirmed') return 'committed' as const;
  if (s === 'contacted') return 'contacted' as const;
  if (s === 'declined') return 'cut' as const;
  return 'prospect' as const;
}

export function PeopleTab({ episodeId }: { episodeId: string }) {
  const { state, dispatch } = useApp();
  const talents = state.talents.filter(
    (t) => t.episodeId === episodeId || t.episodeId === 'general'
  );

  function add() {
    const t: Talent = {
      id: newId('tal'),
      name: 'New person',
      role: '',
      episodeId,
      location: '',
      status: 'prospect',
      whyThem: '',
      notes: '',
    };
    dispatch({ type: 'ADD_TALENT', talent: t });
  }

  return (
    <div>
      <SectionHeader
        title="Talent pipeline"
        count={talents.length}
        action={<AddButton label="Add person" onClick={add} />}
      />
      {talents.length === 0 && (
        <EmptyState
          message="No people logged for this episode yet."
          hint="Elders, klapa singers, lighthouse keepers, fishermen — anyone you want on camera."
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        {talents.map((t) => (
          <TalentCard key={t.id} talent={t} />
        ))}
      </div>
    </div>
  );
}

function TalentCard({ talent }: { talent: Talent }) {
  const { dispatch } = useApp();
  function patch(p: Partial<Talent>) {
    dispatch({ type: 'UPDATE_TALENT', id: talent.id, patch: p });
  }
  function cycleStatus() {
    const i = STATUS_CYCLE.indexOf(talent.status);
    patch({ status: STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length] });
  }

  return (
    <EntityCard>
      <div className="flex items-baseline gap-3">
        <div className="flex-1 min-w-0">
          <EditableText
            value={talent.name}
            onChange={(v) => patch({ name: v })}
            className="display-italic text-[20px] text-[color:var(--color-on-paper)]"
          />
          <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            <EditableText
              value={talent.role}
              onChange={(v) => patch({ role: v })}
              placeholder="Role / identity"
            />
          </div>
        </div>
        <button type="button" onClick={cycleStatus} title="cycle status">
          <Pill variant={variantFor(talent.status)}>{talent.status}</Pill>
        </button>
        <DeleteButton onClick={() => dispatch({ type: 'DELETE_TALENT', id: talent.id })} />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Field label="Location">
          <EditableText
            value={talent.location}
            onChange={(v) => patch({ location: v })}
            placeholder="Island / town"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Contact">
          <EditableText
            value={talent.contact ?? ''}
            onChange={(v) => patch({ contact: v })}
            placeholder="Phone / email / introducer"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
      </div>
      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Why them">
          <EditableText
            value={talent.whyThem}
            onChange={(v) => patch({ whyThem: v })}
            multiline
            rows={2}
            placeholder="What does this person bring to the episode?"
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
          />
        </Field>
      </div>
    </EntityCard>
  );
}
