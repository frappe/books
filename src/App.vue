<template>
  <div id="app" class="h-screen flex flex-col font-sans">
    <Desk class="flex-1" v-if="showDesk" />
    <database-selector v-if="showDatabaseSelector" @file="connectToDBFile" />
    <setup-wizard v-if="showSetupWizard" />
  </div>
</template>

<script>
import './styles/index.css';
import frappe from 'frappejs';
import Desk from './pages/Desk';
import SetupWizard from './pages/SetupWizard/SetupWizard';
import DatabaseSelector from './pages/DatabaseSelector';
import { remote } from 'electron';

export default {
  name: 'App',
  data() {
    return {
      showDatabaseSelector: false,
      showDesk: false,
      showSetupWizard: false
    };
  },
  watch: {
    showDatabaseSelector(newValue) {
      if (newValue) {
        remote.getCurrentWindow().setSize(600, 600);
      }
    },
    showSetupWizard(newValue) {
      if (newValue) {
        remote.getCurrentWindow().setSize(600, 600);
      }
    },
    showDesk(newValue) {
      if (newValue) {
        remote.getCurrentWindow().setSize(1200, 907);
      }
    },
  },
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector
  },
  mounted() {
    if (!localStorage.dbPath) {
      this.showDatabaseSelector = true;
    } else {
      frappe.events.trigger('connect-database', localStorage.dbPath);
    }

    frappe.events.on('show-setup-wizard', () => {
      this.showSetupWizard = true;
      this.showDesk = false;
      this.showDatabaseSelector = false;
    });

    frappe.events.on('show-desk', () => {
      this.showDesk = true;
      this.showSetupWizard = false;
      this.showDatabaseSelector = false;
    });
  },
  methods: {
    connectToDBFile(filePath) {
      frappe.events.trigger('DatabaseSelector:file-selected', filePath);
    }
  }
};
</script>
