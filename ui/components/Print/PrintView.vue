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
      // const win = BrowserWindow.fromWebContents()
      const win = remote.getCurrentWindow();
      const filePath = '/Users/prateekshasingh/Desktop/test';
      const extension = '.pdf';
      const data = this.printTemplate;
      const type = 'pdf';

      let mindow = new remote.BrowserWindow({
        width: 800,
        height: 600,
        center: true,
        resizable: true,
        frame: true,
        transparent: false,
      });
      mindow.setMenu(null);

      // create BrowserWindow with dynamic HTML content
      var html = [
        "",
        "<body>",
          "<h1>It works</h1>",
        "</body>",
      ].join("");
      mindow.loadURL("data:text/html;charset=utf-8," + encodeURI(this.printTemplate));

      mindow.openDevTools();
      mindow.on("closed", function() {
        mindow = null;
      });

      const writeFile = (pathname, content, extension) => {
        if (!pathname) {
          const errMsg = '[ERROR] Cannot save file without path.'
          return Promise.reject(errMsg)
        }
        pathname = !extension || pathname.endsWith(extension) ? pathname : `${pathname}${extension}`

        console.log(content);
        return fse.outputFile(pathname, content, 'utf-8')
      }

      win.webContents.printToPDF({ printBackground: false }, (err, data) => {
        if (err) log(err)
        else {
          writeFile(filePath, data, extension)
            .then(() => {
              win.webContents.send('AGANI::export-success', { type, filePath })
            })
            // .catch(log)
        }
      })

      printPDFBtn.addEventListener('click', (event) => {
        ipcRenderer.send('print-to-pdf')
      })

      ipcRenderer.on('wrote-pdf', (event, path) => {
        const message = `Wrote PDF to: ${path}`
        document.getElementById('pdf-path').innerHTML = message
      })

      ipcMain.on('print-to-pdf', (event) => {
        const pdfPath = path.join(os.tmpdir(), 'print.pdf')
        const win = BrowserWindow.fromWebContents(event.sender)
        // Use default printing options
        win.webContents.printToPDF({}, (error, data) => {
          if (error) throw error
          fs.writeFile(pdfPath, data, (error) => {
            if (error) throw error
            shell.openExternal(`file://${pdfPath}`)
            event.sender.send('wrote-pdf', pdfPath)
          })
        })
      })

      // await getPDFClient(this.doctype, this.name);
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

.print-view {}

</style>
