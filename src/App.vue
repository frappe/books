<template>
  <div id="app">
    <frappe-desk>
      <router-view :key="$route.path" />
    </frappe-desk>
  </div>
</template>

<script>
import frappe from 'frappejs';
import HTTPClient from 'frappejs/backends/http';
import Observable from 'frappejs/utils/observable';
import common from 'frappejs/common';
import coreModels from 'frappejs/models';
import models from '../models';
import io from 'socket.io-client';
import Desk from '@/components/Desk';

frappe.init();
frappe.registerLibs(common);
frappe.registerModels(coreModels);
frappe.registerModels(models);
const server = 'localhost:8000';
frappe.fetch = window.fetch.bind();
frappe.db = new HTTPClient({ server });
const socket = io.connect(`http://${server}`);
frappe.db.bindSocketClient(socket);
frappe.registerModels(models);
frappe.docs = new Observable();
frappe.getSingle('SystemSettings');

window.frappe = frappe;

export default {
  name: 'App',
  components: {
    FrappeDesk: Desk
  }
}
</script>

<style lang="scss">
@import "~bootstrap/scss/bootstrap";

html {
  font-size: 14px;
}

</style>
