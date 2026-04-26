import { useDraggable } from '@dnd-kit/core';
import {
  Anchor,
  Coffee,
  Fish,
  Gem,
  Music,
  Plus,
  Sailboat,
  Sun,
  Sunset,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import type { BeatIcon, BeatTemplate } from '../../types';
import { BEAT_TEMPLATES } from '../../lib/seed';

const ICON: Record<BeatIcon, LucideIcon> = {
  departure: Sailboat,
  catch: Fish,
  elder: Coffee,
  meal: UtensilsCrossed,
  sunrise: Sun,
  sunset: Sunset,
  homecoming: Anchor,
  klapa: Music,
  verse: Gem,
  storm: Sun,
  wine: Wine,
  observational: Gem,
  aerial: Plus,
  underwater: Plus,
  custom: Plus,
};

export function BeatLibrary() {
  return (
    <aside className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-4 sticky top-2">
      <header className="mb-3 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Beat library
        </h3>
        <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
          drag a beat into the timeline
        </p>
      </header>
      <ul className="space-y-2">
        {BEAT_TEMPLATES.map((tpl) => (
          <li key={tpl.id}>
            <BeatChip template={tpl} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

function BeatChip({ template }: { template: BeatTemplate }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({ id: 'tpl:' + template.id });
  const Icon = ICON[template.iconType] ?? Plus;
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  };
  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)] rounded-[3px] px-3 py-2.5 transition-colors active:cursor-grabbing"
    >
      <div className="flex items-baseline gap-2">
        <Icon
          size={12}
          className="text-[color:var(--color-brass-deep)] shrink-0 translate-y-[1px]"
        />
        <div className="flex-1 min-w-0">
          <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
            {template.label}
          </div>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1 leading-tight">
            {template.description}
          </div>
        </div>
        <span className="label-caps text-[color:var(--color-on-paper-faint)] tabular-nums shrink-0">
          {template.defaultDurationMin}m
        </span>
      </div>
    </article>
  );
}
