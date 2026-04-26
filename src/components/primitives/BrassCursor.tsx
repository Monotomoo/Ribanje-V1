interface Props {
  visible?: boolean;
  glyph?: string;
}

export function BrassCursor({ visible = true, glyph = '▌' }: Props) {
  if (!visible) return null;
  return <span className="brass-cursor" aria-hidden="true">{glyph}</span>;
}
