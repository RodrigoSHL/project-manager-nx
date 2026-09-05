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

export function formatAssetType(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatAssetStatus(status: Asset['status']) {
  return statusLabels[status];
}

export function formatSiteType(type: Site['type']) {
  return siteTypeLabels[type];
}
