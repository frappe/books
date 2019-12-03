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
        <Dropdown
          v-if="actions && actions.length"
          :items="actions"
          right
          class="text-base"
        >
          <template v-slot="{ toggleDropdown }">
            <Button
              class="text-gray-900"
              :icon="true"
              @click="toggleDropdown()"
            >
              <feather-icon name="more-horizontal" class="w-4 h-4" />
            </Button>
          </template>
        </Dropdown>
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
    <div class="px-4 pt-2 pb-4 flex items-center justify-center" v-if="doc">
      <div class="flex flex-col items-center">
        <FormControl
          v-if="imageField"
          :df="imageField"
          :value="doc[imageField.fieldname]"
          @change="value => valueChange(imageField, value)"
          size="small"
          class="mb-1"
          :letter-placeholder="
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
    <div class="px-4 text-xs text-red-600 py-2" v-if="errorMessage">
      {{ errorMessage }}
    </div>
    <TwoColumnForm
      ref="form"
      v-if="doc"
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :column-ratio="[1.1, 2]"
      :validate-form="validateForm"
    />
  </div>
</template>

<script>
import frappe from 'frappejs';
import { _ } from 'frappejs';
import Button from '@/components/Button';
import FormControl from '@/components/Controls/FormControl';
import TwoColumnForm from '@/components/TwoColumnForm';
import Dropdown from '@/components/Dropdown';
import { deleteDocWithPrompt, openQuickEdit } from '@/utils';

export default {
  name: 'QuickEditForm',
  props: ['doctype', 'name', 'values', 'hideFields'],
  components: {
    Button,
    FormControl,
    TwoColumnForm,
    Dropdown
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
      statusText: null,
      validateForm: false,
      errorMessage: null
    };
  },
  async created() {
    await this.fetchMetaAndDoc();
  },
  errorCaptured(err, vm, info) {
    this.errorMessage = err.message;
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
      if (!this.doc) return null;
      let deleteAction = {
        component: {
          template: `<span class="text-red-700">{{ _('Delete') }}</span>`
        },
        condition: doc => !doc.isNew() && !doc.submitted,
        action: () => {
          this.deleteDoc().then(() => {
            this.routeToList();
          });
        }
      };
      let actions = [...(this.meta.actions || []), deleteAction]
        .filter(d => (d.condition ? d.condition(this.doc) : true))
        .map(d => {
          return {
            label: d.label,
            component: d.component,
            action: d.action.bind(this, this.doc)
          };
        });

      return actions;
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
    valueChange(df, value) {
      this.$refs.form.onChange(df, value);
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
    insertDoc() {
      let requiredFields = this.fields.filter(df => df.required);
      if (requiredFields.some(df => this.doc[df.fieldname] == null)) {
        this.validateForm = true;
        return;
      }
      this.validateForm = false;
      this.errorMessage = null;
      this.doc.insert().catch(e => {
        if (e.name === 'DuplicateEntryError') {
          this.errorMessage = _('{0} {1} already exists.', [
            this.doctype,
            this.doc.name
          ]);
        } else {
          this.errorMessage = _('An error occurred.');
        }
      });
    },
    submitDoc() {
      this.doc.submit();
    },
    deleteDoc() {
      return deleteDocWithPrompt(this.doc).catch(e => {
        if (e.name === 'LinkValidationError') {
          this.errorMessage = _('{0} {1} is linked with existing records.', [
            this.doctype,
            this.doc.name
          ]);
        } else {
          this.errorMessage = _('An error occurred.');
        }
        throw e;
      });
    },
    routeToList() {
      this.$router.push(`/list/${this.doctype}`);
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
