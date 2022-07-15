<template>
  <div
    class="border-l h-full overflow-auto"
    :class="white ? 'bg-white' : 'bg-gray-25'"
  >
    <!-- Quick edit Tool bar -->
    <div
      class="flex items-center justify-between px-4 h-row-largest"
      :class="{ 'border-b': showName }"
    >
      <!-- Close Button and Status Text -->
      <div class="flex items-center">
        <Button :icon="true" @click="routeToPrevious">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <span v-if="statusText" class="ml-2 text-base text-gray-600">{{
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
          v-if="doc?.dirty || doc?.notInserted"
          class="text-white text-xs"
        >
          {{ t`Save` }}
        </Button>
        <Button
          :icon="true"
          @click="submit"
          type="primary"
          v-if="
            schema?.isSubmittable &&
            !doc?.submitted &&
            !doc?.notInserted &&
            !(doc?.cancelled || false)
          "
          class="text-white text-xs"
        >
          {{ t`Submit` }}
        </Button>
      </div>
    </div>

    <!-- Name and image -->
    <div
      class="px-4 flex-center flex flex-col items-center gap-1.5"
      style="height: calc(var(--h-row-mid) * 2 + 1px)"
      v-if="doc && showName"
    >
      <FormControl
        v-if="imageField"
        :df="imageField"
        :value="doc[imageField.fieldname]"
        @change="(value) => valueChange(imageField, value)"
        size="small"
        :letter-placeholder="doc[titleField.fieldname]?.[0] ?? null"
      />
      <FormControl
        input-class="text-center h-8 bg-transparent"
        ref="titleControl"
        v-if="titleField"
        :df="titleField"
        :value="doc[titleField.fieldname]"
        :read-only="doc.inserted"
        @change="(value) => valueChange(titleField, value)"
        @input="setTitleSize"
      />
    </div>

    <!-- Rest of the form -->
    <TwoColumnForm
      ref="form"
      v-if="doc"
      :doc="doc"
      :fields="fields"
      :autosave="false"
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
import { getActionsForDocument, openQuickEdit } from 'src/utils/ui';

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
  mounted() {
    if (this.defaults) {
      this.values = JSON.parse(this.defaults);
    }

    if (fyo.store.isDevelopment) {
      window.qef = this;
    }
  },
  async created() {
    await this.fetchFieldsAndDoc();
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
      return getActionsForDocument(this.doc);
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

      // set title size
      this.setTitleSize();
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
      try {
        await this.$refs.form.sync();
        setTimeout(() => {
          this.statusText = null;
        }, 300);
      } catch (err) {
        this.statusText = null;
        console.error(err);
      }
    },
    async submit() {
      this.statusText = t`Submitting`;
      try {
        await this.$refs.form.submit();
        setTimeout(() => {
          this.statusText = null;
        }, 300);
      } catch (err) {
        this.statusText = null;
        console.error(err);
      }
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
    setTitleSize() {
      if (!this.$refs.titleControl) {
        return;
      }

      const input = this.$refs.titleControl.getInput();
      const value = input.value;
      const valueLength = (value || '').length + 1;
      input.size = Math.max(valueLength, 15);
    },
  },
};
</script>
