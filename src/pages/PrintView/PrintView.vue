<template>
  <div class="flex">
    <div class="flex flex-col flex-1 bg-gray-25">
      <PageHeader class="z-10" :border="false">
        <Button class="text-xs" @click="openPrintSettings">
          {{ t`Settings` }}
        </Button>
        <Button class="text-xs" type="primary" @click="makePDF">
          {{ t`Save as PDF` }}
        </Button>
      </PageHeader>

      <!-- Printview Preview -->
      <div v-if="doc" class="flex justify-center flex-1 overflow-auto relative">
        <div
          class="h-full shadow mb-4 absolute bg-white"
          ref="printContainer"
        ></div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Doc } from 'fyo/model/doc';
import { Verb } from 'fyo/telemetry/types';
import { ModelNameEnum } from 'models/types';
import Button from 'src/components/Button.vue';
import PageHeader from 'src/components/PageHeader.vue';
import { fyo } from 'src/initFyo';
import { makePDF } from 'src/utils/ipcCalls';
import { getPathAndMakePDF } from 'src/utils/printTemplates';
import { openSettings } from 'src/utils/ui';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PrintView',
  props: {
    schemaName: { type: String, required: true },
    name: { type: String, required: true },
  },
  components: {
    PageHeader,
    Button,
  },
  data() {
    return {
      doc: null,
    } as { doc: null | Doc };
  },
  async mounted() {
    this.doc = await fyo.doc.getDoc(this.schemaName, this.name);

    if (fyo.store.isDevelopment) {
      // @ts-ignore
      window.pv = this;
    }
  },
  computed: {
    printTemplate() {
      return { template: '<div>Hello</div>' };
    },
  },
  methods: {
    async openPrintSettings() {
      await openSettings(ModelNameEnum.PrintSettings);
    },
    async makePDF() {
      // @ts-ignore
      const innerHTML = this.$refs.printContainer.innerHTML;
      await getPathAndMakePDF(this.name, innerHTML);
      fyo.telemetry.log(Verb.Exported, 'SalesInvoice', { extension: 'pdf' });
    },
  },
});
</script>
