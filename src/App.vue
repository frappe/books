<template>
  <div id="app" class="h-screen flex flex-col font-sans overflow-hidden">
    <WindowsTitleBar
      v-if="['Windows', 'Linux'].includes(platform)"
      @close="reloadMainWindowOnSettingsClose"
    />
    <Desk class="flex-1" v-if="showDesk" />
    <database-selector v-if="showDatabaseSelector" @file="connectToDBFile" />
    <setup-wizard v-if="showSetupWizard" />
    <Settings v-if="showSettings" />
    <portal-target name="popovers" multiple></portal-target>
  </div>
</template>

<script>
import './styles/index.css';
import 'frappe-charts/dist/frappe-charts.min.css';
import frappe from 'frappejs';
import Desk from './pages/Desk';
import SetupWizard from './pages/SetupWizard/SetupWizard';
import DatabaseSelector from './pages/DatabaseSelector';
import Settings from '@/pages/Settings/Settings.vue';
import WindowsTitleBar from '@/components/WindowsTitleBar';
import { remote } from 'electron';

export default {
  name: 'App',
  data() {
    return {
      showDatabaseSelector: false,
      showDesk: false,
      showSetupWizard: false,
      showSettings: false
    };
  },
  watch: {
    showDatabaseSelector(newValue) {
      if (newValue) {
        let win = remote.getCurrentWindow();
        win.setSize(600, 600);
        win.setResizable(false);
      }
    },
    showSetupWizard(newValue) {
      if (newValue) {
        let win = remote.getCurrentWindow();
        win.setSize(600, 600);
        win.setResizable(false);
      }
    },
    showSettings(newValue) {
      if (newValue) {
        let win = remote.getCurrentWindow();
        win.setSize(460, 577);
        win.setResizable(false);
      }
    },
    showDesk(newValue) {
      if (newValue) {
        let win = remote.getCurrentWindow();
        win.setSize(1200, 907);
        win.setResizable(true);
      }
    }
  },
  components: {
    Desk,
    SetupWizard,
    DatabaseSelector,
    Settings,
    WindowsTitleBar
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
      if (this.$route.path.startsWith('/settings')) {
        this.showSettings = true;
      } else {
        this.showDesk = true;
        this.checkForUpdates();
      }
      this.showSetupWizard = false;
      this.showDatabaseSelector = false;
    });
  },
  methods: {
    connectToDBFile(filePath) {
      frappe.events.trigger('DatabaseSelector:file-selected', filePath);
    },
    reloadMainWindowOnSettingsClose() {
      if (this.showSettings) {
        frappe.events.trigger('reload-main-window');
      }
    },
    checkForUpdates() {
      frappe.events.trigger('check-for-updates');
    }
  }
};
</script>
