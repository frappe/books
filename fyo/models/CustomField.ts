import { Doc } from 'fyo/model/doc';
import type {
  FormulaMap,
  HiddenMap,
  ListsMap,
  ValidationMap,
} from 'fyo/model/types';
import type { FieldType, SelectOption } from 'schemas/types';
import type { CustomForm } from './CustomForm';
import { ValueError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';

export class CustomField extends Doc {
  parentdoc?: CustomForm;

  label?: string;
  fieldname?: string;
  fieldtype?: FieldType;
  isRequired?: boolean;
  section?: string;
  tab?: string;
  options?: string;
  target?: string;
  references?: string;

  get parentSchema() {
    return this.parentdoc?.parentSchema ?? null;
  }

  get parentFields() {
    return this.parentdoc?.parentFields;
  }

  hidden: HiddenMap = {
    options: () =>
      this.fieldtype !== 'Select' &&
      this.fieldtype !== 'AutoComplete' &&
      this.fieldtype !== 'Color',
    target: () => this.fieldtype !== 'Link' && this.fieldtype !== 'Table',
    references: () => this.fieldtype !== 'DynamicLink',
  };

  formulas: FormulaMap = {};

  validations: ValidationMap = {
    fieldname: (value) => {
      if (typeof value !== 'string') {
        return;
      }

      const field = this.parentFields?.[value];
      if (field && !field.isCustom) {
        throw new ValueError(
          this.fyo.t`Fieldname ${value} already exists for ${this.parentdoc!
            .name!}`
        );
      }

      const cf = this.parentdoc?.customFields?.find(
        (cf) => cf.fieldname === value
      );
      if (cf) {
        throw new ValueError(
          this.fyo.t`Fieldname ${value} already used for Custom Field ${
            (cf.idx ?? 0) + 1
          }`
        );
      }
    },
  };

  static lists: ListsMap = {
    target: (doc) => {
      const schemaMap = doc?.fyo.schemaMap ?? {};
      return Object.values(schemaMap)
        .filter(
          (s) =>
            !s?.isSingle &&
            ![
              ModelNameEnum.PatchRun,
              ModelNameEnum.SingleValue,
              ModelNameEnum.CustomField,
              ModelNameEnum.CustomForm,
              ModelNameEnum.SetupWizard,
            ].includes(s?.name as ModelNameEnum)
        )
        .map((s) => ({
          label: s?.label ?? '',
          value: s?.name ?? '',
        }));
    },
    references: (doc) => {
      if (!(doc instanceof CustomField)) {
        return [];
      }

      return (doc.parentdoc?.customFields
        ?.map((cf) => ({ value: cf.fieldname, label: cf.label }))
        .filter((cf) => cf.label && cf.value) ?? []) as SelectOption[];
    },
  };
}
