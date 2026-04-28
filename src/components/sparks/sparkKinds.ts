import {
  Camera,
  Coffee,
  FileText,
  Image,
  Lightbulb,
  Link2,
  MapPin,
  Mic,
  Music,
  PenTool,
  Quote,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { SparkKind, SparkStatus } from '../../types';
import type { StringKey } from '../../i18n';

/* ---------- Spark kind metadata ----------
   Single source of truth for kind icon, i18n key, and capture-flow
   hint. Used by SparkCard, SparkCaptureModal, filter chips. */

export interface SparkKindMeta {
  kind: SparkKind;
  Icon: LucideIcon;
  labelKey: StringKey;
  hintKey: StringKey;
  defaultMedia: 'text' | 'voice' | 'sketch' | 'image' | 'reference';
}

export const SPARK_KINDS: SparkKindMeta[] = [
  { kind: 'idea',       Icon: Lightbulb, labelKey: 'spark.kind.idea',       hintKey: 'spark.kind.idea.hint',       defaultMedia: 'text' },
  { kind: 'voice',      Icon: Mic,        labelKey: 'spark.kind.voice',      hintKey: 'spark.kind.voice.hint',      defaultMedia: 'voice' },
  { kind: 'image',      Icon: Image,      labelKey: 'spark.kind.image',      hintKey: 'spark.kind.image.hint',      defaultMedia: 'image' },
  { kind: 'sketch',     Icon: PenTool,    labelKey: 'spark.kind.sketch',     hintKey: 'spark.kind.sketch.hint',     defaultMedia: 'sketch' },
  { kind: 'test-shot',  Icon: Camera,     labelKey: 'spark.kind.test.shot',  hintKey: 'spark.kind.test.shot.hint',  defaultMedia: 'image' },
  { kind: 'verse',      Icon: FileText,   labelKey: 'spark.kind.verse',      hintKey: 'spark.kind.verse.hint',      defaultMedia: 'text' },
  { kind: 'quote',      Icon: Quote,      labelKey: 'spark.kind.quote',      hintKey: 'spark.kind.quote.hint',      defaultMedia: 'text' },
  { kind: 'place',      Icon: MapPin,     labelKey: 'spark.kind.place',      hintKey: 'spark.kind.place.hint',      defaultMedia: 'text' },
  { kind: 'character',  Icon: User,       labelKey: 'spark.kind.character',  hintKey: 'spark.kind.character.hint',  defaultMedia: 'text' },
  { kind: 'sound',      Icon: Music,      labelKey: 'spark.kind.sound',      hintKey: 'spark.kind.sound.hint',      defaultMedia: 'voice' },
  { kind: 'taste',      Icon: Coffee,     labelKey: 'spark.kind.taste',      hintKey: 'spark.kind.taste.hint',      defaultMedia: 'text' },
  { kind: 'reference',  Icon: Link2,      labelKey: 'spark.kind.reference',  hintKey: 'spark.kind.reference.hint',  defaultMedia: 'reference' },
];

export const SPARK_KIND_BY_KIND: Record<SparkKind, SparkKindMeta> = SPARK_KINDS.reduce(
  (acc, m) => ({ ...acc, [m.kind]: m }),
  {} as Record<SparkKind, SparkKindMeta>
);

/* ---------- Status meta ---------- */

export const SPARK_STATUSES: { status: SparkStatus; labelKey: StringKey; tone: string }[] = [
  { status: 'raw',       labelKey: 'spark.status.raw',       tone: 'var(--color-on-paper-muted)' },
  { status: 'brewing',   labelKey: 'spark.status.brewing',   tone: 'var(--color-brass)' },
  { status: 'promoted',  labelKey: 'spark.status.promoted',  tone: 'var(--color-success)' },
  { status: 'parked',    labelKey: 'spark.status.parked',    tone: 'var(--color-on-paper-faint)' },
];
