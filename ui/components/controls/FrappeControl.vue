<template>
    <component :is="component"
        :docfield="docfield"
        :value="value"
        :onlyInput="onlyInput"
        @change="$emit('change', $event)"
    />
</template>
<script>
import Autocomplete from './Autocomplete';
import Check from './Check';
import Code from './Code';
import Currency from './Currency';
import Data from './Data';
import Date from './Date';
import DynamicLink from './DynamicLink';
import File from './File';
import Float from './Float';
import Int from './Int';
import Link from './Link';
import Password from './Password';
import Select from './Select';
import Table from './Table';
import Text from './Text';
import Time from './Time'

export default {
    props: ['docfield', 'value', 'onlyInput'],
    computed: {
        component() {
            return {
                Autocomplete,
                Check,
                Code,
                Currency,
                Data,
                Date,
                DynamicLink,
                File,
                Float,
                Int,
                Link,
                Password,
                Select,
                Table,
                Text,
                Time,
            }[this.docfield.fieldtype];
        }
    }
}
</script>
