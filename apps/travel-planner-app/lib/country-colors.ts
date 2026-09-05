export const COUNTRY_COLORS: Record<string, string> = {
  España: '#F6D77A',             // amarillo cálido
  Francia: '#B9D5F2',            // azul cielo
  Italia: '#B9DFC5',             // verde salvia
  Suiza: '#F2B8B5',              // rojo coral suave
  'Reino Unido': '#C5C3E6',      // azul lavanda
  Alemania: '#C9CDD2',           // gris plata
  Portugal: '#A9D8C3',           // verde atlántico
  'Países Bajos': '#F3BD83',     // naranjo pastel
  Austria: '#EDC2CC',            // rosa empolvado
  Bélgica: '#E4CF8D',            // dorado suave
  Grecia: '#A9D8ED',             // azul mediterráneo
  'República Checa': '#C6C8E8',  // lavanda azulada
  Hungría: '#BFDCC5',            // verde tenue
  Polonia: '#F1C4D0',            // rosa pastel
  Croacia: '#E9B8BC',            // rojo piedra suave
  Noruega: '#D5BBD5',            // malva nórdico
  Suecia: '#B9DCEB',             // celeste escandinavo
  Dinamarca: '#E8B5C0',          // frambuesa suave
  Irlanda: '#AFE0BC',            // verde claro
  Escocia: '#AFCBE5',            // azul brumoso
  Chile: '#ECAFB2',              // rojo suave
}

// Dark-mode counterparts keep each country's hue while avoiding bright pastel
// blocks against the calendar's near-black surface.
export const DARK_COUNTRY_COLORS: Record<string, string> = {
  España: '#584717',
  Francia: '#193D5B',
  Italia: '#1C4936',
  Suiza: '#5A2930',
  'Reino Unido': '#39385C',
  Alemania: '#3C424A',
  Portugal: '#1B4B3D',
  'Países Bajos': '#5B371B',
  Austria: '#56313B',
  Bélgica: '#50451E',
  Grecia: '#17485C',
  'República Checa': '#353B61',
  Hungría: '#284B35',
  Polonia: '#572F3C',
  Croacia: '#572D34',
  Noruega: '#4A304C',
  Suecia: '#214858',
  Dinamarca: '#572A38',
  Irlanda: '#1E4D31',
  Escocia: '#203F5B',
  Chile: '#5A2932',
}

export const DEFAULT_COUNTRY_COLOR = '#E2E8F0'
export const DEFAULT_DARK_COUNTRY_COLOR = '#374151'

export function getCountryColor(country: string): string {
  return COUNTRY_COLORS[country] ?? DEFAULT_COUNTRY_COLOR
}

export function getDarkCountryColor(country: string): string {
  return DARK_COUNTRY_COLORS[country] ?? DEFAULT_DARK_COUNTRY_COLOR
}

function getBackground(
  countries: string[],
  getColor: (country: string) => string
): string {
  const firstColor = getColor(countries[0] ?? '')

  if (countries.length < 2) return firstColor

  const lastColor = getColor(countries[countries.length - 1])
  return `linear-gradient(110deg, ${firstColor} 0%, ${firstColor} 46%, ${lastColor} 54%, ${lastColor} 100%)`
}

export function getCountryTabBackground(countries: string[]): string {
  return getBackground(countries, getCountryColor)
}

export function getCountryTabBackgrounds(
  countries: string[]
): { light: string; dark: string } {
  return {
    light: getBackground(countries, getCountryColor),
    dark: getBackground(countries, getDarkCountryColor),
  }
}
