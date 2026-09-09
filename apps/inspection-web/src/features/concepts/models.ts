export type ConceptType = 'ANALOG' | 'DIGITAL' | 'TEXT' | 'HIDDEN';

export interface Concept {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string | null;
  type: ConceptType;
  unit?: string | null;
  active: boolean;
}

export interface ConceptOption {
  id: string;
  tenantId: string;
  conceptId: string;
  value: string;
  label: string;
  order: number;
  active: boolean;
}

export interface AssetTypeConcept {
  id: string;
  tenantId: string;
  assetTypeId: string;
  conceptId: string;
  order?: number;
  active: boolean;
}

export type ConceptOptionInput = Pick<
  ConceptOption,
  'value' | 'label' | 'order' | 'active'
>;

export type ConceptFormValue = Pick<
  Concept,
  'code' | 'name' | 'description' | 'type' | 'unit' | 'active'
> & {
  options: ConceptOptionInput[];
};

export type AvailableConcept = Concept & {
  options: ConceptOption[];
  relationOrder?: number;
};
