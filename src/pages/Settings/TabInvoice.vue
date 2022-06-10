<template>
  <div v-if="doc" class="pb-4">
    <hr />
    <div class="flex items-center gap-4 p-4">
      <FormControl
        :df="getField('logo')"
        :value="doc.logo"
        @change="
          (value) => {
            doc.setAndSync('logo', value);
            forwardChangeEvent(getField('logo'));
          }
        "
      />
      <div class="flex flex-col">
        <span
          class="bg-transparent font-semibold text-xl text-gray-900 px-3 py-2"
        >
          {{ companyName }}
        </span>
        <span class="text-lg text-gray-800 px-3 py-2">
          {{ doc.email }}
        </span>
      </div>
    </div>
    <TwoColumnForm
      :doc="doc"
      :fields="fields"
      :autosave="true"
      :emit-change="true"
      @change="forwardChangeEvent"
    />
  </div>
</template>
<script>
import { ipcRenderer } from 'electron';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { fyo } from 'src/initFyo';
import { IPC_ACTIONS } from 'utils/messages';
import FormControl from '../../components/Controls/FormControl.vue';

export default {
  name: 'TabInvoice',
  components: {
    TwoColumnForm,
    FormControl,
  },
  emits: ['change'],
  provide() {
    return {
      schemaName: 'PrintSettings',
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
    this.doc = await fyo.doc.getDoc('PrintSettings');
    this.companyName = (await fyo.doc.getDoc('AccountingSettings')).companyName;
  },
  computed: {
    fields() {
      const fields = ['template', 'color', 'font', 'email', 'phone', 'address'];

      if (this.doc.logo) {
        fields.unshift('displayLogo');
      }

      return fields.map((field) => this.getField(field));
    },
  },
  methods: {
    getField(fieldname) {
      return fyo.getField('PrintSettings', fieldname);
    },
    async openFileSelector() {
      const options = {
        title: t`Select Logo`,
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
