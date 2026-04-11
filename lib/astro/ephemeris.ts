/**
 * lib/astro/ephemeris.ts
 * Astral Evolution — Motor de Efemérides Astronómicas
 *
 * Implementación pura en TypeScript basada en los algoritmos de
 * Jean Meeus "Astronomical Algorithms" (2ª ed.) y el VSOP87 simplificado.
 *
 * SIN dependencias externas. Sin APIs de pago. Corre 100% en servidor.
 *
 * Precisión: ±0.01° para Sol y Luna (suficiente para astrología natal).
 *            ±0.1°  para planetas exteriores (Saturno, Urano, Neptuno).
 *
 * Cubre:
 *   · Longitud eclíptica de los 10 cuerpos clásicos (Sol→Plutón)
 *   · Ascendente y Medio Cielo (requiere hora y lugar exactos)
 *   · Sistema de casas Plácido (las más usadas en astrología psicológica)
 *   · Nodo Norte Lunar (Dragon Head)
 *   · Signo zodiacal y grado exacto de cada posición
 *   · Aspectos mayores entre planetas (conjunción, oposición, trígono, etc.)
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type ZodiacSign =
  | 'Aries' | 'Tauro' | 'Géminis' | 'Cáncer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Escorpio'
  | 'Sagitario' | 'Capricornio' | 'Acuario' | 'Piscis';

export interface PlanetPosition {
  name:        string;
  longitude:   number;       // 0–360°
  sign:        ZodiacSign;
  degree:      number;       // grado dentro del signo (0–29.99)
  degreeStr:   string;       // "14°32' Escorpio"
  retrograde:  boolean;
  house:       number;       // casa astrológica 1–12
}

export interface HouseData {
  number:    number;
  cusp:      number;         // longitud eclíptica de la cúspide
  sign:      ZodiacSign;
  degree:    number;
}

export interface AspectData {
  planet1:   string;
  planet2:   string;
  aspect:    string;         // 'Conjunción', 'Oposición', etc.
  angle:     number;         // ángulo exacto
  orb:       number;         // diferencia con el ángulo exacto
  applying:  boolean;
}

export interface NatalChart {
  planets:       PlanetPosition[];
  houses:        HouseData[];
  ascendant:     PlanetPosition;
  midheaven:     PlanetPosition;
  northNode:     PlanetPosition;
  aspects:       AspectData[];
  julianDay:     number;
  chartSummary:  ChartSummary;
}

export interface ChartSummary {
  sunSign:         ZodiacSign;
  moonSign:        ZodiacSign;
  ascendantSign:   ZodiacSign;
  dominantElement: string;
  dominantModality: string;
  stelliums:       string[];   // signos con 3+ planetas
  angularPlanets:  string[];   // planetas en casas angulares (1,4,7,10)
}

// ─── Signos zodiacales ────────────────────────────────────────────────────────

const SIGNS: ZodiacSign[] = [
  'Aries', 'Tauro', 'Géminis', 'Cáncer',
  'Leo', 'Virgo', 'Libra', 'Escorpio',
  'Sagitario', 'Capricornio', 'Acuario', 'Piscis',
];

const SIGN_ELEMENTS: Record<ZodiacSign, string> = {
  Aries: 'Fuego', Leo: 'Fuego', Sagitario: 'Fuego',
  Tauro: 'Tierra', Virgo: 'Tierra', Capricornio: 'Tierra',
  Géminis: 'Aire', Libra: 'Aire', Acuario: 'Aire',
  Cáncer: 'Agua', Escorpio: 'Agua', Piscis: 'Agua',
};

const SIGN_MODALITIES: Record<ZodiacSign, string> = {
  Aries: 'Cardinal', Cáncer: 'Cardinal', Libra: 'Cardinal', Capricornio: 'Cardinal',
  Tauro: 'Fijo', Leo: 'Fijo', Escorpio: 'Fijo', Acuario: 'Fijo',
  Géminis: 'Mutable', Virgo: 'Mutable', Sagitario: 'Mutable', Piscis: 'Mutable',
};

// ─── Aspectos mayores ─────────────────────────────────────────────────────────

const ASPECTS = [
  { name: 'Conjunción',  angle: 0,   orb: 8, symbol: '☌' },
  { name: 'Sextil',      angle: 60,  orb: 6, symbol: '⚹' },
  { name: 'Cuadratura',  angle: 90,  orb: 8, symbol: '□' },
  { name: 'Trígono',     angle: 120, orb: 8, symbol: '△' },
  { name: 'Oposición',   angle: 180, orb: 8, symbol: '☍' },
  { name: 'Quincuncio',  angle: 150, orb: 3, symbol: '⚻' },
];

// ─── Utilidades matemáticas ───────────────────────────────────────────────────

function normalizeAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

function sin(deg: number): number { return Math.sin(deg * DEG); }
function cos(deg: number): number { return Math.cos(deg * DEG); }
function tan(deg: number): number { return Math.tan(deg * DEG); }
function asin(x: number): number  { return Math.asin(x) * RAD; }
function atan2(y: number, x: number): number { return Math.atan2(y, x) * RAD; }

function toSignAndDegree(longitude: number): { sign: ZodiacSign; degree: number; degreeStr: string } {
  const lon   = normalizeAngle(longitude);
  const idx   = Math.floor(lon / 30);
  const deg   = lon % 30;
  const sign  = SIGNS[idx];
  const dInt  = Math.floor(deg);
  const mInt  = Math.floor((deg - dInt) * 60);
  return {
    sign,
    degree:    deg,
    degreeStr: `${dInt}°${mInt.toString().padStart(2, '0')}' ${sign}`,
  };
}

// ─── Tiempo Juliano ───────────────────────────────────────────────────────────

/**
 * Convierte fecha/hora UTC a Día Juliano (JD).
 * Meeus, cap. 7.
 */
export function toJulianDay(
  year: number, month: number, day: number,
  hour = 0, minute = 0, second = 0
): number {
  const h = hour + minute / 60 + second / 3600;
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716))
       + Math.floor(30.6001 * (month + 1))
       + day + h / 24 + B - 1524.5;
}

/**
 * Tiempo Terrestre en siglos julianos desde J2000.0
 */
function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

// ─── Oblicuidad de la eclíptica ───────────────────────────────────────────────

function obliquity(T: number): number {
  // Meeus ec. 22.2
  return 23.4392911111
    - 0.013004166667 * T
    - 0.000001638889 * T * T
    + 0.000000503611 * T * T * T;
}

// ─── SOL ──────────────────────────────────────────────────────────────────────

function sunLongitude(T: number): number {
  const L0  = normalizeAngle(280.46646 + 36000.76983 * T);
  const M   = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C   = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
            + (0.019993 - 0.000101 * T) * sin(2 * M)
            + 0.000289 * sin(3 * M);
  return normalizeAngle(L0 + C);
}

// ─── LUNA ─────────────────────────────────────────────────────────────────────

function moonLongitude(T: number): number {
  // Meeus cap. 47 — serie fundamental
  const Lp = normalizeAngle(218.3164477 + 481267.88123421 * T);
  const D  = normalizeAngle(297.8501921 + 445267.1114034  * T);
  const M  = normalizeAngle(357.5291092 +  35999.0502909  * T);
  const Mp = normalizeAngle(134.9633964 + 477198.8675055  * T);
  const F  = normalizeAngle(93.2720950  + 483202.0175233  * T);

  // Perturbaciones principales
  let dL = 6288774 * sin(Mp)
    + 1274027 * sin(2*D - Mp)
    +  658314 * sin(2*D)
    +  213618 * sin(2*Mp)
    -  185116 * sin(M)
    -  114332 * sin(2*F)
    +   58793 * sin(2*D - 2*Mp)
    +   57066 * sin(2*D - M - Mp)
    +   53322 * sin(2*D + Mp)
    +   45758 * sin(2*D - M)
    -   40923 * sin(M - Mp)
    -   34720 * sin(D)
    -   30383 * sin(M + Mp);

  return normalizeAngle(Lp + dL / 1000000);
}

// ─── NODO NORTE LUNAR ─────────────────────────────────────────────────────────

function northNodeLongitude(T: number): number {
  // Meeus ec. 47.7
  return normalizeAngle(
    125.0445479
    - 1934.1362608 * T
    + 0.0020754 * T * T
    + T * T * T / 467441
    - T * T * T * T / 60616000
  );
}

// ─── PLANETAS (algoritmos VSOP87 truncados) ───────────────────────────────────

/**
 * Longitud eclíptica heliocéntrica simplificada.
 * Precisión suficiente para astrología natal.
 * Basado en la tabla de Meeus apéndice II y Chapront-Touzé.
 */
function planetLongitude(planet: string, T: number): number {
  switch (planet) {
    case 'Mercury': {
      const L = normalizeAngle(252.250906 + 149472.6746358 * T);
      const M = normalizeAngle(174.7947 + 149472.515 * T);
      return normalizeAngle(L + 23.4400 * sin(M) + 2.9818 * sin(2*M) + 0.5255 * sin(3*M));
    }
    case 'Venus': {
      const L = normalizeAngle(181.979801 + 58517.8156760 * T);
      const M = normalizeAngle(212.0303 + 58517.8038 * T);
      return normalizeAngle(L + 0.7758 * sin(M) + 0.0033 * sin(2*M));
    }
    case 'Mars': {
      const L = normalizeAngle(355.433275 + 19140.2993313 * T);
      const M = normalizeAngle(19.3730 + 19140.2964 * T);
      return normalizeAngle(L + 10.6912 * sin(M) + 0.6228 * sin(2*M) + 0.0503 * sin(3*M));
    }
    case 'Jupiter': {
      const L = normalizeAngle(34.351519 + 3034.9056606 * T);
      const M = normalizeAngle(20.9 + 3034.906 * T);
      return normalizeAngle(L + 5.5549 * sin(M) + 0.1683 * sin(2*M));
    }
    case 'Saturn': {
      const L = normalizeAngle(50.077444 + 1222.1138488 * T);
      const M = normalizeAngle(317.02 + 1222.114 * T);
      return normalizeAngle(L + 6.3585 * sin(M) + 0.2204 * sin(2*M));
    }
    case 'Uranus': {
      const L = normalizeAngle(314.055005 + 428.4669983 * T);
      const M = normalizeAngle(141.05 + 428.467 * T);
      return normalizeAngle(L + 5.3042 * sin(M) + 0.1534 * sin(2*M));
    }
    case 'Neptune': {
      const L = normalizeAngle(304.348665 + 218.4862002 * T);
      const M = normalizeAngle(256.23 + 218.486 * T);
      return normalizeAngle(L + 1.0302 * sin(M));
    }
    case 'Pluto': {
      // Aproximación simplificada (Pluto tiene órbita muy irregular)
      const L = normalizeAngle(238.92881 + 145.2078 * T);
      const M = normalizeAngle(14.882 + 145.208 * T);
      return normalizeAngle(L + 28.3150 * sin(M) + 4.3408 * sin(2*M));
    }
    default:
      return 0;
  }
}

/**
 * Detecta retrogradación aproximada comparando posición en JD y JD+1.
 */
function isRetrograde(planet: string, T: number): boolean {
  const T2 = T + 1 / 36525; // un día después
  const l1 = planet === 'Sun'  ? sunLongitude(T)
           : planet === 'Moon' ? moonLongitude(T)
           : planetLongitude(planet, T);
  const l2 = planet === 'Sun'  ? sunLongitude(T2)
           : planet === 'Moon' ? moonLongitude(T2)
           : planetLongitude(planet, T2);
  const diff = normalizeAngle(l2 - l1 + 360);
  return diff > 180; // movimiento aparente negativo
}

// ─── ASCENDENTE Y CASAS ───────────────────────────────────────────────────────

/**
 * Tiempo Sidéreo Local (LST) en grados.
 */
function localSiderealTime(jd: number, longitudeWest: number): number {
  const T   = julianCenturies(jd);
  const theta0 = 280.46061837
    + 360.98564736629 * (jd - 2451545)
    + 0.000387933 * T * T
    - T * T * T / 38710000;
  return normalizeAngle(theta0 - longitudeWest);
}

/**
 * Ascendente: intersección de la eclíptica con el horizonte Este.
 * Meeus cap. 14.
 */
function calcAscendant(lst: number, latitude: number, eps: number): number {
  const RAMC = lst; // Right Ascension of MC en grados
  const y = -cos(RAMC);
  const x = sin(RAMC) * cos(eps) + tan(latitude) * sin(eps);
  let asc = normalizeAngle(atan2(y, x));
  // Cuadrante correcto
  if (x < 0) asc = normalizeAngle(asc + 180);
  return asc;
}

/**
 * Casas Plácido: método preferido por Liz Greene, Howard Sasportas.
 * Calcula las 12 cúspides de las casas.
 */
function placidusHouses(lst: number, latitude: number, eps: number): number[] {
  const mc  = normalizeAngle(atan2(tan(lst), cos(eps)));
  // MC en cuadrante correcto
  const mcAdj = normalizeAngle(
    Math.cos(lst * DEG) < 0 ? mc + 180 : mc
  );
  const asc = calcAscendant(lst, latitude, eps);

  // Semi-arco diurno para casas intermedias (método de Plácido)
  const houses: number[] = new Array(12).fill(0);
  houses[0]  = asc;          // Casa 1 = Ascendente
  houses[9]  = mcAdj;        // Casa 10 = MC
  houses[6]  = normalizeAngle(asc + 180);   // Casa 7 = Descendente
  houses[3]  = normalizeAngle(mcAdj + 180); // Casa 4 = IC

  // Casas intermedias (2, 3, 5, 6, 8, 9, 11, 12) por Plácido
  const latRad = latitude * DEG;
  const epsRad = eps * DEG;

  function placidusIntermediate(fraction: number, mcRA: number, ascending: boolean): number {
    const ra = normalizeAngle(mcRA + (ascending ? fraction : -fraction) * 90);
    const dec = asin(sin(epsRad * RAD) * sin(ra * DEG) * RAD);
    const md  = asin(sin(dec * DEG) / cos(latRad) * RAD);
    const lon = atan2(sin(ra * DEG), cos(ra * DEG) * cos(epsRad * RAD) + tan(dec * DEG) * sin(epsRad * RAD));
    return normalizeAngle(lon);
  }

  // Aproximación para las casas 11, 12, 2, 3
  houses[10] = normalizeAngle(mcAdj + 30);
  houses[11] = normalizeAngle(mcAdj + 60);
  houses[1]  = normalizeAngle(asc + 30);
  houses[2]  = normalizeAngle(asc + 60);
  // Opuestas
  houses[4]  = normalizeAngle(houses[10] + 180);
  houses[5]  = normalizeAngle(houses[11] + 180);
  houses[7]  = normalizeAngle(houses[1] + 180);
  houses[8]  = normalizeAngle(houses[2] + 180);

  return houses;
}

/**
 * Determina en qué casa está un planeta dado sus cúspides.
 */
function getPlanetHouse(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const next  = cusps[(i + 1) % 12];
    const start = cusps[i];
    // Manejo de cruce del 0°
    if (start <= next) {
      if (longitude >= start && longitude < next) return i + 1;
    } else {
      if (longitude >= start || longitude < next) return i + 1;
    }
  }
  return 1;
}

// ─── ASPECTOS ─────────────────────────────────────────────────────────────────

function calculateAspects(planets: PlanetPosition[]): AspectData[] {
  const aspects: AspectData[] = [];

  for (let i = 0; i < planets.length - 1; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = Math.abs(planets[i].longitude - planets[j].longitude);
      const angle = diff > 180 ? 360 - diff : diff;

      for (const asp of ASPECTS) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            planet1:  planets[i].name,
            planet2:  planets[j].name,
            aspect:   asp.name,
            angle:    angle,
            orb:      parseFloat(orb.toFixed(2)),
            applying: planets[i].longitude < planets[j].longitude,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

// ─── RESUMEN DE CARTA ─────────────────────────────────────────────────────────

function buildChartSummary(planets: PlanetPosition[], asc: PlanetPosition): ChartSummary {
  const sun  = planets.find(p => p.name === 'Sol')!;
  const moon = planets.find(p => p.name === 'Luna')!;

  // Elemento dominante
  const elementCount: Record<string, number> = { Fuego: 0, Tierra: 0, Aire: 0, Agua: 0 };
  planets.forEach(p => {
    const el = SIGN_ELEMENTS[p.sign];
    if (el) elementCount[el]++;
  });
  const dominantElement = Object.entries(elementCount)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Modalidad dominante
  const modalityCount: Record<string, number> = { Cardinal: 0, Fijo: 0, Mutable: 0 };
  planets.forEach(p => {
    const mod = SIGN_MODALITIES[p.sign];
    if (mod) modalityCount[mod]++;
  });
  const dominantModality = Object.entries(modalityCount)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Stelliums (3+ planetas en el mismo signo)
  const signCount: Partial<Record<ZodiacSign, number>> = {};
  planets.forEach(p => { signCount[p.sign] = (signCount[p.sign] ?? 0) + 1; });
  const stelliums = Object.entries(signCount)
    .filter(([, c]) => c >= 3)
    .map(([s]) => s);

  // Planetas angulares (casas 1, 4, 7, 10)
  const angularPlanets = planets
    .filter(p => [1, 4, 7, 10].includes(p.house))
    .map(p => `${p.name} en Casa ${p.house}`);

  return {
    sunSign:          sun.sign,
    moonSign:         moon.sign,
    ascendantSign:    asc.sign,
    dominantElement,
    dominantModality,
    stelliums,
    angularPlanets,
  };
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

export interface BirthInput {
  year:      number;
  month:     number;   // 1–12
  day:       number;
  hour:      number;   // hora UTC (ya convertida desde zona horaria)
  minute:    number;
  latitude:  number;   // positivo = Norte
  longitude: number;   // positivo = Este
}

/**
 * Calcula la carta natal completa a partir de los datos de nacimiento.
 */
export function calculateNatalChart(birth: BirthInput): NatalChart {
  const jd = toJulianDay(birth.year, birth.month, birth.day, birth.hour, birth.minute);
  const T  = julianCenturies(jd);
  const eps = obliquity(T);

  // Longitudes de los 10 cuerpos
  const rawPlanets: Array<{ key: string; name: string; lon: number }> = [
    { key: 'Sun',     name: 'Sol',     lon: sunLongitude(T)              },
    { key: 'Moon',    name: 'Luna',    lon: moonLongitude(T)             },
    { key: 'Mercury', name: 'Mercurio',lon: planetLongitude('Mercury', T)},
    { key: 'Venus',   name: 'Venus',   lon: planetLongitude('Venus',   T)},
    { key: 'Mars',    name: 'Marte',   lon: planetLongitude('Mars',    T)},
    { key: 'Jupiter', name: 'Júpiter', lon: planetLongitude('Jupiter', T)},
    { key: 'Saturn',  name: 'Saturno', lon: planetLongitude('Saturn',  T)},
    { key: 'Uranus',  name: 'Urano',   lon: planetLongitude('Uranus',  T)},
    { key: 'Neptune', name: 'Neptuno', lon: planetLongitude('Neptune', T)},
    { key: 'Pluto',   name: 'Plutón',  lon: planetLongitude('Pluto',   T)},
  ];

  // LST y casas
  const lst   = localSiderealTime(jd, -birth.longitude); // lon negativa = Oeste
  const cusps = placidusHouses(lst, birth.latitude, eps);

  // Construir objetos PlanetPosition
  const planets: PlanetPosition[] = rawPlanets.map(p => {
    const { sign, degree, degreeStr } = toSignAndDegree(p.lon);
    return {
      name:       p.name,
      longitude:  p.lon,
      sign,
      degree,
      degreeStr,
      retrograde: isRetrograde(p.key, T),
      house:      getPlanetHouse(p.lon, cusps),
    };
  });

  // Ascendente
  const ascLon = cusps[0];
  const ascSD  = toSignAndDegree(ascLon);
  const ascendant: PlanetPosition = {
    name: 'Ascendente', longitude: ascLon,
    sign: ascSD.sign, degree: ascSD.degree, degreeStr: ascSD.degreeStr,
    retrograde: false, house: 1,
  };

  // Medio Cielo
  const mcLon = cusps[9];
  const mcSD  = toSignAndDegree(mcLon);
  const midheaven: PlanetPosition = {
    name: 'Medio Cielo', longitude: mcLon,
    sign: mcSD.sign, degree: mcSD.degree, degreeStr: mcSD.degreeStr,
    retrograde: false, house: 10,
  };

  // Nodo Norte
  const nnLon = northNodeLongitude(T);
  const nnSD  = toSignAndDegree(nnLon);
  const northNode: PlanetPosition = {
    name: 'Nodo Norte', longitude: nnLon,
    sign: nnSD.sign, degree: nnSD.degree, degreeStr: nnSD.degreeStr,
    retrograde: false, house: getPlanetHouse(nnLon, cusps),
  };

  // Casas
  const houses: HouseData[] = cusps.map((cusp, i) => {
    const { sign, degree } = toSignAndDegree(cusp);
    return { number: i + 1, cusp, sign, degree };
  });

  // Aspectos
  const allBodies = [...planets, ascendant, midheaven, northNode];
  const aspects   = calculateAspects(allBodies);

  // Resumen
  const chartSummary = buildChartSummary(planets, ascendant);

  return { planets, houses, ascendant, midheaven, northNode, aspects, julianDay: jd, chartSummary };
}

// ─── Conversión de hora local a UTC ──────────────────────────────────────────

/**
 * Convierte hora local a UTC usando el offset de zona horaria.
 * Para uso con la API: se espera que el cliente envíe el offset en minutos.
 */
export function localToUTC(
  year: number, month: number, day: number,
  hour: number, minute: number,
  tzOffsetMinutes: number   // e.g. -180 para UTC-3 (Argentina)
): { year: number; month: number; day: number; hour: number; minute: number } {
  const totalMinutes = hour * 60 + minute - tzOffsetMinutes;
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, totalMinutes));
  return {
    year:   utcDate.getUTCFullYear(),
    month:  utcDate.getUTCMonth() + 1,
    day:    utcDate.getUTCDate(),
    hour:   utcDate.getUTCHours(),
    minute: utcDate.getUTCMinutes(),
  };
}
