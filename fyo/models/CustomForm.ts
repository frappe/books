import { Doc } from 'fyo/model/doc';
import { HiddenMap, ListsMap } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import type { CustomField } from './CustomField';
import { getMapFromList } from 'utils/index';
import { Field } from 'schemas/types';

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
}
