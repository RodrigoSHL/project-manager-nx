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
  documents: { label: 'Documentación', color: 'bg-rose-50 text-rose-700', icon: FileText },
  money: { label: 'Dinero y pagos', color: 'bg-emerald-50 text-emerald-700', icon: CircleDollarSign },
  tops: { label: 'Ropa superior', color: 'bg-sky-50 text-sky-700', icon: Shirt },
  bottoms: { label: 'Ropa inferior', color: 'bg-indigo-50 text-indigo-700', icon: Shirt },
  underwear: { label: 'Ropa interior', color: 'bg-violet-50 text-violet-700', icon: Shirt },
  outerwear: { label: 'Abrigo', color: 'bg-blue-50 text-blue-700', icon: Umbrella },
  footwear: { label: 'Calzado', color: 'bg-amber-50 text-amber-700', icon: Footprints },
  hygiene: { label: 'Higiene', color: 'bg-cyan-50 text-cyan-700', icon: Sparkles },
  health: { label: 'Salud', color: 'bg-red-50 text-red-700', icon: HeartPulse },
  technology: { label: 'Tecnología', color: 'bg-slate-100 text-slate-700', icon: Laptop },
  photography: { label: 'Fotografía', color: 'bg-fuchsia-50 text-fuchsia-700', icon: Camera },
  work: { label: 'Trabajo', color: 'bg-stone-100 text-stone-700', icon: BriefcaseBusiness },
  sport: { label: 'Deporte', color: 'bg-lime-50 text-lime-700', icon: Dumbbell },
  beach: { label: 'Playa', color: 'bg-yellow-50 text-yellow-700', icon: Sun },
  accessories: { label: 'Accesorios', color: 'bg-purple-50 text-purple-700', icon: WalletCards },
  food: { label: 'Comida', color: 'bg-orange-50 text-orange-700', icon: Utensils },
  safety: { label: 'Seguridad', color: 'bg-red-50 text-red-700', icon: HeartPulse },
  entertainment: { label: 'Entretenimiento', color: 'bg-pink-50 text-pink-700', icon: Sparkles },
  shared: { label: 'Compartidos', color: 'bg-teal-50 text-teal-700', icon: Package },
  shopping: { label: 'Compras', color: 'bg-pink-50 text-pink-700', icon: ShoppingBag },
  other: { label: 'Otros', color: 'bg-gray-100 text-gray-700', icon: Package },
}

export function luggageIcon(type: LuggageType) {
  return ['personal_backpack', 'travel_backpack'].includes(type) ? Backpack : type === 'personal_bag' || type === 'duffel' ? ShoppingBag : Luggage
}
