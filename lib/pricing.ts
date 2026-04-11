export interface PricingRegion {
  countries: string[];
  multiplier: number;
  currency: string;
  currencySymbol: string;
}

export const hardcodedPrices: Record<string, { latam: number; international: number }> = {
  'lectura-esencial': { latam: 10.50, international: 19.00 },
  'consulta-evolutiva': { latam: 26.60, international: 49.00 },
  'especial-parejas': { latam: 38.50, international: 69.00 },
};

export const pricingRegions: Record<string, PricingRegion> = {
  latam: {
    countries: ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE'],
    multiplier: 1.0,
    currency: 'USD',
    currencySymbol: 'USD ',
  },
  europe: {
    countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'],
    multiplier: 1.0,
    currency: 'USD',
    currencySymbol: 'USD ',
  },
  northAmerica: {
    countries: ['US', 'CA', 'PR'],
    multiplier: 1.0,
    currency: 'USD',
    currencySymbol: 'USD ',
  },
  default: {
    countries: [],
    multiplier: 1.0,
    currency: 'USD',
    currencySymbol: 'USD ',
  },
};

export function getPricingRegion(countryCode: string): PricingRegion {
  for (const region of Object.values(pricingRegions)) {
    if (region.countries.includes(countryCode)) {
      return region;
    }
  }
  return pricingRegions.default;
}

export function calculateLocalPrice(basePriceUSD: number, countryCode: string, productSlug?: string): {
  amount: number;
  currency: string;
  currencySymbol: string;
  formatted: string;
} {
  const region = getPricingRegion(countryCode);
  let localAmount = basePriceUSD;

  if (productSlug && hardcodedPrices[productSlug]) {
    const isLatam = pricingRegions.latam.countries.includes(countryCode);
    localAmount = isLatam ? hardcodedPrices[productSlug].latam : hardcodedPrices[productSlug].international;
  }

  return {
    amount: localAmount,
    currency: region.currency,
    currencySymbol: region.currencySymbol,
    formatted: `${region.currencySymbol}${localAmount.toFixed(2)}`,
  };
}

export async function getCountryFromIP(ip?: string): Promise<string> {
  try {
    const response = await fetch(ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'US';
  } catch (error) {
    console.error('Error fetching country from IP:', error);
    return 'US';
  }
}
