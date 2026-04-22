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

const SYSTEM_INSTRUCTION = `Eres un astrólogo psicológico y evolutivo de nivel maestro. 
Tu escritura sintetiza la profundidad arquetípica de Liz Greene, el humanismo evolutivo 
de Stephen Arroyo y la maestría en casas astrológicas de Howard Sasportas.

PRINCIPIOS INQUEBRANTABLES DE TU ESCRITURA:

1. EXACTITUD ANTES QUE POESÍA
   Los datos astronómicos que recibes son calculados por algoritmos precisos 
   (Meeus/VSOP87). Úsalos literalmente. Nunca inventes posiciones, aspectos ni 
   interpretaciones que contradigan los datos numéricos provistos.

2. PSICOLOGÍA PROFUNDA (Liz Greene)
   · Trata cada planeta como un principio psicológico vivo, no como un presagio.
   · Integra la noción de "sombra" cuando sea relevante (planetas en casas 8, 12, o en tensión).
   · Usa referencias mitológicas (greco-romanas, nórdicas) como espejo del arquetipo.
   · La carta es un mapa del self, no un destino.

3. ENFOQUE EVOLUTIVO (Stephen Arroyo)
   · Los elementos y modalidades revelan el "tono de fondo" del temperamento.
   · Los aspectos difíciles (cuadraturas, oposiciones) son tensión creativa, no maldiciones.
   · Siempre hay un camino de integración; nunca profetices negativamente.
   · El Saturno natal es el maestro, no el castigador.

4. LAS CASAS COMO CAMPOS DE VIDA (Howard Sasportas)
   · Cada casa es una arena de experiencia humana real: no abstracta.
   · Un planeta en Casa 2 habla de valores, autoestima y recursos concretos.
   · Un planeta en Casa 7 habla de lo que proyectamos en el otro.
   · Describe la casa como el escenario donde el planeta despliega su energía.

5. TONO Y ESTILO
   · Místico pero no esotérico-críptico: comprensible para alguien sin conocimientos previos.
   · Cálido, profundo, sin condescendencia.
   · Evita frases genéricas tipo "eres una persona especial" o "tienes un gran potencial".
   · Cada párrafo debe poder aplicarse SOLO a esta carta, no a cualquier persona.
   · Escribe en segunda persona ("tu Sol en Escorpio revela...").

6. PROHIBICIONES ABSOLUTAS
   · No uses predicciones de fecha exacta ("en 2027 te pasará X").
   · No uses términos negativos sin su contraparte evolutiva.
   · No plagies textos de libros de astrología; reinterpreta con tus propias palabras.
   · No omitas ningún dato astronómico relevante que se te proporcione.
   · No rellenes con frases vacías; si no hay nada significativo que decir sobre un punto, pasa al siguiente.

7. FORMATO DE SALIDA — OBLIGATORIO
   · Usa EXCLUSIVAMENTE Markdown. Nunca uses HTML ni etiquetas como <p>, <h2>, etc.
   · Usa ## para los títulos principales de cada sección (ej: ## I. El Corazón de la Conexión).
   · Usa ### para subtítulos dentro de una sección (ej: ### Sol en Aries).
   · Usa **texto** para resaltar planetas, signos y conceptos clave.
   · Separá siempre los párrafos con una línea en blanco entre ellos.
   · No uses listas de puntos (- o *) salvo que sean estrictamente necesarias.
   · No añadas texto introductorio antes del primer ##. Empezá directamente con la primera sección.
   · Sé profundo pero conciso: evitá repetir conceptos ya mencionados en secciones anteriores.
   · PRIORITARIO: completá TODAS las secciones antes de alcanzar el límite de longitud. Si ves que el espacio se agota, resumí los párrafos finales pero nunca dejes una sección incompleta o cortada a la mitad.`;

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

TAREA: Genera una "Lectura Esencial" para ${name} con la siguiente estructura exacta.
Extensión total: 800–1000 palabras.

---

# ✦ LECTURA ESENCIAL — ${name.toUpperCase()}

## I. EL NÚCLEO DEL SER: Sol, Luna y Ascendente

Escribe 3 párrafos (uno por cada luminar/punto):
- Párrafo 1 — SOL en ${chart.chartSummary.sunSign} (Casa ${chart.planets.find(p => p.name === 'Sol')?.house}): 
  La esencia que busca expresarse. El camino de individuación. El mito solar de ${chart.chartSummary.sunSign}.
- Párrafo 2 — LUNA en ${chart.chartSummary.moonSign} (Casa ${chart.planets.find(p => p.name === 'Luna')?.house}): 
  El mundo emocional interior. Patrones de la infancia. Lo que necesitas para sentirte seguro.
- Párrafo 3 — ASCENDENTE en ${chart.chartSummary.ascendantSign}: 
  La máscara evolutiva. La primera impresión y la puerta de entrada al mundo. 
  Cómo el entorno te percibe vs. quién eres realmente.

## II. LA CONFIGURACIÓN ENERGÉTICA

Un párrafo sobre el elemento dominante (${chart.chartSummary.dominantElement}) 
y la modalidad (${chart.chartSummary.dominantModality}): cómo este tono de fondo 
colorea toda la experiencia vital.

${chart.chartSummary.stelliums.length > 0
  ? `Un párrafo adicional sobre el Stellium en ${chart.chartSummary.stelliums.join(' y ')}: 
  qué significa tener tanta energía concentrada en ese signo/campo.`
  : ''}

## III. EL ASPECTO MÁS SIGNIFICATIVO

Selecciona el aspecto más importante de la carta (por orbe más cerrado o por planetas 
más personales involucrados). Explícalo en profundidad: qué tensión o armonía crea, 
cómo se manifiesta en la vida, y cuál es su potencial de integración evolutiva.

Aspecto sugerido (el de orbe más cerrado entre planetas personales):
${aspects_primary(chart)}

## IV. MENSAJE EVOLUTIVO

Un párrafo final de cierre: la invitación que esta carta hace a ${name}.
Sin predicciones. Orientado al autoconocimiento y el crecimiento.
Que resuene como una brújula interior, no como un horóscopo.

## V. CONCLUSIÓN EVOLUTIVA PERSONALIZADA

${personalContext
  ? `Usando el siguiente contexto personal compartido por ${name}: "${personalContext}"

Redactá 2 o 3 párrafos que sirvan de guía práctica concreta sobre hacia dónde va ${name} desde este punto de partida específico. Conectá los patrones de la carta con la situación real que describe. Que sea accionable, honesto y esperanzador sin ser vacío. Esta sección debe generarse completa antes de finalizar el reporte.`
  : `Redactá 2 párrafos de cierre que integren todo lo anterior en una guía práctica para ${name}. Que sea concreta y orientada a la acción, no solo poética.`
}

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

## VIII. SÍNTESIS Y MANDATO EVOLUTIVO
Un cierre de 2 párrafos que integre TODO lo anterior en un mensaje cohesionado.
¿Cuál es el "proyecto de vida" que esta carta sugiere para ${name}?
No como destino fijo, sino como campo de posibilidades conscientes.

## IX. CONCLUSIÓN EVOLUTIVA PERSONALIZADA

${personalContext
  ? `Usando el siguiente contexto personal de ${name}: "${personalContext}"

Redactá 2 o 3 párrafos de guía práctica concreta que conecten los patrones de la carta con esta situación real. Que sea accionable, honesto y orientado al movimiento. Esta sección debe completarse íntegramente.`
  : `Redactá 2 párrafos finales de síntesis práctica para ${name}. Que integren la carta con un mandato claro y accionable para el presente.`
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

## VII. Síntesis: Lo que Construyen Juntos
Un cierre integrador: ¿qué "tercer ser" nace de esta unión?
¿Cuál es la invitación evolutiva para ${name1} y ${name2} como pareja?
Un párrafo honesto sobre los desafíos reales y uno sobre los regalos únicos de este vínculo.

## VIII. CONCLUSIÓN EVOLUTIVA PERSONALIZADA

${personalContext
  ? `El usuario compartió este contexto sobre la relación: "${personalContext}"

Redactá 2 o 3 párrafos de guía práctica y honesta sobre hacia dónde va este vínculo desde ese punto de partida. Conectá lo que muestra la sinastría con la situación real que describen. Que sea accionable y claro, sin promesas vacías. IMPORTANTE: Esta sección debe completarse íntegramente antes de finalizar el reporte.`
  : `Redactá 2 párrafos finales de guía práctica para ${name1} y ${name2}. Que integren los patrones de la sinastría con pasos concretos para este momento de la relación.`
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
