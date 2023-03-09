<template>
  <div>
    <PageHeader :title="t`Template Builder`">
      <Button v-if="displayDoc && doc?.template" @click="savePDF">
        {{ t`Save as PDF` }}
      </Button>
      <Button
        v-if="doc && displayDoc"
        :title="t`Toggle Edit Mode`"
        :icon="true"
        @click="toggleEditMode"
      >
        <feather-icon name="edit" class="w-4 h-4" />
      </Button>
      <DropdownWithActions v-if="doc?.inserted" :actions="actions" />
      <Button v-if="doc?.canSave" type="primary" @click="sync()">
        {{ t`Save` }}
      </Button>
    </PageHeader>

    <!-- Template Builder Body -->
    <div
      v-if="doc"
      class="w-full bg-gray-25 grid"
      :style="templateBuilderBodyStyles"
    >
      <!-- Template Display Area -->
      <div
        class="overflow-auto custom-scroll flex flex-col"
        style="height: calc(100vh - var(--h-row-largest) - 1px)"
      >
        <!-- Display Hints -->
        <p v-if="helperMessage" class="text-sm text-gray-700 p-4">
          {{ helperMessage }}
        </p>

        <!-- Template Container -->
        <div
          v-else-if="doc.template && values"
          class="p-4 overflow-auto custom-scroll"
        >
          <PrintContainer
            ref="printContainer"
            :template="doc.template"
            :values="values"
            :scale="scale"
          />
        </div>

        <!-- Bottom Bar -->
        <div
          class="
            w-full
            sticky
            bottom-0
            flex
            bg-white
            border-t
            mt-auto
            flex-shrink-0
          "
        >
          <!-- Entry Type -->
          <FormControl
            :title="fields.type.label"
            class="w-40 border-r flex-shrink-0"
            :df="fields.type"
            :border="false"
            :value="doc.get('type')"
            :container-styles="{ 'border-radius': '0px' }"
            @change="async (value) => await setType(value)"
          />

          <!-- Display Doc -->
          <FormControl
            v-if="doc.type"
            :title="displayDocField.label"
            class="w-40 border-r flex-shrink-0"
            :df="displayDocField"
            :border="false"
            :value="displayDoc?.name"
            :container-styles="{ 'border-radius': '0px' }"
            @change="(value: string) => setDisplayDoc(value)"
          />

          <!-- Display Scale -->
          <div
            class="flex ml-auto gap-2 px-2 w-36 justify-between flex-shrink-0"
          >
            <p class="text-sm text-gray-600 my-auto">{{ t`Display Scale` }}</p>
            <input
              type="number"
              class="
                my-auto
                w-10
                text-base text-end
                bg-transparent
                text-gray-800
                focus:text-gray-900
              "
              :value="scale"
              @change="setScale"
              @input="setScale"
              min="0.1"
              max="10"
              step="0.05"
            />
          </div>
        </div>
      </div>

      <!-- Input Panel Resizer -->
      <HorizontalResizer
        class="z-20"
        :initial-x="panelWidth"
        :min-x="22 * 16"
        :max-x="maxWidth"
        @resize="(x: number) => panelWidth = x"
      />

      <!-- Template Panel -->
      <div
        class="border-l bg-white flex flex-col"
        style="height: calc(100vh - var(--h-row-largest) - 1px)"
      >
        <!-- Template Name -->
        <FormControl
          class="w-full border-b flex-shrink-0"
          size="small"
          :input-class="['font-semibold text-xl text-center']"
          :container-styles="{ 'border-radius': '0px', padding: '0.5rem' }"
          :df="fields.name"
          :border="false"
          :value="doc.get('name')"
          :read-only="doc.inserted"
          @change="async (value) => await doc?.set('name', value)"
        />

        <!-- Template Editor -->
        <div class="min-h-0">
          <TemplateEditor
            class="overflow-auto custom-scroll h-full"
            v-if="typeof doc.template === 'string'"
            v-model.lazy="doc.template"
            :disabled="!doc.isCustom"
            :hints="hints ?? undefined"
          />
        </div>

        <!-- Value Key Hints Container -->
        <div class="border-t mt-auto flex-shrink-0" v-if="hints">
          <!-- Value Key Toggle -->
          <div
            class="
              flex
              justify-between
              items-center
              cursor-pointer
              select-none
              p-2
            "
            @click="showHints = !showHints"
          >
            <h2 class="text-base text-gray-900 font-semibold">
              {{ t`Value Keys` }}
            </h2>
            <feather-icon
              :name="showHints ? 'chevron-up' : 'chevron-down'"
              class="w-4 h-4 text-gray-600 resize-none"
            />
          </div>

          <!-- Value Key Hints -->
          <div
            v-if="showHints"
            class="overflow-auto custom-scroll p-2 border-t"
            style="max-height: 30vh"
          >
            <TemplateBuilderHint :hints="hints" />
          </div>
        </div>
      </div>
    </div>
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
import HorizontalResizer from 'src/components/HorizontalResizer.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import {
  baseTemplate,
  getPrintTemplatePropHints,
  getPrintTemplatePropValues,
} from 'src/utils/printTemplates';
import { showSidebar } from 'src/utils/refs';
import { PrintValues } from 'src/utils/types';
import {
  getActionsForDoc,
  getDocFromNameIfExistsElseNew,
  openSettings,
  showToast,
} from 'src/utils/ui';
import { getMapFromList } from 'utils/index';
import { computed, defineComponent } from 'vue';
import PrintContainer from './PrintContainer.vue';
import TemplateBuilderHint from './TemplateBuilderHint.vue';
import TemplateEditor from './TemplateEditor.vue';

export default defineComponent({
  props: { name: String },
  components: {
    PageHeader,
    Button,
    DropdownWithActions,
    PrintContainer,
    HorizontalResizer,
    TemplateEditor,
    FormControl,
    TemplateBuilderHint,
  },
  provide() {
    return { doc: computed(() => this.doc) };
  },
  data() {
    return {
      doc: null,
      editMode: false,
      showHints: false,
      wasSidebarShown: true,
      showEditor: false,
      hints: undefined,
      values: null,
      helpersCollapsed: true,
      displayDoc: null,
      scale: 0.65,
      panelWidth: 22 /** rem */ * 16 /** px */,
    } as {
      editMode: boolean;
      showHints: boolean;
      wasSidebarShown: boolean;
      hints?: Record<string, unknown>;
      values: null | PrintValues;
      doc: PrintTemplate | null;
      showEditor: boolean;
      displayDoc: PrintTemplate | null;
      scale: number;
      panelWidth: number;
    };
  },
  async mounted() {
    await this.setDoc();

    if (this.doc?.template == null) {
      await this.doc?.set('template', baseTemplate);
    }

    await this.setDisplayInitialDoc();

    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.tb = this;
    }

    this.wasSidebarShown = showSidebar.value;
  },
  methods: {
    setScale({ target }: Event) {
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const scale = Number(target.value);
      this.scale = Math.max(Math.min(scale, 10), 0.15);
    },
    toggleEditMode() {
      this.editMode = !this.editMode;

      if (this.editMode) {
        showSidebar.value = false;
      } else {
        showSidebar.value = this.wasSidebarShown;
      }

      let message = this.t`Edit Mode Enabled`;
      if (!this.editMode) {
        message = this.t`Edit Mode Disabled`;
      }

      showToast({ type: 'info', message, duration: 1000 });
    },
    async savePDF() {
      const printContainer = this.$refs.printContainer as {
        savePDF: (name?: string) => void;
      };

      if (!printContainer?.savePDF) {
        return;
      }

      printContainer.savePDF(this.displayDoc?.name);
    },
    async setDisplayInitialDoc() {
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
      } catch (error) {
        await handleErrorWithDialog(error, doc as Doc);
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
    async setType(value: unknown) {
      if (typeof value !== 'string') {
        return;
      }

      await this.doc?.set('type', value);
      await this.setDisplayInitialDoc();
    },
    async setDisplayDoc(value: string) {
      if (!value) {
        delete this.hints;
        this.values = null;
        this.displayDoc = null;
        return;
      }

      const schemaName = this.doc?.type;
      if (!schemaName) {
        return;
      }

      const displayDoc = await getDocFromNameIfExistsElseNew(schemaName, value);
      this.hints = getPrintTemplatePropHints(displayDoc);
      this.values = await getPrintTemplatePropValues(displayDoc);
      this.displayDoc = displayDoc;
    },
  },
  computed: {
    maxWidth() {
      return window.innerWidth - 12 * 16 - 100;
    },
    actions() {
      if (!this.doc) {
        return [];
      }

      const actions = getActionsForDoc(this.doc as Doc);
      actions.push({
        label: this.t`Print Settings`,
        group: this.t`View`,
        async action() {
          await openSettings(ModelNameEnum.PrintSettings);
        },
      });

      return actions;
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
    helperMessage() {
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
    templateBuilderBodyStyles(): Record<string, string> {
      const styles: Record<string, string> = {};

      styles['grid-template-columns'] = `auto 0px ${this.panelWidth}px`;
      styles['height'] = 'calc(100vh - var(--h-row-largest) - 1px)';

      return styles;
    },
  },
});
</script>
