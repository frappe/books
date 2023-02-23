<template>
  <div>
    <PageHeader :title="t`Template Builder`"
      ><Button v-if="displayDoc" @click="showHint = true">{{
        t`Show Hint`
      }}</Button></PageHeader
    >
    <!-- Template Builder Body -->
    <div class="w-full h-full flex" v-if="doc">
      <!-- Print View Container -->
      <div>
        <!-- Display Hints -->
        <div v-if="!displayDoc" class="p-4 text-sm text-gray-700">
          <div v-if="!doc.type">{{ t`Select a Template Type` }}</div>
          <div v-else-if="!displayDoc">
            {{ t`Select a Display Doc to view the Template` }}
          </div>
        </div>
      </div>

      <!-- Template Builder Controls -->
      <div class="w-quick-edit h-full right-0 ml-auto border-l flex flex-col">
        <!-- Print Template Fields -->
        <div class="p-4 flex flex-col gap-4">
          <FormControl
            :df="fields.name"
            :border="true"
            :value="doc.get('name')"
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

          <!-- 
            TODO: 
            - Select Test Doc
            - View Template Data and Keys
           -->
          <div v-if="!helpersCollapsed" class="w-full flex flex-col gap-4">
            <FormControl
              :df="fields.type"
              :show-label="true"
              :border="true"
              :value="doc.get('type')"
              @change="async (value) => await doc?.set('type', value)"
            />

            <FormControl
              v-if="doc.type"
              :df="displayDocField"
              :show-label="true"
              :border="true"
              :value="displayDoc?.name"
              @change="(value: string) => setDisplayDoc(value)"
            />

            <FormControl
              v-if="doc.isCustom"
              :df="fields.isCustom"
              :show-label="true"
              :border="true"
              :value="doc.get('isCustom')"
            />
          </div>
        </div>

        <!-- Template -->
        <div class="p-4 border-t">
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
            style="
              font-family: monospace;
              white-space: pre;
              overflow-wrap: normal;
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
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import { Field, TargetField } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import FormHeader from 'src/components/FormHeader.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import {
  getPrintTemplatePropHints,
  getPrintTemplatePropValues,
} from 'src/utils/printTemplates';
import { getDocFromNameIfExistsElseNew } from 'src/utils/ui';
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
  },
});
</script>
