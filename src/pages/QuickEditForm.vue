<template>
  <div class="border-l h-full">
    <div class="flex justify-end px-4 pt-4">
      <Button @click="routeToList">
        <XIcon class="w-3 h-3 stroke-current text-gray-700" />
      </Button>
      <Button @click="insertDoc" type="primary" v-if="doc._notInserted" class="ml-2 flex">
        <feather-icon name="check" class="text-white" />
      </Button>
    </div>
    <div class="px-1 pt-2 pb-4 border-b flex items-center justify-between">
      <FormControl
        ref="titleControl"
        v-if="titleDocField"
        :df="titleDocField"
        :value="doc[titleDocField.fieldname]"
        @change="value => valueChange(titleDocField, value)"
      />
      <span v-if="statusText" class="text-xs text-gray-600">{{ statusText }}</span>
    </div>
    <div class="text-xs">
      <template v-for="df in fields">
        <FormControl
          size="small"
          v-if="df.fieldtype === 'Table'"
          :df="df"
          :value="doc[df.fieldname]"
          @change="value => valueChange(df, value)"
        />
        <div v-else class="grid border-b" style="grid-template-columns: 1fr 2fr">
          <div class="py-2 pl-4 text-gray-600 flex items-center">{{ df.label }}</div>
          <div class="py-2 pr-4">
            <FormControl
              size="small"
              :df="df"
              :value="doc[df.fieldname]"
              @change="value => valueChange(df, value)"
              @new-doc="doc => valueChange(df, doc.name)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import { _ } from 'frappejs';
import Button from '@/components/Button';
import XIcon from '@/components/Icons/X';
import FormControl from '@/components/Controls/FormControl';

export default {
  name: 'QuickEditForm',
  props: ['doctype', 'name', 'values'],
  components: {
    Button,
    XIcon,
    FormControl
  },
  provide() {
    return {
      doctype: this.doctype,
      name: this.name
    };
  },
  data() {
    return {
      meta: null,
      doc: {},
      fields: [],
      titleDocField: null,
      statusText: null
    };
  },
  async mounted() {
    await this.fetchMetaAndDoc();
  },
  methods: {
    async fetchMetaAndDoc() {
      this.meta = frappe.getMeta(this.doctype);
      this.fields = this.meta.getQuickEditFields();
      this.titleDocField = this.meta.getField(this.meta.titleField);
      await this.fetchDoc();

      // setup the title field
      if (this.doc._notInserted) {
        this.doc.set(this.titleDocField.fieldname, '');
      }
      if (this.values) {
        this.doc.set(this.values);
      }
      setTimeout(() => {
        this.$refs.titleControl.focus();
      }, 300);
    },
    valueChange(df, value) {
      if (!value) return;
      let oldValue = this.doc.get(df.fieldname);
      if (
        df.fieldname === 'name' &&
        oldValue !== value &&
        !this.doc._notInserted
      ) {
        this.doc.rename(value);
        this.doc.once('afterRename', () => {
          this.$router.push({
            path: `/list/${this.doctype}`,
            query: {
              edit: 1,
              doctype: this.doctype,
              name: this.name
            }
          });
        });
        return;
      }
      this.doc.set(df.fieldname, value);
      if (this.doc._dirty && !this.doc._notInserted) {
        if (df.fieldtype === 'Table') {
          console.log(value);
          return;
        }
        this.updateDoc();
      }
    },
    async fetchDoc() {
      this.doc = await frappe.getDoc(this.doctype, this.name);
    },
    async updateDoc() {
      this.statusText = _('Saving...');
      try {
        await this.doc.update();
        this.triggerSaved();
      } catch (e) {
        await this.fetchDoc();
      }
    },
    triggerSaved() {
      this.statusText = _('Saved');
      setTimeout(() => (this.statusText = null), 1000);
    },
    insertDoc() {
      this.doc.insert();
    },
    routeToList() {
      this.$router.push(`/list/${this.doctype}`);
    }
  }
};
</script>
