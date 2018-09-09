<template>
    <div class="frappe-list-form row no-gutters">
        <div class="col-5 border-right">
            <frappe-list :doctype="doctype" :key="doctype" :tab="tab" />
        </div>
        <div class="col-7">
            <frappe-form v-if="name" :key="doctype + name" :doctype="doctype" :name="name" />
        </div>
    </div>
</template>
<script>
import List from './Email';
import Form from './EmailReceive';

export default {
  props: ['doctype', 'name', 'tab'],
  components: {
    FrappeList: List,
    FrappeForm: Form
  },
  watch: {
    tab: async function() {
      console.log('Reached EmailListAndForm :', this.tab, this.name);
    }
  },
  methods: {
  }
};
</script>
<style>
.frappe-list-form {
  min-height: calc(100vh - 4rem);
}
</style>