import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  AntiScriptMoment,
  Catch,
  JournalEntry,
  Meal,
  Note,
  NoteTargetType,
  Talent,
  Task,
} from '../../types';
import { newId } from '../episode/shared';

type DestinationKind =
  | 'note-global'
  | 'note-episode'
  | 'anti-script'
  | 'catch'
  | 'meal'
  | 'talent'
  | 'journal'
  | 'task';

interface Destination {
  kind: DestinationKind;
  label: string;
  needsEpisode: boolean;
}

const DESTINATIONS: Destination[] = [
  { kind: 'note-global', label: 'Note · global board',  needsEpisode: false },
  { kind: 'note-episode', label: 'Note · on an episode', needsEpisode: true },
  { kind: 'anti-script', label: 'Anti-script moment',    needsEpisode: true },
  { kind: 'catch',        label: 'Catch log',             needsEpisode: true },
  { kind: 'meal',         label: 'Meal log',              needsEpisode: true },
  { kind: 'talent',       label: 'Talent · pipeline',     needsEpisode: false },
  { kind: 'journal',      label: 'Production journal',    needsEpisode: false },
  { kind: 'task',         label: 'Task · crew',           needsEpisode: false },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CaptureModal({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState<'en-US' | 'hr-HR'>('en-US');
  const [destination, setDestination] = useState<DestinationKind>('note-global');
  const [episodeId, setEpisodeId] = useState<string>(state.episodes[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dest = DESTINATIONS.find((d) => d.kind === destination)!;
  const speechSupported = useSpeechRecognitionSupport();

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setText('');
      setInterim('');
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      stopRecording();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [open]);

  /* Stop on unmount */
  useEffect(() => {
    return () => stopRecording();
  }, []);

  function startRecording() {
    if (!speechSupported) {
      setError(
        'Browser SpeechRecognition is unavailable here. Use the textarea — works fine.'
      );
      return;
    }
    setError(null);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (!Ctor) {
      setError('SpeechRecognition not constructible.');
      return;
    }
    const rec = new Ctor();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let intr = '';
      let fin = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else intr += r[0].transcript;
      }
      if (fin) setText((t) => (t ? t + ' ' : '') + fin.trim());
      setInterim(intr);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError('Speech error: ' + e.error);
      setRecording(false);
    };
    rec.onend = () => {
      setRecording(false);
      setInterim('');
    };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }

  function stopRecording() {
    const rec = recognitionRef.current as unknown as { stop?: () => void } | null;
    if (rec && typeof rec.stop === 'function') {
      try {
        rec.stop();
      } catch {
        /* swallow */
      }
    }
    recognitionRef.current = null;
    setRecording(false);
    setInterim('');
  }

  function save() {
    const body = text.trim();
    if (!body) {
      onClose();
      return;
    }
    const epId = dest.needsEpisode ? episodeId : undefined;

    switch (destination) {
      case 'note-global': {
        const note: Note = {
          id: newId('note'),
          targetType: 'global',
          targetId: 'global',
          body,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_NOTE', note });
        break;
      }
      case 'note-episode': {
        if (!epId) return;
        const note: Note = {
          id: newId('note'),
          targetType: 'episode' as NoteTargetType,
          targetId: epId,
          body,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_NOTE', note });
        break;
      }
      case 'anti-script': {
        if (!epId) return;
        const moments = state.antiScriptMoments.filter(
          (m) => m.episodeId === epId
        );
        const moment: AntiScriptMoment = {
          id: newId('mom'),
          episodeId: epId,
          title: body.split(/[.!?]\s/)[0].slice(0, 80) || 'New moment',
          who: '',
          what: body,
          where: '',
          whyItMatters: '',
          status: 'planned',
          orderIdx: moments.length,
        };
        dispatch({ type: 'ADD_ANTI_SCRIPT', moment });
        break;
      }
      case 'catch': {
        if (!epId) return;
        const entry: Catch = {
          id: newId('catch'),
          episodeId: epId,
          fishCro: body.split(/[.!?]\s/)[0].slice(0, 60) || '',
          fishLat: '',
          fishEng: '',
          method: 'line',
          timeOfDay: '',
          weather: '',
          notes: body,
        };
        dispatch({ type: 'ADD_CATCH', entry });
        break;
      }
      case 'meal': {
        if (!epId) return;
        const entry: Meal = {
          id: newId('meal'),
          episodeId: epId,
          dish: body.split(/[.!?]\s/)[0].slice(0, 60) || 'New meal',
          recipe: body,
          notes: '',
        };
        dispatch({ type: 'ADD_MEAL', entry });
        break;
      }
      case 'talent': {
        const t: Talent = {
          id: newId('tal'),
          name: body.split(/[.,!?]\s/)[0].slice(0, 60) || 'New person',
          role: '',
          episodeId: 'general',
          location: '',
          status: 'prospect',
          whyThem: body,
          notes: '',
        };
        dispatch({ type: 'ADD_TALENT', talent: t });
        break;
      }
      case 'journal': {
        const e: JournalEntry = {
          id: newId('j'),
          date: new Date().toISOString().slice(0, 10),
          weather: '',
          whatHappened: body,
          moodTag: 'neutral',
        };
        dispatch({ type: 'ADD_JOURNAL', entry: e });
        break;
      }
      case 'task': {
        const now = new Date().toISOString();
        const t: Task = {
          id: newId('task'),
          title: body.split(/[.!?]\s/)[0].slice(0, 80) || 'New task',
          description: body,
          status: 'todo',
          priority: 'med',
          tags: [],
          context: 'crew',
          createdAt: now,
          updatedAt: now,
        };
        dispatch({ type: 'ADD_TASK', task: t });
        break;
      }
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="close capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[color:var(--color-chrome)]/40 backdrop-blur-[2px] z-[180]"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[14vh] -translate-x-1/2 w-[min(560px,92vw)] bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[5px] shadow-[0_24px_60px_rgba(14,30,54,0.28)] z-[190] flex flex-col overflow-hidden"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <div>
                <h2 className="display-italic text-[22px] text-[color:var(--color-on-paper)] leading-tight">
                  Capture
                </h2>
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                  Voice or type · pick where it goes · save
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as 'en-US' | 'hr-HR')
                  }
                  className="bg-transparent label-caps text-[color:var(--color-brass-deep)] outline-none border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[2px] px-2 py-1"
                >
                  <option value="en-US">EN</option>
                  <option value="hr-HR">HR</option>
                </select>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="close"
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="px-6 py-5 space-y-4">
              {/* Mic + textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text + (interim ? ' ' + interim : '')}
                  onChange={(e) => {
                    setText(e.target.value);
                    setInterim('');
                  }}
                  rows={5}
                  placeholder={
                    recording
                      ? 'listening…'
                      : 'Type or hold the mic to dictate. Cmd+Enter saves.'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      save();
                    }
                  }}
                  className={`w-full bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[3px] px-4 py-3 outline-none resize-y prose-body text-[15px] text-[color:var(--color-on-paper)] placeholder:italic placeholder:text-[color:var(--color-on-paper-faint)] ${
                    recording
                      ? 'focus:border-[color:var(--color-coral)]'
                      : 'focus:border-[color:var(--color-brass)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  aria-label={recording ? 'stop recording' : 'start recording'}
                  className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    recording
                      ? 'bg-[color:var(--color-coral)] text-[color:var(--color-paper)] animate-pulse'
                      : 'bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-chrome)]'
                  }`}
                >
                  {recording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              {error && (
                <p className="prose-body italic text-[12px] text-[color:var(--color-coral-deep)]">
                  {error}
                </p>
              )}

              {/* Destination picker */}
              <div className="grid grid-cols-2 gap-2">
                {DESTINATIONS.map((d) => {
                  const active = destination === d.kind;
                  return (
                    <button
                      key={d.kind}
                      type="button"
                      onClick={() => setDestination(d.kind)}
                      className={`text-left px-3 py-2 rounded-[2px] border-[0.5px] transition-colors ${
                        active
                          ? 'border-[color:var(--color-brass)] bg-[color:var(--color-paper-light)] text-[color:var(--color-on-paper)]'
                          : 'border-[color:var(--color-border-paper)] text-[color:var(--color-on-paper-muted)] hover:border-[color:var(--color-brass-deep)]'
                      }`}
                    >
                      <span
                        className={
                          active
                            ? 'display-italic text-[14px]'
                            : 'prose-body italic text-[13px]'
                        }
                      >
                        {d.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Episode picker (when needed) */}
              {dest.needsEpisode && (
                <div className="flex items-baseline gap-3">
                  <span className="label-caps text-[color:var(--color-brass-deep)] shrink-0">
                    Episode
                  </span>
                  <select
                    value={episodeId}
                    onChange={(e) => setEpisodeId(e.target.value)}
                    className="flex-1 bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
                  >
                    {state.episodes.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        Ep {ep.number} · {ep.title}
                      </option>
                    ))}
                    {state.specials.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <footer className="flex items-center gap-3 px-6 py-3 border-t-[0.5px] border-[color:var(--color-border-paper)] label-caps text-[color:var(--color-on-paper-faint)]">
              <span className="flex items-center gap-1">
                <kbd className="border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded px-1.5 py-[1px]">
                  ⌘↵
                </kbd>
                save
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded px-1.5 py-[1px]">
                  Esc
                </kbd>
                cancel
              </span>
              <button
                type="button"
                onClick={save}
                className="ml-auto label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] rounded-[2px] px-4 py-1.5 transition-colors"
              >
                Save
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function useSpeechRecognitionSupport(): boolean {
  if (typeof window === 'undefined') return false;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const w = window as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/* Minimal SpeechRecognition types — Web Speech API typings aren't shipped in lib.dom for this version. */
declare global {
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        isFinal: boolean;
        [index: number]: { transcript: string };
      };
    };
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
}
