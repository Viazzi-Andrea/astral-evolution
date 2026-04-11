export const LATAM_COUNTRIES = [
  'MX', // México
  'AR', // Argentina
  'CL', // Chile
  'CO', // Colombia
  'PE', // Perú
  'VE', // Venezuela
  'EC', // Ecuador
  'BO', // Bolivia
  'PY', // Paraguay
  'UY', // Uruguay
  'CR', // Costa Rica
  'PA', // Panamá
  'GT', // Guatemala
  'HN', // Honduras
  'SV', // El Salvador
  'NI', // Nicaragua
  'CU', // Cuba
  'DO', // República Dominicana
  'PR', // Puerto Rico
  'BR', // Brasil
] as const;

export function isLatamCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return LATAM_COUNTRIES.includes(countryCode.toUpperCase() as any);
}

export function getRegion(countryCode: string | null | undefined): 'latam' | 'intl' {
  return isLatamCountry(countryCode) ? 'latam' : 'intl';
}
