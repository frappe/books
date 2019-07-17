<template>
  <div class="row pb-4">
    <frappe-control
      class="col-3"
      v-for="docfield in filters"
      :key="docfield.fieldname"
      :docfield="docfield"
      :value="$data.filterValues[docfield.fieldname]"
      :doc="$data.filterValues"
      @change="updateValue(docfield.fieldname, $event)"
    />
  </div>
</template>
<script>
import FrappeControl from 'frappejs/ui/components/controls/FrappeControl';

export default {
  props: ['filters', 'filterDefaults'],
  data() {
    const filterValues = {};
    for (let filter of this.filters) {
      filterValues[filter.fieldname] =
        this.filterDefaults[filter.fieldname] || null;
    }
    return { filterValues };
  },
  created() {
    const hasOnloadFilters = Object.values(this.filterValues).filter(
      value => value !== null
    ).length;

    if (hasOnloadFilters) {
      this.$emit('change', this.filterValues);
    }
  },
  methods: {
    updateValue(fieldname, value) {
      this.filterValues[fieldname] = value;
      this.$emit('change', this.filterValues);
    }
  },
  components: {
    FrappeControl
  }
};
</script>
<style>
</style>
