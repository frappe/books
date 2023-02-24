<template>
  <div>
    <PageHeader :title="t`Template Builder`">
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
      class="w-full overflowauto bg-gray-25 grid"
      style="
        grid-template-columns: auto var(--w-quick-edit);
        height: calc(100vh - var(--h-row-largest) - 1px);
      "
      v-if="doc"
    >
      <!-- Template Display Area -->
      <div class="overflow-auto custom-scroll p-4">
        <!-- Display Hints -->
        <div v-if="helperText" class="text-sm text-gray-700">
          {{ helperText }}
        </div>

        <!-- Template Container -->
        <ScaledContainer
          v-if="doc.template && values"
          :scale="Math.max(scale, 0.1)"
          ref="scaledContainer"
          class="mx-auto shadow-lg border"
        >
          <!-- Template -->
          <component
            class="flex-1 bg-white"
            :doc="values.doc"
            :print="values.print"
            :is="{ template: doc.template, props: ['doc', 'print'] }"
          />
        </ScaledContainer>
      </div>

      <!-- Template Builder Controls -->
      <div
        class="
          h-full
          w-full
          ml-auto
          border-l
          flex flex-col
          bg-white
          overflow-auto
          custom-scroll
        "
      >
        <!-- Print Template Fields -->
        <div class="p-4 flex flex-col gap-4 sticky top-0 bg-white border-b">
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

        <!-- Controls Section -->
        <div class="p-4">
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
              v-if="displayDoc && doc.template"
              size="small"
              :step="0.01"
              :df="{
                fieldtype: 'Float',
                label: t`Display Scale`,
                fieldname: 'displayScale',
                maxvalue: 10,
                minvalue: 0.1,
              }"
              :show-label="true"
              :border="true"
              :value="scale"
              @change="(value: number) => scale = value"
            />
          </div>
        </div>

        <!-- Template Section -->
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

          <!-- Template Editor -->
          <div class="mt-4 relative">
            <textarea
              v-if="!templateCollapsed"
              style="
                font-family: monospace;
                white-space: pre;
                overflow-wrap: normal;
              "
              :value="doc.template ?? ''"
              :spellcheck="false"
              rows="10"
              class="
                overflow-auto
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
            <button
              class="bg-gray-200 p-0.5 rounded absolute bottom-4 left-2"
              @click="showEditor = true"
            >
              <feather-icon name="maximize" class="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Modal -->
    <Modal
      v-if="doc"
      @closemodal="() => (showEditor = false)"
      :open-modal="showEditor"
    >
      <div class="flex">
        <!-- Hint Section Header -->
        <div class="border-r" v-if="hint">
          <h2 class="text-base font-semibold p-4 border-b">
            {{ t`Value Keys` }}
          </h2>
          <div
            class="overflow-auto custom-scroll p-4"
            style="max-height: 80vh; width: 25vw"
          >
            <TemplateBuilderHint :hint="hint" />
          </div>
        </div>

        <!-- Template Editor Section -->
        <div>
          <h2 class="text-base font-semibold p-4 border-b">
            {{ t`Template` }}
          </h2>
          <div
            class="overflow-auto custom-scroll p-4"
            style="max-height: 80vh; max-width: 65vw"
          >
            <textarea
              v-if="!templateCollapsed"
              style="
                font-family: monospace;
                white-space: pre;
                overflow-wrap: normal;
                resize: both;
              "
              :value="doc.template ?? ''"
              :spellcheck="false"
              cols="74"
              rows="31"
              class="
                overflow-auto
                p-2
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
            ></textarea>
          </div>
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
import ScaledContainer from './ScaledContainer.vue';
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
    ScaledContainer,
  },
  provide() {
    return { doc: computed(() => this.doc) };
  },
  data() {
    return {
      doc: null,
      showEditor: false,
      hint: null,
      values: null,
      templateCollapsed: false,
      helpersCollapsed: true,
      displayDoc: null,
      scale: 0.65,
    } as {
      hint: null | Record<string, unknown>;
      values: null | Record<string, unknown>;
      doc: PrintTemplate | null;
      showEditor: boolean;
      displayDoc: PrintTemplate | null;
      templateCollapsed: boolean;
      helpersCollapsed: boolean;
      scale: number;
    };
  },
  async mounted() {
    await this.setDoc();

    if (!this.doc?.template) {
      this.helpersCollapsed = false;
    }

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.tb = this;
    }

    await this.setInitialDoc();
  },
  methods: {
    async makePDF() {
      const displayDoc = this.displayDoc;
      if (!displayDoc) {
        return;
      }

      // @ts-ignore
      const innerHTML = this.$refs.scaledContainer.$el.children[0].innerHTML;
      if (!innerHTML) {
        return;
      }

      await getPathAndMakePDF(displayDoc.name!, innerHTML);
    },
    async setInitialDoc() {
      const schemaName = this.doc?.type;
      if (!schemaName || this.displayDoc?.schemaName === schemaName) {
        return;
      }

      const names = (await this.fyo.db.getAll(schemaName, {
        limit: 1,
        order: 'desc',
        orderBy: 'created',
        filters: { cancelled: false },
      })) as { name: string }[];

      const name = names[0]?.name;
      if (!name) {
        return;
      }

      await this.setDisplayDoc(name);
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
