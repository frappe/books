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

export default {
  name: 'FormControl',
  render() {
    let controls = {
      Data,
      Select,
      Link,
      Date,
      Table,
      AutoComplete,
      Check,
      AttachImage,
      DynamicLink,
      Int,
      Float,
      Currency,
      Text,
      Color,
    };
    let { df } = this.$attrs;
    return h(controls[df.fieldtype] || Data, {
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
