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
    <div class="px-4 pt-2 pb-4 border-b flex items-center justify-between">
      <FormControl
        ref="titleControl"
        v-if="titleDocField"
        input-class="focus:shadow-outline-px"
        :df="titleDocField"
        :value="doc[titleDocField.fieldname]"
        @change="value => valueChange(titleDocField, value)"
      />
      <span v-if="showSaved" class="text-xs text-gray-600">{{ _('Saved') }}</span>
    </div>
    <div class="text-xs">
      <div
        class="grid border-b"
        style="grid-template-columns: 1fr 2fr"
        v-for="df in fields"
        :key="df.fieldname"
      >
        <div class="py-3 pl-4 text-gray-600">{{ df.label }}</div>
        <FormControl
          class="py-3 pr-4"
          input-class="focus:shadow-outline-px"
          :df="df"
          :value="doc[df.fieldname]"
          @change="value => valueChange(df, value)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import frappe from 'frappejs';
import Button from '@/components/Button';
import XIcon from '@/components/Icons/X';
import FormControl from '@/components/Controls/FormControl';

export default {
  name: 'QuickEditForm',
  props: ['doctype', 'name'],
  components: {
    Button,
    XIcon,
    FormControl
  },
  data() {
    return {
      title: '',
      meta: null,
      doc: {},
      fields: [],
      titleDocField: null,
      showSaved: false
    };
  },
  async mounted() {
    this.meta = frappe.getMeta(this.doctype);
    this.fields = this.meta
      .getQuickEditFields()
      .map(fieldname => this.meta.getField(fieldname));
    this.titleDocField = this.meta.getField(this.meta.titleField);
    await this.fetchDoc();

    // setup the title field
    if (this.doc._notInserted) {
      this.doc.set(this.titleDocField.fieldname, '');
    }
    setTimeout(() => {
      this.$refs.titleControl.focus()
    }, 300);
  },
  methods: {
    valueChange(df, value) {
      if (!value) return;
      let oldValue = this.doc.get(df.fieldname);
      if (df.fieldname === 'name' && oldValue !== value && !this.doc._notInserted) {
        this.doc.rename(value);
        this.doc.once('afterRename', () => {
          this.$router.push(`/list/${this.doctype}/${this.doc.name}`);
        });
        return;
      }
      this.doc.set(df.fieldname, value);
      if (this.doc._dirty && !this.doc._notInserted) {
        this.updateDoc();
      }
    },
    async fetchDoc() {
      this.doc = await frappe.getDoc(this.doctype, this.name);
      this.title = this.doc[this.meta.titleField];
    },
    async updateDoc() {
      try {
        await this.doc.update();
        this.triggerSaved();
      } catch (e) {
        await this.fetchDoc();
      }
    },
    triggerSaved() {
      this.showSaved = true;
      setTimeout(() => (this.showSaved = false), 1000);
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
