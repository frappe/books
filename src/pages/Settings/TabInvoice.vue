<template>
  <div v-if="doc">
    <div class="flex items-center">
      <FormControl
        :df="meta.getField('logo')"
        :value="doc.logo"
        @change="
          (value) => {
            doc.set('logo', value);
            doc.update();
            forwardChangeEvent(meta.getField('logo'));
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
            (value) => {
              doc.set('displayLogo', value);
              doc.update();
              forwardChangeEvent(meta.getField('displayLogo'));
            }
          "
          size="small"
        />
      </div>
    </div>
    <TwoColumnForm
      class="mt-6"
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :emit-change="true"
      @change="forwardChangeEvent"
    />
  </div>
</template>
<script>
import frappe from 'frappe';
import { ipcRenderer } from 'electron';
import TwoColumnForm from '@/components/TwoColumnForm';
import FormControl from '@/components/Controls/FormControl';
import { IPC_ACTIONS } from '@/messages';

export default {
  name: 'TabInvoice',
  components: {
    TwoColumnForm,
    FormControl,
  },
  provide() {
    return {
      doctype: 'PrintSettings',
      name: 'PrintSettings',
    };
  },
  data() {
    return {
      companyName: null,
      doc: null,
      showEdit: false,
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
      return ['template', 'color', 'font', 'email', 'phone', 'address'].map(
        (field) => this.meta.getField(field)
      );
    },
  },
  methods: {
    async openFileSelector() {
      const options = {
        title: frappe._('Select Logo'),
        properties: ['openFile'],
        filters: [{ name: 'Invoice Logo', extensions: ['png', 'jpg', 'svg'] }],
      };
      const { filePaths } = await ipcRenderer.invoke(
        IPC_ACTIONS.GET_OPEN_FILEPATH,
        options
      );
      if (filePaths[0] !== undefined) {
        this.doc.set('logo', `file://${files[0]}`);
        this.doc.update;
      }
    },
    forwardChangeEvent(...args) {
      this.$emit('change', ...args);
    },
  },
};
</script>
