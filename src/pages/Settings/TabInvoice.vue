<template>
  <div v-if="doc">
    <div class="flex items-center">
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
      <div class="ml-6 flex flex-col">
        <span class="font-semibold">
          {{ companyName }}
        </span>
        <span class="text-lg text-gray-700">
          {{ doc.email }}
        </span>
        <FormControl
          class="mt-2"
          :df="getField('displayLogo')"
          :value="doc.displayLogo"
          :show-label="true"
          @change="
            (value) => {
              doc.setAndSync('displayLogo', value);
              forwardChangeEvent(getField('displayLogo'));
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
    this.doc = await fyo.doc.getSingle('PrintSettings');
    this.companyName = (
      await fyo.doc.getSingle('AccountingSettings')
    ).companyName;
  },
  computed: {
    fields() {
      return ['template', 'color', 'font', 'email', 'phone', 'address'].map(
        (field) => this.getField(field)
      );
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
