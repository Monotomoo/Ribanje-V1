import { motion } from 'framer-motion';

interface Props {
  name: string;
  subtitle?: string;
}

/*
  Editorial page header.
  Large italic Fraunces, fade-in + slight upward drift on view change.
  No typewriter, no terminal glyph, no blinking cursor.
*/
export function PageHeader({ name, subtitle }: Props) {
  return (
    <div className="relative pb-5">
      <motion.h1
        key={name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="display-italic text-[52px] text-[color:var(--color-on-paper)]"
      >
        {capitalize(name)}
      </motion.h1>
      {subtitle && (
        <motion.div
          key={`${name}-sub`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-2.5"
        >
          {subtitle}
        </motion.div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[color:var(--color-border-brass)]" />
    </div>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
