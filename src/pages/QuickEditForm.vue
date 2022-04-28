<template>
  <div class="border-l h-full">
    <div class="flex items-center justify-between px-4 pt-4">
      <div class="flex items-center">
        <Button :icon="true" @click="routeToPrevious">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
        <span v-if="statusText" class="ml-2 text-base text-gray-600">{{
          statusText
        }}</span>
      </div>
      <div class="flex items-stretch">
        <DropdownWithActions :actions="actions" />
        <StatusBadge :status="status" />
        <Button
          :icon="true"
          @click="sync"
          type="primary"
          v-if="doc && doc.notInserted"
          class="ml-2 text-white text-xs"
        >
          {{ t`Save` }}
        </Button>
        <Button
          :icon="true"
          @click="submitDoc"
          type="primary"
          v-if="
            schema?.isSubmittable &&
            doc &&
            !doc.submitted &&
            !doc.notInserted &&
            !(doc.cancelled || false)
          "
          class="ml-2 text-white text-xs"
        >
          {{ t`Submit` }}
        </Button>
      </div>
    </div>
    <div class="px-4 pt-2 pb-4 flex-center" v-if="doc">
      <div class="flex flex-col items-center">
        <FormControl
          v-if="imageField"
          :df="imageField"
          :value="doc[imageField.fieldname]"
          @change="(value) => valueChange(imageField, value)"
          size="small"
          class="mb-1"
          :letter-placeholder="
            // for AttachImage field
            doc[titleField.fieldname] ? doc[titleField.fieldname][0] : null
          "
        />
        <FormControl
          input-class="text-center"
          ref="titleControl"
          v-if="titleField"
          :df="titleField"
          :value="doc[titleField.fieldname]"
          @change="(value) => valueChange(titleField, value)"
          @input="setTitleSize"
        />
      </div>
    </div>
    <TwoColumnForm
      ref="form"
      v-if="doc"
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :column-ratio="[1.1, 2]"
    />
    <component v-if="doc && quickEditWidget" :is="quickEditWidget" />
  </div>
</template>

<script>
import { t } from 'fyo';
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
  provide() {
    let vm = this;
    return {
      schemaName: this.schemaName,
      name: this.name,
      get doc() {
        return vm.doc;
      },
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
  data() {
    return {
      doc: null,
      values: null,
      titleField: null,
      imageField: null,
      statusText: null,
    };
  },
  async created() {
    await this.fetchFieldsAndDoc();
  },
  computed: {
    schema() {
      return fyo.schemaMap[this.schemaName] ?? null;
    },
    status() {
      if (this.doc && this.doc.notInserted) {
        return 'Draft';
      }

      return '';
    },
    fields() {
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
        this.doc.set(this.values);
      }

      // set title size
      this.setTitleSize();
    },
    setTitleField() {
      const { fieldname, readOnly } = this.titleField;
      if (!this.doc?.notInserted || !this.doc[fieldname]) {
        return;
      }

      if (readOnly) {
        this.doc.set(fieldname, t`New ${this.schema.label}`);
        return;
      }

      this.doc.set(fieldname, '');

      setTimeout(() => {
        this.$refs.titleControl.focus();
      }, 300);
    },
    async fetchDoc() {
      try {
        this.doc = await fyo.doc.getDoc(this.schemaName, this.name);

        this.doc.once('afterRename', () => {
          openQuickEdit({
            schemaName: this.schemaName,
            name: this.doc.name,
          });
        });
        this.doc.on('beforeSync', () => {
          this.statusText = t`Saving...`;
        });
        this.doc.on('afterSync', () => {
          setTimeout(() => {
            this.statusText = null;
          }, 500);
        });
      } catch (e) {
        this.$router.back();
      }
    },
    valueChange(df, value) {
      this.$refs.form.onChange(df, value);
    },
    sync() {
      this.$refs.form.sync();
    },
    async submitDoc() {
      try {
        await this.$refs.form.submit();
      } catch (e) {
        this.statusText = null;
        console.error(e);
      }
    },
    routeToPrevious() {
      this.$router.back();
    },
    setTitleSize() {
      if (!this.$refs.titleControl) {
        return;
      }

      const input = this.$refs.titleControl.getInput();
      const value = input.value;
      let valueLength = (value || '').length + 1;

      if (valueLength < 7) {
        valueLength = 7;
      }

      input.size = valueLength;
    },
  },
};
</script>
