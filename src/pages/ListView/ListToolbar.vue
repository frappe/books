<template>
  <div class="row">
    <div class="col-6 d-flex">
      <search-input class="mr-2" @change="keyword => filterList(keyword)"/>
    </div>
    <div class="col-6 d-flex flex-row-reverse">
      <f-button primary @click="$emit('newClick')">{{ _('New {0}', listConfig.title) }}</f-button>
    </div>
  </div>
</template>
<script>
import SearchInput from '@/components/SearchInput';

export default {
  name: 'ListToolbar',
  props: ['listConfig'],
  components: {
    SearchInput
  },
  methods: {
    async newInvoice() {
      const doc = await frappe.getNewDoc('Invoice');
      this.$formModal.open(doc);
    },
    filterList(keyword) {
      frappe.listView.trigger('filterList', keyword);
    }
  }
}
</script>
