import { useState } from 'react';
import { Pin, Trash2, Check } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Note, NoteTargetType } from '../../types';
import { EditableText } from './EditableText';
import { newId } from '../episode/shared';

interface Props {
  targetType: NoteTargetType;
  targetId: string;
  emptyMessage?: string;
  /* Pre-fill author dropdown when adding new notes. */
  defaultAuthorId?: string;
}

/* Editorial threaded notes — used for risk mitigation logs, sponsor outreach,
   crew messages, and the global board. */
export function NoteThread({
  targetType,
  targetId,
  emptyMessage = 'No notes yet.',
  defaultAuthorId,
}: Props) {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState('');
  const [authorId, setAuthorId] = useState<string | undefined>(defaultAuthorId);

  const notes = state.notes
    .filter((n) => n.targetType === targetType && n.targetId === targetId)
    .sort((a, b) => {
      /* pinned first, then newest at top */
      if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
      return a.createdAt < b.createdAt ? 1 : -1;
    });

  function add() {
    const body = draft.trim();
    if (!body) return;
    const note: Note = {
      id: newId('note'),
      authorId,
      targetType,
      targetId,
      body,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTE', note });
    setDraft('');
  }

  return (
    <div className="space-y-3">
      {/* Composer */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3 space-y-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a note · ⌘↵ to post"
          className="w-full bg-transparent prose-body italic text-[14px] text-[color:var(--color-on-paper)] placeholder:text-[color:var(--color-on-paper-faint)] outline-none resize-none"
        />
        <div className="flex items-center gap-2">
          <select
            value={authorId ?? ''}
            onChange={(e) => setAuthorId(e.target.value || undefined)}
            className="bg-transparent label-caps text-[color:var(--color-brass-deep)] outline-none"
          >
            <option value="">From: Tomo</option>
            {state.crew.map((c) => (
              <option key={c.id} value={c.id}>
                From: {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="ml-auto label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] disabled:opacity-40 disabled:hover:bg-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
          >
            Post
          </button>
        </div>
      </div>

      {/* Thread */}
      {notes.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] text-center py-4">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <NoteRow key={n.id} note={n} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteRow({ note }: { note: Note }) {
  const { state, dispatch } = useApp();
  const author = note.authorId
    ? state.crew.find((c) => c.id === note.authorId)
    : null;
  const authorName = author?.name ?? 'Tomislav Kovacic';

  return (
    <li
      className={`px-4 py-3 rounded-[3px] border-[0.5px] ${
        note.pinned
          ? 'border-[color:var(--color-brass)] bg-[color:var(--color-paper-light)]'
          : 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper-card)]'
      } ${note.resolvedAt ? 'opacity-55' : ''}`}
    >
      <header className="flex items-baseline gap-3 mb-1.5">
        <span className="display-italic text-[13px] text-[color:var(--color-on-paper)]">
          {authorName}
        </span>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          {fmtRelative(note.createdAt)}
        </span>
        {note.resolvedAt && (
          <span className="label-caps text-[color:var(--color-success)]">
            resolved
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'UPDATE_NOTE',
                id: note.id,
                patch: { pinned: !note.pinned },
              })
            }
            className={`p-1 ${
              note.pinned
                ? 'text-[color:var(--color-brass)]'
                : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)]'
            }`}
            aria-label={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={11} />
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'UPDATE_NOTE',
                id: note.id,
                patch: {
                  resolvedAt: note.resolvedAt
                    ? undefined
                    : new Date().toISOString(),
                },
              })
            }
            className={`p-1 ${
              note.resolvedAt
                ? 'text-[color:var(--color-success)]'
                : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-success)]'
            }`}
            aria-label={note.resolvedAt ? 'Unresolve' : 'Resolve'}
          >
            <Check size={11} />
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'DELETE_NOTE', id: note.id })}
            className="p-1 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
            aria-label="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </header>
      <EditableText
        value={note.body}
        onChange={(v) =>
          dispatch({ type: 'UPDATE_NOTE', id: note.id, patch: { body: v } })
        }
        multiline
        rows={2}
        className="prose-body text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
      />
    </li>
  );
}

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
