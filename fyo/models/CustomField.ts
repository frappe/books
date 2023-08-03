import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import type {
  FormulaMap,
  HiddenMap,
  ListsMap,
  RequiredMap,
  ValidationMap,
} from 'fyo/model/types';
import { ValueError } from 'fyo/utils/errors';
import { camelCase } from 'lodash';
import { ModelNameEnum } from 'models/types';
import type { FieldType } from 'schemas/types';
import { FieldTypeEnum } from 'schemas/types';
import type { CustomForm } from './CustomForm';

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

  formulas: FormulaMap = {
    fieldname: {
      formula: () => {
        if (!this.label?.length) {
          return;
        }

        return camelCase(this.label);
      },
      dependsOn: ['label'],
    },
  };

  hidden: HiddenMap = {
    options: () =>
      this.fieldtype !== 'Select' &&
      this.fieldtype !== 'AutoComplete' &&
      this.fieldtype !== 'Color',
    target: () => this.fieldtype !== 'Link' && this.fieldtype !== 'Table',
    references: () => this.fieldtype !== 'DynamicLink',
  };

  validations: ValidationMap = {
    label: (value) => {
      if (typeof value !== 'string') {
        return;
      }

      const fieldname = camelCase(value);
      (this.validations.fieldname as (value: DocValue) => void)(fieldname);
    },
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

      const referenceType: string[] = [
        FieldTypeEnum.AutoComplete,
        FieldTypeEnum.Data,
        FieldTypeEnum.Text,
        FieldTypeEnum.Select,
      ];

      const customFields =
        doc.parentdoc?.customFields
          ?.filter(
            (cf) =>
              cf.fieldname &&
              cf.label &&
              referenceType.includes(cf.fieldtype ?? '')
          )
          ?.map((cf) => ({ value: cf.fieldname!, label: cf.label! })) ?? [];

      const schemaFields =
        doc.parentSchema?.fields
          .filter(
            (f) => f.fieldname && f.label && referenceType.includes(f.fieldtype)
          )
          .map((f) => ({ value: f.fieldname, label: f.label })) ?? [];

      return [customFields, schemaFields].flat();
    },
  };

  required: RequiredMap = {
    options: () =>
      this.fieldtype === 'Select' || this.fieldtype === 'AutoComplete',
    target: () => this.fieldtype === 'Link' || this.fieldtype === 'Table',
    references: () => this.fieldtype === 'DynamicLink',
  };
}
