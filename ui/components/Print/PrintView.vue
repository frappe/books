<template>
  <div class="print-view">
    <print-actions
      v-bind:title="name"
      @view-form="viewForm"
      @pdf="getPDF"
    ></print-actions>
    <div class="print-container">
      <div class="print-template" v-html="printTemplate"></div>
    </div>
  </div>
</template>

<script>
import { getHTML } from '../../../common/print.js';
import PrintActions from './PrintActions';

// for PDF in Electron
import { BrowserWindow, remote, ipcMain, ipcRenderer, shell } from 'electron'
import fs from 'fs';

export default {
  name: 'PrintView',
  props: ['doctype', 'name'],
  data() {
    return {
      printTemplate: '',
    }
  },
  components: {
    PrintActions: PrintActions
  },
  async created(vm) {
    this.printTemplate = await getHTML(this.doctype, this.name);
  },
  methods: {
    viewForm() {
      this.$router.push(`/edit/${this.doctype}/${this.name}`);
    },

    getPDF() {
      // Open a hidden window
      let printWindow = new remote.BrowserWindow(
        // { show: false }
      );

      printWindow.loadURL(
        "data:text/html;charset=utf-8," + encodeURI(this.printTemplate)
      );

      printWindow.on("closed", () => {
        printWindow = null;
      });

      // const pdfPath = path.join(os.tmpdir(), 'print.pdf')
      const pdfPath = '/Users/prateekshasingh/Desktop/print.pdf';

      // Use default printing options
      printWindow.webContents.printToPDF({}, (error, data) => {
        if (error) throw error;
        // printWindow.close();
        fs.writeFile(pdfPath, data, (error) => {
          if (error) throw error;
          shell.openExternal(`file://${pdfPath}`);
        })
      });
    }
  }
}
</script>

<style lang="scss">
@import "../../styles/variables";

.print-container {
  padding: 1rem 5rem;
}

.print-template {
  padding: 1rem;
  background-color: $white;
  box-shadow: 0rem 0rem 0.5rem rgba(0,0,0,0.2);
}

</style>
