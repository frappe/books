<template>
  <div>
    <PageHeader :title="t`Customize Form`">
      <DropdownWithActions :actions="[]" :disabled="false" :title="t`More`" />
      <Button :title="t`Save Customizations`" type="primary">
        {{ t`Save` }}
      </Button>
    </PageHeader>
    <div class="flex text-base w-full flex-col">
      <!-- Select Entry Type -->
      <div
        class="
          h-row-largest
          flex flex-row
          justify-start
          items-center
          w-full
          gap-2
          border-b
          dark:border-gray-800
          p-4
        "
      >
        <AutoComplete
          :df="{
            fieldname: 'formType',
            label: t`Form Type`,
            fieldtype: 'AutoComplete',
            options: customizableSchemas,
          }"
          input-class="bg-transparent text-gray-900 dark:text-gray-100 text-base"
          class="w-40"
          :border="true"
          :value="formType"
          size="small"
          @change="setEntryType"
        />

        <p v-if="errorMessage" class="text-base ms-2 text-red-500">
          {{ errorMessage }}
        </p>
        <p
          v-else-if="helpMessage"
          class="text-base ms-2 text-gray-700 dark:text-gray-300"
        >
          {{ helpMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import { ModelNameEnum } from 'models/types';

export default defineComponent({
  components: { PageHeader, Button, DropdownWithActions, AutoComplete },
  data() {
    return { errorMessage: '', formType: '' };
  },
  computed: {
    customizableSchemas() {
      const schemaNames = Object.keys(this.fyo.schemaMap).filter(
        (schemaName) => {
          const schema = this.fyo.schemaMap[schemaName];
          if (!schema) {
            return false;
          }

          if (schema?.isSingle) {
            return false;
          }

          return ![
            ModelNameEnum.NumberSeries,
            ModelNameEnum.SingleValue,
            ModelNameEnum.SetupWizard,
            ModelNameEnum.PatchRun,
          ].includes(schemaName as ModelNameEnum);
        }
      );
      return schemaNames.map((sn) => ({
        value: sn,
        label: this.fyo.schemaMap[sn]?.label ?? sn,
      }));
    },
    helpMessage() {
      if (!this.formType) {
        return this.t`Select a form type to customize`;
      }
      return '';
    },
  },
  methods: {
    setEntryType(type: string) {
      this.formType = type;
    },
  },
});
</script>
