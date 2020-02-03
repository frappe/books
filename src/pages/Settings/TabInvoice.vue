<template>
  <div v-if="doc">
    <div class="flex items-center">
      <FormControl
        :df="meta.getField('logo')"
        :value="doc.logo"
        @change="
          value => {
            doc.set('logo', value);
            doc.update();
          }
        "
      />
      <div class="ml-6 flex flex-col">
        <span class="font-semibold">
          {{ companyName }}
        </span>
        <span class="text-lg text-gray-700">
          {{ doc.email }}
        </span>
        <FormControl
          class="mt-2"
          :df="meta.getField('displayLogo')"
          :value="doc.displayLogo"
          :show-label="true"
          @change="
            value => {
              doc.set('displayLogo', value);
              doc.update();
            }
          "
          size="small"
        />
      </div>
    </div>
    <TwoColumnForm class="mt-6" :doc="doc" :fields="fields" :autosave="true" />
  </div>
</template>
<script>
import frappe from 'frappejs';
import { remote } from 'electron';
import TwoColumnForm from '@/components/TwoColumnForm';
import FormControl from '@/components/Controls/FormControl';

export default {
  name: 'TabInvoice',
  components: {
    TwoColumnForm,
    FormControl
  },
  provide() {
    return {
      doctype: 'PrintSettings',
      name: 'PrintSettings'
    };
  },
  data() {
    return {
      companyName: null,
      doc: null,
      showEdit: false
    };
  },
  async mounted() {
    this.doc = await frappe.getSingle('PrintSettings');
    this.companyName = (
      await frappe.getSingle('AccountingSettings')
    ).companyName;
  },
  computed: {
    meta() {
      return frappe.getMeta('PrintSettings');
    },
    fields() {
      return [
        'template',
        'color',
        'font',
        'email',
        'phone',
        'address',
        'gstin'
      ].map(field => this.meta.getField(field));
    }
  },
  methods: {
    openFileSelector() {
      remote.dialog.showOpenDialog(
        remote.getCurrentWindow(),
        {
          title: frappe._('Select Logo'),
          properties: ['openFile'],
          filters: [{ name: 'Invoice Logo', extensions: ['png', 'jpg', 'svg'] }]
        },
        files => {
          if (files && files[0]) {
            this.doc.set('logo', `file://${files[0]}`);
            this.doc.update();
          }
        }
      );
    }
  }
};
</script>
