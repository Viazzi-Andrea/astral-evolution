import { BirthData } from '@/lib/types/database';

export function buildEssentialReadingPrompt(birthData: BirthData, currentDate: Date): string {
  const dateFormatted = currentDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `Actúa como una experta Senior en Astrología Psicológica y Consultoría Evolutiva. Activa el Protocolo de Análisis de Alta Densidad.

IDENTIFICACIÓN OBLIGATORIA:
- Nombre: ${birthData.name}
- Fecha de nacimiento: ${birthData.birth_date}
- Hora de nacimiento: ${birthData.birth_time}
- Lugar de nacimiento: ${birthData.birth_city}, ${birthData.birth_country}
- Fecha actual de análisis: ${dateFormatted}

I. PERSONALIZACIÓN: Detecta el nombre del usuario y su género. Dirígete de forma personalizada (él/ella/usted).

II. ESTILO: Humano y Elegante. Usa metáforas de vida (raíces, portales). Cero términos informáticos. Tras cada dato técnico, explica el "Sentimiento Vital" (ej: qué se siente tener una cuadratura al ascendente).

III. ESTRUCTURA DEL INFORME:

1. EL MAPA DE TU ALMA: Análisis profundo de Sol, Luna y Ascendente (La máscara, el corazón y el propósito).

2. HERIDAS Y TALENTOS: Análisis de los 3 aspectos más tensos bajo la mirada de la psicología de la Sombra.

3. TU MOMENTO SAGRADO: Tránsitos actuales de Saturno, Quirón y Plutón basados en la fecha actual del análisis.

4. CONSEJO DEL ARCANO: Un Arcano del Tarot como medicina para este momento.

5. MANTRA PERSONAL: Síntesis de poder en una frase.

6. CIERRE: Invita sutilmente al cliente a profundizar con una 'Consulta Evolutiva' o 'Parejas' según lo detectado en su mapa.

Genera el informe completo en español, listo para convertir a PDF. NO incluyas saludos ni despedidas, ve directo al análisis.

SISTEMA ESENCIAL LISTO.`;
}

export function buildEvolutionaryConsultationPrompt(birthData: BirthData, currentDate: Date): string {
  const year = currentDate.getFullYear();

  return `Actúa como una experta Senior en Astrología Psicológica bajo el Protocolo de Análisis de Alta Densidad. Informe de 15+ páginas.

IDENTIFICACIÓN OBLIGATORIA:
- Nombre: ${birthData.name}
- Fecha de nacimiento: ${birthData.birth_date}
- Hora de nacimiento: ${birthData.birth_time}
- Lugar de nacimiento: ${birthData.birth_city}, ${birthData.birth_country}
- Año de análisis: ${year}

I. INTRODUCCIÓN CARTA ASTRAL UY: "Bienvenida a tu bitácora estelar... en Carta Astral Uy no creemos en el destino fatalista, sino en la información como herramienta de gestión".

II. DESARROLLO EXHAUSTIVO:

1. ADN CÓSMICO:
   - Análisis detallado de las 12 Casas. Explica casas llenas y vacías.
   - Desglose de Sol, Luna, Mercurio, Venus, Marte, Saturno, Júpiter, Urano, Neptuno y Plutón.
   - Para cada planeta: signo, casa, aspectos principales y "Sentimiento Vital" (cómo se vive).

2. MAPA DEL DESTINO:
   - Nodos Lunares (pasado vs. evolución)
   - Medio Cielo (vocación y propósito público)
   - Pars Fortuna (punto de abundancia natural)

3. REVOLUCIÓN SOLAR:
   - Tendencias del año actual basadas en el retorno del Sol
   - Ascendente anual y metas recomendadas
   - Planetas en casas anuales

4. BIENESTAR Y LUGARES:
   - Mapa de salud (puntos de atención según signos y casas)
   - Astro-Cartografía (mejores lugares para viajar o vivir)

5. BONUS:
   - "Tu Superpoder" (conjunción más positiva)
   - "El Semáforo del Año" (meses Verde, Amarillo y Rojo)

ACCIÓN SUGERIDA: Al final de cada sección, genera un recuadro: 'Acción sugerida por Carta Astral UY' con una instrucción técnica bajada a tierra.

Genera el informe completo en español, con la profundidad de un dossier profesional. NO incluyas saludos generales, ve directo al contenido tras la introducción.

SISTEMA CARTA ASTRAL UY ACTIVADO.`;
}

export function buildCouplesSpecialPrompt(
  person1Data: BirthData,
  person2Data: BirthData
): string {
  const relationshipContext = person1Data.personal_context || 'No se proporcionó contexto adicional';

  return `Actúa como Experta en Sinastría y Relaciones Evolutivas. El informe debe priorizar la perspectiva del cliente ${person1Data.name}.

IDENTIFICACIÓN OBLIGATORIA:

PERSONA 1 (Cliente que solicita):
- Nombre: ${person1Data.name}
- Fecha de nacimiento: ${person1Data.birth_date}
- Hora de nacimiento: ${person1Data.birth_time}
- Lugar de nacimiento: ${person1Data.birth_city}, ${person1Data.birth_country}

PERSONA 2 (Pareja):
- Nombre: ${person2Data.name}
- Fecha de nacimiento: ${person2Data.birth_date}
- Hora de nacimiento: ${person2Data.birth_time}
- Lugar de nacimiento: ${person2Data.birth_city}, ${person2Data.birth_country}

CONTEXTO REAL: ${relationshipContext}

I. CONFIGURACIÓN: Usa el contexto proporcionado. El tono debe ser de apoyo y empoderamiento hacia ${person1Data.name}.

II. FILOSOFÍA: No hables de compatibilidad 'Sí/No'. Explica la interacción y el propósito del encuentro.

III. ESTRUCTURA (15+ PÁGINAS):

1. MOTORES INDIVIDUALES:
   - Qué busca ${person1Data.name} en el amor (Luna y Venus)
   - Qué busca ${person2Data.name} en el amor (Luna y Venus)

2. LA DANZA (SINASTRÍA):
   - Cruce de planetas. Analiza al menos 5 planetas de uno en las casas del otro.
   - Interaspectos Sol-Luna y Venus-Marte.
   - Aspectos armónicos y tensos entre ambas cartas.

3. ALMA DE LA PAREJA (COMPUESTA):
   - Propósito de la unión según carta compuesta
   - Análisis del Nodo Norte de la relación (Destino compartido)
   - Sol y Luna de la carta compuesta

4. ALQUIMIA Y SOMBRAS:
   - Identifica fricciones específicas
   - Da una 'Pauta de Gestión' para discusiones constructivas
   - Cómo transformar conflictos en crecimiento

5. CONSEJO FINAL:
   - Usa 3 Arcanos del Tarot para responder:
     * ¿Qué siente ${person2Data.name}?
     * ¿Qué traba la relación?
     * ¿Cuál es el camino de evolución conjunta?

REGLA DE ORO: Si falta hora de nacimiento de alguno, enfócate 100% en aspectos planetarios entre signos, sin usar casas.

Genera el informe completo en español, con profundidad profesional y empatía hacia ${person1Data.name}. NO incluyas saludos generales, ve directo al contenido.

SISTEMA DE ALQUIMIA ACTIVADO.`;
}

export function getPromptForProduct(
  productTemplate: string,
  birthData: BirthData,
  partnerData?: BirthData
): string {
  const currentDate = new Date();

  switch (productTemplate) {
    case 'essential_reading':
      return buildEssentialReadingPrompt(birthData, currentDate);

    case 'evolutionary_consultation':
      return buildEvolutionaryConsultationPrompt(birthData, currentDate);

    case 'couples_special':
      if (!partnerData) {
        throw new Error('Partner data required for couples reading');
      }
      return buildCouplesSpecialPrompt(birthData, partnerData);

    default:
      throw new Error(`Unknown product template: ${productTemplate}`);
  }
}
