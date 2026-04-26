/*
  Stylized geographic data for the Croatian outer Adriatic.
  Coastline: a poly-line of (lat, lng) points roughly tracing mainland and Istria.
  Italian coast: a thin hint along the western edge.
  Islands: ellipses with center + half-extents in degrees and an optional rotation.
  Not topographically perfect — this is a chart-style abstraction.
*/

export type LatLng = readonly [number, number]; // [lat, lng]

export const MAINLAND_COAST: LatLng[] = [
  [42.40, 18.55],
  [42.45, 18.45],
  [42.60, 18.20],
  [42.65, 18.09],
  [42.78, 17.85],
  [42.95, 17.65],
  [43.00, 17.55],
  [43.04, 17.45],
  [42.97, 17.30],
  [43.05, 17.20],
  [43.20, 17.05],
  [43.40, 16.85],
  [43.45, 16.65],
  [43.50, 16.45],
  [43.55, 16.15],
  [43.65, 16.0],
  [43.73, 15.90],
  [43.85, 15.70],
  [43.95, 15.55],
  [44.12, 15.23],
  [44.30, 15.20],
  [44.45, 15.05],
  [44.65, 14.95],
  [44.95, 14.85],
  [45.10, 14.75],
  [45.25, 14.60],
  [45.33, 14.45],
  [45.30, 14.10],
  [45.20, 13.85],
  [45.05, 13.65],
  [44.85, 13.55],
  [44.95, 13.62],
  [45.20, 13.55],
  [45.40, 13.55],
];

/* Pelješac peninsula — a separate finger of mainland (bumps out south) */
export const PELJESAC: LatLng[] = [
  [42.97, 17.55],
  [42.94, 17.30],
  [42.92, 17.10],
  [42.90, 16.95],
  [42.92, 16.85],
  [42.97, 16.85],
  [43.00, 17.0],
  [43.02, 17.20],
  [43.04, 17.40],
];

/* Italian coast hint — thin ghosted line along left edge */
export const ITALIAN_COAST: LatLng[] = [
  [42.0, 14.7],
  [42.4, 14.4],
  [42.7, 14.0],
  [43.0, 13.8],
  [43.5, 13.5],
  [44.0, 13.2],
  [44.5, 12.5],
  [45.0, 12.4],
  [45.45, 12.5],
  [45.5, 13.0],
];

export interface Island {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dLat: number;
  dLng: number;
  rotation?: number;
  size?: 'lg' | 'md' | 'sm';
}

/*
  Outer Adriatic islands — sized by (dLat, dLng) half-extents in degrees.
  Rotation in degrees (clockwise positive).
*/
export const ISLANDS: Island[] = [
  /* Northern Kvarner */
  { id: 'cres',     name: 'Cres',      lat: 44.95, lng: 14.40, dLat: 0.30, dLng: 0.05, rotation: -5,  size: 'lg' },
  { id: 'losinj',   name: 'Lošinj',    lat: 44.55, lng: 14.45, dLat: 0.18, dLng: 0.04, rotation: -15, size: 'md' },
  { id: 'krk',      name: 'Krk',       lat: 45.05, lng: 14.65, dLat: 0.16, dLng: 0.16, size: 'md' },
  { id: 'rab',      name: 'Rab',       lat: 44.78, lng: 14.78, dLat: 0.10, dLng: 0.06, rotation: -35, size: 'md' },
  { id: 'pag',      name: 'Pag',       lat: 44.50, lng: 14.95, dLat: 0.30, dLng: 0.05, rotation: -55, size: 'lg' },

  /* Zadar islands */
  { id: 'silba',    name: 'Silba',     lat: 44.39, lng: 14.71, dLat: 0.04, dLng: 0.025, size: 'sm' },
  { id: 'olib',     name: 'Olib',      lat: 44.34, lng: 14.79, dLat: 0.04, dLng: 0.025, size: 'sm' },
  { id: 'premuda',  name: 'Premuda',   lat: 44.34, lng: 14.62, dLat: 0.05, dLng: 0.02,  size: 'sm' },
  { id: 'molat',    name: 'Molat',     lat: 44.22, lng: 14.78, dLat: 0.06, dLng: 0.04,  size: 'sm' },
  { id: 'dugi',     name: 'Dugi Otok', lat: 44.00, lng: 14.95, dLat: 0.25, dLng: 0.05, rotation: -40, size: 'lg' },
  { id: 'pasman',   name: 'Pašman',    lat: 43.92, lng: 15.30, dLat: 0.10, dLng: 0.04, rotation: -45, size: 'md' },
  { id: 'ugljan',   name: 'Ugljan',    lat: 44.05, lng: 15.15, dLat: 0.12, dLng: 0.04, rotation: -45, size: 'md' },

  /* Kornati cluster (~89 islands; just sample the major ones) */
  { id: 'kornat',   name: 'Kornat',    lat: 43.78, lng: 15.30, dLat: 0.18, dLng: 0.06, rotation: -45, size: 'md' },
  { id: 'lavsa',    name: 'Lavsa',     lat: 43.78, lng: 15.43, dLat: 0.025, dLng: 0.02, size: 'sm' },
  { id: 'zakan',    name: 'Žakan',     lat: 43.85, lng: 15.34, dLat: 0.025, dLng: 0.02, size: 'sm' },
  { id: 'piskera',  name: 'Piskera',   lat: 43.75, lng: 15.34, dLat: 0.06,  dLng: 0.02, rotation: -50, size: 'sm' },

  /* Šolta / Brač / Hvar */
  { id: 'solta',    name: 'Šolta',     lat: 43.40, lng: 16.27, dLat: 0.07, dLng: 0.13, size: 'md' },
  { id: 'brac',     name: 'Brač',      lat: 43.32, lng: 16.65, dLat: 0.10, dLng: 0.27, size: 'lg' },
  { id: 'hvar',     name: 'Hvar',      lat: 43.16, lng: 16.70, dLat: 0.07, dLng: 0.40, rotation: -8, size: 'lg' },

  /* Korčula / Mljet / Lastovo */
  { id: 'korcula',  name: 'Korčula',   lat: 42.94, lng: 17.00, dLat: 0.06, dLng: 0.32, size: 'lg' },
  { id: 'mljet',    name: 'Mljet',     lat: 42.77, lng: 17.50, dLat: 0.06, dLng: 0.20, size: 'md' },
  { id: 'lastovo',  name: 'Lastovo',   lat: 42.75, lng: 16.85, dLat: 0.05, dLng: 0.10, size: 'md' },

  /* Vis / Biševo / Palagruža */
  { id: 'vis',      name: 'Vis',       lat: 43.05, lng: 16.15, dLat: 0.07, dLng: 0.10, size: 'md' },
  { id: 'bisevo',   name: 'Biševo',    lat: 42.97, lng: 16.01, dLat: 0.025, dLng: 0.025, size: 'sm' },
  { id: 'palagruz', name: 'Palagruža', lat: 42.39, lng: 16.26, dLat: 0.012, dLng: 0.022, size: 'sm' },
  { id: 'svetac',   name: 'Svetac',    lat: 43.03, lng: 15.78, dLat: 0.018, dLng: 0.018, size: 'sm' },

  /* Susak (off Lošinj) */
  { id: 'susak',    name: 'Susak',     lat: 44.51, lng: 14.30, dLat: 0.025, dLng: 0.022, size: 'sm' },

  /* Brijuni (off Istra) */
  { id: 'brijuni',  name: 'Brijuni',   lat: 44.92, lng: 13.76, dLat: 0.05, dLng: 0.025, size: 'sm' },
];

/* Major mainland city anchors — for sense-of-place labels */
export interface CityLabel {
  name: string;
  lat: number;
  lng: number;
}

export const CITY_LABELS: CityLabel[] = [
  { name: 'Dubrovnik', lat: 42.65, lng: 18.09 },
  { name: 'Split',     lat: 43.50, lng: 16.45 },
  { name: 'Šibenik',   lat: 43.73, lng: 15.90 },
  { name: 'Zadar',     lat: 44.12, lng: 15.23 },
  { name: 'Rijeka',    lat: 45.33, lng: 14.45 },
  { name: 'Pula',      lat: 44.87, lng: 13.85 },
];
