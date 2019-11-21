<template>
  <div :key="usedToReRender">
    <div
      class="mr-2 d-flex"
      v-for="filter in Object.keys(currentFilters)"
      :key="filter"
      style="user-select: none; "
    >
      <span
        class="p-0 pl-2 py-1 badge badge-light border lead d-flex align-items-center font-weight-normal"
      >
        {{ filter }} = "{{ currentFilters[filter] }}"
        <feather-icon class="mb-1 mx-2" name="x" @click.native="removeFilter(filter)" />
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ListFilters',
  props: ['filters'],
  data() {
    return {
      currentFilters: this.filters,
      usedToReRender: 0
    };
  },
  computed: {
    filterValues() {
      return this.currentFilters;
    }
  },
  methods: {
    removeFilter(filter) {
      delete this.currentFilters[filter];
      this.usedToReRender += 1;
    }
  }
};
</script>

<style scoped>
</style>
