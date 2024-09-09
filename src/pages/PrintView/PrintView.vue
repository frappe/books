<template>
  <div class="flex flex-col flex-1 bg-gray-25 dark:bg-gray-875">
    <PageHeader :border="true" :title="t`Print View`">
      <AutoComplete
        v-if="templateList.length"
        :df="{
          fieldtype: 'AutoComplete',
          fieldname: 'templateName',
          label: t`Template Name`,
          options: templateList.map((n) => ({ label: n, value: n })),
        }"
        input-class="text-base py-0 h-8"
        class="w-40"
        :border="true"
        :value="templateName ?? ''"
        @change="onTemplateNameChange"
      />
      <DropdownWithActions :actions="actions" :title="t`More`" />
      <Button class="text-xs" type="primary" @click="savePDF">
        {{ t`Save as PDF` }}
      </Button>
    </PageHeader>

    <!-- Template Display Area -->
    <div class="overflow-auto custom-scroll custom-scroll-thumb1 p-4">
      <!-- Display Hints -->
      <div
        v-if="helperMessage"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        {{ helperMessage }}
      </div>

      <!-- Template Container -->
      <PrintContainer
        v-if="printProps"
        ref="printContainer"
        :print-schema-name="schemaName"
        :template="printProps.template"
        :values="printProps.values"
        :scale="scale"
        :width="templateDoc?.width"
        :height="templateDoc?.height"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import AutoComplete from 'src/components/Controls/AutoComplete.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { fyo } from 'src/initFyo';
import { getPrintTemplatePropValues } from 'src/utils/printTemplates';
import { showSidebar } from 'src/utils/refs';
import { PrintValues } from 'src/utils/types';
import { getFormRoute, openSettings, routeTo } from 'src/utils/ui';
import { defineComponent } from 'vue';
import PrintContainer from '../TemplateBuilder/PrintContainer.vue';

export default defineComponent({
  name: 'PrintView',
  components: {
    PageHeader,
    Button,
    AutoComplete,
    PrintContainer,
    DropdownWithActions,
  },
  props: {
    schemaName: { type: String, required: true },
    name: { type: String, required: true },
  },
  data() {
    return {
      doc: null,
      scale: 1,
      values: null,
      templateDoc: null,
      templateName: null,
      templateList: [],
    } as {
      doc: null | Doc;
      scale: number;
      values: null | PrintValues;
      templateDoc: null | PrintTemplate;
      templateName: null | string;
      templateList: string[];
    };
  },
  computed: {
    helperMessage() {
      if (!this.templateList.length) {
        const label =
          this.fyo.schemaMap[this.schemaName]?.label ?? this.schemaName;

        return this.t`No Print Templates not found for entry type ${label}`;
      }

      if (!this.templateDoc) {
        return this.t`Please select a Print Template`;
      }

      return '';
    },
    printProps(): null | { template: string; values: PrintValues } {
      const values = this.values;
      if (!values) {
        return null;
      }

      const template = this.templateDoc?.template;
      if (!template) {
        return null;
      }

      return { values, template };
    },
    actions(): Action[] {
      const actions = [
        {
          label: this.t`Print Settings`,
          group: this.t`View`,
          async action() {
            await openSettings(ModelNameEnum.PrintSettings);
          },
        },
        {
          label: this.t`New Template`,
          group: this.t`Create`,
          action: async () => {
            const doc = this.fyo.doc.getNewDoc(ModelNameEnum.PrintTemplate, {
              type: this.schemaName,
            });

            const route = getFormRoute(doc.schemaName, doc.name!);
            await routeTo(route);
          },
        },
      ];

      const templateDocName = this.templateDoc?.name;
      if (templateDocName) {
        actions.push({
          label: templateDocName,
          group: this.t`View`,
          action: async () => {
            const route = getFormRoute(
              ModelNameEnum.PrintTemplate,
              templateDocName
            );
            await routeTo(route);
          },
        });

        actions.push({
          label: this.t`Duplicate Template`,
          group: this.t`Create`,
          action: async () => {
            const doc = this.fyo.doc.getNewDoc(ModelNameEnum.PrintTemplate, {
              type: this.schemaName,
              template: this.templateDoc?.template,
            });

            const route = getFormRoute(doc.schemaName, doc.name!);
            await routeTo(route);
          },
        });
      }

      return actions;
    },
  },
  async mounted() {
    await this.initialize();
    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.pv = this;
    }
  },
  async activated() {
    await this.initialize();
  },
  unmounted() {
    this.reset();
  },
  deactivated() {
    this.reset();
  },
  methods: {
    async initialize() {
      this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
      await this.setTemplateList();
      await this.setTemplateFromDefault();
      if (!this.templateDoc && this.templateList.length) {
        await this.onTemplateNameChange(this.templateList[0]);
      }

      if (this.doc) {
        this.values = await getPrintTemplatePropValues(this.doc as Doc);
      }
    },
    setScale() {
      this.scale = 1;
      const width = (this.templateDoc?.width ?? 21) * 37.8;
      let containerWidth = window.innerWidth - 32;
      if (showSidebar.value) {
        containerWidth -= 12 * 16;
      }

      this.scale = Math.min(containerWidth / width, 1);
    },
    reset() {
      this.doc = null;
      this.values = null;
      this.templateList = [];
      this.templateDoc = null;
      this.scale = 1;
    },
    async onTemplateNameChange(value: string | null): Promise<void> {
      if (!value) {
        this.templateDoc = null;
        return;
      }

      this.templateName = value;
      try {
        this.templateDoc = (await this.fyo.doc.getDoc(
          ModelNameEnum.PrintTemplate,
          this.templateName
        )) as PrintTemplate;
      } catch (error) {
        await handleErrorWithDialog(error);
      }
      this.setScale();
    },
    async setTemplateList(): Promise<void> {
      const list = (await this.fyo.db.getAllRaw(ModelNameEnum.PrintTemplate, {
        filters: { type: this.schemaName },
      })) as { name: string }[];

      this.templateList = list.map(({ name }) => name);
    },
    async savePDF() {
      const printContainer = this.$refs.printContainer as {
        savePDF: (name?: string) => Promise<void>;
      };

      if (!printContainer?.savePDF) {
        return;
      }

      await printContainer.savePDF(this.doc?.name);
    },
    async setTemplateFromDefault() {
      const defaultName =
        this.schemaName[0].toLowerCase() +
        this.schemaName.slice(1) +
        ModelNameEnum.PrintTemplate;
      const name = this.fyo.singles.Defaults?.get(defaultName);
      if (typeof name !== 'string') {
        return;
      }

      await this.onTemplateNameChange(name);
    },
  },
});
</script>
