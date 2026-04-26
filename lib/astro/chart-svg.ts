/**
 * lib/astro/chart-svg.ts
 * Genera rueda astrológica en SVG puro — sin dependencias.
 * Produce carta natal individual o birueda de sinastría.
 */

import type { NatalChart } from './ephemeris';

// ─── Dimensiones ──────────────────────────────────────────────────────────────
const S   = 480;
const C   = S / 2;        // centro
const R_O = 228;          // borde exterior
const R_ZO = 215;         // zodíaco exterior
const R_ZI = 190;         // zodíaco interior
const R_P1 = 165;         // planetas carta 1 (o único)
const R_P2 = 132;         // planetas carta 2 (sinastría)
const R_IN = 88;          // círculo central

// ─── Datos simbólicos ─────────────────────────────────────────────────────────
const SIGN_GLYPHS = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Acu','Pis'];

// Colores por elemento (Fuego, Tierra, Aire, Agua — orden zodiacal)
const SEG_COLORS = [
  '#7a2020','#1e5a1e','#1e3580','#12344a',
  '#7a2020','#1e5a1e','#1e3580','#3a1270',
  '#7a2020','#1e5a1e','#1e3580','#3a1270',
];

const PLANET_GLYPHS: Record<string, string> = {
  'Sol':'Sol','Luna':'Lun','Mercurio':'Mer','Venus':'Ven','Marte':'Mar',
  'Júpiter':'Jup','Saturno':'Sat','Urano':'Ura','Neptuno':'Nep','Plutón':'Plu',
  'Nodo Norte':'NN',
};

// ─── Geometría ────────────────────────────────────────────────────────────────

/** Longitud eclíptica → coordenadas SVG. 0°=derecha, antihorario. */
function pt(r: number, lon: number): [number, number] {
  const a = (lon * Math.PI) / 180;
  return [C + r * Math.cos(a), C - r * Math.sin(a)];
}

function f(n: number) { return n.toFixed(1); }

/** Path SVG de un segmento de corona circular. */
function segPath(lon1: number, lon2: number, rO: number, rI: number): string {
  const [x1o, y1o] = pt(rO, lon1);
  const [x2o, y2o] = pt(rO, lon2);
  const [x1i, y1i] = pt(rI, lon1);
  const [x2i, y2i] = pt(rI, lon2);
  const lg = (lon2 - lon1) > 180 ? 1 : 0;
  return `M${f(x1o)},${f(y1o)} A${rO},${rO},0,${lg},0,${f(x2o)},${f(y2o)} L${f(x2i)},${f(y2i)} A${rI},${rI},0,${lg},1,${f(x1i)},${f(y1i)}Z`;
}

// ─── Planetas ─────────────────────────────────────────────────────────────────

function renderPlanets(
  chart: NatalChart,
  baseR: number,
  glyphColor: string,
  tickColor: string,
): string {
  const out: string[] = [];
  const items = [...chart.planets, chart.northNode];
  const placed: Array<{ lon: number; r: number }> = [];

  for (const p of items) {
    const glyph = PLANET_GLYPHS[p.name] ?? '·';
    const lon   = p.longitude;

    // Desconflicto simple: si hay otro planeta a < 12°, alternar radio
    let r = baseR;
    for (const q of placed) {
      const d = Math.abs(((lon - q.lon + 540) % 360) - 180);
      if (d < 12) { r = (q.r === baseR) ? baseR - 18 : baseR; break; }
    }
    placed.push({ lon, r });

    // Marca en borde interior del zodíaco
    const [t1x, t1y] = pt(R_ZI,     lon);
    const [t2x, t2y] = pt(R_ZI - 8, lon);
    out.push(`<line x1="${f(t1x)}" y1="${f(t1y)}" x2="${f(t2x)}" y2="${f(t2y)}" stroke="${tickColor}" stroke-width="1.5" opacity="0.8"/>`);

    // Círculo + glifo del planeta
    const [px, py] = pt(r, lon);
    out.push(`<circle cx="${f(px)}" cy="${f(py)}" r="14" fill="#1e1245" stroke="${glyphColor}" stroke-width="1.5" opacity="1"/>`);
    out.push(`<text x="${f(px)}" y="${f(py)}" text-anchor="middle" dominant-baseline="central" font-size="9" fill="${glyphColor}" font-family="Arial,sans-serif" font-weight="bold">${glyph}</text>`);

    if (p.retrograde) {
      out.push(`<text x="${f(px + 9)}" y="${f(py - 9)}" font-size="7" fill="#e74c3c" font-family="sans-serif">℞</text>`);
    }
  }

  return out.join('\n');
}

// ─── Constructor principal ────────────────────────────────────────────────────

function buildWheel(
  chart1: NatalChart, name1: string,
  chart2?: NatalChart, name2?: string,
): string {
  const isSyn = !!chart2;
  const parts: string[] = [];

  // Fondo
  parts.push(`<circle cx="${C}" cy="${C}" r="${R_O}" fill="#0a0618" stroke="#c9a96e" stroke-width="1.5"/>`);

  // Segmentos zodiacales
  for (let i = 0; i < 12; i++) {
    const l1 = i * 30, l2 = (i + 1) * 30;
    const [gx, gy] = pt((R_ZO + R_ZI) / 2, l1 + 15);
    parts.push(`<path d="${segPath(l1, l2, R_ZO, R_ZI)}" fill="${SEG_COLORS[i]}" stroke="#c9a96e" stroke-width="0.4" opacity="0.75"/>`);
    parts.push(`<text x="${f(gx)}" y="${f(gy)}" text-anchor="middle" dominant-baseline="central" font-size="9" fill="#c9a96e" font-family="Arial,sans-serif" font-weight="bold">${SIGN_GLYPHS[i]}</text>`);
  }

  // Divisiones de 30° en el zodíaco
  for (let i = 0; i < 12; i++) {
    const [xi, yi] = pt(R_ZI, i * 30);
    const [xo, yo] = pt(R_ZO, i * 30);
    parts.push(`<line x1="${f(xi)}" y1="${f(yi)}" x2="${f(xo)}" y2="${f(yo)}" stroke="#c9a96e" stroke-width="0.8"/>`);
  }

  // Líneas de cúspides de casas (carta 1)
  for (const h of chart1.houses) {
    const [hx1, hy1] = pt(R_IN, h.cusp);
    const [hx2, hy2] = pt(R_ZI, h.cusp);
    const isAngular = [1,4,7,10].includes(h.number);
    parts.push(`<line x1="${f(hx1)}" y1="${f(hy1)}" x2="${f(hx2)}" y2="${f(hy2)}" stroke="#c9a96e" stroke-width="${isAngular ? 1.2 : 0.5}" opacity="${isAngular ? 0.45 : 0.18}"/>`);
  }

  // Anillo separador para sinastría
  if (isSyn) {
    const rSep = (R_P1 + R_P2) / 2 + 6;
    parts.push(`<circle cx="${C}" cy="${C}" r="${rSep}" fill="none" stroke="#c9a96e" stroke-width="0.7" stroke-dasharray="3,5" opacity="0.35"/>`);
  }

  // Círculo central
  parts.push(`<circle cx="${C}" cy="${C}" r="${R_IN}" fill="#0f0720" stroke="#c9a96e" stroke-width="0.8" opacity="0.55"/>`);

  // Planetas carta 1
  const r1 = isSyn ? R_P1 : (R_P1 + R_P2) / 2;
  parts.push(renderPlanets(chart1, r1, '#ffffff', '#d4bfff'));

  // Planetas carta 2 (sinastría)
  if (isSyn && chart2) {
    parts.push(renderPlanets(chart2, R_P2, '#ffd97d', '#f0c040'));
  }

  // ASC y MC (carta 1)
  for (const [lon, label] of [
    [chart1.ascendant.longitude, 'ASC'],
    [chart1.midheaven.longitude, 'MC'],
  ] as [number, string][]) {
    const [lx, ly] = pt(R_ZI - 10, lon);
    parts.push(`<text x="${f(lx)}" y="${f(ly)}" text-anchor="middle" dominant-baseline="central" font-size="7" fill="#ffd97d" font-family="sans-serif" font-weight="bold">${label}</text>`);
  }

  // Texto central
  const sunSign  = chart1.chartSummary.sunSign.slice(0, 3);
  const moonSign = chart1.chartSummary.moonSign.slice(0, 3);
  const ascSign  = chart1.chartSummary.ascendantSign.slice(0, 3);
  const title    = isSyn ? `${name1} & ${name2}` : name1;

  parts.push(`<text x="${C}" y="${C + 14}" text-anchor="middle" font-size="10" fill="#9b7fd4" font-family="Georgia,serif" letter-spacing="0.5">${title}</text>`);
  parts.push(`<text x="${C}" y="${C - 6}" text-anchor="middle" font-size="8" fill="#c9a96e" opacity="0.7" font-family="serif">☉${sunSign} · ☽${moonSign} · ↑${ascSign}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
${parts.join('\n')}
</svg>`;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export function generateNatalChartSVG(chart: NatalChart, name: string): string {
  return buildWheel(chart, name);
}

export function generateSynastryChartSVG(
  chart1: NatalChart, name1: string,
  chart2: NatalChart, name2: string,
): string {
  return buildWheel(chart1, name1, chart2, name2);
}

/** Convierte el SVG a data URL base64 para embeber en HTML/email. */
export function svgToDataUrl(svg: string): string {
  const b64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
}
