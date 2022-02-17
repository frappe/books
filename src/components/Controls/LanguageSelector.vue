<template>
  <FormControl
    :df="languageDf"
    :value="value"
    @change="setLanguageMap"
    :input-class="'focus:outline-none rounded '+inputClass"
  />
</template>
<script>
import config from '@/config';
import { languageCodeMap } from '@/languageCodeMap';
import { setLanguageMap } from '@/utils';
import { DEFAULT_LANGUAGE } from 'frappe/utils/consts';
import FormControl from './FormControl';

export default {
  methods: {
    setLanguageMap,
  },
  props: {
    inputClass: {
      type: String,
      default:
        'bg-gray-100 active:bg-gray-200 focus:bg-gray-200 px-3 py-2 text-base',
    },
  },
  components: { FormControl },
  computed: {
    value() {
      return config.get('language') ?? DEFAULT_LANGUAGE;
    },
    languageDf() {
      languageCodeMap;
      return {
        fieldname: 'language',
        label: this.t`Language`,
        fieldtype: 'Select',
        options: Object.keys(languageCodeMap),
        default: config.get('language') ?? DEFAULT_LANGUAGE,
        description: this.t`Set the display language.`,
      };
    },
  },
};
</script>
