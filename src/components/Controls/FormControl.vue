<script>
import { h } from 'vue';
import AttachImage from './AttachImage';
import AutoComplete from './AutoComplete';
import Check from './Check';
import Color from './Color';
import Currency from './Currency';
import Data from './Data';
import Date from './Date';
import DynamicLink from './DynamicLink';
import Float from './Float';
import Int from './Int';
import Link from './Link';
import Select from './Select';
import Table from './Table';
import Text from './Text';

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
