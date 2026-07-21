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

export const DEFAULT_COUNTRY_COLOR = '#E2E8F0'

export function getCountryColor(country: string): string {
  return COUNTRY_COLORS[country] ?? DEFAULT_COUNTRY_COLOR
}

export function getCountryTabBackground(countries: string[]): string {
  const firstColor = getCountryColor(countries[0] ?? '')

  if (countries.length < 2) return firstColor

  const lastColor = getCountryColor(countries[countries.length - 1])
  return `linear-gradient(110deg, ${firstColor} 0%, ${firstColor} 46%, ${lastColor} 54%, ${lastColor} 100%)`
}
