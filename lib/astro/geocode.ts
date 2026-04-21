/**
 * lib/astro/geocode.ts
 * Geocoding via Nominatim (OpenStreetMap) — sin API key, sin costo.
 * Convierte ciudad + país → latitud, longitud, offset UTC estimado.
 */

export interface GeoResult {
  latitude:  number;
  longitude: number;
  utcOffset: number;  // horas (aproximado por longitud, suficiente para astrología)
}

/**
 * Convierte nombre de ciudad y país a coordenadas geográficas.
 * Usa Nominatim (OpenStreetMap). No requiere API key.
 */
export async function geocodeCity(city: string, country: string): Promise<GeoResult> {
  const query = encodeURIComponent(`${city}, ${country}`);
  const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AstralEvolution/1.0 (lecturas@astralevolution.com)',
      'Accept-Language': 'es',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`);
  }

  const data = await res.json() as Array<{ lat: string; lon: string }>;

  if (!data || data.length === 0) {
    // Fallback: si la ciudad no se encuentra, usar offset 0 (UTC)
    console.warn(`[Geocode] No se encontró "${city}, ${country}" — usando lat/lon 0,0`);
    return { latitude: 0, longitude: 0, utcOffset: 0 };
  }

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);

  // Estimación del offset UTC por longitud: precisa a ±30 min, suficiente para astrología
  const utcOffset = Math.round(lon / 15);

  return { latitude: lat, longitude: lon, utcOffset };
}

/**
 * Convierte fecha + hora local → hora UTC.
 * birth_date: "YYYY-MM-DD", birth_time: "HH:MM"
 */
export function toUTCTime(
  birthDate: string,
  birthTime: string,
  utcOffset: number
): { year: number; month: number; day: number; hour: number; minute: number } {
  const [year, month, day]   = birthDate.split('-').map(Number);
  const [localHour, localMin] = birthTime.split(':').map(Number);

  // Hora en minutos desde medianoche, restando offset
  let totalMinutes = localHour * 60 + localMin - utcOffset * 60;

  // Ajustar día si hay desbordamiento
  let adjustedDay = day;
  let adjustedMonth = month;
  let adjustedYear = year;

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    adjustedDay -= 1;
    if (adjustedDay < 1) {
      adjustedMonth -= 1;
      if (adjustedMonth < 1) { adjustedMonth = 12; adjustedYear -= 1; }
      adjustedDay = daysInMonth(adjustedMonth, adjustedYear);
    }
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    adjustedDay += 1;
    const maxDay = daysInMonth(adjustedMonth, adjustedYear);
    if (adjustedDay > maxDay) {
      adjustedDay = 1;
      adjustedMonth += 1;
      if (adjustedMonth > 12) { adjustedMonth = 1; adjustedYear += 1; }
    }
  }

  return {
    year:   adjustedYear,
    month:  adjustedMonth,
    day:    adjustedDay,
    hour:   Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
