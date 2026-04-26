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
   · Usa ## para títulos de sección, ### para subtítulos.
   · Usa **texto** para resaltar conceptos clave.
   · Separá párrafos con línea en blanco.
   · No uses listas de puntos salvo que sean estrictamente necesarias.
   · No añadas texto antes del primer ##. Empezá directamente con la primera sección.
   · PRIORITARIO: completá TODAS las secciones. Si el espacio se agota, resumí secciones intermedias pero nunca dejes la Conclusión incompleta.`;

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

// ─── PLANTILLA: ESPECIAL PAREJAS (SINASTRÍA) ─────────────────────────────────

export function buildSynastryPrompt(
  chart1: NatalChart,
  name1:  string,
  chart2: NatalChart,
  name2:  string,
  personalContext?: string,
): { systemInstruction: string; userPrompt: string } {

  const data1 = buildAstroDataBlockCompact(chart1, name1);
  const data2 = buildAstroDataBlockCompact(chart2, name2);

  // Calcular aspectos entre cartas (sinastría)
  const synAspects = calculateSynastryAspects(chart1, chart2);

  const userPrompt = `
${data1}

${data2}

ASPECTOS DE SINASTRÍA (posiciones de ${name1} vs posiciones de ${name2}):
${synAspects.length > 0 ? synAspects.slice(0, 7).map(formatAspect).join('\n') : 'Calcular manualmente con los datos anteriores.'}

TAREA: Genera un "Especial Parejas — Lectura de Sinastría" para ${name1} y ${name2}.
Extensión total: 1800–2200 palabras. Con profundidad real.
IMPORTANTE — DISTRIBUCIÓN DE ESPACIO: Para garantizar que el reporte llegue completo sin truncarse, respeta estos límites por sección:
· Secciones I, II, IV: máximo 250 palabras cada una.
· Secciones III, V, VI: máximo 300 palabras cada una.
· Sección VII (Síntesis): máximo 200 palabras.
· Sección VIII (CONCLUSIÓN): mínimo 200 palabras — siempre debe completarse íntegramente.
Si ves que te acercás al límite, resumí las secciones III-VI para garantizar que la Conclusión se genere completa.
PROHIBIDO: No uses "él" ni "ella" — usa siempre los nombres (${name1} y ${name2}) directamente.

---

# ✦ ${name1.toUpperCase()} & ${name2.toUpperCase()}

## I. ${name1} & ${name2} — Dos Mundos que se Encuentran
Describe la "personalidad astrológica" de cada persona (Sol, Luna y Ascendente).
¿Qué energía, necesidades y forma de relacionarse trae cada una a este vínculo?

## II. El Corazón de la Conexión
- Sol de ${name1} (${chart1.chartSummary.sunSign}) con Sol de ${name2} (${chart2.chartSummary.sunSign}):
  ¿Cómo se encuentran sus esencias? ¿Se complementan o generan fricción creativa?
- Luna de ${name1} (${chart1.chartSummary.moonSign}) con Luna de ${name2} (${chart2.chartSummary.moonSign}):
  La resonancia emocional. ¿Se sienten seguros y en casa juntos o hay tensión emocional de fondo?

## III. Lo que los Une y lo que los Tensiona
Analiza los 4–5 aspectos de sinastría más significativos.
Para cada uno: qué activa en cada persona, cómo se vive en el día a día de la relación,
y qué desafío o don concreto trae. Sé honesto sobre los aspectos difíciles.

## IV. Amor, Atracción y Deseo
- Cómo da y recibe amor ${name1} (Venus en ${chart1.planets.find(p => p.name === 'Venus')?.degreeStr}).
- Cómo da y recibe amor ${name2} (Venus en ${chart2.planets.find(p => p.name === 'Venus')?.degreeStr}).
- ¿Hablan el mismo idioma afectivo o cada uno expresa y necesita el amor de manera diferente?
- La atracción y el deseo: qué los acerca físicamente y emocionalmente.

## V. Los Compromisos que Esta Relación Pide
Qué exige esta relación de cada persona para poder sostenerse y crecer.
Si hay aspectos de Saturno entre las cartas, explica qué estructura o responsabilidad traen.
Si no, habla sobre los compromisos implícitos que la combinación de sus cartas demanda.
Sin rodeos: ¿qué tendría que cambiar en cada uno para que esto funcione?

## VI. Por Qué se Encontraron: El Propósito Compartido
Los Nodos Lunares de ambas personas y lo que sugieren sobre el "por qué" de este encuentro.
¿Qué vienen a aprender, sanar o construir juntos? ¿Qué los trajo hasta aquí?

## VII. El Potencial de Este Vínculo
En exactamente DOS párrafos cortos (no más):
· Párrafo 1: ¿qué "tercer ser" único nace de la combinación de estas dos cartas? Un regalo genuino de este vínculo que no existiría sin ambos.
· Párrafo 2: El mayor desafío estructural de esta pareja (el que la sinastría muestra más claramente) y la clave para transformarlo.
NO repitas análisis ya desarrollados en secciones anteriores — estos párrafos deben aportar una perspectiva de conjunto que solo es visible al ver las dos cartas como un todo.

## VIII. CONCLUSIÓN EVOLUTIVA PERSONALIZADA
IMPORTANTE: Esta sección NO es una síntesis de lo anterior — es una guía práctica nueva sobre qué hacer ahora. No reescribas ni resumas las secciones anteriores.

${personalContext
  ? `El usuario compartió este contexto sobre la relación: "${personalContext}"

Redactá 2 o 3 párrafos de orientación concreta y honesta conectando lo que muestra la sinastría con esta situación real. Que sea accionable, sin rodeos y sin vacíos. PRIORITARIO: Esta sección debe completarse íntegramente.`
  : `Redactá 2 párrafos de orientación práctica para ${name1} y ${name2}: qué actitud o acción concreta les pide esta sinastría en este momento de su relación. Que sea directo y útil, no solo poético.`
}

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
