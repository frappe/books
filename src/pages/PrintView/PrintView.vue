<template>
  <div class="flex">
    <div class="flex flex-col flex-1">
      <PageHeader :backLink="true" class="bg-white z-10">
        <Button
          class="text-gray-900 text-xs"
          @click="showCustomiser = !showCustomiser"
        >
          {{ t`Customise` }}
        </Button>
        <Button class="text-gray-900 text-xs" @click="makePDF">
          {{ t`Save as PDF` }}
        </Button>
      </PageHeader>
      <div
        v-if="doc && printSettings"
        class="flex justify-center flex-1 -mt-36 overflow-auto relative"
      >
        <div
          class="h-full shadow-lg mb-12 absolute"
          style="
            width: 21cm;
            min-height: 29.7cm;
            height: max-content;
            transform: scale(0.7);
          "
          ref="printContainer"
        >
          <component
            class="flex-1"
            :is="printTemplate"
            v-bind="{ doc, printSettings }"
          />
        </div>
      </div>
    </div>
    <div class="border-l w-80" v-if="showCustomiser">
      <div class="mt-4 px-4 flex items-center justify-between">
        <h2 class="font-semibold">{{ t`Customise` }}</h2>
        <Button :icon="true" @click="showCustomiser = false">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
      </div>
      <TwoColumnForm class="mt-4" :doc="printSettings" :autosave="true" />
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from 'electron';
import { Verb } from 'fyo/telemetry/types';
import Button from 'src/components/Button';
import PageHeader from 'src/components/PageHeader';
import SearchBar from 'src/components/SearchBar';
import TwoColumnForm from 'src/components/TwoColumnForm';
import { makePDF } from 'src/utils';
import { IPC_ACTIONS } from 'utils/messages';

export default {
  name: 'PrintView',
  props: { schemaName: String, name: String },
  components: {
    PageHeader,
    SearchBar,
    Button,
    TwoColumnForm,
  },
  data() {
    return {
      doc: null,
      showCustomiser: false,
      printSettings: null,
    };
  },
  async mounted() {
    this.doc = await fyo.doc.getDoc(this.schemaName, this.name);
    this.printSettings = await fyo.getSingle('PrintSettings');
  },
  computed: {
    meta() {
      return fyo.getMeta(this.schemaName);
    },
    printTemplate() {
      return this.meta.printTemplate;
    },
  },
  methods: {
    async makePDF() {
      const savePath = await this.getSavePath();
      if (!savePath) return;

      const html = this.$refs.printContainer.innerHTML;
      fyo.telemetry.log(Verb.Exported, 'SalesInvoice', { extension: 'pdf' });
      makePDF(html, savePath);
    },
    async getSavePath() {
      const options = {
        title: this.t`Select folder`,
        defaultPath: `${this.name}.pdf`,
      };

      let { filePath } = await ipcRenderer.invoke(
        IPC_ACTIONS.GET_SAVE_FILEPATH,
        options
      );

      if (filePath) {
        if (!filePath.endsWith('.pdf')) {
          filePath = filePath + '.pdf';
        }
      }

      return filePath;
    },
  },
};
</script>
