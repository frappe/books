<template>
  <div class="d-flex mt-2">
    <div style="flex: 1;">
      <list-filters :filters="filters"></list-filters>
    </div>
    <div class="d-flex flex-column-reverse" style="padding-bottom: 1rem;">
      <f-button primary @click="$emit('newClick')">{{ _('New {0}', title) }}</f-button>
    </div>
  </div>
</template>
<script>
import ListFilters from './ListFilters';

export default {
  name: 'ListToolbar',
  props: ['title', 'filters'],
  components: {
    ListFilters
  }
};
</script>


