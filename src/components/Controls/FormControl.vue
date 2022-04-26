<script>
import { h } from 'vue';
import AttachImage from './AttachImage.vue';
import AutoComplete from './AutoComplete.vue';
import Check from './Check.vue';
import Color from './Color.vue';
import Currency from './Currency.vue';
import Data from './Data.vue';
import Date from './Date.vue';
import DynamicLink from './DynamicLink.vue';
import Float from './Float.vue';
import Int from './Int.vue';
import Link from './Link.vue';
import Select from './Select.vue';
import Table from './Table.vue';
import Text from './Text.vue';

const components = {
  AttachImage,
  Data,
  Check,
  Color,
  Select,
  Link,
  Date,
  Table,
  AutoComplete,
  DynamicLink,
  Int,
  Float,
  Currency,
  Text,
};

export default {
  name: 'FormControl',
  render() {
    const fieldtype = this.$attrs.df.fieldtype;
    const component = components[fieldtype] ?? Data;

    return h(component, {
      ...this.$attrs,
      ref: 'control',
    });
  },
  methods: {
    focus() {
      this.$refs.control.focus();
    },
    getInput() {
      return this.$refs.control.$refs.input;
    },
  },
};
</script>
