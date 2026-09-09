export interface FormTemplate {
  id: string;
  tenantId: string;
  workTypeId: string;
  name: string;
  description?: string | null;
  version: number;
  active: boolean;
}

export interface FormSection {
  id: string;
  tenantId: string;
  formTemplateId: string;
  title: string;
  description?: string | null;
  order: number;
}

export type FormItemType = 'CONCEPT' | 'TASK';

export interface FormItem {
  id: string;
  tenantId: string;
  sectionId: string;
  type: FormItemType;
  order: number;
  title?: string | null;
  description?: string | null;
  conceptId?: string | null;
  required: boolean;
}

export type FormTemplateInput = Pick<
  FormTemplate,
  'name' | 'description' | 'active'
>;

export type FormSectionInput = Pick<FormSection, 'title' | 'description'>;

export type FormItemInput = Pick<
  FormItem,
  'type' | 'title' | 'description' | 'conceptId' | 'required'
>;
