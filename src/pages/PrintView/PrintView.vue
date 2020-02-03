<template>
  <div class="flex">
    <div class="flex flex-col flex-1">
      <PageHeader class="bg-white z-10">
        <BackLink slot="title" />
        <template slot="actions">
          <Button
            class="text-gray-900 text-xs ml-2"
            @click="showCustomiser = !showCustomiser"
          >
            {{ _('Customise') }}
          </Button>
          <Button class="text-gray-900 text-xs ml-2" @click="makePDF">
            {{ _('Save as PDF') }}
          </Button>
        </template>
      </PageHeader>
      <div
        v-if="doc && printSettings"
        class="flex justify-center flex-1 -mt-32 overflow-auto relative"
      >
        <div
          class="h-full shadow-lg mb-12 absolute"
          style="width: 21cm; min-height: 29.7cm; height: max-content; transform: scale(0.755);"
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
        <h2 class="font-semibold">{{ _('Customise') }}</h2>
        <Button :icon="true" @click="showCustomiser = false">
          <feather-icon name="x" class="w-4 h-4" />
        </Button>
      </div>
      <TwoColumnForm class="mt-4" :doc="printSettings" :autosave="true" />
    </div>
  </div>
</template>
<script>
import frappe from 'frappejs';
import PageHeader from '@/components/PageHeader';
import SearchBar from '@/components/SearchBar';
import DropdownWithAction from '@/components/DropdownWithAction';
import Button from '@/components/Button';
import BackLink from '@/components/BackLink';
import TwoColumnForm from '@/components/TwoColumnForm';
import { makePDF } from '@/utils';
import { remote } from 'electron';

export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  components: {
    PageHeader,
    SearchBar,
    DropdownWithAction,
    Button,
    BackLink,
    TwoColumnForm
  },
  data() {
    return {
      doc: null,
      showCustomiser: false,
      printSettings: null
    };
  },
  async mounted() {
    this.doc = await frappe.getDoc(this.doctype, this.name);
    this.printSettings = await frappe.getSingle('PrintSettings');
  },
  computed: {
    meta() {
      return frappe.getMeta(this.doctype);
    },
    printTemplate() {
      return this.meta.printTemplate;
    }
  },
  methods: {
    async makePDF() {
      let destination = await this.getSavePath();
      let html = this.$refs.printContainer.innerHTML;
      makePDF(html, destination);
    },
    getSavePath() {
      return new Promise(resolve => {
        remote.dialog.showSaveDialog(
          remote.getCurrentWindow(),
          {
            title: this._('Select folder'),
            defaultPath: `${this.name}.pdf`
          },
          filePath => {
            if (filePath) {
              if (!filePath.endsWith('.pdf')) {
                filePath = filePath + '.pdf';
              }
              resolve(filePath);
            }
          }
        );
      });
    }
  }
};
</script>
