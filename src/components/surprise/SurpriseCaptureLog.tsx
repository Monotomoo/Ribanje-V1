import { useMemo, useState } from 'react';
import {
  Sparkles,
  Mic,
  MapPin,
  Clock,
  Tag,
  Trash2,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type {
  AntiScriptMoment,
  Episode,
  Location,
  VoiceMemo,
} from '../../types';
import { AudioRecorder } from '../primitives/AudioRecorder';

/* ---------- Surprise Capture Log (Phase 12) ----------

   THE documentary godlike. One-tap "we got something we didn't plan."

   Big capture button at the top. Tap it → creates a surprise AntiScriptMoment
   instantly with:
     • capturedAt = now
     • location = current shoot location
     • episodeId = active episode
     • status = 'captured'
     • orderIdx = end of beat list
     • isSurprise = true

   Then the moment is editable inline: title, who, beat tags, optional voice
   memo, optional promote-to-planned-beat (move into the spine).

   Voice memo: tap-and-hold or click to record (uses existing AudioRecorder
   primitive). Memo is stored in state.voiceMemos and linked via
   moment.voiceMemoId.

   Used in:
     · TodayTab (Production)        primary shoot-day surface
     · StoryTab (Episodes)          filter view of captured surprises
     · LiveRollCockpit               embedded near the beat strip */

const QUICK_TAGS = [
  'verse',
  'klapa',
  'storm',
  'catch',
  'meal',
  'elder',
  'sunrise',
  'sunset',
  'aerial',
  'observational',
] as const;

interface Props {
  episodeId?: string;        // active episode if known
  locationId?: string;       // active anchorage / location
  date?: string;             // ISO YYYY-MM-DD, defaults to today
  compact?: boolean;
}

export function SurpriseCaptureLog({
  episodeId,
  locationId,
  date,
  compact = false,
}: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [recordingFor, setRecordingFor] = useState<string | null>(null);

  /* Resolve active episode if not given. */
  const activeEpisode = useMemo<Episode | undefined>(() => {
    if (episodeId) {
      return [...state.episodes, ...state.specials].find((e) => e.id === episodeId);
    }
    /* Fallback: first concept episode. */
    return state.episodes[0];
  }, [episodeId, state.episodes, state.specials]);

  const surprises = useMemo<AntiScriptMoment[]>(() => {
    return state.antiScriptMoments
      .filter((m) => m.isSurprise)
      .filter((m) => !activeEpisode || m.episodeId === activeEpisode.id)
      .sort((a, b) => {
        const ta = a.capturedAt ?? '';
        const tb = b.capturedAt ?? '';
        return tb.localeCompare(ta);
      });
  }, [state.antiScriptMoments, activeEpisode]);

  const todaySurprises = useMemo(() => {
    if (!date) return surprises;
    return surprises.filter((m) => (m.capturedAt ?? '').startsWith(date));
  }, [surprises, date]);

  function captureNow() {
    if (!activeEpisode) return;
    const nowIso = new Date().toISOString();
    const orderIdx =
      Math.max(0, ...state.antiScriptMoments.map((m) => m.orderIdx)) + 1;
    const moment: AntiScriptMoment = {
      id: `mom-surprise-${Math.random().toString(36).slice(2, 8)}`,
      episodeId: activeEpisode.id,
      title: 'untitled surprise',
      who: '',
      what: '',
      where: '',
      whyItMatters: '',
      status: 'captured',
      orderIdx,
      isSurprise: true,
      capturedAt: nowIso,
      capturedAtLocationId: locationId,
      beatTags: [],
    };
    dispatch({ type: 'ADD_ANTI_SCRIPT', moment });
  }

  function patch(id: string, patchData: Partial<AntiScriptMoment>) {
    dispatch({ type: 'UPDATE_ANTI_SCRIPT', id, patch: patchData });
  }

  function remove(id: string) {
    if (!window.confirm('Remove this surprise capture?')) return;
    dispatch({ type: 'DELETE_ANTI_SCRIPT', id });
  }

  function promote(id: string) {
    /* Promote: convert to planned beat (lose the surprise flag, keep the entry). */
    patch(id, { isSurprise: false, status: 'captured' });
  }

  function attachVoiceMemo(
    momentId: string,
    audio: { base64: string; mimeType: string; durationMs: number; transcript?: string }
  ) {
    const memo: VoiceMemo = {
      id: `vm-surprise-${Math.random().toString(36).slice(2, 8)}`,
      recordedAt: new Date().toISOString(),
      durationMs: audio.durationMs,
      audioBase64: audio.base64,
      mimeType: audio.mimeType,
      transcript: audio.transcript,
      episodeId: activeEpisode?.id,
      scope: 'beat',
      label: 'surprise capture',
    };
    dispatch({ type: 'ADD_VOICE_MEMO', memo });
    patch(momentId, { voiceMemoId: memo.id });
    setRecordingFor(null);
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Sparkles size={14} className="text-[color:var(--color-brass)]" />
            {t('surprise.title')}
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {activeEpisode
              ? `Ep ${activeEpisode.number} · ${activeEpisode.title}`
              : t('surprise.empty')}
            {todaySurprises.length > 0 && (
              <>
                {' · '}
                <span className="tabular-nums">
                  {todaySurprises.length} {t('prod.today.captured')}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <button
        type="button"
        onClick={captureNow}
        disabled={!activeEpisode}
        className="w-full bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] disabled:opacity-40 disabled:cursor-not-allowed text-[color:var(--color-paper)] rounded-[3px] py-3 px-4 mb-3 transition-colors flex items-center justify-center gap-2 group"
      >
        <Sparkles
          size={18}
          className="group-hover:rotate-12 transition-transform"
        />
        <span className="display-italic text-[18px]">{t('surprise.capture.now')}</span>
        <span className="prose-body italic text-[11px] opacity-70">
          ({t('surprise.subtitle')})
        </span>
      </button>

      {(compact ? todaySurprises : surprises).length === 0 ? (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-2">
          {t('surprise.empty')}
        </div>
      ) : (
        <ul className="space-y-2">
          {(compact ? todaySurprises.slice(0, 3) : surprises).map((m) => (
            <SurpriseRow
              key={m.id}
              moment={m}
              locations={state.locations}
              voiceMemos={state.voiceMemos}
              recording={recordingFor === m.id}
              onPatch={(p) => patch(m.id, p)}
              onRemove={() => remove(m.id)}
              onPromote={() => promote(m.id)}
              onStartRecording={() => setRecordingFor(m.id)}
              onCancelRecording={() => setRecordingFor(null)}
              onAttachVoiceMemo={(a) => attachVoiceMemo(m.id, a)}
            />
          ))}
          {compact && todaySurprises.length > 3 && (
            <li className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] tabular-nums pt-1">
              + {todaySurprises.length - 3} more today
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

/* ---------- Single row ---------- */

interface RowProps {
  moment: AntiScriptMoment;
  locations: Location[];
  voiceMemos: VoiceMemo[];
  recording: boolean;
  onPatch: (p: Partial<AntiScriptMoment>) => void;
  onRemove: () => void;
  onPromote: () => void;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onAttachVoiceMemo: (a: {
    base64: string;
    mimeType: string;
    durationMs: number;
    transcript?: string;
  }) => void;
}

function SurpriseRow({
  moment,
  locations,
  voiceMemos,
  recording,
  onPatch,
  onRemove,
  onPromote,
  onStartRecording,
  onCancelRecording,
  onAttachVoiceMemo,
}: RowProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const loc = locations.find((l) => l.id === moment.capturedAtLocationId);
  const memo = voiceMemos.find((v) => v.id === moment.voiceMemoId);
  const tags = moment.beatTags ?? [];

  function toggleTag(tag: string) {
    const has = tags.includes(tag);
    const next = has ? tags.filter((t) => t !== tag) : [...tags, tag];
    onPatch({ beatTags: next });
  }

  return (
    <li className="rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)]">
      <div className="px-3 py-2 flex items-center gap-3">
        <Sparkles
          size={11}
          className="text-[color:var(--color-brass)] shrink-0"
        />
        <input
          type="text"
          value={moment.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          placeholder="what happened?"
          className="flex-1 bg-transparent text-[13px] display-italic text-[color:var(--color-on-paper)] focus:outline-none placeholder:text-[color:var(--color-on-paper-faint)]"
        />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
        >
          {expanded ? 'collapse' : 'expand'}
        </button>
      </div>

      <div className="px-3 pb-2 flex items-center gap-3 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
        <span className="flex items-center gap-1">
          <Clock size={9} />
          {fmtTime(moment.capturedAt)}
        </span>
        {loc && (
          <span className="flex items-center gap-1">
            <MapPin size={9} />
            {loc.label}
          </span>
        )}
        {tags.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag size={9} />
            {tags.join(' · ')}
          </span>
        )}
        {memo && <span className="text-[color:var(--color-brass-deep)]">voice memo</span>}
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t-[0.5px] border-[color:var(--color-border-paper)] space-y-3">
          {/* Quick fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <TextField
              label="who"
              value={moment.who}
              onChange={(v) => onPatch({ who: v })}
            />
            <TextField
              label="what"
              value={moment.what}
              onChange={(v) => onPatch({ what: v })}
            />
            <TextField
              label="why it matters"
              value={moment.whyItMatters}
              onChange={(v) => onPatch({ whyItMatters: v })}
            />
          </div>

          {/* Beat tags */}
          <div>
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1.5">
              {t('surprise.tag.beat')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2 py-0.5 rounded-[3px] text-[10px] display-italic transition-colors ${
                      on
                        ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper)]'
                        : 'bg-[color:var(--color-paper-deep)] text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice memo */}
          {memo ? (
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] flex items-center gap-2">
              <Mic size={11} className="text-[color:var(--color-brass-deep)]" />
              <audio controls src={memo.audioBase64} className="h-7 flex-1" />
              {memo.transcript && (
                <details className="ml-2">
                  <summary className="cursor-pointer text-[color:var(--color-on-paper-muted)] text-[10px]">
                    transcript
                  </summary>
                  <div className="mt-1 text-[11px] text-[color:var(--color-on-paper)]">
                    {memo.transcript}
                  </div>
                </details>
              )}
            </div>
          ) : recording ? (
            <div>
              <AudioRecorder
                onRecorded={(r) =>
                  onAttachVoiceMemo({
                    base64: r.base64,
                    mimeType: r.mimeType,
                    durationMs: r.durationMs,
                    transcript: r.transcript,
                  })
                }
                language="hr-HR"
                maxDurationSec={120}
                hint="capture a quick note about this moment"
              />
              <button
                type="button"
                onClick={onCancelRecording}
                className="mt-2 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)]"
              >
                cancel recording
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartRecording}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-brass)]/15 text-[color:var(--color-on-paper)] text-[11px] hover:bg-[color:var(--color-brass)]/25 transition-colors"
            >
              <Mic size={11} />
              <span className="prose-body italic">{t('surprise.add.memo')}</span>
            </button>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <button
              type="button"
              onClick={onPromote}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[10px] text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/10 transition-colors"
            >
              <ArrowUpRight size={11} />
              <span className="prose-body italic">{t('surprise.promote')}</span>
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[10px] text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral-deep)]/10 transition-colors"
            >
              <Trash2 size={11} />
              <span className="prose-body italic">delete</span>
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      />
    </label>
  );
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _checkUnused = Check;
/* eslint-enable @typescript-eslint/no-unused-vars */
