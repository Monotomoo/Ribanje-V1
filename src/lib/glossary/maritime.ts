import type { GlossaryTerm } from '../../types';

/* ---------- Maritime glossary (Phase 15) ----------

   55+ Croatian sailor / fisherman terms. The vocabulary Ivan and Luka
   use without thinking but a non-Croatian camera crew might miss.
   Croatian first, English explanation, occasional pronunciation hint
   for the non-native speaker. */

export const SEED_GLOSSARY: GlossaryTerm[] = [
  /* ---------- Winds (8 named + variants) ---------- */
  {
    id: 'g-bura',
    termCro: 'Bura',
    termEng: 'NE wind · cold · gusty',
    category: 'wind',
    definition:
      'Strong, dry, gusty north-east wind. Comes off the Velebit and Dinaric mountains. Builds fast, can hit 50+ kn. Days clear and brilliant; nights freezing.',
    pronunciation: 'BOO-rah',
    example: 'Bura puše već dva dana — danas pravimo veliku turu po jadranu.',
  },
  {
    id: 'g-jugo',
    termCro: 'Jugo',
    termEng: 'SE wind · moist · long-fetch',
    category: 'wind',
    definition:
      'Warm humid south-east wind. Brings overcast skies, swell from the Mediterranean fetch, and the famous Croatian headache. Builds slowly, blows for days.',
    pronunciation: 'YOO-go',
    example: 'Jugo puše — sve te boli glava i more je veliko.',
  },
  {
    id: 'g-levanat',
    termCro: 'Levanat',
    termEng: 'E wind',
    category: 'wind',
    definition:
      'East wind, less common in Croatia. Brings instability and sometimes squalls.',
    pronunciation: 'le-VA-nat',
  },
  {
    id: 'g-lebic',
    termCro: 'Lebić',
    termEng: 'SW wind',
    category: 'wind',
    definition:
      'South-west wind. Can bring strong waves to north-facing coves. Often follows a low pressure passing over the Adriatic.',
    pronunciation: 'LE-beech',
  },
  {
    id: 'g-oster',
    termCro: 'Ošter',
    termEng: 'NW wind · sharp',
    category: 'wind',
    definition: 'Sharp north-west wind, can be quite cold and fast.',
    pronunciation: 'OSH-tair',
  },
  {
    id: 'g-maestral',
    termCro: 'Maestral',
    termEng: 'NW summer breeze',
    category: 'wind',
    definition:
      'Steady afternoon north-west thermal wind in summer. The sailor\'s gentle friend — predictable, 8-15 kn, dies at sunset.',
    pronunciation: 'ma-eh-STRAHL',
    example: 'Maestral je krenuo u 14h — vrijeme za jedrenje.',
  },
  {
    id: 'g-tramontana',
    termCro: 'Tramontana',
    termEng: 'N wind',
    category: 'wind',
    definition:
      'North wind. Cold and dry. Cousin of bura but more pure-north and usually less violent.',
    pronunciation: 'tra-mon-TA-na',
  },
  {
    id: 'g-pulenat',
    termCro: 'Pulenat',
    termEng: 'W wind',
    category: 'wind',
    definition: 'West wind. Variable, can shift quickly.',
    pronunciation: 'PU-le-nat',
  },
  {
    id: 'g-burin',
    termCro: 'Burin',
    termEng: 'morning bura · gentle',
    category: 'wind',
    definition:
      'Mild morning bura that often dies by noon. Gives a clean breeze for the dawn shift.',
    pronunciation: 'BU-rin',
  },
  {
    id: 'g-nevera',
    termCro: 'Nevera',
    termEng: 'sudden squall · summer storm',
    category: 'weather',
    definition:
      'Quick violent summer thunderstorm. Builds in 30 minutes from clear sky. Can carry 40+ kn gusts and lightning. Take shelter immediately.',
    pronunciation: 'ne-VE-ra',
    example: 'Nebo se zatamnilo — nevera dolazi za pola sata.',
  },
  {
    id: 'g-bonaca',
    termCro: 'Bonaca',
    termEng: 'flat calm',
    category: 'weather',
    definition: 'No wind. Mirror sea. Beautiful for camera, terrible for sailing.',
    pronunciation: 'bo-NA-tsa',
  },
  {
    id: 'g-skrinja',
    termCro: 'Škrinja',
    termEng: 'small cold wind',
    category: 'wind',
    definition:
      'Small cold wind that comes off the mountains in late afternoon, especially in spring/autumn.',
    pronunciation: 'SHKRIN-ya',
  },

  /* ---------- Maneuver / sailing ---------- */
  {
    id: 'g-prua',
    termCro: 'Prua',
    termEng: 'bow',
    category: 'boat',
    definition: 'Front of the boat. The pointy end.',
    pronunciation: 'PROO-ah',
  },
  {
    id: 'g-krma',
    termCro: 'Krma',
    termEng: 'stern',
    category: 'boat',
    definition: 'Back of the boat. Where the engine and rudder are.',
    pronunciation: 'KEHR-ma',
  },
  {
    id: 'g-bok',
    termCro: 'Lijevi/desni bok',
    termEng: 'port/starboard',
    category: 'boat',
    definition:
      'Lijevi = port (left). Desni = starboard (right). Always relative to facing forward.',
    pronunciation: 'LEE-yev-ee bok / DES-nee bok',
  },
  {
    id: 'g-volta',
    termCro: 'Volta',
    termEng: 'tacking',
    category: 'maneuver',
    definition:
      'Turning the boat through the wind. The crew shifts side and the sails flop across.',
    pronunciation: 'VOL-ta',
  },
  {
    id: 'g-na-vjetar',
    termCro: 'Krma na vjetar',
    termEng: 'pointing high',
    category: 'maneuver',
    definition:
      'Sailing as close to the wind as possible. Pointing up to weather, often after a tack.',
  },
  {
    id: 'g-bocno',
    termCro: 'Bočno',
    termEng: 'beam reach',
    category: 'maneuver',
    definition:
      'Sailing with the wind perpendicular to the boat — usually fastest, most stable.',
    pronunciation: 'BOCH-noh',
  },
  {
    id: 'g-jedro',
    termCro: 'Jedro',
    termEng: 'sail',
    category: 'sail',
    definition: 'Sail. Plural: jedra.',
    pronunciation: 'YE-dro',
  },
  {
    id: 'g-glavno-jedro',
    termCro: 'Glavno jedro',
    termEng: 'main sail',
    category: 'sail',
    definition: 'Main sail — the big sail attached to the mast.',
  },
  {
    id: 'g-flok',
    termCro: 'Flok',
    termEng: 'jib · headsail',
    category: 'sail',
    definition: 'Front sail (jib).',
  },
  {
    id: 'g-jarbol',
    termCro: 'Jarbol',
    termEng: 'mast',
    category: 'boat',
    definition: 'Mast — the vertical pole holding the sails.',
    pronunciation: 'YAR-bol',
  },
  {
    id: 'g-kobilica',
    termCro: 'Kobilica',
    termEng: 'keel',
    category: 'boat',
    definition: 'Keel — the bottom centerline of the boat hull.',
    pronunciation: 'ko-BI-lit-sa',
  },
  {
    id: 'g-kormilo',
    termCro: 'Kormilo',
    termEng: 'rudder · helm',
    category: 'boat',
    definition: 'Rudder and the wheel/tiller you steer with.',
    pronunciation: 'KOR-mi-lo',
  },

  /* ---------- Anchor + mooring ---------- */
  {
    id: 'g-sidro',
    termCro: 'Sidro',
    termEng: 'anchor',
    category: 'anchor',
    definition:
      'The anchor itself. Adriatic anchorages typically need 3-5x depth in chain for hold.',
    pronunciation: 'SEE-dro',
  },
  {
    id: 'g-sidriste',
    termCro: 'Sidrište',
    termEng: 'anchorage',
    category: 'anchor',
    definition: 'Anchorage — a place to drop anchor with shelter and good holding.',
    pronunciation: 'see-DREE-shteh',
  },
  {
    id: 'g-lanac',
    termCro: 'Lanac',
    termEng: 'chain',
    category: 'anchor',
    definition:
      'Anchor chain. The weight of the chain holds the boat as much as the anchor itself.',
  },
  {
    id: 'g-konop',
    termCro: 'Konop',
    termEng: 'rope · line',
    category: 'anchor',
    definition: 'Rope. Used for mooring lines, dock lines, and beyond the chain.',
  },
  {
    id: 'g-bocun',
    termCro: 'Bocun',
    termEng: 'fender',
    category: 'boat',
    definition: 'Inflatable bumper hung over the side when docking.',
    pronunciation: 'BO-tsoon',
  },
  {
    id: 'g-bova',
    termCro: 'Bova',
    termEng: 'buoy',
    category: 'navigation',
    definition: 'Floating buoy — for mooring, navigation, or marking.',
    pronunciation: 'BO-va',
  },
  {
    id: 'g-vez',
    termCro: 'Vez',
    termEng: 'mooring · berth',
    category: 'anchor',
    definition: 'A specific tied-up spot in a marina or harbour.',
  },
  {
    id: 'g-privezivanje',
    termCro: 'Privezivanje',
    termEng: 'mooring up',
    category: 'maneuver',
    definition: 'The act of tying up the boat — to a dock, mooring, or anchor.',
  },

  /* ---------- Boat types ---------- */
  {
    id: 'g-brod',
    termCro: 'Brod',
    termEng: 'boat · ship',
    category: 'boat',
    definition: 'Generic word for any vessel.',
  },
  {
    id: 'g-barka',
    termCro: 'Barka',
    termEng: 'small wooden boat',
    category: 'boat',
    definition: 'Traditional small wooden Adriatic fishing boat.',
    pronunciation: 'BAR-ka',
  },
  {
    id: 'g-pasara',
    termCro: 'Pasara',
    termEng: 'small fishing boat',
    category: 'boat',
    definition:
      'Traditional Croatian small open fishing boat. Wooden, often single oar plus small outboard.',
    pronunciation: 'pa-SA-ra',
  },
  {
    id: 'g-gajeta',
    termCro: 'Gajeta',
    termEng: 'traditional sailing boat',
    category: 'boat',
    definition:
      'Adriatic traditional wooden sailing/fishing vessel — distinctive curved bow and lateen sail. Hektorović\'s likely vessel.',
    pronunciation: 'GA-ye-ta',
  },
  {
    id: 'g-leut',
    termCro: 'Leut',
    termEng: 'lateen sailboat',
    category: 'boat',
    definition:
      'Traditional Croatian wooden boat with a lateen (triangular) sail. Often used for fishing in the past.',
    pronunciation: 'LEH-oot',
  },

  /* ---------- Weather + navigation ---------- */
  {
    id: 'g-naoblacenje',
    termCro: 'Naoblačenje',
    termEng: 'clouding over',
    category: 'weather',
    definition: 'When the sky goes from clear to cloudy. Often signals weather change.',
  },
  {
    id: 'g-vrijeme',
    termCro: 'Vrijeme',
    termEng: 'weather · time',
    category: 'weather',
    definition: 'In Croatian, the same word means "weather" and "time". Context decides.',
  },
  {
    id: 'g-plovidba',
    termCro: 'Plovidba',
    termEng: 'sailing · navigation',
    category: 'navigation',
    definition: 'The activity of sailing or navigating. The journey itself.',
    pronunciation: 'PLO-veed-ba',
  },
  {
    id: 'g-kurs',
    termCro: 'Kurs',
    termEng: 'course · heading',
    category: 'navigation',
    definition: 'Compass course. Direction the boat is pointing.',
  },
  {
    id: 'g-rt',
    termCro: 'Rt',
    termEng: 'cape · point',
    category: 'place',
    definition: 'Cape, point, or headland of land jutting into the sea.',
  },
  {
    id: 'g-punta',
    termCro: 'Punta',
    termEng: 'point',
    category: 'place',
    definition: 'Smaller point or headland, often used in place names (Punta...).',
  },
  {
    id: 'g-otok',
    termCro: 'Otok',
    termEng: 'island',
    category: 'place',
    definition: 'Island. Croatian coast has 1,200+.',
  },
  {
    id: 'g-hrid',
    termCro: 'Hrid',
    termEng: 'rock outcropping',
    category: 'place',
    definition: 'Bare rock outcropping above water. Hazardous to navigation if not charted.',
  },
  {
    id: 'g-greben',
    termCro: 'Greben',
    termEng: 'reef · ridge',
    category: 'place',
    definition: 'Submerged or barely-visible reef. Always check the chart.',
  },
  {
    id: 'g-plicak',
    termCro: 'Plićak',
    termEng: 'shallows',
    category: 'place',
    definition: 'Shallow water. Watch the depth sounder.',
    pronunciation: 'PLEE-chak',
  },
  {
    id: 'g-lucica',
    termCro: 'Lučica',
    termEng: 'small port · cove',
    category: 'place',
    definition: 'Small harbour or sheltered cove.',
    pronunciation: 'LOO-chit-sa',
  },
  {
    id: 'g-uvala',
    termCro: 'Uvala',
    termEng: 'bay · cove',
    category: 'place',
    definition: 'Bay or cove. Often a good anchorage if oriented away from prevailing wind.',
  },
  {
    id: 'g-dno',
    termCro: 'Dno',
    termEng: 'bottom · seabed',
    category: 'navigation',
    definition: 'Sea bottom. Type matters for anchor holding.',
  },

  /* ---------- Fishing terms (overlap with Almanac) ---------- */
  {
    id: 'g-parangal',
    termCro: 'Parangal',
    termEng: 'longline',
    category: 'fishing',
    definition:
      'Long horizontal line with hundreds of baited hooks at intervals. Set at depth, hauled hours later.',
    pronunciation: 'pa-RAN-gal',
  },
  {
    id: 'g-panula',
    termCro: 'Panula',
    termEng: 'trolling',
    category: 'fishing',
    definition:
      'Trolling a lure behind a slow-moving boat. Targets pelagic fish like skuša, palamida, gof.',
    pronunciation: 'PA-nu-la',
  },
  {
    id: 'g-koza',
    termCro: 'Koža',
    termEng: 'night squid jigging',
    category: 'fishing',
    definition:
      'Night squid jigging under torchlight. Hektorović\'s 1568 method, still alive on Hvar/Vis.',
    pronunciation: 'KO-zha',
  },
  {
    id: 'g-vrse',
    termCro: 'Vrše',
    termEng: 'woven traps',
    category: 'fishing',
    definition: 'Traditional woven willow or wire traps. Set at dusk, retrieved at dawn.',
    pronunciation: 'VEHR-she',
  },
  {
    id: 'g-mreza',
    termCro: 'Mreža',
    termEng: 'net',
    category: 'fishing',
    definition: 'Net. Various types — gillnet, drift net, drag net.',
  },
  {
    id: 'g-osti',
    termCro: 'Osti',
    termEng: 'spear · trident',
    category: 'fishing',
    definition: 'Spearfishing harpoon. Hand-held, often with multiple prongs.',
    pronunciation: 'OS-tee',
  },
];
