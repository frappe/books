<template>
  <div class="flex flex-col w-full">
    <div>
      <PageHeader :title="doc && doc.inserted ? doc.name : ''">
        <!-- Template Name -->
        <template v-if="doc && !doc.inserted" #left>
          <FormControl
            ref="nameField"
            class="flex-shrink-0 w-60"
            size="small"
            :input-class="['font-semibold text-xl']"
            :df="fields.name"
            :border="true"
            :value="doc!.name"
            @change="async (value) => await doc?.set('name', value)"
          />
        </template>
        <Button v-if="displayDoc && doc?.template" @click="savePDF">
          {{ t`Save as PDF` }}
        </Button>
        <Button
          v-if="doc && doc.isCustom && displayDoc"
          :title="t`Toggle Edit Mode`"
          :icon="true"
          @click="toggleEditMode"
        >
          <feather-icon name="edit" class="w-4 h-4" />
        </Button>
        <DropdownWithActions v-if="actions.length" :actions="actions" />
        <Button v-if="doc?.canSave" type="primary" @click="sync()">
          {{ t`Save` }}
        </Button>
      </PageHeader>
    </div>
    <div
      v-if="doc"
      class="grid w-full bg-gray-50"
      :style="templateBuilderBodyStyles"
    >
      <div class="relative flex flex-col flex-1">
        <div
          class="flex items-center justify-center overflow-auto"
          style="height: calc(100vh - var(--h-row-largest) - 1px)"
        >
          <!-- Template Container -->
          <div v-if="canDisplayPreview" class="p-4">
            <PrintContainer
              ref="printContainer"
              :print-schema-name="displayDoc!.schemaName"
              :template="doc.template!"
              :values="values!"
              :scale="scale"
              :height="doc.height"
              :width="doc.width"
            />
          </div>

          <!-- Display Hints -->
          <p v-else-if="helperMessage" class="p-4 text-sm text-gray-700">
            {{ helperMessage }}
          </p>
        </div>
        <div class="absolute sticky bottom-0 flex w-full">
          <!-- Bottom Bar -->
          <div
            class="sticky bottom-0 flex flex-shrink-0 w-full mt-auto bg-white border-t "
          >
            <!-- Entry Type -->
            <FormControl
              :title="fields.type.label"
              class="flex-shrink-0 w-40 border-r"
              :df="fields.type"
              :border="false"
              :value="doc.get('type')"
              :container-styles="{ 'border-radius': '0px' }"
              @change="async (value) => await setType(value)"
            />

            <!-- Display Doc -->
            <link
              v-if="doc.type"
              :title="displayDocField.label"
              class="flex-shrink-0 w-40 border-r"
              :df="displayDocField"
              :border="false"
              :value="displayDoc?.name"
              :container-styles="{ 'border-radius': '0px' }"
              @change="(value: string) => setDisplayDoc(value)"
            />

            <!-- Display Scale -->
            <div
              v-if="canDisplayPreview"
              class="flex justify-between flex-shrink-0 gap-2 px-2 ml-auto w-36"
            >
              <p class="my-auto text-sm text-gray-600">
                {{ t`Display Scale` }}
              </p>
              <input
                type="number"
                class="w-10 my-auto text-base text-gray-800 bg-transparent  text-end focus:text-gray-900"
                :value="scale"
                min="0.1"
                max="10"
                step="0.1"
                @change="setScale"
                @input="setScale"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- Input Panel Resizer -->
      <HorizontalResizer
        :initial-x="panelWidth"
        :min-x="22 * 16"
        :max-x="parseInt(maxWidth / 2)"
        style="z-index: 5"
        @resize="(x: number) => panelWidth = x"
      />
      <div class="relative flex flex-col flex-1">
        <div class="flex flex-1 overflow-hidden">
          <!-- Template Panel -->
          <div
            class="flex flex-col w-full bg-white border-l"
            style="height: calc(100vh - var(--h-row-largest) - 1px)"
          >
            <!-- Template Editor -->
            <div class="w-full min-h-0">
              <TemplateEditor
                v-if="typeof doc.template === 'string' && hints"
                ref="templateEditor"
                class="w-full h-full overflow-auto custom-scroll"
                :initial-value="doc.template"
                :disabled="!doc.isCustom"
                :hints="hints"
                @input="() => (templateChanged = true)"
                @blur="(value: string) => setTemplate(value)"
              />
            </div>
            <div
              v-if="templateChanged"
              class="flex items-center gap-2 p-2 mt-auto text-sm text-gray-600 border-t "
            >
              <ShortcutKeys :keys="applyChangesShortcut" :simple="true" />
              {{ t` to apply changes` }}
            </div>
          </div>
        </div>
        <div class="absolute sticky bottom-0 flex w-full">
          <!-- Value Key Hints Container -->
          <div
            v-if="hints"
            class="flex-shrink-0 w-full bg-white border-t"
            :class="templateChanged ? '' : 'mt-auto'"
          >
            <!-- Value Key Toggle -->
            <div
              class="flex items-center justify-between p-2 cursor-pointer select-none "
              @click="toggleShowHints"
            >
              <h2 class="text-base font-semibold text-gray-900">
                {{ t`Key Hints` }}
              </h2>
              <feather-icon
                :name="showHints ? 'chevron-up' : 'chevron-down'"
                class="w-4 h-4 text-gray-600 resize-none"
              />
            </div>

            <!-- Value Key Hints -->
            <Transition name="hints">
              <div
                v-if="showHints"
                class="p-2 overflow-auto border-t custom-scroll"
                style="max-height: 30vh"
              >
                <TemplateBuilderHint :hints="hints" />
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
    <Modal
      v-if="doc"
      :open-modal="showSizeModal"
      @closemodal="showSizeModal = !showSizeModal"
    >
      <SetPrintSize :doc="doc" @done="showSizeModal = !showSizeModal" />
    </Modal>
    <Modal
      v-if="doc"
      :open-modal="showTypeModal"
      @closemodal="showTypeModal = !showTypeModal"
    >
      <SetType :doc="doc" @done="showTypeModal = !showTypeModal" />
    </Modal>
  </div>
</template>
<script lang="ts">
import { EditorView } from 'codemirror';
import { Doc } from 'fyo/model/doc';
import { PrintTemplate } from 'models/baseModels/PrintTemplate';
import { ModelNameEnum } from 'models/types';
import { saveExportData } from 'reports/commonExporter';
import { Field, TargetField } from 'schemas/types';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import Link from 'src/components/Controls/Link.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import HorizontalResizer from 'src/components/HorizontalResizer.vue';
import Modal from 'src/components/Modal.vue';
import PageHeader from 'src/components/PageHeader.vue';
import ShortcutKeys from 'src/components/ShortcutKeys.vue';
import { handleErrorWithDialog } from 'src/errorHandling';
import { shortcutsKey } from 'src/utils/injectionKeys';
import { showDialog, showToast } from 'src/utils/interactive';
import { docsPathMap } from 'src/utils/misc';
import {
PrintTemplateHint,
baseTemplate,
getPrintTemplatePropHints,
getPrintTemplatePropValues,
} from 'src/utils/printTemplates';
import { docsPathRef, showSidebar } from 'src/utils/refs';
import { DocRef, PrintValues } from 'src/utils/types';
import {
ShortcutKey,
focusOrSelectFormControl,
getActionsForDoc,
getDocFromNameIfExistsElseNew,
getSavePath,
openSettings,
selectTextFile,
} from 'src/utils/ui';
import { useDocShortcuts } from 'src/utils/vueUtils';
import { getMapFromList } from 'utils/index';
import { computed, defineComponent, inject, ref } from 'vue';
import PrintContainer from './PrintContainer.vue';
import SetPrintSize from './SetPrintSize.vue';
import SetType from './SetType.vue';
import TemplateBuilderHint from './TemplateBuilderHint.vue';
import TemplateEditor from './TemplateEditor.vue';

export default defineComponent({
  components: {
    PageHeader,
    Button,
    DropdownWithActions,
    PrintContainer,
    HorizontalResizer,
    TemplateEditor,
    FormControl,
    TemplateBuilderHint,
    ShortcutKeys,
    Link,
    Modal,
    SetPrintSize,
    SetType,
  },
  provide() {
    return { doc: computed(() => this.doc) };
  },
  props: { name: { type: String, required: true } },
  setup() {
    const doc = ref(null) as DocRef<PrintTemplate>;
    const shortcuts = inject(shortcutsKey);

    let context = 'TemplateBuilder';
    if (shortcuts) {
      context = useDocShortcuts(shortcuts, doc, context, false);
    }

    return {
      doc,
      context,
      shortcuts,
    };
  },
  data() {
    return {
      editMode: false,
      showHints: false,
      hints: undefined,
      values: null,
      displayDoc: null,
      scale: 0.6,
      panelWidth: 22 /** rem */ * 16 /** px */,
      templateChanged: false,
      showTypeModal: false,
      showSizeModal: false,
      preEditMode: {
        scale: 0.6,
        showSidebar: true,
        panelWidth: 22 * 16,
      },
    } as {
      editMode: boolean;
      showHints: boolean;
      hints?: PrintTemplateHint;
      values: null | PrintValues;
      displayDoc: PrintTemplate | null;
      showTypeModal: boolean;
      showSizeModal: boolean;
      scale: number;
      panelWidth: number;
      templateChanged: boolean;
      preEditMode: {
        scale: number;
        showSidebar: boolean;
        panelWidth: number;
      };
    };
  },
  computed: {
    canDisplayPreview(): boolean {
      if (!this.displayDoc || !this.values) {
        return false;
      }

      if (!this.doc?.template) {
        return false;
      }

      return true;
    },
    applyChangesShortcut() {
      return [ShortcutKey.ctrl, ShortcutKey.enter];
    },
    view(): EditorView | null {
      // @ts-ignore
      const { view } = this.$refs.templateEditor ?? {};
      if (view instanceof EditorView) {
        return view;
      }

      return null;
    },
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
        action: async () => {
          await openSettings(ModelNameEnum.PrintSettings);
        },
      });

      if (this.doc.isCustom && !this.showTypeModal) {
        actions.push({
          label: this.t`Set Template Type`,
          group: this.t`Action`,
          action: () => (this.showTypeModal = true),
        });
      }

      if (this.doc.isCustom && !this.showSizeModal) {
        actions.push({
          label: this.t`Set Print Size`,
          group: this.t`Action`,
          action: () => (this.showSizeModal = true),
        });
      }

      if (this.doc.isCustom) {
        actions.push({
          label: this.t`Select Template File`,
          group: this.t`Action`,
          action: this.selectFile.bind(this),
        });
      }

      actions.push({
        label: this.t`Save Template File`,
        group: this.t`Action`,
        action: this.saveFile.bind(this),
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
  async mounted() {
    await this.initialize();
    if (this.fyo.store.isDevelopment) {
      // @ts-ignore
      window.tb = this;
    }
  },
  async activated(): Promise<void> {
    await this.initialize();
    docsPathRef.value = docsPathMap.PrintTemplate ?? '';
    this.setShortcuts();
  },
  deactivated(): void {
    docsPathRef.value = '';
    if (this.editMode) {
      this.disableEditMode();
    }

    if (this.doc?.dirty) {
      return;
    }
    this.reset();
  },
  methods: {
    setShortcuts() {
      /**
       * Node: Doc Save and Delete shortcuts are in the setup.
       */
      if (!this.shortcuts) {
        return;
      }

      this.shortcuts.ctrl.set(
        this.context,
        ['Enter'],
        this.setTemplate.bind(this)
      );
      this.shortcuts.ctrl.set(
        this.context,
        ['KeyE'],
        this.toggleEditMode.bind(this)
      );
      this.shortcuts.ctrl.set(
        this.context,
        ['KeyH'],
        this.toggleShowHints.bind(this)
      );
      this.shortcuts.ctrl.set(this.context, ['Equal'], () =>
        this.setScale(this.scale + 0.1)
      );
      this.shortcuts.ctrl.set(this.context, ['Minus'], () =>
        this.setScale(this.scale - 0.1)
      );
    },
    async initialize() {
      await this.setDoc();
      if (this.doc?.type) {
        this.hints = getPrintTemplatePropHints(this.doc.type, this.fyo);
      }

      focusOrSelectFormControl(this.doc as Doc, this.$refs.nameField, false);

      if (!this.doc?.template) {
        await this.doc?.set('template', baseTemplate);
      }

      await this.setDisplayInitialDoc();
    },
    reset() {
      this.doc = null;
      this.displayDoc = null;
    },
    getTemplateEditorState() {
      const fallback = this.doc?.template ?? '';

      if (!this.view) {
        return fallback;
      }

      return this.view.state.doc.toString();
    },
    async setTemplate(value?: string) {
      this.templateChanged = false;
      if (!this.doc?.isCustom) {
        return;
      }

      value ??= this.getTemplateEditorState();
      await this.doc?.set('template', value);
    },
    setScale(e: Event | number) {
      let value = this.scale;
      if (typeof e === 'number') {
        value = Number(e.toFixed(2));
      } else if (e instanceof Event && e.target instanceof HTMLInputElement) {
        value = Number(e.target.value);
      }

      this.scale = Math.max(Math.min(value, 10), 0.15);
    },
    toggleShowHints() {
      this.showHints = !this.showHints;
    },
    toggleEditMode() {
      if (!this.doc?.isCustom) {
        return;
      }

      let message = this.t`Please set a Display Doc`;
      if (!this.displayDoc) {
        return showToast({ type: 'warning', message, duration: 'short' });
      }

      this.editMode = !this.editMode;

      if (this.editMode) {
        return this.enableEditMode();
      }

      this.disableEditMode();
    },
    enableEditMode() {
      this.preEditMode.showSidebar = showSidebar.value;
      this.preEditMode.panelWidth = this.panelWidth;
      this.preEditMode.scale = this.scale;

      this.panelWidth = Math.max(window.innerWidth / 2, this.panelWidth);
      showSidebar.value = false;
      this.scale = this.getEditModeScale();
      this.view?.focus();
    },
    disableEditMode() {
      showSidebar.value = this.preEditMode.showSidebar;
      this.panelWidth = this.preEditMode.panelWidth;
      this.scale = this.preEditMode.scale;
    },
    getEditModeScale(): number {
      // @ts-ignore
      const div = this.$refs.printContainer.$el as unknown;
      if (!(div instanceof HTMLDivElement)) {
        return this.scale;
      }

      const padding = 16 * 2 /** p-4 */ + 16 * 0.6; /** w-scrollbar */
      const targetWidth = window.innerWidth / 2 - padding;
      const currentWidth = div.getBoundingClientRect().width;
      const targetScale = (targetWidth * this.scale) / currentWidth;

      return Number(targetScale.toFixed(2));
    },
    savePDF() {
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
        const label = this.fyo.schemaMap[schemaName]?.label ?? schemaName;
        await showDialog({
          title: this.t`No Display Entries Found`,
          detail: this
            .t`Please create a ${label} entry to view Template Preview.`,
          type: 'warning',
        });

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
      this.hints = getPrintTemplatePropHints(schemaName, this.fyo);
      this.values = await getPrintTemplatePropValues(displayDoc);
      this.displayDoc = displayDoc;
    },
    async selectFile() {
      const { name: fileName, text } = await selectTextFile([
        { name: 'Template', extensions: ['template.html', 'html'] },
      ]);

      if (!text) {
        return;
      }

      await this.doc?.set('template', text);
      this.view?.dispatch({
        changes: { from: 0, to: this.view.state.doc.length, insert: text },
      });

      if (this.doc?.inserted) {
        return;
      }

      let name: string | null = null;
      if (fileName.endsWith('.template.html')) {
        name = fileName.split('.template.html')[0];
      }

      if (!name && fileName.endsWith('.html')) {
        name = fileName.split('.html')[0];
      }

      if (!name) {
        return;
      }

      await this.doc?.set('name', name);
    },
    async saveFile() {
      const name = this.doc?.name;
      const template = this.getTemplateEditorState();

      if (!name) {
        return showToast({
          type: 'warning',
          message: this.t`Print Template Name not set`,
        });
      }

      if (!template) {
        return showToast({
          type: 'warning',
          message: this.t`Print Template is empty`,
        });
      }

      const { canceled, filePath } = await getSavePath(name, 'template.html');
      if (canceled || !filePath) {
        return;
      }

      await saveExportData(template, filePath, this.t`Template file saved`);
    },
  },
});
</script>

<style scoped>
.hints-enter-from,
.hints-leave-to {
  opacity: 0;
  height: 0px;
}
.hints-enter-to,
.hints-leave-from {
  opacity: 1;
  height: 30vh;
}

.hints-enter-active,
.hints-leave-active {
  transition: all 150ms ease-out;
}
</style>
