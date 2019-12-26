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
        <Button
          :icon="true"
          @click="insertDoc"
          type="primary"
          v-if="doc && doc._notInserted"
          class="ml-2 text-white text-xs"
        >
          {{ _('Save') }}
        </Button>
        <Button
          :icon="true"
          @click="submitDoc"
          type="primary"
          v-if="
            meta &&
              meta.isSubmittable &&
              doc &&
              !doc.submitted &&
              !doc._notInserted
          "
          class="ml-2 text-white text-xs"
        >
          {{ _('Submit') }}
        </Button>
      </div>
    </div>
    <div class="px-4 pt-2 pb-4 flex-center" v-if="doc">
      <div class="flex flex-col items-center">
        <FormControl
          v-if="imageField"
          :df="imageField"
          :value="doc[imageField.fieldname]"
          @change="value => valueChange(imageField, value)"
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
          @change="value => valueChange(titleField, value)"
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
import frappe from 'frappejs';
import { _ } from 'frappejs';
import Button from '@/components/Button';
import FormControl from '@/components/Controls/FormControl';
import TwoColumnForm from '@/components/TwoColumnForm';
import DropdownWithActions from '@/components/DropdownWithActions';
import { openQuickEdit, getActionsForDocument } from '@/utils';

export default {
  name: 'QuickEditForm',
  props: ['doctype', 'name', 'values', 'hideFields'],
  components: {
    Button,
    FormControl,
    TwoColumnForm,
    DropdownWithActions
  },
  provide() {
    let vm = this;
    return {
      doctype: this.doctype,
      name: this.name,
      get doc() {
        return vm.doc;
      }
    };
  },
  data() {
    return {
      doc: null,
      titleField: null,
      imageField: null,
      statusText: null
    };
  },
  async created() {
    await this.fetchMetaAndDoc();
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    fields() {
      return this.meta
        .getQuickEditFields()
        .filter(df => !(this.hideFields || []).includes(df.fieldname));
    },
    actions() {
      return getActionsForDocument(this.doc);
    },
    quickEditWidget() {
      if (!this.meta.quickEditWidget) {
        return null;
      }
      return this.meta.quickEditWidget(this.doc);
    }
  },
  methods: {
    async fetchMetaAndDoc() {
      this.titleField = this.meta.getField(this.meta.titleField);
      this.imageField = this.meta.getField('image');
      await this.fetchDoc();

      // setup the title field
      if (this.doc.isNew() && this.doc[this.titleField.fieldname]) {
        if (!this.titleField.readOnly) {
          this.doc.set(this.titleField.fieldname, '');
          setTimeout(() => {
            this.$refs.titleControl.focus();
          }, 300);
        } else {
          this.doc.set(this.titleField.fieldname, 'New ' + this.doc.doctype);
        }
      }

      // set default values
      if (this.values) {
        this.doc.set(this.values);
      }

      // set title size
      this.setTitleSize();
    },
    async fetchDoc() {
      try {
        this.doc = await frappe.getDoc(this.doctype, this.name);

        this.doc.once('afterRename', () => {
          openQuickEdit({
            doctype: this.doctype,
            name: this.doc.name
          });
        });
        this.doc.on('beforeUpdate', () => {
          this.statusText = _('Saving...');
        });
        this.doc.on('afterUpdate', () => {
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
    insertDoc() {
      this.$refs.form.insert();
    },
    submitDoc() {
      this.$refs.form.submit();
    },
    routeToPrevious() {
      this.$router.back();
    },
    setTitleSize() {
      if (this.$refs.titleControl) {
        let input = this.$refs.titleControl.getInput();
        let value = input.value;
        let valueLength = (value || '').length + 1;
        if (valueLength < 7) {
          valueLength = 7;
        }
        input.size = valueLength;
      }
    }
  }
};
</script>
