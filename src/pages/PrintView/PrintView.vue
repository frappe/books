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
    <div class="border-l w-quick-edit" v-if="showCustomiser">
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
    constructPrintDocument() {
      const html = document.createElement('html');
      const head = document.createElement('head');
      const body = document.createElement('body');
      const style = getAllCSSAsStyleElem();

      head.innerHTML = [
        '<meta charset="UTF-8">',
        '<title>Print Window</title>',
      ].join('\n');
      head.append(style);

      body.innerHTML = this.$refs.printContainer.innerHTML;
      html.append(head, body);
      return html.outerHTML;
    },
    async makePDF() {
      const savePath = await this.getSavePath();
      if (!savePath) return;

      const html = this.constructPrintDocument();
      await makePDF(html, savePath);
      fyo.telemetry.log(Verb.Exported, 'SalesInvoice', { extension: 'pdf' });
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

function getAllCSSAsStyleElem() {
  const cssTexts = [];
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      cssTexts.push(rule.cssText);
    }

    for (const rule of sheet.ownerRule ?? []) {
      cssTexts.push(rule.cssText);
    }
  }

  const styleElem = document.createElement('style');
  styleElem.innerHTML = cssTexts.join('\n');
  return styleElem;
}
</script>
