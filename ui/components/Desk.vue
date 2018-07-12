<template>
    <div class="frappe-desk row no-gutters">
        <frappe-sidebar :sidebarConfig="sidebarConfig"></frappe-sidebar>
        <frappe-main>
          <frappe-navbar></frappe-navbar>
          <slot></slot>
        </frappe-main>
    </div>
</template>
<script>
import Sidebar from './Sidebar';
import Main from './Main';
import Navbar from './Navbar';

export default {
  props: ['sidebarConfig'],
  components: {
    FrappeSidebar: Sidebar,
    FrappeMain: Main,
    FrappeNavbar: Navbar
  },
};
</script>
<style>
</style>
