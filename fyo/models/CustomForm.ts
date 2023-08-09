import { Doc } from 'fyo/model/doc';
import { HiddenMap, ListsMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { ModelNameEnum } from 'models/types';
import { Field } from 'schemas/types';
import { getMapFromList } from 'utils/index';
import { CustomField } from './CustomField';

export class CustomForm extends Doc {
  name?: string;
  customFields?: CustomField[];

  get parentSchema() {
    return this.fyo.schemaMap[this.name ?? ''] ?? null;
  }

  get parentFields(): Record<string, Field> {
    const fields = this.parentSchema?.fields;
    if (!fields) {
      return {};
    }

    return getMapFromList(fields, 'fieldname');
  }

  static lists: ListsMap = {
    name: (doc) =>
      Object.values(doc?.fyo.schemaMap ?? {})
        .filter((s) => {
          if (!s || !s.label || !s.name) {
            return false;
          }

          if (s.isSingle) {
            return false;
          }

          return ![
            ModelNameEnum.PatchRun,
            ModelNameEnum.SingleValue,
            ModelNameEnum.CustomField,
            ModelNameEnum.CustomForm,
            ModelNameEnum.SetupWizard,
          ].includes(s.name as ModelNameEnum);
        })
        .map((s) => ({
          value: s!.name,
          label: s!.label,
        })),
  };

  hidden: HiddenMap = { customFields: () => !this.name };

  // eslint-disable-next-line @typescript-eslint/require-await
  override async validate(): Promise<void> {
    for (const row of this.customFields ?? []) {
      if (row.fieldtype === 'Select' || row.fieldtype === 'AutoComplete') {
        this.validateOptions(row);
      }
    }
  }

  validateOptions(row: CustomField) {
    const optionString = row.options ?? '';
    const options = optionString
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (options.length > 1) {
      return;
    }

    throw new ValidationError(
      `At least two options need to be set for the selected fieldtype`
    );
  }
}
