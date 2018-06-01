<template>
    <component :is="component" :docfield="docfield" :value="value" @change="$emit('change', $event)"/>
</template>
<script>
import Data from './Data';
import Select from './Select';
import Text from './Text';
import Autocomplete from './Autocomplete';

export default {
    props: ['docfield', 'value'],
    computed: {
        component() {
            return {
                Data,
                Select,
                Text,
                Autocomplete,
                Link: Autocomplete
            }[this.docfield.fieldtype];
        }
    }
}
</script>
