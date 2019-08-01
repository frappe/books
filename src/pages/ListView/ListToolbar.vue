<template>
  <div class="row">
    <div class="col-6 d-flex">
      <!-- <search-bar class="mr-2" @change="keyword => filterList(keyword)" /> -->
    </div>
    <div class="col-6 d-flex flex-row-reverse">
      <f-button primary @click="$emit('newClick')">{{ _('New {0}', listConfig.title) }}</f-button>
    </div>
  </div>
</template>
<script>
import SearchBar from '@/components/SearchBar';

export default {
  name: 'ListToolbar',
  props: ['listConfig'],
  components: {
    SearchBar
  },
  methods: {
    filterList(keyword) {
      frappe.listView.trigger('filterList', keyword);
    }
  }
};
</script>
