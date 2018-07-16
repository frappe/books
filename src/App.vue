<template>
  <div id="app">
    <frappe-desk v-if="showDesk" :sidebarConfig="sidebarConfig">
      <router-view />
    </frappe-desk>
    <setup-wizard v-if="showSetupWizard" @complete="afterSetupWizard"/>
  </div>
</template>

<script>
import frappe from 'frappejs';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import SQLite from 'frappejs/backends/sqlite';
import postStart from '../server/postStart';
import { getSettings, saveSettings } from '../electron/settings';

import Observable from 'frappejs/utils/observable';
import Desk from 'frappejs/ui/components/Desk';
import SetupWizard from './pages/SetupWizard';
import sidebarConfig from './sidebarConfig';
import '../electron/plugins';

import importCOA from '../models/doctype/account/importCOA';
import standardChartOfAccounts from '../fixtures/standardCOA';

frappe.init();
frappe.registerLibs(common);
frappe.registerModels(coreModels);
frappe.registerModels(models);
frappe.fetch = window.fetch.bind();
frappe.isServer = true;

export default {
  name: 'App',
  data() {
    return {
      showDesk: false,
      showSetupWizard: false,
      sidebarConfig
    }
  },
  components: {
    FrappeDesk: Desk,
    SetupWizard
  },
  async created() {
    const userSettings = getSettings();

    if (!userSettings.lastDbPath) {
      this.$router.push('/setup-wizard');
      this.showSetupWizard = true;
    } else {
      await frappe.login('Administrator');
      await this.initializeDb(userSettings.lastDbPath);
      await this.loginToDesk();
    }
  },
  methods: {
    async afterSetupWizard(values) {
      await frappe.login('Administrator');
      await this.connectToDb(values);
      await this.saveAccountingSettings(values);
      await this.bootstrapChartOfAccounts();
      await this.loginToDesk();
    },

    async loginToDesk() {
      await frappe.getSingle('SystemSettings');
      await postStart();
      this.$router.push('/list/ToDo');
      this.showSetupWizard = false;
      this.showDesk = true;
    },

    async saveAccountingSettings(values) {
      const doc = await frappe.getSingle('AccountingSettings');

      if (doc.companyName) {
        return;
      }

      const {
        companyName,
        country,
        name,
        email,
        abbreviation,
        bankName,
        fiscalYearStart,
        fiscalYearEnd
      } = values;

      await doc.set({
        companyName,
        country,
        fullname: name,
        email,
        bankName,
        fiscalYearStart,
        fiscalYearEnd
      });
      await doc.update();
    },

    async bootstrapChartOfAccounts() {
      await importCOA(standardChartOfAccounts);
    },

    async connectToDb(values) {
      const { file, companyName } = values;
      const dbPath = file[0].path + '/' + frappe.slug(companyName) + '.db';

      await this.initializeDb(dbPath);
      await saveSettings({
        lastDbPath: dbPath
      });
    },

    async initializeDb(dbPath) {
      frappe.db = new SQLite({ dbPath });
      await frappe.db.connect();
      await frappe.db.migrate();
    }
  }
}
</script>

<style lang="scss">
@import "~bootstrap/scss/bootstrap";
@import '~frappe-datatable/dist/frappe-datatable';

html {
  font-size: 14px;
}

/* style fixes for issues that occur only in electron */
.frappe-desk {
  height: 100vh;
  overflow: hidden;
}

.frappe-list-form {
  height: calc(100vh - 4rem);
}

.frappe-list {
  height: 100%;
  overflow: auto;
}

.frappe-list-actions {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #fff;
}

.frappe-form {
  height: 100%;

  .p-3:nth-child(2) {
    height: 100%;
    overflow: auto;
    padding-bottom: 5rem !important;
  }
}

.flatpickr-weekdaycontainer {
  display: flex;
  flex: 1;
}

</style>
