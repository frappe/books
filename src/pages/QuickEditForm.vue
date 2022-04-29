<template>
  <div class="border-l h-full overflow-auto">
    <!-- Quick edit Tool bar -->
    <div class="flex items-center justify-between px-4 pt-4">
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
      <div class="flex items-stretch">
        <DropdownWithActions :actions="actions" />
        <StatusBadge :status="status" />
        <Button
          :icon="true"
          @click="sync"
          type="primary"
          v-if="doc?.dirty || doc?.notInserted"
          class="ml-2 text-white text-xs"
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
          class="ml-2 text-white text-xs"
        >
          {{ t`Submit` }}
        </Button>
      </div>
    </div>

    <!-- Name and image -->
    <div class="p-4 gap-2 flex-center flex flex-col items-center" v-if="doc">
      <FormControl
        v-if="imageField"
        :df="imageField"
        :value="doc[imageField.fieldname]"
        @change="(value) => valueChange(imageField, value)"
        size="small"
        :letter-placeholder="doc[titleField.fieldname]?.[0] ?? null"
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
        this.$refs.titleControl?.focus();
      }, 300);
    },
    async fetchDoc() {
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
      if (this.doc.dirty && !this.doc.notInserted) {
        this.doc.load();
      }
      this.$router.back();
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
