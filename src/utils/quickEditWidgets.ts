import { Doc } from 'fyo/model/doc';
import { ModelNameEnum } from 'models/types';
import PartyWidget from 'src/components/Widgets/PartyWidget.vue';
import { h } from 'vue';

export function getQuickEditWidget(schemaName: string) {
  if (schemaName === ModelNameEnum.Party) {
    return (doc: Doc) => ({
      render() {
        return h(PartyWidget, {
          doc,
        });
      },
    });
  }

  return null;
}
