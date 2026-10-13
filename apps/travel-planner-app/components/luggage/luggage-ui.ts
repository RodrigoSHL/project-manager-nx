import { Backpack, BriefcaseBusiness, Camera, CircleDollarSign, Dumbbell, FileText, Footprints, HeartPulse, Laptop, Luggage, Package, Shirt, ShoppingBag, Sparkles, Sun, Umbrella, Utensils, WalletCards } from 'lucide-react'
import { LuggageInput, LuggageType, PackingCategory } from '@/services/luggageService'

export const LUGGAGE_TYPES: Record<LuggageType, { label: string; shortLabel: string }> = {
  personal_backpack: { label: 'Mochila pequeña / artículo personal', shortLabel: 'Mochila personal' },
  travel_backpack: { label: 'Mochila de viaje', shortLabel: 'Mochila de viaje' },
  personal_bag: { label: 'Bolso personal', shortLabel: 'Bolso personal' },
  duffel: { label: 'Bolso deportivo', shortLabel: 'Bolso deportivo' },
  carry_on: { label: 'Carry-on / maleta de cabina', shortLabel: 'Carry-on' },
  medium_suitcase: { label: 'Maleta mediana', shortLabel: 'Maleta mediana' },
  large_suitcase: { label: 'Maleta grande', shortLabel: 'Maleta grande' },
  checked_suitcase: { label: 'Maleta de bodega', shortLabel: 'Maleta facturada' },
  special: { label: 'Equipaje especial', shortLabel: 'Especial' },
  custom: { label: 'Tipo personalizado', shortLabel: 'Personalizado' },
}

export const LUGGAGE_PRESETS: Array<{ label: string; description: string; data: LuggageInput }> = [
  {
    label: 'Mochila personal',
    description: '20 L · debajo del asiento',
    data: { name: 'Mochila personal', type: 'personal_backpack', color: '#0ea5e9', capacityLiters: 20, emptyWeight: 0.7, maxWeight: 8, dimensions: { height: 40, width: 30, depth: 20 }, cabinCompatible: true, personalItemCompatible: true, checkedBaggage: false },
  },
  {
    label: 'Mochila de viaje',
    description: '40 L · cabina',
    data: { name: 'Mochila de viaje', type: 'travel_backpack', color: '#14b8a6', capacityLiters: 40, emptyWeight: 1.2, maxWeight: 10, dimensions: { height: 55, width: 35, depth: 23 }, cabinCompatible: true, personalItemCompatible: false, checkedBaggage: false },
  },
  {
    label: 'Carry-on estándar',
    description: '38 L · ruedas',
    data: { name: 'Carry-on', type: 'carry_on', color: '#6366f1', capacityLiters: 38, emptyWeight: 2.7, maxWeight: 10, dimensions: { height: 55, width: 40, depth: 23 }, cabinCompatible: true, personalItemCompatible: false, checkedBaggage: false },
  },
  {
    label: 'Maleta mediana',
    description: '70 L · bodega',
    data: { name: 'Maleta mediana', type: 'medium_suitcase', color: '#f59e0b', capacityLiters: 70, emptyWeight: 3.5, maxWeight: 23, dimensions: { height: 67, width: 45, depth: 28 }, cabinCompatible: false, personalItemCompatible: false, checkedBaggage: true },
  },
  {
    label: 'Maleta grande',
    description: '105 L · bodega',
    data: { name: 'Maleta grande facturada', type: 'large_suitcase', color: '#ec4899', capacityLiters: 105, emptyWeight: 4.6, maxWeight: 23, dimensions: { height: 78, width: 52, depth: 31 }, cabinCompatible: false, personalItemCompatible: false, checkedBaggage: true },
  },
]

export const CATEGORY_META: Record<PackingCategory, { label: string; color: string; icon: typeof Package }> = {
  documents: { label: 'Documentación', color: 'bg-accent text-brand-foreground', icon: FileText },
  money: { label: 'Dinero y pagos', color: 'bg-accent text-brand-foreground', icon: CircleDollarSign },
  tops: { label: 'Ropa superior', color: 'bg-accent text-brand-foreground', icon: Shirt },
  bottoms: { label: 'Ropa inferior', color: 'bg-accent text-brand-foreground', icon: Shirt },
  underwear: { label: 'Ropa interior', color: 'bg-accent text-brand-foreground', icon: Shirt },
  outerwear: { label: 'Abrigo', color: 'bg-accent text-brand-foreground', icon: Umbrella },
  footwear: { label: 'Calzado', color: 'bg-accent text-brand-foreground', icon: Footprints },
  hygiene: { label: 'Higiene', color: 'bg-accent text-brand-foreground', icon: Sparkles },
  health: { label: 'Salud', color: 'bg-accent text-brand-foreground', icon: HeartPulse },
  technology: { label: 'Tecnología', color: 'bg-accent text-brand-foreground', icon: Laptop },
  photography: { label: 'Fotografía', color: 'bg-accent text-brand-foreground', icon: Camera },
  work: { label: 'Trabajo', color: 'bg-accent text-brand-foreground', icon: BriefcaseBusiness },
  sport: { label: 'Deporte', color: 'bg-accent text-brand-foreground', icon: Dumbbell },
  beach: { label: 'Playa', color: 'bg-accent text-brand-foreground', icon: Sun },
  accessories: { label: 'Accesorios', color: 'bg-accent text-brand-foreground', icon: WalletCards },
  food: { label: 'Comida', color: 'bg-accent text-brand-foreground', icon: Utensils },
  safety: { label: 'Seguridad', color: 'bg-accent text-brand-foreground', icon: HeartPulse },
  entertainment: { label: 'Entretenimiento', color: 'bg-accent text-brand-foreground', icon: Sparkles },
  shared: { label: 'Compartidos', color: 'bg-accent text-brand-foreground', icon: Package },
  shopping: { label: 'Compras', color: 'bg-accent text-brand-foreground', icon: ShoppingBag },
  other: { label: 'Otros', color: 'bg-accent text-brand-foreground', icon: Package },
}

export function luggageIcon(type: LuggageType) {
  return ['personal_backpack', 'travel_backpack'].includes(type) ? Backpack : type === 'personal_bag' || type === 'duffel' ? ShoppingBag : Luggage
}
