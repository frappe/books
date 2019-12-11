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
            action: d.action.bind(this, this.doc, this.$router)
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
    deleteDoc() {
      return deleteDocWithPrompt(this.doc);
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
