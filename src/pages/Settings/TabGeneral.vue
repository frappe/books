<template>
  <div>
    <!-- <div class="bg-blue-500 px-6 py-5 rounded-lg flex justify-between items-center">
      <div class="flex items-center">
        <div class="bg-white rounded-full w-16 h-16 flex-center">
          <svg class="w-6 h-6" viewBox="0 0 24 21" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 3h-4l-2-3H9L7 3H3a3 3 0 00-3 3v12a3 3 0 003 3h18a3 3 0 003-3V6a3 3 0 00-3-3zm-9 14a5 5 0 110-10 5 5 0 010 10z"
              fill="#B7BFC6"
              fill-rule="nonzero"
            />
          </svg>
        </div>
        <div class="flex flex-col text-white ml-4">
          <span class="text-lg font-semibold">Company Name</span>
          <span class="text-sm">Email</span>
        </div>
      </div>
      <Button class="text-xs">Edit</Button>
    </div> -->
    <TwoColumnForm v-if="doc" :doc="doc" :fields="fields" :autosave="true" />
  </div>
</template>

<script>
import frappe from 'frappejs';
import Button from '@/components/Button';
import TwoColumnForm from '@/components/TwoColumnForm';

export default {
  name: 'TabGeneral',
  components: {
    Button,
    TwoColumnForm
  },
  data() {
    return {
      doc: null
    };
  },
  async mounted() {
    this.doc = await frappe.getSingle('AccountingSettings');
  },
  computed: {
    fields() {
      let meta = frappe.getMeta('AccountingSettings');
      return [
        'companyName',
        'country',
        'bankName',
        'currency',
        'writeOffAccount',
        'roundOffAccount',
        'fiscalYearStart',
        'fiscalYearEnd'
      ].map(fieldname => meta.getField(fieldname));
    }
  }
};
</script>

