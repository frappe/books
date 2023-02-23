<template>
  <div class="flex">
    <div class="flex flex-col flex-1 bg-gray-25">
      <PageHeader class="z-10" :border="false">
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

      <!-- Printview Preview -->
      <div
        v-if="doc && printSettings"
        class="flex justify-center flex-1 overflow-auto relative"
      >
        <div
          class="h-full shadow mb-4 absolute bg-white"
          style="
            width: 21cm;
            height: 29.7cm;
            transform: scale(0.65) translateY(-300px);
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

    <!-- Printview Customizer -->
    <Transition name="quickedit">
      <div class="border-s w-quick-edit" v-if="showCustomiser">
        <div
          class="px-4 flex items-center justify-between h-row-largest border-b"
        >
          <h2 class="font-semibold">{{ t`Customise` }}</h2>
          <Button :icon="true" @click="showCustomiser = false">
            <feather-icon name="x" class="w-4 h-4" />
          </Button>
        </div>
        <TwoColumnForm
          :doc="printSettings"
          :autosave="true"
          class="border-none"
        />
      </div>
    </Transition>
  </div>
</template>
<script>
import { ipcRenderer } from 'electron';
import { Verb } from 'fyo/telemetry/types';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import InvoiceTemplate from 'src/components/SalesInvoice/InvoiceTemplate.vue';
import TwoColumnForm from 'src/components/TwoColumnForm.vue';
import { fyo } from 'src/initFyo';
import { makePDF } from 'src/utils/ipcCalls';
import {
  constructPrintDocument,
  getPathAndMakePDF,
} from 'src/utils/printTemplates';
import { IPC_ACTIONS } from 'utils/messages';

export default {
  name: 'PrintView',
  props: { schemaName: String, name: String },
  components: {
    PageHeader,
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
    this.printSettings = await fyo.doc.getDoc('PrintSettings');

    if (fyo.store.isDevelopment) {
      window.pv = this;
    }
  },
  computed: {
    printTemplate() {
      return InvoiceTemplate;
    },
  },
  methods: {
    async makePDF() {
      const innerHTML = this.$refs.printContainer.innerHTML;
      await getPathAndMakePDF(this.name, innerHTML);
      fyo.telemetry.log(Verb.Exported, 'SalesInvoice', { extension: 'pdf' });
    },
  },
};
</script>
