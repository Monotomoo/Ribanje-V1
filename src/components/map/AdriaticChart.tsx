import { useMemo } from 'react';
import {
  CHART_H,
  CHART_W,
  MAX_LAT,
  MAX_LON,
  MIN_LAT,
  MIN_LON,
  pixelsForNm,
  project,
} from './projection';
import {
  CITY_LABELS,
  ISLANDS,
  ITALIAN_COAST,
  MAINLAND_COAST,
  PELJESAC,
  type LatLng,
} from './geometry';
import type { Location, Route } from '../../types';

/* Editorial episode palette — sea-grounded, no neon, brass restrained. */
export const EPISODE_COLORS: Record<string, string> = {
  ep1: '#C26A4A', // coral — Lov / opening voyage
  ep2: '#3D7280', // dock teal — Vjetar / open sea
  ep3: '#788064', // olive — Kamen / stone
  ep4: '#C9A961', // brass — Sol / salt
  ep5: '#8C5C7A', // mauve — Glas / klapa voice
  ep6: '#B86B58', // terracotta — Povratak
  sp1: '#4A6B91', // steel — Po Hektoroviću
  sp2: '#6B7080', // grey — Wildcard
  hektorovic: '#A8884A', // brass-deep
  general: '#2D4A6B',
};

interface Props {
  locations: Location[];
  routes: Route[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const polylinePath = (points: LatLng[]): string =>
  points
    .map(([lat, lng], i) => {
      const { x, y } = project(lat, lng);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

export function AdriaticChart({ locations, routes, selectedId, onSelect }: Props) {
  /* Routes path data — pre-compute */
  const routePaths = useMemo(() => {
    const locMap = new Map(locations.map((l) => [l.id, l]));
    return routes
      .map((r) => {
        const a = locMap.get(r.fromLocationId);
        const b = locMap.get(r.toLocationId);
        if (!a || !b) return null;
        const pa = project(a.lat, a.lng);
        const pb = project(b.lat, b.lng);
        const color = EPISODE_COLORS[r.episodeId] ?? '#2D4A6B';
        return {
          id: r.id,
          d: `M ${pa.x.toFixed(1)} ${pa.y.toFixed(1)} L ${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`,
          color,
          episodeId: r.episodeId,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [routes, locations]);

  /* Lat/lng grid lines (every 0.5°) */
  const latLines: number[] = [];
  for (let lat = Math.ceil(MIN_LAT * 2) / 2; lat <= MAX_LAT; lat += 0.5) latLines.push(lat);
  const lngLines: number[] = [];
  for (let lng = Math.ceil(MIN_LON * 2) / 2; lng <= MAX_LON; lng += 0.5) lngLines.push(lng);

  return (
    <div className="bg-[#FBF6E8] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full block"
        style={{ maxHeight: 720 }}
      >
        {/* Sea wash — very subtle blue-gray over the chart paper */}
        <rect x={0} y={0} width={CHART_W} height={CHART_H} fill="rgba(61,114,128,0.045)" />

        {/* Lat/lng grid */}
        <g opacity={0.5}>
          {latLines.map((lat) => {
            const { y } = project(lat, MIN_LON);
            return (
              <g key={`lat-${lat}`}>
                <line
                  x1={0}
                  x2={CHART_W}
                  y1={y}
                  y2={y}
                  stroke="rgba(14,30,54,0.07)"
                  strokeWidth={0.5}
                />
                <text
                  x={6}
                  y={y - 4}
                  fontFamily="Inter, sans-serif"
                  fontSize={9}
                  letterSpacing={1}
                  fill="rgba(14,30,54,0.32)"
                >
                  {lat.toFixed(1)}°N
                </text>
              </g>
            );
          })}
          {lngLines.map((lng) => {
            const { x } = project(MIN_LAT, lng);
            return (
              <g key={`lng-${lng}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={CHART_H}
                  stroke="rgba(14,30,54,0.07)"
                  strokeWidth={0.5}
                />
                <text
                  x={x + 4}
                  y={CHART_H - 8}
                  fontFamily="Inter, sans-serif"
                  fontSize={9}
                  letterSpacing={1}
                  fill="rgba(14,30,54,0.32)"
                >
                  {lng.toFixed(1)}°E
                </text>
              </g>
            );
          })}
        </g>

        {/* Italian coast — ghosted */}
        <path
          d={polylinePath(ITALIAN_COAST)}
          fill="none"
          stroke="rgba(14,30,54,0.18)"
          strokeWidth={0.6}
          strokeDasharray="2 4"
        />

        {/* Mainland coast — hairline navy */}
        <path
          d={polylinePath(MAINLAND_COAST)}
          fill="none"
          stroke="rgba(14,30,54,0.78)"
          strokeWidth={1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={polylinePath(PELJESAC) + ' Z'}
          fill="rgba(14,30,54,0.04)"
          stroke="rgba(14,30,54,0.78)"
          strokeWidth={1}
          strokeLinejoin="round"
        />

        {/* Islands */}
        <g>
          {ISLANDS.map((isle) => {
            const c = project(isle.lat, isle.lng);
            const rx = (isle.dLng / (MAX_LON - MIN_LON)) * CHART_W;
            const ry = (isle.dLat / (MAX_LAT - MIN_LAT)) * CHART_H;
            const labelOffset = isle.size === 'sm' ? 8 : 14;
            return (
              <g
                key={isle.id}
                transform={isle.rotation ? `rotate(${isle.rotation} ${c.x} ${c.y})` : undefined}
              >
                <ellipse
                  cx={c.x}
                  cy={c.y}
                  rx={Math.max(2, rx)}
                  ry={Math.max(2, ry)}
                  fill="rgba(14,30,54,0.08)"
                  stroke="rgba(14,30,54,0.55)"
                  strokeWidth={0.65}
                />
                {isle.size !== 'sm' && (
                  <text
                    x={c.x}
                    y={c.y + ry + labelOffset}
                    textAnchor="middle"
                    fontFamily="Fraunces, Georgia, serif"
                    fontStyle="italic"
                    fontSize={isle.size === 'lg' ? 13 : 11}
                    fill="rgba(14,30,54,0.7)"
                    transform={
                      isle.rotation ? `rotate(${-isle.rotation} ${c.x} ${c.y + ry + labelOffset})` : undefined
                    }
                  >
                    {isle.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* City labels — small caps Inter */}
        <g>
          {CITY_LABELS.map((c) => {
            const p = project(c.lat, c.lng);
            return (
              <g key={c.name}>
                <circle cx={p.x} cy={p.y} r={1.8} fill="rgba(14,30,54,0.75)" />
                <text
                  x={p.x + 7}
                  y={p.y + 3}
                  fontFamily="Inter, sans-serif"
                  fontSize={9.5}
                  letterSpacing={1.4}
                  fill="rgba(14,30,54,0.62)"
                >
                  {c.name.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>

        {/* Routes */}
        <g>
          {routePaths.map((r) => (
            <path
              key={r.id}
              d={r.d}
              fill="none"
              stroke={r.color}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </g>

        {/* Anchorage pins */}
        <g>
          {locations.map((loc) => (
            <Pin
              key={loc.id}
              loc={loc}
              selected={selectedId === loc.id}
              onSelect={onSelect}
            />
          ))}
        </g>

        {/* Compass rose — top right */}
        <CompassRose cx={CHART_W - 70} cy={70} />

        {/* Scale bar — bottom left */}
        <Scalebar nm={20} cx={50} cy={CHART_H - 38} />
      </svg>
    </div>
  );
}

interface PinProps {
  loc: Location;
  selected: boolean;
  onSelect: (id: string) => void;
}

function Pin({ loc, selected, onSelect }: PinProps) {
  const p = project(loc.lat, loc.lng);
  const color = EPISODE_COLORS[loc.episodeId] ?? '#2D4A6B';
  const r = 7;
  return (
    <g
      transform={`translate(${p.x} ${p.y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(loc.id)}
    >
      {/* Halo */}
      <circle
        cx={0}
        cy={0}
        r={r + (selected ? 7 : 4)}
        fill={color}
        opacity={selected ? 0.32 : 0.18}
      />
      {/* Brass diamond */}
      <polygon
        points={`0,${-r} ${r},0 0,${r} ${-r},0`}
        fill="var(--color-brass)"
        stroke="var(--color-brass-deep)"
        strokeWidth={0.75}
      />
      <title>{loc.label}</title>
    </g>
  );
}

function CompassRose({ cx, cy }: { cx: number; cy: number }) {
  const r = 32;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle cx={0} cy={0} r={r} fill="rgba(251,246,232,0.65)" stroke="rgba(168,136,74,0.5)" strokeWidth={0.5} />
      <circle cx={0} cy={0} r={r * 0.65} fill="none" stroke="rgba(168,136,74,0.4)" strokeWidth={0.5} />
      {/* Cardinal points */}
      <polygon
        points={`0,${-r * 0.85} 4,${-r * 0.15} 0,0 -4,${-r * 0.15}`}
        fill="var(--color-brass-deep)"
      />
      <polygon
        points={`0,${r * 0.85} 4,${r * 0.15} 0,0 -4,${r * 0.15}`}
        fill="rgba(14,30,54,0.55)"
      />
      <polygon
        points={`${r * 0.85},0 ${r * 0.15},4 0,0 ${r * 0.15},-4`}
        fill="rgba(14,30,54,0.4)"
      />
      <polygon
        points={`${-r * 0.85},0 ${-r * 0.15},4 0,0 ${-r * 0.15},-4`}
        fill="rgba(14,30,54,0.4)"
      />
      <text
        x={0}
        y={-r - 4}
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontStyle="italic"
        fontSize={11}
        fill="var(--color-brass-deep)"
      >
        N
      </text>
    </g>
  );
}

function Scalebar({ nm, cx, cy }: { nm: number; cx: number; cy: number }) {
  const w = pixelsForNm(nm);
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <line x1={0} x2={w} y1={0} y2={0} stroke="rgba(14,30,54,0.6)" strokeWidth={1} />
      <line x1={0} x2={0} y1={-4} y2={4} stroke="rgba(14,30,54,0.6)" strokeWidth={1} />
      <line x1={w / 2} x2={w / 2} y1={-3} y2={3} stroke="rgba(14,30,54,0.4)" strokeWidth={0.5} />
      <line x1={w} x2={w} y1={-4} y2={4} stroke="rgba(14,30,54,0.6)" strokeWidth={1} />
      <text
        x={0}
        y={-8}
        fontFamily="Inter, sans-serif"
        fontSize={9}
        letterSpacing={1.3}
        fill="rgba(14,30,54,0.55)"
      >
        0
      </text>
      <text
        x={w}
        y={-8}
        textAnchor="end"
        fontFamily="Inter, sans-serif"
        fontSize={9}
        letterSpacing={1.3}
        fill="rgba(14,30,54,0.55)"
      >
        {nm} NM
      </text>
    </g>
  );
}
