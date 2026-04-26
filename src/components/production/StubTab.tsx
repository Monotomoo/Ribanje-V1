import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  blurb: string;
  bullets: string[];
  planRef: string;
}

/* Reusable Tier-B placeholder card for the three Production tabs that
   ship after the boat trip (Boat ops · Data · Safety). Each declares
   the surface so the demo reads as intentional, not empty. */
export function StubTab({ icon: Icon, title, blurb, bullets, planRef }: Props) {
  return (
    <div className="space-y-7 max-w-[1000px]">
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div>
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            {title}
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            {blurb}
          </p>
        </div>
      </header>

      <ul className="space-y-2 pl-2 border-l-[0.5px] border-[color:var(--color-border-brass)]/50">
        {bullets.map((b) => (
          <li
            key={b}
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] pl-4 relative leading-relaxed"
          >
            <span className="absolute left-0 top-[0.55em] w-1 h-1 rounded-full bg-[color:var(--color-brass)]" />
            {b}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <span className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)]">
          Tier B · ships after the boat trip
        </span>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] flex items-center gap-2">
          <span>spec</span>
          <ArrowRight size={11} />
          <code className="font-sans not-italic tracking-wide">
            i-m-building-a-local-first-cosmic-island.md → {planRef}
          </code>
        </span>
      </div>
    </div>
  );
}
