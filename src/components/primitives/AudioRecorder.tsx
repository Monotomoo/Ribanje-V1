import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

type Lang = 'en-US' | 'hr-HR';
type RecorderState = 'idle' | 'recording' | 'processing';

interface Recorded {
  blob: Blob;
  base64: string;
  durationMs: number;
  transcript?: string;
  mimeType: string;
}

interface Props {
  onRecorded: (data: Recorded) => void;
  language?: Lang;
  maxDurationSec?: number;
  showTranscript?: boolean;
  hint?: string;
}

/* Records audio via MediaRecorder. Optionally runs SpeechRecognition in parallel
   for a live transcript. Emits the final blob + base64 + duration on stop.
   Editorial styling — brass mic, italic timer, paper card. */
export function AudioRecorder({
  onRecorded,
  language = 'en-US',
  maxDurationSec = 300,
  showTranscript = true,
  hint,
}: Props) {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  /* SpeechRecognition is a vendor-prefixed browser API; ref typed loosely. */
  const recogRef = useRef<{ stop: () => void } | null>(null);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (recogRef.current) {
        try {
          recogRef.current.stop();
        } catch {
          /* noop */
        }
      }
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
      }
    };
  }, []);

  async function start() {
    setError(null);
    setTranscript('');
    transcriptRef.current = '';
    setSeconds(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        setState('processing');
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64 = await blobToBase64(blob);
        const durationMs = Date.now() - startTimeRef.current;
        stream.getTracks().forEach((t) => t.stop());
        onRecorded({
          blob,
          base64,
          durationMs,
          transcript: transcriptRef.current.trim() || undefined,
          mimeType,
        });
        setState('idle');
      };
      recorderRef.current = recorder;
      recorder.start();
      startTimeRef.current = Date.now();
      setState('recording');

      tickRef.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(s);
        if (s >= maxDurationSec) {
          stop();
        }
      }, 250);

      if (showTranscript) {
        const w = window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionLike;
          webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        };
        const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (SR) {
          const recog = new SR();
          recog.continuous = true;
          recog.interimResults = true;
          recog.lang = language;
          recog.onresult = (ev: SpeechRecognitionEventLike) => {
            let txt = '';
            for (let i = 0; i < ev.results.length; i++) {
              txt += ev.results[i][0].transcript;
            }
            transcriptRef.current = txt;
            setTranscript(txt);
          };
          recog.onerror = () => {
            /* swallow — recording continues without transcript */
          };
          recogRef.current = recog;
          try {
            recog.start();
          } catch {
            /* noop */
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not access microphone');
      setState('idle');
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (recogRef.current) {
      try {
        recogRef.current.stop();
      } catch {
        /* noop */
      }
      recogRef.current = null;
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-center gap-4">
        {state === 'idle' && (
          <button
            type="button"
            onClick={start}
            className="w-12 h-12 rounded-full bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-paper)] flex items-center justify-center transition-colors"
            aria-label="Start recording"
          >
            <Mic size={18} />
          </button>
        )}
        {state === 'recording' && (
          <button
            type="button"
            onClick={stop}
            className="w-12 h-12 rounded-full bg-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral)] text-[color:var(--color-paper)] flex items-center justify-center transition-colors animate-pulse"
            aria-label="Stop recording"
          >
            <Square size={16} fill="currentColor" />
          </button>
        )}
        {state === 'processing' && (
          <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)] text-[color:var(--color-on-paper-muted)] flex items-center justify-center">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
        <div className="flex-1">
          <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums">
            {state === 'idle' ? 'Ready' : state === 'recording' ? formatTime(seconds) : 'Encoding…'}
          </div>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {state === 'recording'
              ? `recording in ${language === 'hr-HR' ? 'Croatian' : 'English'} · auto-stop ${Math.floor(maxDurationSec / 60)} min`
              : state === 'idle'
              ? hint || 'click the mic to begin'
              : 'finalising recording'}
          </div>
        </div>
      </div>
      {showTranscript && transcript && state === 'recording' && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] max-h-24 overflow-y-auto">
          {transcript}
        </div>
      )}
      {error && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body italic text-[12px] text-[color:var(--color-coral-deep)]">
          {error}
        </div>
      )}
    </div>
  );
}

function formatTime(s: number): string {
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/* Minimal browser-API shapes — avoid pulling in @types for the experimental APIs. */
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (ev: SpeechRecognitionEventLike) => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
