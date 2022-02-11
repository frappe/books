import Data from './Data';
import Select from './Select';
import Link from './Link';
import Date from './Date';
import Table from './Table';
import AutoComplete from './AutoComplete';
import Check from './Check';
import AttachImage from './AttachImage';
import DynamicLink from './DynamicLink';
import Int from './Int';
import Float from './Float';
import Currency from './Currency';
import Text from './Text';
import Color from './Color';
import { h } from 'vue';

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
