<template>
    <div class="row pb-4">
        <frappe-control class="col-lg col-md-3 col-sm-6"
            v-for="docfield in filters"
            :key="docfield.fieldname"
            :docfield="docfield"
            :value="$data[docfield.fieldname]"
            @change="updateValue(docfield.fieldname, $event)"/>
    </div>
</template>
<script>
import FrappeControl from 'frappejs/ui/components/controls/FrappeControl'

export default {
    props: ['filters'],
    data () {
        const filterValues = {};
        for (let filter of this.filters) {
            filterValues[filter.fieldname] = '';
        }
        return {filterValues};
    },
    provide() {
        return {
            dynamicLinkTarget: (reference) => {
                return this.filterValues[reference]
            }
        };
    },
    methods: {
        updateValue(fieldname, value) {
            this.filterValues[fieldname] = value;
            this.$emit('change', this.filterValues)
        }
    },
    components: {
        FrappeControl
    }
}
</script>
<style>

</style>
