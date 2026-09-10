import type { ConceptType } from '../catalog/entities/concept.entity';
import type { FormItemType } from '../form-templates/entities/form-item.entity';

export type WorkConceptOptionSnapshot = {
  id: string;
  label: string;
  value: string;
  order: number;
};

export type WorkConceptSnapshot = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: ConceptType;
  unit?: string | null;
  options: WorkConceptOptionSnapshot[];
};

export type WorkFormItemSnapshot = {
  id: string;
  type: FormItemType;
  order: number;
  title?: string | null;
  description?: string | null;
  required: boolean;
  concept?: WorkConceptSnapshot;
};

export type WorkFormSectionSnapshot = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  items: WorkFormItemSnapshot[];
};

export type WorkTemplateSnapshot = {
  workId: string;
  tenantId: string;
  formTemplateId: string;
  formTemplateVersion: number;
  name: string;
  sections: WorkFormSectionSnapshot[];
};
