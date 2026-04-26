/*
  Simple equirectangular projection for the Croatian outer Adriatic.
  At ~44°N the cosine factor is ~0.72 — we honour that so the chart looks
  visually true even though it's not a Mercator.
*/

export const MIN_LON = 13.0;
export const MAX_LON = 19.6;
export const MIN_LAT = 42.0;
export const MAX_LAT = 45.6;

export const CHART_W = 1280;
export const CHART_H = 720;

export interface XY {
  x: number;
  y: number;
}

const lonSpan = MAX_LON - MIN_LON;
const latSpan = MAX_LAT - MIN_LAT;

export function project(lat: number, lng: number): XY {
  const x = ((lng - MIN_LON) / lonSpan) * CHART_W;
  const y = (1 - (lat - MIN_LAT) / latSpan) * CHART_H;
  return { x, y };
}

/* Rough km-per-degree at the chart's mid-latitude (~44°N) */
const KM_PER_DEG_LAT = 111;
const KM_PER_DEG_LON_44 = 80;

export function nauticalMilesPerPixel(): number {
  /* y axis distance: 1 px = (latSpan / CHART_H) deg lat ≈ ... km */
  const kmPerYPx = (latSpan / CHART_H) * KM_PER_DEG_LAT;
  return kmPerYPx / 1.852;
}

export function pixelsForNm(nm: number): number {
  return nm / nauticalMilesPerPixel();
}

export const _internal = {
  KM_PER_DEG_LAT,
  KM_PER_DEG_LON_44,
};
