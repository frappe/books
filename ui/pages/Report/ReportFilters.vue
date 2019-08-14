<template>
  <div class="d-flex px-1">
    <div class="col-3" v-for="docfield in filterFields" :key="docfield.fieldname">
      <frappe-control
        v-if="shouldRenderField(docfield)"
        :docfield="docfield"
        :value="$data.filterValues[docfield.fieldname]"
        :onlyInput="true"
        :doc="filterDoc"
        @change="updateValue(docfield.fieldname, $event)"
        class="mb-4"
      />
    </div>
  </div>
</template>
<script>
import FrappeControl from 'frappejs/ui/components/controls/FrappeControl';

export default {
  props: ['filterFields', 'filterDoc', 'filterDefaults'],
  data() {
    const filterValues = {};
    for (let filter of this.filterFields) {
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
    shouldRenderField(field) {
      let hidden;
      try {
        hidden = Boolean(field.hidden(this.filterDoc));
      } catch (e) {
        hidden = Boolean(field.hidden) || false;
      }

      if (hidden) {
        return false;
      }

      return true;
    },
    updateValue(fieldname, value) {
      this.filterDoc.set(fieldname, value);
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
