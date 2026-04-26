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

Tres párrafos que describen la identidad profunda de ${name} — no el signo solar genérico, sino cómo esa energía específica (signo + casa) se vive en la vida real:

**Párrafo 1 — Tu esencia (Sol en ${chart.chartSummary.sunSign}, Casa ${chart.planets.find(p => p.name === 'Sol')?.house}):**
¿Qué es lo que ${name} genuinamente necesita para sentir que su vida tiene sentido? ¿Cuándo se siente más vivo/a? ¿Qué pasa cuando no puede expresar eso? Describí la tensión entre la esencia y el mundo, y el camino hacia la autenticidad. La Casa ${chart.planets.find(p => p.name === 'Sol')?.house} dice en qué ARENA de la vida se juega esto.

**Párrafo 2 — Tu mundo emocional (Luna en ${chart.chartSummary.moonSign}, Casa ${chart.planets.find(p => p.name === 'Luna')?.house}):**
¿Qué necesita ${name} para sentirse seguro/a emocionalmente? ¿Cuáles son sus reacciones automáticas bajo presión? ¿Qué heridas de la infancia (sin dramatizar) dejaron una huella en cómo procesa las emociones hoy? ¿Cómo afecta esto a sus relaciones más cercanas?

**Párrafo 3 — Cómo te percibe el mundo (Ascendente en ${chart.chartSummary.ascendantSign}):**
¿Qué primera impresión genera ${name} en los demás, aunque por dentro sea diferente? ¿Cuál es la brecha entre cómo la ven y quién realmente es? ¿Cómo puede usar conscientemente esa energía exterior como herramienta?

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
· ¿Qué tipo de trabajo le da sentido a ${name}? ¿Qué ambientes profesionales la/o potencian o agotan?
· ¿Cuál es su relación con la autoridad, la estructura y la disciplina?
· ¿Qué le dice su carta sobre el dinero y los recursos — qué creencias puede estar cargando?
· ¿Cuál es su vocación más profunda, más allá del título o el sueldo?

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
Extensión total: 1800–2200 palabras. Escribe con profundidad real; no resumas.
DISTRIBUCIÓN DE ESPACIO: Secciones I–VII: máximo 250 palabras cada una. Sección IX (CONCLUSIÓN): mínimo 200 palabras, siempre completa. Si el espacio se agota, resumí las secciones IV–VII para garantizar que la Conclusión se genere íntegra.

---

# ✦ CONSULTA EVOLUTIVA — ${name.toUpperCase()}

## I. TRINIDAD ESENCIAL: Sol · Luna · Ascendente
(Igual que la Lectura Esencial, pero con mayor profundidad psicológica.
Integra el mito del signo según la visión de Liz Greene.)

## II. LOS PLANETAS PERSONALES EN DETALLE
Para Mercurio, Venus y Marte: un párrafo por planeta.
- Cómo se comunican, aman y actúan (respectivamente).
- La casa donde está cada uno define EL CAMPO donde esa energía se despliega.
- Incluye si hay retrogradación y su significado psicológico.

Posiciones:
· ${formatPlanet(chart.planets.find(p => p.name === 'Mercurio')!)}
· ${formatPlanet(chart.planets.find(p => p.name === 'Venus')!)}
· ${formatPlanet(chart.planets.find(p => p.name === 'Marte')!)}

## III. LOS PLANETAS SOCIALES: Júpiter y Saturno
- JÚPITER (${chart.planets.find(p => p.name === 'Júpiter')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Júpiter')?.house}): 
  El principio de expansión y significado. ¿Dónde busca ${name} su crecimiento natural?
- SATURNO (${chart.planets.find(p => p.name === 'Saturno')?.degreeStr}, Casa ${chart.planets.find(p => p.name === 'Saturno')?.house}${chart.planets.find(p => p.name === 'Saturno')?.retrograde ? ' ℞' : ''}): 
  El gran maestro. Las lecciones de karma y estructura. El regalo oculto en la restricción.
  (Usa la visión de Arroyo: Saturno como el lugar donde te conviertes en adulto.)

## IV. LOS PLANETAS TRANSPERSONALES
Urano, Neptuno y Plutón por generación y casa:
- Qué generacional los une con millones y qué los hace únicos por la casa específica.
· ${formatPlanet(chart.planets.find(p => p.name === 'Urano')!)}
· ${formatPlanet(chart.planets.find(p => p.name === 'Neptuno')!)}
· ${formatPlanet(chart.planets.find(p => p.name === 'Plutón')!)}

## V. EL NODO NORTE: LA DIRECCIÓN EVOLUTIVA
Nodo Norte en ${chart.northNode.degreeStr} — Casa ${chart.northNode.house}.
Este es el punto más importante para la evolución del alma según la astrología karmica.
¿Hacia dónde está "invitada" el alma de ${name} en esta vida?
¿Qué patrones del Nodo Sur (${toOpposite(chart.northNode.sign)}) debe integrar sin apegarse?

## VI. LAS CONFIGURACIONES DE ASPECTO PRINCIPALES
Analiza los 3–5 aspectos más importantes de la carta por su significado evolutivo.
Para cada uno: descripción psicológica profunda + cómo se manifiesta en la vida + integración.

Aspectos en orden de importancia (orbe más cerrado primero):
${chart.aspects.slice(0, 8).map(formatAspect).join('\n')}

## VII. LAS CASAS ANGULARES Y EL EJE DE VIDA
Analiza las casas angulares (1-4-7-10) como el eje que define la identidad,
las raíces, las relaciones y la vocación de ${name}.
${chart.chartSummary.angularPlanets.length > 0
  ? `Planetas en ángulos: ${chart.chartSummary.angularPlanets.join(', ')}`
  : 'Sin planetas angulares — el énfasis está en las casas sucedentes o cadentes.'}

## VIII. EL PROYECTO DE VIDA
En exactamente DOS párrafos cortos:
· Párrafo 1: ¿cuál es el "proyecto de vida" que esta carta propone para ${name}? No como destino fijo, sino como campo de posibilidades conscientes. Una visión de conjunto que solo emerge al ver toda la carta como un sistema.
· Párrafo 2: el principal obstáculo interno (sombra, nodo sur, aspecto difícil) y la clave de integración más poderosa de toda la carta.
NO resumás ni repitas análisis ya desarrollados — solo escribe lo que aún no dijiste.

## IX. CONCLUSIÓN EVOLUTIVA PERSONALIZADA
IMPORTANTE: Esta sección NO resume lo anterior — es orientación práctica nueva. No reescribas secciones previas.

${personalContext
  ? `Usando el siguiente contexto personal de ${name}: "${personalContext}"

Redactá 2 o 3 párrafos de guía concreta y accionable que conecten los patrones de la carta con esta situación real. Honesto, sin vacíos, orientado al movimiento. Esta sección debe completarse íntegramente.`
  : `Redactá 2 párrafos de orientación práctica para ${name}: qué actitud o acción concreta le pide esta carta en este momento. Directo y útil.`
}

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
