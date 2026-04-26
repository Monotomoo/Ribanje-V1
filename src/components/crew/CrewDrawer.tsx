import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { CrewMember } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { TaskBoard } from '../primitives/TaskBoard';
import { NoteThread } from '../primitives/NoteThread';

interface Props {
  member: CrewMember | null;
  onClose: () => void;
}

export function CrewDrawer({ member, onClose }: Props) {
  const { dispatch } = useApp();

  return (
    <AnimatePresence>
      {member && (
        <>
          <motion.button
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
            key={member.id}
            initial={{ x: 600 }}
            animate={{ x: 0 }}
            exit={{ x: 600 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[600px] bg-[color:var(--color-paper-card)] border-l-[0.5px] border-[color:var(--color-border-paper-strong)] z-50 flex flex-col"
          >
            <header className="flex items-start justify-between px-7 pt-7 pb-5 border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <div className="flex items-start gap-5 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-full bg-[color:var(--color-chrome)] text-[color:var(--color-brass)] flex items-center justify-center display-italic text-[18px] shrink-0">
                  {initials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
                    <EditableText
                      value={member.name}
                      onChange={(v) =>
                        dispatch({
                          type: 'UPDATE_CREW',
                          id: member.id,
                          patch: { name: v },
                        })
                      }
                      className="display-italic text-[28px] text-[color:var(--color-on-paper)]"
                    />
                  </h2>
                  <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1">
                    <EditableText
                      value={member.role}
                      onChange={(v) =>
                        dispatch({
                          type: 'UPDATE_CREW',
                          id: member.id,
                          patch: { role: v },
                        })
                      }
                      placeholder="Role"
                    />
                  </div>
                </div>
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
              {/* Profile */}
              <div className="grid grid-cols-2 gap-5">
                <Field label="Rate · structure">
                  <EditableText
                    value={member.rate ?? ''}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_CREW',
                        id: member.id,
                        patch: { rate: v },
                      })
                    }
                    placeholder="Day rate · per diem"
                    className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
                  />
                </Field>
                <Field label="Contact">
                  <EditableText
                    value={member.contact ?? ''}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_CREW',
                        id: member.id,
                        patch: { contact: v },
                      })
                    }
                    placeholder="Email · phone"
                    className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
                  />
                </Field>
                <Field label="Portfolio">
                  <EditableText
                    value={member.link ?? ''}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_CREW',
                        id: member.id,
                        patch: { link: v },
                      })
                    }
                    placeholder="https://"
                    className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
                  />
                </Field>
                <Field label="Notes">
                  <EditableText
                    value={member.notes ?? ''}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_CREW',
                        id: member.id,
                        patch: { notes: v },
                      })
                    }
                    placeholder="Quick notes"
                    className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                  />
                </Field>
              </div>

              {/* Tasks assigned to this crew member */}
              <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-3">
                  Their tasks
                </h3>
                <TaskBoard
                  context="crew"
                  assigneeId={member.id}
                  emptyHint={`No tasks assigned to ${member.name} yet.`}
                />
              </div>

              {/* Notes thread to / about this crew member */}
              <div className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-1">
                  Notes
                </h3>
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3">
                  Notes from anyone, to {member.name}. Pin important ones.
                </p>
                <NoteThread
                  targetType="crew"
                  targetId={member.id}
                  emptyMessage="No notes yet."
                />
              </div>
            </div>

            <footer className="px-7 py-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Remove ${member.name} from crew?`)) {
                    dispatch({ type: 'DELETE_CREW', id: member.id });
                    onClose();
                  }
                }}
                className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
              >
                remove from crew
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '·'
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
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
