/**
 * lib/astro/geocode.ts
 * Geocoding via Nominatim (OpenStreetMap) — sin API key, sin costo.
 * Convierte ciudad + país → latitud, longitud, nombre IANA de timezone.
 *
 * El offset UTC se calcula con Intl.DateTimeFormat para respetar el horario
 * de verano histórico en la fecha exacta de nacimiento.
 */

export interface GeoResult {
  latitude:  number;
  longitude: number;
  tzName:    string;   // IANA timezone name, ej: "America/Montevideo"
}

// ─── Países con una sola zona horaria ────────────────────────────────────────

const SINGLE_TZ: Record<string, string> = {
  // América del Sur
  AR: 'America/Buenos_Aires',
  UY: 'America/Montevideo',
  BO: 'America/La_Paz',
  PY: 'America/Asuncion',
  PE: 'America/Lima',
  EC: 'America/Guayaquil',
  CO: 'America/Bogota',
  VE: 'America/Caracas',
  GY: 'America/Guyana',
  SR: 'America/Paramaribo',
  // América Central y Caribe
  GT: 'America/Guatemala',
  SV: 'America/El_Salvador',
  HN: 'America/Tegucigalpa',
  NI: 'America/Managua',
  CR: 'America/Costa_Rica',
  PA: 'America/Panama',
  CU: 'America/Havana',
  DO: 'America/Santo_Domingo',
  PR: 'America/Puerto_Rico',
  JM: 'America/Jamaica',
  HT: 'America/Port-au-Prince',
  TT: 'America/Port_of_Spain',
  BB: 'America/Barbados',
  // Europa
  ES: 'Europe/Madrid',
  PT: 'Europe/Lisbon',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome',
  GB: 'Europe/London',
  IE: 'Europe/Dublin',
  NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels',
  CH: 'Europe/Zurich',
  AT: 'Europe/Vienna',
  PL: 'Europe/Warsaw',
  GR: 'Europe/Athens',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki',
  RO: 'Europe/Bucharest',
  HU: 'Europe/Budapest',
  CZ: 'Europe/Prague',
  SK: 'Europe/Bratislava',
  HR: 'Europe/Zagreb',
  // África y Oriente Medio
  EG: 'Africa/Cairo',
  ZA: 'Africa/Johannesburg',
  NG: 'Africa/Lagos',
  KE: 'Africa/Nairobi',
  MA: 'Africa/Casablanca',
  IL: 'Asia/Jerusalem',
  SA: 'Asia/Riyadh',
  AE: 'Asia/Dubai',
  TR: 'Europe/Istanbul',
  // Asia
  IN: 'Asia/Kolkata',
  PK: 'Asia/Karachi',
  BD: 'Asia/Dhaka',
  TH: 'Asia/Bangkok',
  VN: 'Asia/Ho_Chi_Minh',
  SG: 'Asia/Singapore',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  PH: 'Asia/Manila',
  ID: 'Asia/Jakarta',   // Java/Sumatra; Indonesia tiene múltiples pero esta es la principal
  // Oceanía
  NZ: 'Pacific/Auckland',
};

// ─── Países con múltiples zonas: estimación por longitud ─────────────────────

function resolveMultiTzCountry(cc: string, lon: number): string {
  switch (cc) {
    case 'CL': return lon < -80 ? 'Pacific/Easter' : 'America/Santiago';
    case 'BR':
      if (lon > -34) return 'America/Noronha';
      if (lon > -44) return 'America/Sao_Paulo';
      if (lon > -60) return 'America/Manaus';
      return 'America/Rio_Branco';
    case 'MX':
      if (lon > -87) return 'America/Cancun';
      if (lon > -98) return 'America/Mexico_City';
      if (lon > -108) return 'America/Chihuahua';
      return 'America/Tijuana';
    case 'US':
      if (lon > -80) return 'America/New_York';
      if (lon > -90) return 'America/Chicago';
      if (lon > -104) return 'America/Denver';
      if (lon > -120) return 'America/Los_Angeles';
      return 'America/Anchorage';
    case 'CA':
      if (lon > -60) return 'America/Halifax';
      if (lon > -75) return 'America/Toronto';
      if (lon > -90) return 'America/Winnipeg';
      if (lon > -110) return 'America/Edmonton';
      return 'America/Vancouver';
    case 'AU':
      if (lon > 140) return 'Australia/Sydney';
      if (lon > 130) return 'Australia/Adelaide';
      if (lon > 125) return 'Australia/Darwin';
      return 'Australia/Perth';
    case 'RU':
      if (lon < 45)  return 'Europe/Moscow';
      if (lon < 60)  return 'Asia/Yekaterinburg';
      if (lon < 75)  return 'Asia/Omsk';
      if (lon < 90)  return 'Asia/Novosibirsk';
      if (lon < 105) return 'Asia/Krasnoyarsk';
      if (lon < 120) return 'Asia/Irkutsk';
      if (lon < 135) return 'Asia/Yakutsk';
      if (lon < 150) return 'Asia/Vladivostok';
      return 'Asia/Kamchatka';
    case 'CN': return 'Asia/Shanghai';
    default:   return lonFallback(lon);
  }
}

function lonFallback(lon: number): string {
  const offset = Math.round(lon / 15);
  const map: Record<string, string> = {
    '-12': 'Etc/GMT+12', '-11': 'Pacific/Pago_Pago', '-10': 'Pacific/Honolulu',
    '-9': 'America/Anchorage', '-8': 'America/Los_Angeles', '-7': 'America/Denver',
    '-6': 'America/Chicago', '-5': 'America/New_York', '-4': 'America/Caracas',
    '-3': 'America/Buenos_Aires', '-2': 'Atlantic/South_Georgia',
    '-1': 'Atlantic/Azores', '0': 'Europe/London', '1': 'Europe/Paris',
    '2': 'Europe/Athens', '3': 'Europe/Moscow', '4': 'Asia/Dubai',
    '5': 'Asia/Karachi', '6': 'Asia/Dhaka', '7': 'Asia/Bangkok',
    '8': 'Asia/Shanghai', '9': 'Asia/Tokyo', '10': 'Australia/Sydney',
    '11': 'Pacific/Noumea', '12': 'Pacific/Auckland',
  };
  return map[String(offset)] ?? 'UTC';
}

function resolveTzName(countryCode: string, lon: number): string {
  return SINGLE_TZ[countryCode] ?? resolveMultiTzCountry(countryCode, lon);
}

// ─── Offset UTC exacto usando Intl (respeta horario de verano histórico) ──────

function getTimezoneOffsetAt(tzName: string, date: Date): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
    const h = parts.hour === '24' ? 0 : parseInt(parts.hour);
    const localMs = Date.UTC(
      parseInt(parts.year), parseInt(parts.month) - 1, parseInt(parts.day),
      h, parseInt(parts.minute), parseInt(parts.second)
    );
    return (localMs - date.getTime()) / (1000 * 60 * 60);
  } catch {
    return Math.round(0 / 15);
  }
}

// ─── Geocodificación ──────────────────────────────────────────────────────────

export async function geocodeCity(city: string, country: string): Promise<GeoResult> {
  const query = encodeURIComponent(`${city}, ${country}`);
  const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AstralEvolution/1.0 (lecturas@astralevolution.com)',
      'Accept-Language': 'es',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);

  const data = await res.json() as Array<{ lat: string; lon: string; address?: { country_code?: string } }>;

  if (!data || data.length === 0) {
    console.warn(`[Geocode] No se encontró "${city}, ${country}" — usando UTC`);
    return { latitude: 0, longitude: 0, tzName: 'UTC' };
  }

  const lat         = parseFloat(data[0].lat);
  const lon         = parseFloat(data[0].lon);
  const countryCode = (data[0].address?.country_code ?? '').toUpperCase();
  const tzName      = resolveTzName(countryCode, lon);

  console.log(`[Geocode] ${city}, ${country} → (${lat.toFixed(2)}, ${lon.toFixed(2)}) timezone: ${tzName}`);

  return { latitude: lat, longitude: lon, tzName };
}

// ─── Conversión hora local → UTC ──────────────────────────────────────────────

/**
 * Convierte la hora local de nacimiento a UTC usando el nombre IANA de la timezone.
 * Maneja DST histórico correctamente.
 */
export function toUTCTime(
  birthDate: string,   // "YYYY-MM-DD"
  birthTime: string,   // "HH:MM"
  tzName:    string    // IANA timezone name
): { year: number; month: number; day: number; hour: number; minute: number } {
  const [year, month, day]    = birthDate.split('-').map(Number);
  const [localHour, localMin] = birthTime.split(':').map(Number);

  // Crear un timestamp UTC aproximado tratando la hora local como si fuera UTC
  const approxUtc   = new Date(Date.UTC(year, month - 1, day, localHour, localMin));

  // Calcular el offset real en esa timezone para esa fecha/hora
  const offsetHours = getTimezoneOffsetAt(tzName, approxUtc);

  // UTC real = hora local - offset
  const trueUtcMs = approxUtc.getTime() - offsetHours * 60 * 60 * 1000;
  const trueUtc   = new Date(trueUtcMs);

  return {
    year:   trueUtc.getUTCFullYear(),
    month:  trueUtc.getUTCMonth() + 1,
    day:    trueUtc.getUTCDate(),
    hour:   trueUtc.getUTCHours(),
    minute: trueUtc.getUTCMinutes(),
  };
}
