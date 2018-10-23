<template>
  <div class="row">
    <div class="col-8 mx-auto p-5">
      <div class="row">
        <div class="col-6">
          <clickable-card
            @click="newDatabase"
            :title="_('New Database')"
            :description="_('Create a new database file and store it in your computer.')"
          />
        </div>
        <div class="col-6">
          <clickable-card
            @click="existingDatabase"
            :title="_('Existing Database')"
            :description="_('Load an existing .db file from your computer.')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import ClickableCard from '../components/ClickableCard';
const { remote } = require('electron');
const { dialog } = remote;
const currentWindow = remote.getCurrentWindow();

export default {
  name: 'DatabaseSelector',
  components: {
    ClickableCard
  },
  methods: {
    newDatabase() {
      dialog.showSaveDialog(
        currentWindow,
        {
          title: 'Select folder',
          defaultPath: 'frappe-accounting.db'
        },
        (filePath) => {
          if (filePath) {
            if (!filePath.endsWith('.db')) {
              filePath = filePath + '.db';
            }
            this.$emit('file', filePath);
          }
        }
      );
    },
    existingDatabase() {
      dialog.showOpenDialog(
        currentWindow,
        {
          title: 'Select file',
          properties: ['openFile'],
          filters: [{ name: 'SQLite DB File', extensions: ['db'] }]
        },
        (files) => {
          if (files && files[0]) {
            this.$emit('file', files[0]);
          }
        }
      );
    }
  }
};
</script>