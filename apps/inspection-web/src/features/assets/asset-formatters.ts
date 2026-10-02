import type { Asset, Site } from './models';

const statusLabels: Record<Asset['status'], string> = {
  ACTIVE: 'Activo',
  OUT_OF_SERVICE: 'Fuera de servicio',
  INACTIVE: 'Inactivo',
};

const siteTypeLabels: Record<Site['type'], string> = {
  MINE: 'Mina',
  PLANT: 'Planta',
  SITE: 'Faena / Sitio',
};

export function formatAssetStatus(status: Asset['status']) {
  return statusLabels[status];
}

export function formatSiteType(type: Site['type']) {
  return siteTypeLabels[type];
}
