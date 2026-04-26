import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Episode, Location } from '../../types';
import { EPISODE_COLORS } from './AdriaticChart';

interface Props {
  location: Location | null;
  episodes: Episode[];
  onClose: () => void;
}

export function LocationDrawer({ location, episodes, onClose }: Props) {
  return (
    <AnimatePresence>
      {location && (
        <>
          <motion.button
            type="button"
            aria-label="close drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[color:var(--color-chrome)]/30 z-40"
          />
          <motion.aside
            key={location.id}
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[360px] bg-[color:var(--color-paper-card)] border-l-[0.5px] border-[color:var(--color-border-paper-strong)] z-50 flex flex-col"
          >
            <header className="flex items-start justify-between px-7 pt-7 pb-5 border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <div className="flex-1 min-w-0">
                <EpisodePill location={location} episodes={episodes} />
                <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight mt-2">
                  {location.label}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="close"
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
              <Field label="Coordinates">
                <span className="prose-body italic text-[14px] text-[color:var(--color-on-paper)]">
                  {location.lat.toFixed(3)}°N · {location.lng.toFixed(3)}°E
                </span>
              </Field>

              <Field label="Type">
                <span className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] capitalize">
                  {location.type}
                </span>
              </Field>

              {location.notes && (
                <Field label="Notes">
                  <p className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]">
                    {location.notes}
                  </p>
                </Field>
              )}

              {location.goldenHourNotes && (
                <Field label="Golden hour">
                  <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper)]">
                    {location.goldenHourNotes}
                  </p>
                </Field>
              )}

              <div className="pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
                Editing land in Phase 6 — for now this is read-only.
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function EpisodePill({
  location,
  episodes,
}: {
  location: Location;
  episodes: Episode[];
}) {
  const color = EPISODE_COLORS[location.episodeId] ?? '#2D4A6B';
  const ep =
    location.episodeId === 'hektorovic' || location.episodeId === 'general'
      ? null
      : episodes.find((e) => e.id === location.episodeId);
  const label =
    location.episodeId === 'hektorovic'
      ? 'Hektorović reference'
      : location.episodeId === 'general'
      ? 'General'
      : ep
      ? `Episode ${ep.number} · ${ep.title}`
      : location.episodeId;
  return (
    <div className="flex items-center gap-2 label-caps text-[color:var(--color-on-paper-muted)]">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </div>
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
