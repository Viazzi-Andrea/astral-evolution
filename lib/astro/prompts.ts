/**
 * lib/astro/prompts.ts
 * Astral Evolution — Prompts Maestros para Gemini 1.5 Flash
 *
 * Estilo: Liz Greene (psicología profunda jungiana, mitos, sombra),
 *         Stephen Arroyo (humanista, evolutivo, elementos),
 *         Howard Sasportas (casas como campos de experiencia vital).
 *
 * Los prompts reciben el objeto NatalChart calculado por ephemeris.ts
 * y devuelven instrucciones precisas para que Gemini genere texto
 * de calidad profesional, sin aleatoriedad astrológica.
 */

import type { NatalChart, PlanetPosition, AspectData } from './ephemeris';
import type { CompositePoint } from './synastry-charts';
import {
  formatCompositeForPrompt,
  formatProgressedForPrompt,
  formatTransitsForPrompt,
  formatDraconicKeyPoints,
} from './synastry-charts';

// ─── Utilidades de formateo ───────────────────────────────────────────────────

function formatPlanet(p: PlanetPosition): string {
  const retro = p.retrograde ? ' ℞ (retrógrado)' : '';
  return `${p.name}: ${p.degreeStr} — Casa ${p.house}${retro}`;
}

function formatAspect(a: AspectData): string {
  const orb     = a.orb < 1 ? `${(a.orb * 60).toFixed(0)}'` : `${a.orb.toFixed(1)}°`;
  const applying = a.applying ? '(aplicante)' : '(separante)';
  return `${a.planet1} ${a.aspect} ${a.planet2} — orbe ${orb} ${applying}`;
}

function formatHouses(chart: NatalChart): string {
  return chart.houses
    .map(h => `Casa ${h.number}: ${Math.floor(h.degree)}° ${h.sign}`)
    .join('\n');
}

function buildAstroDataBlock(chart: NatalChart, name: string): string {
  const { planets, ascendant, midheaven, northNode, aspects, chartSummary } = chart;

  const planetLines = planets.map(formatPlanet).join('\n');
  const aspectLines = aspects.length > 0
    ? aspects.map(formatAspect).join('\n')
    : 'Sin aspectos mayores entre los planetas registrados.';

  const stelliumNote = chartSummary.stelliums.length > 0
    ? `STELLIUM detectado en: ${chartSummary.stelliums.join(', ')}`
    : 'Sin stelliums';

  const angularNote = chartSummary.angularPlanets.length > 0
    ? `Planetas angulares: ${chartSummary.angularPlanets.join(' | ')}`
    : 'Sin planetas angulares destacados';

  return `
════════════════════════════════════════════
DATOS ASTRONÓMICOS EXACTOS — CARTA NATAL DE ${name.toUpperCase()}
════════════════════════════════════════════

POSICIONES PLANETARIAS (calculadas con algoritmos Meeus/VSOP87):
${planetLines}
${formatPlanet(ascendant)}
${formatPlanet(midheaven)}
Nodo Norte: ${northNode.degreeStr} — Casa ${northNode.house}

CÚSPIDES DE CASAS (Sistema Plácido):
${formatHouses(chart)}

ASPECTOS MAYORES:
${aspectLines}

SÍNTESIS CONFIGURACIONAL:
· Sol en ${chartSummary.sunSign} — Luna en ${chartSummary.moonSign} — ASC en ${chartSummary.ascendantSign}
· Elemento dominante: ${chartSummary.dominantElement}
· Modalidad dominante: ${chartSummary.dominantModality}
· ${stelliumNote}
· ${angularNote}
════════════════════════════════════════════`.trim();
}

// Versión compacta para sinastría (dos cartas = doble tokens, hay que ahorrar)
function buildAstroDataBlockCompact(chart: NatalChart, name: string): string {
  const { planets, ascendant, northNode, chartSummary } = chart;
  const personal = ['Sol', 'Luna', 'Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno'];
  const personalPlanets = planets.filter(p => personal.includes(p.name));
  const outerPlanets    = planets.filter(p => !personal.includes(p.name));

  return `
── CARTA DE ${name.toUpperCase()} ──
PLANETAS PERSONALES:
${personalPlanets.map(formatPlanet).join('\n')}
ASC: ${formatPlanet(ascendant)}
Nodo Norte: ${northNode.degreeStr} — Casa ${northNode.house}
TRANSPERSONALES: ${outerPlanets.map(p => `${p.name} ${p.degreeStr}`).join(' | ')}
SÍNTESIS: Sol ${chartSummary.sunSign} · Luna ${chartSummary.moonSign} · ASC ${chartSummary.ascendantSign} · ${chartSummary.dominantElement}/${chartSummary.dominantModality}`.trim();
}

// ─── SISTEMA DE INSTRUCCIONES (System Prompt) ─────────────────────────────────

const SYSTEM_INSTRUCTION = `Eres un astrólogo psicológico y evolutivo de nivel maestro que escribe para personas que NO saben nada de astrología. Tu misión es que quien lea su informe sienta que lo conocen profundamente y reciba orientación concreta y útil para su vida real.

PRINCIPIOS INQUEBRANTABLES:

1. EXACTITUD ASTRONÓMICA
   Usá los datos que recibís literalmente. Nunca inventés posiciones ni aspectos que contradigan los datos provistos.

2. LENGUAJE 100% ACCESIBLE — REGLA DE ORO
   PROHIBIDO usar estos términos sin explicarlos en la misma frase: "orbe", "stellium", "modalidad", "applying", "separante", "cuadratura", "trígono", "sextil", "oposición", "cúspide", "transpersonal", "karmica", "Nodo Sur/Norte" sin contexto.
   En su lugar: describí el EFECTO en la vida de la persona. No digas "Luna cuadratura Júpiter" — decí "hay una tensión entre tu necesidad de seguridad emocional y tu impulso de crecer y expandirte constantemente".
   Podés mencionar el nombre técnico SOLO entre paréntesis como referencia, después de explicarlo en español llano.

3. ANCLA EN LA VIDA REAL
   Cada interpretación debe conectarse con experiencias cotidianas concretas: el trabajo, el dinero, el amor, la familia, los miedos, las decisiones difíciles.
   Usá frases como "esto se manifiesta cuando...", "en la práctica, esto significa que...", "lo sentís especialmente en situaciones donde...".
   Un lector que no sabe astrología debe reconocerse en cada párrafo.

4. PSICOLOGÍA PROFUNDA SIN JERGA
   Trata cada planeta como un principio psicológico vivo. Integrá la noción de "sombra" cuando sea relevante. Usá referencias a experiencias humanas universales, no a mitos griegos.
   La carta es un mapa del self, no un destino fijo.

5. TONO DIRECTO Y CÁLIDO
   · Escribí en segunda persona ("tu energía busca...", "lo que sentís es...").
   · Usá SIEMPRE lenguaje de género neutro: nunca uses "atrapado/a", "seguro/a", "él/ella". En su lugar usá construcciones como "te sentís en libertad", "la seguridad que buscás", o reformulá la frase para evitar el genérico.
   · Sé directo: evitá "puede que", "quizás", "podría indicar" — usá afirmaciones claras.
   · Cálido, profundo, sin condescendencia ni frases vacías genéricas.
   · Cada párrafo debe aplicarse SOLO a esta carta, no a cualquier persona con ese signo solar.

6. ORIENTACIÓN PRÁCTICA
   · Los aspectos difíciles son tensión creativa, oportunidades de crecimiento — nunca maldiciones.
   · Siempre cerrá con un camino concreto de integración o acción.
   · No profetices negativamente. No uses fechas exactas.

7. ANTI-REPETICIÓN
   · Las secciones finales deben aportar ideas NUEVAS, no reescribir lo dicho.
   · Si ya mencionaste un patrón, referencialo en una frase y avanzá con material nuevo.

8. FORMATO DE SALIDA — OBLIGATORIO
   · Usa EXCLUSIVAMENTE Markdown.
   · Usa ## para títulos de sección. PROHIBIDO usar ### — en su lugar usá **negrita** para destacar subtemas dentro de una sección.
   · Usa **texto** para resaltar conceptos clave.
   · Separá párrafos con línea en blanco.
   · No uses listas de puntos salvo que sean estrictamente necesarias. Cuando las uses, usá guión (-) o números (1. 2. 3.).
   · No añadas texto antes del primer ##. Empezá directamente con la primera sección.
   · PRIORITARIO: completá TODAS las secciones. Si el espacio se agota, resumí secciones intermedias pero nunca dejes la Conclusión incompleta.

9. IDIOMA — REGLA ABSOLUTA
   · Escribí TODO en español rioplatense. PROHIBIDO usar palabras, frases o cláusulas en inglés, aunque sean términos técnicos astrológicos. Si necesitás un término en otro idioma, traducilo o explicalo en español.
   · Verificá cada oración antes de continuar. Una sola frase en inglés invalida la calidad del informe.`;

// ─── PLANTILLA: LECTURA ESENCIAL ─────────────────────────────────────────────

export function buildEssentialReadingPrompt(
  chart: NatalChart,
  name: string,
  personalContext?: string
): { systemInstruction: string; userPrompt: string } {

  const astroData = buildAstroDataBlock(chart, name);
  const contextNote = personalContext
    ? `\nCONTEXTO PERSONAL COMPARTIDO POR ${name.toUpperCase()}:\n"${personalContext}"\nIncorpora este contexto de forma sutil en la lectura cuando sea astronómicamente relevante.\n`
    : '';

  const userPrompt = `
${astroData}
${contextNote}

TAREA: Genera una "Lectura Esencial" para ${name}.
Extensión total: 1200–1500 palabras. Escribí con profundidad real, no resumas.
RECUERDA: el lector no sabe astrología. Cada término técnico debe explicarse en la misma frase en lenguaje cotidiano.

---

# ✦ LECTURA ESENCIAL — ${name.toUpperCase()}

## I. Quién Sos Realmente

Escribí tres párrafos corridos, SIN etiquetas ni títulos intermedios (no escribas "Párrafo 1", "Tu esencia", ni ningún subtítulo dentro de esta sección).

El primer párrafo habla del Sol en ${chart.chartSummary.sunSign} (Casa ${chart.planets.find(p => p.name === 'Sol')?.house}): qué necesita genuinamente ${name} para sentir que su vida tiene sentido, cuándo se siente con más energía y propósito, qué pasa cuando no puede expresar eso, y en qué área de la vida (la que representa la Casa ${chart.planets.find(p => p.name === 'Sol')?.house}) se juega principalmente esta búsqueda.

El segundo párrafo habla de la Luna en ${chart.chartSummary.moonSign} (Casa ${chart.planets.find(p => p.name === 'Luna')?.house}): qué necesita ${name} para sentirse emocionalmente segura, cuáles son sus reacciones automáticas bajo presión, qué heridas o aprendizajes de la infancia dejaron huella en cómo procesa las emociones hoy, y cómo esto afecta sus vínculos más cercanos.

El tercer párrafo habla del Ascendente en ${chart.chartSummary.ascendantSign}: qué primera impresión genera ${name} en los demás aunque por dentro sea diferente, cuál es la brecha entre cómo la ven y quién realmente es, y cómo puede usar conscientemente esa energía exterior como herramienta en su favor.

RECORDATORIO: usá lenguaje completamente neutro en género. Nunca "seguro/a", "vivo/a", "dispuesto/a". Reformulá con construcciones neutras: "la seguridad que buscás", "cuando la energía fluye", "cuando estás lista para".

## II. Tu Patrón Central: Lo que se Repite en tu Vida

Explicá el aspecto más significativo de la carta en lenguaje completamente accesible.
NO uses el nombre técnico del aspecto sin explicarlo antes.
Describí: ¿qué tensión o impulso interno crea este patrón? ¿En qué situaciones de la vida cotidiana lo siente ${name}? ¿Cómo se ha manifestado probablemente hasta ahora? ¿Cuál es el regalo oculto de esta tensión y cómo puede transformarse?

Aspecto a interpretar (el de mayor peso): ${aspects_primary(chart)}

Este párrafo debe hacer que ${name} piense "exactamente, eso me pasa a mí".

## III. Amor, Vínculos y Relaciones

Basándote en Venus (${chart.planets.find(p => p.name === 'Venus')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Venus')?.house}) y la Luna:
· ¿Cómo da y recibe amor ${name}? ¿Qué necesita de una pareja para sentirse realmente vista/o?
· ¿Cuáles son sus patrones relacionales más recurrentes — qué tipo de personas atrae y por qué?
· ¿Qué le cuesta más en las relaciones íntimas y cómo puede trabajarlo?
Escribí sin jerga: "Venus en X Casa Y" se traduce a comportamientos y necesidades concretas.

## IV. Trabajo, Vocación y Dinero

Basándote en el Sol (Casa ${chart.planets.find(p => p.name === 'Sol')?.house}), Saturno (${chart.planets.find(p => p.name === 'Saturno')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Saturno')?.house}) y el Medio Cielo (${chart.midheaven.degreeStr}):

Un primer párrafo sobre qué tipo de trabajo da sentido a ${name}, qué ambientes profesionales la potencian o agotan, y cómo es su relación con la autoridad, la disciplina y el dinero.

Luego listá entre 3 y 5 áreas o profesiones específicas que se alinean con su carta — no genéricas ("trabajos creativos") sino concretas (ej: "mediación de conflictos", "psicología clínica", "diseño de espacios", "emprendimiento social"). Para cada una, una oración que explique por qué encaja con su configuración específica.

Cerrá con: "Esta es solo una primera aproximación a tu vocación — tu carta tiene mucho más para revelar sobre tu misión profesional."

## V. Tu Brújula Interior: El Camino que Esta Carta Propone

${personalContext
  ? `${name} compartió este contexto sobre su momento actual: "${personalContext}"

Usando tanto los patrones de la carta como esta situación real, redactá 2–3 párrafos de orientación concreta:
· ¿Qué le está pidiendo esta etapa de su vida, según lo que muestra su carta?
· ¿Qué patrón interno conviene que observe o suelte?
· ¿Cuál es el primer paso práctico y concreto que su carta sugiere?
Que sea honesto, útil y esperanzador — sin ser vago ni poético sin sustancia. Esta sección debe completarse íntegramente.`
  : `Redactá 2–3 párrafos de orientación concreta para ${name}:
· ¿Cuál es la invitación más importante que hace esta carta en este momento de su vida?
· ¿Qué patrón conviene observar o transformar?
· ¿Qué acción concreta —no metafórica— puede tomar para avanzar en su camino?
Cerrá de forma que ${name} sienta que tiene una dirección clara, no solo reflexiones.`
}

IMPORTANTE — LIBRE ALBEDRÍO: Al final de esta sección, agregá un párrafo breve (2-3 oraciones) que recuerde que la carta natal muestra tendencias y potenciales, pero que cada persona tiene libre albedrío para elegir cómo responder a estas energías. El destino no está escrito — la carta es una brújula, no una sentencia.

---`.trim();

  return { systemInstruction: SYSTEM_INSTRUCTION, userPrompt };
}

// ─── PLANTILLA: CONSULTA EVOLUTIVA ───────────────────────────────────────────

export function buildEvolutionaryConsultationPrompt(
  chart: NatalChart,
  name: string,
  personalContext?: string
): { systemInstruction: string; userPrompt: string } {

  const astroData = buildAstroDataBlock(chart, name);
  const contextNote = personalContext
    ? `\nCONTEXTO PERSONAL:\n"${personalContext}"\n`
    : '';

  const userPrompt = `
${astroData}
${contextNote}

TAREA: Genera una "Consulta Evolutiva Completa" para ${name}.
Extensión total: 1800–2200 palabras. Escribí con profundidad real; no resumas.
RECUERDA: el lector no sabe astrología. Cada término técnico debe explicarse en lenguaje cotidiano en la misma frase.
GÉNERO NEUTRO OBLIGATORIO: nunca uses terminaciones /a ni /o. Reformulá con construcciones neutras.
DISTRIBUCIÓN: Secciones I–VII: máximo 280 palabras cada una. Sección IX: mínimo 200 palabras, siempre completa.

---

# ✦ CONSULTA EVOLUTIVA — ${name.toUpperCase()}

## I. Quién Sos en el Fondo

Tres párrafos corridos, SIN subtítulos ni etiquetas intermedias dentro de esta sección.

El primero profundiza en el Sol en ${chart.chartSummary.sunSign} (Casa ${chart.planets.find(p => p.name === 'Sol')?.house}): cuál es la esencia más auténtica de ${name}, qué necesita para sentir que su vida tiene sentido, y en qué área de vida (representada por la Casa ${chart.planets.find(p => p.name === 'Sol')?.house}) se despliega ese propósito.

El segundo profundiza en la Luna en ${chart.chartSummary.moonSign} (Casa ${chart.planets.find(p => p.name === 'Luna')?.house}): el mundo emocional, los patrones aprendidos en la infancia, cómo reacciona ${name} bajo presión, qué necesita para sentirse emocionalmente en su lugar.

El tercero trata el Ascendente en ${chart.chartSummary.ascendantSign}: la imagen que proyecta al mundo, la brecha entre esa imagen y su interior, y cómo puede usar esa energía exterior conscientemente.

## II. Tu Forma de Pensar, Amar y Actuar

Tres párrafos, uno por planeta, SIN etiquetas intermedias. Explicá cada uno en términos de vida real:

**Cómo pensás y te comunicás** — Mercurio en ${chart.planets.find(p => p.name === 'Mercurio')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Mercurio')?.house}${chart.planets.find(p => p.name === 'Mercurio')?.retrograde ? ' (retrógrado al nacer — lo que esto significa en la práctica)' : ''}: cómo procesa la información ${name}, cómo aprende mejor, cómo se expresa, qué tipo de conversaciones la nutren.

**Cómo amás** — Venus en ${chart.planets.find(p => p.name === 'Venus')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Venus')?.house}: qué necesita ${name} para sentirse amada, cómo expresa el afecto, qué valora en una relación, qué le cuesta dar o recibir.

**Cómo actuás y usás tu energía** — Marte en ${chart.planets.find(p => p.name === 'Marte')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Marte')?.house}${chart.planets.find(p => p.name === 'Marte')?.retrograde ? ' (retrógrado)' : ''}: cómo toma decisiones ${name}, cómo enfrenta los conflictos, qué la impulsa a la acción, dónde gasta más energía.

## III. Dónde Crecés y Dónde Aprendés

Dos párrafos:

**Dónde crecés naturalmente** — Júpiter en ${chart.planets.find(p => p.name === 'Júpiter')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Júpiter')?.house}: en qué áreas de vida fluye la expansión y la suerte para ${name}, qué le da sentido de abundancia, cómo puede potenciar esa energía sin excederse.

**Dónde madurás con esfuerzo** — Saturno en ${chart.planets.find(p => p.name === 'Saturno')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Saturno')?.house}${chart.planets.find(p => p.name === 'Saturno')?.retrograde ? ' (retrógrado)' : ''}: qué áreas exigen disciplina y compromiso, qué miedos o bloqueos aparecen ahí, y cuál es el regalo profundo que viene de trabajar esa zona con paciencia.

## IV. Las Fuerzas Generacionales que te Moldean

Un párrafo por planeta transpersonal. Para cada uno: qué comparte ${name} con toda su generación Y qué la hace única por la casa donde cae en su carta específica. Explicar en términos de experiencias y actitudes, no de conceptos astrológicos.

Urano (${chart.planets.find(p => p.name === 'Urano')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Urano')?.house}): dónde busca ${name} ruptura, originalidad, libertad.
Neptuno (${chart.planets.find(p => p.name === 'Neptuno')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Neptuno')?.house}): dónde vive su espiritualidad, sus ideales, y también sus ilusiones.
Plutón (${chart.planets.find(p => p.name === 'Plutón')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Plutón')?.house}): dónde ocurren las transformaciones más profundas e irreversibles de su vida.

## V. Tu Dirección de Vida

El Nodo Norte en ${chart.northNode.degreeStr} (Casa ${chart.northNode.house}) es el punto que muestra hacia dónde está llamada a crecer el alma de ${name} en esta vida — NO explicar como término técnico "nodo norte", sino como "la dirección que tu carta propone para tu crecimiento".

Dos párrafos: hacia dónde la invita la carta, y qué patrón conocido (el del signo opuesto, ${toOpposite(chart.northNode.sign)}) conviene integrar sin quedarse atrapada en él.

## VI. Los Patrones que se Repiten en tu Vida

Analizá los 3–4 aspectos más importantes sin usar sus nombres técnicos solos. Para cada uno describí: qué tensión o sinfonía interna crea, cómo se manifiesta en situaciones cotidianas concretas, y cuál es el camino de integración.

Aspectos principales: ${chart.aspects.slice(0, 6).map(formatAspect).join(' | ')}

## VII. Tu Identidad, Raíces, Relaciones y Vocación

Cuatro párrafos, uno por eje:

**Cómo te presentás al mundo** (Casa 1 — Ascendente en ${chart.chartSummary.ascendantSign}): cómo arranca ${name} en cualquier situación nueva, qué imagen proyecta antes de que la conozcan de verdad.

**Tus raíces y sentido de pertenencia** (Casa 4 — ${chart.planets.find(p => p.name === 'Sol') ? `Sol en ${chart.chartSummary.sunSign}` : 'cúspide'}): qué necesita ${name} para sentirse en casa, de dónde viene su sentido de seguridad más profundo.

**Qué busca en los vínculos** (Casa 7): qué proyecta ${name} en sus parejas y socios, qué tipo de personas la complementan y por qué.

**Su vocación y misión en el mundo** (Casa 10 — ${chart.planets.find(p => p.name === 'Marte') ? `Marte en ${chart.planets.find(p => p.name === 'Marte')?.degreeStr}` : ''}, Saturno, Medio Cielo en ${chart.midheaven.degreeStr}):
Describí qué tipo de trabajo y entorno profesional hace que ${name} se sienta realizada. Luego listá entre 3 y 5 áreas o profesiones específicas que se alinean con su carta — no genéricas ("trabajos creativos") sino concretas (ej: "mediación de conflictos", "psicología clínica", "diseño de espacios", "emprendimiento social"). Para cada una explicá brevemente por qué encaja con su configuración. Cerrá con una oración que invite a explorar esto en profundidad: "Tu carta tiene mucho más para decirte sobre tu misión profesional específica — esta es solo una primera aproximación."
${chart.chartSummary.angularPlanets.length > 0
  ? `Planetas en casas angulares: ${chart.chartSummary.angularPlanets.join(', ')}`
  : ''}

## VIII. Tu Proyecto de Vida

Dos párrafos corridos, SIN subtítulos:

El primero describe el proyecto de vida que propone esta carta — no como destino fijo sino como campo de posibilidades: qué viene a construir, experimentar o sanar ${name} en esta vida, visto desde el conjunto de toda la carta.

El segundo nombra el principal obstáculo interno (el patrón más difícil de la carta) y la clave de integración más poderosa — lo que, si ${name} trabaja conscientemente, puede transformar ese obstáculo en su mayor fortaleza.
NO repetir análisis ya desarrollados en secciones anteriores.

## IX. Tu Brújula: Orientación Concreta para Este Momento

IMPORTANTE: Esta sección NO resume lo anterior — es orientación práctica nueva.

${personalContext
  ? `${name} compartió este contexto sobre su momento actual: "${personalContext}"

Redactá 2–3 párrafos de guía concreta que conecten los patrones de su carta con esta situación real. Qué le pide este momento según lo que muestra su carta, qué patrón conviene observar o soltar, y cuál es el primer paso concreto y posible que puede dar. Honesto, sin vacíos, orientado a la acción.`
  : `Redactá 2–3 párrafos de orientación práctica para ${name}: qué le pide esta carta en este momento de su vida, qué patrón conviene observar o transformar, y cuál es una acción concreta y posible que puede tomar para avanzar. Que sea directo y útil.`
}

Cerrá con una sola oración que recuerde que la carta natal muestra tendencias y potenciales — no un destino escrito. ${name} tiene libre albedrío para elegir cómo responder a estas energías. La carta es una brújula, no una sentencia.

---`.trim();

  return { systemInstruction: SYSTEM_INSTRUCTION, userPrompt };
}

// ─── PLANTILLA: ESPECIAL PAREJAS (SINASTRÍA + CARTAS AVANZADAS) ──────────────

interface SynastryExtras {
  composite:       CompositePoint[];
  draconic1:       CompositePoint[];
  draconic2:       CompositePoint[];
  davisonChart:    NatalChart;
  progressed1:     NatalChart;
  progressed2:     NatalChart;
  transits:        CompositePoint[];
  partileAspects:  string[];
  transitAspects:  string[];
  personalContext?: string;
}

/** Busca aspectos que aparecen tanto en sinastría como en la carta de Davison
 *  (misma pareja planeta-planeta, mismo tipo). Esos son los "inevitables". */
function findDestinyThemes(
  synAspects:   AspectData[],
  davisonChart: NatalChart,
): string[] {
  const result: string[] = [];
  for (const syn of synAspects.slice(0, 12)) {
    const p1 = syn.planet1.replace(/\s*\([^)]*\)/g, '').trim();
    const p2 = syn.planet2.replace(/\s*\([^)]*\)/g, '').trim();
    for (const dav of davisonChart.aspects) {
      const match =
        ((dav.planet1 === p1 && dav.planet2 === p2) ||
         (dav.planet1 === p2 && dav.planet2 === p1)) &&
        dav.aspect === syn.aspect;
      if (match) {
        result.push(`**✦ DESTINO INEVITABLE — ${p1} ${syn.aspect} ${p2}** (sinastría orbe ${syn.orb.toFixed(1)}° · confirmado en Davison)`);
        break;
      }
    }
  }
  return result;
}

export function buildSynastryPrompt(
  chart1: NatalChart,
  name1:  string,
  chart2: NatalChart,
  name2:  string,
  extras: SynastryExtras,
): { systemInstruction: string; userPrompt: string } {

  const { composite, draconic1, draconic2, davisonChart, progressed1, progressed2,
          transits, partileAspects, transitAspects, personalContext } = extras;

  const data1 = buildAstroDataBlockCompact(chart1, name1);
  const data2 = buildAstroDataBlockCompact(chart2, name2);

  const synAspects    = calculateSynastryAspects(chart1, chart2);
  const destinyThemes = findDestinyThemes(synAspects, davisonChart);

  const venus1 = chart1.planets.find(p => p.name === 'Venus');
  const venus2 = chart2.planets.find(p => p.name === 'Venus');
  const mars1  = chart1.planets.find(p => p.name === 'Marte');
  const mars2  = chart2.planets.find(p => p.name === 'Marte');
  const chiron = transits.find(t => t.name === 'Quirón');

  const userPrompt = `
${data1}

${data2}

════ SINASTRÍA — ASPECTOS (por orbe) ════
${synAspects.slice(0, 8).map(formatAspect).join('\n')}

${partileAspects.length > 0 ? `ASPECTOS PARTILES (< 1° — máxima intensidad):\n${partileAspects.join('\n')}` : ''}

${destinyThemes.length > 0 ? `TEMAS DE DESTINO (idénticos en sinastría y Davison):\n${destinyThemes.join('\n')}` : ''}

════ CARTA COMPUESTA (puntos medios) ════
${formatCompositeForPrompt(composite)}

════ CARTA DE DAVISON ════
Sol: ${davisonChart.planets.find(p => p.name === 'Sol')?.degreeStr} — Casa ${davisonChart.planets.find(p => p.name === 'Sol')?.house}
Luna: ${davisonChart.planets.find(p => p.name === 'Luna')?.degreeStr} — Casa ${davisonChart.planets.find(p => p.name === 'Luna')?.house}
Venus: ${davisonChart.planets.find(p => p.name === 'Venus')?.degreeStr} | Marte: ${davisonChart.planets.find(p => p.name === 'Marte')?.degreeStr}
ASC Davison: ${davisonChart.ascendant.degreeStr} | MC: ${davisonChart.midheaven.degreeStr}
Júpiter: ${davisonChart.planets.find(p => p.name === 'Júpiter')?.degreeStr} | Saturno: ${davisonChart.planets.find(p => p.name === 'Saturno')?.degreeStr}

════ CARTA DRACÓNICA (dimensión del alma) ════
${name1.toUpperCase()}:
${formatDraconicKeyPoints(draconic1)}
Nodo Norte natal: ${chart1.northNode.degreeStr}

${name2.toUpperCase()}:
${formatDraconicKeyPoints(draconic2)}
Nodo Norte natal: ${chart2.northNode.degreeStr}

════ CARTAS PROGRESADAS (hoy) ════
${name1.toUpperCase()} — progresiones actuales:
${formatProgressedForPrompt(progressed1, chart1)}

${name2.toUpperCase()} — progresiones actuales:
${formatProgressedForPrompt(progressed2, chart2)}

════ TRÁNSITOS ACTUALES ════
${formatTransitsForPrompt(transits)}

${transitAspects.length > 0 ? `TRÁNSITOS SOBRE CARTA COMPUESTA:\n${transitAspects.join('\n')}` : 'Sin tránsitos lentos significativos sobre la carta compuesta en este momento.'}
${chiron ? `Quirón transitando: ${chiron.posStr} — temas de sanación activos colectivamente.` : ''}

---

${personalContext ? `⚠️ CONTEXTO REAL DE LA RELACIÓN — LEER ANTES DE INTERPRETAR CUALQUIER SECCIÓN:
"${personalContext}"
Este contexto es DETERMINANTE para todo el análisis. Debés tenerlo presente desde la sección I hasta la XI.
NUNCA interpretés las cartas como si existiera una relación activa o un futuro compartido si el contexto indica lo contrario.
Las progresiones, tránsitos y síntesis deben interpretarse desde la realidad actual de cada persona, no desde un ideal.
` : ''}
TAREA: Genera el "Especial Parejas — Análisis Multidimensional" para ${name1} y ${name2}.
Extensión total: 2500–3000 palabras. Profundidad real en cada sección.
PROHIBIDO: No uses "él" ni "ella" — usá siempre los nombres directamente.
PRIORIDAD DE INTERPRETACIÓN:
1. Los aspectos partiles y los temas de "DESTINO INEVITABLE" son los más importantes.
2. La carta dracónica revela el propósito del alma — úsala para la capa kármica.
3. La carta progresada revela lo que está evolucionando AHORA en cada persona — interpretada según el contexto real.
4. Los tránsitos sobre la compuesta revelan lo que la conexión entre estas dos personas atraviesa AHORA.
5. Buscá el hilo conductor entre la dimensión del alma (dracónica) y el momento presente (progresada + tránsitos).

DISTRIBUCIÓN DE ESPACIO (para no truncar el cierre):
· Secciones I, III, VIII: máximo 220 palabras cada una.
· Secciones II, IV, V, VI, VII: máximo 280 palabras cada una.
· Sección IX (hilo conductor): mínimo 250 palabras — NUNCA omitir.
· Sección X (orientación): mínimo 200 palabras — NUNCA omitir.
Si sentís que el espacio se agota, comprimí las secciones II-VII, pero siempre completá IX y X.

---

# ✦ ${name1.toUpperCase()} & ${name2.toUpperCase()}

---

## I. Dos Mundos que se Encuentran

Describí la "personalidad astrológica" de cada persona usando Sol, Luna y Ascendente.
¿Qué energía, qué necesidades emocionales y qué forma de relacionarse trae cada una a este vínculo?
Una persona tiene el Sol en ${chart1.chartSummary.sunSign}, Luna en ${chart1.chartSummary.moonSign} y ASC en ${chart1.chartSummary.ascendantSign}.
La otra tiene el Sol en ${chart2.chartSummary.sunSign}, Luna en ${chart2.chartSummary.moonSign} y ASC en ${chart2.chartSummary.ascendantSign}.
¿Cómo se complementan o tensionan estas dos configuraciones?

---

## II. La Atracción que los Une — Sinastría Natal

${partileAspects.length > 0
  ? `Comenzá OBLIGATORIAMENTE con los aspectos partiles (< 1° de orbe), que son los que se sienten en la piel. Describí cómo se vive cada uno en el día a día de la relación.`
  : `Analizá los aspectos de sinastría más significativos.`}
${destinyThemes.length > 0
  ? `Para los temas marcados como "DESTINO INEVITABLE" (aparecen en sinastría Y Davison), usá ese término exacto y explicá por qué su repetición en dos métodos distintos los hace inevitables.`
  : ''}
Analizá los 4–5 aspectos de sinastría más importantes: qué activan en cada persona, cómo se viven cotidianamente, y qué don o desafío aportan. Sé honesto sobre los aspectos difíciles.

---

## III. El Alma de Este Encuentro — Carta Dracónica

La carta dracónica muestra los propósitos del alma, lo que cada persona "trae grabado" antes de esta vida.
Interpretá el Sol y Luna dracónicos de ${name1}: ¿qué misión de alma trae a este vínculo?
Interpretá el Sol y Luna dracónicos de ${name2}: ¿qué misión de alma trae a este vínculo?
¿Hay resonancia entre sus cartas dracónicas? ¿Se "reconocen" a nivel profundo?
Mencioná el Nodo Norte de cada uno y lo que sugiere sobre el aprendizaje que vinieron a hacer juntos.

---

## IV. La Alquimia de la Unión — Carta Compuesta

La carta compuesta (punto medio entre ambas cartas) describe al "tercer ser" que nace de esta unión.
Interpretá el Sol compuesto: ¿cuál es el propósito central de esta relación como entidad?
Interpretá la Luna compuesta: ¿qué necesita emocionalmente esta relación para estar bien?
Interpretá Venus, Marte y el ASC compuestos: ¿cómo se muestra esta relación al mundo?
¿Qué personalidad tiene este vínculo cuando funciona en su mejor versión?

---

## V. El Punto de Encuentro — Carta de Davison

La carta de Davison revela dónde en el tiempo y el espacio se materializa este encuentro.
Interpretá el Sol de Davison: ¿cuál es el corazón de este vínculo?
Interpretá la Luna de Davison: ¿cuál es el hogar emocional de esta pareja?
${destinyThemes.length > 0
  ? `Mencioná los temas de DESTINO INEVITABLE (idénticos en sinastría y Davison) y explicá por qué esta coincidencia entre dos métodos independientes sugiere que este encuentro no es aleatorio.`
  : `Compará con los aspectos de sinastría: ¿hay patrones que se repiten en ambos métodos?`}

---

## VI. Amor, Atracción y Deseo

- ${name1}: Venus en ${venus1?.degreeStr ?? 'no disponible'}, Marte en ${mars1?.degreeStr ?? 'no disponible'}.
  ¿Cómo da y recibe amor? ¿Qué necesita sentir para abrirse?
- ${name2}: Venus en ${venus2?.degreeStr ?? 'no disponible'}, Marte en ${mars2?.degreeStr ?? 'no disponible'}.
  ¿Cómo da y recibe amor? ¿Qué necesita sentir para abrirse?
- ¿Hablan el mismo idioma afectivo o cada uno ama de manera diferente? Si la diferencia existe, ¿cómo pueden traducirse?
- La atracción física y emocional: qué los acerca, qué los enciende, qué los sostiene.

---

## VII. La Capa Kármica — Nodos y el Sanador Interior

Esta sección es sobre el propósito más profundo de la relación.
Analizá los Nodos Lunares de ambas personas en relación entre sí:
- ¿El Nodo Norte de uno cae cerca de planetas importantes del otro?
- ¿Qué vienen a aprender, sanar o completar juntos?
Quirón, el archétipo del Sanador Herido, transita actualmente por ${chiron?.posStr ?? 'Aries'}.
¿Qué tipo de herida o sanación activa este tránsito en la dinámica de esta pareja?
¿Qué herida personal de cada uno puede sanar (o reabrir) en este vínculo?

---

## VIII. El Momento que Viven — Cartas Progresadas

Las progresiones secundarias muestran qué está evolucionando AHORA en cada persona individualmente.
${name1}: describí su Sol y Luna progresados. ¿En qué fase de vida se encuentra en este momento?
${name2}: describí su Sol y Luna progresados. ¿En qué fase de vida se encuentra en este momento?
Interpretá estas progresiones según la situación real de cada persona (recordá el contexto indicado al inicio). No asumas que ambos están construyendo algo juntos si el contexto dice lo contrario.

---

## IX. Lo que el Cielo Dice Hoy — Tránsitos sobre la Conexión

Los planetas lentos en tránsito sobre la carta compuesta revelan qué está activando esta conexión en el plano energético AHORA, independientemente de si hay una relación activa o no.
${transitAspects.length > 0
  ? `Hay tránsitos activos. Interpretá cada uno en función del contexto real: ¿qué le está pidiendo el cielo a cada persona en relación con este vínculo?`
  : `No hay tránsitos lentos exactos sobre la carta compuesta en este momento, pero hay un clima astrológico general que afecta esta conexión.`}
Conectá con las progresiones: ¿el cielo confirma o tensiona lo que cada persona está viviendo internamente ahora mismo?

---

## X. El Hilo que Todo lo Une — Síntesis Multidimensional

Esta es la sección más importante. No resumas las secciones anteriores — sintetizá.
Seguí este hilo conductor, siempre anclado en el contexto real:
1. **El alma** (carta dracónica): ¿para qué se encontraron a nivel profundo?
2. **La danza** (sinastría y Davison): ¿cómo interactúan sus energías en la práctica?
3. **El ahora** (progresiones y tránsitos): ¿qué está transformando a cada persona individualmente en este momento?
4. **La acción**: ¿qué puede hacer cada persona, desde donde está hoy, para honrar lo que este vínculo les enseñó?
Si hay temas de "DESTINO INEVITABLE", integrálos como eje vertebrador — pero sin ignorar la realidad actual.

---

## XI. Orientación Concreta para Hoy

IMPORTANTE: Esta sección NO es síntesis de lo anterior — es orientación práctica nueva, completamente anclada en el contexto real que se indicó al inicio.
${personalContext
  ? `Redactá 2 o 3 párrafos de orientación concreta y honesta para ${name1} específicamente (es quien lee este informe). Conectá lo que muestran las cartas con la situación real. Que sea accionable, directo y empático. No romantices lo que no es romántico; no evites lo que es incómodo.`
  : `Redactá 2 párrafos de orientación práctica para ${name1} y ${name2}: qué actitud o acción concreta les pide este análisis en este momento. Cerrá recordándoles que el cielo muestra tendencias, pero cada persona elige.`}

---`.trim();

  return { systemInstruction: SYSTEM_INSTRUCTION, userPrompt };
}

// ─── Funciones auxiliares de los prompts ─────────────────────────────────────

function aspects_primary(chart: NatalChart): string {
  if (chart.aspects.length === 0) return 'No se encontraron aspectos mayores.';
  // Filtrar solo planetas personales (Sol, Luna, Mercurio, Venus, Marte)
  const personal = ['Sol', 'Luna', 'Mercurio', 'Venus', 'Marte'];
  const primary = chart.aspects
    .filter(a => personal.includes(a.planet1) || personal.includes(a.planet2))
    .sort((a, b) => a.orb - b.orb)[0];
  return primary ? formatAspect(primary) : formatAspect(chart.aspects[0]);
}

import type { ZodiacSign } from './ephemeris';

const OPPOSITE_SIGN: Record<ZodiacSign, ZodiacSign> = {
  Aries: 'Libra', Tauro: 'Escorpio', Géminis: 'Sagitario', Cáncer: 'Capricornio',
  Leo: 'Acuario', Virgo: 'Piscis', Libra: 'Aries', Escorpio: 'Tauro',
  Sagitario: 'Géminis', Capricornio: 'Cáncer', Acuario: 'Leo', Piscis: 'Virgo',
};

function toOpposite(sign: ZodiacSign): ZodiacSign {
  return OPPOSITE_SIGN[sign];
}

function calculateSynastryAspects(
  chart1: NatalChart,
  chart2: NatalChart
): AspectData[] {
  const ASPECTS_DEF = [
    { name: 'Conjunción', angle: 0,   orb: 8 },
    { name: 'Sextil',     angle: 60,  orb: 6 },
    { name: 'Cuadratura', angle: 90,  orb: 8 },
    { name: 'Trígono',    angle: 120, orb: 8 },
    { name: 'Oposición',  angle: 180, orb: 8 },
  ];

  const results: AspectData[] = [];

  for (const p1 of chart1.planets) {
    for (const p2 of chart2.planets) {
      const diff  = Math.abs(p1.longitude - p2.longitude);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECTS_DEF) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          results.push({
            planet1:  `${p1.name} (${chart1.chartSummary.sunSign.slice(0, 3)})`,
            planet2:  `${p2.name} (${chart2.chartSummary.sunSign.slice(0, 3)})`,
            aspect:   asp.name,
            angle,
            orb:      parseFloat(orb.toFixed(2)),
            applying: false,
          });
          break;
        }
      }
    }
  }

  return results.sort((a, b) => a.orb - b.orb);
}
