<template>
    <component :is="component" :docfield="docfield" :value="value" @change="$emit('change', $event)"/>
</template>
<script>
import Autocomplete from './Autocomplete';
import Check from './Check';
import Code from './Code';
import Currency from './Currency';
import Data from './Data';
import Float from './Float';
import Link from './Link';
import Select from './Select';
import Text from './Text';

export default {
    props: ['docfield', 'value'],
    computed: {
        component() {
            return {
                Autocomplete,
                Check,
                Code,
                Currency,
                Data,
                Float,
                Link,
                Select,
                Text,
            }[this.docfield.fieldtype];
        }
    }
}
</script>
