<template>
  <div
    class="border-s h-full overflow-auto w-quick-edit"
    :class="white ? 'bg-white' : 'bg-gray-25'"
  >
    <!-- Quick edit Tool bar -->
    <div
      class="
        flex
        items-center
        justify-between
        px-4
        h-row-largest
        sticky
        top-0
        bg-white
      "
      style="z-index: 1"
      :class="{ 'border-b': showName }"
    >
      <!-- Close Button and Status Text -->
      <div class="flex items-center">
        <Button :icon="true" @click="routeToPrevious">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <span v-if="statusText" class="ms-2 text-base text-gray-600">{{
          statusText
        }}</span>
      </div>

      <!-- Actions, Badge and Status Change Buttons -->
      <div class="flex items-stretch gap-2" v-if="showSave">
        <StatusBadge :status="status" />
        <DropdownWithActions :actions="actions" />
        <Button
          :icon="true"
          @click="sync"
          type="primary"
          v-if="doc?.canSave"
          class="text-white text-xs"
        >
          {{ t`Save` }}
        </Button>
        <Button
          :icon="true"
          @click="submit"
          type="primary"
          v-else-if="doc?.canSubmit"
          class="text-white text-xs"
        >
          {{ t`Submit` }}
        </Button>
      </div>
    </div>

    <!-- Name and image -->
    <div
      class="items-center"
      :class="imageField ? 'grid' : 'flex justify-center'"
      :style="{
        height: `calc(var(--h-row-mid) * ${!!imageField ? '2 + 1px' : '1'})`,
        gridTemplateColumns: `minmax(0, 1.1fr) minmax(0, 2fr)`,
      }"
      v-if="doc && showName && (titleField || imageField)"
    >
      <FormControl
        v-if="imageField"
        class="ms-4"
        :df="imageField"
        :value="doc[imageField.fieldname]"
        @change="(value) => valueChange(imageField, value)"
        :letter-placeholder="doc[titleField.fieldname]?.[0] ?? ''"
      />
      <FormControl
        v-if="titleField"
        :class="!!imageField ? 'me-4' : 'w-full mx-4'"
        :input-class="[
          'font-semibold text-xl',
          !!imageField ? '' : 'text-center',
        ]"
        ref="titleControl"
        size="small"
        :df="titleField"
        :value="doc[titleField.fieldname]"
        :read-only="doc.inserted || doc.schema.naming !== 'manual'"
        @change="(value) => valueChange(titleField, value)"
      />
    </div>

    <!-- Rest of the form -->
    <TwoColumnForm
      v-if="doc"
      class="w-full"
      ref="form"
      :doc="doc"
      :fields="fields"
      :column-ratio="[1.1, 2]"
    />

    <!-- QuickEdit Widgets -->
    <component v-if="quickEditWidget" :is="quickEditWidget" />
  </div>
</template>

<script>
import { computed } from '@vue/reactivity';
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { getDocStatus } from 'models/helpers';
import Button from 'src/components/Button.vue';
import FormControl from 'src/components/Controls/FormControl.vue';
import DropdownWithActions from 'src/components/DropdownWithActions.vue';
import StatusBadge from 'src/components/StatusBadge.vue';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { fyo } from 'src/initFyo';
import { getQuickEditWidget } from 'src/utils/quickEditWidgets';
import { focusedDocsRef } from 'src/utils/refs';
import {
  commonDocSubmit,
  commonDocSync,
  getActionsForDoc,
  openQuickEdit,
} from 'src/utils/ui';

export default {
  name: 'QuickEditForm',
  props: {
    name: String,
    schemaName: String,
    defaults: String,
    white: { type: Boolean, default: false },
    routeBack: { type: Boolean, default: true },
    showName: { type: Boolean, default: true },
    showSave: { type: Boolean, default: true },
    sourceDoc: { type: Doc, default: null },
    loadOnClose: { type: Boolean, default: true },
    sourceFields: { type: Array, default: () => [] },
    hideFields: { type: Array, default: () => [] },
    showFields: { type: Array, default: () => [] },
  },
  components: {
    Button,
    FormControl,
    StatusBadge,
    TwoColumnForm,
    DropdownWithActions,
  },
  emits: ['close'],
  provide() {
    return {
      schemaName: this.schemaName,
      name: this.name,
      doc: computed(() => this.doc),
    };
  },
  data() {
    return {
      doc: null,
      values: null,
      titleField: null,
      imageField: null,
      statusText: null,
    };
  },
  async mounted() {
    if (this.defaults) {
      this.values = JSON.parse(this.defaults);
    }

    await this.fetchFieldsAndDoc();
    focusedDocsRef.add(this.doc);

    if (fyo.store.isDevelopment) {
      window.qef = this;
    }
  },
  activated() {
    focusedDocsRef.add(this.doc);
  },
  deactivated() {
    focusedDocsRef.delete(this.doc);
  },
  unmounted() {
    focusedDocsRef.delete(this.doc);
  },
  computed: {
    isChild() {
      return !!this?.doc?.schema?.isChild;
    },
    schema() {
      return fyo.schemaMap[this.schemaName] ?? null;
    },
    status() {
      return getDocStatus(this.doc);
    },
    fields() {
      if (this.sourceFields?.length) {
        return this.sourceFields;
      }

      if (!this.schema) {
        return [];
      }

      const fieldnames = (this.schema.quickEditFields ?? ['name']).filter(
        (f) => !this.hideFields.includes(f)
      );

      if (this.showFields?.length) {
        fieldnames.push(
          ...this.schema.fields
            .map((f) => f.fieldname)
            .filter((f) => this.showFields.includes(f))
        );
      }

      return fieldnames.map((f) => fyo.getField(this.schemaName, f));
    },
    actions() {
      return getActionsForDoc(this.doc);
    },
    quickEditWidget() {
      if (this.doc?.notInserted ?? true) {
        return null;
      }

      const widget = getQuickEditWidget(this.schemaName);
      if (widget === null) {
        return null;
      }

      return widget(this.doc);
    },
  },
  methods: {
    async fetchFieldsAndDoc() {
      if (!this.schema) {
        return;
      }

      const titleField = this.schema.titleField;
      this.titleField = fyo.getField(this.schemaName, titleField);
      this.imageField = fyo.getField(this.schemaName, 'image');

      await this.fetchDoc();

      // setup the title field
      this.setTitleField();

      // set default values
      if (this.values) {
        this.doc?.set(this.values);
      }
    },
    setTitleField() {
      const { fieldname, readOnly } = this.titleField;
      if (!this.doc?.notInserted || !this?.doc[fieldname]) {
        return;
      }

      const isManual = this.schema.naming === 'manual';
      const isNumberSeries = fyo.getField(this.schemaName, 'numberSeries');
      if (readOnly && (!this?.doc[fieldname] || isNumberSeries)) {
        this.doc.set(fieldname, t`New ${this.schema.label}`);
      }

      if (this?.doc[fieldname] && !isManual) {
        return;
      }

      this.doc.set(fieldname, '');

      setTimeout(() => {
        this.$refs.titleControl?.focus();
      }, 300);
    },
    async fetchDoc() {
      if (this.sourceDoc) {
        return (this.doc = this.sourceDoc);
      }

      if (!this.schemaName) {
        this.$router.back();
      }

      if (this.name) {
        try {
          this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
        } catch (e) {
          this.$router.back();
        }
      } else {
        this.doc = fyo.doc.getNewDoc(this.schemaName);
      }

      if (this.doc === null) {
        return;
      }

      this.doc.once('afterRename', () => {
        openQuickEdit({
          schemaName: this.schemaName,
          name: this.doc.name,
        });
      });
    },
    valueChange(df, value) {
      this.$refs.form.onChange(df, value);
    },
    async sync() {
      this.statusText = t`Saving`;
      await commonDocSync(this.doc);
      setTimeout(() => {
        this.statusText = null;
      }, 300);
    },
    async submit() {
      this.statusText = t`Submitting`;
      await commonDocSubmit(this.doc);
      setTimeout(() => {
        this.statusText = null;
      }, 300);
    },
    routeToPrevious() {
      if (this.loadOnClose && this.doc.dirty && !this.doc.notInserted) {
        this.doc.load();
      }

      if (this.routeBack) {
        this.$router.back();
      } else {
        this.$emit('close');
      }
    },
  },
};
</script>
