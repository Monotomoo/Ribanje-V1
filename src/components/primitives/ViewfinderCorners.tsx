/*
  Four small L-shaped brass corner ornaments — ARRI/RED viewfinder framing reference.
  Sized so corners read as part of the card, not a sticker on top.
*/
export function ViewfinderCorners() {
  const stroke = 'var(--color-brass)';
  const sw = 1.25;
  const armLen = 10;
  return (
    <>
      {/* top-left */}
      <svg
        className="absolute top-1.5 left-1.5 pointer-events-none"
        width={armLen + sw * 2}
        height={armLen + sw * 2}
      >
        <path
          d={`M${sw} ${armLen + sw} L${sw} ${sw} L${armLen + sw} ${sw}`}
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
        />
      </svg>
      {/* top-right */}
      <svg
        className="absolute top-1.5 right-1.5 pointer-events-none"
        width={armLen + sw * 2}
        height={armLen + sw * 2}
      >
        <path
          d={`M0 ${sw} L${armLen + sw} ${sw} L${armLen + sw} ${armLen + sw}`}
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
        />
      </svg>
      {/* bottom-left */}
      <svg
        className="absolute bottom-1.5 left-1.5 pointer-events-none"
        width={armLen + sw * 2}
        height={armLen + sw * 2}
      >
        <path
          d={`M${sw} 0 L${sw} ${armLen + sw} L${armLen + sw} ${armLen + sw}`}
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
        />
      </svg>
      {/* bottom-right */}
      <svg
        className="absolute bottom-1.5 right-1.5 pointer-events-none"
        width={armLen + sw * 2}
        height={armLen + sw * 2}
      >
        <path
          d={`M0 ${armLen + sw} L${armLen + sw} ${armLen + sw} L${armLen + sw} 0`}
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
        />
      </svg>
    </>
  );
}
