<script>
import { h } from 'vue';
import AttachImage from './AttachImage.vue';
import Attachment from './Attachment.vue';
import AutoComplete from './AutoComplete.vue';
import Check from './Check.vue';
import Button from './Button.vue';
import Color from './Color.vue';
import Currency from './Currency.vue';
import Data from './Data.vue';
import Date from './Date.vue';
import Datetime from './Datetime.vue';
import DynamicLink from './DynamicLink.vue';
import Float from './Float.vue';
import Int from './Int.vue';
import Link from './Link.vue';
import Select from './Select.vue';
import Text from './Text.vue';
import Secret from './Secret.vue';

const components = {
  AttachImage,
  Data,
  Check,
  Button,
  Color,
  Select,
  Link,
  Date,
  Datetime,
  AutoComplete,
  DynamicLink,
  Int,
  Float,
  Attachment,
  Currency,
  Text,
  Secret,
};

export default {
  name: 'FormControl',
  methods: {
    clear() {
      const input = this.$refs.control.$refs.input;
      if (input instanceof HTMLInputElement) {
        input.value = '';
      }
    },
    select() {
      this.$refs.control.$refs?.input?.select();
    },
    focus() {
      this.$refs.control.focus();
    },
    getInput() {
      return this.$refs.control.$refs.input;
    },
  },
  render() {
    const fieldtype = this.$attrs.df.fieldtype;
    const component = components[fieldtype] ?? Data;

    return h(component, {
      ...this.$attrs,
      ref: 'control',
    });
  },
};
</script>
