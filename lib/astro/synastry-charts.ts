/**
 * lib/astro/synastry-charts.ts
 * Cartas avanzadas para Especial Parejas:
 *   · Compuesta (puntos medios)
 *   · Dracónica (traslación al Nodo Norte = 0°)
 *   · Davison (punto de relación: JD promedio + lat/lon promedio)
 *   · Progresada secundaria (1 año = 1 día)
 *   · Tránsitos actuales (incluyendo Quirón aproximado)
 *   · Aspectos partiles de sinastría (orbe < 1°)
 *   · Tránsitos de planetas lentos sobre carta compuesta
 */

import { calculateNatalChart, toJulianDay } from './ephemeris';
import type { NatalChart, BirthInput } from './ephemeris';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function normalizeAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

const SIGNS_ES = [
  'Aries','Tauro','Géminis','Cáncer','Leo','Virgo',
  'Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis',
];

function signAndDeg(lon: number): string {
  const l   = normalizeAngle(lon);
  const sign = SIGNS_ES[Math.floor(l / 30)];
  const deg  = l % 30;
  const d    = Math.floor(deg);
  const m    = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}' ${sign}`;
}

/** Punto medio entre dos longitudes (elige el arco menor). */
function midpointLon(a: number, b: number): number {
  const diff = Math.abs(a - b);
  let mid = (a + b) / 2;
  if (diff > 180) mid = normalizeAngle(mid + 180);
  return normalizeAngle(mid);
}

/** Convierte Día Juliano a fecha/hora UTC (Meeus cap. 7, inverso). */
function julianDayToDate(jd: number): { year: number; month: number; day: number; hour: number; minute: number } {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b    = a + 1524;
  const c    = Math.floor((b - 122.1) / 365.25);
  const d    = Math.floor(365.25 * c);
  const e    = Math.floor((b - d) / 30.6001);
  const day  = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year  = month > 2 ? c - 4716 : c - 4715;
  const hFrac = f * 24;
  const hour  = Math.floor(hFrac);
  const minute = Math.floor((hFrac - hour) * 60);
  return { year, month, day, hour, minute };
}

// ─── Punto compuesto ──────────────────────────────────────────────────────────

export interface CompositePoint {
  name:      string;
  longitude: number;
  posStr:    string;
  retrograde?: boolean;
}

/** Carta Compuesta: punto medio de cada par de planetas. */
export function computeCompositePoints(chart1: NatalChart, chart2: NatalChart): CompositePoint[] {
  const points: CompositePoint[] = [];

  for (const p1 of chart1.planets) {
    const p2 = chart2.planets.find(p => p.name === p1.name);
    if (!p2) continue;
    const lon = midpointLon(p1.longitude, p2.longitude);
    points.push({ name: p1.name, longitude: lon, posStr: signAndDeg(lon) });
  }

  const nnLon  = midpointLon(chart1.northNode.longitude,   chart2.northNode.longitude);
  const ascLon = midpointLon(chart1.ascendant.longitude,   chart2.ascendant.longitude);
  const mcLon  = midpointLon(chart1.midheaven.longitude,   chart2.midheaven.longitude);

  points.push({ name: 'Nodo Norte Compuesto', longitude: nnLon,  posStr: signAndDeg(nnLon)  });
  points.push({ name: 'ASC Compuesto',        longitude: ascLon, posStr: signAndDeg(ascLon) });
  points.push({ name: 'MC Compuesto',         longitude: mcLon,  posStr: signAndDeg(mcLon)  });

  return points;
}

// ─── Carta Dracónica ──────────────────────────────────────────────────────────

/** Carta Dracónica: resta el Nodo Norte de todas las posiciones (NN → 0° Aries). */
export function computeDraconicPoints(chart: NatalChart): CompositePoint[] {
  const shift = chart.northNode.longitude;
  const points: CompositePoint[] = chart.planets.map(p => ({
    name:      p.name,
    longitude: normalizeAngle(p.longitude - shift),
    posStr:    signAndDeg(normalizeAngle(p.longitude - shift)),
    retrograde: p.retrograde,
  }));
  const ascLon = normalizeAngle(chart.ascendant.longitude - shift);
  const mcLon  = normalizeAngle(chart.midheaven.longitude - shift);
  points.push({ name: 'ASC Dracónico', longitude: ascLon, posStr: signAndDeg(ascLon) });
  points.push({ name: 'MC Dracónico',  longitude: mcLon,  posStr: signAndDeg(mcLon)  });
  return points;
}

// ─── Carta de Davison ────────────────────────────────────────────────────────

/** Carta de Davison: JD promedio de ambos nacimientos + latitud/longitud promedio. */
export function computeDavisonChart(birth1: BirthInput, birth2: BirthInput): NatalChart {
  const jd1   = toJulianDay(birth1.year, birth1.month, birth1.day, birth1.hour, birth1.minute);
  const jd2   = toJulianDay(birth2.year, birth2.month, birth2.day, birth2.hour, birth2.minute);
  const midJD  = (jd1 + jd2) / 2;
  const midLat = (birth1.latitude  + birth2.latitude)  / 2;
  const midLon = (birth1.longitude + birth2.longitude) / 2;
  const { year, month, day, hour, minute } = julianDayToDate(midJD);
  return calculateNatalChart({ year, month, day, hour, minute, latitude: midLat, longitude: midLon });
}

// ─── Carta Progresada Secundaria ──────────────────────────────────────────────

/**
 * Progresiones secundarias: 1 año de vida = 1 día después del nacimiento.
 * targetYear/Month/Day: fecha actual para la que se calculan las progresiones.
 */
export function computeProgressedChart(
  birth: BirthInput,
  targetYear: number, targetMonth: number, targetDay: number,
): NatalChart {
  const birthJD    = toJulianDay(birth.year, birth.month, birth.day, birth.hour, birth.minute);
  const targetJD   = toJulianDay(targetYear, targetMonth, targetDay, 12, 0);
  const ageInDays  = targetJD - birthJD;
  // 1 año = 1 día → edad en años = edad en días / 365.25 → días desde nacimiento en progresiones
  const progressedJD = birthJD + ageInDays / 365.25;
  const pd = julianDayToDate(progressedJD);
  return calculateNatalChart({ ...pd, latitude: birth.latitude, longitude: birth.longitude });
}

// ─── Tránsitos Actuales ───────────────────────────────────────────────────────

/** Posición aproximada de Quirón (calibrada para 2020-2030). */
function chiron2020s(): CompositePoint {
  const now = new Date();
  const y = now.getUTCFullYear() + now.getUTCMonth() / 12 + now.getUTCDate() / 365;
  // Calibración: ~3.5° Aries en 2020.0, moviéndose ~3.2°/año (período 50.7 años)
  const lon = normalizeAngle(3.5 + 3.2 * (y - 2020));
  return { name: 'Quirón', longitude: lon, posStr: signAndDeg(lon) };
}

/** Posiciones planetarias actuales (planetas del sistema solar + Quirón aproximado). */
export function computeCurrentTransits(): CompositePoint[] {
  const now = new Date();
  const transit = calculateNatalChart({
    year:      now.getUTCFullYear(),
    month:     now.getUTCMonth() + 1,
    day:       now.getUTCDate(),
    hour:      now.getUTCHours(),
    minute:    now.getUTCMinutes(),
    latitude:  0,
    longitude: 0,
  });
  const points: CompositePoint[] = transit.planets.map(p => ({
    name:      p.name,
    longitude: p.longitude,
    posStr:    p.degreeStr + (p.retrograde ? ' ℞' : ''),
    retrograde: p.retrograde,
  }));
  points.push(chiron2020s());
  return points;
}

// ─── Aspectos Partiles de Sinastría (orbe < 1°) ───────────────────────────────

const ASPECTS_DEF = [
  { name: 'Conjunción', angle: 0   },
  { name: 'Sextil',     angle: 60  },
  { name: 'Cuadratura', angle: 90  },
  { name: 'Trígono',    angle: 120 },
  { name: 'Oposición',  angle: 180 },
];

const PERSONAL = ['Sol', 'Luna', 'Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno'];

/** Aspectos de sinastría con orbe < 1° (los que "se sienten en la piel"). */
export function getPartileAspects(chart1: NatalChart, chart2: NatalChart): string[] {
  const result: string[] = [];
  for (const p1 of chart1.planets.filter(p => PERSONAL.includes(p.name))) {
    for (const p2 of chart2.planets.filter(p => PERSONAL.includes(p.name))) {
      const diff  = Math.abs(p1.longitude - p2.longitude);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECTS_DEF) {
        const orb = Math.abs(angle - asp.angle);
        if (orb < 1.0) {
          const orbMin = Math.round(orb * 60);
          result.push(`**${p1.name} en ${asp.name} exacta con ${p2.name}** (orbe ${orbMin}')`);
          break;
        }
      }
    }
  }
  return result;
}

// ─── Tránsitos sobre Carta Compuesta ─────────────────────────────────────────

const SLOW_PLANETS = ['Júpiter', 'Saturno', 'Urano', 'Neptuno', 'Plutón', 'Quirón'];

/** Aspectos de planetas lentos en tránsito sobre puntos de la carta compuesta. */
export function getTransitsOnComposite(
  composite: CompositePoint[],
  transits:  CompositePoint[],
): string[] {
  const result: string[] = [];
  for (const t of transits.filter(t => SLOW_PLANETS.includes(t.name))) {
    for (const c of composite.filter(c => !['ASC Compuesto', 'MC Compuesto', 'Nodo Norte Compuesto'].includes(c.name))) {
      const diff  = Math.abs(t.longitude - c.longitude);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECTS_DEF) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= 3) {
          result.push(`${t.name} (${t.posStr}) en **${asp.name}** sobre ${c.name} compuesto (${c.posStr}) — orbe ${orb.toFixed(1)}°`);
          break;
        }
      }
    }
  }
  return result;
}

// ─── Formateo para prompt ─────────────────────────────────────────────────────

/** Formatea la carta compuesta como bloque de texto para el prompt. */
export function formatCompositeForPrompt(points: CompositePoint[]): string {
  const personalPoints = points.filter(p => PERSONAL.includes(p.name));
  const extraPoints    = points.filter(p => !PERSONAL.includes(p.name));
  return [
    'PLANETAS:',
    ...personalPoints.map(p => `  ${p.name}: ${p.posStr}`),
    'PUNTOS SENSIBLES:',
    ...extraPoints.map(p => `  ${p.name}: ${p.posStr}`),
  ].join('\n');
}

/** Formatea los planetas progresados más importantes (Sol, Luna, Venus, Marte). */
export function formatProgressedForPrompt(chart: NatalChart, natalChart: NatalChart): string {
  const KEY = ['Sol', 'Luna', 'Venus', 'Marte'];
  const lines: string[] = [];
  for (const name of KEY) {
    const prog  = chart.planets.find(p => p.name === name);
    const natal = natalChart.planets.find(p => p.name === name);
    if (prog && natal) {
      const moved = Math.abs(prog.longitude - natal.longitude);
      lines.push(`  ${name}: natal ${natal.degreeStr} → progresado ${prog.degreeStr} (avanzó ${moved.toFixed(1)}°)`);
    }
  }
  return lines.join('\n');
}

/** Formatea los tránsitos actuales como texto compacto. */
export function formatTransitsForPrompt(transits: CompositePoint[]): string {
  return transits.map(t => `  ${t.name}: ${t.posStr}`).join('\n');
}

/** Formatea los puntos dracónicos clave (Sol, Luna, ASC) como texto. */
export function formatDraconicKeyPoints(points: CompositePoint[]): string {
  const KEY = ['Sol', 'Luna', 'Venus', 'ASC Dracónico'];
  return points
    .filter(p => KEY.includes(p.name))
    .map(p => `  ${p.name} dracónico: ${p.posStr}`)
    .join('\n');
}
