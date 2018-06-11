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
import File from './File';
import Float from './Float';
import Link from './Link';
import Select from './Select';
import Table from './Table';
import Text from './Text';
import DynamicLink from './DynamicLink';

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
                File,
                Float,
                Link,
                Select,
                Table,
                Text,
                DynamicLink,
            }[this.docfield.fieldtype];
        }
    }
}
</script>
