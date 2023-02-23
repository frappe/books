<template>
  <div>
    <PageHeader :title="t`Template Builder`">
      <Button v-if="displayDoc" @click="showHint = true">{{
        t`Show Hint`
      }}</Button>
      <Button v-if="displayDoc && doc?.template" @click="makePDF">
        {{ t`Save as PDF` }}
      </Button>
      <DropdownWithActions v-if="doc?.inserted" :actions="actions" />
      <Button v-if="doc?.canSave" type="primary" @click="sync()">
        {{ t`Save` }}
      </Button>
    </PageHeader>
    <!-- Template Builder Body -->
    <div
      class="w-full h-full bg-gray-25 grid"
      style="grid-template-columns: auto var(--w-quick-edit)"
      v-if="doc"
    >
      <!-- Print View Container -->
      <div class="overflow-auto custom-scroll">
        <!-- Display Hints -->
        <div v-if="helperText" class="p-4 text-sm text-gray-700">
          {{ helperText }}
        </div>

        <div
          v-if="doc.template && values && !helperText"
          ref="printContainer"
          class="h-full shadow-lg border bg-white"
          style="
            width: 21cm;
            height: 29.7cm;
            transform: scale(0.65);
            margin-top: -150px;
            margin-left: -100px;
          "
        >
          <component
            class="flex-1"
            :doc="values.doc"
            :print="values.print"
            :is="{ template: doc.template, props: ['doc', 'print'] }"
          />
        </div>
      </div>

      <!-- Template Builder Controls -->
      <div class="h-full w-full ml-auto border-l flex flex-col bg-white">
        <!-- Print Template Fields -->
        <div class="p-4 flex flex-col gap-4">
          <FormControl
            class="w-full mx-auto"
            size="small"
            :input-class="['font-semibold text-xl', 'text-center']"
            :df="fields.name"
            :border="!doc.inserted"
            :value="doc.get('name')"
            :read-only="doc.inserted"
            @change="async (value) => await doc?.set('name', value)"
          />
        </div>

        <!-- Controls -->
        <div class="p-4 border-t">
          <div
            class="flex justify-between items-center cursor-pointer select-none"
            :class="helpersCollapsed ? '' : 'mb-4'"
            @click="helpersCollapsed = !helpersCollapsed"
          >
            <h2 class="text-base text-gray-900 font-semibold">
              {{ t`Controls` }}
            </h2>
            <feather-icon
              :name="helpersCollapsed ? 'chevron-up' : 'chevron-down'"
              class="w-4 h-4 text-gray-600 resize-none"
            />
          </div>

          <div v-if="!helpersCollapsed" class="w-full flex flex-col gap-4">
            <FormControl
              size="small"
              :df="fields.type"
              :show-label="true"
              :border="true"
              :value="doc.get('type')"
              @change="async (value) => await doc?.set('type', value)"
            />

            <FormControl
              v-if="doc.type"
              size="small"
              :df="displayDocField"
              :show-label="true"
              :border="true"
              :value="displayDoc?.name"
              @change="(value: string) => setDisplayDoc(value)"
            />

            <FormControl
              v-if="doc.isCustom"
              size="small"
              :df="fields.isCustom"
              :show-label="true"
              :border="true"
              :read-only="true"
              :value="doc.get('isCustom')"
            />
          </div>
        </div>

        <!-- Template -->
        <div class="p-4 border-t" v-if="doc.type">
          <div
            class="flex justify-between items-center cursor-pointer select-none"
            @click="templateCollapsed = !templateCollapsed"
          >
            <h2 class="text-base text-gray-900 font-semibold">
              {{ t`Template` }}
            </h2>
            <feather-icon
              :name="templateCollapsed ? 'chevron-up' : 'chevron-down'"
              class="w-4 h-4 text-gray-600"
            />
          </div>

          <!-- Template Container -->
          <textarea
            v-if="!templateCollapsed"
            style="
              font-family: monospace;
              white-space: pre;
              overflow-wrap: normal;
            "
            :value="doc.template ?? ''"
            :spellcheck="false"
            rows="20"
            class="
              overflow-auto
              mt-4
              p-2
              w-full
              border
              rounded
              text-sm text-gray-900
              focus-within:bg-gray-100
              outline-none
              bg-gray-50
            "
            @change="
              async (e: Event) => await doc?.set('template', (e.target as HTMLTextAreaElement).value)
            "
          />
        </div>
      </div>
    </div>

    <!-- Hint Modal -->
    <Modal
      @closemodal="() => (showHint = false)"
      :open-modal="showHint"
      v-if="displayDoc && hint"
    >
      <div class="w-form">
        <!-- Hint Modal Header -->
        <FormHeader
          :form-title="t`Hint`"
          :form-sub-title="displayDoc.schema.label"
        />
        <hr />
        <div class="p-4 max-h-96 overflow-auto custom-scroll">
          <TemplateBuilderHint :hint="hint" />
        </div>
      </div>
    </Modal>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import { Field, TargetField } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import FormHeader from 'src/components/FormHeader.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { makePDF } from 'src/utils/ipcCalls';
import {
  getPathAndMakePDF,
  getPrintTemplatePropHints,
  getPrintTemplatePropValues,
} from 'src/utils/printTemplates';
import { getActionsForDoc, getDocFromNameIfExistsElseNew } from 'src/utils/ui';
import { getMapFromList } from 'utils/index';
import { computed, defineComponent } from 'vue';
import TemplateBuilderHint from './TemplateBuilderHint.vue';

export default defineComponent({
  props: { name: String },
  components: {
    PageHeader,
    FormControl,
    Button,
    Modal,
    FormHeader,
    TemplateBuilderHint,
    DropdownWithActions,
  },
  provide() {
    return { doc: computed(() => this.doc) };
  },
  data() {
    return {
      doc: null,
      showHint: false,
      hint: null,
      values: null,
      templateCollapsed: false,
      helpersCollapsed: true,
      displayDoc: null,
    } as {
      hint: null | Record<string, unknown>;
      values: null | Record<string, unknown>;
      doc: PrintTemplate | null;
      showHint: boolean;
      displayDoc: PrintTemplate | null;
      templateCollapsed: boolean;
      helpersCollapsed: boolean;
    };
  },
  async mounted() {
    await this.setDoc();

    if (!this.doc?.template) {
      this.helpersCollapsed = false;
    }

    if (!this.fyo.store.isDevelopment) {
      return;
    }

    // @ts-ignore
    window.tb = this;

    // @ts-ignore
    window.hints = getPrintTemplatePropHints;

    // @ts-ignore
    window.values = getPrintTemplatePropValues;

    this.setDisplayDoc('SINV-1001');
  },
  methods: {
    async makePDF() {
      const displayDoc = this.displayDoc;
      if (!displayDoc) {
        return;
      }

      const innerHTML = (this.$refs.printContainer as HTMLDivElement).innerHTML;
      await getPathAndMakePDF(displayDoc.name!, innerHTML);
    },
    async sync() {
      const doc = this.doc;
      if (!doc) {
        return;
      }

      try {
        await doc.sync();
      } catch (err) {
        if (!(err instanceof Error)) {
          return;
        }

        await handleErrorWithDialog(err, doc as Doc);
      }
    },
    async setDoc() {
      if (this.doc) {
        return;
      }

      this.doc = (await getDocFromNameIfExistsElseNew(
        ModelNameEnum.PrintTemplate,
        this.name
      )) as PrintTemplate;
    },
    async setDisplayDoc(value: string) {
      if (!value) {
        this.hint = null;
        this.values = null;
        this.displayDoc = null;
        return;
      }

      const schemaName = this.doc?.type;
      if (!schemaName) {
        return;
      }
      const displayDoc = await getDocFromNameIfExistsElseNew(schemaName, value);
      this.hint = getPrintTemplatePropHints(displayDoc);
      this.values = await getPrintTemplatePropValues(displayDoc);
      this.displayDoc = displayDoc;
    },
  },
  computed: {
    actions() {
      if (!this.doc) {
        return [];
      }

      return getActionsForDoc(this.doc as Doc);
    },
    fields(): Record<string, Field> {
      return getMapFromList(
        this.fyo.schemaMap.PrintTemplate?.fields ?? [],
        'fieldname'
      );
    },
    displayDocField(): TargetField {
      const target = this.doc?.type ?? ModelNameEnum.SalesInvoice;
      return {
        fieldname: 'displayDoc',
        label: this.t`Display Doc`,
        fieldtype: 'Link',
        target,
      };
    },
    helperText() {
      if (!this.doc) {
        return '';
      }

      if (!this.doc.type) {
        return this.t`Select a Template type`;
      }

      if (!this.displayDoc) {
        return this.t`Select a Display Doc to view the Template`;
      }

      if (!this.doc.template) {
        return this.t`Set a Template value to see the Print Template`;
      }

      return '';
    },
  },
});
</script>
