import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../state/AppContext';
import type { Episode, EpisodeStatus } from '../../types';
import { Pill } from '../primitives/Pill';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import { StoryTab } from './StoryTab';
import { PeopleTab } from './PeopleTab';
import { SubjectTab } from './SubjectTab';
import { CraftTab } from './CraftTab';

const TABS = ['Story', 'People', 'Subject', 'Craft'] as const;
type Tab = (typeof TABS)[number];

const STATUS_CYCLE: EpisodeStatus[] = ['concept', 'scripted', 'shot', 'cut', 'locked'];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

interface Props {
  episodeId: string;
  onBack: () => void;
}

export function EpisodeHub({ episodeId, onBack }: Props) {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('Story');

  const ep = [...state.episodes, ...state.specials].find((e) => e.id === episodeId);
  if (!ep) {
    return (
      <div className="prose-body italic text-[color:var(--color-on-paper-muted)]">
        Episode not found.
      </div>
    );
  }
  const roman = ROMAN[ep.number] ?? String(ep.number);

  function patch(p: Partial<Episode>) {
    dispatch({ type: 'UPDATE_EPISODE', episodeId, patch: p });
  }

  function cycleStatus() {
    const i = STATUS_CYCLE.indexOf(ep!.status);
    const next = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
    patch({ status: next });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-9 max-w-[1400px]"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-brass-deep)] transition-colors"
      >
        <ArrowLeft size={12} />
        Episodes
      </button>

      <header>
        <div className="flex items-baseline gap-6">
          <span className="display-italic text-[40px] text-[color:var(--color-brass)] w-20 shrink-0">
            {roman}.
          </span>
          <div className="flex-1 min-w-0">
            <EditableText
              value={ep.title}
              onChange={(v) => patch({ title: v })}
              className="display-italic text-[44px] text-[color:var(--color-on-paper)] leading-tight"
            />
          </div>
          <button
            type="button"
            onClick={cycleStatus}
            className="shrink-0"
            title="cycle status"
          >
            <Pill variant={ep.status}>{ep.status}</Pill>
          </button>
        </div>
        <div className="flex items-baseline gap-4 mt-3 pl-[104px] flex-wrap">
          <span className="display-italic text-[15px] text-[color:var(--color-brass-deep)]">
            {ep.theme}
          </span>
          <span className="text-[color:var(--color-on-paper-faint)]">·</span>
          <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] flex-1 min-w-[200px]">
            <EditableText
              value={ep.anchor}
              onChange={(v) => patch({ anchor: v })}
              className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]"
            />
          </div>
          <span className="text-[color:var(--color-on-paper-faint)]">·</span>
          <EditableNumber
            value={ep.runtime}
            onChange={(v) => patch({ runtime: v })}
            suffix=" min"
            size="sm"
          />
        </div>
      </header>

      {/* Tab strip */}
      <div className="flex items-baseline gap-1 border-b-[0.5px] border-[color:var(--color-border-paper)]">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative px-5 py-3 transition-colors duration-150 ${
                active
                  ? 'text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[22px]'
                    : 'font-sans text-[12px] tracking-[0.16em] uppercase'
                }
              >
                {t}
              </span>
              {active && (
                <span className="absolute bottom-[-0.5px] left-3 right-3 h-[2px] bg-[color:var(--color-brass)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'Story' && <StoryTab episodeId={ep.id} />}
        {tab === 'People' && <PeopleTab episodeId={ep.id} />}
        {tab === 'Subject' && <SubjectTab episodeId={ep.id} />}
        {tab === 'Craft' && <CraftTab episodeId={ep.id} />}
      </div>
    </motion.div>
  );
}
